export default async (request, context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*'
  };

  const PROJECT_ID = process.env.ORT_FB_PROJECTID || '';
  const BASE_COUNT = 18756;
  const INCREMENT = 57;
  const DOC_PATH = 'counters/visitor_count';
  const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${DOC_PATH}`;

  if (!PROJECT_ID) {
    return new Response(JSON.stringify({ count: BASE_COUNT }), { status: 200, headers });
  }

  try {
    const url = new URL(request.url);
    const shouldIncrement = url.searchParams.get('increment') === '1';

    if (shouldIncrement) {
      // Lire le document actuel
      let currentCount = 0;
      try {
        const getRes = await fetch(FIRESTORE_URL);
        if (getRes.ok) {
          const doc = await getRes.json();
          currentCount = parseInt(doc.fields?.count?.integerValue || '0', 10);
        }
      } catch (e) {
        // Document n'existe pas encore, on part de 0
      }

      // Écrire la nouvelle valeur
      const newCount = currentCount + INCREMENT;
      await fetch(FIRESTORE_URL, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            count: { integerValue: String(newCount) },
            updated_at: { stringValue: new Date().toISOString() }
          }
        })
      });

      return new Response(JSON.stringify({ count: BASE_COUNT + newCount }), { status: 200, headers });
    }

    // Lecture seule
    const getRes = await fetch(FIRESTORE_URL);
    if (getRes.ok) {
      const doc = await getRes.json();
      const storedCount = parseInt(doc.fields?.count?.integerValue || '0', 10);
      return new Response(JSON.stringify({ count: BASE_COUNT + storedCount }), { status: 200, headers });
    }

    return new Response(JSON.stringify({ count: BASE_COUNT }), { status: 200, headers });

  } catch (error) {
    return new Response(JSON.stringify({ count: BASE_COUNT }), { status: 200, headers });
  }
};
