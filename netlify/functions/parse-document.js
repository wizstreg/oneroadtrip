/**
 * ORT - Parse Document (Netlify Function)
 * OCR documents d'identité via Gemini Vision
 * Quotas: 5/jour, 30/mois par user
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

const DAILY_LIMIT = parseInt(process.env.DOC_DAILY_LIMIT || '5', 10);
const MONTHLY_LIMIT = parseInt(process.env.DOC_MONTHLY_LIMIT || '30', 10);
const MAX_DOCUMENTS = 8; // Max docs par utilisateur

// ===== PROMPTS OCR =====
const OCR_PROMPT = `Tu es un expert en reconnaissance de documents d'identité.
Analyse cette photo de document et extrais les informations.

INSTRUCTIONS:
1. Identifie le TYPE de document (passport, visa, id_card, driving_license, health_card, other)
2. Extrais TOUTES les informations lisibles
3. Si une info n'est pas visible/lisible, mets null
4. Formate les dates en YYYY-MM-DD
5. Codes pays en ISO 2 lettres (FR, US, IT, etc.)

RÉPONDS UNIQUEMENT avec ce JSON (pas de texte avant/après):
{
  "type": "passport|visa|id_card|driving_license|health_card|other",
  "document_name": "nom du document (ex: Passeport français)",
  "holder_name": "NOM Prénom du titulaire",
  "document_number": "numéro du document",
  "expiry_date": "YYYY-MM-DD ou null",
  "issue_date": "YYYY-MM-DD ou null",
  "birth_date": "YYYY-MM-DD ou null",
  "country_code": "FR|US|IT|...",
  "nationality": "nationalité si visible",
  "issuing_authority": "autorité émettrice si visible",
  "additional_info": "autres infos utiles ou null"
}`;

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

  const ref = db.collection('users').doc(uid).collection('doc_usage');
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

// ===== CHECK MAX DOCUMENTS =====
async function checkDocumentLimit(uid) {
  const docsRef = db.collection('users').doc(uid).collection('documents');
  const snapshot = await docsRef.get();
  return {
    count: snapshot.size,
    limit: MAX_DOCUMENTS,
    allowed: snapshot.size < MAX_DOCUMENTS
  };
}

// ===== GEMINI VISION OCR =====
async function callGemini(photoBase64) {
  console.log('📄 Gemini OCR Document...');
  
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: OCR_PROMPT },
          {
            inline_data: {
              mime_type: 'image/jpeg',
              data: photoBase64.includes(',') ? photoBase64.split(',')[1] : photoBase64
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.1, // Très bas pour OCR précis
        maxOutputTokens: 500
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
function parseOcrResponse(text) {
  try {
    // Nettoyer le texte (enlever ```json etc.)
    let clean = text.trim();
    if (clean.startsWith('```')) {
      clean = clean.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
    }
    return JSON.parse(clean);
  } catch (e) {
    console.error('Parse error:', e, 'Text:', text);
    throw new Error('Format de réponse invalide');
  }
}

// ===== SAVE DOCUMENT =====
async function saveDocument(uid, docData, thumbnail) {
  const docId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  
  const document = {
    id: docId,
    type: docData.type || 'other',
    name: docData.document_name || 'Document',
    holderName: docData.holder_name || null,
    number: docData.document_number || null,
    expiryDate: docData.expiry_date || null,
    issueDate: docData.issue_date || null,
    birthDate: docData.birth_date || null,
    countryCode: docData.country_code || null,
    nationality: docData.nationality || null,
    issuingAuthority: docData.issuing_authority || null,
    additionalInfo: docData.additional_info || null,
    thumbnail: thumbnail, // Base64 réduit
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
  
  await db.collection('users').doc(uid).collection('documents').doc(docId).set(document);
  
  return document;
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
    const { photo, save } = JSON.parse(event.body || '{}');
    
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

    // Quota OCR
    const quota = await checkQuota(user.uid, email);
    if (!quota.allowed) {
      return { statusCode: 429, headers, body: JSON.stringify({ success: false, error: quota.error, usage: quota }) };
    }

    // OCR via Gemini
    const ocrText = await callGemini(photo);
    const docData = parseOcrResponse(ocrText);
    
    let savedDoc = null;
    
    // Sauvegarder si demandé
    if (save) {
      // Vérifier limite documents
      const docLimit = await checkDocumentLimit(user.uid);
      if (!docLimit.allowed) {
        return { 
          statusCode: 200, 
          headers, 
          body: JSON.stringify({ 
            success: true, 
            data: docData, 
            saved: false, 
            error: `Limite de ${MAX_DOCUMENTS} documents atteinte`,
            docLimit 
          }) 
        };
      }
      
      // Créer thumbnail (garder version réduite)
      const thumbnail = photo.length > 50000 ? photo.substring(0, 50000) + '...' : photo;
      savedDoc = await saveDocument(user.uid, docData, thumbnail);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: docData,
        saved: !!savedDoc,
        document: savedDoc,
        usage: quota
      })
    };

  } catch (e) {
    console.error('❌ Error:', e.message);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: e.message }) };
  }
};
