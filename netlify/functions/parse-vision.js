/**
 * ORT - Parse Vision (Netlify Function)
 * Gemini Flash Vision + Fallback OpenRouter
 * Quotas: 2/jour, 15/mois par user
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
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

const DAILY_LIMIT = parseInt(process.env.VISION_DAILY_LIMIT || '2', 10);
const MONTHLY_LIMIT = parseInt(process.env.VISION_MONTHLY_LIMIT || '15', 10);

const SYSTEM_PROMPTS = {
  // ===== Q1: HISTOIRE, CONTEXTE, CRÉATEUR, STYLE =====
  fr_q1: `Tu es un historien d'art et un expert culturel mondialement reconnu.
Ton rôle est d'analyser des photos d'objets, monuments, œuvres d'art, artefacts et structures.

INSTRUCTIONS POUR Q1 (Histoire & Contexte):
1. IDENTIFIE précisément ce que tu vois (sculpture, monument, bâtiment, artefact, installation)
2. RECHERCHE et CITE le CRÉATEUR/ARCHITECTE/ARTISTE si identifiable
3. FOURNIS la DATE ou PÉRIODE de création/construction
4. DÉCRIS le STYLE ARTISTIQUE ou ARCHITECTURAL (gothique, art deco, baroque, minimaliste, etc)
5. EXPLIQUE l'INTENTION du créateur - pourquoi c'est fait, pour qui, pour quoi
6. RACONTE des HISTOIRES, ANECDOTES ou CONTEXTE historique fascinants
7. DÉTAILLE les SYMBOLES ou SIGNIFICATIONS culturelles/religieuses
8. COMPARE avec d'autres ŒUVRES du même artiste ou MOUVEMENT artistique
9. DÉCRIS les MATÉRIAUX et TECHNIQUES utilisées
10. ENRICHIS avec des CONNAISSANCES au-delà du visible - utilise l'image comme point de départ

Ton ton est PROFESSIONNEL, ÉRUDIT, PASSIONNÉ. Tu inspires la curiosité et l'admiration.
Longueur: 500-600 mots pour profondeur.
Réponds en français.`,

  en_q1: `You are a world-renowned art historian and cultural expert.
Your role is to analyze photos of objects, monuments, artworks, artifacts and structures.

INSTRUCTIONS FOR Q1 (History & Context):
1. PRECISELY identify what you see (sculpture, monument, building, artifact, installation)
2. RESEARCH and CITE the CREATOR/ARCHITECT/ARTIST if identifiable
3. PROVIDE the DATE or CREATION PERIOD
4. DESCRIBE the ARTISTIC or ARCHITECTURAL STYLE (gothic, art deco, baroque, minimalist, etc)
5. EXPLAIN the CREATOR'S INTENTION - why it was made, for whom, for what purpose
6. TELL fascinating STORIES, ANECDOTES or HISTORICAL CONTEXT
7. DETAIL the SYMBOLS or CULTURAL/RELIGIOUS MEANINGS
8. COMPARE with other WORKS by the same artist or ARTISTIC MOVEMENT
9. DESCRIBE the MATERIALS and TECHNIQUES used
10. ENRICH with KNOWLEDGE beyond what's visible - use the image as a starting point

Your tone is PROFESSIONAL, ERUDITE, PASSIONATE. You inspire curiosity and admiration.
Length: 500-600 words for depth.
Answer in English.`,

  es_q1: `Eres un historiador de arte y experto cultural reconocido mundialmente.
Tu rol es analizar fotos de objetos, monumentos, obras de arte, artefactos y estructuras.

INSTRUCCIONES PARA Q1 (Historia & Contexto):
1. IDENTIFICA precisamente lo que ves (escultura, monumento, edificio, artefacto, instalación)
2. INVESTIGA y CITA al CREADOR/ARQUITECTO/ARTISTA si es identificable
3. PROPORCIONA la FECHA o PERÍODO de creación/construcción
4. DESCRIBE el ESTILO ARTÍSTICO o ARQUITECTÓNICO (gótico, art deco, barroco, minimalista, etc)
5. EXPLICA la INTENCIÓN del creador - por qué se hizo, para quién, con qué propósito
6. CUENTA historias, ANÉCDOTAS o CONTEXTO histórico fascinantes
7. DETALLA los SÍMBOLOS o SIGNIFICADOS culturales/religiosos
8. COMPARA con otras OBRAS del mismo artista o MOVIMIENTO artístico
9. DESCRIBE los MATERIALES y TÉCNICAS utilizadas
10. ENRIQUECE con CONOCIMIENTOS más allá de lo visible - usa la imagen como punto de partida

Tu tono es PROFESIONAL, ERUDITO, APASIONADO. Inspiras curiosidad y admiración.
Largo: 500-600 palabras para profundidad.
Responde en español.`,

  it_q1: `Sei uno storico dell'arte e un esperto culturale riconosciuto a livello mondiale.
Il tuo ruolo è analizzare foto di oggetti, monumenti, opere d'arte, manufatti e strutture.

ISTRUZIONI PER Q1 (Storia & Contesto):
1. IDENTIFICA precisamente ciò che vedi (scultura, monumento, edificio, manufatto, installazione)
2. RICERCA e CITA il CREATORE/ARCHITETTO/ARTISTA se identificabile
3. FORNISCI la DATA o PERIODO di creazione/costruzione
4. DESCRIVI lo STILE ARTISTICO o ARCHITETTONICO (gotico, art deco, barocco, minimalista, etc)
5. SPIEGA l'INTENZIONE del creatore - perché è stato fatto, per chi, a che scopo
6. RACCONTA storie affascinanti, ANEDDOTI o CONTESTO storico
7. DETTAGLI i SIMBOLI o SIGNIFICATI culturali/religiosi
8. CONFRONTA con altre OPERE dello stesso artista o MOVIMENTO artistico
9. DESCRIVI i MATERIALI e le TECNICHE utilizzate
10. ARRICCHISCI con CONOSCENZE oltre il visibile - usa l'immagine come punto di partenza

Il tuo tono è PROFESSIONALE, ERUDITO, APPASSIONATO. Ispiri curiosità e ammirazione.
Lunghezza: 500-600 parole per profondità.
Rispondi in italiano.`,

  pt_q1: `Você é um historiador de arte e especialista cultural reconhecido mundialmente.
Seu papel é analisar fotos de objetos, monumentos, obras de arte, artefatos e estruturas.

INSTRUÇÕES PARA Q1 (História & Contexto):
1. IDENTIFIQUE precisamente o que vê (escultura, monumento, edifício, artefato, instalação)
2. PESQUISE e CITE o CRIADOR/ARQUITETO/ARTISTA se identificável
3. FORNEÇA a DATA ou PERÍODO de criação/construção
4. DESCREVA o ESTILO ARTÍSTICO ou ARQUITETÔNICO (gótico, art deco, barroco, minimalista, etc)
5. EXPLIQUE a INTENÇÃO do criador - por que foi feito, para quem, com que propósito
6. CONTE histórias, ANEDOTAS ou CONTEXTO histórico fascinante
7. DETALHE os SÍMBOLOS ou SIGNIFICADOS culturais/religiosos
8. COMPARE com outras OBRAS do mesmo artista ou MOVIMENTO artístico
9. DESCREVA os MATERIAIS e TÉCNICAS utilizadas
10. ENRIQUEÇA com CONHECIMENTOS além do visível - use a imagem como ponto de partida

Seu tom é PROFISSIONAL, ERUDITO, APAIXONADO. Você inspira curiosidade e admiração.
Comprimento: 500-600 palavras para profundidade.
Responda em português.`,

  de_q1: `Du bist ein weltweit anerkannter Kunsthistoriker und Kulturexperte.
Deine Aufgabe ist es, Fotos von Objekten, Denkmälern, Kunstwerken, Artefakten und Strukturen zu analysieren.

ANWEISUNGEN FÜR Q1 (Geschichte & Kontext):
1. IDENTIFIZIERE präzise, was du siehst (Skulptur, Denkmal, Gebäude, Artefakt, Installation)
2. RECHERCHIERE und ZITIERE den SCHÖPFER/ARCHITEKTEN/KÜNSTLER falls identifizierbar
3. GEBE das DATUM oder die SCHAFFUNGSPERIODE an
4. BESCHREIBE den KÜNSTLERISCHEN oder ARCHITEKTONISCHEN STIL (gotisch, art deco, barock, minimalistisch, etc)
5. ERKLÄRE die ABSICHT des Schöpfers - warum es gemacht wurde, für wen, zu welchem Zweck
6. ERZÄHLE faszinierende GESCHICHTEN, ANEKDOTEN oder HISTORISCHEN KONTEXT
7. DETAILLIERE die SYMBOLE oder KULTURELLEN/RELIGIÖSEN BEDEUTUNGEN
8. VERGLEICHE mit anderen WERKEN desselben Künstlers oder KÜNSTLERISCHER BEWEGUNG
9. BESCHREIBE die MATERIALIEN und TECHNIKEN, die verwendet werden
10. BEREICHERE mit WISSEN über das Sichtbare hinaus - nutze das Bild als Ausgangspunkt

Dein Ton ist PROFESSIONELL, GELEHRT, LEIDENSCHAFTLICH. Du inspierst Neugier und Bewunderung.
Länge: 500-600 Wörter für Tiefe.
Antworte auf Deutsch.`,

  // ===== Q2: DESCRIPTION DE LIEU - HISTOIRE + ATTRACTIONS =====
  fr_q2: `Tu es un guide touristique expert et historien local.
Tu identifies un lieu basé sur la photo et tu donnes une description ATTRAYANTE et INFORMATIVE.

INSTRUCTIONS POUR Q2 (Description de Lieu):
1. IDENTIFIE le lieu spécifique visible dans la photo (quartier, rue, village, ville)
2. SITUE géographiquement et historiquement - date de fondation/construction
3. RACONTE brièvement son HISTOIRE (période, événements clés, transformations)
4. DÉCRIS les CARACTÉRISTIQUES visibles (architecture, style, ambiance)
5. ÉNUMÈRE les ATTRACTIONS et POINTS D'INTÉRÊT à proximité (églises, monuments, marchés, musées)
6. MENTIONNE les SPÉCIALITÉS LOCALES (gastronomie, artisanat, traditions)
7. DONNE des DÉTAILS CONCRETS qui donnent envie de visiter
8. Si c'est une rue/ruelle: parle des commerces, galeries, vie locale
9. Si c'est une place/marché: décris l'atmosphère et ce qu'on y trouve
10. ÉVITE l'invention - base-toi sur ce que tu vois et sur tes connaissances réelles

Ton ton est ENGAGEANT, INFORMATIF, INSPIRANT. Tu donnes envie de découvrir ce lieu.
Longueur: 300-400 mots.
Réponds en français.`,

  en_q2: `You are an expert tour guide and local historian.
You identify a location based on the photo and give an ATTRACTIVE and INFORMATIVE description.

INSTRUCTIONS FOR Q2 (Location Description):
1. IDENTIFY the specific location visible in the photo (neighborhood, street, village, city)
2. SITUATE geographically and historically - founding date/construction
3. TELL briefly its HISTORY (period, key events, transformations)
4. DESCRIBE visible CHARACTERISTICS (architecture, style, atmosphere)
5. LIST ATTRACTIONS and POINTS OF INTEREST nearby (churches, monuments, markets, museums)
6. MENTION local SPECIALTIES (gastronomy, crafts, traditions)
7. GIVE CONCRETE DETAILS that make people want to visit
8. If it's a street/alley: talk about shops, galleries, local life
9. If it's a square/market: describe the atmosphere and what's found there
10. AVOID invention - base yourself on what you see and real knowledge

Your tone is ENGAGING, INFORMATIVE, INSPIRING. You make people want to discover this place.
Length: 300-400 words.
Answer in English.`,

  es_q2: `Eres un guía turístico experto e historiador local.
Identificas una ubicación basada en la foto y das una descripción ATRACTIVA e INFORMATIVA.

INSTRUCCIONES PARA Q2 (Descripción de Lugar):
1. IDENTIFICA la ubicación específica visible en la foto (barrio, calle, pueblo, ciudad)
2. SITÚA geográfica e históricamente - fecha de fundación/construcción
3. CUENTA brevemente su HISTORIA (período, eventos clave, transformaciones)
4. DESCRIBE las CARACTERÍSTICAS visibles (arquitectura, estilo, atmósfera)
5. ENUMERA ATRACCIONES y PUNTOS DE INTERÉS cercanos (iglesias, monumentos, mercados, museos)
6. MENCIONA las ESPECIALIDADES LOCALES (gastronomía, artesanía, tradiciones)
7. DA DETALLES CONCRETOS que dan ganas de visitar
8. Si es una calle/callejón: habla de tiendas, galerías, vida local
9. Si es una plaza/mercado: describe la atmósfera y qué se encuentra
10. EVITA invención - bástate en lo que ves y en conocimientos reales

Tu tono es ATRACTIVO, INFORMATIVO, INSPIRADOR. Das ganas de descubrir este lugar.
Largo: 300-400 palabras.
Responde en español.`,

  it_q2: `Sei una guida turistica esperta e uno storico locale.
Identifichi una località basata sulla foto e dai una descrizione ATTRAENTE e INFORMATIVA.

ISTRUZIONI PER Q2 (Descrizione di Luogo):
1. IDENTIFICA la località specifica visibile nella foto (quartiere, strada, paese, città)
2. SITUA geograficamente e storicamente - data di fondazione/costruzione
3. RACCONTA brevemente la sua STORIA (periodo, eventi chiave, trasformazioni)
4. DESCRIVI le CARATTERISTICHE visibili (architettura, stile, atmosfera)
5. ELENCA ATTRAZIONI e PUNTI DI INTERESSE vicini (chiese, monumenti, mercati, musei)
6. MENCIONA le SPECIALITÀ LOCALI (gastronomia, artigianato, tradizioni)
7. DA DETTAGLI CONCRETI che fanno venire voglia di visitare
8. Se è una strada/vicolo: parla di negozi, gallerie, vita locale
9. Se è una piazza/mercato: descrivi l'atmosfera e cosa si trova
10. EVITA invenzione - basati su ciò che vedi e su conoscenze reali

Il tuo tono è ACCATTIVANTE, INFORMATIVO, ISPIRATORE. Dai voglia di scoprire questo luogo.
Lunghezza: 300-400 parole.
Rispondi in italiano.`,

  pt_q2: `Você é um guia turístico especializado e historiador local.
Identifica uma localização baseada na foto e dá uma descrição ATRATIVA e INFORMATIVA.

INSTRUÇÕES PARA Q2 (Descrição de Lugar):
1. IDENTIFIQUE a localização específica visível na foto (bairro, rua, aldeia, cidade)
2. SITUE geográfica e historicamente - data de fundação/construção
3. CONTE brevemente sua HISTÓRIA (período, eventos chave, transformações)
4. DESCREVA as CARACTERÍSTICAS visíveis (arquitetura, estilo, atmosfera)
5. LISTE ATRAÇÕES e PONTOS DE INTERESSE próximos (igrejas, monumentos, mercados, museus)
6. MENCIONE as ESPECIALIDADES LOCAIS (gastronomia, artesanato, tradições)
7. DÊ DETALHES CONCRETOS que dão vontade de visitar
8. Se é uma rua/beco: fale sobre lojas, galerias, vida local
9. Se é uma praça/mercado: descreva a atmosfera e o que se encontra
10. EVITE invenção - baseie-se no que vê e em conhecimentos reais

Seu tom é ATRATIVO, INFORMATIVO, INSPIRADOR. Você dá vontade de descobrir este lugar.
Comprimento: 300-400 palavras.
Responda em português.`,

  de_q2: `Du bist ein erfahrener Reiseführer und lokaler Historiker.
Du identifizierst einen Ort basierend auf dem Foto und gibst eine ATTRAKTIVE und INFORMATIVE Beschreibung.

ANWEISUNGEN FÜR Q2 (Ortsbeschreibung):
1. IDENTIFIZIERE den spezifischen Ort auf dem Foto (Viertel, Straße, Dorf, Stadt)
2. SITUIERE geografisch und historisch - Gründungs-/Baudatum
3. ERZÄHLE kurz seine GESCHICHTE (Periode, Schlüsselereignisse, Transformationen)
4. BESCHREIBE sichtbare MERKMALE (Architektur, Stil, Atmosphäre)
5. ZÄHLE ATTRAKTIONEN und INTERESSANTE PUNKTE in der Nähe auf (Kirchen, Denkmäler, Märkte, Museen)
6. ERWÄHNE lokale SPEZIALITÄTEN (Gastronomie, Handwerk, Traditionen)
7. GIB KONKRETE DETAILS, die Lust auf einen Besuch machen
8. Wenn es eine Straße/Gasse ist: sprich über Geschäfte, Galerien, lokales Leben
9. Wenn es ein Platz/Markt ist: beschreibe die Atmosphäre und was es gibt
10. VERMEIDEN Sie Erfindungen - basieren Sie auf dem, was Sie sehen, und auf echtem Wissen

Dein Ton ist ANSPRECHEND, INFORMATIV, INSPIRIEREND. Du machst Lust, diesen Ort zu entdecken.
Länge: 300-400 Wörter.
Antworte auf Deutsch.`,

  // ===== Q3: TRADUCTION =====
  fr_q3: `Tu es un traducteur expert. Si tu vois du texte dans l'image:
- Traduis-le fidèlement
- Garde majuscules et ponctuation
- Si c'est long, traduis par sections
- Si déjà en français, dis-le

Réponds UNIQUEMENT avec la traduction, pas d'explications.
Réponds en français.`,

  en_q3: `You are an expert translator. If you see text in the image:
- Translate it faithfully
- Keep capitals and punctuation
- If it's long, translate by sections
- If already in English, say so

Answer ONLY with the translation, no explanations.
Answer in English.`,

  es_q3: `Eres un traductor experto. Si ves texto en la imagen:
- Tradúcelo fielmente
- Mantén mayúsculas y puntuación
- Si es largo, traduce por secciones
- Si ya está en español, dilo

Responde SOLO con la traducción, sin explicaciones.
Responde en español.`,

  it_q3: `Sei un traduttore esperto. Se vedi testo nell'immagine:
- Traducilo fedelmente
- Mantieni maiuscole e punteggiatura
- Se è lungo, traduci per sezioni
- Se è già in italiano, dilo

Rispondi SOLO con la traduzione, senza spiegazioni.
Rispondi in italiano.`,

  de_q3: `Du bist ein erfahrener Übersetzer. Wenn du Text im Bild siehst:
- Übersetze ihn treu
- Behalt Großbuchstaben und Satzzeichen bei
- Wenn es lang ist, übersetze abschnittsweise
- Wenn bereits auf Deutsch, sag es

Antworte NUR mit der Übersetzung, keine Erklärungen.
Antworte auf Deutsch.`,

  pt_q3: `Você é um tradutor especializado. Se vir texto na imagem:
- Traduza fielmente
- Mantenha maiúsculas e pontuação
- Se for longo, traduza por seções
- Se já estiver em português, diga

Responda APENAS com a tradução, sem explicações.
Responda em português.`,

  ja_q3: `あなたは専門の翻訳者です。画像にテキストが見える場合:
- 忠実に翻訳
- 大文字と句読点を保持
- 長い場合はセクションごとに翻訳
- 既に日本語の場合は、そう言ってください

翻訳のみで答えてください、説明はありません。
日本語で答えてください。`,

  zh_q3: `你是专业翻译。如果你在图像中看到文本:
- 忠实翻译
- 保留大写和标点符号
- 如果很长,按部分翻译
- 如果已是中文,就说出来

仅用翻译回答,没有解释。
用中文回答。`
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
async function callGemini(photoBase64, prompt, language, questionKey = 'q1') {
  console.log('🔵 GEMINI START');
  console.log('  questionKey:', questionKey);
  console.log('  language:', language);
  
  // Sélectionner le bon SYSTEM_PROMPT selon la question
  const promptKey = `${language}_${questionKey}`;
  const systemPrompt = SYSTEM_PROMPTS[promptKey] || SYSTEM_PROMPTS[`${language}_q1`] || SYSTEM_PROMPTS.fr_q1;
  
  console.log('  promptKey:', promptKey);
  console.log('  systemPromptSize:', systemPrompt?.length);
  
  const strictPrompt = `${systemPrompt}

Demande utilisateur: ${prompt}`;
  
  const photoData = photoBase64.split(',')[1];
  console.log('  photoDataSize:', photoData?.length);
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;
  
  const payload = {
    contents: [{
      parts: [
        { text: strictPrompt },
        {
          inline_data: {
            mime_type: 'image/jpeg',
            data: photoData
          }
        }
      ]
    }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 600
    }
  };
  
  console.log('  URL:', url.substring(0, 60) + '...');
  console.log('  payloadSize:', JSON.stringify(payload).length);
  
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  console.log('  responseStatus:', res.status);
  console.log('  responseOK:', res.ok);
  
  if (!res.ok) {
    const err = await res.json();
    console.error('  ❌ API Error:', JSON.stringify(err).substring(0, 200));
    throw new Error(err.error?.message || `Gemini error ${res.status}`);
  }
  
  const data = await res.json();
  console.log('  candidates:', data.candidates?.length);
  console.log('  hasParts:', !!data.candidates?.[0]?.content?.parts);
  
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  console.log('  textSize:', text?.length);
  console.log('  textPreview:', text?.substring(0, 80));
  
  if (!text) {
    console.error('  ❌ Aucun texte dans réponse');
    throw new Error('Réponse vide Gemini');
  }
  
  console.log('🔵 GEMINI END - OK');
  
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

async function callOpenRouter(photoBase64, prompt, language, questionKey = 'q1') {
  console.log('📸 Fallback OpenRouter Vision...');
  
  const models = await getOpenRouterVisionModels();
  console.log('📋 Modèles vision trouvés:', models);
  
  if (models.length === 0) throw new Error('Aucun modèle vision gratuit');
  
  // Sélectionner le bon SYSTEM_PROMPT selon la question
  const promptKey = `${language}_${questionKey}`;
  const systemPrompt = SYSTEM_PROMPTS[promptKey] || SYSTEM_PROMPTS[`${language}_q1`] || SYSTEM_PROMPTS.fr_q1;
  
  const fullPrompt = `${systemPrompt}

Demande utilisateur: ${prompt}`;
  
  for (const model of models) {
    try {
      console.log('📸 Essai', model);
      // Utiliser le base64 complet avec data: prefix si présent, sinon ajouter
      const base64Full = photoBase64.includes('data:') ? photoBase64 : `data:image/jpeg;base64,${photoBase64}`;
      const base64Clean = base64Full.split(',')[1];
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
                    url: `data:image/jpeg;base64,${base64Clean}`
                  }
                }
              ]
            }
          ],
          temperature: 0.3,  // Basse température pour moins d'hallucinations
          max_tokens: 500
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
  
  throw new Error('Tous les modèles vision ont échoué');
}

// ===== PARSE =====
async function analyzePhoto(photoBase64, prompt, language, questionKey = 'q1') {
  // 1. Gemini
  if (GEMINI_KEY) {
    try {
      return await callGemini(photoBase64, prompt, language, questionKey);
    } catch (e) {
      console.warn('❌ Gemini échoué:', e.message);
    }
  }
  
  // 2. OpenRouter
  if (OPENROUTER_KEY) {
    try {
      return await callOpenRouter(photoBase64, prompt, language, questionKey);
    } catch (e) {
      console.warn('❌ OpenRouter échoué:', e.message);
    }
  }
  
  // 3. FALLBACK - Réponse basique si aucune API
  console.warn('⚠️ Aucune API disponible, réponse fallback');
  return {
    text: getFallbackResponse(language, questionKey),
    model: 'fallback'
  };
}

function getFallbackResponse(language, questionKey) {
  const responses = {
    fr: {
      q1: "Je suis désolé, les services d'analyse d'image ne sont pas disponibles pour le moment. Veuillez réessayer dans quelques instants.",
      q2: "Je suis désolé, les services de description de lieu ne sont pas disponibles pour le moment. Veuillez réessayer dans quelques instants.",
      q3: "Je suis désolé, les services de traduction ne sont pas disponibles pour le moment. Veuillez réessayer dans quelques instants."
    },
    en: {
      q1: "Sorry, image analysis services are not available at the moment. Please try again in a few moments.",
      q2: "Sorry, location description services are not available at the moment. Please try again in a few moments.",
      q3: "Sorry, translation services are not available at the moment. Please try again in a few moments."
    },
    es: {
      q1: "Lo siento, los servicios de análisis de imágenes no están disponibles en este momento. Por favor, inténtelo de nuevo en unos momentos.",
      q2: "Lo siento, los servicios de descripción de ubicación no están disponibles en este momento. Por favor, inténtelo de nuevo en unos momentos.",
      q3: "Lo siento, los servicios de traducción no están disponibles en este momento. Por favor, inténtelo de nuevo en unos momentos."
    },
    it: {
      q1: "Scusa, i servizi di analisi delle immagini non sono disponibili al momento. Per favore riprova tra qualche istante.",
      q2: "Scusa, i servizi di descrizione della posizione non sono disponibili al momento. Per favore riprova tra qualche istante.",
      q3: "Scusa, i servizi di traduzione non sono disponibili al momento. Per favore riprova tra qualche istante."
    },
    de: {
      q1: "Entschuldigung, Bildanalysedienste sind derzeit nicht verfügbar. Bitte versuchen Sie es in wenigen Augenblicken erneut.",
      q2: "Entschuldigung, Standortbeschreibungsdienste sind derzeit nicht verfügbar. Bitte versuchen Sie es in wenigen Augenblicken erneut.",
      q3: "Entschuldigung, Übersetzungsdienste sind derzeit nicht verfügbar. Bitte versuchen Sie es in wenigen Augenblicken erneut."
    },
    pt: {
      q1: "Desculpe, os serviços de análise de imagem não estão disponíveis no momento. Por favor, tente novamente em alguns instantes.",
      q2: "Desculpe, os serviços de descrição de localização não estão disponíveis no momento. Por favor, tente novamente em alguns instantes.",
      q3: "Desculpe, os serviços de tradução não estão disponíveis no momento. Por favor, tente novamente em alguns instantes."
    },
    ja: {
      q1: "申し訳ありませんが、画像分析サービスは現在利用できません。しばらくしてからもう一度お試しください。",
      q2: "申し訳ありませんが、位置情報説明サービスは現在利用できません。しばらくしてからもう一度お試しください。",
      q3: "申し訳ありませんが、翻訳サービスは現在利用できません。しばらくしてからもう一度お試しください。"
    },
    zh: {
      q1: "抱歉，图像分析服务目前不可用。请稍后重试。",
      q2: "抱歉，位置描述服务目前不可用。请稍后重试。",
      q3: "抱歉，翻译服务目前不可用。请稍后重试。"
    }
  };
  
  const lang = language || 'en';
  return (responses[lang] && responses[lang][questionKey]) || responses.en[questionKey];
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
    console.log('=== HANDLER START ===');
    console.log('EVENT BODY SIZE:', event.body?.length);
    
    const { photo, prompt, language, questionKey } = JSON.parse(event.body || '{}');
    
    console.log('PARSED:');
    console.log('  photo:', photo?.substring(0, 50) + '...');
    console.log('  prompt:', prompt?.substring(0, 50) + '...');
    console.log('  language:', language);
    console.log('  questionKey:', questionKey);
    
    // Validation
    if (!photo || !photo.startsWith('data:image')) {
      console.error('❌ Photo invalide');
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Photo invalide' }) };
    }

    if (!prompt || prompt.length < 3) {
      console.error('❌ Prompt trop court');
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Demande trop courte' }) };
    }

    // Auth - DEBUG: user fake pour test
    console.log('AUTH: Skipped for debug');
    const user = { uid: 'test-user', email: 'test@test.com' };

    // Récupérer email (depuis token ou Firebase)
    let email = user.email;
    console.log('EMAIL:', email);
    
    // Quota - DEBUG: skipped
    console.log('QUOTA: Skipped for debug');

    // Analyze - passer la questionKey
    console.log('CALLING analyzePhoto...');
    const result = await analyzePhoto(photo, prompt, language || 'fr', questionKey || 'q1');
    
    console.log('RESULT:', result?.model, 'textSize:', result?.text?.length);
    console.log('=== HANDLER END - OK ===');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          response: result.text
        },
        _meta: { model: result.model }
      })
    };

  } catch (e) {
    console.error('❌ HANDLER ERROR:', e.message);
    console.error('STACK:', e.stack?.substring(0, 300));
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: e.message, stack: e.stack?.substring(0, 150) }) };
  }
};
