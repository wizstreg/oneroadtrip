/**
 * ORT - Parse Summary (Netlify Function)
 * AI: Gemini Flash → fallback OpenRouter (free text models)
 * 
 * Cache:
 *   catalog_summaries/{sanitized_originalItinId} — PUBLIC read, shared
 *   Example key: "LK__sri-lanka__triangle-culturel-plages"
 * 
 * Two modes:
 *   POST cacheOnly=true  → public read, no auth needed
 *   POST cacheOnly=false → auth + quota + generate
 */

import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({ credential: admin.credential.cert(sa), projectId: process.env.ORT_FB_PROJECTID });
  } catch (e) {
    admin.initializeApp({ projectId: process.env.ORT_FB_PROJECTID });
  }
}
const db = admin.firestore();

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const GROQ_KEY = process.env.GROQ_API_KEY;
const GROQ_MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
const MONTHLY_LIMIT = parseInt(process.env.SUMMARY_MONTHLY_LIMIT || '1', 10);
const VIP = ['bWFyY3NvcmNpQGZyZWUuZnI='];

// ===== HELPERS =====
// "LK::sri-lanka::triangle-culturel-plages" → "LK__sri-lanka__triangle-culturel-plages"
function sanitizeDocId(id) {
  if (!id) return '';
  return id.replace(/::/g, '__').replace(/[\/\\]/g, '_').substring(0, 200);
}

// Strip language suffix: "triangle-culturel-plages-fr" → "triangle-culturel-plages"
function stripLangSuffix(id) {
  if (!id) return '';
  return id.replace(/-(fr|en|es|it|pt|ar)$/i, '');
}

// Build the cache key from catalogId (the _originalItinId) + language
function buildCacheKey(catalogId, lang) {
  if (!catalogId) return null;
  return sanitizeDocId(stripLangSuffix(catalogId)) + (lang ? `_${lang}` : '');
}

// ===== AUTH =====
async function verifyToken(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) return null;
  try { return await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]); }
  catch { return null; }
}

// ===== QUOTA =====
async function checkQuota(uid, email) {
  if (email && VIP.includes(Buffer.from(email).toString('base64'))) {
    return { allowed: true, count: 0, limit: 9999, remaining: 9999 };
  }
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const ref = db.collection('users').doc(uid).collection('summary_usage').doc(month);
  const doc = await ref.get();
  let data = doc.exists ? doc.data() : { count: 0, month };
  if (data.count >= MONTHLY_LIMIT) {
    return { allowed: false, error: 'monthly_quota', count: data.count, limit: MONTHLY_LIMIT, remaining: 0 };
  }
  data.count++;
  await ref.set(data);
  return { allowed: true, count: data.count, limit: MONTHLY_LIMIT, remaining: MONTHLY_LIMIT - data.count };
}

// ===== CACHE =====
async function findCachedSummary(cacheKey, tripKey) {
  var keys = [cacheKey, tripKey].filter(Boolean);
  for (var k of keys) {
    try {
      const doc = await db.collection('catalog_summaries').doc(k).get();
      if (doc.exists && doc.data().review && doc.data().steps) {
        console.log(`✅ Cache hit: ${k}`);
        return doc.data();
      }
    } catch (e) { console.warn('Cache read:', e.message); }
  }
  return null;
}

async function saveSummary(cacheKey, tripKey, data, language, model) {
  var payload = { ...data, cacheKey, language, model, createdAt: admin.firestore.FieldValue.serverTimestamp() };
  // Save under catalog key (primary)
  if (cacheKey) {
    try {
      await db.collection('catalog_summaries').doc(cacheKey).set(payload);
      console.log(`💾 Saved: catalog_summaries/${cacheKey}`);
    } catch (e) { console.warn('Save catalog:', e.message); }
  }
  // Also save under tripId key (alias for mobile lookup)
  if (tripKey && tripKey !== cacheKey) {
    try {
      await db.collection('catalog_summaries').doc(tripKey).set(payload);
      console.log(`💾 Saved alias: catalog_summaries/${tripKey}`);
    } catch (e) { console.warn('Save alias:', e.message); }
  }
}

// ===== BUILD STEPS TEXT =====
const STEP_LABELS = {
  nl: { day: 'Dag', passage: 'Doorreis', visits: 'Bezienswaardigheden', activities: 'Activiteiten', info: 'Info', step: 'Stop', night: 'nacht', nights: 'nachten', via: 'via', trajet: 'Traject', car: 'met de auto', flight: 'PER VLIEGTUIG', scenic: 'panoramische route', noNight: 'Te zien zonder overnachting (zelfde accommodatie)' },
  de: { day: 'Tag', passage: 'Durchfahrt', visits: 'Sehenswürdigkeiten', activities: 'Aktivitäten', info: 'Info', step: 'Etappe', night: 'Nacht', nights: 'Nächte', via: 'über', trajet: 'Abschnitt', car: 'mit dem Auto', flight: 'PER FLUGZEUG', scenic: 'Panoramastraße', noNight: 'Sehenswert ohne Übernachtung (gleiche Unterkunft)' },
  fr: { day: 'Jour', passage: 'Passage', visits: 'Visites', activities: 'Activités', info: 'Info', step: 'Étape', night: 'nuit', nights: 'nuits', via: 'via', trajet: 'Trajet', car: 'en voiture', flight: 'EN AVION', scenic: 'route panoramique', noNight: 'À voir sans nuit (même hébergement)' },
  en: { day: 'Day', passage: 'Pass-through', visits: 'Visits', activities: 'Activities', info: 'Info', step: 'Stop', night: 'night', nights: 'nights', via: 'via', trajet: 'Leg', car: 'by car', flight: 'BY PLANE', scenic: 'scenic road', noNight: 'Day visits (same lodging)' },
  es: { day: 'Día', passage: 'Paso', visits: 'Visitas', activities: 'Actividades', info: 'Info', step: 'Etapa', night: 'noche', nights: 'noches', via: 'vía', trajet: 'Trayecto', car: 'en coche', flight: 'EN AVIÓN', scenic: 'ruta panorámica', noNight: 'Visitas sin noche (mismo alojamiento)' },
  it: { day: 'Giorno', passage: 'Passaggio', visits: 'Visite', activities: 'Attività', info: 'Info', step: 'Tappa', night: 'notte', nights: 'notti', via: 'via', trajet: 'Tragitto', car: 'in auto', flight: 'IN AEREO', scenic: 'strada panoramica', noNight: 'Visite senza pernottamento (stesso alloggio)' },
  pt: { day: 'Dia', passage: 'Passagem', visits: 'Visitas', activities: 'Atividades', info: 'Info', step: 'Etapa', night: 'noite', nights: 'noites', via: 'via', trajet: 'Trajeto', car: 'de carro', flight: 'DE AVIÃO', scenic: 'estrada panorâmica', noNight: 'Visitas sem noite (mesmo alojamento)' },
  ar: { day: 'يوم', passage: 'عبور', visits: 'زيارات', activities: 'أنشطة', info: 'معلومات', step: 'مرحلة', night: 'ليلة', nights: 'ليالٍ', via: 'عبر', trajet: 'المسافة', car: 'بالسيارة', flight: 'بالطائرة', scenic: 'طريق ذو مناظر خلابة', noNight: 'زيارات دون مبيت (نفس مكان الإقامة)' }
};

// Trip header: anchors the AI on NIGHTS, not on the number of places.
const TRIP_HEADER = {
  nl: (n, b) => `LEESREGEL: werkelijke duur = ${n} nacht${n > 1 ? 'en' : ''} verdeeld over ${b} accommodatie${b > 1 ? 's' : ''}. Het AANTAL PLAATSEN is NIET het aantal dagen. Plaatsen "zonder overnachting" zijn bezoeken vanuit de huidige accommodatie, geen hotelwissels. Beoordeel de haalbaarheid NOOIT op basis van het aantal plaatsen.`,
  de: (n, b) => `LESEREGEL: tatsächliche Dauer = ${n} Nacht${n > 1 ? 'e' : ''} in ${b} Unterkun${b > 1 ? 'ften' : 'ft'}. Die ANZAHL DER ORTE ist NICHT die Anzahl der Tage. Orte "ohne Übernachtung" sind Ausflüge von der aktuellen Unterkunft aus, kein Hotelwechsel. Beurteile die Machbarkeit NIEMALS anhand der Anzahl der Orte.`,
  fr: (n, b) => `RÈGLE DE LECTURE: durée réelle = ${n} nuit${n > 1 ? 's' : ''} sur ${b} hébergement${b > 1 ? 's' : ''}. Le NOMBRE DE LIEUX n'est PAS le nombre de jours. Les lieux "sans nuit" sont des visites depuis l'hébergement du moment, pas des changements d'hôtel. Ne juge JAMAIS la faisabilité au nombre de lieux.`,
  en: (n, b) => `READING RULE: real duration = ${n} night${n > 1 ? 's' : ''} across ${b} lodging${b > 1 ? 's' : ''}. The NUMBER OF PLACES is NOT the number of days. "No-night" places are visits from the current lodging, not hotel changes. NEVER judge feasibility by the number of places.`,
  es: (n, b) => `REGLA DE LECTURA: duración real = ${n} noche${n > 1 ? 's' : ''} en ${b} alojamiento${b > 1 ? 's' : ''}. El NÚMERO DE LUGARES NO es el número de días. Los lugares "sin noche" son visitas desde el alojamiento actual, no cambios de hotel. NUNCA juzgues la viabilidad por el número de lugares.`,
  it: (n, b) => `REGOLA DI LETTURA: durata reale = ${n} nott${n > 1 ? 'i' : 'e'} su ${b} allogg${b > 1 ? 'i' : 'io'}. Il NUMERO DI LUOGHI NON è il numero di giorni. I luoghi "senza pernottamento" sono visite dall'alloggio attuale, non cambi di hotel. Non giudicare MAI la fattibilità dal numero di luoghi.`,
  pt: (n, b) => `REGRA DE LEITURA: duração real = ${n} noite${n > 1 ? 's' : ''} em ${b} alojamento${b > 1 ? 's' : ''}. O NÚMERO DE LOCAIS NÃO é o número de dias. Os locais "sem noite" são visitas a partir do alojamento atual, não mudanças de hotel. NUNCA julgue a viabilidade pelo número de locais.`,
  ar: (n, b) => `قاعدة القراءة: المدة الحقيقية = ${n} ليالٍ في ${b} أماكن إقامة. عدد الأماكن ليس عدد الأيام. الأماكن "دون مبيت" هي زيارات من مكان الإقامة الحالي وليست تغييراً للفندق. لا تحكم أبداً على الجدوى بعدد الأماكن.`
};

// Format duration in minutes → "1h30" / "45 min"
function fmtDur(min) {
  if (!min || min <= 0) return '';
  if (min >= 60) { const h = Math.floor(min / 60), m = min % 60; return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`; }
  return `${min} min`;
}

// Transport text for the leg LEAVING a step. Flight is detected via _roadType ONLY
// (_transportMode stays 'car' even on flight legs — do not rely on it).
function legText(s, L) {
  const road = s._roadType || '';
  const km = s._distanceKmToNext;
  const min = s._driveMinToNext;
  if (!km && !min) return '';
  let label;
  if (road === 'flight') label = L.flight;
  else if (road === 'scenic_road') label = L.scenic;
  else label = L.car;
  const parts = [];
  if (km) parts.push(`${km} km`);
  const d = fmtDur(min); if (d) parts.push(d);
  return `${label}${parts.length ? ', ' + parts.join(', ') : ''}`;
}

function buildStepsText(steps, lang) {
  const L = STEP_LABELS[lang] || STEP_LABELS.en;
  let day = 0;
  // First pass: collect passages to attach to previous step's leg
  const pendingPassages = []; // { name, leg } grouped after each overnight step
  const processed = [];

  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    const n = s.nights || 0;
    if (n === 0) {
      // Passage step — keep its name, its visits/activities AND its own transport leg
      const pv = (Array.isArray(s.visits) ? s.visits.map(v => typeof v === 'string' ? v : v.text).filter(Boolean) : []);
      const pa = (Array.isArray(s.activities) ? s.activities.map(a => typeof a === 'string' ? a : a.text).filter(Boolean) : []);
      pendingPassages.push({
        name: s.name || `${L.step} ${i + 1}`,
        leg: legText(s, L),
        visits: pv,
        activities: pa,
        description: s.description || ''
      });
    } else {
      // Overnight step
      day++;
      const dayStart = day;
      const dayEnd = day + n - 1;
      const dayLabel = n > 1 ? `${L.day} ${dayStart}-${dayEnd}` : `${L.day} ${dayStart}`;
      day = dayEnd;

      const vis = (Array.isArray(s.visits) ? s.visits.map(v => typeof v === 'string' ? v : v.text).filter(Boolean) : []);
      const act = (Array.isArray(s.activities) ? s.activities.map(a => typeof a === 'string' ? a : a.text).filter(Boolean) : []);
      let t = `${s.name || L.step + ' ' + (i + 1)} (${n} ${n > 1 ? L.nights : L.night})`;
      if (vis.length) t += `\n  ${L.visits}: ${vis.join(' | ')}`;
      if (act.length) t += `\n  ${L.activities}: ${act.join(' | ')}`;
      if (s.description) t += `\n  ${L.info}: ${s.description}`;

      // Attach any pending passages to the PREVIOUS overnight step
      if (pendingPassages.length > 0 && processed.length > 0) {
        processed[processed.length - 1].passagesAfter = [...pendingPassages];
        pendingPassages.length = 0;
      } else {
        pendingPassages.length = 0; // passages before first overnight — discard (edge case)
      }

      // ownLeg = transport LEAVING this overnight step (real _roadType/_distanceKmToNext/_driveMinToNext)
      processed.push({ text: t, dayLabel, name: s.name || `${L.step} ${i + 1}`, ownLeg: legText(s, L), passagesAfter: [] });
    }
  }
  // Attach trailing passages (after last overnight step)
  if (pendingPassages.length > 0 && processed.length > 0) {
    processed[processed.length - 1].passagesAfter = [...pendingPassages];
  }

  // Second pass: every place gets a numbered block. The number and the day label
  // are authoritative: they are re-applied server-side after the AI answers.
  const index = [];
  let no = 0;
  const body = processed.map((p) => {
    no++;
    index.push({ day: p.dayLabel, city: p.name });
    let line = `#${no} [${p.dayLabel}] ${p.text}`;
    if (p.ownLeg) line += `\n  → ${L.trajet}: ${p.ownLeg}`;
    if (p.passagesAfter.length > 0) {
      line += `\n  → ${L.noNight}: ${p.passagesAfter.map(x => x.name).join(', ')}`;
      // Detail block for each no-night place, so the AI can output one card per place
      p.passagesAfter.forEach(x => {
        no++;
        index.push({ day: p.dayLabel, city: x.name });
        let sub = `\n#${no} [${p.dayLabel}] ${L.passage}: ${x.name}`;
        if (x.visits.length) sub += `\n    ${L.visits}: ${x.visits.join(' | ')}`;
        if (x.activities.length) sub += `\n    ${L.activities}: ${x.activities.join(' | ')}`;
        if (x.description) sub += `\n    ${L.info}: ${x.description}`;
        if (x.leg) sub += `\n    → ${L.trajet}: ${x.leg}`;
        line += sub;
      });
    }
    return line;
  }).join('\n');

  // Header anchoring on nights (built from raw JSON: 1 night = 1 lodging)
  const totalNights = steps.reduce((sum, s) => sum + (s.nights || 0), 0);
  const nbBases = steps.filter(s => (s.nights || 0) > 0).length;
  const header = (TRIP_HEADER[lang] || TRIP_HEADER.en)(totalNights, nbBases);
  return { text: `${header}\n\n${body}`, index };
}

// ===== PROMPT =====
function buildPrompt(title, stepsText, lang) {
  const instr = {
    fr: `Tu es un expert en road trips. Réponds UNIQUEMENT en JSON valide (pas de texte avant/après, pas de backticks).
Format: {"alerts":["⚠️ alerte1","⚠️ alerte2"],"review":["Points forts: ...","Points faibles: ...","Avis: pour qui, réduire/augmenter, conseil"],"steps":[{"day":"Jour X","city":"NOM","highlights":"1-2 phrases, noms clés EN MAJUSCULES","next":"direction + distance + temps"}]}
alerts: liste COURTE (0-3) de choses à vérifier ou corriger sur ce parcours. Ex: étape trop longue en voiture, lieu fermé/saisonnier, détour inutile, étape manquante évidente, visa/permis nécessaire, meilleure saison. Si tout est OK, tableau vide [].
review=3 chaînes, steps=UN objet par ligne numérotée #1, #2, #3... de l'itinéraire ci-dessous, dans le MÊME ordre et avec le MÊME nombre d'objets. Recopie le label de jour entre crochets tel quel dans "day" et le nom du lieu dans "city". N'invente aucun numéro de jour, ne fusionne jamais deux lignes. next="" pour la dernière étape. Concis, enthousiaste.
TRANSPORT: chaque étape indique son trajet réel (mode + distance + temps) sous "→ Trajet". Reprends EXACTEMENT ce mode et cette durée dans "next". Ne suppose JAMAIS la voiture : si c'est marqué EN AVION, c'est un vol. N'ajoute aucune alerte de fatigue, de trajet trop long ni de "journée de route" quand le trajet est un vol.
NUITS vs LIEUX: la durée réelle est le nombre de NUITS, pas le nombre de lieux. Un lieu "sans nuit" est une visite depuis l'hébergement du moment, jamais un changement d'hôtel. Ne dis JAMAIS qu'un séjour est infaisable, surchargé ou trop intense à cause du nombre de lieux. Une base avec plusieurs visites sans nuit reste UNE seule étape avec un seul hébergement.
IMPORTANT: Avant de répondre, compte les lieux de l'itinéraire fourni (étapes avec nuit + lignes "Passage") et vérifie que ton tableau steps contient EXACTEMENT le même nombre d'objets, dans le même ordre, avec les mêmes labels de jour. Aucun lieu ne doit manquer.`,
    en: `You are a road trip expert. Respond ONLY with valid JSON (no text before/after, no backticks).
Format: {"alerts":["⚠️ alert1","⚠️ alert2"],"review":["Strengths: ...","Weaknesses: ...","Verdict: who, shorten/extend, tip"],"steps":[{"day":"Day X","city":"NAME","highlights":"1-2 sentences, key names IN CAPITALS","next":"direction + distance + time"}]}
alerts: SHORT list (0-3) of things to verify or fix. E.g.: overly long drive, seasonal closure, unnecessary detour, obvious missing stop, visa required, best season. If all OK, empty array [].
review=3 strings, steps=ONE object per numbered line #1, #2, #3... of the itinerary below, in the SAME order and with the SAME count. Copy the bracketed day label as-is into "day" and the place name into "city". Never invent a day number, never merge two lines. next="" for last step. Concise, enthusiastic.
TRANSPORT: each stop states its real leg (mode + distance + time) under "→ Leg". Reuse that EXACT mode and duration in "next". NEVER assume driving: if it says BY PLANE, it is a flight. Do not add any fatigue, too-long-drive or "full day on the road" warning when the leg is a flight.
NIGHTS vs PLACES: real duration is the number of NIGHTS, not the number of places. A "no-night" place is a visit from the current lodging, never a hotel change. NEVER call a trip infeasible, overloaded or too intense because of the number of places. One base with several no-night visits is still ONE stop with one lodging.
IMPORTANT: Before responding, count the places in the given itinerary (overnight stops + "Pass-through" lines) and check your steps array contains EXACTLY the same number of objects, in the same order, with the same day labels. No place may be missing.`,
    nl: `You are a road trip expert. Write ALL your answers in Dutch. Respond ONLY with valid JSON (no text before/after, no backticks).
Format: {"alerts":["⚠️ alert1","⚠️ alert2"],"review":["Strengths: ...","Weaknesses: ...","Verdict: who, shorten/extend, tip"],"steps":[{"day":"Day X","city":"NAME","highlights":"1-2 sentences, key names IN CAPITALS","next":"direction + distance + time"}]}
alerts: SHORT list (0-3) of things to verify or fix. E.g.: overly long drive, seasonal closure, unnecessary detour, obvious missing stop, visa required, best season. If all OK, empty array [].
review=3 strings, steps=ONE object per numbered line #1, #2, #3... of the itinerary below, in the SAME order and with the SAME count. Copy the bracketed day label as-is into "day" and the place name into "city". Never invent a day number, never merge two lines. next="" for last step. Concise, enthusiastic.
TRANSPORT: each stop states its real leg (mode + distance + time) under "→ Leg". Reuse that EXACT mode and duration in "next". NEVER assume driving: if it says BY PLANE, it is a flight. Do not add any fatigue, too-long-drive or "full day on the road" warning when the leg is a flight.
NIGHTS vs PLACES: real duration is the number of NIGHTS, not the number of places. A "no-night" place is a visit from the current lodging, never a hotel change. NEVER call a trip infeasible, overloaded or too intense because of the number of places. One base with several no-night visits is still ONE stop with one lodging.
IMPORTANT: Before responding, count the places in the given itinerary (overnight stops + "Pass-through" lines) and check your steps array contains EXACTLY the same number of objects, in the same order, with the same day labels. No place may be missing.`,
    de: `You are a road trip expert. Write ALL your answers in German. Respond ONLY with valid JSON (no text before/after, no backticks).
Format: {"alerts":["⚠️ alert1","⚠️ alert2"],"review":["Strengths: ...","Weaknesses: ...","Verdict: who, shorten/extend, tip"],"steps":[{"day":"Day X","city":"NAME","highlights":"1-2 sentences, key names IN CAPITALS","next":"direction + distance + time"}]}
alerts: SHORT list (0-3) of things to verify or fix. E.g.: overly long drive, seasonal closure, unnecessary detour, obvious missing stop, visa required, best season. If all OK, empty array [].
review=3 strings, steps=ONE object per numbered line #1, #2, #3... of the itinerary below, in the SAME order and with the SAME count. Copy the bracketed day label as-is into "day" and the place name into "city". Never invent a day number, never merge two lines. next="" for last step. Concise, enthusiastic.
TRANSPORT: each stop states its real leg (mode + distance + time) under "→ Leg". Reuse that EXACT mode and duration in "next". NEVER assume driving: if it says BY PLANE, it is a flight. Do not add any fatigue, too-long-drive or "full day on the road" warning when the leg is a flight.
NIGHTS vs PLACES: real duration is the number of NIGHTS, not the number of places. A "no-night" place is a visit from the current lodging, never a hotel change. NEVER call a trip infeasible, overloaded or too intense because of the number of places. One base with several no-night visits is still ONE stop with one lodging.
IMPORTANT: Before responding, count the places in the given itinerary (overnight stops + "Pass-through" lines) and check your steps array contains EXACTLY the same number of objects, in the same order, with the same day labels. No place may be missing.`,
    es: `Experto en road trips. Responde SOLO con JSON válido (sin texto antes/después).
Formato: {"alerts":["⚠️ ..."],"review":["Fuertes: ...","Débiles: ...","Veredicto: ..."],"steps":[{"day":"Día X","city":"CIUDAD","highlights":"1-2 frases, nombres EN MAYÚSCULAS","next":"dirección + distancia + tiempo"}]}
alerts: 0-3 cosas a verificar. review=3, steps=UN objeto por línea numerada #1, #2, #3... del itinerario, en el MISMO orden y con el MISMO número. Copia la etiqueta de día entre corchetes en "day" y el nombre en "city". Nunca inventes un día ni fusiones dos líneas. next="" última. Conciso, entusiasta.
TRANSPORTE: cada etapa indica su trayecto real (modo + distancia + tiempo) bajo "→ Trayecto". Usa EXACTAMENTE ese modo y duración en "next". NUNCA supongas coche: si dice EN AVIÓN, es un vuelo. No añadas alerta de fatiga ni de trayecto demasiado largo cuando el trayecto es un vuelo.
IMPORTANTE: Antes de responder, cuenta los lugares del itinerario (etapas con noche + líneas "Paso") y verifica que steps contiene EXACTAMENTE el mismo número de objetos, en el mismo orden.`,
    it: `Esperto di road trip. Rispondi SOLO con JSON valido (nessun testo prima/dopo).
Formato: {"alerts":["⚠️ ..."],"review":["Forza: ...","Deboli: ...","Giudizio: ..."],"steps":[{"day":"Giorno X","city":"CITTÀ","highlights":"1-2 frasi, nomi IN MAIUSCOLO","next":"direzione + distanza + tempo"}]}
alerts: 0-3 cose da verificare. review=3, steps=UN oggetto per riga numerata #1, #2, #3... dell'itinerario, nello STESSO ordine e con lo STESSO numero. Copia l'etichetta di giorno tra parentesi quadre in "day" e il nome in "city". Non inventare mai un giorno, non unire mai due righe. next="" ultima. Conciso, entusiasta.
TRASPORTO: ogni tappa indica il tragitto reale (modo + distanza + tempo) sotto "→ Tragitto". Usa ESATTAMENTE quel modo e durata in "next". Non supporre MAI l'auto: se c'è scritto IN AEREO, è un volo. Non aggiungere alcun avviso di stanchezza o tragitto troppo lungo quando il tragitto è un volo.
IMPORTANTE: Prima di rispondere, conta i luoghi dell'itinerario (tappe con notte + righe "Passaggio") e verifica che steps contenga ESATTAMENTE lo stesso numero di oggetti, nello stesso ordine.`,
    pt: `Especialista em road trips. Responda APENAS com JSON válido (sem texto antes/depois).
Formato: {"alerts":["⚠️ ..."],"review":["Fortes: ...","Fracos: ...","Veredicto: ..."],"steps":[{"day":"Dia X","city":"CIDADE","highlights":"1-2 frases, nomes EM MAIÚSCULAS","next":"direção + distância + tempo"}]}
alerts: 0-3 pontos a verificar. review=3, steps=UM objeto por linha numerada #1, #2, #3... do itinerário, na MESMA ordem e com o MESMO número. Copie o rótulo de dia entre parênteses retos em "day" e o nome em "city". Nunca invente um dia nem junte duas linhas. next="" última. Conciso, entusiasta.
TRANSPORTE: cada etapa indica o seu trajeto real (modo + distância + tempo) em "→ Trajeto". Use EXATAMENTE esse modo e duração em "next". NUNCA suponha carro: se diz DE AVIÃO, é um voo. Não adicione alerta de cansaço nem de trajeto longo demais quando o trajeto é um voo.
IMPORTANTE: Antes de responder, conte os locais do itinerário (etapas com noite + linhas "Passagem") e verifique que steps contém EXATAMENTE o mesmo número de objetos, na mesma ordem.`,
    ar: `خبير رحلات. أجب فقط بـ JSON صالح.
{"alerts":["⚠️ ..."],"review":["القوة: ...","الضعف: ...","الحكم: ..."],"steps":[{"day":"يوم X","city":"المدينة","highlights":"جملة أو جملتين","next":"اتجاه + مسافة + وقت"}]}
alerts: 0-3 أشياء للتحقق. review=3, steps=كائن واحد لكل سطر مرقّم #1، #2، #3... بالترتيب نفسه وبالعدد نفسه. انسخ تسمية اليوم بين القوسين في "day" واسم المكان في "city". لا تخترع يوماً ولا تدمج سطرين. next="" الأخيرة.
النقل: كل مرحلة تذكر مسافتها الحقيقية (الوسيلة + المسافة + الوقت) تحت "→". استخدم نفس الوسيلة والمدة بالضبط في "next". لا تفترض السيارة أبداً: إذا كُتب بالطائرة فهي رحلة جوية. لا تضف أي تحذير عن التعب أو طول الطريق عندما يكون التنقل بالطائرة.
مهم: قبل الإجابة، عُدّ الأماكن في المسار (المراحل بليالٍ + أسطر "عبور") وتحقق أن steps يحتوي على العدد نفسه بالضبط وبالترتيب نفسه.`
  };
  const introLabel = {
    fr: 'Itinéraire', en: 'Itinerary', es: 'Itinerario',
    it: 'Itinerario', pt: 'Itinerário', ar: 'مسار الرحلة',
    nl: 'Route', de: 'Route'
  };
  return `${instr[lang] || instr.en}\n\n${introLabel[lang] || introLabel.en} "${title}":\n${stepsText}`;
}

// ===== REALIGN =====
// The day label and the place name are OUR data, never the AI's. We re-apply them
// on the AI output so a mislabelled or merged day can never reach the user.
function realignSteps(aiSteps, index) {
  if (!Array.isArray(index) || index.length === 0) return aiSteps;
  const list = Array.isArray(aiSteps) ? aiSteps : [];
  const norm = (v) => String(v || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return index.map((ref, i) => {
    let src = list[i];
    // If the AI dropped or reordered entries, find the right one by name.
    // No name match = no text at all, rather than text belonging to another place.
    if (!src || norm(src.city) !== norm(ref.city)) {
      src = list.find(x => norm(x && x.city) === norm(ref.city)) || null;
    }
    return {
      day: ref.day,
      city: ref.city,
      highlights: (src && src.highlights) || '',
      next: (src && src.next) || ''
    };
  });
}

// ===== PARSE AI JSON =====
function parseAiJson(text) {
  const clean = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  const parsed = JSON.parse(clean);
  if (!Array.isArray(parsed.review) || !Array.isArray(parsed.steps)) throw new Error('Bad AI structure');
  // Ensure alerts is always an array
  if (!Array.isArray(parsed.alerts)) parsed.alerts = [];
  console.log(`🤖 AI parsed: ${parsed.alerts.length} alerts, ${parsed.review.length} review, ${parsed.steps.length} steps`);
  return parsed;
}

// ===== 1. GEMINI =====
async function callGemini(title, stepsText, language) {
  console.log('🤖 Trying Gemini Flash...');
  const prompt = buildPrompt(title, stepsText, language);
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.6, maxOutputTokens: 16384, responseMimeType: 'application/json', thinkingConfig: { thinkingLevel: 'low' } }
      })
    });
    if (res.status === 429 || res.status >= 500) {
      console.warn(`⚠️ Gemini ${res.status} attempt ${attempt+1}`);
      if (attempt === 0) { await new Promise(r => setTimeout(r, 3000)); continue; }
      throw new Error(`Gemini ${res.status}`);
    }
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || `Gemini ${res.status}`); }
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty Gemini response');
    return { ...parseAiJson(text), model: GEMINI_MODEL };
  }
  throw new Error('Gemini failed after retry');
}

// ===== 1bis. GROQ FALLBACK (texte) =====
async function callGroq(title, stepsText, language) {
  console.log('⚡ Fallback Groq...');
  const prompt = buildPrompt(title, stepsText, language);
  for (const model of GROQ_MODELS) {
    try {
      console.log('  ⚡ Essai:', model);
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], temperature: 0.6, max_tokens: 3000, response_format: { type: 'json_object' } })
      });
      if (!res.ok) { console.warn(`  ⚡ ❌ ${model}: HTTP ${res.status}`); continue; }
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content?.trim();
      if (!text) continue;
      try { return { ...parseAiJson(text), model: `groq/${model}` }; }
      catch { console.warn(`  ⚡ ❌ ${model}: bad JSON`); continue; }
    } catch (e) { console.warn(`  ⚡ ❌ ${model}:`, e.message); }
  }
  throw new Error('All Groq models failed');
}

// ===== 2. OPENROUTER FALLBACK =====
async function getOpenRouterTextModels() {
  const res = await fetch('https://openrouter.ai/api/v1/models', {
    headers: { 'Authorization': `Bearer ${OPENROUTER_KEY}` }
  });
  if (!res.ok) return [];
  const data = await res.json();
  const preferred = [
    'meta-llama/llama-3.1-8b-instruct:free',
    'meta-llama/llama-3.2-3b-instruct:free',
    'mistralai/mistral-7b-instruct:free',
    'google/gemma-2-9b-it:free',
    'qwen/qwen-2.5-7b-instruct:free'
  ];
  const available = data.data?.map(m => m.id) || [];
  const found = preferred.filter(m => available.includes(m));
  if (found.length === 0) {
    return data.data?.filter(m => m.id.includes(':free') && !m.id.includes('vision')).map(m => m.id).slice(0, 5) || [];
  }
  return found;
}

async function callOpenRouter(title, stepsText, language) {
  console.log('📸 Fallback OpenRouter Text...');
  const models = await getOpenRouterTextModels();
  if (models.length === 0) throw new Error('No free text models');
  const prompt = buildPrompt(title, stepsText, language);
  for (const model of models) {
    try {
      console.log('  Essai:', model);
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${OPENROUTER_KEY}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://oneroadtrip.co' },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], temperature: 0.6, max_tokens: 3000 })
      });
      if (!res.ok) { console.warn(`  ❌ ${model}: HTTP ${res.status}`); continue; }
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content?.trim();
      if (!text) continue;
      try { return { ...parseAiJson(text), model }; }
      catch { console.warn(`  ❌ ${model}: bad JSON`); continue; }
    } catch (e) { console.warn(`  ❌ ${model}:`, e.message); }
  }
  throw new Error('All text models failed');
}

// ===== MAIN AI =====
async function generateSummary(title, stepsText, language) {
  if (GEMINI_KEY) {
    try { return await callGemini(title, stepsText, language); }
    catch (e) { console.warn('❌ Gemini:', e.message); }
  }
  if (GROQ_KEY) {
    try { return await callGroq(title, stepsText, language); }
    catch (e) { console.warn('❌ Groq:', e.message); }
  }
  if (OPENROUTER_KEY) {
    try { return await callOpenRouter(title, stepsText, language); }
    catch (e) { console.warn('❌ OpenRouter:', e.message); }
  }
  throw new Error('No AI available');
}

// ===== HANDLER =====
export default async (request, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };
  if (request.method === 'OPTIONS') return new Response('', { status: 204, headers });
  if (request.method !== 'POST') return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), { status: 405, headers });

  try {
    const { catalogId, tripId, title, steps, language, cacheOnly, force } = await request.json();

    // Build cache keys
    const lang = language || 'en';
    const cacheKey = buildCacheKey(catalogId, lang);
    const tripKey = tripId ? sanitizeDocId(tripId) + `_${lang}` : null;
    const primaryKey = cacheKey || tripKey;

    // ===== CACHE-ONLY MODE (public, no auth required) =====
    if (cacheOnly) {
      if (!primaryKey) {
        return new Response(JSON.stringify({ success: false, error: 'no_cache' }), { status: 200, headers });
      }
      const cached = await findCachedSummary(cacheKey, tripKey);
      if (cached) {
        // Auto-create alias: if found by catalogId but tripKey doesn't exist yet, save alias
        if (tripKey && cacheKey && tripKey !== cacheKey) {
          db.collection('catalog_summaries').doc(tripKey).set(cached).catch(function(){});
        }
        return new Response(JSON.stringify({
          success: true,
          data: { alerts: cached.alerts || [], review: cached.review, steps: cached.steps, fromCache: true }
        }), { status: 200, headers });
      }
      return new Response(JSON.stringify({ success: false, error: 'no_cache' }), { status: 200, headers });
    }

    // ===== GENERATE MODE (auth required) =====
    if (!primaryKey) {
      return new Response(JSON.stringify({ success: false, error: 'catalogId or tripId required' }), { status: 400, headers });
    }
    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'steps required' }), { status: 400, headers });
    }

    const user = await verifyToken(request.headers.get('authorization'));
    if (!user) {
      return new Response(JSON.stringify({ success: false, error: 'auth_required' }), { status: 401, headers });
    }

    // Cache : on le saute quand le visiteur demande explicitement une relance.
    // "force" sert quand l IA a renvoye un resume inutilisable.
    const cached = force ? null : await findCachedSummary(cacheKey, tripKey);
    if (cached) {
      return new Response(JSON.stringify({
        success: true,
        data: { alerts: cached.alerts || [], review: cached.review, steps: cached.steps, fromCache: true }
      }), { status: 200, headers });
    }

    // Quota
    const quota = await checkQuota(user.uid, user.email);
    if (!quota.allowed) {
      return new Response(JSON.stringify({ success: false, error: quota.error, usage: quota }), { status: 429, headers });
    }

    // Generate
    let aiResult;
    try {
      const built = buildStepsText(steps, lang);
      aiResult = await generateSummary(title || 'Road Trip', built.text, lang);
      aiResult.steps = realignSteps(aiResult.steps, built.index);
    } catch (aiErr) {
      console.error('❌ All AI failed:', aiErr.message);
      return new Response(JSON.stringify({ success: false, error: 'ai_overloaded', message: aiErr.message, usage: quota }), { status: 503, headers });
    }

    // Save
    // Save under both catalogId and tripId keys
    await saveSummary(cacheKey, tripKey, { alerts: aiResult.alerts || [], review: aiResult.review, steps: aiResult.steps }, lang, aiResult.model);

    return new Response(JSON.stringify({
      success: true,
      data: { alerts: aiResult.alerts || [], review: aiResult.review, steps: aiResult.steps, fromCache: false },
      model: aiResult.model, usage: quota
    }), { status: 200, headers });

  } catch (e) {
    console.error('❌', e.message);
    return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers });
  }
};
