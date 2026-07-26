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
  fr: { day: 'Jour', passage: 'Passage', visits: 'Visites', activities: 'Activités', info: 'Info', step: 'Étape', night: 'nuit', nights: 'nuits', via: 'via' },
  en: { day: 'Day', passage: 'Pass-through', visits: 'Visits', activities: 'Activities', info: 'Info', step: 'Stop', night: 'night', nights: 'nights', via: 'via' },
  es: { day: 'Día', passage: 'Paso', visits: 'Visitas', activities: 'Actividades', info: 'Info', step: 'Etapa', night: 'noche', nights: 'noches', via: 'vía' },
  it: { day: 'Giorno', passage: 'Passaggio', visits: 'Visite', activities: 'Attività', info: 'Info', step: 'Tappa', night: 'notte', nights: 'notti', via: 'via' },
  pt: { day: 'Dia', passage: 'Passagem', visits: 'Visitas', activities: 'Atividades', info: 'Info', step: 'Etapa', night: 'noite', nights: 'noites', via: 'via' },
  ar: { day: 'يوم', passage: 'عبور', visits: 'زيارات', activities: 'أنشطة', info: 'معلومات', step: 'مرحلة', night: 'ليلة', nights: 'ليالٍ', via: 'عبر' }
};

function buildStepsText(steps, lang) {
  const L = STEP_LABELS[lang] || STEP_LABELS.en;
  let day = 0;
  // First pass: collect passage names to attach to previous step's "next"
  const pendingPassages = []; // grouped passages after each overnight step
  const processed = [];

  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    const n = s.nights || 0;
    if (n === 0) {
      // Passage step — accumulate for attachment to previous overnight step
      pendingPassages.push(s.name || `${L.step} ${i + 1}`);
    } else {
      // Overnight step
      day++;
      const dayStart = day;
      const dayEnd = day + n - 1;
      const dayLabel = n > 1 ? `${L.day} ${dayStart}-${dayEnd}` : `${L.day} ${dayStart}`;
      day = dayEnd;

      const vis = (Array.isArray(s.visits) ? s.visits.map(v => typeof v === 'string' ? v : v.text).filter(Boolean) : []);
      const act = (Array.isArray(s.activities) ? s.activities.map(a => typeof a === 'string' ? a : a.text).filter(Boolean) : []);
      let t = `${dayLabel}: ${s.name || L.step + ' ' + (i + 1)} (${n} ${n > 1 ? L.nights : L.night})`;
      if (vis.length) t += `\n  ${L.visits}: ${vis.join(' | ')}`;
      if (act.length) t += `\n  ${L.activities}: ${act.join(' | ')}`;
      if (s.description) t += `\n  ${L.info}: ${s.description}`;

      // Attach any pending passages to the PREVIOUS overnight step's "next" info
      if (pendingPassages.length > 0 && processed.length > 0) {
        processed[processed.length - 1].passagesAfter = [...pendingPassages];
        pendingPassages.length = 0;
      } else {
        pendingPassages.length = 0; // passages before first overnight — discard (edge case)
      }

      processed.push({ text: t, passagesAfter: [] });
    }
  }
  // Attach trailing passages (after last overnight step)
  if (pendingPassages.length > 0 && processed.length > 0) {
    processed[processed.length - 1].passagesAfter = [...pendingPassages];
  }

  // Second pass: render with passage info integrated
  return processed.map((p, i) => {
    let line = p.text;
    if (p.passagesAfter.length > 0) {
      line += `\n  → ${L.via}: ${p.passagesAfter.join(', ')}`;
    }
    return line;
  }).join('\n');
}

// ===== PROMPT =====
function buildPrompt(title, stepsText, lang) {
  const instr = {
    fr: `Tu es un expert en road trips. Réponds UNIQUEMENT en JSON valide (pas de texte avant/après, pas de backticks).
Format: {"alerts":["⚠️ alerte1","⚠️ alerte2"],"review":["Points forts: ...","Points faibles: ...","Avis: pour qui, réduire/augmenter, conseil"],"steps":[{"day":"Jour X","city":"NOM","highlights":"1-2 phrases, noms clés EN MAJUSCULES","next":"direction + distance + temps"}]}
alerts: liste COURTE (0-3) de choses à vérifier ou corriger sur ce parcours. Ex: étape trop longue en voiture, lieu fermé/saisonnier, détour inutile, étape manquante évidente, visa/permis nécessaire, meilleure saison. Si tout est OK, tableau vide [].
review=3 chaînes, steps=TOUTES les étapes avec nuits (les passages sont indiqués dans "via" sous l'étape précédente, intègre-les dans le "next" de cette étape). Le champ "day" reprend le label exact (ex: "Jour 1", "Jour 2-4"). next="" pour la dernière étape. Concis, enthousiaste.
IMPORTANT: Avant de répondre, vérifie que (1) chaque étape avec nuit apparaît dans steps (2) les jours correspondent exactement à ceux de l'itinéraire fourni (3) aucune étape n'est oubliée.`,
    en: `You are a road trip expert. Respond ONLY with valid JSON (no text before/after, no backticks).
Format: {"alerts":["⚠️ alert1","⚠️ alert2"],"review":["Strengths: ...","Weaknesses: ...","Verdict: who, shorten/extend, tip"],"steps":[{"day":"Day X","city":"NAME","highlights":"1-2 sentences, key names IN CAPITALS","next":"direction + distance + time"}]}
alerts: SHORT list (0-3) of things to verify or fix. E.g.: overly long drive, seasonal closure, unnecessary detour, obvious missing stop, visa required, best season. If all OK, empty array [].
review=3 strings, steps=ALL stops with nights (pass-throughs are marked under "via" in previous stop, integrate them in that stop's "next"). "day" field must match the exact label (e.g. "Day 1", "Day 2-4"). next="" for last step. Concise, enthusiastic.
IMPORTANT: Before responding, verify that (1) every overnight stop appears in steps (2) day labels match the itinerary exactly (3) no stop is missing.`,
    es: `Experto en road trips. Responde SOLO con JSON válido (sin texto antes/después).
Formato: {"alerts":["⚠️ ..."],"review":["Fuertes: ...","Débiles: ...","Veredicto: ..."],"steps":[{"day":"Día X","city":"CIUDAD","highlights":"1-2 frases, nombres EN MAYÚSCULAS","next":"dirección + distancia + tiempo"}]}
alerts: 0-3 cosas a verificar. review=3, steps=TODAS las etapas con noches (pasos integrados en "next" anterior). "day" = etiqueta exacta (ej: "Día 1", "Día 2-4"). next="" última. Conciso, entusiasta.
IMPORTANTE: Antes de responder, verifica que (1) cada etapa con noche aparece en steps (2) los días coinciden exactamente (3) ninguna etapa falta.`,
    it: `Esperto di road trip. Rispondi SOLO con JSON valido (nessun testo prima/dopo).
Formato: {"alerts":["⚠️ ..."],"review":["Forza: ...","Deboli: ...","Giudizio: ..."],"steps":[{"day":"Giorno X","city":"CITTÀ","highlights":"1-2 frasi, nomi IN MAIUSCOLO","next":"direzione + distanza + tempo"}]}
alerts: 0-3 cose da verificare. review=3, steps=TUTTE le tappe con notti (passaggi integrati in "next" precedente). "day" = etichetta esatta (es: "Giorno 1", "Giorno 2-4"). next="" ultima. Conciso, entusiasta.
IMPORTANTE: Prima di rispondere, verifica che (1) ogni tappa con notte appaia in steps (2) i giorni corrispondano esattamente (3) nessuna tappa manchi.`,
    pt: `Especialista em road trips. Responda APENAS com JSON válido (sem texto antes/depois).
Formato: {"alerts":["⚠️ ..."],"review":["Fortes: ...","Fracos: ...","Veredicto: ..."],"steps":[{"day":"Dia X","city":"CIDADE","highlights":"1-2 frases, nomes EM MAIÚSCULAS","next":"direção + distância + tempo"}]}
alerts: 0-3 pontos a verificar. review=3, steps=TODAS as etapas com noites (passagens integradas em "next" anterior). "day" = rótulo exato (ex: "Dia 1", "Dia 2-4"). next="" última. Conciso, entusiasta.
IMPORTANTE: Antes de responder, verifique que (1) cada etapa com noite aparece em steps (2) os dias correspondem exatamente (3) nenhuma etapa falta.`,
    ar: `خبير رحلات. أجب فقط بـ JSON صالح.
{"alerts":["⚠️ ..."],"review":["القوة: ...","الضعف: ...","الحكم: ..."],"steps":[{"day":"يوم X","city":"المدينة","highlights":"جملة أو جملتين","next":"اتجاه + مسافة + وقت"}]}
alerts: 0-3 أشياء للتحقق. review=3, steps=جميع المراحل بليالٍ (العبور مدمج في "next" السابق). "day" = التسمية الدقيقة. next="" الأخيرة.
مهم: قبل الإجابة، تحقق أن (1) كل مرحلة بليالٍ موجودة (2) الأيام تطابق المسار (3) لا توجد مرحلة مفقودة.`
  };
  const introLabel = {
    fr: 'Itinéraire', en: 'Itinerary', es: 'Itinerario',
    it: 'Itinerario', pt: 'Itinerário', ar: 'مسار الرحلة'
  };
  return `${instr[lang] || instr.en}\n\n${introLabel[lang] || introLabel.en} "${title}":\n${stepsText}`;
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
    const { catalogId, tripId, title, steps, language, cacheOnly } = await request.json();

    // Build cache keys
    const lang = language || 'fr';
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

    // Check cache first (avoid re-generating)
    const cached = await findCachedSummary(cacheKey, tripKey);
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
      aiResult = await generateSummary(title || 'Road Trip', buildStepsText(steps, lang), lang);
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
