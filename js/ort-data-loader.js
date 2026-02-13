/**
 * ORT-DATA-LOADER.js
 * Fonctions de chargement de données communes à tous les modules OneRoadTrip
 * 
 * Utilisé par : roadtrip_detail.html, roadtrip_detail_simple.html, roadtrip_mobile.html
 * 
 * Dépendances : Aucune (module autonome)
 * 
 * FONCTIONS PRINCIPALES :
 * - loadItinerary(options) : Charge un itinéraire depuis les fichiers JSON
 * - loadFromTemp(rtKey) : Charge depuis localStorage (itinéraires temporaires)
 * - loadFromDashboard(tripId) : Charge depuis Firestore (voyages utilisateur)
 * - ensurePlacesIndex(options) : Charge l'index des lieux
 * - loadPhotosCache() : Charge le cache des photos
 */

(function(global) {
  'use strict';

  // ============================================================
  // CONFIGURATION
  // ============================================================
  
  const CONFIG = {
    BASE_URL: './data/Roadtripsprefabriques/countries',
    PHOTOS_PATHS: [
      './data/photos-json/photos_lieux.json',
      '/data/photos-json/photos_lieux.json',
      '../data/photos-json/photos_lieux.json'
    ]
  };

  // ============================================================
  // MODULE PRINCIPAL
  // ============================================================

  const ORT_DATA_LOADER = {

    // ============================================================
    // FONCTIONS UTILITAIRES DE BASE
    // ============================================================

    /**
     * Charge un fichier JSON avec gestion d'erreurs
     * @param {string} path - Chemin vers le fichier JSON
     * @returns {Promise<Object|null>} Données JSON ou null si erreur
     */
    loadJSON: async function(path) {
      try {
        const r = await fetch(path, { cache: 'no-store' });
        if (!r.ok) return null;
        const ct = r.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
          console.warn('[ORT-DATA] Not JSON:', path, 'content-type:', ct);
          return null;
        }
        return await r.json();
      } catch (e) {
        console.error('[ORT-DATA] loadJSON Error:', path, e);
        return null;
      }
    },

    /**
     * Charge un fichier JSON avec fallback de langue
     * Essaie dans l'ordre : langue demandée → EN → FR → ancien format sans suffixe
     * @param {string} baseUrl - URL de base du fichier (ex: ./data/file.json)
     * @param {string} lang - Code langue préféré (fr, en, es, it, pt, ar)
     * @returns {Promise<{data: Object, lang: string}|null>} Données et langue chargée, ou null
     */
    loadWithLangFallback: async function(baseUrl, lang) {
      const langOrder = [lang, 'en', 'fr'].filter((v, i, a) => a.indexOf(v) === i);
      
      for (const tryLang of langOrder) {
        const url = baseUrl.replace('.json', `-${tryLang}.json`);
        const result = await this.loadJSON(url);
        if (result) {
          console.log(`[ORT-DATA] ✅ Chargé: ${url}`);
          return { data: result, lang: tryLang };
        }
      }
      
      // Fallback: ancien format sans suffixe de langue
      const result = await this.loadJSON(baseUrl);
      if (result) {
        console.log(`[ORT-DATA] ⚠️ Fallback ancien format: ${baseUrl}`);
        return { data: result, lang: 'fr' };
      }
      
      return null;
    },

    // ============================================================
    // CHARGEMENT DES ITINÉRAIRES
    // ============================================================

    /**
     * Charge un itinéraire depuis les fichiers JSON
     * @param {Object} options - Options de chargement
     * @param {string} options.cc - Code pays (ex: 'DE', 'FR')
     * @param {string} options.itinId - ID de l'itinéraire
     * @param {string} [options.lang='fr'] - Code langue
     * @returns {Promise<Object>} Données de l'itinéraire avec steps normalisées
     */
    loadItinerary: async function(options) {
      const { cc, itinId, lang = 'fr' } = options;
      
      if (!cc || !itinId) {
        throw new Error('cc et itinId requis');
      }
      
      console.log('[ORT-DATA] === LOAD ITINERARY ===');
      console.log('[ORT-DATA] cc:', cc, '/ itinId:', itinId, '/ lang:', lang);
      
      // Vérifier si c'est un itinéraire composé (id1+id2+id3)
      const isComposed = typeof global.isComposedId === 'function' 
        ? global.isComposedId(itinId) 
        : itinId.includes('+');
      
      if (isComposed) {
        return await this._loadComposedItinerary(cc, itinId, lang);
      }
      
      // Charger le fichier d'itinéraires
      const ccLower = cc.toLowerCase();
      const url = `${CONFIG.BASE_URL}/${ccLower}/${ccLower}.itins.modules-${lang}.json`;
      
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status} pour ${url}`);
      
      const data = await resp.json();
      const itins = data.itins || data.itineraries || data || [];
      const itin = itins.find(i => (i.id || i.itin_id) === itinId);
      
      if (!itin) throw new Error(`Itinéraire ${itinId} non trouvé`);
      
      // Normaliser les steps
      const steps = this._normalizeSteps(itin.days_plan || itin.steps || [], cc);
      
      // Appliquer le regroupement des nuits par lieu
      if (global.ORT_TRIP_CALC && global.ORT_TRIP_CALC.groupNightsByPlace) {
        global.ORT_TRIP_CALC.groupNightsByPlace(steps);
      }
      
      console.log(`[ORT-DATA] ✅ ${steps.length} étapes chargées pour "${itin.title || itin.name}"`);
      
      return {
        title: itin.title || itin.name || 'Roadtrip',
        cc: cc.toUpperCase(),
        originalItinId: itinId,
        steps: steps,
        raw: itin
      };
    },

    /**
     * Charge un itinéraire composé (plusieurs itinéraires fusionnés)
     * @private
     */
    _loadComposedItinerary: async function(cc, composedId, lang) {
      console.log('[ORT-DATA] Chargement itinéraire composé:', composedId);
      
      const ids = typeof global.parseComposedIds === 'function'
        ? global.parseComposedIds(composedId)
        : composedId.split('+');
      
      const allSteps = [];
      const allTitles = [];
      
      for (const id of ids) {
        try {
          const result = await this.loadItinerary({ cc, itinId: id, lang });
          if (result && result.steps) {
            allSteps.push(...result.steps);
            allTitles.push(result.title);
          }
        } catch (e) {
          console.error(`[ORT-DATA] Erreur chargement ${id}:`, e);
        }
      }
      
      if (allSteps.length === 0) {
        throw new Error('Aucun itinéraire composé n\'a pu être chargé');
      }
      
      // Appliquer le regroupement des nuits
      if (global.ORT_TRIP_CALC && global.ORT_TRIP_CALC.groupNightsByPlace) {
        global.ORT_TRIP_CALC.groupNightsByPlace(allSteps);
      }
      
      return {
        title: allTitles.join(' + '),
        cc: cc.toUpperCase(),
        originalItinId: composedId,
        steps: allSteps,
        raw: null
      };
    },

    /**
     * Charge un itinéraire depuis localStorage (temporaire)
     * @param {string} rtKey - Clé de l'itinéraire temporaire
     * @returns {Promise<Object>} Données de l'itinéraire
     */
    loadFromTemp: async function(rtKey) {
      console.log('[ORT-DATA] === LOAD FROM TEMP ===');
      console.log('[ORT-DATA] rtKey:', rtKey);
      
      const rawItins = localStorage.getItem(`ORT_TEMP_TRIP_${rtKey}_itins`);
      const rawPlaces = localStorage.getItem(`ORT_TEMP_TRIP_${rtKey}_places`);
      
      if (!rawItins) {
        throw new Error('Itinéraire temporaire non trouvé');
      }
      
      let itinsObj, placesObj;
      try {
        itinsObj = JSON.parse(rawItins);
        placesObj = rawPlaces ? JSON.parse(rawPlaces) : {};
      } catch (e) {
        throw new Error('Données corrompues');
      }
      
      // Trouver l'itinéraire à utiliser
      let toUse = null;
      if (Array.isArray(itinsObj.days_plan) || Array.isArray(itinsObj.places)) {
        toUse = itinsObj;
      } else if (itinsObj.itineraries?.[0]) {
        toUse = itinsObj.itineraries[0];
      } else if (itinsObj.itins?.[0]) {
        toUse = itinsObj.itins[0];
      }
      
      if (!toUse) throw new Error('Structure itinéraire invalide');
      
      // Extraire les étapes
      const rawSteps = toUse.days_plan || toUse.places || toUse.steps || [];
      const cc = toUse.itin_id ? toUse.itin_id.split('::')[0].toUpperCase() : (itinsObj.country || 'XX');
      
      const steps = this._normalizeStepsFromTemp(rawSteps, placesObj);
      
      // Appliquer le regroupement des nuits
      if (global.ORT_TRIP_CALC && global.ORT_TRIP_CALC.groupNightsByPlace) {
        global.ORT_TRIP_CALC.groupNightsByPlace(steps);
      }
      
      console.log(`[ORT-DATA] ✅ ${steps.length} étapes chargées depuis temp`);
      
      return {
        title: toUse.title || toUse.name || 'Roadtrip',
        cc: cc,
        originalItinId: rtKey,
        steps: steps,
        raw: toUse
      };
    },

    /**
     * Charge un itinéraire depuis Firestore (dashboard utilisateur)
     * @param {string} tripId - ID du voyage
     * @returns {Promise<Object>} Données de l'itinéraire
     */
    loadFromDashboard: async function(tripId) {
      console.log('[ORT-DATA] === LOAD FROM DASHBOARD ===');
      console.log('[ORT-DATA] tripId:', tripId);
      
      // Essayer d'abord localStorage (rapide)
      const localKey = `ort_trip_${tripId}`;
      const localData = localStorage.getItem(localKey);
      
      if (localData) {
        try {
          const tripData = JSON.parse(localData);
          if (tripData && tripData.steps && tripData.steps.length > 0) {
            console.log('[ORT-DATA] ✅ Chargé depuis localStorage');
            
            // Appliquer le regroupement si nécessaire
            if (global.ORT_TRIP_CALC && global.ORT_TRIP_CALC.groupNightsByPlace) {
              global.ORT_TRIP_CALC.groupNightsByPlace(tripData.steps);
            }
            
            return {
              title: tripData.title || 'Mon voyage',
              cc: tripData.cc || tripData.country || '',
              originalItinId: tripData.originalItinId || tripId,
              steps: tripData.steps,
              raw: tripData
            };
          }
        } catch (e) {
          console.warn('[ORT-DATA] localStorage invalide:', e);
        }
      }
      
      // Sinon charger depuis Firestore
      if (typeof firebase === 'undefined' || !firebase.auth) {
        throw new Error('Firebase non disponible');
      }
      
      const user = firebase.auth().currentUser;
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }
      
      const doc = await firebase.firestore()
        .collection('users')
        .doc(user.uid)
        .collection('trips')
        .doc(tripId)
        .get();
      
      if (!doc.exists) {
        throw new Error('Voyage non trouvé dans Firestore');
      }
      
      const tripData = doc.data();
      let steps = tripData.steps || [];
      
      // Désérialiser si nécessaire
      if (typeof steps === 'string') {
        steps = JSON.parse(steps);
      }
      
      // Appliquer le regroupement
      if (global.ORT_TRIP_CALC && global.ORT_TRIP_CALC.groupNightsByPlace) {
        global.ORT_TRIP_CALC.groupNightsByPlace(steps);
      }
      
      console.log(`[ORT-DATA] ✅ ${steps.length} étapes chargées depuis Firestore`);
      
      return {
        title: tripData.title || 'Mon voyage',
        cc: tripData.cc || tripData.country || '',
        originalItinId: tripData.originalItinId || tripId,
        steps: steps,
        raw: tripData
      };
    },

    // ============================================================
    // NORMALISATION DES STEPS
    // ============================================================

    /**
     * Normalise les steps depuis days_plan
     * @private
     */
    _normalizeSteps: function(daysPlan, cc) {
      const steps = [];
      
      daysPlan.forEach((day, idx) => {
        const nightData = day.night || {};
        const placeId = nightData.place_id || day.place_id || '';
        const coords = nightData.coords || [];
        const suggestedDays = day.suggested_days || 1;
        const driveMin = day.to_next_leg?.drive_min || 0;
        const distanceKm = day.to_next_leg?.distance_km || 0;
        
        // Bonus transport pour longs trajets
        let transportBonus = driveMin > 300 ? 1.0 : driveMin > 180 ? 0.5 : 0;
        const nights = Math.max(0, Math.round(suggestedDays + transportBonus));
        
        let name = day.name || '';
        if (!name && placeId) {
          const parts = placeId.split('::');
          name = parts[parts.length - 1]?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || `Étape ${idx + 1}`;
        }
        
        const visits = Array.isArray(day.visits) ? day.visits.map(v => typeof v === 'string' ? {text: v} : v) : [];
        const activities = Array.isArray(day.activities) ? day.activities.map(a => typeof a === 'string' ? {text: a} : a) : [];
        
        // Photos
        let photos = [];
        if (Array.isArray(day.photos) && day.photos.length) photos = day.photos;
        else if (Array.isArray(day.images) && day.images.length) photos = day.images;
        else if (typeof day.image === 'string' && day.image) photos = [day.image];
        else if (typeof day.photo === 'string' && day.photo) photos = [day.photo];
        
        steps.push({
          _idx: steps.length,
          name: name || `Étape ${idx + 1}`,
          lat: coords[0] || day.lat,
          lng: coords[1] || day.lng || day.lon,
          nights,
          description: visits.map(v => v.text || v).filter(Boolean).join(' '),
          photos,
          distance_km: distanceKm,
          placeId: placeId,
          place_id: placeId,
          visits,
          activities,
          rating: day.rating || 0,
          suggested_days: suggestedDays,
          _suggestedDays: suggestedDays,
          _driveMinToNext: driveMin,
          to_next_leg: day.to_next_leg || null
        });
      });
      
      return steps;
    },

    /**
     * Normalise les steps depuis localStorage temp
     * @private
     */
    _normalizeStepsFromTemp: function(rawSteps, placesObj = {}) {
      return rawSteps.map((s, idx) => {
        let photos = [];
        if (Array.isArray(s.images) && s.images.length) photos = s.images;
        else if (Array.isArray(s.photos) && s.photos.length) photos = s.photos;
        else if (s.image) photos = [s.image];
        else if (s.photo) photos = [s.photo];
        else if (s.placeId && placesObj[s.placeId]?.photos) photos = placesObj[s.placeId].photos;
        
        let visits = [];
        let activities = [];
        if (Array.isArray(s.visits)) {
          visits = s.visits.map(v => typeof v === 'string' ? {text: v} : v);
        }
        if (Array.isArray(s.activities)) {
          activities = s.activities.map(a => typeof a === 'string' ? {text: a} : a);
        }
        // Fallback depuis placesObj
        if (visits.length === 0 && s.placeId && placesObj[s.placeId]?.visits) {
          visits = placesObj[s.placeId].visits.map(v => typeof v === 'string' ? {text: v} : v);
        }
        if (activities.length === 0 && s.placeId && placesObj[s.placeId]?.activities) {
          activities = placesObj[s.placeId].activities.map(a => typeof a === 'string' ? {text: a} : a);
        }
        
        return {
          _idx: idx,
          name: s.name || s.place_name || `Étape ${idx + 1}`,
          lat: s.lat || s.latitude,
          lng: s.lng || s.lon || s.longitude,
          nights: s.nights || s.adjustedDays || 0,
          description: s.description || s.desc || '',
          photos,
          distance_km: s.distance_km || s.to_next_leg?.distance_km || 0,
          placeId: s.placeId || s.place_id || null,
          place_id: s.place_id || s.placeId || null,
          visits,
          activities
        };
      });
    },

    // ============================================================
    // PLACES INDEX
    // ============================================================

    /**
     * Charge l'index des lieux (places_index) pour un ou plusieurs pays
     * Remplit la variable globale PLACES_INDEX
     * @param {Object} options - Options de configuration
     * @param {string} [options.mainCC] - Code pays principal
     * @param {string} [options.lang='fr'] - Code langue
     * @param {Array<string>} [options.additionalCountries=[]] - Pays supplémentaires à charger
     * @param {Object} [options.state] - Objet state contenant les steps
     * @returns {Promise<Object>} L'index des lieux chargé
     */
    ensurePlacesIndex: async function(options = {}) {
      const mainCC = (options.mainCC || '').toUpperCase();
      const lang = options.lang || localStorage.getItem('lang') || 'fr';
      const additionalCountries = options.additionalCountries || [];
      const state = options.state || window.state || {};
      
      // Collecter tous les pays à charger
      const countriesToLoad = new Set();
      if (mainCC) countriesToLoad.add(mainCC);
      
      // Ajouter les pays des steps
      if (state.steps && state.steps.length > 0) {
        state.steps.forEach(step => {
          if (step.cc) countriesToLoad.add(step.cc.toUpperCase());
        });
      }
      
      // Ajouter les pays supplémentaires
      additionalCountries.forEach(cc => {
        if (cc) countriesToLoad.add(cc.toUpperCase());
      });
      
      // Initialiser ou réutiliser PLACES_INDEX
      if (!window.PLACES_INDEX || window.PLACES_INDEX === null) {
        window.PLACES_INDEX = {};
      }
      
      for (const cc of countriesToLoad) {
        if (!cc) continue;
        // Dossier en majuscules (LK, FR, IT...), fichier en minuscules
        const basePath = `${CONFIG.BASE_URL}/${cc.toUpperCase()}/${cc.toLowerCase()}.places.master.json`;
        const result = await this.loadWithLangFallback(basePath, lang);
        
        if (result && result.data) {
          const obj = result.data;
          const arr = Array.isArray(obj) ? obj : (obj.places || []);
          let count = 0;
          
          arr.forEach(pl => {
            const pid = pl.place_id || pl.id;
            if (!pid) return;
            // Ne pas écraser si déjà présent
            if (window.PLACES_INDEX[pid]) return;
            
            const visits = Array.isArray(pl.visits) 
              ? pl.visits.map(v => (typeof v === 'string' ? { text: v } : v)) 
              : [];
            const activities = Array.isArray(pl.activities) 
              ? pl.activities.map(a => (typeof a === 'string' ? { text: a } : a)) 
              : [];
            
            window.PLACES_INDEX[pid] = {
              lat: Number(pl.lat) || null,
              lon: Number(pl.lon) || Number(pl.lng) || null,
              name: pl.name || pl.title || '',
              rating: Number(pl.rating) || 0,
              suggested_days: Number(pl.suggested_days) || 1,
              place_type: pl.place_type || '',
              visits,
              activities,
              cc: cc
            };
            count++;
          });
          
          if (count > 0) {
            console.log(`[ORT-DATA] ✅ ${cc}: ${count} lieux chargés`);
          }
        }
      }
      
      console.log(`[ORT-DATA] Total: ${Object.keys(window.PLACES_INDEX).length} lieux dans l'index`);
      
      // Injecter les ratings dans les steps existants
      if (state.steps && state.steps.length > 0) {
        state.steps.forEach(step => {
          if (step.place_id && window.PLACES_INDEX[step.place_id]) {
            const masterData = window.PLACES_INDEX[step.place_id];
            if (!step.rating) step.rating = masterData.rating || 0;
            // Enrichir visits/activities si absents
            if ((!step.visits || step.visits.length === 0) && masterData.visits) {
              step.visits = masterData.visits;
            }
            if ((!step.activities || step.activities.length === 0) && masterData.activities) {
              step.activities = masterData.activities;
            }
          }
        });
      }
      
      return window.PLACES_INDEX;
    },

    /**
     * Récupère les coordonnées et nom depuis PLACES_INDEX
     * @param {string} pid - Place ID
     * @returns {Object} {lat, lon, name}
     */
    coordsFromMaster: function(pid) {
      if (!window.PLACES_INDEX || !pid) return { lat: null, lon: null, name: '' };
      const p = window.PLACES_INDEX[pid];
      return p ? { lat: p.lat, lon: p.lon, name: p.name || '' } : { lat: null, lon: null, name: '' };
    },

    /**
     * Récupère les données complètes d'un lieu depuis PLACES_INDEX
     * @param {string} pid - Place ID
     * @returns {Object|null} Données du lieu ou null
     */
    getPlaceData: function(pid) {
      if (!window.PLACES_INDEX || !pid) return null;
      return window.PLACES_INDEX[pid] || null;
    },

    // ============================================================
    // PHOTOS
    // ============================================================

    /**
     * Récupère les photos d'un lieu depuis PHOTOS_CACHE
     * @param {string} pid - Place ID
     * @returns {Array} Tableau de photos
     */
    getPhotosForPlace: function(pid) {
      if (!pid || !window.PHOTOS_CACHE) return [];
      const entry = window.PHOTOS_CACHE[pid];
      return entry?.photos || entry?.images || [];
    },

    /**
     * Recherche les photos pour un lieu par nom (avec fallbacks)
     * @param {string} name - Nom du lieu
     * @param {string} cc - Code pays
     * @returns {Array} Tableau de photos
     */
    findPhotosForPlace: function(name, cc) {
      if (!name || !window.PHOTOS_CACHE) return [];
      
      const slug = (global.toSlug || global.ORT_UTILS?.toSlug || function(n) {
        return n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      })(name);
      
      const ccUp = (cc || '').toUpperCase();
      
      const keys = [
        `${ccUp}::${slug}`,
        `${ccUp}::${name.toLowerCase()}`,
        slug,
        name.toLowerCase()
      ];
      
      for (const key of keys) {
        if (window.PHOTOS_CACHE[key]?.photos?.length) {
          return window.PHOTOS_CACHE[key].photos;
        }
      }
      
      // Recherche partielle par nom
      const found = Object.keys(window.PHOTOS_CACHE).find(k => {
        const kName = k.split('::').pop() || k;
        return kName === slug || kName.includes(slug) || slug.includes(kName);
      });
      
      if (found && window.PHOTOS_CACHE[found]?.photos?.length) {
        return window.PHOTOS_CACHE[found].photos;
      }
      
      return [];
    },

    /**
     * Charge le cache des photos
     * @returns {Promise<Object>} Le cache des photos
     */
    loadPhotosCache: async function() {
      if (window.PHOTOS_CACHE && Object.keys(window.PHOTOS_CACHE).length > 0) {
        return window.PHOTOS_CACHE;
      }
      
      for (const path of CONFIG.PHOTOS_PATHS) {
        try {
          const result = await this.loadJSON(path);
          if (result) {
            window.PHOTOS_CACHE = result;
            console.log('[ORT-DATA] ✅ Photos chargées:', Object.keys(window.PHOTOS_CACHE).length, 'lieux');
            return window.PHOTOS_CACHE;
          }
        } catch (e) {
          // Continuer avec le chemin suivant
        }
      }
      
      window.PHOTOS_CACHE = {};
      console.warn('[ORT-DATA] ⚠️ Photos non trouvées');
      return window.PHOTOS_CACHE;
    }
  };

  // ============================================================
  // EXPOSITION GLOBALE
  // ============================================================

  global.ORT_DATA_LOADER = ORT_DATA_LOADER;

  // Raccourcis pour compatibilité avec le code existant
  global.loadJSON = global.loadJSON || ORT_DATA_LOADER.loadJSON.bind(ORT_DATA_LOADER);
  global.loadWithLangFallback = global.loadWithLangFallback || ORT_DATA_LOADER.loadWithLangFallback.bind(ORT_DATA_LOADER);
  
  // Note: ensurePlacesIndex a une signature différente selon les fichiers
  // On expose une version compatible qui accepte soit un array, soit un objet options
  global.ensurePlacesIndex = global.ensurePlacesIndex || async function(additionalCountriesOrOptions = []) {
    if (Array.isArray(additionalCountriesOrOptions)) {
      return ORT_DATA_LOADER.ensurePlacesIndex({
        mainCC: window.CC || window.state?.cc || window.state?.country || '',
        lang: window.LANG || localStorage.getItem('lang') || 'fr',
        additionalCountries: additionalCountriesOrOptions,
        state: window.state
      });
    }
    return ORT_DATA_LOADER.ensurePlacesIndex(additionalCountriesOrOptions);
  };

  global.coordsFromMaster = global.coordsFromMaster || ORT_DATA_LOADER.coordsFromMaster.bind(ORT_DATA_LOADER);
  
  // Fonctions photos
  global.getPhotosForPlace = global.getPhotosForPlace || ORT_DATA_LOADER.getPhotosForPlace.bind(ORT_DATA_LOADER);
  global.findPhotosForPlace = global.findPhotosForPlace || ORT_DATA_LOADER.findPhotosForPlace.bind(ORT_DATA_LOADER);
  global.loadPhotosCache = global.loadPhotosCache || ORT_DATA_LOADER.loadPhotosCache.bind(ORT_DATA_LOADER);
  
  // Initialiser PHOTOS_CACHE si pas déjà fait
  if (!global.PHOTOS_CACHE) global.PHOTOS_CACHE = {};

  console.log('[ORT-DATA-LOADER] ✅ Module chargé');

})(typeof window !== 'undefined' ? window : this);
