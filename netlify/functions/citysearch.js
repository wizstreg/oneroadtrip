// netlify/functions/citysearch.js
// Recherche de villes via Photon (Komoot) + Nominatim fallback

const UA = 'OneRoadTrip/2.0 (https://oneroadtrip.com)';

// Cache en mémoire (persiste entre les invocations à chaud)
const cache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 min

function getCached(key) {
  const item = cache.get(key);
  if (item && Date.now() - item.ts < CACHE_TTL) return item.data;
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, ts: Date.now() });
  if (cache.size > 1000) {
    const oldest = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
    if (oldest) cache.delete(oldest[0]);
  }
}

// Photon (Komoot) - rapide, pas de rate-limit
async function searchPhoton(query, countryCode, lang, limit) {
  const params = new URLSearchParams({ q: query, limit: String(limit * 2), lang });
  const res = await fetch(`https://photon.komoot.io/api/?${params}`, {
    headers: { 'User-Agent': UA }
  });
  
  if (!res.ok) throw new Error(`Photon ${res.status}`);
  const data = await res.json();
  
  const validTypes = new Set(['city', 'town', 'village', 'municipality', 'hamlet', 'suburb', 'locality']);
  const items = [];
  
  for (const f of data.features || []) {
    const p = f.properties || {};
    const type = p.type || p.osm_value || '';
    
    if (!validTypes.has(type) && p.osm_key !== 'place') continue;
    if (countryCode && p.countrycode?.toUpperCase() !== countryCode) continue;
    
    const coords = f.geometry?.coordinates;
    if (!coords || coords.length < 2) continue;
    
    items.push({
      name: p.name || query,
      displayName: p.name || query,
      countryCode: (p.countrycode || '').toUpperCase(),
      admin1: p.state || p.region || '',
      lat: coords[1],
      lon: coords[0]
    });
    
    if (items.length >= limit) break;
  }
  
  return items;
}

// Nominatim (fallback)
async function searchNominatim(query, countryCode, lang, limit) {
  const params = new URLSearchParams({
    q: countryCode ? `${query}, ${countryCode}` : query,
    format: 'json',
    addressdetails: '1',
    limit: String(limit * 2),
    'accept-language': lang,
    featuretype: 'city'
  });
  
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { 'User-Agent': UA }
  });
  
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const results = await res.json();
  
  const validTypes = new Set(['city', 'town', 'village', 'municipality', 'hamlet']);
  const items = [];
  
  for (const r of results) {
    if (!validTypes.has(r.type) && r.class !== 'place') continue;
    if (countryCode && r.address?.country_code?.toUpperCase() !== countryCode) continue;
    
    items.push({
      name: r.display_name.split(',')[0].trim(),
      displayName: r.display_name.split(',')[0].trim(),
      countryCode: (r.address?.country_code || '').toUpperCase(),
      admin1: r.address?.state || r.address?.region || '',
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon)
    });
    
    if (items.length >= limit) break;
  }
  
  return items;
}

export default async (request, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8'
  };
  
  // Préflight
  if (request.method === 'OPTIONS') {
    return new Response('', { status: 204, headers });
  }
  
  try {
    const url = new URL(request.url);
    const query = (url.searchParams.get('q') || url.searchParams.get('query') || '').trim();
    const countryCode = (url.searchParams.get('country') || url.searchParams.get('countryCode') || '').toUpperCase();
    const lang = url.searchParams.get('lang') || 'fr';
    const limit = Math.max(1, Math.min(20, parseInt(url.searchParams.get('limit')) || 12));
    
    if (!query || query.length < 2) {
      return new Response(JSON.stringify({ items: [] }), { status: 200, headers });
    }
    
    // Cache
    const cacheKey = `${query.toLowerCase()}:${countryCode}:${lang}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return new Response(JSON.stringify({ ...cached, cached: true }), { status: 200, headers });
    }
    
    const t0 = Date.now();
    let items = [];
    let source = 'none';
    
    // 1) Photon d'abord
    try {
      items = await searchPhoton(query, countryCode, lang, limit);
      source = 'photon';
    } catch (e) {
      console.warn('Photon error:', e.message);
    }
    
    // 2) Nominatim si peu de résultats
    if (items.length < 3) {
      try {
        const nomItems = await searchNominatim(query, countryCode, lang, limit);
        if (nomItems.length > items.length) {
          items = nomItems;
          source = 'nominatim';
        }
      } catch (e) {
        console.warn('Nominatim error:', e.message);
      }
    }
    
    // Dédupliquer
    const seen = new Set();
    const unique = items.filter(it => {
      const key = `${it.name.toLowerCase()}|${it.countryCode}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, limit);
    
    const result = { items: unique, source, ms: Date.now() - t0 };
    setCache(cacheKey, result);
    
    return new Response(JSON.stringify(result), { status: 200, headers });
    
  } catch (e) {
    console.error('Error:', e);
    return new Response(JSON.stringify({ error: e.message, items: [] }), { status: 500, headers });
  }
}
