// ORT — Config centralisée (local + prod, auto-init en prod)
(function () {
  // Fonction sécurisée pour lire localStorage
  function L(k) { 
    try { 
      return localStorage.getItem(k) || ''; 
    } catch(e) { 
      console.warn('[ORT] localStorage unavailable:', e);
      return ''; 
    } 
  }

  // --- Configuration complète ---
  var CONFIG_LOCAL = {
    apiKey: L('ORT_FB_APIKEY') || "AIzaSyChwXhmVSy6FyGVlrBDdi4IJ2LKCyt7VjM",
    authDomain: L('ORT_FB_AUTHDOMAIN') || "oneroadtrip-prod.firebaseapp.com",
    projectId: L('ORT_FB_PROJECT') || "oneroadtrip-prod",
    storageBucket: L('ORT_FB_BUCKET') || "oneroadtrip-prod.appspot.com",
    messagingSenderId: "451183452295",
    appId: "1:451183452295:web:3004ec5c970c0b53ddd822",
    measurementId: "G-JK3QGQGDDL"
  };

  // Détection environnement production
  var isProdHost = /\.web\.app$|\.firebaseapp\.com$/i.test(location.hostname);
  
  var done;
  window.__ort_ready = new Promise(function(r){ done = r; });

  function setCfg(cfg) {
    // Validation de la config
    if (!cfg || !cfg.apiKey || !cfg.projectId) {
      console.error('[ORT] Configuration Firebase invalide:', cfg);
      cfg = CONFIG_LOCAL;
    }

    window.ORT_CONFIG = { 
      PREPROD: CONFIG_LOCAL, 
      PROD: cfg,
      
      // ===== Configuration Mapbox (transports) =====
      MAPBOX_ACCESS_TOKEN: 'pk.eyJ1IjoibWFyY3NvcmNpIiwiYSI6ImNtZ3F0Y3RtODBtbXYya3M0OHpwdHlheTMifQ.t2r9eVoc15UCAcQXKfBvIg',
      MAPBOX_BASE_URL: 'https://api.mapbox.com/directions/v5/mapbox'
    };
    window.__FIREBASE_CONFIG__ = cfg;
    
    console.log('[ORT] Firebase config loaded:', {
      projectId: cfg.projectId,
      authDomain: cfg.authDomain,
      environment: isProdHost ? 'PRODUCTION' : 'LOCAL'
    });
    
    console.log('[ORT] Mapbox token configured');
    
    done();
  }

  if (isProdHost) {
    // En production, essaie de charger la config depuis Firebase Hosting
    fetch('/__/firebase/init.json', {
      credentials: 'same-origin',
      cache: 'no-cache'
    })
      .then(function(r) { 
        if (!r.ok) {
          console.warn('[ORT] init.json not found (HTTP ' + r.status + '), using local config');
          throw new Error('HTTP ' + r.status);
        }
        return r.json(); 
      })
      .then(function(cfg) { 
        if (cfg && cfg.apiKey && cfg.projectId) {
          console.log('[ORT] Production config loaded from init.json');
          setCfg(cfg);
        } else {
          console.warn('[ORT] Invalid config from init.json, using fallback');
          setCfg(CONFIG_LOCAL);
        }
      })
      .catch(function(err) { 
        console.warn('[ORT] Failed to load init.json:', err.message);
        console.log('[ORT] Using local config as fallback');
        setCfg(CONFIG_LOCAL); 
      });
  } else {
    // En local/dev, utilise directement la config locale
    console.log('[ORT] Using local development config');
    setCfg(CONFIG_LOCAL);
  }
})();