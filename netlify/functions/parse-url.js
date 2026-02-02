/**
 * ORT - Parse URL Starter (Netlify Function)
 * 
 * This function:
 * 1. Verifies authentication
 * 2. Checks quota
 * 3. Creates job in Firestore
 * 4. Triggers background function
 * 5. Returns jobId immediately
 * 
 * The background function (parse-url-background.js) does the actual work.
 */

import admin from 'firebase-admin';

// Init Firebase Admin
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.ORT_FB_PROJECTID
    });
  } catch (e) {
    admin.initializeApp({
      projectId: process.env.ORT_FB_PROJECTID
    });
  }
}
const db = admin.firestore();

const DAILY_LIMIT = parseInt(process.env.URL_PARSE_DAILY_LIMIT || '5', 10);
const MONTHLY_LIMIT = parseInt(process.env.URL_PARSE_MONTHLY_LIMIT || '30', 10);

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
  if (email && VIP.includes(Buffer.from(email).toString('base64'))) {
    return { allowed: true, count: 0, limit: 9999, remaining: 9999 };
  }
  
  const ref = db.collection('users').doc(uid).collection('url_parse_usage');
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const today = now.toISOString().split('T')[0];
  
  const monthRef = ref.doc(month);
  const dayRef = ref.doc(today);
  
  const [monthDoc, dayDoc] = await Promise.all([monthRef.get(), dayRef.get()]);
  
  let monthData = monthDoc.exists ? monthDoc.data() : { count: 0 };
  let dayData = dayDoc.exists ? dayDoc.data() : { count: 0 };

  if (monthData.count >= MONTHLY_LIMIT) {
    return { allowed: false, error: 'Monthly quota reached', count: monthData.count, limit: MONTHLY_LIMIT, remaining: 0 };
  }
  if (dayData.count >= DAILY_LIMIT) {
    return { allowed: false, error: 'Daily quota reached', count: monthData.count, limit: MONTHLY_LIMIT, remaining: MONTHLY_LIMIT - monthData.count };
  }

  await Promise.all([
    monthRef.set({ count: (monthData.count || 0) + 1, month }),
    dayRef.set({ count: (dayData.count || 0) + 1, date: today })
  ]);

  return { allowed: true, count: monthData.count + 1, limit: MONTHLY_LIMIT, remaining: MONTHLY_LIMIT - monthData.count - 1 };
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
    const { url, language } = await request.json();
    
    // Validate URL
    if (!url) {
      return new Response(JSON.stringify({ success: false, error: 'URL required' }), { status: 400, headers });
    }
    
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      return new Response(JSON.stringify({ success: false, error: 'Invalid URL format' }), { status: 400, headers });
    }

    // Auth
    const user = await verifyToken(request.headers.get('authorization'));
    if (!user) {
      return new Response(JSON.stringify({ success: false, error: 'Authentication required' }), { status: 401, headers });
    }

    // Quota
    const quota = await checkQuota(user.uid, user.email);
    if (!quota.allowed) {
      return new Response(JSON.stringify({ success: false, error: quota.error, usage: quota }), { status: 429, headers });
    }

    // Generate job ID
    const jobId = `${user.uid}_${Date.now()}`;
    
    // Create job in Firestore
    const jobRef = db.collection('users').doc(user.uid).collection('url_parse_jobs').doc(jobId);
    await jobRef.set({
      status: 'pending',
      url: url,
      language: language || 'en',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`📋 Job ${jobId} created, triggering background function...`);
    
    // Trigger background function (fire-and-forget)
    const bgUrl = new URL(request.url);
    bgUrl.pathname = '/.netlify/functions/parse-url-background';
    
    fetch(bgUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId,
        url,
        language: language || 'en',
        uid: user.uid,
        email: user.email
      })
    }).catch(e => console.warn('Background trigger error:', e.message));
    
    // Return immediately with jobId
    return new Response(JSON.stringify({
      success: true,
      jobId: jobId,
      status: 'pending',
      message: 'Job started. Poll Firestore for status.',
      usage: quota
    }), { status: 202, headers });

  } catch (e) {
    console.error('❌ Error:', e.message);
    return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers });
  }
};
