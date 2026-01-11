// netlify/functions/route.mjs
// Format Netlify Functions v2 - utilise Request/Response standard

// ====== CONFIG ======
const MAPBOX_KEY = process.env.MAPBOX_KEY || '';
const ORS_KEY = process.env.ORS_KEY || '';
const GMAPS_KEY = process.env.GMAPS_KEY || '';

// ====== CACHE 10 MIN ======
const cache = new Map();
const TTL_MS = 10 * 60 * 1000;
const makeKey = (mode, start, end) => {
  const [slon, slat] = start.split(',').map(Number);
  const [elon, elat] = end.split(',').map(Number);
  const round = (n) => Math.round(n * 1000) / 1000;
  return `${mode}|${round(slon)},${round(slat)}|${round(elon)},${round(elat)}`;
};
const getCache = (k) => {
  const v = cache.get(k);
  if (!v) return null;
  if (Date.now() > v.exp) { cache.delete(k); return null; }
  return v.data;
};
const setCache = (k, data) => cache.set(k, { data, exp: Date.now() + TTL_MS });

// ====== UTILS ======
const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};
const okResp = (km, minutes) => ({ ok: true, km: Math.round(km), minutes: Math.round(minutes) });
const failResp = (msg) => ({ ok: false, error: msg });

// ====== RESPONSE HELPER (Netlify v2 - utilise Response standard) ======
const jsonResponse = (statusCode, data) => new Response(JSON.stringify(data), {
  status: statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Cache-Control': 'public, max-age=300'
  }
});

// ====== PROVIDERS ======
async function routeMapbox(start, end) {
  if (!MAPBOX_KEY) throw new Error('NO_MAPBOX_KEY');
  const [slon, slat] = start.split(',');
  const [elon, elat] = end.split(',');
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${slon},${slat};${elon},${elat}?overview=false&access_token=${MAPBOX_KEY}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Mapbox_${r.status}`);
  const j = await r.json();
  if (!j.routes?.[0]) throw new Error('Mapbox_NO_ROUTE');
  const route = j.routes[0];
  return { km: route.distance / 1000, minutes: route.duration / 60 };
}

async function routeORS(start, end) {
  if (!ORS_KEY) throw new Error('NO_ORS_KEY');
  const url = `https://api.openrouteservice.org/v2/directions/driving-car?start=${start}&end=${end}`;
  const r = await fetch(url, { headers: { Authorization: ORS_KEY } });
  if (!r.ok) throw new Error(`ORS_${r.status}`);
  const j = await r.json();
  if (!j.features?.[0]?.properties?.summary) throw new Error('ORS_NO_DATA');
  const s = j.features[0].properties.summary;
  return { km: s.distance / 1000, minutes: s.duration / 60 };
}

async function routeGoogle(start, end) {
  if (!GMAPS_KEY) throw new Error('NO_GMAPS_KEY');
  const [slon, slat] = start.split(',').map(Number);
  const [elon, elat] = end.split(',').map(Number);
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${slat},${slon}&destination=${elat},${elon}&mode=driving&key=${GMAPS_KEY}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Google_${r.status}`);
  const j = await r.json();
  if (!j.routes?.[0]?.legs?.[0]) throw new Error('Google_NO_ROUTE');
  const leg = j.routes[0].legs[0];
  return { km: leg.distance.value / 1000, minutes: leg.duration.value / 60 };
}

async function routeOSRM(start, end, profile) {
  const [slon, slat] = start.split(',');
  const [elon, elat] = end.split(',');
  const url = `https://router.project-osrm.org/route/v1/${profile}/${slon},${slat};${elon},${elat}?overview=false`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`OSRM_${r.status}`);
  const j = await r.json();
  if (!j.routes?.[0]) throw new Error('OSRM_NO_ROUTE');
  return { km: j.routes[0].distance / 1000, minutes: j.routes[0].duration / 60 };
}

function routeEstimate(start, end) {
  const [slon, slat] = start.split(',').map(Number);
  const [elon, elat] = end.split(',').map(Number);
  const km = haversineKm(slat, slon, elat, elon);
  return { km, minutes: (km / 65) * 60 };
}

// ====== MAIN HANDLER (Netlify Functions v2 - request/Response standard) ======
export default async (request, context) => {
  try {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return jsonResponse(200, { ok: true });
    }

    // Parse query parameters from request.url (standard Web API)
    const url = new URL(request.url);
    const params = url.searchParams;
    
    const mode = params.get('mode') || 'driving';
    const start = params.get('start');
    const end = params.get('end');

    console.log(`[ROUTE] mode=${mode} start=${start} end=${end}`);

    if (!start || !end) {
      return jsonResponse(400, failResp('Missing: start=lon,lat & end=lon,lat'));
    }

    const validModes = ['driving', 'cycling', 'walking'];
    if (!validModes.includes(mode)) {
      return jsonResponse(400, failResp('Invalid mode. Use: driving, cycling, walking'));
    }

    const key = makeKey(mode, start, end);
    const cached = getCache(key);
    if (cached) {
      console.log(`[ROUTE] ✅ Cache hit`);
      return jsonResponse(200, cached);
    }

    let out;

    if (mode === 'driving') {
      // DRIVING: Mapbox → ORS → Google → OSRM → Estimate
      try {
        const r = await routeMapbox(start, end);
        out = okResp(r.km, r.minutes);
        console.log(`[ROUTE] ✅ Mapbox: ${out.km}km`);
      } catch (e1) {
        console.log(`[ROUTE] ⚠️ Mapbox: ${e1.message}`);
        try {
          const r = await routeORS(start, end);
          out = okResp(r.km, r.minutes);
          console.log(`[ROUTE] ✅ ORS: ${out.km}km`);
        } catch (e2) {
          console.log(`[ROUTE] ⚠️ ORS: ${e2.message}`);
          try {
            const r = await routeGoogle(start, end);
            out = okResp(r.km, r.minutes);
            console.log(`[ROUTE] ✅ Google: ${out.km}km`);
          } catch (e3) {
            console.log(`[ROUTE] ⚠️ Google: ${e3.message}`);
            try {
              const r = await routeOSRM(start, end, 'car');
              out = okResp(r.km, r.minutes);
              console.log(`[ROUTE] ✅ OSRM: ${out.km}km`);
            } catch (e4) {
              console.log(`[ROUTE] ⚠️ OSRM: ${e4.message}`);
              const r = routeEstimate(start, end);
              out = okResp(r.km, r.minutes);
              console.log(`[ROUTE] ✅ Estimate: ${out.km}km`);
            }
          }
        }
      }
    } else if (mode === 'cycling') {
      // CYCLING: OSRM bike → Estimate
      try {
        const r = await routeOSRM(start, end, 'bike');
        out = okResp(r.km, r.minutes);
        console.log(`[ROUTE] ✅ OSRM bike: ${out.km}km`);
      } catch (e) {
        console.log(`[ROUTE] ⚠️ OSRM bike: ${e.message}`);
        const [slon, slat] = start.split(',').map(Number);
        const [elon, elat] = end.split(',').map(Number);
        const km = haversineKm(slat, slon, elat, elon);
        out = okResp(km, (km / 17) * 60);
        console.log(`[ROUTE] ✅ Estimate bike: ${out.km}km`);
      }
    } else if (mode === 'walking') {
      // WALKING: OSRM foot → Estimate
      try {
        const r = await routeOSRM(start, end, 'foot');
        out = okResp(r.km, r.minutes);
        console.log(`[ROUTE] ✅ OSRM foot: ${out.km}km`);
      } catch (e) {
        console.log(`[ROUTE] ⚠️ OSRM foot: ${e.message}`);
        const [slon, slat] = start.split(',').map(Number);
        const [elon, elat] = end.split(',').map(Number);
        const km = haversineKm(slat, slon, elat, elon);
        out = okResp(km, (km / 5) * 60);
        console.log(`[ROUTE] ✅ Estimate foot: ${out.km}km`);
      }
    }

    setCache(key, out);
    return jsonResponse(200, out);

  } catch (e) {
    console.error('[ROUTE] FATAL:', e.message);
    return jsonResponse(500, failResp(String(e.message || e)));
  }
};

// Export config for Netlify
export const config = {
  path: "/.netlify/functions/route"
};
