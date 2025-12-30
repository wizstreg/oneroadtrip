/**
 * ORT - Parse Booking Photo (Netlify Function)
 * Parse photos de réservations via Gemini Vision
 * Quotas: 10/jour, 50/mois par user
 */

const admin = require('firebase-admin');

// Init Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.ORT_FB_PROJECTID
  });
}
const db = admin.firestore();

const GEMINI_KEY = process.env.GEMINI_API_KEY;

const DAILY_LIMIT = parseInt(process.env.BOOKING_PHOTO_DAILY_LIMIT || '10', 10);
const MONTHLY_LIMIT = parseInt(process.env.BOOKING_PHOTO_MONTHLY_LIMIT || '50', 10);

// ===== PROMPT BOOKING =====
const BOOKING_PROMPT = `Tu es un expert en extraction de données de réservations.
Analyse cette photo de confirmation de réservation (email, PDF, capture d'écran).

INSTRUCTIONS:
1. Identifie le TYPE de réservation
2. Extrais TOUTES les informations de réservation visibles
3. Si une info n'est pas visible, mets null
4. Formate les dates en YYYY-MM-DD
5. Formate les heures en HH:MM (24h)
6. Prix en nombre décimal, devise en code ISO (EUR, USD, etc.)

RÉPONDS UNIQUEMENT avec ce JSON (pas de texte avant/après):
{
  "type": "hotel|flight|car|train|bus|ferry|activity|restaurant|show|tour|transfer|other",
  "name": "nom de l'établissement/compagnie/activité",
  "provider": "plateforme de réservation (Booking, Expedia, etc.) ou null",
  "confirmation_number": "numéro de confirmation/réservation",
  "date_start": "YYYY-MM-DD",
  "date_end": "YYYY-MM-DD ou null",
  "time_start": "HH:MM ou null",
  "time_end": "HH:MM ou null",
  "location": "ville ou adresse",
  "location_end": "ville d'arrivée (pour transport) ou null",
  "price": {
    "amount": 123.45,
    "currency": "EUR"
  },
  "guests": 2,
  "rooms": 1,
  "flight_number": "numéro de vol ou null",
  "vehicle_type": "type de véhicule ou null",
  "pickup_location": "lieu de retrait ou null",
  "dropoff_location": "lieu de retour ou null",
  "notes": "infos supplémentaires importantes ou null",
  "contact": "téléphone ou email du prestataire ou null"
}

TYPES DÉTAILLÉS:
- hotel: hôtel, airbnb, gîte, chambre d'hôte
- flight: vol avion
- car: location voiture, moto, scooter
- train: train, TGV, Eurostar
- bus: bus, car longue distance
- ferry: ferry, bateau
- activity: visite, excursion, atelier
- restaurant: restaurant, table réservée
- show: spectacle, concert, théâtre
- tour: visite guidée, tour
- transfer: transfert aéroport, navette
- other: autre`;

// ===== AUTH =====
async function verifyToken(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    return await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
  } catch { return null; }
}

// ===== QUOTA =====
async function checkQuota(uid, email) {
  // Exception admin
  if (email === 'marcsorci@free.fr') {
    return { allowed: true, count: 0, limit: -1, remaining: -1 };
  }

  const ref = db.collection('users').doc(uid).collection('booking_photo_usage');
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const today = now.toISOString().split('T')[0];
  
  const monthRef = ref.doc(month);
  const dayRef = ref.doc(today);
  
  const [monthDoc, dayDoc] = await Promise.all([monthRef.get(), dayRef.get()]);
  
  let monthData = monthDoc.exists ? monthDoc.data() : { count: 0 };
  let dayData = dayDoc.exists ? dayDoc.data() : { count: 0 };

  if (monthData.count >= MONTHLY_LIMIT) {
    return { allowed: false, error: 'Quota mensuel atteint', count: monthData.count, limit: MONTHLY_LIMIT, remaining: 0 };
  }
  if (dayData.count >= DAILY_LIMIT) {
    return { allowed: false, error: 'Quota journalier atteint', count: monthData.count, limit: MONTHLY_LIMIT, remaining: MONTHLY_LIMIT - monthData.count };
  }

  // Incrémenter
  await Promise.all([
    monthRef.set({ count: (monthData.count || 0) + 1, month }),
    dayRef.set({ count: (dayData.count || 0) + 1, date: today })
  ]);

  return { allowed: true, count: monthData.count + 1, limit: MONTHLY_LIMIT, remaining: MONTHLY_LIMIT - monthData.count - 1 };
}

// ===== GEMINI VISION =====
async function callGemini(photoBase64) {
  console.log('📸 Gemini Parse Booking Photo...');
  
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: BOOKING_PROMPT },
          {
            inline_data: {
              mime_type: 'image/jpeg',
              data: photoBase64.includes(',') ? photoBase64.split(',')[1] : photoBase64
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.1, // Très bas pour extraction précise
        maxOutputTokens: 800
      }
    })
  });
  
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Gemini error');
  }
  
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Réponse vide Gemini');
  
  return text;
}

// ===== PARSE JSON RESPONSE =====
function parseBookingResponse(text) {
  try {
    let clean = text.trim();
    if (clean.startsWith('```')) {
      clean = clean.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
    }
    
    const data = JSON.parse(clean);
    
    // Normaliser et valider
    return {
      id: `booking_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      category: mapTypeToCategory(data.type),
      type: data.type || 'other',
      name: data.name || 'Réservation',
      provider: data.provider || null,
      confirmation_number: data.confirmation_number || null,
      date_start: data.date_start || null,
      date_end: data.date_end || null,
      time_start: data.time_start || null,
      time_end: data.time_end || null,
      city: data.location || null,
      city_end: data.location_end || null,
      price: data.price || null,
      guests: data.guests || null,
      rooms: data.rooms || null,
      flight_number: data.flight_number || null,
      vehicle_type: data.vehicle_type || null,
      pickup_location: data.pickup_location || null,
      dropoff_location: data.dropoff_location || null,
      notes: data.notes || null,
      contact: data.contact || null,
      source: 'photo',
      created_at: new Date().toISOString()
    };
  } catch (e) {
    console.error('Parse error:', e, 'Text:', text);
    throw new Error('Format de réponse invalide');
  }
}

// ===== MAP TYPE TO CATEGORY =====
function mapTypeToCategory(type) {
  const map = {
    hotel: 'lodging',
    flight: 'flight',
    car: 'car',
    train: 'train',
    bus: 'train',
    ferry: 'train',
    activity: 'activity',
    restaurant: 'restaurant',
    show: 'activity',
    tour: 'activity',
    transfer: 'car'
  };
  return map[type] || 'other';
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
    const { photo } = JSON.parse(event.body || '{}');
    
    // Validation photo
    if (!photo || !photo.startsWith('data:image')) {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Photo invalide' }) };
    }

    // Auth
    const user = await verifyToken(event.headers.authorization);
    if (!user) {
      return { statusCode: 401, headers, body: JSON.stringify({ success: false, error: 'Connexion requise' }) };
    }

    // Récupérer email
    let email = user.email;
    if (!email) {
      const userRecord = await admin.auth().getUser(user.uid);
      email = userRecord.email;
    }

    // Quota
    const quota = await checkQuota(user.uid, email);
    if (!quota.allowed) {
      return { statusCode: 429, headers, body: JSON.stringify({ success: false, error: quota.error, usage: quota }) };
    }

    // Parse via Gemini
    const parseText = await callGemini(photo);
    const bookingData = parseBookingResponse(parseText);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        count: 1,
        items: [bookingData],
        usage: quota
      })
    };

  } catch (e) {
    console.error('❌ Error:', e.message);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: e.message }) };
  }
};
