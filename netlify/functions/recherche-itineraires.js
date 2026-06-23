/**
 * ORT - Recherche conversationnelle (Netlify Function)
 * Flux a deux etages :
 *   1) IA parse la phrase libre -> criteres (depart, heures max, mois, soleil, public, themes)
 *   2) Geocodage du depart (Photon) + tri SANS IA (distance vers point d'arrivee + mois)
 *   3) IA classe et explique la dizaine restante
 * IA en cascade : Gemini Flash -> Groq -> OpenRouter (modeles gratuits), comme parse-summary.
 *
 * Entree  (POST) : { "query": "phrase libre du visiteur", "lang": "fr" }
 * Sortie         : { success, criteres, results:[{id,slug,title,country,days,heures_vol,raison}] }
 */

const SITE = 'https://www.oneroadtrip.com';
const LANG_FOLDERS = { fr: 'itineraires', en: 'itineraries', es: 'rutas', it: 'itinerari', pt: 'roteiros', ar: 'masar' };
const UA = 'OneRoadTrip/2.0 (https://oneroadtrip.com)';

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const GROQ_KEY = process.env.GROQ_API_KEY;
const GROQ_MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

// ===== CACHE CATALOGUE (memoire chaude) =====
const catCache = new Map(); // lang -> { rows, ts }
const CAT_TTL = 30 * 60 * 1000;

async function loadCatalog(lang, origin) {
  const base = origin || SITE;
  const key = base + '|' + lang;
  const hit = catCache.get(key);
  if (hit && Date.now() - hit.ts < CAT_TTL) return hit.rows;
  const folder = LANG_FOLDERS[lang] || LANG_FOLDERS.fr;
  const url = `${base}/${folder}/search-catalog-${lang}.json`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`catalogue ${lang} introuvable (${res.status})`);
  const rows = await res.json();
  catCache.set(key, { rows, ts: Date.now() });
  return rows;
}

// ===== GEO =====
function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim(); }

// Distance a vol d'oiseau en km (Haversine).
function haversineKm(aLat, aLon, bLat, bLon) {
  const R = 6371, toRad = x => x * Math.PI / 180;
  const dLat = toRad(bLat - aLat), dLon = toRad(bLon - aLon);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
// Estimation d'un temps de vol DIRECT (approx) : 1h30 fixe (taxi/montee/descente) + croisiere ~750 km/h.
// C'est un ordre de grandeur pour le tri, pas un horaire reel (une escale rallonge).
function heuresVolApprox(km) { return 1.5 + km / 750; }

// Geocode une ville via Photon (meme source que citysearch).
async function geocodeVille(query, lang) {
  if (!query) return null;
  const params = new URLSearchParams({ q: query, limit: '1', lang: lang || 'fr' });
  try {
    const res = await fetch(`https://photon.komoot.io/api/?${params}`, { headers: { 'User-Agent': UA } });
    if (!res.ok) return null;
    const data = await res.json();
    const f = (data.features || [])[0];
    const c = f && f.geometry && f.geometry.coordinates;
    if (!c || c.length < 2) return null;
    return { lat: c[1], lon: c[0], nom: (f.properties && f.properties.name) || query };
  } catch { return null; }
}

// ===== IA : cascade =====
function parseAiJson(text) {
  let t = String(text || '').trim().replace(/```json|```/g, '').trim();
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  const a2 = t.indexOf('['), b2 = t.lastIndexOf(']');
  if (a2 >= 0 && (a < 0 || a2 < a)) return JSON.parse(t.slice(a2, b2 + 1));
  return JSON.parse(t.slice(a, b + 1));
}

async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;
  const res = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.4, responseMimeType: 'application/json' } })
  });
  if (!res.ok) throw new Error('gemini ' + res.status);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('gemini vide');
  return parseAiJson(text);
}
async function callGroq(prompt) {
  for (const model of GROQ_MODELS) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST', headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], temperature: 0.4, max_tokens: 2000, response_format: { type: 'json_object' } })
      });
      if (!res.ok) continue;
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (text) return parseAiJson(text);
    } catch { /* modele suivant */ }
  }
  throw new Error('groq echec');
}
async function callOpenRouter(prompt) {
  const models = ['meta-llama/llama-3.1-8b-instruct:free', 'mistralai/mistral-7b-instruct:free', 'google/gemma-2-9b-it:free'];
  for (const model of models) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST', headers: { 'Authorization': `Bearer ${OPENROUTER_KEY}`, 'Content-Type': 'application/json', 'HTTP-Referer': SITE },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], temperature: 0.4, max_tokens: 2000 })
      });
      if (!res.ok) continue;
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (text) return parseAiJson(text);
    } catch { /* modele suivant */ }
  }
  throw new Error('openrouter echec');
}
async function askAi(prompt) {
  if (GEMINI_KEY) { try { return await callGemini(prompt); } catch (e) { console.warn('gemini:', e.message); } }
  if (GROQ_KEY) { try { return await callGroq(prompt); } catch (e) { console.warn('groq:', e.message); } }
  if (OPENROUTER_KEY) { try { return await callOpenRouter(prompt); } catch (e) { console.warn('or:', e.message); } }
  throw new Error('aucune IA disponible');
}

// ===== ETAGE 1 : phrase -> criteres =====
function promptParse(query, lang, themesDispo) {
  return `Tu analyses une demande de voyage. Reponds UNIQUEMENT en JSON (pas de texte, pas de backticks).
Format exact : {"depart":"ville ou null","max_heures_vol":nombre ou null,"mois":["fevrier"] ou [],"soleil":true/false/null,"public":"famille|couple|solo|amis|null","themes":[] ,"duree_max_jours":nombre ou null}
Pour "themes", choisis 0 a 2 valeurs EXACTEMENT dans cette liste (recopie le libelle a l'identique), selon la demande : ${JSON.stringify(themesDispo)}.
Exemple : "a la mer", "plage", "baignade" -> le theme de cote/mer de la liste. "rando", "montagne" -> le theme montagne. Si rien de clair, mets [].
Regles : "max_heures_vol" = nombre d'heures si un temps de trajet/vol est donne, sinon null. "mois" en minuscules sans accent, dans la langue ${lang}. Ne devine pas ce qui n'est pas dit (null ou []).
Demande : "${query}"`;
}

// ===== ETAGE 2 (sans IA) : geo + filtres =====
function trier(rows, crit, depart) {
  const moisVoulus = (crit.mois || []).map(norm);
  let out = rows.map(r => {
    let heures = null;
    if (depart && Array.isArray(r.arrival) && r.arrival.length >= 2) {
      heures = heuresVolApprox(haversineKm(depart.lat, depart.lon, r.arrival[0], r.arrival[1]));
    }
    return { r, heures };
  });
  // Filtre distance (si on a un depart et un plafond d'heures)
  if (depart && crit.max_heures_vol) out = out.filter(x => x.heures != null && x.heures <= crit.max_heures_vol);
  // Filtre mois : on garde si le mois colle OU si l'itin n'a pas de mois renseigne (l'IA tranchera)
  if (moisVoulus.length) {
    out = out.filter(x => {
      const m = (x.r.months || []).map(norm);
      return m.length === 0 || moisVoulus.some(v => m.includes(v));
    });
  }
  // Filtre themes : si la demande cible des themes, on ne garde que les itins qui en portent au moins un.
  // Filtre fiable (themes remplis a 100%). Si ca vide tout, on relache pour ne pas renvoyer une page blanche.
  const themesVoulus = (crit.themes || []).filter(Boolean);
  if (themesVoulus.length) {
    const filtre = out.filter(x => (x.r.themes || []).some(t => themesVoulus.includes(t)));
    if (filtre.length) out = filtre;
  }
  // Filtre duree
  if (crit.duree_max_jours) out = out.filter(x => !x.r.days || x.r.days <= crit.duree_max_jours);
  // Tri : par proximite si depart, sinon par nombre de mois qui collent
  out.sort((a, b) => (a.heures ?? 1e9) - (b.heures ?? 1e9));
  // On envoie une liste large a l'IA (pas seulement les plus proches) : sinon, pour une demande
  // "soleil/plage", les itins de montagne plus proches evinceraient les plages un peu plus loin.
  return out.slice(0, 25);
}

// ===== ETAGE 3 : classer/expliquer la liste courte =====
function promptClasser(query, crit, courte, lang) {
  const compact = courte.map(x => ({
    id: x.r.id, titre: x.r.title, sous_titre: x.r.subtitle || '', pays: x.r.country, jours: x.r.days,
    themes: x.r.themes, public: x.r.audience, climat: (x.r.climate || '').slice(0, 160),
    mots_cles: (x.r.keywords || []).slice(0, 6),
    heures_vol: x.heures != null ? Math.round(x.heures * 10) / 10 : null
  }));
  return `Tu es un conseiller voyage. Voici la demande et une liste presaisie d'itineraires deja filtres par distance et saison.
Demande : "${query}"
Criteres compris : ${JSON.stringify(crit)}
Itineraires : ${JSON.stringify(compact)}
Garde uniquement ceux qui collent VRAIMENT a la demande (soleil/plage/public via le climat et les themes). Classe du meilleur au moins bon.
Reponds UNIQUEMENT en JSON (pas de texte, pas de backticks), langue ${lang} :
[{"id":"...","raison":"une phrase courte expliquant pourquoi ca colle"}]`;
}

// ===== HANDLER =====
export default async (request, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8'
  };
  if (request.method === 'OPTIONS') return new Response('', { status: 204, headers });
  if (request.method !== 'POST') return new Response(JSON.stringify({ success: false, error: 'method' }), { status: 405, headers });

  try {
    const body = await request.json();
    const query = (body.query || '').trim();
    const lang = (body.lang || 'fr').toLowerCase();
    if (!query) return new Response(JSON.stringify({ success: false, error: 'query vide' }), { status: 400, headers });

    // Catalogue charge en premier : on en extrait la liste exacte des themes (deja dans la bonne langue)
    const origin = (() => { try { return new URL(request.url).origin; } catch { return SITE; } })();
    const rows = await loadCatalog(lang, origin);
    const themesDispo = [...new Set(rows.flatMap(r => r.themes || []))].sort();

    // Etage 1 : phrase -> criteres (les themes sont choisis PARMI ceux du catalogue)
    let crit;
    try { crit = await askAi(promptParse(query, lang, themesDispo)); }
    catch (e) { return new Response(JSON.stringify({ success: false, error: 'ia_parse', message: e.message }), { status: 503, headers }); }

    // Geocodage du depart (sans IA)
    const depart = crit.depart ? await geocodeVille(crit.depart, lang) : null;

    // Etage 2 : tri sans IA (distance + mois + themes)
    const courte = trier(rows, crit, depart);
    if (!courte.length) {
      return new Response(JSON.stringify({ success: true, criteres: crit, depart, results: [], message: 'aucun itineraire dans ces criteres' }), { status: 200, headers });
    }

    // Etage 3 : classement IA sur la liste courte
    let classe = [];
    try { classe = await askAi(promptClasser(query, crit, courte, lang)); }
    catch (e) { console.warn('classement:', e.message); }
    // L'IA peut repondre par un tableau, ou un objet {results:[...]} : on recupere le tableau dans tous les cas
    if (!Array.isArray(classe)) {
      const arr = classe && typeof classe === 'object' ? Object.values(classe).find(v => Array.isArray(v)) : null;
      classe = arr || [];
    }

    // Fusion : on garde l'ordre et la selection de l'IA si dispo, sinon le tri par distance
    const parId = new Map(courte.map(x => [x.r.id, x]));
    const ordre = (classe.length ? classe : courte.map(x => ({ id: x.r.id, raison: '' })));
    const results = ordre
      .map(o => { const x = parId.get(o.id); return x ? { id: x.r.id, slug: x.r.slug, title: x.r.title, country: x.r.country, days: x.r.days, heures_vol: x.heures != null ? Math.round(x.heures * 10) / 10 : null, raison: o.raison || '' } : null; })
      .filter(Boolean);

    return new Response(JSON.stringify({ success: true, criteres: crit, depart, results }), { status: 200, headers });

  } catch (e) {
    console.error('search:', e.message);
    return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers });
  }
};
