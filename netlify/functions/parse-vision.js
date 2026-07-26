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
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

const DAILY_LIMIT = parseInt(process.env.VISION_DAILY_LIMIT || '2', 10);
const MONTHLY_LIMIT = parseInt(process.env.VISION_MONTHLY_LIMIT || '15', 10);

// Prompts par langue (clés simples: fr, en, es, etc.)
const SYSTEM_PROMPTS = {
  fr: `Tu es un guide de voyage expert. Quand on te montre une image et une question, EXPLIQUE le sujet : contexte historique, culturel, pratique, anecdotes utiles au voyageur. Ne te contente pas de décrire ce que tu vois — informe, raconte, donne les clés pour comprendre.
RÈGLES:
1. Réponds en texte naturel, sans JSON, sans markdown, sans listes
2. Privilégie les explications et le contexte sur la description visuelle
3. Ton chaleureux et passionné, comme un vrai guide local
4. Max 300 mots`,
  
  en: `You are an expert travel guide. When shown an image and a question, EXPLAIN the subject: historical, cultural, practical context, useful anecdotes for travelers. Don't just describe what you see — inform, tell the story, give the keys to understanding.
RULES:
1. Answer in natural text, no JSON, no markdown, no lists
2. Prioritize explanations and context over visual description
3. Warm and passionate tone, like a real local guide
4. Max 300 words`,

  es: `Eres un guía de viaje experto. Cuando te muestren una imagen y una pregunta, EXPLICA el tema: contexto histórico, cultural, práctico, anécdotas útiles para el viajero. No te limites a describir lo que ves — informa, cuenta la historia, da las claves para entender.
REGLAS:
1. Responde en texto natural, sin JSON, sin markdown, sin listas
2. Prioriza explicaciones y contexto sobre descripción visual
3. Tono cálido y apasionado, como un guía local
4. Máx 300 palabras`,

  it: `Sei una guida turistica esperta. Quando ti mostrano un'immagine e una domanda, SPIEGA l'argomento: contesto storico, culturale, pratico, aneddoti utili per il viaggiatore. Non limitarti a descrivere ciò che vedi — informa, racconta la storia, dai le chiavi per capire.
REGOLE:
1. Rispondi in testo naturale, senza JSON, senza markdown, senza elenchi
2. Dai priorità a spiegazioni e contesto rispetto alla descrizione visiva
3. Tono caloroso e appassionato, come una vera guida locale
4. Max 300 parole`,

  de: `Du bist ein erfahrener Reiseführer. Wenn dir ein Bild und eine Frage gezeigt werden, ERKLÄRE das Thema: historischer, kultureller, praktischer Kontext, nützliche Anekdoten für Reisende. Beschreibe nicht nur, was du siehst — informiere, erzähle die Geschichte, gib die Schlüssel zum Verständnis.
REGELN:
1. Antworte in natürlicher Sprache, ohne JSON, ohne Markdown, ohne Listen
2. Priorisiere Erklärungen und Kontext über visuelle Beschreibung
3. Warmer und leidenschaftlicher Ton, wie ein echter lokaler Guide
4. Max 300 Wörter`,

  pt: `Você é um guia de viagem especialista. Quando lhe mostrarem uma imagem e uma pergunta, EXPLIQUE o assunto: contexto histórico, cultural, prático, anedotas úteis para o viajante. Não se limite a descrever o que vê — informe, conte a história, dê as chaves para compreender.
REGRAS:
1. Responda em texto natural, sem JSON, sem markdown, sem listas
2. Priorize explicações e contexto sobre descrição visual
3. Tom caloroso e apaixonado, como um verdadeiro guia local
4. Máx 300 palavras`,

  ja: `あなたは旅行のエキスパートガイドです。画像と質問を見せられたら、テーマを説明してください：歴史的・文化的・実用的な背景、旅行者に役立つ逸話。見たものを描写するだけでなく、情報を伝え、物語を語り、理解の鍵を与えてください。
ルール：
1. 自然なテキストで回答、JSON・マークダウン・リストなし
2. 視覚的な描写より説明と背景を優先
3. 本物の地元ガイドのような温かく情熱的なトーン
4. 最大300語`,

  zh: `你是一位专业旅行向导。当展示图片和问题时，请解释主题：历史、文化、实用背景，对旅行者有用的趣闻。不要只描述你看到的——要告知、讲述故事、给出理解的关键。
规则：
1. 用自然文本回答，没有JSON、markdown或列表
2. 优先解释和背景，而非视觉描述
3. 像真正的当地向导一样温暖而热情的语气
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
  
  const systemPrompt = SYSTEM_PROMPTS[language] || SYSTEM_PROMPTS.en;
  const userLabel = { fr: 'Question du voyageur', en: 'Traveler question', es: 'Pregunta del viajero', it: 'Domanda del viaggiatore', de: 'Frage des Reisenden', pt: 'Pergunta do viajante', ja: '旅行者の質問', zh: '旅行者的问题' };
  const fullPrompt = `${systemPrompt}\n\n${userLabel[language] || userLabel.en}: ${prompt}`;
  
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`, {
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
        maxOutputTokens: 8192,
        thinkingConfig: { thinkingLevel: 'low' }
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
  
  return { text, model: GEMINI_MODEL };
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
  
  const systemPrompt = SYSTEM_PROMPTS[language] || SYSTEM_PROMPTS.en;
  const userLabel = { fr: 'Question du voyageur', en: 'Traveler question', es: 'Pregunta del viajero', it: 'Domanda del viaggiatore', de: 'Frage des Reisenden', pt: 'Pergunta do viajante', ja: '旅行者の質問', zh: '旅行者的问题' };
  const fullPrompt = `${systemPrompt}\n\n${userLabel[language] || userLabel.en}: ${prompt}`;
  
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
