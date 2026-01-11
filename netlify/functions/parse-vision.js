/**
 * ORT - Parse Vision (Netlify Function)
 * Gemini Flash Vision + Fallback OpenRouter
 * Quotas: 2/jour, 15/mois par user
 */

import admin from 'firebase-admin';

// Init Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.ORT_FB_PROJECTID
  });
}
const db = admin.firestore();

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

const DAILY_LIMIT = parseInt(process.env.VISION_DAILY_LIMIT || '2', 10);
const MONTHLY_LIMIT = parseInt(process.env.VISION_MONTHLY_LIMIT || '15', 10);

// Prompts par langue (clés simples: fr, en, es, etc.)
const SYSTEM_PROMPTS = {
  fr: `Tu es un assistant d'IA spécialisé dans l'analyse d'images pour les voyageurs.
RÈGLES:
1. Réponds UNIQUEMENT en texte naturel, sans JSON, sans markdown, sans listes
2. Sois descriptif et détaillé
3. Sois enthousiaste et bienveillant
4. Max 300 mots`,
  
  en: `You are an AI assistant specialized in image analysis for travelers.
RULES:
1. Answer ONLY in natural text, no JSON, no markdown, no lists
2. Be descriptive and detailed
3. Be enthusiastic and kind
4. Max 300 words`,

  es: `Eres un asistente de IA especializado en análisis de imágenes para viajeros.
REGLAS:
1. Responde SOLO en texto natural, sin JSON, sin markdown, sin listas
2. Sé descriptivo y detallado
3. Sé entusiasta y amable
4. Máx 300 palabras`,

  it: `Sei un assistente di IA specializzato nell'analisi di immagini per i viaggiatori.
REGOLE:
1. Rispondi SOLO in testo naturale, senza JSON, senza markdown, senza elenchi
2. Sii descrittivo e dettagliato
3. Sii entusiasta e gentile
4. Max 300 parole`,

  de: `Du bist ein KI-Assistent, der sich auf Bildanalyse für Reisende spezialisiert hat.
REGELN:
1. Antworte NUR in natürlicher Sprache, ohne JSON, ohne Markdown, ohne Listen
2. Sei aussagekräftig und detailliert
3. Sei enthusiastisch und freundlich
4. Max 300 Wörter`,

  pt: `Você é um assistente de IA especializado em análise de imagens para viajantes.
REGRAS:
1. Responda APENAS em texto natural, sem JSON, sem markdown, sem listas
2. Seja descritivo e detalhado
3. Seja entusiasta e gentil
4. Máx 300 palavras`,

  ja: `あなたは旅行者向けの画像分析を専門とするAIアシスタントです。
ルール：
1. 自然なテキストのみで回答し、JSON、マークダウン、リストなし
2. 説明的で詳細に
3. 熱狂的で親切に
4. 最大300語`,

  zh: `你是一个专门为旅行者进行图像分析的AI助手。
规则：
1. 仅用自然文本回答，没有JSON、markdown或列表
2. 要有描述性和详细性
3. 要热情和友好
4. 最多300字`
};

// ===== AUTH =====
async function verifyToken(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    return await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
  } catch { return null; }
}

// ===== QUOTA =====
async function checkQuota(uid, email) {
  // Exception: marcsorci@free.fr illimité
  if (email === 'marcsorci@free.fr') {
    return {
      allowed: true,
      count: 0,
      limit: -1,
      remaining: -1,
      daily: { count: 0, limit: -1 }
    };
  }

  const ref = db.collection('users').doc(uid).collection('vision_usage');
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  
  // Document mensuel
  const monthRef = ref.doc(month);
  const monthDoc = await monthRef.get();
  let monthData = monthDoc.exists ? monthDoc.data() : { count: 0, month };
  
  // Document du jour
  const today = now.toISOString().split('T')[0];
  const dayRef = ref.doc(today);
  const dayDoc = await dayRef.get();
  let dayData = dayDoc.exists ? dayDoc.data() : { count: 0, date: today };

  // Vérifier quotas
  if (monthData.count >= MONTHLY_LIMIT) {
    return {
      allowed: false,
      error: 'Quota mensuel atteint',
      count: monthData.count,
      limit: MONTHLY_LIMIT,
      remaining: 0,
      daily: { count: dayData.count, limit: DAILY_LIMIT }
    };
  }

  if (dayData.count >= DAILY_LIMIT) {
    return {
      allowed: false,
      error: 'Quota journalier atteint',
      count: monthData.count,
      limit: MONTHLY_LIMIT,
      remaining: MONTHLY_LIMIT - monthData.count,
      daily: { count: dayData.count, limit: DAILY_LIMIT }
    };
  }

  // Incrémenter
  monthData.count++;
  dayData.count++;
  
  await monthRef.set(monthData);
  await dayRef.set(dayData);

  return {
    allowed: true,
    count: monthData.count,
    limit: MONTHLY_LIMIT,
    remaining: MONTHLY_LIMIT - monthData.count,
    daily: { count: dayData.count, limit: DAILY_LIMIT }
  };
}

// ===== GEMINI VISION =====
async function callGemini(photoBase64, prompt, language) {
  console.log('📸 Essai Gemini Flash Vision...');
  
  // Récupérer le prompt système pour la langue (fallback sur EN)
  const systemPrompt = SYSTEM_PROMPTS[language] || SYSTEM_PROMPTS.en;
  const fullPrompt = `${systemPrompt}\n\nDemande utilisateur: ${prompt}`;
  
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: fullPrompt },
          {
            inline_data: {
              mime_type: 'image/jpeg',
              data: photoBase64.split(',')[1]
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 600
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
  
  return { text, model: 'Gemini Flash' };
}

// ===== OPENROUTER VISION =====
async function getOpenRouterVisionModels() {
  const res = await fetch('https://openrouter.ai/api/v1/models', {
    headers: { 'Authorization': `Bearer ${OPENROUTER_KEY}` }
  });
  if (!res.ok) return [];
  const data = await res.json();
  
  console.log('📋 Total modèles OpenRouter:', data.data.length);
  
  // Chercher les modèles contenant "vision" dans l'ID
  const visionModels = data.data
    .filter(m => m.id.includes('vision'))
    .map(m => m.id)
    .slice(0, 5);
  
  console.log('📋 Modèles vision trouvés:', visionModels.length, visionModels);
  
  return visionModels;
}

async function callOpenRouter(photoBase64, prompt, language) {
  console.log('📸 Fallback OpenRouter Vision...');
  
  const models = await getOpenRouterVisionModels();
  console.log('📋 Modèles vision gratuits:', models);
  
  if (models.length === 0) throw new Error('Aucun modèle vision gratuit');
  
  // Récupérer le prompt système pour la langue (fallback sur EN)
  const systemPrompt = SYSTEM_PROMPTS[language] || SYSTEM_PROMPTS.en;
  const fullPrompt = `${systemPrompt}\n\nDemande utilisateur: ${prompt}`;
  
  for (const model of models) {
    try {
      console.log('📸 Essai', model);
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
            {
              role: 'user',
              content: [
                { type: 'text', text: fullPrompt },
                {
                  type: 'image_url',
                  image_url: {
                    url: photoBase64
                  }
                }
              ]
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      console.log('  responseStatus:', res.status);
      
      if (!res.ok) {
        const errData = await res.json();
        console.error('  ❌ Erreur:', JSON.stringify(errData).substring(0, 200));
        continue;
      }

      const data = await res.json();
      console.log('  ✅ Response OK, choices:', data.choices?.length);
      
      const text = data.choices?.[0]?.message?.content?.trim();
      console.log('  text:', text?.substring(0, 100));
      
      if (text) {
        console.log('✅ Succès avec:', model);
        return { text, model };
      }
    } catch (e) {
      console.warn('❌', model, e.message);
    }
  }
  
  throw new Error('Tous les modèles vision ont échoué');
}

// ===== PARSE =====
async function analyzePhoto(photoBase64, prompt, language) {
  // 1. Gemini
  if (GEMINI_KEY) {
    try {
      return await callGemini(photoBase64, prompt, language);
    } catch (e) {
      console.warn('❌ Gemini échoué:', e.message);
    }
  }
  
  // 2. OpenRouter
  if (OPENROUTER_KEY) {
    return await callOpenRouter(photoBase64, prompt, language);
  }
  
  throw new Error('Aucune API configurée');
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
    const { photo, prompt, language } = await request.json();
    
    // Validation
    if (!photo || !photo.startsWith('data:image')) {
      return new Response(JSON.stringify({ success: false, error: 'Photo invalide' }), { status: 400, headers });
    }

    if (!prompt || prompt.length < 3) {
      return new Response(JSON.stringify({ success: false, error: 'Demande trop courte' }), { status: 400, headers });
    }

    // Auth
    const user = await verifyToken(request.headers.get('authorization'));
    if (!user) {
      return new Response(JSON.stringify({ success: false, error: 'Connexion requise' }), { status: 401, headers });
    }

    // Récupérer email (depuis token ou Firebase)
    let email = user.email;
    if (!email) {
      const userRecord = await admin.auth().getUser(user.uid);
      email = userRecord.email;
    }

    // Quota
    const quota = await checkQuota(user.uid, email);
    if (!quota.allowed) {
      return new Response(JSON.stringify({ success: false, error: quota.error, usage: quota }), { status: 429, headers });
    }

    // Analyze
    const result = await analyzePhoto(photo, prompt, language || 'fr');
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        response: result.text
      },
      usage: quota,
      _meta: { model: result.model }
    }), { status: 200, headers });

  } catch (e) {
    console.error('❌ Error:', e.message);
    return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers });
  }
};
