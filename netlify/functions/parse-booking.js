/**
 * ORT - Parse Booking (Netlify Function)
 * Gemini Flash + Fallback OpenRouter gratuit
 */

const admin = require('firebase-admin');

// Init Firebase Admin avec Service Account
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.ORT_FB_PROJECTID
    });
    console.log('✅ Firebase Admin initialisé avec service account');
  } catch (e) {
    console.error('❌ Firebase Admin init failed:', e.message);
    // Fallback sans credentials (ne marchera pas pour auth/firestore)
    admin.initializeApp({
      projectId: process.env.ORT_FB_PROJECTID
    });
  }
}
const db = admin.firestore();

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const MONTHLY_LIMIT = 20;

const CATEGORIES = {
  flight: '✈️', car_rental: '🚗', insurance: '🛡️', hotel: '🏨',
  activity: '🎯', visit: '🏛️', show: '🎭'
};

const PROMPT = `Tu extrais les infos de réservations voyage en JSON.

RÈGLES:
1. JSON valide uniquement, sans markdown, sans backticks, sans texte avant/après
2. null si info absente
3. Dates: YYYY-MM-DD, Heures: HH:MM

CATÉGORIES (une seule):
- flight: Avion/vol
- car_rental: Location voiture
- insurance: Assurance
- hotel: Hôtel/hébergement/Airbnb
- activity: Activité/excursion
- visit: Visite/musée/monument
- show: Spectacle/concert

JSON À RETOURNER:
{
  "category": "flight|car_rental|insurance|hotel|activity|visit|show",
  "name": "Nom",
  "provider": "Fournisseur",
  "confirmation_number": "Ref",
  "date_start": "YYYY-MM-DD",
  "date_end": "YYYY-MM-DD",
  "time_start": "HH:MM",
  "time_end": "HH:MM",
  "address": "Adresse",
  "city": "Ville",
  "country": "Pays",
  "price": { "amount": 123.45, "currency": "EUR" },
  "guests": 2,
  "notes": "Infos importantes"
}

CONTENU:
`;

// ===== AUTH =====
async function verifyToken(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    return await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
  } catch { return null; }
}

// ===== QUOTA =====
async function checkQuota(uid) {
  const ref = db.collection('users').doc(uid);
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  
  const doc = await ref.get();
  let imports = doc.exists && doc.data().imports || { count: 0, month };
  if (imports.month !== month) imports = { count: 0, month };
  
  if (imports.count >= MONTHLY_LIMIT) {
    return { allowed: false, count: imports.count, limit: MONTHLY_LIMIT, remaining: 0 };
  }
  
  imports.count++;
  await ref.set({ imports }, { merge: true });
  return { allowed: true, count: imports.count, limit: MONTHLY_LIMIT, remaining: MONTHLY_LIMIT - imports.count };
}

// ===== GEMINI =====
async function callGemini(content) {
  console.log('🔄 Essai Gemini Flash...');
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: PROMPT + '\n\n' + content }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 1024 }
    })
  });
  
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Gemini error');
  }
  
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Réponse vide Gemini');
  
  return { text, model: 'Gemini Flash' };
}

// ===== OPENROUTER =====
async function getOpenRouterFreeModels() {
  const res = await fetch('https://openrouter.ai/api/v1/models', {
    headers: { 'Authorization': `Bearer ${OPENROUTER_KEY}` }
  });
  if (!res.ok) return [];
  const data = await res.json();
  
  return data.data
    .filter(m => m.pricing && parseFloat(m.pricing.prompt) === 0 && parseFloat(m.pricing.completion) === 0)
    .map(m => m.id)
    .slice(0, 10);
}

async function callOpenRouter(content) {
  console.log('🔄 Fallback OpenRouter...');
  const freeModels = await getOpenRouterFreeModels();
  console.log('📋 Modèles gratuits:', freeModels);
  
  if (freeModels.length === 0) throw new Error('Aucun modèle gratuit disponible');
  
  for (const model of freeModels) {
    try {
      console.log('🔄 Essai', model);
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://oneroadtrip.co'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: PROMPT },
            { role: 'user', content: content }
          ],
          temperature: 0.1,
          max_tokens: 1024
        })
      });

      if (!res.ok) continue;

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content?.trim();
      if (text) {
        console.log('✅ Succès avec:', model);
        return { text, model };
      }
    } catch (e) {
      console.warn('❌', model, e.message);
    }
  }
  
  throw new Error('Tous les modèles ont échoué');
}

// ===== PARSE =====
async function parseEmail(content) {
  // 1. Gemini
  if (GEMINI_KEY) {
    try {
      return await callGemini(content);
    } catch (e) {
      console.warn('❌ Gemini échoué:', e.message);
    }
  }
  
  // 2. OpenRouter
  if (OPENROUTER_KEY) {
    return await callOpenRouter(content);
  }
  
  throw new Error('Aucune API configurée');
}

function cleanJSON(text) {
  let c = text.trim();
  if (c.startsWith('```json')) c = c.slice(7);
  if (c.startsWith('```')) c = c.slice(3);
  if (c.endsWith('```')) c = c.slice(0, -3);
  return c.trim();
}

function makePreview(data) {
  const icon = CATEGORIES[data.category] || '🎯';
  let subtitle = data.date_start || '';
  if (data.date_end && data.date_end !== data.date_start) subtitle += ' → ' + data.date_end;
  if (data.city) subtitle += (subtitle ? ' • ' : '') + data.city;

  const fields = [];
  if (data.date_start) fields.push({ icon: '📅', value: data.date_start + (data.date_end && data.date_end !== data.date_start ? ' → ' + data.date_end : '') });
  if (data.time_start) fields.push({ icon: '🕐', value: data.time_start + (data.time_end ? ' - ' + data.time_end : '') });
  if (data.address || data.city) fields.push({ icon: '📍', value: [data.address, data.city, data.country].filter(Boolean).join(', ') });
  if (data.confirmation_number) fields.push({ icon: '🔖', value: 'Réf: ' + data.confirmation_number });
  if (data.price?.amount) fields.push({ icon: '💰', value: data.price.amount + ' ' + (data.price.currency || 'EUR') });
  if (data.provider) fields.push({ icon: '🏢', value: data.provider });
  if (data.guests) fields.push({ icon: '👥', value: data.guests + ' personne(s)' });
  if (data.notes) fields.push({ icon: '📝', value: data.notes });

  return { icon, title: data.name || 'Sans nom', subtitle, fields, category: data.category };
}

// ===== HANDLER =====
exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ success: false, error: 'Method not allowed' }) };
  }

  try {
    const { content } = JSON.parse(event.body || '{}');
    
    if (!content || content.length < 50) {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Contenu trop court' }) };
    }

    // Auth
    const user = await verifyToken(event.headers.authorization);
    if (!user) {
      return { statusCode: 401, headers, body: JSON.stringify({ success: false, error: 'Connexion requise' }) };
    }

    // Quota
    const quota = await checkQuota(user.uid);
    if (!quota.allowed) {
      return { statusCode: 429, headers, body: JSON.stringify({ success: false, error: `Quota atteint (${quota.limit}/mois)`, usage: quota }) };
    }

    // Parse
    const result = await parseEmail(content);
    const data = JSON.parse(cleanJSON(result.text));
    
    data.id = `booking_${Date.now()}`;
    data.source = 'ai_parser';
    data.created_at = new Date().toISOString();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data,
        preview: makePreview(data),
        usage: quota,
        _meta: { model: result.model }
      })
    };

  } catch (e) {
    console.error('❌ Error:', e.message);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: e.message }) };
  }
};
