/**
 * ORT Route Builder - Génération automatique d'itinéraires
 * Extrait de roadtrip_detail.html pour maintenance facilitée
 * 
 * Dépendances externes (doivent être chargées avant):
 * - routeWithChunking() : calcul route OSRM/Mapbox
 * - ORT_I18N : traductions
 * - ORT_getLang() : langue courante
 */

console.log('[ROUTE-BUILDER] ✅ ort-route-builder.js chargé');

// === CALCUL DISTANCE HAVERSINE ===
function haversineDistanceBuilder(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Utiliser haversineDistance existante si disponible, sinon la locale
function _haversine(lat1, lon1, lat2, lon2) {
  if (typeof haversineDistance === 'function') {
    return haversineDistance(lat1, lon1, lat2, lon2);
  }
  return haversineDistanceBuilder(lat1, lon1, lat2, lon2);
}

// === ROUTE BUILDER: Génération d'itinéraire depuis presentation.html ===
async function initRouteBuilder(params) {
  console.log('[ROUTE-BUILDER] 🚀 initRouteBuilder appelé');
  console.log('[ROUTE-BUILDER] Params:', Object.fromEntries(params.entries()));
  
  const lang = params.get('lang') || localStorage.getItem('lang') || 'fr';
  const isLoopMode = params.get('loop') === '1' || params.get('loop') === 'true';
  
  const config = {
    start: {
      name: decodeURIComponent(params.get('startName') || ''),
      lat: parseFloat(params.get('startLat')),
      lon: parseFloat(params.get('startLon')),
      lng: parseFloat(params.get('startLon')),
      cc: (params.get('startCC') || '').toUpperCase()
    },
    end: {
      name: decodeURIComponent(params.get('endName') || ''),
      lat: parseFloat(params.get('endLat')),
      lon: parseFloat(params.get('endLon')),
      lng: parseFloat(params.get('endLon')),
      cc: (params.get('endCC') || '').toUpperCase()
    },
    maxKm: parseInt(params.get('maxKm')) || 200,
    detour: parseInt(params.get('detour')) || 30,
    days: parseInt(params.get('days')) || 7,
    loop: isLoopMode,
    excludePlaces: (params.get('exclude') || '').split(',').filter(Boolean)
  };
  
  // Mode circuit : end = start
  if (isLoopMode) {
    config.end = { ...config.start };
    console.log('[ROUTE-BUILDER] 🔄 Mode CIRCUIT activé - retour au point de départ');
  }
  
  // Nettoyer les noms
  config.start.name = cleanCityName(config.start.name);
  config.end.name = cleanCityName(config.end.name);
  
  if (!config.start.lat) {
    showBuilderError(lang, 'Missing coordinates');
    return;
  }
  
  // Mode circuit : pas besoin de vérifier la faisabilité de la même manière
  if (isLoopMode) {
    await executeLoopBuilder(config, lang);
    return;
  }
  
  // === MODE NORMAL (A → B) ===
  if (!config.end.lat) {
    showBuilderError(lang, 'Missing end coordinates');
    return;
  }
  
  // Calculer la distance une fois pour toutes
  const directDistance = _haversine(config.start.lat, config.start.lon, config.end.lat, config.end.lon);
  
  // === BOUCLE PRINCIPALE : vérifier faisabilité avant de lancer ===
  let loopCount = 0;
  while (true) {
    loopCount++;
    if (loopCount > 10) {
      break;
    }
    
    // Vérifier si les paramètres sont réalistes
    const minStepsNeeded = Math.ceil(directDistance / config.maxKm);
    const maxPossibleSteps = config.days * 2;
    
    if (minStepsNeeded <= maxPossibleSteps) {
      break;
    }
    
    // Paramètres impossibles → afficher modal
    const userChoice = await showBuilderImpossibleModal(config, directDistance);
    
    if (userChoice === 'back') {
      history.back();
      return;
    }
    // userChoice === 'retry' → on reboucle pour vérifier
  }
  
  // === EXÉCUTION DU BUILDER ===
  showBuilderLoader(lang);
  
  try {
    // 1. Calculer la vraie route OSRM
    const routeData = await calculateBuilderOSRMRoute(config.start, config.end);
    
    // 1b. Valider que la route est praticable (pas de passage par mer/ferry)
    const routeValidation = validateRouteIsDrivable(routeData, directDistance);
    if (!routeValidation.valid) {
      hideBuilderLoader();
      if (routeValidation.reason === 'sea_crossing') {
        await showSeaCrossingModal(config, lang, routeValidation);
        return;
      } else {
        showBuilderError(lang, routeValidation.message || 'Route non praticable');
        return;
      }
    }
    
    // 2. Charger les places ORT
    const places = await loadPlacesForRoute(config, routeData);
    const placeCount = Object.keys(places).length;
    
    if (placeCount === 0) {
      hideBuilderLoader();
      showBuilderError(lang, 'Aucun lieu trouvé le long de cette route');
      return;
    }
    
    // 3. Sélectionner les étapes (sans modal interne, juste des warnings)
    const steps = await selectStepsAlongRoute(config, routeData, places);
    
    if (!steps || steps.length === 0) {
      hideBuilderLoader();
      showBuilderError(lang, 'Impossible de créer des étapes');
      return;
    }
    
    // 4. Enrichir avec les données ORT
    const enrichedSteps = await enrichStepsWithORTData(steps, config);
    
    // 5. Générer l'itinéraire final
    generateBuilderItinerary(enrichedSteps, config, lang);
    
  } catch (error) {
    showBuilderError(lang, error.message);
  }
}

// Calcul de la route pour le Route Builder - OSRM puis Mapbox en fallback
async function calculateBuilderOSRMRoute(start, end) {
  const waypoints = [
    [start.lat, start.lon],
    [end.lat, end.lon]
  ];
  
  // Utiliser routeWithChunking si disponible (défini dans roadtrip_detail.html)
  if (typeof routeWithChunking === 'function') {
    const result = await routeWithChunking(waypoints, 'car', 'driving');
    
    if (result) {
      const processed = processRouteCoords(result.coordinates, result.distance);
      return processed;
    }
  }
  
  // Fallback: ligne droite interpolée
  const totalDist = _haversine(start.lat, start.lon, end.lat, end.lon);
  const numPoints = Math.max(20, Math.ceil(totalDist / 40));
  
  const coords = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    coords.push([start.lat + t * (end.lat - start.lat), start.lon + t * (end.lon - start.lon)]);
  }
  return processRouteCoords(coords, totalDist * 1000);
}

// Helper pour traiter les coordonnées de route
function processRouteCoords(coords, distanceMeters) {
  // Simplifier à ~200 points
  const simplified = [];
  const step = Math.max(1, Math.floor(coords.length / 200));
  for (let i = 0; i < coords.length; i += step) simplified.push(coords[i]);
  if (simplified.length > 0 && simplified[simplified.length - 1] !== coords[coords.length - 1]) {
    simplified.push(coords[coords.length - 1]);
  }
  
  // Calculer distances cumulées
  const cumDist = [0];
  for (let i = 1; i < simplified.length; i++) {
    const [lat1, lon1] = simplified[i-1];
    const [lat2, lon2] = simplified[i];
    cumDist.push(cumDist[i-1] + _haversine(lat1, lon1, lat2, lon2));
  }
  
  return { 
    coords: simplified, 
    distance: Math.round(distanceMeters / 1000), 
    cumDist, 
    isReal: coords.length > 50 
  };
}

// Table des pays avec leurs bbox approximatives
const COUNTRY_BBOX = {
  'FR': { minLat: 41, maxLat: 51.5, minLon: -5.5, maxLon: 10 },
  'ES': { minLat: 35.5, maxLat: 44, minLon: -10, maxLon: 5 },
  'PT': { minLat: 36.5, maxLat: 42.5, minLon: -10, maxLon: -6 },
  'IT': { minLat: 35.5, maxLat: 47.5, minLon: 6, maxLon: 19 },
  'CH': { minLat: 45.5, maxLat: 48, minLon: 5.5, maxLon: 10.5 },
  'DE': { minLat: 47, maxLat: 55.5, minLon: 5.5, maxLon: 15.5 },
  'AT': { minLat: 46, maxLat: 49.5, minLon: 9, maxLon: 17.5 },
  'BE': { minLat: 49.5, maxLat: 51.5, minLon: 2.5, maxLon: 6.5 },
  'NL': { minLat: 50.5, maxLat: 53.5, minLon: 3, maxLon: 7.5 },
  'LU': { minLat: 49.4, maxLat: 50.2, minLon: 5.7, maxLon: 6.5 },
  'GB': { minLat: 49.5, maxLat: 61, minLon: -8.5, maxLon: 2 },
  'IE': { minLat: 51, maxLat: 55.5, minLon: -11, maxLon: -5.5 },
  'PL': { minLat: 49, maxLat: 55, minLon: 14, maxLon: 24.5 },
  'CZ': { minLat: 48.5, maxLat: 51.5, minLon: 12, maxLon: 19 },
  'SK': { minLat: 47.5, maxLat: 49.5, minLon: 16.5, maxLon: 22.5 },
  'HU': { minLat: 45.5, maxLat: 48.5, minLon: 16, maxLon: 23 },
  'SI': { minLat: 45.4, maxLat: 47, minLon: 13, maxLon: 16.5 },
  'HR': { minLat: 42.5, maxLat: 46.5, minLon: 13, maxLon: 19.5 },
  'GR': { minLat: 34.5, maxLat: 42, minLon: 19, maxLon: 30 },
  'DK': { minLat: 54.5, maxLat: 58, minLon: 8, maxLon: 15.5 },
  'SE': { minLat: 55, maxLat: 69.5, minLon: 10.5, maxLon: 24.5 },
  'NO': { minLat: 57.5, maxLat: 71.5, minLon: 4, maxLon: 31.5 },
  'FI': { minLat: 59.5, maxLat: 70.5, minLon: 19.5, maxLon: 31.5 },
  'RO': { minLat: 43.5, maxLat: 48.5, minLon: 20, maxLon: 30 },
  'BG': { minLat: 41, maxLat: 44.5, minLon: 22, maxLon: 29 },
  'RS': { minLat: 42, maxLat: 46.5, minLon: 18.5, maxLon: 23 },
  'BA': { minLat: 42.5, maxLat: 45.5, minLon: 15.5, maxLon: 19.5 },
  'ME': { minLat: 41.8, maxLat: 43.6, minLon: 18, maxLon: 20.4 },
  'AL': { minLat: 39.5, maxLat: 42.7, minLon: 19, maxLon: 21.1 },
  'MK': { minLat: 40.8, maxLat: 42.4, minLon: 20.4, maxLon: 23.1 },
  'AD': { minLat: 42.4, maxLat: 42.7, minLon: 1.4, maxLon: 1.8 },
  'MC': { minLat: 43.7, maxLat: 43.8, minLon: 7.4, maxLon: 7.5 }
};

// Charger les places ORT pour tous les pays de la route
async function loadPlacesForRoute(config, routeData) {
  const ROUTE_SEARCH_RADIUS_KM = 50;
  
  // Pays à charger : départ + arrivée + pays intermédiaires via bbox
  const countries = new Set();
  if (config.start.cc) countries.add(config.start.cc.toUpperCase());
  if (config.end.cc) countries.add(config.end.cc.toUpperCase());
  
  // Calculer bbox de la route
  let minLat = Infinity, maxLat = -Infinity;
  let minLon = Infinity, maxLon = -Infinity;
  for (const [lat, lon] of routeData.coords) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
  }
  
  // Ajouter les pays dont la bbox intersecte la route
  const routeBbox = { minLat: minLat - 0.5, maxLat: maxLat + 0.5, minLon: minLon - 0.5, maxLon: maxLon + 0.5 };
  for (const [cc, bbox] of Object.entries(COUNTRY_BBOX)) {
    const intersects = !(routeBbox.minLat > bbox.maxLat || routeBbox.maxLat < bbox.minLat ||
                        routeBbox.minLon > bbox.maxLon || routeBbox.maxLon < bbox.minLon);
    if (intersects) countries.add(cc);
  }
  
  // Élargir bbox pour le filtrage des places
  const margin = 0.5;
  minLat -= margin; maxLat += margin;
  minLon -= margin; maxLon += margin;
  
  // Charger les places de chaque pays
  const places = {};
  const lang = localStorage.getItem('lang') || 'fr';
  
  for (const cc of countries) {
    if (!cc) continue;
    
    const paths = [
      `./data/Roadtripsprefabriques/countries/${cc.toLowerCase()}/${cc.toLowerCase()}.places.master-${lang}.json`,
      `./data/Roadtripsprefabriques/countries/${cc.toLowerCase()}/${cc.toLowerCase()}.places.master.json`
    ];
    
    for (const url of paths) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        
        const data = await res.json();
        const arr = Array.isArray(data) ? data : (data.places || Object.entries(data).map(([k,v]) => ({...v, place_id: v.place_id || k})));
        
        for (const p of arr) {
          const lat = p.lat, lng = p.lng || p.lon;
          if (!lat || !lng) continue;
          
          // Pré-filtrage bbox
          if (lat < minLat || lat > maxLat || lng < minLon || lng > maxLon) continue;
          
          // Filtrage : distance à la route
          const distToRoute = getMinDistanceToRoute(lat, lng, routeData);
          if (distToRoute > ROUTE_SEARCH_RADIUS_KM) continue;
          
          const pid = p.place_id || p.id;
          places[pid] = {
            pid, name: p.name || pid, lat, lon: lng, lng,
            rating: p.rating || p.score || 0,
            suggested_days: p.suggested_days || 1,
            visits: Array.isArray(p.visits) ? p.visits.map(v => typeof v === 'string' ? {text:v} : v) : [],
            activities: Array.isArray(p.activities) ? p.activities.map(a => typeof a === 'string' ? {text:a} : a) : [],
            cc: cc.toUpperCase(),
            _distToRoute: distToRoute
          };
        }
        break;
      } catch (e) {
        // Continuer avec le prochain chemin
      }
    }
  }
  
  return places;
}

// Distance minimum d'un point à la route
function getMinDistanceToRoute(lat, lon, routeData) {
  let minDist = Infinity;
  const step = Math.max(1, Math.floor(routeData.coords.length / 100));
  for (let i = 0; i < routeData.coords.length; i += step) {
    const [rLat, rLon] = routeData.coords[i];
    const dist = _haversine(lat, lon, rLat, rLon);
    if (dist < minDist) minDist = dist;
  }
  return minDist;
}

// Chercher une place ORT correspondant à une ville (par proximité géographique)
function findPlaceByCoords(lat, lon, places, maxDist = 5) {
  let bestPlace = null;
  let bestDist = maxDist;
  
  for (const pid in places) {
    const p = places[pid];
    const dist = _haversine(lat, lon, p.lat, p.lon || p.lng);
    if (dist < bestDist) {
      bestDist = dist;
      bestPlace = { ...p, pid, _distance: dist };
    }
  }
  
  return bestPlace;
}

// Sélection intelligente des étapes le long de la route
async function selectStepsAlongRoute(config, routeData, places) {
  console.log('[ROUTE-BUILDER] ========== SÉLECTION ÉTAPES ==========');
  
  const { start, end, maxKm, detour, days } = config;
  const totalDist = routeData.distance;
  const placesCount = Object.keys(places).length;
  
  console.log(`[ROUTE-BUILDER] Config: maxKm=${maxKm}, detour=${detour}, days=${days}`);
  console.log(`[ROUTE-BUILDER] Route: ${totalDist}km, Places: ${placesCount}`);
  
  if (placesCount === 0) {
    console.error('[ROUTE-BUILDER] ❌ AUCUNE PLACE DISPONIBLE!');
    return [{ ...start, nights: 1, isStart: true }, { ...end, nights: 0, isEnd: true }];
  }
  
  const searchRadius = Math.max(detour, 20);
  
  // Nombre d'étapes max
  const minStepsNeeded = Math.ceil(totalDist / maxKm);
  const maxStepsPossible = Math.max(2, days - 1);
  const targetSteps = Math.min(minStepsNeeded, maxStepsPossible);
  
  console.log(`[ROUTE-BUILDER] 🎯 Étapes visées: ${targetSteps} (min=${minStepsNeeded}, max=${maxStepsPossible})`);
  console.log(`[ROUTE-BUILDER] 🔍 Rayon de recherche: ${searchRadius}km`);
  
  const steps = [{ ...start, nights: 1, isStart: true }];
  const usedPlaces = new Set();
  
  // 0. CHERCHER LES PLACES ORT POUR DÉPART ET ARRIVÉE
  const startPlace = findPlaceByCoords(start.lat, start.lon, places, 10);
  if (startPlace) {
    console.log(`[ROUTE-BUILDER] 📍 Départ trouvé dans ORT: "${startPlace.name}"`);
    steps[0] = {
      ...startPlace,
      nights: 1,
      isStart: true,
      _suggestedDays: 1
    };
    usedPlaces.add(startPlace.pid);
  }
  
  let endForSteps = { ...end, nights: 0, isEnd: true };
  const endPlace = findPlaceByCoords(end.lat, end.lon, places, 10);
  if (endPlace) {
    console.log(`[ROUTE-BUILDER] 📍 Arrivée trouvée dans ORT: "${endPlace.name}"`);
    endForSteps = {
      ...endPlace,
      nights: 0,
      isEnd: true,
      _suggestedDays: 1
    };
    usedPlaces.add(endPlace.pid);
  }
  
  // Boucle pour ajouter les étapes
  for (let stepIdx = 1; stepIdx <= targetSteps; stepIdx++) {
    console.log(`[ROUTE-BUILDER] --- Étape ${stepIdx}/${targetSteps} ---`);
    
    const lastStep = steps[steps.length - 1];
    
    // 1. Calculer le point cible à maxKm depuis la dernière étape
    const lastProgress = getProgressOnRoute(lastStep.lat, lastStep.lon || lastStep.lng, routeData);
    const targetProgress = Math.min(lastProgress + maxKm, totalDist);
    const targetPoint = getPointAtDistance(routeData, targetProgress);
    
    if (!targetPoint) {
      console.log(`[ROUTE-BUILDER] ❌ Pas de point à ${targetProgress}km`);
      break;
    }
    
    console.log(`[ROUTE-BUILDER] Point cible: ${targetProgress.toFixed(0)}km (rayon ${searchRadius}km)`);
    
    // 2. Chercher les places autour du point cible
    let bestPlace = null;
    let bestScore = -Infinity;
    
    for (const pid in places) {
      if (usedPlaces.has(pid)) continue;
      
      const p = places[pid];
      const distToTarget = _haversine(targetPoint.lat, targetPoint.lon, p.lat, p.lon);
      
      // Doit être dans le rayon de détour
      if (distToTarget > searchRadius) continue;
      
      const score = calculatePlaceScore(p, distToTarget, searchRadius);
      if (score > bestScore) {
        bestScore = score;
        bestPlace = { ...p, pid, distToTarget };
      }
    }
    
    if (bestPlace) {
      steps.push({
        name: bestPlace.name,
        lat: bestPlace.lat,
        lon: bestPlace.lon || bestPlace.lng,
        lng: bestPlace.lon || bestPlace.lng,
        place_id: bestPlace.pid,
        rating: bestPlace.rating,
        visits: bestPlace.visits,
        activities: bestPlace.activities,
        cc: bestPlace.cc,
        nights: 1,
        _suggestedDays: 1
      });
      usedPlaces.add(bestPlace.pid);
      
      const distFromLast = _haversine(lastStep.lat, lastStep.lon || lastStep.lng, bestPlace.lat, bestPlace.lon || bestPlace.lng);
      console.log(`[ROUTE-BUILDER] ✅ "${bestPlace.name}" (${distFromLast.toFixed(0)}km, score=${bestScore.toFixed(1)})`);
    } else {
      // Fallback: Nominatim si aucune place ORT trouvée
      console.log(`[ROUTE-BUILDER] ⚠️ Aucune place ORT → fallback Nominatim`);
      
      const fallbackCity = await findCityFromNominatim(targetPoint.lat, targetPoint.lon);
      
      if (fallbackCity) {
        steps.push({
          name: fallbackCity.name,
          lat: fallbackCity.lat,
          lon: fallbackCity.lon,
          lng: fallbackCity.lon,
          place_id: `nominatim-${fallbackCity.name.toLowerCase().replace(/\s+/g, '-')}`,
          rating: 5,
          visits: [],
          activities: [],
          cc: fallbackCity.cc || '',
          nights: 1,
          _suggestedDays: 1,
          _fromNominatim: true
        });
        
        const distFromLast = _haversine(lastStep.lat, lastStep.lon || lastStep.lng, fallbackCity.lat, fallbackCity.lon);
        console.log(`[ROUTE-BUILDER] ✅ Nominatim: "${fallbackCity.name}" (${distFromLast.toFixed(0)}km)`);
      } else {
        console.log(`[ROUTE-BUILDER] ❌ Nominatim n'a rien trouvé - arrêt`);
        break;
      }
    }
  }
  
  // Ajouter l'arrivée
  steps.push(endForSteps);
  
  console.log(`[ROUTE-BUILDER] ✅ ${steps.length} étapes finales`);
  
  return steps;
}

// Calculer la progression d'un point le long de la route
function getProgressOnRoute(lat, lon, routeData) {
  let minDist = Infinity;
  let bestProgress = 0;
  
  const step = Math.max(1, Math.floor(routeData.coords.length / 50));
  for (let i = 0; i < routeData.coords.length; i += step) {
    const [rLat, rLon] = routeData.coords[i];
    const dist = _haversine(lat, lon, rLat, rLon);
    if (dist < minDist) {
      minDist = dist;
      bestProgress = routeData.cumDist[i] || 0;
    }
  }
  
  return bestProgress;
}

// Fallback: trouver une ville via Nominatim
let _lastNominatimBuilderCall = 0;
async function findCityFromNominatim(lat, lon) {
  try {
    // Rate limiting: 1 appel/seconde max
    const now = Date.now();
    if (now - _lastNominatimBuilderCall < 1100) {
      await new Promise(r => setTimeout(r, 1100 - (now - _lastNominatimBuilderCall)));
    }
    _lastNominatimBuilderCall = Date.now();
    
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&accept-language=fr`;
    
    const res = await fetch(url, { 
      headers: { 'User-Agent': 'OneRoadTrip/1.0' },
      signal: AbortSignal.timeout(5000)
    });
    
    if (!res.ok) return null;
    
    const data = await res.json();
    const addr = data.address || {};
    
    let cityName = addr.city || addr.town || addr.village || addr.municipality || 
                   addr.county || addr.state || null;
    
    if (cityName && /^(Métropole|Communauté|Agglomération|Arrondissement)/i.test(cityName)) {
      cityName = addr.town || addr.village || addr.suburb || addr.county || cityName;
    }
    
    if (!cityName) return null;
    
    const cc = (addr.country_code || '').toUpperCase();
    
    return {
      name: cityName,
      lat: parseFloat(data.lat),
      lon: parseFloat(data.lon),
      cc: cc
    };
    
  } catch (e) {
    return null;
  }
}

// Trouver un point sur la route à une distance donnée
function getPointAtDistance(routeData, targetDist) {
  for (let i = 0; i < routeData.cumDist.length - 1; i++) {
    if (routeData.cumDist[i] <= targetDist && routeData.cumDist[i+1] >= targetDist) {
      const ratio = (targetDist - routeData.cumDist[i]) / (routeData.cumDist[i+1] - routeData.cumDist[i]);
      const [lat1, lon1] = routeData.coords[i];
      const [lat2, lon2] = routeData.coords[i+1];
      return {
        lat: lat1 + ratio * (lat2 - lat1),
        lon: lon1 + ratio * (lon2 - lon1)
      };
    }
  }
  // Si on dépasse, retourner le dernier point
  if (routeData.coords.length > 0) {
    const last = routeData.coords[routeData.coords.length - 1];
    return { lat: last[0], lon: last[1] };
  }
  return null;
}

// Calculer le score d'une place (plus élevé = meilleur)
function calculatePlaceScore(place, distToRoute, maxDetour) {
  let score = 0;
  
  // Rating (0-10 → 0-40 points)
  score += (place.rating || 0) * 4;
  
  // Jours conseillés (1-3 → 0-21 points)
  score += Math.min(3, place.suggested_days || 1) * 7;
  
  // Proximité à la route (plus proche = mieux, 0-20 points)
  const proximityBonus = (1 - distToRoute / maxDetour) * 20;
  score += Math.max(0, proximityBonus);
  
  // Bonus si a des visites/activités
  if (place.visits?.length > 0) score += 5;
  if (place.activities?.length > 0) score += 3;
  
  return score;
}

// Nettoyer les noms de ville
function cleanCityName(name) {
  if (!name) return '';
  return name
    .replace(/,\s*(France|Spain|Italia|Germany|Portugal|Switzerland|Belgium|Netherlands|Austria).*$/i, '')
    .replace(/\s*\([^)]*\)/g, '')
    .trim();
}

// Enrichir les étapes avec les données ORT complètes
async function enrichStepsWithORTData(steps, config) {
  const lang = localStorage.getItem('lang') || 'fr';
  
  for (const step of steps) {
    if (step.isStart || step.isEnd) continue;
    if (step._fromNominatim) continue;
    
    // Charger les données complètes de la place si disponibles
    if (step.place_id && step.cc) {
      try {
        const paths = [
          `./data/Roadtripsprefabriques/countries/${step.cc.toLowerCase()}/${step.cc.toLowerCase()}.places.master-${lang}.json`,
          `./data/Roadtripsprefabriques/countries/${step.cc.toLowerCase()}/${step.cc.toLowerCase()}.places.master.json`
        ];
        
        for (const url of paths) {
          try {
            const res = await fetch(url);
            if (!res.ok) continue;
            
            const data = await res.json();
            const arr = Array.isArray(data) ? data : (data.places || []);
            const place = arr.find(p => (p.place_id || p.id) === step.place_id);
            
            if (place) {
              step.description = place.description || place.summary || '';
              step.visits = place.visits || step.visits || [];
              step.activities = place.activities || step.activities || [];
              step.photos = place.photos || [];
              step.hotels = place.hotels || [];
              break;
            }
          } catch (e) {
            // Continuer
          }
        }
      } catch (e) {
        // Continuer sans enrichissement
      }
    }
  }
  
  return steps;
}

// Générer l'itinéraire final et l'injecter dans l'interface
function generateBuilderItinerary(steps, config, lang) {
  console.log('[ROUTE-BUILDER] 🎯 generateBuilderItinerary appelée');
  console.log(`[ROUTE-BUILDER] ${steps.length} étapes reçues: ${steps.map(s => s.name).join(' → ')}`);
  console.log(`[ROUTE-BUILDER] Jours demandés: ${config.days}`);
  
  hideBuilderLoader();
  
  // === CALCUL INTELLIGENT DES NUITS ===
  // 7 jours = 7 nuits max
  // Paris (isStart) + X intermédiaires + Lyon (isEnd) 
  // Les nuits se mettent SUR les étapes (sauf la dernière qui est l'arrivée)
  
  const startStep = steps[0];
  const endStep = steps[steps.length - 1];
  const intermediateSteps = steps.slice(1, -1); // Tout sauf départ et arrivée
  
  console.log(`[ROUTE-BUILDER] Structure: Start + ${intermediateSteps.length} intermédiaires + End`);
  
  // Réinitialiser les nuits
  for (const step of steps) {
    step.nights = 1; // 1 nuit par défaut
  }
  endStep.nights = 0; // Pas de nuit à l'arrivée
  
  // Distribuer les jours entre toutes les étapes (sauf l'arrivée)
  const stepsWithNights = steps.filter(s => !s.isEnd);
  const totalNightsToDistribute = Math.max(config.days - stepsWithNights.length, 0);
  
  console.log(`[ROUTE-BUILDER] Étapes avec nuits: ${stepsWithNights.length}, Nuits extra: ${totalNightsToDistribute}`);
  
  if (totalNightsToDistribute > 0) {
    // Ajouter les nuits extra au premier et dernier point intermédiaire
    intermediateSteps[0].nights += Math.ceil(totalNightsToDistribute / 2);
    if (intermediateSteps.length > 1) {
      intermediateSteps[intermediateSteps.length - 1].nights += Math.floor(totalNightsToDistribute / 2);
    }
  }
  
  console.log(`[ROUTE-BUILDER] Distribution nuits: ${steps.map(s => `${s.name}(${s.nights})`).join(' + ')}`);
  
  // Construire la structure days_plan compatible avec roadtrip_detail
  const daysPlan = [];
  let currentDay = 1;
  
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const nights = step.nights || (step.isEnd ? 0 : 1);
    
    for (let n = 0; n < Math.max(1, nights); n++) {
      const isLastNightAtStep = (n === nights - 1);
      const nextStep = (isLastNightAtStep && i < steps.length - 1) ? steps[i + 1] : null;
      
      daysPlan.push({
        day: currentDay,
        night: {
          city: step.name,
          place_id: step.place_id || `step-${i}`,
          coords: [step.lat, step.lon || step.lng],
          nights: isLastNightAtStep ? 1 : nights - n
        },
        visits: step.visits || [],
        activities: step.activities || [],
        to_next_leg: nextStep ? {
          destination: nextStep.name,
          distance_km: Math.round(_haversine(step.lat, step.lon || step.lng, nextStep.lat, nextStep.lon || nextStep.lng)),
          duration_min: null
        } : null
      });
      
      currentDay++;
    }
  }
  
  // Créer l'objet itinéraire
  const itinerary = {
    itin_id: `builder-${Date.now()}`,
    title: `${config.start.name} → ${config.end.name}`,
    estimated_days_base: config.days,
    days_plan: daysPlan,
    _fromBuilder: true,
    _builderConfig: config
  };
  
  console.log(`[ROUTE-BUILDER] ✅ Itinéraire créé: "${itinerary.title}" (${daysPlan.length} jours)`);
  
  // Injecter dans l'interface de roadtrip_detail
  if (typeof window.loadItineraryFromBuilder === 'function') {
    console.log('[ROUTE-BUILDER] Appel window.loadItineraryFromBuilder');
    window.loadItineraryFromBuilder(itinerary);
  } else if (typeof window.state !== 'undefined') {
    console.log('[ROUTE-BUILDER] Injection directe dans window.state');
    // Fallback: injecter directement dans state
    window.state = window.state || {};
    window.state.itinerary = itinerary;
    window.state.steps = steps;
    window.state.title = itinerary.title;
    window.state.cc = config.start.cc || config.end.cc || 'XX';
    
    // Déclencher le rendu si possible
    if (typeof renderSteps === 'function') {
      console.log('[ROUTE-BUILDER] Appel renderSteps()');
      renderSteps();
    }
    if (typeof recalcAllLegs === 'function') {
      console.log('[ROUTE-BUILDER] Appel recalcAllLegs()');
      recalcAllLegs();
    }
    if (typeof renderRows === 'function') {
      console.log('[ROUTE-BUILDER] Appel renderRows()');
      renderRows();
    }
  } else {
    console.error('[ROUTE-BUILDER] ❌ Impossible d\'injecter l\'itinéraire: pas de loadItineraryFromBuilder ni state');
  }
  
  // === GESTION RETOUR VERS RT MOBILE ===
  const returnTo = new URLSearchParams(location.search).get('returnTo');
  if (returnTo === 'mobile') {
    // Préparer les données pour RT Mobile
    const builderResult = {
      title: itinerary.title,
      cc: config.start.cc || config.end.cc || 'XX',
      steps: steps.map(s => ({
        name: s.name,
        lat: s.lat,
        lng: s.lng || s.lon,
        lon: s.lng || s.lon,
        nights: s.nights || 0,
        description: s.description || '',
        images: s.images || [],
        photos: s.images || [],
        visits: s.visits || [],
        activities: s.activities || [],
        place_id: s.place_id || null,
        cc: s.cc || config.start.cc,
        to_next_leg: s.to_next_leg || null
      }))
    };
    
    // Sauvegarder pour RT Mobile
    localStorage.setItem('ORT_BUILDER_RESULT', JSON.stringify(builderResult));
    
    // Rediriger vers RT Mobile
    setTimeout(() => {
      window.location.href = `roadtrip_mobile.html?fromBuilder=1&lang=${lang}`;
    }, 1000);
    return;
  }
}

// === MODE CIRCUIT / BOUCLE ===
async function executeLoopBuilder(config, lang) {
  console.log('[ROUTE-BUILDER] 🔄 === MODE CIRCUIT ===');
  console.log(`[ROUTE-BUILDER] Départ: ${config.start.name} (${config.start.lat}, ${config.start.lon})`);
  console.log(`[ROUTE-BUILDER] Jours: ${config.days}, MaxKm/étape: ${config.maxKm}`);
  
  showBuilderLoader(lang);
  
  try {
    // 1. Calculer le rayon de recherche basé sur maxKm
    const searchRadius = Math.min(config.maxKm * 1.5, 400);
    console.log(`[ROUTE-BUILDER] 📍 Rayon de recherche: ${searchRadius}km (basé sur maxKm=${config.maxKm})`);
    
    // 2. Charger les places autour du point de départ
    const places = await loadPlacesForLoop(config, searchRadius);
    const placeCount = Object.keys(places).length;
    console.log(`[ROUTE-BUILDER] ${placeCount} places trouvées dans le rayon`);
    
    // 3. Rechercher la ville de départ dans les places ORT pour l'enrichir
    const startPlaceData = await findStartCityInPlaces(config.start, lang);
    if (startPlaceData) {
      console.log(`[ROUTE-BUILDER] ✅ Ville de départ trouvée: ${startPlaceData.name}, ${startPlaceData.suggested_days} jours conseillés`);
      // Enrichir config.start avec les données ORT
      config.start = {
        ...config.start,
        ...startPlaceData,
        name: config.start.name // Garder le nom original
      };
    } else {
      console.warn(`[ROUTE-BUILDER] ⚠️ Ville de départ "${config.start.name}" non trouvée dans les places ORT`);
      // Afficher un warning mais continuer
      showStartCityWarning(config.start.name, lang);
    }
    
    if (placeCount === 0) {
      hideBuilderLoader();
      showBuilderError(lang, 'Aucun lieu trouvé autour de cette ville');
      return;
    }
    
    // 4. Sélectionner les meilleures étapes pour le circuit
    const steps = selectStepsForLoop(config, places, searchRadius);
    
    if (!steps || steps.length < 2) {
      hideBuilderLoader();
      showBuilderError(lang, 'Pas assez de lieux pour créer un circuit');
      return;
    }
    
    console.log(`[ROUTE-BUILDER] 🔄 Circuit: ${steps.map(s => s.name).join(' → ')} → ${config.start.name}`);
    
    // 5. Générer l'itinéraire final (mode circuit)
    generateLoopItinerary(steps, config, lang);
    
  } catch (error) {
    console.error('[ROUTE-BUILDER] ❌ Erreur circuit:', error);
    showBuilderError(lang, error.message);
  }
}

// Rechercher la ville de départ dans les places ORT
async function findStartCityInPlaces(start, lang) {
  const cc = start.cc?.toUpperCase();
  if (!cc) return null;
  
  const paths = [
    `./data/Roadtripsprefabriques/countries/${cc.toLowerCase()}/${cc.toLowerCase()}.places.master-${lang}.json`,
    `./data/Roadtripsprefabriques/countries/${cc.toLowerCase()}/${cc.toLowerCase()}.places.master.json`
  ];
  
  for (const url of paths) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      
      const data = await res.json();
      const arr = Array.isArray(data) ? data : (data.places || Object.entries(data).map(([k,v]) => ({...v, place_id: v.place_id || k})));
      
      // Chercher par proximité (< 5km) ou par nom
      for (const p of arr) {
        const lat = p.lat, lng = p.lng || p.lon;
        if (!lat || !lng) continue;
        
        const dist = _haversine(start.lat, start.lon, lat, lng);
        const nameMatch = p.name?.toLowerCase().includes(start.name?.toLowerCase()) ||
                          start.name?.toLowerCase().includes(p.name?.toLowerCase());
        
        if (dist < 5 || nameMatch) {
          console.log(`[ROUTE-BUILDER] 🔍 Trouvé: ${p.name} (dist=${dist.toFixed(1)}km, nameMatch=${nameMatch})`);
          return {
            place_id: p.place_id || p.id,
            name: p.name,
            lat: p.lat,
            lon: p.lng || p.lon,
            lng: p.lng || p.lon,
            rating: p.rating || p.score || 7,
            suggested_days: p.suggested_days || 2,
            _suggestedDays: p.suggested_days || 2,
            visits: p.visits || [],
            activities: p.activities || [],
            photos: p.photos || [],
            description: p.description || p.summary || '',
            cc: cc
          };
        }
      }
      break;
    } catch (e) {
      console.warn(`[ROUTE-BUILDER] Erreur recherche départ:`, e);
    }
  }
  
  return null;
}

// Afficher un warning pour ville de départ non trouvée
function showStartCityWarning(cityName, lang) {
  const t = (key) => {
    const texts = {
      warningTitle: { fr: '⚠️ Information', en: '⚠️ Notice', es: '⚠️ Aviso' },
      warningText: { 
        fr: `La ville "${cityName}" n'est pas dans notre base de données. Les visites et temps conseillés ne seront pas disponibles pour cette étape.`,
        en: `The city "${cityName}" is not in our database. Visits and recommended time won't be available for this stop.`,
        es: `La ciudad "${cityName}" no está en nuestra base de datos. Las visitas y el tiempo recomendado no estarán disponibles.`
      }
    };
    return texts[key]?.[lang] || texts[key]?.fr || key;
  };
  
  // Toast warning (non bloquant)
  if (typeof toast === 'function') {
    toast(`⚠️ ${cityName} : données limitées`, 4000);
  } else {
    // Fallback : créer un toast simple
    const toastEl = document.createElement('div');
    toastEl.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: #f59e0b;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    toastEl.textContent = `⚠️ ${cityName} : données limitées`;
    document.body.appendChild(toastEl);
    setTimeout(() => toastEl.remove(), 4000);
  }
}

// Charger les places pour le mode circuit (dans un rayon autour du départ)
async function loadPlacesForLoop(config, searchRadius) {
  console.log('[ROUTE-BUILDER] 🔄 Chargement places pour circuit...');
  
  const { start, excludePlaces, maxKm } = config;
  const places = {};
  const lang = localStorage.getItem('lang') || 'fr';
  
  // Déterminer les pays à charger (celui du départ + voisins potentiels)
  const countries = new Set();
  if (start.cc) countries.add(start.cc.toUpperCase());
  
  // Ajouter les pays voisins si le rayon est grand
  if (searchRadius > 100) {
    for (const [cc, bbox] of Object.entries(COUNTRY_BBOX)) {
      const inRange = start.lat >= bbox.minLat - searchRadius/111 &&
                      start.lat <= bbox.maxLat + searchRadius/111 &&
                      start.lon >= bbox.minLon - searchRadius/(111 * Math.cos(start.lat * Math.PI/180)) &&
                      start.lon <= bbox.maxLon + searchRadius/(111 * Math.cos(start.lat * Math.PI/180));
      if (inRange) countries.add(cc);
    }
  }
  
  console.log(`[ROUTE-BUILDER] Pays à charger: ${[...countries].join(', ')}`);
  
  // Charger les places de chaque pays
  for (const cc of countries) {
    if (!cc) continue;
    
    const paths = [
      `./data/Roadtripsprefabriques/countries/${cc.toLowerCase()}/${cc.toLowerCase()}.places.master-${lang}.json`,
      `./data/Roadtripsprefabriques/countries/${cc.toLowerCase()}/${cc.toLowerCase()}.places.master.json`
    ];
    
    for (const url of paths) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        
        const data = await res.json();
        const arr = Array.isArray(data) ? data : (data.places || Object.entries(data).map(([k,v]) => ({...v, place_id: v.place_id || k})));
        
        for (const p of arr) {
          const lat = p.lat, lng = p.lng || p.lon;
          if (!lat || !lng) continue;
          
          const pid = p.place_id || p.id;
          
          // Exclure les places déjà utilisées (pour le recalcul)
          if (excludePlaces && excludePlaces.includes(pid)) {
            console.log(`[ROUTE-BUILDER] ⏭️ Exclusion: ${p.name}`);
            continue;
          }
          
          // Distance au point de départ
          const distFromStart = _haversine(start.lat, start.lon, lat, lng);
          
          // IMPORTANT: Filtrer par maxKm (distance max par étape)
          // Une étape doit être accessible en une journée
          if (distFromStart > maxKm) continue;
          if (distFromStart < 15) continue; // Trop proche du départ (min 15km)
          
          places[pid] = {
            pid, 
            name: p.name || pid, 
            lat, 
            lon: lng, 
            lng,
            rating: p.rating || p.score || 5,
            suggested_days: p.suggested_days || 1,
            _suggestedDays: p.suggested_days || 1,
            // Charger TOUTES les données pour éviter un enrichissement séparé
            visits: p.visits || [],
            activities: p.activities || [],
            photos: p.photos || [],
            description: p.description || p.summary || '',
            hotels: p.hotels || [],
            cc: cc.toUpperCase(),
            distFromStart: distFromStart,
            // Calculer l'angle depuis le départ (pour le tri circulaire)
            angle: Math.atan2(lng - start.lon, lat - start.lat) * 180 / Math.PI
          };
        }
        break;
      } catch (e) {
        console.warn(`[ROUTE-BUILDER] Erreur chargement ${url}:`, e);
      }
    }
  }
  
  return places;
}

// Sélectionner les étapes pour un circuit
function selectStepsForLoop(config, places, searchRadius) {
  const { start, days, maxKm } = config;
  
  // Jours suggérés pour le départ
  const startSuggestedDays = start.suggested_days || start._suggestedDays || 2;
  
  console.log(`[ROUTE-BUILDER] 🎯 Circuit: ${days} jours total`);
  console.log(`[ROUTE-BUILDER]    - ${start.name} suggère ${startSuggestedDays} jour(s)`);
  
  // Convertir en array et calculer les scores
  const placeArray = Object.values(places);
  placeArray.forEach(p => {
    // Score basé sur : rating (priorité), suggested_days, proximité
    p.score = (p.rating || 5) * 10 + // 0-100 pts pour le rating
              Math.min(p.suggested_days || 1, 3) * 5 + // 5-15 pts pour les jours conseillés
              Math.max(0, (1 - p.distFromStart / maxKm)) * 10; // 0-10 pts proximité
  });
  
  // Trier par score (meilleures notes en premier)
  placeArray.sort((a, b) => b.score - a.score);
  
  console.log(`[ROUTE-BUILDER] Top 10 par score:`);
  placeArray.slice(0, 10).forEach((p, i) => {
    console.log(`  ${i+1}. ${p.name} - score=${p.score.toFixed(0)}, rating=${p.rating}, days=${p.suggested_days}, dist=${p.distFromStart.toFixed(0)}km`);
  });
  
  // Sélectionner les places jusqu'à avoir assez de contenu pour remplir les jours
  const selected = [];
  let totalSuggestedDays = startSuggestedDays; // Inclure le départ
  
  for (const place of placeArray) {
    // On prend des places tant qu'on n'a pas assez de jours suggérés
    // (mais on limite le nombre d'étapes à days pour éviter trop de micro-étapes)
    if (selected.length >= days) break;
    if (totalSuggestedDays >= days * 2) break; // Assez de contenu
    
    selected.push(place);
    totalSuggestedDays += (place.suggested_days || 1);
  }
  
  console.log(`[ROUTE-BUILDER] ${selected.length} places sélectionnées, ${totalSuggestedDays.toFixed(1)} jours conseillés total (avec départ)`);
  
  // Calculer le ratio de compression global (comme RT Detail)
  const ratio = days / totalSuggestedDays;
  console.log(`[ROUTE-BUILDER] 📊 Ratio de compression: ${days} / ${totalSuggestedDays.toFixed(1)} = ${ratio.toFixed(2)}`);
  
  // Appliquer le ratio au départ
  const startNights = Math.max(1, Math.round(startSuggestedDays * ratio));
  console.log(`[ROUTE-BUILDER] ${start.name}: ${startSuggestedDays}j × ${ratio.toFixed(2)} = ${startNights} nuits`);
  
  // Appliquer le ratio aux étapes
  let totalNightsAssigned = startNights;
  selected.forEach((place) => {
    const suggested = place.suggested_days || 1;
    const nights = Math.max(1, Math.round(suggested * ratio));
    place.nights = nights;
    totalNightsAssigned += nights;
    console.log(`[ROUTE-BUILDER] ${place.name}: ${suggested}j × ${ratio.toFixed(2)} = ${nights} nuits`);
  });
  
  // Ajuster si on dépasse (les arrondis peuvent causer +1 ou +2)
  while (totalNightsAssigned > days && selected.length > 0) {
    // Réduire la place avec le plus de nuits (et qui en a > 1)
    let maxNightsIdx = -1;
    let maxNights = 1;
    for (let i = 0; i < selected.length; i++) {
      if (selected[i].nights > maxNights) {
        maxNights = selected[i].nights;
        maxNightsIdx = i;
      }
    }
    if (maxNightsIdx >= 0) {
      selected[maxNightsIdx].nights--;
      totalNightsAssigned--;
      console.log(`[ROUTE-BUILDER] ⬇️ Ajustement: ${selected[maxNightsIdx].name} -1 nuit`);
    } else {
      break;
    }
  }
  
  console.log(`[ROUTE-BUILDER] Total nuits: ${totalNightsAssigned}/${days}`);
  
  // Trier les étapes sélectionnées par angle pour un circuit cohérent
  selected.sort((a, b) => a.angle - b.angle);
  
  // Vérifier que les étapes consécutives sont accessibles (< maxKm)
  const validCircuit = [];
  let currentPos = { lat: start.lat, lon: start.lon };
  
  for (const place of selected) {
    const dist = _haversine(currentPos.lat, currentPos.lon, place.lat, place.lon);
    if (dist <= maxKm * 1.5) {
      validCircuit.push(place);
      currentPos = { lat: place.lat, lon: place.lon };
    } else {
      console.log(`[ROUTE-BUILDER] ⏭️ ${place.name} trop loin (${dist.toFixed(0)}km > ${maxKm * 1.5}km)`);
    }
  }
  
  // Construire les étapes finales
  const steps = [{ 
    ...start, 
    nights: startNights,
    isStart: true,
    _suggestedDays: startSuggestedDays,
    suggested_days: startSuggestedDays
  }];
  
  for (const place of validCircuit) {
    steps.push({
      name: place.name,
      lat: place.lat,
      lon: place.lon || place.lng,
      lng: place.lon || place.lng,
      place_id: place.pid,
      rating: place.rating,
      visits: place.visits || [],
      activities: place.activities || [],
      photos: place.photos || [],
      description: place.description || '',
      cc: place.cc,
      nights: place.nights || 1,
      suggested_days: place.suggested_days || 1,
      _suggestedDays: place.suggested_days || 1,
      _score: place.score,
      _distFromStart: place.distFromStart
    });
  }
  
  // Ajouter le retour au départ (0 nuit = juste passage)
  steps.push({ 
    ...start, 
    nights: 0, 
    isEnd: true, 
    isReturn: true,
    _suggestedDays: 0,
    suggested_days: 0
  });
  
  // Log du circuit final
  const totalNights = steps.reduce((sum, s) => sum + (s.nights || 0), 0);
  console.log(`[ROUTE-BUILDER] Circuit final: ${steps.length} étapes, ${totalNights} nuits`);
  steps.forEach((s, i) => console.log(`  ${i+1}. ${s.name} (${s.nights} nuits)`));
  
  return steps;
}

// Générer l'itinéraire pour le mode circuit
function generateLoopItinerary(steps, config, lang) {
  hideBuilderLoader();
  
  const t = (key) => {
    const texts = {
      circuitFrom: { fr: 'Circuit depuis', en: 'Circuit from', es: 'Circuito desde', it: 'Circuito da', pt: 'Circuito de' }
    };
    return texts[key]?.[lang] || texts[key]?.fr || key;
  };
  
  // Titre du circuit
  const title = `${t('circuitFrom')} ${config.start.name}`;
  
  // Mettre à jour le titre dans l'interface
  const titleEl = document.getElementById('tripTitle');
  if (titleEl) titleEl.textContent = title;
  
  // Construire la structure days_plan
  const daysPlan = [];
  let currentDay = 1;
  
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    // IMPORTANT: Convertir en entier pour éviter les décimales
    const nights = Math.max(0, Math.round(step.nights || 0));
    
    // Sauter les étapes avec 0 nuit (retour final)
    if (nights === 0 && step.isEnd) {
      // Ajouter juste le trajet retour au dernier jour
      continue;
    }
    
    for (let n = 0; n < Math.max(1, nights); n++) {
      const isLastNightAtStep = (n === nights - 1);
      const nextStep = (isLastNightAtStep && i < steps.length - 1) ? steps[i + 1] : null;
      
      daysPlan.push({
        day: currentDay,
        night: {
          city: step.name,
          place_id: step.place_id || `step-${i}`,
          coords: [step.lat, step.lon || step.lng],
          nights: isLastNightAtStep ? 1 : nights - n
        },
        visits: step.visits || [],
        activities: step.activities || [],
        to_next_leg: nextStep ? {
          destination: nextStep.name,
          distance_km: Math.round(_haversine(step.lat, step.lon || step.lng, nextStep.lat, nextStep.lon || nextStep.lng)),
          duration_min: null
        } : null
      });
      
      currentDay++;
    }
  }
  
  // Calculer le total des nuits
  const totalNights = steps.reduce((sum, s) => sum + Math.round(s.nights || 0), 0);
  
  // Créer l'objet itinéraire
  const itinerary = {
    itin_id: `loop-${Date.now()}`,
    title: title,
    estimated_days_base: config.days,
    days_plan: daysPlan,
    _fromBuilder: true,
    _isLoop: true,
    _builderConfig: config,
    _usedPlaces: steps.filter(s => s.place_id && !s.isStart && !s.isEnd).map(s => s.place_id)
  };
  
  // Sauvegarder la config pour le recalcul
  window._loopBuilderConfig = config;
  window._loopUsedPlaces = itinerary._usedPlaces;
  
  console.log(`[ROUTE-BUILDER] 📋 Itinéraire généré: "${title}", ${totalNights} nuits, ${steps.length} étapes`);
  
  // Injecter dans l'interface
  if (typeof window.loadItineraryFromBuilder === 'function') {
    window.loadItineraryFromBuilder(itinerary);
  } else if (typeof window.state !== 'undefined') {
    window.state = window.state || {};
    window.state.itinerary = itinerary;
    window.state.steps = steps.map(s => ({
      ...s,
      nights: Math.round(s.nights || 0) // S'assurer que nights est un entier
    }));
    window.state.title = title;
    window.state.cc = config.start.cc || 'XX';
    window.state._isLoop = true;
    
    // Mettre à jour le titre
    const titlePill = document.querySelector('.pill.title');
    if (titlePill) titlePill.textContent = title;
    
    if (typeof renderSteps === 'function') renderSteps();
    if (typeof recalcAllLegs === 'function') recalcAllLegs();
    if (typeof renderRows === 'function') renderRows();
  }
  
  // Afficher le bouton recalculer si mode circuit
  showRecalculateButton(config, lang);
}

// Afficher le bouton "Recalculer" pour le mode circuit
function showRecalculateButton(config, lang) {
  // Vérifier si le bouton existe déjà
  if (document.getElementById('btnRecalculateLoop')) return;
  
  const t = (key) => {
    const texts = {
      recalculateLoop: { fr: '🔄 Autres suggestions', en: '🔄 Other suggestions', es: '🔄 Otras sugerencias' },
      recalculateTooltip: { fr: 'Proposer d\'autres villes pour le circuit', en: 'Suggest other cities for the circuit', es: 'Sugerir otras ciudades para el circuito' }
    };
    return texts[key]?.[lang] || texts[key]?.fr || key;
  };
  
  const btn = document.createElement('button');
  btn.id = 'btnRecalculateLoop';
  btn.innerHTML = t('recalculateLoop');
  btn.title = t('recalculateTooltip');
  btn.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 25px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    z-index: 1000;
    transition: all 0.3s ease;
  `;
  
  btn.addEventListener('mouseenter', () => {
    btn.style.transform = 'scale(1.05)';
    btn.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
  });
  
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'scale(1)';
    btn.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
  });
  
  btn.addEventListener('click', () => recalculateLoop(config, lang));
  
  document.body.appendChild(btn);
}

// Recalculer le circuit avec de nouvelles villes
async function recalculateLoop(config, lang) {
  console.log('[ROUTE-BUILDER] 🔄 Recalcul du circuit...');
  
  // Ajouter les places utilisées à la liste d'exclusion
  const usedPlaces = window._loopUsedPlaces || [];
  config.excludePlaces = [...(config.excludePlaces || []), ...usedPlaces];
  
  console.log(`[ROUTE-BUILDER] Exclusions: ${config.excludePlaces.join(', ')}`);
  
  // Supprimer le bouton pendant le recalcul
  document.getElementById('btnRecalculateLoop')?.remove();
  
  // Relancer le builder en mode circuit
  await executeLoopBuilder(config, lang);
}

// === MODAL ITINÉRAIRE IMPOSSIBLE avec sélecteurs +/- ===
function showBuilderImpossibleModal(config, distance = 0) {
  if (!distance && config.start && config.end) {
    distance = _haversine(config.start.lat, config.start.lon, config.end.lat, config.end.lon);
  }
  
  return new Promise((resolve) => {
    const lang = window.ORT_getLang ? window.ORT_getLang() : (localStorage.getItem('lang') || 'fr');
    
    const t = (key, params) => {
      let text = window.ORT_I18N?.[key]?.[lang] || window.ORT_I18N?.[key]?.fr || key;
      if (params) {
        Object.keys(params).forEach(k => {
          text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), params[k]);
        });
      }
      return text;
    };
    
    let currentMaxKm = config.maxKm;
    let currentDays = config.days;
    
    const modal = document.createElement('div');
    modal.id = 'builderImpossibleModal';
    modal.innerHTML = `
      <div style="position:fixed;inset:0;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;z-index:99999;padding:20px">
        <div style="background:#fff;padding:28px;border-radius:16px;max-width:480px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.3)">
          <div style="font-size:22px;font-weight:700;color:#dc2626;margin-bottom:16px">${t('builderImpossibleTitle')}</div>
          <p style="font-size:15px;color:#475569;line-height:1.6;margin-bottom:12px">
            ${t('builderImpossibleText', { start: config.start.name, end: config.end.name })}
          </p>
          
          <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:12px 16px;margin-bottom:20px;font-size:14px;color:#991b1b">
            <strong>📏 Distance :</strong> ${Math.round(distance)} km<br>
            <strong>⚙️ Actuel :</strong> ${Math.ceil(distance / config.maxKm)} étapes min (${config.maxKm} km/étape), max ${config.days * 2} en ${config.days}j<br>
            <strong>💡 Solution :</strong> ↑ km/étape ou ↑ jours
          </div>
          
          <div style="font-size:14px;font-weight:600;color:#113f7a;margin-bottom:16px">${t('builderAdjustParams')}</div>
          
          <!-- Sélecteur Distance Max -->
          <div style="display:flex;align-items:center;justify-content:space-between;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px 16px;margin-bottom:12px">
            <span style="font-size:14px;color:#334155;font-weight:500">${t('builderMaxKmPerDay')}</span>
            <div style="display:flex;align-items:center;gap:8px">
              <button id="kmMinus" style="width:36px;height:36px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;font-size:20px;font-weight:700;cursor:pointer;color:#113f7a">−</button>
              <span id="kmValue" style="min-width:80px;text-align:center;font-size:16px;font-weight:700;color:#113f7a">${currentMaxKm} km</span>
              <button id="kmPlus" style="width:36px;height:36px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;font-size:20px;font-weight:700;cursor:pointer;color:#113f7a">+</button>
            </div>
          </div>
          
          <!-- Sélecteur Jours -->
          <div style="display:flex;align-items:center;justify-content:space-between;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px 16px;margin-bottom:16px">
            <span style="font-size:14px;color:#334155;font-weight:500">${t('builderTripDuration')}</span>
            <div style="display:flex;align-items:center;gap:8px">
              <button id="daysMinus" style="width:36px;height:36px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;font-size:20px;font-weight:700;cursor:pointer;color:#113f7a">−</button>
              <span id="daysValue" style="min-width:80px;text-align:center;font-size:16px;font-weight:700;color:#113f7a">${currentDays} ${t('days')}</span>
              <button id="daysPlus" style="width:36px;height:36px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;font-size:20px;font-weight:700;cursor:pointer;color:#113f7a">+</button>
            </div>
          </div>
          
          <!-- Indicateur de faisabilité -->
          <div id="feasibilityIndicator" style="text-align:center;padding:10px;border-radius:8px;margin-bottom:20px;font-weight:600;font-size:14px;background:#dcfce7;color:#166534">
            ✅ Faisable
          </div>
          
          <div style="display:flex;gap:12px;flex-wrap:wrap">
            <button id="modalBack" style="flex:1;min-width:120px;padding:14px 20px;background:#fff;color:#64748b;border:1px solid #cbd5e1;border-radius:10px;font-weight:600;cursor:pointer;font-size:14px;transition:all 0.2s">
              ${t('builderBack')}
            </button>
            <button id="modalRetry" style="flex:1;min-width:120px;padding:14px 20px;background:#113f7a;color:#fff;border:none;border-radius:10px;font-weight:600;cursor:pointer;font-size:14px;transition:all 0.2s">
              ${t('builderRetry')}
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Fonction pour mettre à jour l'indicateur
    const updateFeasibility = () => {
      const indicator = modal.querySelector('#feasibilityIndicator');
      const minStepsNeeded = Math.ceil(distance / currentMaxKm);
      const maxPossibleSteps = currentDays * 2;
      const isFeasible = minStepsNeeded <= maxPossibleSteps;
      
      if (isFeasible) {
        indicator.style.background = '#dcfce7';
        indicator.style.color = '#166534';
        indicator.innerHTML = `✅ Faisable (${minStepsNeeded} étapes nécessaires, ${maxPossibleSteps} possibles)`;
        modal.querySelector('#modalRetry').disabled = false;
        modal.querySelector('#modalRetry').style.opacity = '1';
      } else {
        indicator.style.background = '#fef2f2';
        indicator.style.color = '#991b1b';
        indicator.innerHTML = `❌ ${minStepsNeeded} étapes nécessaires, max ${maxPossibleSteps} en ${currentDays}j`;
        modal.querySelector('#modalRetry').disabled = true;
        modal.querySelector('#modalRetry').style.opacity = '0.5';
      }
    };
    
    // Event listeners
    modal.querySelector('#kmMinus').onclick = () => {
      if (currentMaxKm > 50) {
        currentMaxKm -= 50;
        modal.querySelector('#kmValue').textContent = `${currentMaxKm} km`;
        updateFeasibility();
      }
    };
    modal.querySelector('#kmPlus').onclick = () => {
      if (currentMaxKm < 500) {
        currentMaxKm += 50;
        modal.querySelector('#kmValue').textContent = `${currentMaxKm} km`;
        updateFeasibility();
      }
    };
    modal.querySelector('#daysMinus').onclick = () => {
      const t = (key) => window.ORT_I18N?.[key]?.[lang] || window.ORT_I18N?.[key]?.fr || key;
      if (currentDays > 1) {
        currentDays -= 1;
        modal.querySelector('#daysValue').textContent = `${currentDays} ${t('days')}`;
        updateFeasibility();
      }
    };
    modal.querySelector('#daysPlus').onclick = () => {
      const t = (key) => window.ORT_I18N?.[key]?.[lang] || window.ORT_I18N?.[key]?.fr || key;
      if (currentDays < 60) {
        currentDays += 1;
        modal.querySelector('#daysValue').textContent = `${currentDays} ${t('days')}`;
        updateFeasibility();
      }
    };
    
    modal.querySelector('#modalBack').onclick = () => {
      modal.remove();
      resolve('back');
    };
    
    modal.querySelector('#modalRetry').onclick = () => {
      config.maxKm = currentMaxKm;
      config.days = currentDays;
      config.detour = 30; // Reset du détour par défaut
      modal.remove();
      resolve('retry');
    };
    
    updateFeasibility();
  });
}

// === UI HELPERS ===
function showBuilderLoader(lang) {
  const t = (key) => window.ORT_I18N?.[key]?.[lang] || window.ORT_I18N?.[key]?.fr || key;
  let el = document.getElementById('builderLoader');
  if (!el) {
    el = document.createElement('div');
    el.id = 'builderLoader';
    el.innerHTML = `<div style="position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999">
      <div style="background:white;padding:40px;border-radius:16px;text-align:center">
        <div style="font-size:48px;margin-bottom:20px">🚗</div>
        <div style="font-size:18px;color:#113f7a">${t('builderLoading')}</div>
        <div style="margin-top:15px;width:200px;height:6px;background:#e2e8f0;border-radius:3px;overflow:hidden">
          <div style="width:30%;height:100%;background:#113f7a;border-radius:3px;animation:loaderAnim 1.5s ease-in-out infinite"></div>
        </div>
      </div>
    </div>
    <style>@keyframes loaderAnim{0%{width:10%;margin-left:0}50%{width:50%;margin-left:25%}100%{width:10%;margin-left:90%}}</style>`;
    document.body.appendChild(el);
  }
}

function hideBuilderLoader() {
  document.getElementById('builderLoader')?.remove();
}

function showBuilderError(lang, message) {
  hideBuilderLoader();
  const t = (key) => window.ORT_I18N?.[key]?.[lang] || window.ORT_I18N?.[key]?.fr || key;
  let el = document.getElementById('builderError');
  if (!el) {
    el = document.createElement('div');
    el.id = 'builderError';
    el.innerHTML = `<div style="position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999">
      <div style="background:white;padding:40px;border-radius:16px;text-align:center;max-width:400px">
        <div style="font-size:48px;margin-bottom:20px">❌</div>
        <div style="font-size:18px;color:#dc2626;margin-bottom:10px">${t('builderError')}</div>
        <div style="font-size:14px;color:#666">${message}</div>
        <button onclick="history.back()" style="margin-top:20px;padding:10px 30px;background:#3b82f6;color:white;border:none;border-radius:8px;cursor:pointer">${t('builderBack')}</button>
      </div>
    </div>`;
    document.body.appendChild(el);
  }
}

// === VALIDATION ROUTE: Détection passage par mer/ferry ===
function validateRouteIsDrivable(routeData, directDistance) {
  const ratio = routeData.distance / directDistance;
  
  console.log(`[ROUTE-BUILDER] 📏 Validation route:`);
  console.log(`[ROUTE-BUILDER]    - Route: ${routeData.distance}km, Direct: ${directDistance.toFixed(0)}km`);
  console.log(`[ROUTE-BUILDER]    - Ratio: ${ratio.toFixed(2)}, isReal: ${routeData.isReal}`);
  
  // CAS 1: Route OSRM réussie - on fait confiance au résultat
  if (routeData.isReal) {
    // Ratio > 5.0 = détour énorme, probablement contournement d'une mer
    if (ratio > 5.0) {
      console.warn(`[ROUTE-BUILDER] ⚠️ Ratio très élevé (${ratio.toFixed(2)}) → probable contournement maritime`);
      return {
        valid: false,
        reason: 'sea_crossing',
        message: 'Route trop longue (contournement maritime probable)',
        ratio: ratio,
        routeDistance: routeData.distance,
        directDistance: directDistance
      };
    }
    // Route OK
    return { valid: true, ratio: ratio };
  }
  
  // CAS 2: OSRM a échoué (isReal = false) - on a une ligne droite
  // Ce n'est PAS forcément une traversée maritime, OSRM peut simplement avoir timeout
  // On continue quand même mais on log un warning
  console.warn(`[ROUTE-BUILDER] ⚠️ OSRM a échoué, utilisation de la ligne droite`);
  console.warn(`[ROUTE-BUILDER]    → Les distances affichées seront approximatives`);
  
  // On ne bloque que si c'est clairement une île ou traversée évidente
  // Pour l'instant, on laisse passer et on fait confiance à l'utilisateur
  return { valid: true, ratio: ratio, warning: 'osrm_fallback' };
}

// === MODAL PASSAGE PAR MER ===
function showSeaCrossingModal(config, lang, validation) {
  return new Promise((resolve) => {
    const t = (key, params) => {
      let text = window.ORT_I18N?.[key]?.[lang] || window.ORT_I18N?.[key]?.fr || {
        seaCrossingTitle: { fr: '🌊 Traversée maritime détectée', en: '🌊 Sea crossing detected', es: '🌊 Cruce marítimo detectado' },
        seaCrossingText: { fr: 'Il n\'existe pas de route terrestre directe entre {start} et {end}. Un ferry ou un avion serait nécessaire.', en: 'There is no direct land route between {start} and {end}. A ferry or plane would be required.', es: 'No existe una ruta terrestre directa entre {start} y {end}. Se necesitaría un ferry o avión.' },
        seaCrossingSuggestion: { fr: 'Suggestions :', en: 'Suggestions:', es: 'Sugerencias:' },
        seaCrossingTip1: { fr: '• Choisissez des villes sur le même continent', en: '• Choose cities on the same continent', es: '• Elija ciudades en el mismo continente' },
        seaCrossingTip2: { fr: '• Pour traverser la Manche, partez de Calais ou Dunkerque', en: '• To cross the Channel, start from Calais or Dunkirk', es: '• Para cruzar el Canal, salga de Calais o Dunkerque' },
        seaCrossingTip3: { fr: '• Pour les îles, créez un itinéraire séparé', en: '• For islands, create a separate itinerary', es: '• Para las islas, cree un itinerario separado' },
        builderBack: { fr: 'Retour', en: 'Back', es: 'Volver' }
      }[key]?.[lang] || key;
      
      if (params) {
        Object.keys(params).forEach(k => {
          text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), params[k]);
        });
      }
      return text;
    };
    
    const modal = document.createElement('div');
    modal.id = 'seaCrossingModal';
    modal.innerHTML = `
      <div style="position:fixed;inset:0;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;z-index:99999;padding:20px">
        <div style="background:#fff;padding:28px;border-radius:16px;max-width:480px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.3)">
          <div style="font-size:24px;font-weight:700;color:#0369a1;margin-bottom:16px">${t('seaCrossingTitle')}</div>
          
          <p style="font-size:15px;color:#475569;line-height:1.6;margin-bottom:16px">
            ${t('seaCrossingText', { start: config.start.name, end: config.end.name })}
          </p>
          
          <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:14px 16px;margin-bottom:20px">
            <div style="font-size:14px;color:#0c4a6e;margin-bottom:8px">
              <strong>📊 Détails :</strong><br>
              • Distance vol d'oiseau : ${Math.round(validation.directDistance)} km<br>
              • Distance route : ${validation.routeDistance ? Math.round(validation.routeDistance) + ' km' : 'Non disponible'}<br>
              ${validation.ratio ? `• Ratio : ${validation.ratio.toFixed(1)}x (normal: 1.2-2.0x)` : ''}
            </div>
          </div>
          
          <div style="background:#fefce8;border:1px solid #fef08a;border-radius:10px;padding:14px 16px;margin-bottom:20px">
            <div style="font-size:14px;font-weight:600;color:#854d0e;margin-bottom:8px">${t('seaCrossingSuggestion')}</div>
            <div style="font-size:13px;color:#a16207;line-height:1.6">
              ${t('seaCrossingTip1')}<br>
              ${t('seaCrossingTip2')}<br>
              ${t('seaCrossingTip3')}
            </div>
          </div>
          
          <button id="seaCrossingBack" style="width:100%;padding:14px 20px;background:#0369a1;color:#fff;border:none;border-radius:10px;font-weight:600;cursor:pointer;font-size:15px;transition:all 0.2s">
            ${t('builderBack')}
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('#seaCrossingBack').onclick = () => {
      modal.remove();
      history.back();
      resolve('back');
    };
    
    // Fermer avec Escape
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', escHandler);
        history.back();
        resolve('back');
      }
    };
    document.addEventListener('keydown', escHandler);
  });
}

// Export pour utilisation externe
if (typeof window !== 'undefined') {
  window.initRouteBuilder = initRouteBuilder;
  window.RouteBuilder = {
    init: initRouteBuilder,
    calculateRoute: calculateBuilderOSRMRoute,
    loadPlaces: loadPlacesForRoute,
    selectSteps: selectStepsAlongRoute
  };
}
