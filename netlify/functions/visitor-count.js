export default async (request, context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*'
  };

  const P = process.env.ORT_FB_PROJECTID || '';
  const B = 3670;
  const I = 24;
  const U = 'https://firestore.googleapis.com/v1/projects/' + P + '/databases/(default)/documents/counters/visitor_count';

  if (!P) {
    return new Response(JSON.stringify({ count: B }), { status: 200, headers });
  }

  try {
    const url = new URL(request.url);
    const inc = url.searchParams.get('i') === '1';

    if (inc) {
      let c = 0;
      try {
        const r = await fetch(U);
        if (r.ok) {
          const d = await r.json();
          c = parseInt(d.fields?.count?.integerValue || '0', 10);
        }
      } catch (e) {}

      const n = c + I;
      await fetch(U, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            count: { integerValue: String(n) },
            u: { stringValue: new Date().toISOString() }
          }
        })
      });

      return new Response(JSON.stringify({ count: B + n }), { status: 200, headers });
    }

    const r = await fetch(U);
    if (r.ok) {
      const d = await r.json();
      const s = parseInt(d.fields?.count?.integerValue || '0', 10);
      return new Response(JSON.stringify({ count: B + s }), { status: 200, headers });
    }

    return new Response(JSON.stringify({ count: B }), { status: 200, headers });
  } catch (e) {
    return new Response(JSON.stringify({ count: B }), { status: 200, headers });
  }
};
