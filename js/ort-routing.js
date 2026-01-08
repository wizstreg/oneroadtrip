/**
 * ORT-ROUTING.js
 * Fonctions de calcul d'itinéraires pour OneRoadTrip
 * 
 * Utilisé par : roadtrip_detail.html, roadtrip_detail_simple.html, roadtrip_mobile.html
 * 
 * Dépendances : 
 * - window.ORT_CONFIG.MAPBOX_ACCESS_TOKEN (optionnel, pour Mapbox)
 * - haversineDistance() de ort-utils.js (pour fallback)
 */

(function(global) {
  'use strict';

  const ORT_ROUTING = {

    // ========================================
    // FONCTIONS HELPERS INTERNES
    // ========================================

    /**
     * Découpe une liste de waypoints en chunks de 20 pts max
     * @param {Array} waypoints - [[lat, lon], ...]
     * @returns {Array} Tableau de chunks
     */
    chunkWaypoints: function(waypoints) {
      const CHUNK_SIZE = 20;
      const OVERLAP = 1;
      
      if (waypoints.length <= CHUNK_SIZE) return [waypoints];
      
      const chunks = [];
      for (let i = 0; i < waypoints.length; i += CHUNK_SIZE - OVERLAP) {
        const end = Math.min(i + CHUNK_SIZE, waypoints.length);
        chunks.push(waypoints.slice(i, end));
      }
      console.log(`[ORT-ROUTING] ${waypoints.length} pts → ${chunks.length} chunks`);
      return chunks;
    },

    /**
     * Combine les résultats de plusieurs chunks
     * @param {Array} chunks - Tableau de résultats
     * @returns {Object} Résultat combiné
     */
    combineChunkResults: function(chunks) {
      const combined = {
        coordinates: [],
        distance: 0,
        duration: 0
      };
      
      chunks.forEach((chunk, idx) => {
        if (idx === 0) {
          combined.coordinates = [...chunk.coordinates];
        } else {
          // Éviter les doublons aux jonctions
          combined.coordinates = [...combined.coordinates, ...chunk.coordinates.slice(1)];
        }
        combined.distance += chunk.distance || 0;
        combined.duration += chunk.duration || 0;
      });
      
      console.log(`[ORT-ROUTING] ${chunks.length} chunks → ${combined.coordinates.length} coords, ${Math.round(combined.distance/1000)}km`);
      return combined;
    },

    /**
     * Appel OSRM pour 1 chunk (20 pts max)
     * @param {Array} waypoints - [[lat, lon], ...]
     * @param {string} profile - 'car', 'bike', 'foot'
     * @param {number} attempt - Numéro de tentative (pour retry)
     * @returns {Promise<Object|null>}
     */
    callOSRMChunk: async function(waypoints, profile = 'car', attempt = 1) {
      const coordsStr = waypoints.map(wp => `${wp[1]},${wp[0]}`).join(';');
      const url = `https://router.project-osrm.org/route/v1/${profile}/${coordsStr}?overview=full&geometries=geojson`;
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (res.status === 429 && attempt < 3) {
          console.warn(`[ORT-ROUTING] ⏳ Rate limited, retry ${attempt}/3...`);
          await new Promise(r => setTimeout(r, 2000 * attempt));
          return this.callOSRMChunk(waypoints, profile, attempt + 1);
        }
        
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        
        if (data.code === 'Ok' && data.routes?.[0]) {
          const route = data.routes[0];
          return {
            coordinates: route.geometry.coordinates.map(c => [c[1], c[0]]),
            distance: route.distance,
            duration: route.duration
          };
        }
        throw new Error(`OSRM code: ${data.code}`);
      } catch (e) {
        console.warn(`[ORT-ROUTING] OSRM failed: ${e.message}`);
        return null;
      }
    },

    /**
     * Appel Mapbox pour 1 chunk (25 pts max)
     * @param {Array} waypoints - [[lat, lon], ...]
     * @param {string} profile - 'driving', 'cycling', 'walking'
     * @returns {Promise<Object|null>}
     */
    callMapboxChunk: async function(waypoints, profile = 'driving') {
      const token = window.ORT_CONFIG?.MAPBOX_ACCESS_TOKEN;
      if (!token) return null;
      
      const coordsStr = waypoints.map(wp => `${wp[1]},${wp[0]}`).join(';');
      const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordsStr}?overview=full&geometries=geojson&access_token=${token}`;
      
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        const data = await res.json();
        if (data.routes?.[0]) {
          const route = data.routes[0];
          return {
            coordinates: route.geometry.coordinates.map(c => [c[1], c[0]]),
            distance: route.distance,
            duration: route.duration
          };
        }
        throw new Error('No routes');
      } catch (e) {
        console.warn(`[ORT-ROUTING] Mapbox failed: ${e.message}`);
        return null;
      }
    },

    /**
     * Appel backend Netlify pour route (2 points seulement)
     * @param {Array} waypoints - [[lat, lon], [lat, lon]]
     * @param {string} mode - 'driving', etc.
     * @returns {Promise<Object|null>}
     */
    callNetlifyRoute: async function(waypoints, mode = 'driving') {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      // Tester si netlify dev est actif (une seule fois)
      if (isLocal && !window._netlifyDevDetected) {
        if (window._netlifyDevTested === undefined) {
          try {
            const test = await fetch('/.netlify/functions/route?mode=driving&start=2.35,48.85&end=2.36,48.86', { 
              signal: AbortSignal.timeout(2000) 
            });
            window._netlifyDevDetected = test.ok;
            window._netlifyDevTested = true;
          } catch {
            window._netlifyDevDetected = false;
            window._netlifyDevTested = true;
          }
        }
        if (!window._netlifyDevDetected) return null;
      }
      
      if (waypoints.length !== 2) {
        console.warn('[ORT-ROUTING] Netlify: seulement 2 points supportés');
        return null;
      }
      
      const start = waypoints[0];
      const end = waypoints[1];
      const url = `/.netlify/functions/route?mode=${mode}&start=${start[1]},${start[0]}&end=${end[1]},${end[0]}&geometry=true`;
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        
        if (data.ok && data.km) {
          const distance = data.km * 1000;
          const duration = data.minutes * 60;
          
          if (data.geometry?.coordinates?.length > 0) {
            return {
              coordinates: data.geometry.coordinates.map(c => [c[1], c[0]]),
              distance,
              duration
            };
          }
          
          // Fallback: ligne droite interpolée
          const numPoints = Math.max(20, Math.ceil(data.km / 40));
          const coords = [];
          for (let i = 0; i <= numPoints; i++) {
            const t = i / numPoints;
            coords.push([
              start[0] + t * (end[0] - start[0]),
              start[1] + t * (end[1] - start[1])
            ]);
          }
          return { coordinates: coords, distance, duration };
        }
        throw new Error(data.error || 'No data');
      } catch (e) {
        console.warn(`[ORT-ROUTING] Netlify failed: ${e.message}`);
        return null;
      }
    },

    // ========================================
    // FONCTION PRINCIPALE DE ROUTING
    // ========================================

    /**
     * Calcul de route avec chunking et fallbacks
     * OSRM parallèle → Mapbox séquentiel → Netlify (2 pts) → fallback haversine
     * 
     * @param {Array} waypoints - [[lat, lon], ...] - N'importe quel nombre de points
     * @param {string} profile - 'car', 'bike', 'foot' (pour OSRM)
     * @param {string} mapboxProfile - 'driving', 'cycling', 'walking' (pour Mapbox)
     * @returns {Promise<Object|null>}
     */
    routeWithChunking: async function(waypoints, profile = 'car', mapboxProfile = 'driving') {
      if (waypoints.length < 2) {
        console.warn('[ORT-ROUTING] Pas assez de points');
        return null;
      }

      // Cas simple : 25 pts ou moins → appel direct
      if (waypoints.length <= 25) {
        console.log(`[ORT-ROUTING] 📍 ${waypoints.length} pts: appel direct`);
        
        let result = await this.callOSRMChunk(waypoints, profile);
        if (result) {
          console.log(`[ORT-ROUTING] ✅ OSRM OK: ${Math.round(result.distance/1000)}km`);
          return result;
        }
        
        result = await this.callMapboxChunk(waypoints, mapboxProfile);
        if (result) {
          console.log(`[ORT-ROUTING] ✅ Mapbox OK: ${Math.round(result.distance/1000)}km`);
          return result;
        }
        
        // Fallback Netlify (seulement 2 points)
        if (waypoints.length === 2) {
          result = await this.callNetlifyRoute(waypoints, mapboxProfile);
          if (result) {
            console.log(`[ORT-ROUTING] ✅ Netlify OK: ${Math.round(result.distance/1000)}km`);
            return result;
          }
        }
        
        console.warn(`[ORT-ROUTING] ⚠️ Aucun service disponible`);
        return null;
      }
      
      // Cas complexe : plus de 25 pts → chunking
      console.log(`[ORT-ROUTING] 🔀 ${waypoints.length} pts: chunking`);
      const chunks = this.chunkWaypoints(waypoints);
      
      // Essayer OSRM en parallèle (3 chunks max à la fois)
      const osrmResults = [];
      const MAX_PARALLEL = 3;
      
      for (let i = 0; i < chunks.length; i += MAX_PARALLEL) {
        const batch = chunks.slice(i, i + MAX_PARALLEL);
        const batchResults = await Promise.all(
          batch.map(chunk => this.callOSRMChunk(chunk, profile))
        );
        osrmResults.push(...batchResults);
      }
      
      if (osrmResults.every(r => r)) {
        const combined = this.combineChunkResults(osrmResults);
        console.log(`[ORT-ROUTING] ✅ OSRM chunked OK: ${Math.round(combined.distance/1000)}km`);
        return combined;
      }
      
      // Fallback Mapbox séquentiel
      console.warn(`[ORT-ROUTING] OSRM chunks failed, essai Mapbox...`);
      const mapboxResults = [];
      for (const chunk of chunks) {
        const result = await this.callMapboxChunk(chunk, mapboxProfile);
        if (!result) {
          console.warn(`[ORT-ROUTING] Mapbox chunk échoué`);
          return null;
        }
        mapboxResults.push(result);
      }
      
      const combined = this.combineChunkResults(mapboxResults);
      console.log(`[ORT-ROUTING] ✅ Mapbox chunked OK: ${Math.round(combined.distance/1000)}km`);
      return combined;
    },

    // ========================================
    // FONCTIONS HAUT NIVEAU
    // ========================================

    /**
     * Calcul route OSRM (voiture, vélo, pieds)
     * 
     * @param {Array} waypoints - [[lat, lon], ...] ou [{lat, lon}, {lat, lon}] pour 2 points
     * @param {string} mode - 'driving', 'cycling', 'walking'
     * @returns {Promise<Object>}
     */
    calculateOSRMRoute: async function(waypoints, mode = 'driving') {
      // Normaliser les waypoints (accepte les deux formats)
      let normalizedWaypoints = waypoints;
      
      // Si format {lat, lon} (2 objets), convertir en [[lat, lon], [lat, lon]]
      if (waypoints.length === 2 && waypoints[0].lat !== undefined) {
        normalizedWaypoints = [
          [waypoints[0].lat, waypoints[0].lon],
          [waypoints[1].lat, waypoints[1].lon]
        ];
      }
      
      console.log(`[ORT-ROUTING] calculateOSRMRoute: ${normalizedWaypoints.length} pts, mode=${mode}`);
      
      const osrmProfile = mode === 'driving' ? 'car' : mode === 'cycling' ? 'bike' : 'foot';
      const mapboxProfile = mode === 'driving' ? 'driving' : mode === 'cycling' ? 'cycling' : 'walking';
      
      const result = await this.routeWithChunking(normalizedWaypoints, osrmProfile, mapboxProfile);
      
      if (result) {
        const color = mode === 'cycling' ? '#00bcd4' : mode === 'walking' ? '#4caf50' : '#113f7a';
        return {
          type: 'osrm',
          mode: mode,
          coordinates: result.coordinates,
          distance: result.distance,
          duration: result.duration,
          color: color,
          // Compatibilité Mobile
          coords: result.coordinates,
          isReal: true,
          cumDist: this._buildCumDist(result.coordinates)
        };
      }
      
      console.warn('[ORT-ROUTING] 🔴 Fallback ligne droite');
      return this._buildFallbackRoute(normalizedWaypoints);
    },

    /**
     * Calcul route Mapbox (transit, etc.)
     * 
     * @param {Array} waypoints - [[lat, lon], ...]
     * @param {string} mode - 'driving', 'cycling', 'walking', 'transit'
     * @returns {Promise<Object>}
     */
    calculateMapboxRoute: async function(waypoints, mode = 'driving') {
      const accessToken = window.ORT_CONFIG?.MAPBOX_ACCESS_TOKEN;
      
      if (!accessToken) {
        console.warn('[ORT-ROUTING] Mapbox token manquant');
        if (typeof toast === 'function') {
          toast('⚠️ Mapbox : token requis (voir ort-config.js)', 4000);
        }
        return { type: 'fallback', coordinates: waypoints, color: '#ff5722', dashArray: '10, 5' };
      }
      
      const mapboxProfile = mode === 'transit' ? 'driving' : mode;
      
      // Simplifier si trop de waypoints
      let simplifiedWaypoints = waypoints;
      if (waypoints.length > 25) {
        const step = Math.ceil(waypoints.length / 24);
        simplifiedWaypoints = waypoints.filter((_, i) => i === 0 || i === waypoints.length - 1 || i % step === 0);
        console.log(`[ORT-ROUTING] Simplifié ${waypoints.length} → ${simplifiedWaypoints.length} waypoints`);
      }
      
      const result = await this.callMapboxChunk(simplifiedWaypoints, mapboxProfile);
      
      if (result) {
        let color = '#113f7a';
        let dashArray = null;
        
        if (mode === 'transit') {
          color = '#ff5722';
          dashArray = '10, 5';
        } else if (mode === 'cycling') {
          color = '#00bcd4';
        } else if (mode === 'walking') {
          color = '#4caf50';
        }
        
        return {
          type: 'mapbox',
          mode: mode,
          coordinates: result.coordinates,
          distance: result.distance,
          duration: result.duration,
          color: color,
          weight: 3,
          dashArray: dashArray
        };
      }
      
      return { type: 'fallback', coordinates: waypoints, color: '#ff5722', dashArray: '10, 5' };
    },

    // ========================================
    // HELPERS PRIVÉS
    // ========================================

    /**
     * Construit les distances cumulées (pour compatibilité Mobile)
     */
    _buildCumDist: function(coordinates) {
      const cumDist = [0];
      const haversine = global.haversineDistance || global.ORT_UTILS?.haversineDistance;
      
      if (!haversine || coordinates.length < 2) return cumDist;
      
      for (let i = 1; i < coordinates.length; i++) {
        const prev = coordinates[i-1];
        const curr = coordinates[i];
        const dist = haversine(prev[0], prev[1], curr[0], curr[1]);
        cumDist.push(cumDist[i-1] + dist);
      }
      return cumDist;
    },

    /**
     * Construit une route fallback (ligne droite)
     */
    _buildFallbackRoute: function(waypoints) {
      const haversine = global.haversineDistance || global.ORT_UTILS?.haversineDistance || function() { return 0; };
      
      // Calculer distance totale
      let totalDist = 0;
      for (let i = 1; i < waypoints.length; i++) {
        totalDist += haversine(waypoints[i-1][0], waypoints[i-1][1], waypoints[i][0], waypoints[i][1]);
      }
      
      // Interpoler des points
      const numPoints = Math.max(10, Math.ceil(totalDist / 50));
      const fallbackCoords = [];
      
      for (let i = 0; i < waypoints.length - 1; i++) {
        const start = waypoints[i];
        const end = waypoints[i + 1];
        const segmentPoints = Math.max(2, Math.floor(numPoints / (waypoints.length - 1)));
        
        for (let j = 0; j < segmentPoints; j++) {
          const t = j / segmentPoints;
          fallbackCoords.push([
            start[0] + t * (end[0] - start[0]),
            start[1] + t * (end[1] - start[1])
          ]);
        }
      }
      fallbackCoords.push(waypoints[waypoints.length - 1]);
      
      const cumDist = this._buildCumDist(fallbackCoords);
      
      return {
        type: 'fallback',
        coordinates: fallbackCoords,
        coords: fallbackCoords,
        distance: Math.round(totalDist * 1000),
        cumDist: cumDist,
        isReal: false
      };
    }
  };

  // Exposer globalement
  global.ORT_ROUTING = ORT_ROUTING;

  // Raccourcis pour compatibilité avec le code existant
  global.calculateOSRMRoute = global.calculateOSRMRoute || ORT_ROUTING.calculateOSRMRoute.bind(ORT_ROUTING);
  global.calculateMapboxRoute = global.calculateMapboxRoute || ORT_ROUTING.calculateMapboxRoute.bind(ORT_ROUTING);
  global.routeWithChunking = global.routeWithChunking || ORT_ROUTING.routeWithChunking.bind(ORT_ROUTING);
  
  // Helpers pour compatibilité
  global.chunkWaypoints = global.chunkWaypoints || ORT_ROUTING.chunkWaypoints.bind(ORT_ROUTING);
  global.combineChunkResults = global.combineChunkResults || ORT_ROUTING.combineChunkResults.bind(ORT_ROUTING);
  global.callOSRMChunk = global.callOSRMChunk || ORT_ROUTING.callOSRMChunk.bind(ORT_ROUTING);
  global.callMapboxChunk = global.callMapboxChunk || ORT_ROUTING.callMapboxChunk.bind(ORT_ROUTING);
  global.callNetlifyRoute = global.callNetlifyRoute || ORT_ROUTING.callNetlifyRoute.bind(ORT_ROUTING);

  console.log('[ORT-ROUTING] ✅ Module chargé');

})(typeof window !== 'undefined' ? window : this);
