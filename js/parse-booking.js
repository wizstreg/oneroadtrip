/**
 * ORT - Parse Booking (Netlify Function)
 * Gemini Flash + Fallback OpenRouter gratuit
 */

import admin from 'firebase-admin';

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
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const GROQ_KEY = process.env.GROQ_API_KEY;
const GROQ_MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
const MONTHLY_LIMIT = 20;

const CATEGORIES = {
  flight: '✈️', car_rental: '🚗', insurance: '🛡️', hotel: '🏨',
  activity: '🎯', visit: '🏛️', show: '🎭'
};

const PROMPT = `Tu extrais les infos de réservations voyage en JSON.

RÈGLES:
1. JSON valide uniquement, sans markdown, sans backticks, sans texte avant/après
2. null si info absente
3. Dates: YYYY-MM-DD, Heures: HH:MM (heure locale)
4. Durées: en minutes (ex: 2h30 = 150)

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
  "name": "Nom court (ex: Vol Paris-Tokyo, Location Hertz Nice)",
  "provider": "Compagnie/Fournisseur",
  "confirmation_number": "Ref/PNR",
  "date_start": "YYYY-MM-DD",
  "date_end": "YYYY-MM-DD",
  "time_start": "HH:MM",
  "time_end": "HH:MM",
  "address": "Adresse",
  "city": "Ville",
  "country": "Pays",
  "price": { "amount": 123.45, "currency": "EUR" },
  "guests": 2,
  "notes": "Infos importantes",
  
  "flights": [
    {
      "type": "outbound|return",
      "flight_number": "AF123",
      "airline": "Air France",
      "departure_city": "Paris",
      "departure_airport": "CDG",
      "departure_date": "YYYY-MM-DD",
      "departure_time": "HH:MM",
      "arrival_city": "Tokyo",
      "arrival_airport": "NRT",
      "arrival_date": "YYYY-MM-DD",
      "arrival_time": "HH:MM",
      "duration_minutes": 720
    }
  ],
  
  "car_rental": {
    "vehicle_type": "Citadine|Berline|SUV|Monospace|Utilitaire",
    "vehicle_model": "Peugeot 208 ou similaire",
    "pickup_location": "Aéroport Nice Côte d'Azur",
    "pickup_address": "Terminal 1",
    "pickup_date": "YYYY-MM-DD",
    "pickup_time": "HH:MM",
    "dropoff_location": "Aéroport Nice Côte d'Azur",
    "dropoff_address": "Terminal 1", 
    "dropoff_date": "YYYY-MM-DD",
    "dropoff_time": "HH:MM",
    "included_km": "Illimité|500km/jour",
    "fuel_policy": "Plein/Plein|Prépayé"
  }
}

NOTES:
- "flights" uniquement pour category=flight, sinon null
- "car_rental" uniquement pour category=car_rental, sinon null
- Si vol aller simple, un seul élément dans flights avec type="outbound"
- Si aller-retour, deux éléments (outbound + return)
- Si escales, ajouter chaque segment séparément
- duration_minutes: calculer à partir des heures si non indiqué (attention fuseaux horaires)

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
const VIP = ['bWFyY3NvcmNpQGZyZWUuZnI=']; // base64

async function checkQuota(uid, email) {
  // VIP bypass
  if (email && VIP.includes(Buffer.from(email).toString('base64'))) {
    return { allowed: true, count: 0, limit: 9999, remaining: 9999 };
  }
  
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
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`, {
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
  
  return { text, model: GEMINI_MODEL };
}

// ===== GROQ (fallback texte) =====
async function callGroq(content) {
  console.log('⚡ Fallback Groq...');
  for (const model of GROQ_MODELS) {
    try {
      console.log('⚡ Essai', model);
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: PROMPT },
            { role: 'user', content: content }
          ],
          temperature: 0.1,
          max_tokens: 1024,
          response_format: { type: 'json_object' }
        })
      });

      if (!res.ok) { console.warn(`⚡ ❌ ${model}: HTTP ${res.status}`); continue; }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content?.trim();
      if (text) {
        console.log('✅ Groq OK:', model);
        return { text, model: `groq/${model}` };
      }
    } catch (e) {
      console.warn('⚡ ❌', model, e.message);
    }
  }

  throw new Error('Tous les modèles Groq ont échoué');
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

  // 2. Groq
  if (GROQ_KEY) {
    try {
      return await callGroq(content);
    } catch (e) {
      console.warn('❌ Groq échoué:', e.message);
    }
  }

  // 3. OpenRouter
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

// Formater les minutes en heures
function formatDuration(minutes) {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}

function makePreview(data) {
  const icon = CATEGORIES[data.category] || '🎯';
  let subtitle = data.date_start || '';
  if (data.date_end && data.date_end !== data.date_start) subtitle += ' → ' + data.date_end;
  if (data.city) subtitle += (subtitle ? ' • ' : '') + data.city;

  const fields = [];
  
  // ═══ VOLS ═══
  if (data.category === 'flight' && data.flights && data.flights.length > 0) {
    data.flights.forEach((flight, idx) => {
      const typeLabel = flight.type === 'outbound' ? '✈️ ALLER' : (flight.type === 'return' ? '✈️ RETOUR' : '✈️ VOL');
      const route = `${flight.departure_city || '?'} (${flight.departure_airport || '?'}) → ${flight.arrival_city || '?'} (${flight.arrival_airport || '?'})`;
      
      fields.push({ icon: '', value: `━━ ${typeLabel} ━━`, isHeader: true });
      fields.push({ icon: '🛫', value: route });
      
      // Compagnie + numéro de vol
      let flightInfo = '';
      if (flight.airline) flightInfo += flight.airline;
      if (flight.flight_number) flightInfo += (flightInfo ? ' • ' : '') + flight.flight_number;
      if (flightInfo) fields.push({ icon: '🔢', value: flightInfo });
      
      // Départ
      if (flight.departure_date || flight.departure_time) {
        let depStr = flight.departure_date || '';
        if (flight.departure_time) depStr += (depStr ? ' à ' : '') + flight.departure_time;
        fields.push({ icon: '🛫', value: `Départ: ${depStr}` });
      }
      
      // Arrivée
      if (flight.arrival_date || flight.arrival_time) {
        let arrStr = flight.arrival_date || '';
        if (flight.arrival_time) arrStr += (arrStr ? ' à ' : '') + flight.arrival_time;
        if (flight.arrival_date && flight.departure_date && flight.arrival_date !== flight.departure_date) {
          arrStr += ' (+1j)';
        }
        fields.push({ icon: '🛬', value: `Arrivée: ${arrStr}` });
      }
      
      // Durée du vol
      if (flight.duration_minutes) {
        fields.push({ icon: '⏱️', value: `Durée: ${formatDuration(flight.duration_minutes)}` });
      }
    });
    
    // Infos générales
    if (data.confirmation_number) fields.push({ icon: '🔖', value: 'PNR: ' + data.confirmation_number });
    if (data.price?.amount) fields.push({ icon: '💰', value: data.price.amount + ' ' + (data.price.currency || 'EUR') });
    if (data.provider) fields.push({ icon: '🏢', value: data.provider });
    if (data.guests) fields.push({ icon: '👥', value: data.guests + ' passager(s)' });
    if (data.notes) fields.push({ icon: '📝', value: data.notes });
  
  // ═══ LOCATION VOITURE ═══
  } else if (data.category === 'car_rental' && data.car_rental) {
    const car = data.car_rental;
    
    // Véhicule
    if (car.vehicle_model || car.vehicle_type) {
      fields.push({ icon: '🚗', value: car.vehicle_model || car.vehicle_type });
    }
    
    // Prise en charge
    fields.push({ icon: '', value: '━━ 📍 PRISE EN CHARGE ━━', isHeader: true });
    if (car.pickup_location) fields.push({ icon: '📍', value: car.pickup_location });
    if (car.pickup_date || car.pickup_time) {
      let pickupStr = car.pickup_date || '';
      if (car.pickup_time) pickupStr += (pickupStr ? ' à ' : '') + car.pickup_time;
      fields.push({ icon: '📅', value: pickupStr });
    }
    
    // Restitution
    fields.push({ icon: '', value: '━━ 📍 RESTITUTION ━━', isHeader: true });
    if (car.dropoff_location) fields.push({ icon: '📍', value: car.dropoff_location });
    if (car.dropoff_date || car.dropoff_time) {
      let dropoffStr = car.dropoff_date || '';
      if (car.dropoff_time) dropoffStr += (dropoffStr ? ' à ' : '') + car.dropoff_time;
      fields.push({ icon: '📅', value: dropoffStr });
    }
    
    // Détails
    if (car.included_km) fields.push({ icon: '🛣️', value: `Kilométrage: ${car.included_km}` });
    if (car.fuel_policy) fields.push({ icon: '⛽', value: `Carburant: ${car.fuel_policy}` });
    
    // Infos générales
    if (data.confirmation_number) fields.push({ icon: '🔖', value: 'Réf: ' + data.confirmation_number });
    if (data.price?.amount) fields.push({ icon: '💰', value: data.price.amount + ' ' + (data.price.currency || 'EUR') });
    if (data.provider) fields.push({ icon: '🏢', value: data.provider });
    if (data.notes) fields.push({ icon: '📝', value: data.notes });
    
  } else {
    // ═══ AUTRES (hôtel, activité, etc.) ═══
    if (data.date_start) fields.push({ icon: '📅', value: data.date_start + (data.date_end && data.date_end !== data.date_start ? ' → ' + data.date_end : '') });
    if (data.time_start) fields.push({ icon: '🕐', value: data.time_start + (data.time_end ? ' - ' + data.time_end : '') });
    if (data.address || data.city) fields.push({ icon: '📍', value: [data.address, data.city, data.country].filter(Boolean).join(', ') });
    if (data.confirmation_number) fields.push({ icon: '🔖', value: 'Réf: ' + data.confirmation_number });
    if (data.price?.amount) fields.push({ icon: '💰', value: data.price.amount + ' ' + (data.price.currency || 'EUR') });
    if (data.provider) fields.push({ icon: '🏢', value: data.provider });
    if (data.guests) fields.push({ icon: '👥', value: data.guests + ' personne(s)' });
    if (data.notes) fields.push({ icon: '📝', value: data.notes });
  }

  return { icon, title: data.name || 'Sans nom', subtitle, fields, category: data.category, flights: data.flights, car_rental: data.car_rental };
}

// ===== HANDLER =====
export default async (request, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response('', { status: 204, headers });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), { status: 405, headers });
  }

  try {
    const { content } = await request.json();
    
    if (!content || content.length < 50) {
      return new Response(JSON.stringify({ success: false, error: 'Contenu trop court' }), { status: 400, headers });
    }

    // Auth
    const user = await verifyToken(request.headers.get('authorization'));
    if (!user) {
      return new Response(JSON.stringify({ success: false, error: 'Connexion requise' }), { status: 401, headers });
    }

    // Quota
    const quota = await checkQuota(user.uid, user.email);
    if (!quota.allowed) {
      return new Response(JSON.stringify({ success: false, error: `Quota atteint (${quota.limit}/mois)`, usage: quota }), { status: 429, headers });
    }

    // Parse
    const result = await parseEmail(content);
    const data = JSON.parse(cleanJSON(result.text));
    
    data.id = `booking_${Date.now()}`;
    data.source = 'ai_parser';
    data.created_at = new Date().toISOString();

    return new Response(JSON.stringify({
      success: true,
      data,
      preview: makePreview(data),
      usage: quota,
      _meta: { model: result.model }
    }), { status: 200, headers });

  } catch (e) {
    console.error('❌ Error:', e.message);
    return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers });
  }
};
