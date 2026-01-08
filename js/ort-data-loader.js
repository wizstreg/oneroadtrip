/**
 * ORT-DATA-LOADER.js
 * Fonctions de chargement de données communes à tous les modules OneRoadTrip
 * 
 * Utilisé par : roadtrip_detail.html, roadtrip_detail_simple.html, roadtrip_mobile.html
 * 
 * Dépendances : Aucune (module autonome)
 */

(function(global) {
  'use strict';

  const ORT_DATA_LOADER = {

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
      // Essayer dans l'ordre : langue demandée → EN → FR → ancien format
      const langOrder = [lang, 'en', 'fr'].filter((v, i, a) => a.indexOf(v) === i); // unique
      
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
        const basePath = `./data/Roadtripsprefabriques/countries/${cc.toLowerCase()}/${cc.toLowerCase()}.places.master.json`;
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
      
      const paths = [
        './data/photos-json/photos_lieux.json',
        '/data/photos-json/photos_lieux.json',
        '../data/photos-json/photos_lieux.json'
      ];
      
      for (const path of paths) {
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

  // Exposer globalement
  global.ORT_DATA_LOADER = ORT_DATA_LOADER;

  // Raccourcis pour compatibilité avec le code existant
  global.loadJSON = global.loadJSON || ORT_DATA_LOADER.loadJSON.bind(ORT_DATA_LOADER);
  global.loadWithLangFallback = global.loadWithLangFallback || ORT_DATA_LOADER.loadWithLangFallback.bind(ORT_DATA_LOADER);
  
  // Note: ensurePlacesIndex a une signature différente selon les fichiers
  // On expose une version compatible qui accepte soit un array, soit un objet options
  global.ensurePlacesIndex = global.ensurePlacesIndex || async function(additionalCountriesOrOptions = []) {
    // Compatibilité: si c'est un array, convertir en options
    if (Array.isArray(additionalCountriesOrOptions)) {
      return ORT_DATA_LOADER.ensurePlacesIndex({
        mainCC: window.CC || window.state?.cc || window.state?.country || '',
        lang: window.LANG || localStorage.getItem('lang') || 'fr',
        additionalCountries: additionalCountriesOrOptions,
        state: window.state
      });
    }
    // Sinon c'est déjà un objet options
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
