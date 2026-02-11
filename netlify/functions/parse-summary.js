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
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
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

// Build the cache key from catalogId (the _originalItinId)
function buildCacheKey(catalogId) {
  if (!catalogId) return null;
  return sanitizeDocId(stripLangSuffix(catalogId));
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
function buildStepsText(steps) {
  let day = 0;
  return steps.map((s, i) => {
    const n = s.nights || 0;
    if (n > 0) day++;
    const label = n > 0 ? `Jour ${day}` : 'Passage';
    const vis = (Array.isArray(s.visits) ? s.visits.map(v => typeof v === 'string' ? v : v.text).filter(Boolean) : []);
    const act = (Array.isArray(s.activities) ? s.activities.map(a => typeof a === 'string' ? a : a.text).filter(Boolean) : []);
    let t = `${label}: ${s.name || 'Étape '+(i+1)} (${n} nuit${n>1?'s':''})`;
    if (vis.length) t += `\n  Visites: ${vis.join(' | ')}`;
    if (act.length) t += `\n  Activités: ${act.join(' | ')}`;
    if (s.description) t += `\n  Info: ${s.description}`;
    return t;
  }).join('\n');
}

// ===== PROMPT =====
function buildPrompt(title, stepsText, lang) {
  const instr = {
    fr: `Tu es un expert en road trips. Réponds UNIQUEMENT en JSON valide (pas de texte avant/après, pas de backticks).
Format: {"alerts":["⚠️ alerte1","⚠️ alerte2"],"review":["Points forts: ...","Points faibles: ...","Avis: pour qui, réduire/augmenter, conseil"],"steps":[{"day":1,"city":"NOM","highlights":"1-2 phrases, noms clés EN MAJUSCULES","next":"direction + distance + temps"}]}
alerts: liste COURTE (0-3) de choses à vérifier ou corriger sur ce parcours. Ex: étape trop longue en voiture, lieu fermé/saisonnier, détour inutile, étape manquante évidente, visa/permis nécessaire, meilleure saison. Si tout est OK, tableau vide [].
review=3 chaînes, steps=étapes avec nuits>0, passages intégrés dans next précédent, next="" dernière étape. Concis, enthousiaste.`,
    en: `You are a road trip expert. Respond ONLY with valid JSON (no text before/after, no backticks).
Format: {"alerts":["⚠️ alert1","⚠️ alert2"],"review":["Strengths: ...","Weaknesses: ...","Verdict: who, shorten/extend, tip"],"steps":[{"day":1,"city":"NAME","highlights":"1-2 sentences, key names IN CAPITALS","next":"direction + distance + time"}]}
alerts: SHORT list (0-3) of things to verify or fix. E.g.: overly long drive, seasonal closure, unnecessary detour, obvious missing stop, visa required, best season. If all OK, empty array [].
review=3 strings, steps=stops with nights>0, pass-throughs in previous next, next="" last step. Concise, enthusiastic.`,
    es: `Experto en road trips. Responde SOLO con JSON válido (sin texto antes/después).
Formato: {"alerts":["⚠️ ..."],"review":["Fuertes: ...","Débiles: ...","Veredicto: ..."],"steps":[{"day":1,"city":"CIUDAD","highlights":"1-2 frases, nombres EN MAYÚSCULAS","next":"dirección + distancia + tiempo"}]}
alerts: 0-3 cosas a verificar. review=3, steps=etapas noches>0, next="" última. Conciso, entusiasta.`,
    it: `Esperto di road trip. Rispondi SOLO con JSON valido (nessun testo prima/dopo).
Formato: {"alerts":["⚠️ ..."],"review":["Forza: ...","Deboli: ...","Giudizio: ..."],"steps":[{"day":1,"city":"CITTÀ","highlights":"1-2 frasi, nomi IN MAIUSCOLO","next":"direzione + distanza + tempo"}]}
alerts: 0-3 cose da verificare. review=3, steps=tappe notti>0, next="" ultima. Conciso, entusiasta.`,
    pt: `Especialista em road trips. Responda APENAS com JSON válido (sem texto antes/depois).
Formato: {"alerts":["⚠️ ..."],"review":["Fortes: ...","Fracos: ...","Veredicto: ..."],"steps":[{"day":1,"city":"CIDADE","highlights":"1-2 frases, nomes EM MAIÚSCULAS","next":"direção + distância + tempo"}]}
alerts: 0-3 pontos a verificar. review=3, steps=etapas noites>0, next="" última. Conciso, entusiasta.`,
    ar: `خبير رحلات. أجب فقط بـ JSON صالح.
{"alerts":["⚠️ ..."],"review":["القوة: ...","الضعف: ...","الحكم: ..."],"steps":[{"day":1,"city":"المدينة","highlights":"جملة أو جملتين","next":"اتجاه + مسافة + وقت"}]}
alerts: 0-3 أشياء للتحقق. review=3, steps=مراحل بليالي>0, next="" الأخيرة.`
  };
  return `${instr[lang] || instr.en}\n\nItinéraire "${title}":\n${stepsText}`;
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
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.6, maxOutputTokens: 3000, responseMimeType: 'application/json' }
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
    return { ...parseAiJson(text), model: 'gemini-2.0-flash' };
  }
  throw new Error('Gemini failed after retry');
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
    const cacheKey = buildCacheKey(catalogId);
    const tripKey = tripId ? sanitizeDocId(tripId) : null;
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
    const lang = language || 'fr';
    let aiResult;
    try {
      aiResult = await generateSummary(title || 'Road Trip', buildStepsText(steps), lang);
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
