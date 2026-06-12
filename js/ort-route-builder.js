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
    // Nombre d'étapes souhaité (param URL "steps", optionnel).
    // Convention : étapes = villes où l'on s'arrête, HORS départ et arrivée.
    // S'il est fourni, il PRIME sur maxKm : maxKm devient indicatif et les
    // dépassements sont signalés dans la modale de compromis.
    targetSteps: (function(){
      var v = parseInt(params.get('steps'));
      return (!isNaN(v) && v > 0) ? v : null;
    })(),
    loop: isLoopMode,
    excludePlaces: ((params.get('excludePlaces') || params.get('exclude') || '').split(',').filter(Boolean)),
    // Zone optionnelle (mode Circuit) : polygone dessiné à main levée
    // Format URL : zonePolygon=lat1,lon1;lat2,lon2;...
    zonePolygon: (function(){
      var raw = params.get('zonePolygon');
      if (!raw) return null;
      var pts = raw.split(';').map(function(s){
        var p = s.split(',');
        return [parseFloat(p[0]), parseFloat(p[1])];
      }).filter(function(p){ return !isNaN(p[0]) && !isNaN(p[1]); });
      return pts.length >= 3 ? pts : null;
    })()
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
  // Si l'utilisateur a fixé un nombre d'étapes, il prime sur maxKm :
  // on ne bloque pas ici, les dépassements seront signalés dans la
  // modale de compromis après génération.
  let loopCount = 0;
  while (!config.targetSteps) {
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
      } else if (routeValidation.reason === 'transcontinental') {
        showTranscontinentalModal(config, lang, routeValidation);
        return;
      } else if (routeValidation.reason === 'invalid_route') {
        showBuilderError(lang, 'Itinéraire invalide retourné par le serveur. Réessayez ou choisissez d\'autres villes.');
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
            place_type: p.place_type,
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

// Chercher une place ORT correspondant à une ville (par proximité géographique).
// On ne retourne JAMAIS un POI (site, nature, beach, island, suburb) comme étape :
// les POI sont des lieux à visiter, pas des étapes.
function findPlaceByCoords(lat, lon, places, maxDist = 5) {
  const CITY_TYPES = new Set([
    'capital','metropolis','large_city','city',
    'medium_city','small_city','village'
  ]);

  let bestPlace = null;
  let bestDist = maxDist;

  for (const pid in places) {
    const p = places[pid];
    // Filtre dur : on n'accepte que les villes
    if (!p.place_type || !CITY_TYPES.has(p.place_type)) continue;

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
  
  // ---------------------------------------------------------------
  // RÉPARTITION RÉGULIÈRE
  // Au lieu d'avancer de maxKm à chaque fois (ce qui empilait les
  // étapes sur la fin), on calcule un espacement régulier basé sur
  // la distance totale et le nombre d'étapes visées.
  // ---------------------------------------------------------------

  // Nombre d'étapes max : on respecte la contrainte maxKm comme un
  // PLAFOND (jamais plus de maxKm entre 2 étapes), mais on ne s'en
  // sert plus comme cible de marche.
  // Si l'utilisateur a fixé un nombre d'étapes (param URL "steps"),
  // ce nombre PRIME sur maxKm. Seule borne dure : 1 nuit minimum par
  // lieu (départ + étapes), donc au plus days - 1 étapes intermédiaires.
  let targetSteps;
  if (config.targetSteps) {
    targetSteps = Math.min(config.targetSteps, Math.max(1, days - 1));
    if (targetSteps < config.targetSteps) {
      config._stepsCapped = { requested: config.targetSteps, got: targetSteps, days: days };
      console.log(`[ROUTE-BUILDER] ⚠️ ${config.targetSteps} étapes demandées mais ${days} jours → plafonné à ${targetSteps}`);
    } else {
      console.log(`[ROUTE-BUILDER] 🎯 Nombre d'étapes imposé par l'utilisateur: ${targetSteps}`);
    }
  } else {
    const minStepsNeeded = Math.ceil(totalDist / maxKm);
    const maxStepsPossible = Math.max(2, days - 1);
    targetSteps = Math.max(minStepsNeeded, Math.min(days - 1, maxStepsPossible));
  }

  // Espacement moyen visé entre 2 étapes consécutives.
  // Exemple : 500 km, 6 tronçons → moyenne ≈ 83 km par étape.
  const avgSpacing = totalDist / (targetSteps + 1);

  // Fenêtre de sélection (en distance "précédente → candidate") :
  //   - mini = 0.6 × moyenne   → empêche les étapes collées
  //   - maxi = 1.3 × moyenne   → empêche les étapes trop éloignées
  // Cette même borne mini s'applique aussi vis-à-vis du départ et
  // de l'arrivée pour éviter les étapes "satellites" en début/fin
  // de route (ex: Trévoux à 38 km de Lyon).
  const minSpacing       = avgSpacing * 0.6;
  const maxSpacingNormal = avgSpacing * 1.3;
  const maxSpacingFb     = avgSpacing * 2.0; // fallback si rien trouvé

  console.log(`[ROUTE-BUILDER] 🎯 Étapes visées: ${targetSteps}${config.targetSteps ? ' (fixé par l\'utilisateur)' : ''}`);
  console.log(`[ROUTE-BUILDER] 📏 Moyenne ${avgSpacing.toFixed(0)}km — fenêtre [${minSpacing.toFixed(0)}-${maxSpacingNormal.toFixed(0)}km], fallback ${maxSpacingFb.toFixed(0)}km`);
  
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
  
  // Types de places considérés comme "villes" (= étapes valides).
  // On exclut tout ce qui est POI / site / nature / etc. pour éviter
  // que le builder empile "Louvre / Pompidou / Orsay" en fin de route.
  const CITY_TYPES = new Set([
    'capital','metropolis','large_city','city',
    'medium_city','small_city','village'
  ]);

  // Boucle pour ajouter les étapes
  // Logique : on raisonne sur la PROGRESSION le long de la route.
  //   - prev   = progression km de la dernière étape choisie
  //   - end    = progression km de l'arrivée
  //   - target = on cherche une étape entre prev+min et prev+max (en suivant la route)
  //   - on vérifie aussi qu'on laisse au moins min km jusqu'à l'arrivée
  const startProgress = getProgressOnRoute(steps[0].lat, steps[0].lon || steps[0].lng, routeData);
  const endProgress   = totalDist; // l'arrivée est en bout de route
  let prevProgress    = startProgress;

  for (let stepIdx = 1; stepIdx <= targetSteps; stepIdx++) {
    console.log(`[ROUTE-BUILDER] --- Étape ${stepIdx}/${targetSteps} ---`);

    // Reste de route à couvrir et reste d'étapes à placer
    const stepsLeft = targetSteps - stepIdx + 1; // nb d'étapes intermédiaires restantes (incluant celle-ci)
    const distLeft  = endProgress - prevProgress;

    // Si la distance restante est trop courte pour caser une étape de plus
    // sans tomber dans la zone d'arrivée, on arrête.
    if (distLeft < 2 * minSpacing) {
      console.log(`[ROUTE-BUILDER] ⏹️ Reste ${distLeft.toFixed(0)}km vers arrivée, < ${(2*minSpacing).toFixed(0)}km : arrêt`);
      break;
    }

    // Point cible = progression précédente + (distance restante / étapes restantes)
    // → ça redistribue dynamiquement si on a sauté une étape juste avant
    const targetProgress = prevProgress + (distLeft / stepsLeft);
    const targetPoint    = getPointAtDistance(routeData, targetProgress);

    if (!targetPoint) {
      console.log(`[ROUTE-BUILDER] ❌ Pas de point à ${targetProgress}km`);
      break;
    }

    console.log(`[ROUTE-BUILDER] Point cible: ${targetProgress.toFixed(0)}km (prev=${prevProgress.toFixed(0)}, distLeft=${distLeft.toFixed(0)})`);

    // Fonction interne : chercher la meilleure ville dans une fenêtre [min, max]
    // basée sur la progression sur la route, pas la distance à vol d'oiseau.
    // ⚠️ On exige aussi qu'il reste au moins minSpacing jusqu'à l'arrivée.
    const findBest = (maxWindow) => {
      let best = null;
      let bestScore = -Infinity;
      for (const pid in places) {
        if (usedPlaces.has(pid)) continue;
        const p = places[pid];

        // Filtre 1 : on ne garde QUE les villes. Si pas de place_type, on rejette.
        // Les POI (musées, châteaux, parcs...) ne peuvent jamais être étapes.
        if (!p.place_type || !CITY_TYPES.has(p.place_type)) continue;

        // Position de la place sur la route
        const pProgress = getProgressOnRoute(p.lat, p.lon, routeData);
        const distFromPrev = pProgress - prevProgress;
        const distToEndR   = endProgress - pProgress;

        // Filtre 2 : doit être devant nous (et pas après l'arrivée)
        if (distFromPrev <= 0) continue;
        if (distToEndR  <= 0) continue;

        // Filtre 3 : fenêtre [min, max] depuis la précédente
        if (distFromPrev < minSpacing) continue;
        if (distFromPrev > maxWindow)  continue;

        // Filtre 4 : doit laisser au moins minSpacing avant l'arrivée
        if (distToEndR < minSpacing) continue;

        // Filtre 5 : on prend en compte l'écart à vol d'oiseau pour le scoring
        // (pour pas piocher une place très excentrée)
        const distToTarget = _haversine(targetPoint.lat, targetPoint.lon, p.lat, p.lon);

        // Filtre 6 : exclure si même ville qu'une étape déjà choisie
        const pNameNorm = p.name.toLowerCase().replace(/[^a-z]/g, '');
        const tooClose = steps.some(s => {
          const sNameNorm = s.name.toLowerCase().replace(/[^a-z]/g, '');
          return pNameNorm.startsWith(sNameNorm) || sNameNorm.startsWith(pNameNorm);
        });
        if (tooClose) continue;

        // Filtre 7 : ne pas reprendre l'arrivée
        const endNameNorm = endForSteps.name.toLowerCase().replace(/[^a-z]/g, '');
        if (pNameNorm.startsWith(endNameNorm) || endNameNorm.startsWith(pNameNorm)) continue;

        const score = calculatePlaceScore(p, distToTarget, avgSpacing);
        if (score > bestScore) {
          bestScore = score;
          best = { ...p, pid, distToTarget, distFromPrev, pProgress, _score: score };
        }
      }
      return best;
    };

    // Tentative 1 : fenêtre normale [min, 1.3 × moyenne]
    let bestPlace = findBest(maxSpacingNormal);

    // Tentative 2 : on élargit à 2.0 × moyenne si rien trouvé
    if (!bestPlace) {
      console.log(`[ROUTE-BUILDER]    Rien dans [${minSpacing.toFixed(0)}-${maxSpacingNormal.toFixed(0)}km], élargissement à ${maxSpacingFb.toFixed(0)}km`);
      bestPlace = findBest(maxSpacingFb);
    }

    // Tentative 3 : fallback Nominatim (reverse geocoding sur le point cible)
    // Quand le master ORT n'a aucune ville taguée dans la zone, on demande
    // à OpenStreetMap quelle ville se trouve aux coords du point cible.
    if (!bestPlace) {
      console.log(`[ROUTE-BUILDER]    Aucune ville ORT, fallback Nominatim sur ${targetPoint.lat.toFixed(3)},${targetPoint.lon.toFixed(3)}`);
      const fallbackCity = await findCityFromNominatim(targetPoint.lat, targetPoint.lon);
      if (fallbackCity) {
        // Vérifier qu'on respecte quand même la borne mini depuis la précédente
        // ET vis-à-vis de l'arrivée, pour ne pas casser la régularité.
        const fbProgress = getProgressOnRoute(fallbackCity.lat, fallbackCity.lon, routeData);
        const fbFromPrev = fbProgress - prevProgress;
        const fbToEnd    = endProgress - fbProgress;
        if (fbFromPrev >= minSpacing && fbToEnd >= minSpacing) {
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
          prevProgress = fbProgress;
          console.log(`[ROUTE-BUILDER] ✅ Nominatim: "${fallbackCity.name}" (à ${fbFromPrev.toFixed(0)}km de la précédente)`);
          continue; // étape ajoutée, on passe à la suivante
        } else {
          console.log(`[ROUTE-BUILDER]    Nominatim "${fallbackCity.name}" hors fenêtre (prev=${fbFromPrev.toFixed(0)}km, end=${fbToEnd.toFixed(0)}km), ignoré`);
        }
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
      prevProgress = bestPlace.pProgress; // avance le curseur
      console.log(`[ROUTE-BUILDER] ✅ "${bestPlace.name}" (à ${bestPlace.distFromPrev.toFixed(0)}km de la précédente, écart cible ${bestPlace.distToTarget.toFixed(0)}km)`);
    } else {
      console.log(`[ROUTE-BUILDER] ⏭️ Aucune ville dans la fenêtre, étape sautée`);
      // On n'avance pas prevProgress : la prochaine itération va recalculer
      // un nouveau point cible avec stepsLeft décrémenté.
    }
  }
  
  // Ajouter l'arrivée — sauf si trop proche ou même ville qu'une étape déjà choisie
  const lastIntermediate = steps[steps.length - 1];
  const distToEnd = _haversine(lastIntermediate.lat, lastIntermediate.lon || lastIntermediate.lng, endForSteps.lat, endForSteps.lon || endForSteps.lng);
  const endNameNorm = endForSteps.name.toLowerCase().replace(/[^a-z]/g, '');
  const endIsDupe = steps.some(s => {
    const sNameNorm = s.name.toLowerCase().replace(/[^a-z]/g, '');
    return endNameNorm.startsWith(sNameNorm) || sNameNorm.startsWith(endNameNorm);
  });
  if ((distToEnd < 15 || endIsDupe) && !lastIntermediate.isStart) {
    // Trop proche : on fusionne en donnant les nuits à la dernière étape et on marque isEnd
    console.log(`[ROUTE-BUILDER] ⚠️ Arrivée "${endForSteps.name}" trop proche de "${lastIntermediate.name}" (${distToEnd.toFixed(0)}km) → fusion`);
    lastIntermediate.isEnd = true;
    lastIntermediate.nights = 0;
  } else {
    steps.push(endForSteps);
  }
  
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

// ====================================================================
// SORTIE STATIQUE — sauvegarde le voyage via ORT_STATE puis redirige
// vers la page coquille custom.html (rendu magazine) au lieu de rester
// sur roadtrip_detail.
// Fallback : comportement historique (injection window.state) si
// ORT_STATE est indisponible ou si la sauvegarde échoue.
// Opt-out debug : noStatic=1 dans l'URL conserve l'ancien comportement.
// Note : sans utilisateur connecté, ORT_STATE.saveTrip écrit en
// localStorage et la coquille relit le localStorage (patch template-v3).
// ====================================================================
const STATIC_LANG_FOLDERS = { fr: 'itineraires', en: 'itineraries', es: 'rutas', pt: 'roteiros', it: 'itinerari', ar: 'masar' };

async function saveAndRedirectToStatic(steps, itinerary, config, lang) {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('noStatic') === '1') return false;       // opt-out debug
  if (urlParams.get('returnTo') === 'mobile') return false;  // le flux mobile garde la priorité
  
  if (!window.ORT_STATE || typeof window.ORT_STATE.saveTrip !== 'function') {
    console.warn('[ROUTE-BUILDER] ORT_STATE indisponible → fallback roadtrip_detail');
    return false;
  }
  
  const totalNights = steps.reduce((sum, s) => sum + Math.round(s.nights || 0), 0);
  let totalKm = 0;
  for (let i = 1; i < steps.length; i++) {
    totalKm += _haversine(steps[i-1].lat, steps[i-1].lon || steps[i-1].lng, steps[i].lat, steps[i].lon || steps[i].lng);
  }
  
  const tripData = {
    // id préfixé custom:: → saveTrip le détecte comme temporaire et génère un trip_xxx propre
    id: 'custom::' + itinerary.itin_id,
    title: itinerary.title,
    cc: config.start.cc || (config.end && config.end.cc) || 'XX',
    country: config.start.cc || (config.end && config.end.cc) || 'XX',
    nights: totalNights,
    kms: Math.round(totalKm),
    saved: true, // visible dans le dashboard ; en anonyme saveTrip route quand même vers localStorage
    _fromBuilder: true,
    _isLoop: !!itinerary._isLoop,
    _builderConfig: config,
    steps: steps.map((s, i) => {
      const nx = steps[i + 1] || null;
      return {
        name: s.name,
        lat: s.lat,
        lng: s.lng || s.lon,
        lon: s.lng || s.lon,
        nights: Math.round(s.nights || 0),
        description: s.description || '',
        images: s.photos || s.images || [],
        photos: s.photos || s.images || [],
        visits: s.visits || [],
        activities: s.activities || [],
        place_id: s.place_id || null,
        cc: s.cc || config.start.cc || '',
        to_next_leg: nx ? {
          destination: nx.name,
          distance_km: Math.round(_haversine(s.lat, s.lon || s.lng, nx.lat, nx.lon || nx.lng)),
          duration_min: null
        } : null
      };
    })
  };
  
  try {
    const res = await window.ORT_STATE.saveTrip(tripData);
    if (!res || !res.success || !res.tripId) {
      console.warn('[ROUTE-BUILDER] saveTrip a échoué → fallback roadtrip_detail', res);
      return false;
    }
    const folder = STATIC_LANG_FOLDERS[lang] || STATIC_LANG_FOLDERS.en;
    const url = '/' + folder + '/custom.html?tripId=' + encodeURIComponent(res.tripId) + '&lang=' + lang;
    console.log('[ROUTE-BUILDER] ✅ Voyage sauvegardé (' + res.storage + '), redirection statique: ' + url);
    window.location.href = url;
    return true;
  } catch (e) {
    console.warn('[ROUTE-BUILDER] Erreur sauvegarde statique:', e);
    return false;
  }
}

// Générer l'itinéraire final et l'injecter dans l'interface
async function generateBuilderItinerary(steps, config, lang) {
  console.log('[ROUTE-BUILDER] 🎯 generateBuilderItinerary appelée');
  console.log(`[ROUTE-BUILDER] ${steps.length} étapes reçues: ${steps.map(s => s.name).join(' → ')}`);
  console.log(`[ROUTE-BUILDER] Jours demandés: ${config.days}`);
  
  // Le loader reste affiché : il sera masqué soit par la redirection
  // statique, soit explicitement dans le chemin fallback ci-dessous.
  
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
  
  if (totalNightsToDistribute > 0 && stepsWithNights.length > 0) {
    // Distribuer équitablement sur toutes les étapes avec nuits (round-robin)
    let remaining = totalNightsToDistribute;
    let idx = 0;
    while (remaining > 0) {
      stepsWithNights[idx % stepsWithNights.length].nights++;
      remaining--;
      idx++;
    }
  } else if (totalNightsToDistribute > 0) {
    // Pas d'étape intermédiaire : trajet trop court → message lisible
    hideBuilderLoader();
    showBuilderError(lang, window.ORT_I18N?.builderTooShort?.[lang] || window.ORT_I18N?.builderTooShort?.fr || 'Le trajet est trop court pour générer des étapes.');
    return;
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
  
  // === SORTIE STATIQUE (prioritaire) ===
  const redirectedToStatic = await saveAndRedirectToStatic(steps, itinerary, config, lang);
  if (redirectedToStatic) return;
  
  // === FALLBACK : comportement historique (roadtrip_detail) ===
  hideBuilderLoader();
  
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
    // Forcer le nombre de nuits demandé par l'utilisateur (sinon autoCalculateNights écrase)
    window.state.targetNights = config.days;
    window.state.requestedDays = config.days;
    console.log('[ROUTE-BUILDER] ✅ targetNights forcé à', config.days);
    
    // 📸 Réhydrater les photos catalogue depuis ort-data-loader.js
    (async function rehydratePhotosAB() {
      const maxAttempts = 6;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (typeof getPhotosForPlace === 'function') {
          let hydrated = 0;
          window.state.steps.forEach(step => {
            if (step && step.place_id) {
              const photos = getPhotosForPlace(step.place_id) || [];
              if (photos.length) {
                step.images = (typeof optimizePhotoUrls === 'function')
                  ? optimizePhotoUrls(photos)
                  : photos;
                step.photos = step.images;
                hydrated++;
              }
            }
          });
          console.log(`[ROUTE-BUILDER] 📸 Photos réhydratées: ${hydrated}/${window.state.steps.length} étapes`);
          if (typeof window.renderRows === 'function') window.renderRows();
          return;
        }
        await new Promise(r => setTimeout(r, 500));
      }
      console.warn('[ROUTE-BUILDER] ⚠️ getPhotosForPlace indisponible après 3s');
    })();
    
    // === TRIPID: Récupérer depuis URL ou ORT_TRIPID ===
    const urlParams = new URLSearchParams(window.location.search);
    const tripId = urlParams.get('tripId') || (window.ORT_TRIPID && window.ORT_TRIPID.get());
    if (tripId) {
      window.state.tripId = tripId;
      console.log('[ROUTE-BUILDER] ✅ tripId injecté dans state:', tripId);
      
      // Initialiser ORT_DETAIL_ADAPTER si disponible
      if (window.ORT_DETAIL_ADAPTER && typeof window.ORT_DETAIL_ADAPTER.init === 'function') {
        window.ORT_DETAIL_ADAPTER.init(tripId, window.state);
        console.log('[ROUTE-BUILDER] ✅ ORT_DETAIL_ADAPTER initialisé');
      }
    } else {
      console.warn('[ROUTE-BUILDER] ⚠️ Pas de tripId trouvé');
    }
    
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
    
    // Modale de compromis (s'il y en a)
    showCompromisesModalIfAny(steps, config, null, lang);
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
        images: s.photos || s.images || [],
        photos: s.photos || s.images || [],
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
    // 1. Calculer le rayon de recherche
    //    - basé sur maxKm × jours (portée réelle du circuit)
    //    - élargi si une zone polygonale est dessinée (pour couvrir tout son contenu)
    //    - plafonné à 600 km pour ne pas charger toute l'Europe
    let searchRadius = Math.max(config.maxKm * 1.5, (config.maxKm * config.days) / 2 + 50);
    if (config.zonePolygon && config.zonePolygon.length >= 3) {
      // Distance max entre le départ et un sommet du polygone
      let zoneFar = 0;
      for (const pt of config.zonePolygon) {
        const d = _haversine(config.start.lat, config.start.lon, pt[0], pt[1]);
        if (d > zoneFar) zoneFar = d;
      }
      // On veut couvrir tout le polygone avec un peu de marge
      searchRadius = Math.max(searchRadius, zoneFar + 30);
    }
    searchRadius = Math.min(searchRadius, 600);
    console.log(`[ROUTE-BUILDER] 📍 Rayon de recherche: ${searchRadius.toFixed(0)}km (maxKm=${config.maxKm}, jours=${config.days}${config.zonePolygon ? ', zone définie' : ''})`);
    
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
      
      // Stratégie de matching :
      //  - On cherche la place la PLUS PROCHE des coords envoyées (jusqu'à 10 km)
      //    → couvre les cas Cologne/Köln, Munich/München, Florence/Firenze...
      //  - Si rien à < 10 km, on accepte un match par NOM mais seulement si < 50 km
      //    → évite les homonymes lointains type Toul/Toulouse
      let bestByDist = null;
      let bestByDistKm = Infinity;
      let nameMatchFar = null;
      
      for (const p of arr) {
        const lat = p.lat, lng = p.lng || p.lon;
        if (!lat || !lng) continue;
        
        const dist = _haversine(start.lat, start.lon, lat, lng);
        
        // Meilleure place par distance (limite 10 km)
        if (dist < 10 && dist < bestByDistKm) {
          bestByDist = p;
          bestByDistKm = dist;
        }
        
        // Fallback par nom si pas de proche : on garde la plus proche par nom < 50 km
        if (!bestByDist && dist < 50) {
          const nameMatch = p.name?.toLowerCase().includes(start.name?.toLowerCase()) ||
                            start.name?.toLowerCase().includes(p.name?.toLowerCase());
          if (nameMatch && (!nameMatchFar || dist < _haversine(start.lat, start.lon, nameMatchFar.lat, nameMatchFar.lng || nameMatchFar.lon))) {
            nameMatchFar = p;
          }
        }
      }
      
      const found = bestByDist || nameMatchFar;
      if (found) {
        const fLat = found.lat, fLng = found.lng || found.lon;
        const fDist = _haversine(start.lat, start.lon, fLat, fLng);
        const matchType = bestByDist ? 'proximité' : 'nom';
        console.log(`[ROUTE-BUILDER] 🔍 Trouvé: ${found.name} (dist=${fDist.toFixed(1)}km, match=${matchType})`);
        return {
          place_id: found.place_id || found.id,
          name: found.name,
          lat: found.lat,
          lon: found.lng || found.lon,
          lng: found.lng || found.lon,
          rating: found.rating || found.score || 7,
          suggested_days: found.suggested_days || 2,
          _suggestedDays: found.suggested_days || 2,
          visits: found.visits || [],
          activities: found.activities || [],
          photos: found.photos || [],
          description: found.description || found.summary || '',
          cc: cc
        };
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
  
  // Mode "Autres suggestions" : on reste strictement dans le pays du départ
  // pour éviter les sauts aberrants (Londres → Paris/Amsterdam).
  if (config.preferStartCountry && start.cc) {
    console.log(`[ROUTE-BUILDER] 🏠 Restriction pays départ: ${start.cc.toUpperCase()} uniquement`);
  } else if (searchRadius > 100) {
    // Mode normal : ajouter les pays voisins si le rayon est grand
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
          
          // IMPORTANT: Filtrer par portée du circuit (pas par maxKm seul)
          // maxKm = distance entre 2 étapes consécutives
          // Portée max depuis le départ = maxKm × jours / 2 (on revient au point de départ)
          // On garde une marge généreuse via le searchRadius déjà calculé.
          if (distFromStart > searchRadius) continue;
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
            place_type: p.place_type,
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
  
  // === FILTRE PAR ZONE OPTIONNELLE (polygone dessiné) ===
  // Si un polygone est défini, on prépare une liste de candidats dedans
  // puis hors zone (pour le repli si pas assez).
  let inZone = placeArray;
  let outZone = [];
  let zoneInfo = null;
  
  if (config.zonePolygon && config.zonePolygon.length >= 3) {
    const poly = config.zonePolygon;
    // Algorithme point-in-polygon (ray casting)
    function pointInPoly(lat, lon){
      let inside = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++){
        const yi = poly[i][0], xi = poly[i][1];
        const yj = poly[j][0], xj = poly[j][1];
        const intersect = ((yi > lat) !== (yj > lat))
          && (lon < (xj - xi) * (lat - yi) / (yj - yi + 1e-12) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    }
    // Distance min d'un point au polygone (en km, approximative — distance au sommet le plus proche)
    function distToPoly(lat, lon){
      let minD = Infinity;
      for (const v of poly) {
        const d = _haversine(lat, lon, v[0], v[1]);
        if (d < minD) minD = d;
      }
      return minD;
    }
    
    inZone = [];
    outZone = [];
    for (const p of placeArray) {
      if (pointInPoly(p.lat, p.lon)) inZone.push(p);
      else outZone.push(p);
    }
    console.log(`[ROUTE-BUILDER] 🎯 Polygone (${poly.length} sommets) → ${inZone.length} dans / ${outZone.length} hors`);
    
    // Si la zone est trop pauvre (< 3 places utilisables), on élargit
    // en ajoutant les places à moins de 30 km du polygone, puis 60 km, etc.
    const minPlacesWanted = Math.max(3, Math.ceil(days / 2));
    let bufferKm = 0;
    while (inZone.length < minPlacesWanted && bufferKm < 200) {
      bufferKm += 30;
      const stillOut = [];
      for (const p of outZone) {
        if (distToPoly(p.lat, p.lon) <= bufferKm) inZone.push(p);
        else stillOut.push(p);
      }
      outZone = stillOut;
      console.log(`[ROUTE-BUILDER] 🔄 Zone trop pauvre, élargissement +${bufferKm}km → ${inZone.length} dans`);
    }
    
    zoneInfo = {
      inCount: inZone.length,
      outCount: 0,
      polygonPoints: poly.length,
      bufferKm: bufferKm // 0 si la zone d'origine suffisait
    };
  }
  
  // === SÉLECTION AVEC CONTRAINTE D'ESPACEMENT ===
  // Périmètre cible du circuit : maxKm × jours.
  // Nombre d'étapes visé : days (1 étape par jour environ).
  // Distance moyenne entre 2 étapes consécutives = périmètre / étapes.
  // On accepte une fenêtre [0.5x, 1.5x] de cette moyenne pour respirer.
  const targetPerimeter = maxKm * days;
  // Si l'utilisateur a fixé un nombre d'étapes (param URL "steps"), il prime.
  // Convention identique au mode A→B : étapes = villes hors point de départ.
  // Borne dure : au plus days - 1 (1 nuit minimum par étape + le départ).
  let targetSteps;
  if (config.targetSteps) {
    targetSteps = Math.max(1, Math.min(config.targetSteps, Math.max(1, days - 1)));
    if (targetSteps < config.targetSteps) {
      config._stepsCapped = { requested: config.targetSteps, got: targetSteps, days: days };
      console.log(`[ROUTE-BUILDER] ⚠️ ${config.targetSteps} étapes demandées mais ${days} jours → plafonné à ${targetSteps}`);
    } else {
      console.log(`[ROUTE-BUILDER] 🎯 Nombre d'étapes imposé par l'utilisateur: ${targetSteps}`);
    }
  } else {
    targetSteps = Math.max(3, Math.min(days, 10));
  }
  const avgSpacing = targetPerimeter / (targetSteps + 1); // +1 car le départ compte
  const minSpacing = avgSpacing * 0.5;
  const maxSpacing = avgSpacing * 1.5;
  
  console.log(`[ROUTE-BUILDER] 📏 Périmètre cible: ${targetPerimeter}km, étapes visées: ${targetSteps}`);
  console.log(`[ROUTE-BUILDER] 📏 Espacement moyen: ${avgSpacing.toFixed(0)}km, fenêtre [${minSpacing.toFixed(0)}-${maxSpacing.toFixed(0)}km]`);
  
  // Helper : distance min entre une place et toutes les places déjà retenues (+ départ)
  function minDistToSelected(place, selectedList) {
    let minDist = _haversine(start.lat, start.lon, place.lat, place.lon);
    for (const s of selectedList) {
      const d = _haversine(s.lat, s.lon, place.lat, place.lon);
      if (d < minDist) minDist = d;
    }
    return minDist;
  }
  
  // Fonction utilitaire : exécute une passe de sélection sur une liste donnée
  function runPass(list, minSp, maxSp, label) {
    for (const place of list) {
      if (selected.length >= targetSteps) break;
      if (selected.includes(place)) continue;
      const distMin = minDistToSelected(place, selected);
      if (distMin < minSp) continue;
      if (distMin > maxSp) continue;
      selected.push(place);
      totalSuggestedDays += (place.suggested_days || 1);
      console.log(`[ROUTE-BUILDER]   ✅ ${place.name} retenue (${label}, distMin=${distMin.toFixed(0)}km)`);
    }
  }
  
  const selected = [];
  let totalSuggestedDays = startSuggestedDays;
  
  // PASSES 1-2-3 : sur la zone (ou sur tout si pas de zone)
  // Passe 1 : fenêtre stricte
  console.log(`[ROUTE-BUILDER] Passe 1 (zone) [${minSpacing.toFixed(0)}-${maxSpacing.toFixed(0)}km]`);
  runPass(inZone, minSpacing, maxSpacing, 'passe 1');
  
  // Passe 2 : fenêtre élargie sur la zone
  if (selected.length < targetSteps && inZone.length) {
    const minSp2 = minSpacing * 0.5;
    const maxSp2 = avgSpacing * 2.0;
    console.log(`[ROUTE-BUILDER] Passe 2 (zone élargie) [${minSp2.toFixed(0)}-${maxSp2.toFixed(0)}km]`);
    runPass(inZone, minSp2, maxSp2, 'passe 2');
  }
  
  // Passe 3 : on prend ce qui reste dans la zone, juste min 15km
  if (selected.length < targetSteps && inZone.length) {
    console.log(`[ROUTE-BUILDER] Passe 3 (zone, min 15km)`);
    runPass(inZone, 15, Infinity, 'passe 3');
  }
  
  // === REPLI HORS ZONE si on n'a pas assez d'étapes ===
  const zoneOnlyCount = selected.length;
  if (selected.length < Math.max(3, targetSteps - 1) && outZone.length) {
    console.log(`[ROUTE-BUILDER] ⚠️ Pas assez dans la zone (${selected.length}/${targetSteps}), repli sur hors-zone`);
    // Passe 4 : hors zone, fenêtre élargie
    const minSp4 = minSpacing * 0.5;
    const maxSp4 = avgSpacing * 2.0;
    runPass(outZone, minSp4, maxSp4, 'repli hors-zone');
    
    // Passe 5 : dernier recours, hors zone, juste min 15km
    if (selected.length < Math.max(3, targetSteps - 2)) {
      runPass(outZone, 15, Infinity, 'repli hors-zone, min 15km');
    }
    
    if (zoneInfo) zoneInfo.outCount = selected.length - zoneOnlyCount;
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
  
  // === RÉPARTITION VERS LE HAUT si on n'a pas assez de nuits ===
  // Cas typique : zone restreinte avec peu de lieux disponibles.
  // On ajoute des nuits sur les meilleurs lieux en respectant à la fois :
  //  - le rating (qualité du lieu)
  //  - les suggested_days (durée conseillée par le master place)
  //  - pas dépasser 2× suggested_days pour ne pas saturer un petit lieu
  let safetyCounter = 0;
  let startNightsAdjusted = startNights;
  const startSuggested = startSuggestedDays;
  
  while (totalNightsAssigned < days && safetyCounter < days * 5) {
    safetyCounter++;
    // Construire la liste des candidats avec un score d'attribution
    // Score = rating + bonus suggested_days - pénalité si déjà saturé
    function buildCand(name, rating, suggested, nights, isStart, ref) {
      const saturation = nights / Math.max(0.5, suggested); // 1.0 = juste ce qu'il faut, >1 = au-dessus
      // Pénalité forte si on dépasse déjà 2× les jours conseillés
      const penalty = saturation > 2 ? 50 : (saturation > 1.5 ? 15 : 0);
      const bonus = Math.min(suggested, 3) * 3; // priorité aux lieux qui méritent du temps
      return { name, rating, suggested, nights, isStart, ref,
        score: (rating || 5) * 5 + bonus - penalty - saturation * 2 };
    }
    const candidates = [
      buildCand(start.name, start.rating || 8, startSuggested, startNightsAdjusted, true, null),
      ...selected.map(s => buildCand(s.name, s.rating || 5, s.suggested_days || 1, s.nights, false, s))
    ];
    // Meilleur score = celui qui mérite la prochaine nuit
    candidates.sort((a, b) => b.score - a.score);
    const winner = candidates[0];
    if (winner.isStart) {
      startNightsAdjusted++;
    } else if (winner.ref) {
      winner.ref.nights++;
    }
    totalNightsAssigned++;
    console.log(`[ROUTE-BUILDER] ⬆️ +1 nuit → ${winner.name} (rating=${winner.rating}, sd=${winner.suggested}, nuits=${winner.nights + 1}, score=${winner.score.toFixed(1)})`);
  }
  const finalStartNights = startNightsAdjusted;
  
  console.log(`[ROUTE-BUILDER] Total nuits: ${totalNightsAssigned}/${days}`);
  
  // === ORDONNANCEMENT NEAREST-NEIGHBOR ===
  // On part du départ et à chaque étape on prend la ville restante la plus proche.
  // Ça donne un ordre quasi-optimal (proche du voyageur de commerce) sans forcer
  // un tour circulaire géométrique. Bien plus régulier que le tri par angle.
  const ordered = [];
  let currentPos = { lat: start.lat, lon: start.lon };
  const remaining = [...selected];
  
  while (remaining.length > 0) {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = _haversine(currentPos.lat, currentPos.lon, remaining[i].lat, remaining[i].lon);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    const next = remaining.splice(bestIdx, 1)[0];
    ordered.push(next);
    currentPos = { lat: next.lat, lon: next.lon };
    console.log(`[ROUTE-BUILDER]   → ${next.name} (${bestDist.toFixed(0)}km de la précédente)`);
  }
  // Distance finale vers le retour au départ (info pour log)
  const distBack = _haversine(currentPos.lat, currentPos.lon, start.lat, start.lon);
  console.log(`[ROUTE-BUILDER]   → retour ${start.name} (${distBack.toFixed(0)}km)`);
  
  // Remplacer selected par l'ordre optimisé
  selected.length = 0;
  selected.push(...ordered);
  
  // === 2-OPT : amélioration de l'ordre pour éviter les zigzags ===
  // Le nearest-neighbor est local et peut produire des croisements (ex: 9-10 zigzag).
  // Le 2-opt teste l'inversion de chaque sous-séquence et garde si la distance totale baisse.
  // On inclut le départ et le retour pour mesurer le circuit complet.
  function tourDistance(tour, startPt) {
    let total = _haversine(startPt.lat, startPt.lon, tour[0].lat, tour[0].lon);
    for (let i = 0; i < tour.length - 1; i++) {
      total += _haversine(tour[i].lat, tour[i].lon, tour[i+1].lat, tour[i+1].lon);
    }
    total += _haversine(tour[tour.length-1].lat, tour[tour.length-1].lon, startPt.lat, startPt.lon);
    return total;
  }
  
  let tour = [...selected];
  let improved = true;
  let iterations = 0;
  const initialDist = tourDistance(tour, start);
  console.log(`[ROUTE-BUILDER] 🔁 2-opt: distance initiale ${initialDist.toFixed(0)}km`);
  
  while (improved && iterations < 50) {
    improved = false;
    iterations++;
    for (let i = 0; i < tour.length - 1; i++) {
      for (let j = i + 1; j < tour.length; j++) {
        // Inverser le segment [i..j]
        const newTour = [...tour.slice(0, i), ...tour.slice(i, j+1).reverse(), ...tour.slice(j+1)];
        const newDist = tourDistance(newTour, start);
        if (newDist < tourDistance(tour, start) - 0.5) { // seuil 0.5km pour éviter le bruit
          tour = newTour;
          improved = true;
        }
      }
    }
  }
  const finalDist = tourDistance(tour, start);
  console.log(`[ROUTE-BUILDER] 🔁 2-opt: distance finale ${finalDist.toFixed(0)}km (${iterations} itérations, gain ${(initialDist-finalDist).toFixed(0)}km)`);
  
  // Reporter l'ordre optimisé
  selected.length = 0;
  selected.push(...tour);
  
  // Re-logger l'ordre final
  let posLog = { lat: start.lat, lon: start.lon };
  for (const p of selected) {
    const d = _haversine(posLog.lat, posLog.lon, p.lat, p.lon);
    console.log(`[ROUTE-BUILDER]   ✓ ${p.name} (${d.toFixed(0)}km)`);
    posLog = { lat: p.lat, lon: p.lon };
  }
  
  // Garder toutes les étapes (le filtre maxKm × 1.5 cassait les boucles longues).
  // On marque juste les sauts longs pour info, sans rien jeter.
  const validCircuit = [];
  currentPos = { lat: start.lat, lon: start.lon };
  let longHopsCount = 0;
  let longHopsMaxKm = 0;
  
  for (const place of selected) {
    const dist = _haversine(currentPos.lat, currentPos.lon, place.lat, place.lon);
    if (dist > maxKm * 1.5) {
      longHopsCount++;
      if (dist > longHopsMaxKm) longHopsMaxKm = dist;
      place._tooFar = true;
      console.log(`[ROUTE-BUILDER] ⚠️ ${place.name} : saut long ${dist.toFixed(0)}km (> ${(maxKm * 1.5).toFixed(0)}km) — gardée quand même`);
    }
    validCircuit.push(place);
    currentPos = { lat: place.lat, lon: place.lon };
  }
  
  if (longHopsCount > 0 && zoneInfo) {
    zoneInfo.longHopsCount = longHopsCount;
    zoneInfo.longHopsMaxKm = Math.round(longHopsMaxKm);
  }
  
  // Construire les étapes finales
  const steps = [{ 
    ...start, 
    nights: finalStartNights,
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
  
  // Stocker l'info zone pour transmission au mobile (bandeau de repli)
  window._loopZoneInfo = zoneInfo;
  
  return steps;
}

// Générer l'itinéraire pour le mode circuit
async function generateLoopItinerary(steps, config, lang) {
  // Le loader reste affiché : il sera masqué soit par la redirection
  // statique, soit explicitement dans le chemin fallback ci-dessous.
  
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
    _usedPlaces: steps.filter(s => s.place_id && !s.isStart && !s.isEnd).map(s => s.place_id),
    _usedPlacesWithRating: steps.filter(s => s.place_id && !s.isStart && !s.isEnd).map(s => ({ pid: s.place_id, rating: s.rating || 0 }))
  };
  
  // Sauvegarder la config pour le recalcul
  window._loopBuilderConfig = config;
  window._loopUsedPlaces = itinerary._usedPlaces;
  window._loopUsedPlacesWithRating = itinerary._usedPlacesWithRating;
  
  console.log(`[ROUTE-BUILDER] 📋 Itinéraire généré: "${title}", ${totalNights} nuits, ${steps.length} étapes`);
  
  // === SORTIE STATIQUE (prioritaire) ===
  const redirectedToStatic = await saveAndRedirectToStatic(steps, itinerary, config, lang);
  if (redirectedToStatic) return;
  
  // === FALLBACK : comportement historique (roadtrip_detail) ===
  hideBuilderLoader();
  
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
    // Forcer le nombre de nuits demandé par l'utilisateur (sinon autoCalculateNights écrase)
    window.state.targetNights = config.days;
    window.state.requestedDays = config.days;
    console.log('[ROUTE-BUILDER] ✅ targetNights forcé à', config.days, '(loop)');
    
    // 📸 Réhydrater les photos catalogue depuis ort-data-loader.js
    // (les masters JSON n'ont pas de champ photos — elles sont chargées séparément)
    // On retry pendant 3 secondes au cas où getPhotosForPlace ne soit pas encore prêt.
    (async function rehydratePhotosLoop() {
      const maxAttempts = 6; // 6 × 500ms = 3s max
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (typeof getPhotosForPlace === 'function') {
          let hydrated = 0;
          window.state.steps.forEach(step => {
            if (step && step.place_id) {
              const photos = getPhotosForPlace(step.place_id) || [];
              if (photos.length) {
                step.images = (typeof optimizePhotoUrls === 'function')
                  ? optimizePhotoUrls(photos)
                  : photos;
                step.photos = step.images;
                hydrated++;
              }
            }
          });
          console.log(`[ROUTE-BUILDER] 📸 Photos réhydratées (loop): ${hydrated}/${window.state.steps.length} étapes`);
          if (typeof window.renderRows === 'function') window.renderRows();
          return;
        }
        await new Promise(r => setTimeout(r, 500));
      }
      console.warn('[ROUTE-BUILDER] ⚠️ getPhotosForPlace indisponible après 3s, photos non réhydratées');
    })();
    
    // === TRIPID: Récupérer depuis URL ou ORT_TRIPID ===
    const urlParams = new URLSearchParams(window.location.search);
    const tripId = urlParams.get('tripId') || (window.ORT_TRIPID && window.ORT_TRIPID.get());
    if (tripId) {
      window.state.tripId = tripId;
      console.log('[ROUTE-BUILDER] ✅ tripId injecté dans state (loop):', tripId);
      
      // Initialiser ORT_DETAIL_ADAPTER si disponible
      if (window.ORT_DETAIL_ADAPTER && typeof window.ORT_DETAIL_ADAPTER.init === 'function') {
        window.ORT_DETAIL_ADAPTER.init(tripId, window.state);
        console.log('[ROUTE-BUILDER] ✅ ORT_DETAIL_ADAPTER initialisé (loop)');
      }
    }
    
    // Mettre à jour le titre
    const titlePill = document.querySelector('.pill.title');
    if (titlePill) titlePill.textContent = title;
    
    if (typeof renderSteps === 'function') renderSteps();
    if (typeof recalcAllLegs === 'function') recalcAllLegs();
    if (typeof renderRows === 'function') renderRows();
  }
  
  // Modale de compromis (s'il y en a)
  showCompromisesModalIfAny(steps, config, window._loopZoneInfo || null, lang);
  
  // Afficher le bouton recalculer si mode circuit
  showRecalculateButton(config, lang);
  
  // === GESTION RETOUR VERS RT MOBILE (mode loop) ===
  const returnToLoop = new URLSearchParams(location.search).get('returnTo');
  if (returnToLoop === 'mobile') {
    console.log('[ROUTE-BUILDER] 🔄 returnTo=mobile détecté en mode loop → préparation retour mobile');
    const builderResult = {
      title: title,
      cc: config.start.cc || config.end.cc || 'XX',
      // === Données pour permettre le recalcul côté mobile ===
      _isLoop: true,
      _loopConfig: {
        start: config.start,
        days: config.days,
        maxKm: config.maxKm,
        detour: config.detour,
        excludePlaces: [...(config.excludePlaces || []), ...(window._loopUsedPlaces || [])],
        zonePolygon: config.zonePolygon || null
      },
      _loopUsedPlaces: window._loopUsedPlaces || [],
      _zoneInfo: window._loopZoneInfo || null,
      steps: steps.map(s => ({
        name: s.name,
        lat: s.lat,
        lng: s.lng || s.lon,
        lon: s.lng || s.lon,
        nights: s.nights || 0,
        description: s.description || '',
        images: s.photos || s.images || [],
        photos: s.photos || s.images || [],
        visits: s.visits || [],
        activities: s.activities || [],
        place_id: s.place_id || null,
        cc: s.cc || config.start.cc,
        to_next_leg: s.to_next_leg || null
      }))
    };
    
    localStorage.setItem('ORT_BUILDER_RESULT', JSON.stringify(builderResult));
    console.log('[ROUTE-BUILDER] ✅ ORT_BUILDER_RESULT sauvegardé (avec config recalcul), redirection mobile dans 1s');
    
    setTimeout(() => {
      window.location.href = `roadtrip_mobile.html?fromBuilder=1&lang=${lang}`;
    }, 1000);
  }
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
  
  // N'exclure que la moitié la moins bien notée des places précédentes :
  // on libère les 50% les mieux notées pour qu'elles puissent être réutilisées,
  // ce qui évite les replis hors-zone aberrants (Paris/Amsterdam depuis Londres).
  const usedWithRating = window._loopUsedPlacesWithRating || [];
  let toExclude;
  if (usedWithRating.length > 0) {
    const sorted = [...usedWithRating].sort((a, b) => (a.rating || 0) - (b.rating || 0));
    const halfCount = Math.ceil(sorted.length / 2);
    toExclude = sorted.slice(0, halfCount).map(p => p.pid);
    console.log(`[ROUTE-BUILDER] 50% exclusion: ${toExclude.length}/${sorted.length} places exclues (les moins bien notées)`);
    console.log(`[ROUTE-BUILDER] Exclues:`, sorted.slice(0, halfCount).map(p => `${p.pid}(${p.rating})`).join(', '));
    console.log(`[ROUTE-BUILDER] Réutilisables:`, sorted.slice(halfCount).map(p => `${p.pid}(${p.rating})`).join(', '));
  } else {
    toExclude = window._loopUsedPlaces || [];
  }
  
  config.excludePlaces = [...(config.excludePlaces || []), ...toExclude];
  
  console.log(`[ROUTE-BUILDER] Exclusions totales: ${config.excludePlaces.length}`);
  
  // Mode "Autres suggestions" : préférer rester dans le pays du départ
  // (évite les sauts vers Paris/Amsterdam depuis Londres par exemple).
  // On signale cette préférence via config — loadPlacesForLoop l'utilise.
  config.preferStartCountry = true;
  if (config.start && config.start.cc) {
    console.log(`[ROUTE-BUILDER] 🏠 Préférence pays départ activée: ${config.start.cc}`);
  }
  
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

// === MODAL TRAJET TRANSCONTINENTAL ===
// Affichée quand la distance directe entre start et end dépasse 3000 km,
// ce qui rend tout trajet routier impossible (continents séparés).
function showTranscontinentalModal(config, lang, validation) {
  const TR_I18N = {
    title: {
      fr: '🌍 Trajet routier impossible',
      en: '🌍 Road trip not possible',
      it: '🌍 Viaggio in auto impossibile',
      es: '🌍 Viaje por carretera imposible',
      pt: '🌍 Viagem de carro impossível',
      ar: '🌍 الرحلة البرية مستحيلة'
    },
    intro: {
      fr: 'La distance à vol d\'oiseau entre {start} et {end} est de {km} km. Aucune route ne relie ces deux villes — elles sont séparées par un océan ou un autre continent.',
      en: 'The straight-line distance between {start} and {end} is {km} km. No road connects these two cities — they are separated by an ocean or different continents.',
      it: 'La distanza in linea d\'aria tra {start} e {end} è di {km} km. Nessuna strada collega queste due città — sono separate da un oceano o da continenti diversi.',
      es: 'La distancia en línea recta entre {start} y {end} es de {km} km. Ninguna carretera conecta estas dos ciudades — están separadas por un océano o continentes diferentes.',
      pt: 'A distância em linha reta entre {start} e {end} é de {km} km. Nenhuma estrada liga estas duas cidades — estão separadas por um oceano ou continentes diferentes.',
      ar: 'المسافة المباشرة بين {start} و {end} هي {km} كم. لا يوجد طريق يربط بين هاتين المدينتين — فهما مفصولتان بمحيط أو قارات مختلفة.'
    },
    suggestion: {
      fr: 'Pour un roadtrip, choisissez deux villes sur le même continent.',
      en: 'For a road trip, choose two cities on the same continent.',
      it: 'Per un viaggio in auto, scegli due città sullo stesso continente.',
      es: 'Para un viaje por carretera, elige dos ciudades en el mismo continente.',
      pt: 'Para uma viagem de carro, escolha duas cidades no mesmo continente.',
      ar: 'لرحلة برية، اختر مدينتين في نفس القارة.'
    },
    btn: {
      fr: 'Modifier mes villes',
      en: 'Change my cities',
      it: 'Modifica le mie città',
      es: 'Cambiar mis ciudades',
      pt: 'Alterar as minhas cidades',
      ar: 'تغيير المدن'
    }
  };
  const l = TR_I18N.title[lang] ? lang : 'fr';
  const isRTL = (l === 'ar');
  const tr = (key, params) => {
    let text = TR_I18N[key]?.[l] || TR_I18N[key]?.fr || key;
    if (params) Object.keys(params).forEach(k => {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), params[k]);
    });
    return text;
  };
  
  const modal = document.createElement('div');
  modal.id = 'transcontinentalModal';
  modal.innerHTML = `
    <div style="position:fixed;inset:0;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;z-index:99999;padding:20px" dir="${isRTL ? 'rtl' : 'ltr'}">
      <div style="background:#fff;padding:28px;border-radius:16px;max-width:500px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.3);text-align:${isRTL ? 'right' : 'left'}">
        <div style="font-size:20px;font-weight:700;color:#b91c1c;margin-bottom:14px">${tr('title')}</div>
        <p style="font-size:15px;color:#475569;line-height:1.6;margin-bottom:14px">
          ${tr('intro', { start: config.start.name, end: config.end.name, km: Math.round(validation.directDistance) })}
        </p>
        <p style="font-size:14px;color:#64748b;line-height:1.6;margin-bottom:22px;font-style:italic">
          ${tr('suggestion')}
        </p>
        <div style="display:flex;justify-content:flex-end">
          <button id="transContBack" style="padding:14px 22px;background:#113f7a;color:#fff;border:none;border-radius:10px;font-weight:600;cursor:pointer;font-size:14px">
            ${tr('btn')}
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  modal.querySelector('#transContBack').addEventListener('click', () => {
    history.back();
  });
}


function validateRouteIsDrivable(routeData, directDistance) {
  const ratio = routeData.distance / directDistance;
  
  console.log(`[ROUTE-BUILDER] 📏 Validation route:`);
  console.log(`[ROUTE-BUILDER]    - Route: ${routeData.distance}km, Direct: ${directDistance.toFixed(0)}km`);
  console.log(`[ROUTE-BUILDER]    - Ratio: ${ratio.toFixed(2)}, isReal: ${routeData.isReal}`);
  
  // CAS 0: Distance directe absurde pour de la voiture (> 3000km à vol d'oiseau)
  // Ex: New York → Paris (5837km direct) = transatlantique, impossible en voiture
  if (directDistance > 3000) {
    console.warn(`[ROUTE-BUILDER] 🚫 Distance directe ${directDistance.toFixed(0)}km > 3000km : trajet routier impossible (continents séparés)`);
    return {
      valid: false,
      reason: 'transcontinental',
      message: 'Distance trop importante pour un trajet routier (continents séparés)',
      ratio: ratio,
      routeDistance: routeData.distance,
      directDistance: directDistance
    };
  }
  
  // CAS 1: Route OSRM réussie - on fait confiance au résultat, mais on sanity-check
  if (routeData.isReal) {
    // Ratio < 0.9 = route plus courte que la ligne droite = IMPOSSIBLE
    // Signe qu'OSRM a renvoyé une route incohérente (ex: portion locale au lieu du trajet complet)
    if (ratio < 0.9) {
      console.warn(`[ROUTE-BUILDER] 🚫 Ratio aberrant (${ratio.toFixed(2)}) : route OSRM plus courte que la ligne droite, donnée corrompue`);
      return {
        valid: false,
        reason: 'invalid_route',
        message: 'Route incohérente renvoyée par le serveur (ratio aberrant)',
        ratio: ratio,
        routeDistance: routeData.distance,
        directDistance: directDistance
      };
    }
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
        builderBack: { fr: 'Retour', en: 'Back', es: 'Volver', pt: 'Voltar', it: 'Indietro', de: 'Zurück' },
        builderTooShort: { fr: 'Le trajet est trop court pour générer des étapes. Essayez avec une distance plus grande.', en: 'The route is too short to generate stops. Try with a longer distance.', es: 'El trayecto es demasiado corto para generar etapas. Prueba con una distancia mayor.', pt: 'O percurso é curto demais para gerar etapas. Tente com uma distância maior.', it: 'Il percorso è troppo breve per generare tappe. Prova con una distanza maggiore.', de: 'Die Strecke ist zu kurz, um Etappen zu erstellen. Versuche es mit einer größeren Distanz.' }
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

// ====================================================================
// MODALE DE COMPROMIS — affichée après génération si certains critères
// n'ont pas pu être respectés à la lettre.
// ====================================================================

// Textes traduits (fr, en, it, es, pt, ar)
const COMPROMISES_I18N = {
  title: {
    fr: 'Itinéraire généré avec quelques compromis',
    en: 'Itinerary generated with some compromises',
    it: 'Itinerario generato con alcuni compromessi',
    es: 'Itinerario generado con algunos compromisos',
    pt: 'Itinerário gerado com alguns compromissos',
    ar: 'تم إنشاء المسار مع بعض التنازلات'
  },
  intro: {
    fr: 'Voici les points où nous avons dû nous adapter :',
    en: 'Here are the points where we had to adapt:',
    it: 'Ecco i punti in cui abbiamo dovuto adattarci:',
    es: 'Estos son los puntos donde hemos tenido que adaptarnos:',
    pt: 'Estes são os pontos onde tivemos de nos adaptar:',
    ar: 'فيما يلي النقاط التي اضطررنا فيها إلى التكيف:'
  },
  distance: {
    fr: '{n} trajet(s) dépasse(nt) {max} km (jusqu\'à {worst} km)',
    en: '{n} leg(s) exceed {max} km (up to {worst} km)',
    it: '{n} tratta(e) supera(no) {max} km (fino a {worst} km)',
    es: '{n} tramo(s) supera(n) {max} km (hasta {worst} km)',
    pt: '{n} trecho(s) excede(m) {max} km (até {worst} km)',
    ar: '{n} مسار(ات) تتجاوز {max} كم (حتى {worst} كم)'
  },
  stepsCap: {
    fr: 'Zone trop grande pour {max} km/étape : il en faudrait {needed} au lieu de {got}',
    en: 'Area too large for {max} km/leg: would need {needed} stops instead of {got}',
    it: 'Zona troppo grande per {max} km/tappa: ne servirebbero {needed} invece di {got}',
    es: 'Zona demasiado grande para {max} km/etapa: harían falta {needed} en vez de {got}',
    pt: 'Zona demasiado grande para {max} km/etapa: seriam necessárias {needed} em vez de {got}',
    ar: 'المنطقة كبيرة جدًا لـ {max} كم/مرحلة: نحتاج {needed} بدلاً من {got}'
  },
  stepsRequested: {
    fr: 'Vous avez demandé {requested} étapes, mais {days} jours ne permettent que {got} (1 nuit minimum par étape)',
    en: 'You asked for {requested} stops, but {days} days only allow {got} (1 night minimum per stop)',
    it: 'Hai chiesto {requested} tappe, ma {days} giorni ne consentono solo {got} (minimo 1 notte per tappa)',
    es: 'Pediste {requested} etapas, pero {days} días solo permiten {got} (mínimo 1 noche por etapa)',
    pt: 'Pediu {requested} etapas, mas {days} dias só permitem {got} (mínimo 1 noite por etapa)',
    ar: 'طلبت {requested} مراحل، لكن {days} أيام تسمح بـ {got} فقط (ليلة واحدة على الأقل لكل مرحلة)'
  },
  outOfZone: {
    fr: '{n} étape(s) placée(s) hors de la zone que vous avez dessinée',
    en: '{n} stop(s) placed outside the area you drew',
    it: '{n} tappa(e) posizionata(e) fuori dalla zona disegnata',
    es: '{n} parada(s) colocada(s) fuera de la zona dibujada',
    pt: '{n} paragem(ns) colocada(s) fora da zona desenhada',
    ar: '{n} محطة(ات) موضوعة خارج المنطقة التي رسمتها'
  },
  btnKeep: {
    fr: 'Garder cet itinéraire',
    en: 'Keep this itinerary',
    it: 'Mantieni questo itinerario',
    es: 'Mantener este itinerario',
    pt: 'Manter este itinerário',
    ar: 'الاحتفاظ بهذا المسار'
  },
  btnModify: {
    fr: 'Modifier mes critères',
    en: 'Adjust my criteria',
    it: 'Modifica i miei criteri',
    es: 'Modificar mis criterios',
    pt: 'Alterar os meus critérios',
    ar: 'تعديل المعايير'
  }
};

// Collecte les compromis depuis steps + config + zoneInfo
function collectBuilderCompromises(steps, config, zoneInfo) {
  const compromises = [];
  const maxKm = config.maxKm;
  
  // 1) Sauts dépassant maxKm × 1.5
  let longCount = 0;
  let worstKm = 0;
  for (let i = 1; i < steps.length; i++) {
    const a = steps[i - 1];
    const b = steps[i];
    if (a.isEnd && b.isReturn) continue; // ignorer la fermeture symbolique
    const d = _haversine(a.lat, a.lon || a.lng, b.lat, b.lon || b.lng);
    if (d > maxKm * 1.5) {
      longCount++;
      if (d > worstKm) worstKm = d;
    }
  }
  if (longCount > 0) {
    compromises.push({ type: 'distance', n: longCount, max: maxKm, worst: Math.round(worstKm) });
  }
  
  // 2) Étapes plafonnées : on calcule combien il aurait fallu pour respecter maxKm
  // Total distance / maxKm = nombre théorique d'étapes nécessaires
  let totalDist = 0;
  for (let i = 1; i < steps.length; i++) {
    const a = steps[i - 1], b = steps[i];
    totalDist += _haversine(a.lat, a.lon || a.lng, b.lat, b.lon || b.lng);
  }
  const intermediateStops = steps.filter(s => !s.isStart && !s.isEnd && !s.isReturn).length;
  const stopsNeeded = Math.ceil(totalDist / maxKm) - 1; // -1 car le départ ne compte pas comme étape
  if (longCount > 0 && stopsNeeded > intermediateStops + 1) {
    compromises.push({ type: 'stepsCap', max: maxKm, needed: stopsNeeded, got: intermediateStops });
  }
  
  // 3) Étapes hors zone (mode boucle avec polygone)
  if (zoneInfo && zoneInfo.outCount > 0) {
    compromises.push({ type: 'outOfZone', n: zoneInfo.outCount });
  }
  
  // 4) Nombre d'étapes demandé par l'utilisateur mais plafonné par les jours
  if (config._stepsCapped) {
    compromises.push({
      type: 'stepsRequested',
      requested: config._stepsCapped.requested,
      got: config._stepsCapped.got,
      days: config._stepsCapped.days
    });
  }
  
  return compromises;
}

// Affiche la modale (uniquement s'il y a des compromis)
function showCompromisesModalIfAny(steps, config, zoneInfo, lang) {
  const compromises = collectBuilderCompromises(steps, config, zoneInfo);
  if (compromises.length === 0) {
    console.log('[ROUTE-BUILDER] ✅ Aucun compromis, pas de modale');
    return;
  }
  
  console.log('[ROUTE-BUILDER] ℹ️ Compromis détectés:', compromises);
  
  const l = (COMPROMISES_I18N.title[lang] ? lang : 'fr');
  const isRTL = (l === 'ar');
  
  const tr = (key, params) => {
    let text = COMPROMISES_I18N[key]?.[l] || COMPROMISES_I18N[key]?.fr || key;
    if (params) {
      Object.keys(params).forEach(k => {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), params[k]);
      });
    }
    return text;
  };
  
  // Construire les lignes
  const lines = compromises.map(c => {
    if (c.type === 'distance') return tr('distance', { n: c.n, max: c.max, worst: c.worst });
    if (c.type === 'stepsCap') return tr('stepsCap', { max: c.max, needed: c.needed, got: c.got });
    if (c.type === 'stepsRequested') return tr('stepsRequested', { requested: c.requested, got: c.got, days: c.days });
    if (c.type === 'outOfZone') return tr('outOfZone', { n: c.n });
    return '';
  }).filter(Boolean);
  
  // Construire l'URL retour avec params préremplis
  const urlParams = new URLSearchParams(window.location.search);
  const hasZone = urlParams.has('zonePolygon');
  const backUrl = hasZone ? 'carte_builder.html?mode=expert' : 'index.html';
  
  // Délai léger pour que l'itinéraire s'affiche d'abord
  setTimeout(() => {
    const modal = document.createElement('div');
    modal.id = 'builderCompromisesModal';
    modal.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    modal.innerHTML = `
      <div style="position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:99999;padding:20px" dir="${isRTL ? 'rtl' : 'ltr'}">
        <div style="background:#fff;padding:28px;border-radius:16px;max-width:500px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.3);text-align:${isRTL ? 'right' : 'left'}">
          <div style="font-size:20px;font-weight:700;color:#b45309;margin-bottom:14px;display:flex;align-items:center;gap:10px">
            <span style="font-size:24px">⚠️</span> ${tr('title')}
          </div>
          <p style="font-size:15px;color:#475569;line-height:1.6;margin-bottom:16px">
            ${tr('intro')}
          </p>
          <ul style="background:#fef3c7;border:1px solid #fde68a;border-radius:10px;padding:14px 20px;margin-bottom:22px;font-size:14px;color:#78350f;line-height:1.7;list-style:disc;${isRTL ? 'padding-right:28px' : 'padding-left:28px'}">
            ${lines.map(l => `<li>${l}</li>`).join('')}
          </ul>
          <div style="display:flex;gap:12px;flex-wrap:wrap">
            <button id="compModify" style="flex:1;min-width:120px;padding:14px 18px;background:#fff;color:#64748b;border:1px solid #cbd5e1;border-radius:10px;font-weight:600;cursor:pointer;font-size:14px">
              ${tr('btnModify')}
            </button>
            <button id="compKeep" style="flex:1;min-width:120px;padding:14px 18px;background:#113f7a;color:#fff;border:none;border-radius:10px;font-weight:600;cursor:pointer;font-size:14px">
              ${tr('btnKeep')}
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
    modal.querySelector('#compKeep').addEventListener('click', () => modal.remove());
    modal.querySelector('#compModify').addEventListener('click', () => {
      window.location.href = backUrl;
    });
    
    // ESC = fermer (garder l'itinéraire)
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }, 800);
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
