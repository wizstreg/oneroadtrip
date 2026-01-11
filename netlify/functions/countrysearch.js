// netlify/functions/countrysearch.js
// Recherche de pays via REST Countries API

const UA = 'OneRoadTrip/2.0 (https://oneroadtrip.com)';

// Cache
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1h (les pays changent rarement)

function getCached(key) {
  const item = cache.get(key);
  if (item && Date.now() - item.ts < CACHE_TTL) return item.data;
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, ts: Date.now() });
}

// Fallback statique
const COUNTRIES = {
  fr: [
    { name: 'France', code: 'FR', lat: 46.2276, lon: 2.2137 },
    { name: 'Allemagne', code: 'DE', lat: 51.1657, lon: 10.4515 },
    { name: 'Espagne', code: 'ES', lat: 40.4637, lon: -3.7492 },
    { name: 'Italie', code: 'IT', lat: 41.8719, lon: 12.5674 },
    { name: 'Portugal', code: 'PT', lat: 39.3999, lon: -8.2245 },
    { name: 'Royaume-Uni', code: 'GB', lat: 55.3781, lon: -3.4360 },
    { name: 'États-Unis', code: 'US', lat: 37.0902, lon: -95.7129 },
    { name: 'Canada', code: 'CA', lat: 56.1304, lon: -106.3468 },
    { name: 'Suisse', code: 'CH', lat: 46.8182, lon: 8.2275 },
    { name: 'Belgique', code: 'BE', lat: 50.5039, lon: 4.4699 },
    { name: 'Pays-Bas', code: 'NL', lat: 52.1326, lon: 5.2913 },
    { name: 'Autriche', code: 'AT', lat: 47.5162, lon: 14.5501 },
    { name: 'Grèce', code: 'GR', lat: 39.0742, lon: 21.8243 },
    { name: 'Croatie', code: 'HR', lat: 45.1, lon: 15.2 },
    { name: 'Maroc', code: 'MA', lat: 31.7917, lon: -7.0926 },
    { name: 'Tunisie', code: 'TN', lat: 33.8869, lon: 9.5375 },
    { name: 'Japon', code: 'JP', lat: 36.2048, lon: 138.2529 },
    { name: 'Australie', code: 'AU', lat: -25.2744, lon: 133.7751 },
    { name: 'Nouvelle-Zélande', code: 'NZ', lat: -40.9006, lon: 174.886 },
    { name: 'Brésil', code: 'BR', lat: -14.235, lon: -51.9253 },
    { name: 'Argentine', code: 'AR', lat: -38.4161, lon: -63.6167 },
    { name: 'Mexique', code: 'MX', lat: 23.6345, lon: -102.5528 },
    { name: 'Thaïlande', code: 'TH', lat: 15.87, lon: 100.9925 },
    { name: 'Vietnam', code: 'VN', lat: 14.0583, lon: 108.2772 },
    { name: 'Inde', code: 'IN', lat: 20.5937, lon: 78.9629 },
    { name: 'Égypte', code: 'EG', lat: 26.8206, lon: 30.8025 },
    { name: 'Afrique du Sud', code: 'ZA', lat: -30.5595, lon: 22.9375 },
    { name: 'Islande', code: 'IS', lat: 64.9631, lon: -19.0208 },
    { name: 'Norvège', code: 'NO', lat: 60.472, lon: 8.4689 },
    { name: 'Suède', code: 'SE', lat: 60.1282, lon: 18.6435 },
    { name: 'Finlande', code: 'FI', lat: 61.9241, lon: 25.7482 },
    { name: 'Danemark', code: 'DK', lat: 56.2639, lon: 9.5018 },
    { name: 'Irlande', code: 'IE', lat: 53.1424, lon: -7.6921 },
    { name: 'Écosse', code: 'GB', lat: 56.4907, lon: -4.2026 },
    { name: 'Pologne', code: 'PL', lat: 51.9194, lon: 19.1451 },
    { name: 'République tchèque', code: 'CZ', lat: 49.8175, lon: 15.473 },
    { name: 'Hongrie', code: 'HU', lat: 47.1625, lon: 19.5033 },
    { name: 'Roumanie', code: 'RO', lat: 45.9432, lon: 24.9668 },
    { name: 'Turquie', code: 'TR', lat: 38.9637, lon: 35.2433 },
    { name: 'Émirats arabes unis', code: 'AE', lat: 23.4241, lon: 53.8478 }
  ],
  en: [
    { name: 'France', code: 'FR', lat: 46.2276, lon: 2.2137 },
    { name: 'Germany', code: 'DE', lat: 51.1657, lon: 10.4515 },
    { name: 'Spain', code: 'ES', lat: 40.4637, lon: -3.7492 },
    { name: 'Italy', code: 'IT', lat: 41.8719, lon: 12.5674 },
    { name: 'Portugal', code: 'PT', lat: 39.3999, lon: -8.2245 },
    { name: 'United Kingdom', code: 'GB', lat: 55.3781, lon: -3.4360 },
    { name: 'United States', code: 'US', lat: 37.0902, lon: -95.7129 },
    { name: 'Canada', code: 'CA', lat: 56.1304, lon: -106.3468 },
    { name: 'Switzerland', code: 'CH', lat: 46.8182, lon: 8.2275 },
    { name: 'Belgium', code: 'BE', lat: 50.5039, lon: 4.4699 },
    { name: 'Netherlands', code: 'NL', lat: 52.1326, lon: 5.2913 },
    { name: 'Austria', code: 'AT', lat: 47.5162, lon: 14.5501 },
    { name: 'Greece', code: 'GR', lat: 39.0742, lon: 21.8243 },
    { name: 'Croatia', code: 'HR', lat: 45.1, lon: 15.2 },
    { name: 'Morocco', code: 'MA', lat: 31.7917, lon: -7.0926 },
    { name: 'Tunisia', code: 'TN', lat: 33.8869, lon: 9.5375 },
    { name: 'Japan', code: 'JP', lat: 36.2048, lon: 138.2529 },
    { name: 'Australia', code: 'AU', lat: -25.2744, lon: 133.7751 },
    { name: 'New Zealand', code: 'NZ', lat: -40.9006, lon: 174.886 },
    { name: 'Brazil', code: 'BR', lat: -14.235, lon: -51.9253 },
    { name: 'Argentina', code: 'AR', lat: -38.4161, lon: -63.6167 },
    { name: 'Mexico', code: 'MX', lat: 23.6345, lon: -102.5528 },
    { name: 'Thailand', code: 'TH', lat: 15.87, lon: 100.9925 },
    { name: 'Vietnam', code: 'VN', lat: 14.0583, lon: 108.2772 },
    { name: 'India', code: 'IN', lat: 20.5937, lon: 78.9629 },
    { name: 'Egypt', code: 'EG', lat: 26.8206, lon: 30.8025 },
    { name: 'South Africa', code: 'ZA', lat: -30.5595, lon: 22.9375 },
    { name: 'Iceland', code: 'IS', lat: 64.9631, lon: -19.0208 },
    { name: 'Norway', code: 'NO', lat: 60.472, lon: 8.4689 },
    { name: 'Sweden', code: 'SE', lat: 60.1282, lon: 18.6435 },
    { name: 'Finland', code: 'FI', lat: 61.9241, lon: 25.7482 },
    { name: 'Denmark', code: 'DK', lat: 56.2639, lon: 9.5018 },
    { name: 'Ireland', code: 'IE', lat: 53.1424, lon: -7.6921 },
    { name: 'Scotland', code: 'GB', lat: 56.4907, lon: -4.2026 },
    { name: 'Poland', code: 'PL', lat: 51.9194, lon: 19.1451 },
    { name: 'Czech Republic', code: 'CZ', lat: 49.8175, lon: 15.473 },
    { name: 'Hungary', code: 'HU', lat: 47.1625, lon: 19.5033 },
    { name: 'Romania', code: 'RO', lat: 45.9432, lon: 24.9668 },
    { name: 'Turkey', code: 'TR', lat: 38.9637, lon: 35.2433 },
    { name: 'United Arab Emirates', code: 'AE', lat: 23.4241, lon: 53.8478 }
  ]
};

function fallbackSearch(query, lang, limit) {
  const list = COUNTRIES[lang] || COUNTRIES.en;
  const q = query.toLowerCase();
  
  return list
    .filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q)
    .slice(0, limit)
    .map(c => ({
      name: c.name,
      displayName: c.name,
      countryCode: c.code,
      admin1: '',
      lat: c.lat,
      lon: c.lon
    }));
}

export default async (request, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8'
  };
  
  if (request.method === 'OPTIONS') {
    return new Response('', { status: 204, headers });
  }
  
  try {
    const url = new URL(request.url);
    const query = (url.searchParams.get('q') || '').trim();
    const lang = url.searchParams.get('lang') || 'fr';
    const limit = Math.max(1, Math.min(20, parseInt(url.searchParams.get('limit')) || 12));
    
    if (!query || query.length < 2) {
      return new Response(JSON.stringify({ items: [] }), { status: 200, headers });
    }
    
    // Cache
    const cacheKey = `country:${query.toLowerCase()}:${lang}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return new Response(JSON.stringify({ ...cached, cached: true }), { status: 200, headers });
    }
    
    let items = [];
    let source = 'fallback';
    
    try {
      // REST Countries API
      const res = await fetch(
        `https://restcountries.com/v3.1/name/${encodeURIComponent(query)}?fields=name,cca2,translations,latlng`,
        { headers: { 'User-Agent': UA } }
      );
      
      if (res.ok) {
        const countries = await res.json();
        items = countries.slice(0, limit).map(c => {
          const localName = c.translations?.[lang]?.common || c.name?.common || query;
          return {
            name: localName,
            displayName: localName,
            countryCode: c.cca2 || '',
            admin1: '',
            lat: c.latlng?.[0] ?? null,
            lon: c.latlng?.[1] ?? null
          };
        });
        source = 'restcountries';
      }
    } catch (e) {
      console.warn('REST Countries error:', e.message);
    }
    
    // Fallback si pas de résultats
    if (items.length === 0) {
      items = fallbackSearch(query, lang, limit);
      source = 'fallback';
    }
    
    const result = { items, source };
    setCache(cacheKey, result);
    
    return new Response(JSON.stringify(result), { status: 200, headers });
    
  } catch (e) {
    console.error('Error:', e);
    return new Response(JSON.stringify({ error: e.message, items: [] }), { status: 500, headers });
  }
}
