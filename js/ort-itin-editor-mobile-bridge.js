/**
 * ORT Itin Editor — Bridge mobile
 * 
 * Adapte ort-itin-editor.js (écrit pour les pages statiques) à roadtrip_mobile.html.
 * 
 * Ce que fait ce bridge :
 *   1. Crée un #textPanel factice (caché) que l'éditeur exige pour son init.
 *   2. Pré-charge les `steps` depuis window.state.steps (déjà chargé par ORT_DATA_LOADER),
 *      pour que l'éditeur n'aille pas re-fetch les JSON catalogue.
 *   3. Pré-charge les `places` depuis window.PLACES_INDEX (idem).
 *   4. Au moment où l'éditeur valide une modif, on met à jour state.steps et on
 *      ré-appelle les fonctions natives du mobile : renderMarkers, fetchAndDrawRoute, fitMapBounds.
 *   5. Vérifie que l'utilisateur est connecté avant de lancer (sinon prompt login).
 * 
 * Point d'entrée :
 *   window.ORT_MOBILE_EDIT.launch()
 */
(function (global) {
  'use strict';

  var EDITOR_SCRIPT_URL = '/js/ort-itin-editor.js';
  var loaded = false;
  var loading = null;

  // CSS additionnel injecté dès le chargement du bridge :
  //  - Cache les éléments mobile (header, footer, tab-bar) en mode édition
  //  - Élargit les popups Leaflet (surcharge la largeur fixe de l'éditeur)
  //  - Cache les boutons flottants mobile pendant l'édition
  function injectMobileEditCSS() {
    if (document.getElementById('ort-mobile-edit-css')) return;
    var s = document.createElement('style');
    s.id = 'ort-mobile-edit-css';
    s.textContent = [
      // En mode édition, cacher le header, la barre d'onglets et les boutons flottants
      '.ort-ed-map-fs header.header { display: none !important; }',
      '.ort-ed-map-fs nav.tab-bar { display: none !important; }',
      '.ort-ed-map-fs #btnEditItin,',
      '.ort-ed-map-fs #btnCenterMap,',
      '.ort-ed-map-fs #btnTogglePlaces { display: none !important; }',
      // Popups Leaflet en mode édition
      '.ort-ed-map-fs .leaflet-popup-content { width: auto !important; max-width: 320px !important; padding: 8px 12px !important; }',
      '.ort-ed-map-fs .leaflet-popup-content-wrapper { padding: 6px 0 !important; }',
      // Popups des autres places hors édition
      '.leaflet-popup.ort-mobile-op-popup .leaflet-popup-content { width: 280px !important; max-width: 280px !important; max-height: 360px; overflow-y: auto; padding: 12px 14px !important; line-height: 1.5; }',
      '.leaflet-popup.ort-mobile-op-popup .leaflet-popup-content-wrapper { padding: 0 !important; border-radius: 12px !important; }',
    ].join('\n');
    document.head.appendChild(s);
  }
  injectMobileEditCSS();
  injectMobileEditCSS();

  // I18N minimal (réutilise le i18n de l'éditeur si dispo)
  function getLang() {
    return (global.state && global.state.lang) || global.currentLang || 'fr';
  }

  var MSG = {
    fr: {
      loginRequired: 'Connectez-vous pour modifier votre itinéraire',
      loginRequiredSub: 'Vos modifications seront sauvegardées sur votre tableau de bord.',
      loginBtn: 'Se connecter / S\u2019inscrire',
      cancelBtn: 'Annuler',
      loading: 'Chargement de l\u2019éditeur\u2026',
      noData: 'Aucun itinéraire chargé. Ouvrez d\u2019abord un voyage.',
      warnSave: 'Mode édition activé. Les modifications seront sauvegardées sur votre tableau de bord.',
    },
    en: {
      loginRequired: 'Sign in to edit your itinerary',
      loginRequiredSub: 'Your changes will be saved to your dashboard.',
      loginBtn: 'Sign in / Register',
      cancelBtn: 'Cancel',
      loading: 'Loading editor\u2026',
      noData: 'No itinerary loaded. Open a trip first.',
      warnSave: 'Edit mode enabled. Changes will be saved to your dashboard.',
    },
    es: {
      loginRequired: 'Inicia sesión para editar tu itinerario',
      loginRequiredSub: 'Tus cambios se guardarán en tu panel.',
      loginBtn: 'Iniciar sesión / Registrarse',
      cancelBtn: 'Cancelar',
      loading: 'Cargando editor\u2026',
      noData: 'No hay itinerario cargado. Abre primero un viaje.',
      warnSave: 'Modo edición activado. Los cambios se guardarán en tu panel.',
    },
    pt: {
      loginRequired: 'Entre para editar seu itinerário',
      loginRequiredSub: 'Suas alterações serão salvas no seu painel.',
      loginBtn: 'Entrar / Registrar',
      cancelBtn: 'Cancelar',
      loading: 'Carregando editor\u2026',
      noData: 'Nenhum itinerário carregado. Abra uma viagem primeiro.',
      warnSave: 'Modo de edição ativado. As alterações serão salvas no seu painel.',
    },
    it: {
      loginRequired: 'Accedi per modificare il tuo itinerario',
      loginRequiredSub: 'Le tue modifiche verranno salvate nella tua dashboard.',
      loginBtn: 'Accedi / Registrati',
      cancelBtn: 'Annulla',
      loading: 'Caricamento editor\u2026',
      noData: 'Nessun itinerario caricato. Apri prima un viaggio.',
      warnSave: 'Modalità modifica attiva. Le modifiche verranno salvate nella tua dashboard.',
    },
    ar: {
      loginRequired: 'سجل الدخول لتعديل خط سيرك',
      loginRequiredSub: 'سيتم حفظ تعديلاتك في لوحة التحكم.',
      loginBtn: 'تسجيل الدخول / التسجيل',
      cancelBtn: 'إلغاء',
      loading: 'جارٍ تحميل المحرر\u2026',
      noData: 'لم يتم تحميل أي خط سير. افتح رحلة أولاً.',
      warnSave: 'تم تفعيل وضع التعديل. سيتم حفظ التغييرات في لوحة التحكم.',
    },
  };

  function t() {
    return MSG[getLang()] || MSG.fr;
  }

  // ─────────────────────────────────────────────
  // UI : prompt de connexion (modal léger)
  // ─────────────────────────────────────────────
  function showLoginPrompt() {
    var lang = t();
    var existing = document.getElementById('ort-mobile-edit-login');
    if (existing) existing.remove();

    var ov = document.createElement('div');
    ov.id = 'ort-mobile-edit-login';
    ov.style.cssText = 'position:fixed;inset:0;z-index:10005;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:20px;';
    ov.innerHTML =
      '<div style="background:#fff;border-radius:16px;max-width:360px;width:100%;padding:24px;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,.3);">' +
        '<div style="font-size:42px;margin-bottom:12px;">✏️</div>' +
        '<h3 style="margin:0 0 8px;color:#113f7a;font-size:1.05rem;">' + lang.loginRequired + '</h3>' +
        '<p style="margin:0 0 18px;color:#64748b;font-size:.88rem;line-height:1.4;">' + lang.loginRequiredSub + '</p>' +
        '<button id="ort-mel-login" style="width:100%;padding:12px;border:none;border-radius:10px;background:linear-gradient(135deg,#113f7a,#0a2a57);color:#fff;font-weight:600;font-size:.9rem;cursor:pointer;margin-bottom:8px;">' + lang.loginBtn + '</button>' +
        '<button id="ort-mel-cancel" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:10px;background:#fff;color:#64748b;font-weight:500;font-size:.85rem;cursor:pointer;">' + lang.cancelBtn + '</button>' +
      '</div>';
    document.body.appendChild(ov);

    document.getElementById('ort-mel-cancel').onclick = function () { ov.remove(); };
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    document.getElementById('ort-mel-login').onclick = function () {
      ov.remove();
      if (typeof global.openAuth === 'function') global.openAuth('login');
    };
  }

  // ─────────────────────────────────────────────
  // Toast info simple
  // ─────────────────────────────────────────────
  function toast(msg, ms) {
    ms = ms || 3000;
    var el = document.createElement('div');
    el.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:rgba(17,63,122,.95);color:#fff;padding:10px 18px;border-radius:20px;font-size:.85rem;font-weight:500;z-index:10003;box-shadow:0 4px 16px rgba(0,0,0,.25);max-width:90%;text-align:center;';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () { el.style.transition = 'opacity .3s'; el.style.opacity = '0'; }, ms - 300);
    setTimeout(function () { el.remove(); }, ms);
  }

  // ─────────────────────────────────────────────
  // Préparation du contexte pour l'éditeur
  // ─────────────────────────────────────────────
  function ensureFakeTextPanel() {
    // L'éditeur cherche #textPanel pour stocker l'HTML "original" et le reconstruire.
    // Sur mobile c'est inutile, on lui en donne un caché et vide qu'il pourra manipuler sans effet visible.
    var tp = document.getElementById('textPanel');
    if (tp) return tp;
    tp = document.createElement('div');
    tp.id = 'textPanel';
    tp.style.cssText = 'display:none !important;';
    tp.setAttribute('data-mobile-fake', '1');
    document.body.appendChild(tp);
    return tp;
  }

  function loadEditorScript() {
    if (loaded) return Promise.resolve();
    if (loading) return loading;
    loading = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = EDITOR_SCRIPT_URL;
      s.async = true;
      s.onload = function () { loaded = true; resolve(); };
      s.onerror = function () { loading = null; reject(new Error('Editor script load failed')); };
      document.head.appendChild(s);
    });
    return loading;
  }

  function isLoggedIn() {
    try {
      return !!(global.firebase && global.firebase.auth && global.firebase.auth().currentUser);
    } catch (e) {
      return false;
    }
  }

  // ─────────────────────────────────────────────
  // Pré-injection des données pour court-circuiter
  // les fetch internes de l'éditeur (loadItineraryData / loadPlacesData)
  // ─────────────────────────────────────────────
  function injectStepsAndPlaces() {
    // L'éditeur expose ses fonctions sous global.ORT_ITIN_EDITOR
    // mais loadItineraryData / loadPlacesData sont privées. On contourne en
    // monkey-patchant fetchJSON pour qu'il retourne nos données.
    //
    // Solution plus propre : on patche directement les variables internes via
    // l'API publique qu'on expose ci-dessous. L'éditeur a besoin de :
    //   - steps  : array normalisé (déjà le format de state.steps côté mobile)
    //   - placesIndex : map place_id -> {lat, lon, name, rating, suggested_days, visits, activities, cc}
    //
    // Comme ces variables sont dans la closure de l'éditeur, on ne peut pas les écrire
    // directement. On utilise le mécanisme de chargement existant : l'éditeur lit ses
    // fichiers via fetch sur des URLs précises. On intercepte ces fetch.
    //
    // Voir hookFetch() ci-dessous.
  }

  // Intercepte fetch() pour répondre aux URLs catalogue avec nos données déjà en mémoire
  function hookFetch() {
    if (global.__ORT_FETCH_HOOKED__) return;
    global.__ORT_FETCH_HOOKED__ = true;

    var origFetch = global.fetch.bind(global);
    global.fetch = function (url, opts) {
      var u = (typeof url === 'string') ? url : (url && url.url) || '';

      // 1. Itins module file → on répond avec un faux itin contenant nos state.steps déjà construits
      // Format attendu par l'éditeur : { itins: [ { id, title, days_plan: [...] } ] }
      var itinMatch = u.match(/\/data\/Roadtripsprefabriques\/countries\/[^/]+\/[^/]+\.itins\.modules-[^.]+\.json/i);
      if (itinMatch && global.state && global.state.steps && global.state.steps.length) {
        var fakeItin = buildFakeItinFromState();
        if (fakeItin) {
          return Promise.resolve(new Response(JSON.stringify(fakeItin), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }));
        }
      }

      // 2. Places master file → on répond avec PLACES_INDEX déjà chargé
      var placesMatch = u.match(/\/data\/Roadtripsprefabriques\/countries\/[^/]+\/[^/]+\.places\.master[^/]*\.json/i);
      if (placesMatch) {
        var pi = global.PLACES_INDEX || {};
        var pids = Object.keys(pi);
        console.log('[ORT-MOBILE-EDIT] Hook places intercepté pour: ' + u + ' — PLACES_INDEX a ' + pids.length + ' entrées');
        if (pids.length === 0) {
          // Pas de places en mémoire — on laisse le fetch original se faire
          // (sinon l'éditeur ne pourra pas ajouter de nouvelles étapes mais au moins n'échouera pas plus)
          console.warn('[ORT-MOBILE-EDIT] PLACES_INDEX vide — fetch original maintenu');
          return origFetch(url, opts);
        }
        var arr = pids.map(function (pid) {
          var p = pi[pid];
          return {
            place_id: pid,
            name: p.name,
            lat: p.lat,
            lon: p.lon,
            coords: (p.lat != null && p.lon != null) ? [p.lat, p.lon] : null,
            rating: p.rating || 0,
            suggested_days: p.suggested_days || 1,
            visits: p.visits || [],
            activities: p.activities || [],
          };
        });
        return Promise.resolve(new Response(JSON.stringify({ places: arr }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }));
      }

      return origFetch(url, opts);
    };
  }

  // Reconstruit un itin "format catalogue" à partir de state.steps pour que l'éditeur l'avale
  function buildFakeItinFromState() {
    var st = global.state;
    if (!st || !Array.isArray(st.steps) || !st.steps.length) return null;

    var daysPlan = st.steps.map(function (s, i) {
      return {
        day: i + 1,
        name: s.name || ('Étape ' + (i + 1)),
        place_id: s.place_id || s.placeId || '',
        coords: (s.lat != null && s.lng != null) ? [s.lat, s.lng] : [],
        night: {
          place_id: s.place_id || s.placeId || '',
          coords: (s.lat != null && s.lng != null) ? [s.lat, s.lng] : []
        },
        suggested_days: s.nights || s.suggested_days || 1,
        visits: s.visits || [],
        activities: s.activities || [],
        to_next_leg: s.to_next_leg || (s._driveMinToNext ? { drive_min: s._driveMinToNext, distance_km: s._distanceKmToNext || 0 } : null)
      };
    });

    var itinId = (st._originalItinId || st.itinId || 'mobile-trip');

    return {
      itins: [{
        id: itinId,
        itin_id: itinId,
        title: st.title || 'Roadtrip',
        days_plan: daysPlan
      }]
    };
  }

  // ─────────────────────────────────────────────
  // Hook de retour : quand l'éditeur valide / sauvegarde, on resync state.steps
  // et on redessine la carte mobile.
  // ─────────────────────────────────────────────
  function installReturnHook() {
    // L'éditeur sauvegarde via window.ORT_STATE.saveTrip() — on écoute juste après.
    // Le plus fiable : observer ORT_ITIN_EDITOR pour ses étapes finales et resync.
    if (global.__ORT_RETURN_HOOK_INSTALLED__) return;
    global.__ORT_RETURN_HOOK_INSTALLED__ = true;

    // L'éditeur, à la fin d'un reorgValidate, met à jour ses steps et appelle rebuildDaySections.
    // On ne peut pas hook rebuildDaySections (privé), mais on peut écouter le moment où
    // l'éditeur quitte le mode plein écran (la classe ort-ed-map-fs disparaît du body).
    var observer = new MutationObserver(function () {
      var inEdit = document.body.classList.contains('ort-ed-map-fs');
      if (!inEdit && global.__ORT_WAS_EDITING__) {
        global.__ORT_WAS_EDITING__ = false;
        // Sortie de mode édition : resync mobile
        syncStateFromEditor();
      } else if (inEdit) {
        global.__ORT_WAS_EDITING__ = true;
      }
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  // Lit les steps finalisées dans l'éditeur (via l'API qu'on lui demande d'exposer)
  // et les pousse dans state.steps. Si l'éditeur n'expose rien de public, on fait
  // un best effort en relisant Firestore (déjà sauvegardé par l'éditeur).
  async function syncStateFromEditor() {
    // L'éditeur a déjà sauvegardé via ORT_STATE.saveTrip si l'utilisateur a validé.
    // Le tripId est exposé via ORT_ITIN_EDITOR (variable savedTripId, pas accessible).
    // Solution : on relit le dernier trip via getLastSavedTrip si dispo, sinon on
    // fait confiance au state.steps que le mobile a déjà.
    //
    // Le plus simple et fiable : forcer un refresh depuis Firestore avec l'ID courant.
    try {
      var st = global.state;
      if (!st) return;

      // L'éditeur stocke dans Firestore — on relit via ORT_STATE
      if (global.ORT_STATE && st._originalItinId) {
        // On essaie de retrouver le tripId — il est dans l'URL si on est dans un trip sauvegardé,
        // sinon dans une variable globale exposée par l'éditeur.
        var tripId = null;
        try { tripId = new URLSearchParams(global.location.search).get('tripId'); } catch (e) {}
        if (!tripId && global.ORT_ITIN_EDITOR && global.ORT_ITIN_EDITOR.savedTripId) {
          tripId = global.ORT_ITIN_EDITOR.savedTripId;
        }
        if (tripId) {
          var trip = await global.ORT_STATE.getTrip(tripId);
          if (trip && trip.steps && trip.steps.length) {
            global.state.steps = trip.steps;
            global.state.title = trip.title || global.state.title;
          }
        }
      }
    } catch (e) {
      console.warn('[ORT-MOBILE-EDIT] sync échec:', e);
    }

    // Redessiner la carte mobile
    if (typeof global.renderMarkers === 'function') global.renderMarkers();
    if (typeof global.fetchAndDrawRoute === 'function') global.fetchAndDrawRoute();
    if (typeof global.fitMapBounds === 'function') global.fitMapBounds();
    if (typeof global.renderListView === 'function') global.renderListView();

    // Si l'utilisateur avait activé l'affichage des "autres places" avant l'édition,
    // on le restaure (les markers ont été nettoyés par buildEditorMarkersFromState).
    // On invalide aussi le cache parce que des étapes ont pu être ajoutées/supprimées.
    normalOpData = null;
    if (normalOpVisible) {
      var places = await getOrLoadPlacesArray();
      showNormalOpMarkers(places);
    }
  }

  // ─────────────────────────────────────────────
  // POINT D'ENTRÉE PUBLIC
  // ─────────────────────────────────────────────

  // L'éditeur ort-itin-editor.js attend, sur les pages statiques :
  //   - window.map  : l'instance Leaflet (exposée par initMap côté mobile)
  //   - window.mk   : { 1: marker_jour1, 2: marker_jour2, ... }
  //   - window.MP   : array [{ day, name, lat, lng, ... }]
  //
  // Le mobile gère ses markers en interne (let markers = []) et n'expose pas mk / MP.
  // On les fabrique à partir de state.steps avant le init() de l'éditeur.
  async function buildEditorMarkersFromState() {
    var st = global.state;
    var L = global.L;
    var map = global.map;
    if (!st || !st.steps || !L || !map) return;

    // 1. Nettoyer anciens markers d'éditeur (cas réouverture)
    if (global.mk) {
      Object.keys(global.mk).forEach(function (k) {
        try { map.removeLayer(global.mk[k]); } catch (e) {}
      });
    }
    global.mk = {};
    global.MP = [];

    // 2. Cacher TOUS les éléments dessinés par le mobile sur la carte
    //    pour que l'éditeur ait un canvas propre.
    //    Markers natifs :
    if (Array.isArray(global.markers)) {
      global.markers.forEach(function (m) {
        try { map.removeLayer(m); } catch (e) {}
      });
    }
    //    Lignes de hub (dispersion étapes co-localisées) :
    if (Array.isArray(global._hubLines)) {
      global._hubLines.forEach(function (l) {
        try { map.removeLayer(l); } catch (e) {}
      });
    }
    //    Plus large : balayer toute la carte et virer markers + polylines
    //    (sauf nos propres OP markers qui n'existent pas encore à ce stade).
    //    On garde uniquement les TileLayer (le fond de carte).
    map.eachLayer(function (layer) {
      if (layer instanceof L.TileLayer) return;
      try { map.removeLayer(layer); } catch (e) {}
    });

    // 3. Créer les marqueurs numérotés attendus par l'éditeur
    function mkIcon(day, active) {
      var bg = active ? '#e11d48' : '#113f7a';
      var sz = active ? 34 : 26;
      var fs = active ? 14 : 11;
      return L.divIcon({
        html: '<div style="background:' + bg + ';color:#fff;width:' + sz + 'px;height:' + sz + 'px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:' + fs + 'px;font-weight:700;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)">' + day + '</div>',
        className: 'dm',
        iconSize: [sz, sz],
        iconAnchor: [sz / 2, sz / 2]
      });
    }
    global.mkIcon = mkIcon;

    st.steps.forEach(function (s, i) {
      if (s.lat == null || s.lng == null) return;
      var day = i + 1;
      var m = L.marker([s.lat, s.lng], { icon: mkIcon(day, false) }).addTo(map);
      global.mk[day] = m;
      global.MP.push({
        day: day,
        name: s.name || ('Étape ' + day),
        lat: s.lat,
        lng: s.lng,
        tag: '', photo: '', photoAlts: [], htl: null
      });
    });

    // 4. Construire window.OP (autres places, non présentes dans steps)
    //    L'éditeur lit global.OP dans setupOPMarkers() pour les rendre cliquables.
    //    On charge le JSON master du pays directement (PLACES_INDEX du mobile peut être vide
    //    selon le contexte — c'est plus fiable de faire le fetch nous-mêmes).
    await loadCountryPlacesAndBuildOP();
  }

  // Charge le JSON places-master du pays courant et construit window.OP
  async function loadCountryPlacesAndBuildOP() {
    var st = global.state;
    if (!st || !st.cc) return;
    var cc = st.cc.toUpperCase();
    var ccLow = cc.toLowerCase();
    var lang = getLang();

    // Mêmes URL que l'éditeur, dans le même ordre
    var langOrder = [lang, 'en', 'fr'].filter(function (v, i, a) { return a.indexOf(v) === i; });
    var data = null;

    for (var i = 0; i < langOrder.length; i++) {
      var L = langOrder[i];
      var url1 = '/data/Roadtripsprefabriques/countries/' + cc + '/' + ccLow + '.places.master-' + L + '.json';
      data = await tryFetchJSON(url1);
      if (data) break;
      var url2 = '/data/Roadtripsprefabriques/countries/' + cc + '/' + cc + '.places.master-' + L + '.json';
      data = await tryFetchJSON(url2);
      if (data) break;
    }

    if (!data) {
      console.warn('[ORT-MOBILE-EDIT] Places JSON introuvable, OP restera vide');
      global.OP = [];
      return;
    }

    var arr = Array.isArray(data) ? data : (data.places || []);
    var usedPids = {};
    st.steps.forEach(function (s) {
      var pid = s.place_id || s.placeId;
      if (pid) usedPids[pid] = 1;
    });

    var op = [];
    arr.forEach(function (p) {
      var pid = p.place_id || p.id;
      if (!pid || usedPids[pid]) return;
      var lat = (p.lat != null) ? Number(p.lat) : (p.coords && p.coords[0]);
      var lng = (p.lon != null) ? Number(p.lon) : ((p.lng != null) ? Number(p.lng) : (p.coords && p.coords[1]));
      if (lat == null || lng == null) return;
      var kw = (p.map_keywords || []).slice(0, 4).join(', ');
      op.push({
        name: p.name || p.title || '',
        lat: lat,
        lng: lng,
        rat: Number(p.rating) || 0,
        kw: kw,
        pid: pid
      });
    });

    global.OP = op;
    console.log('[ORT-MOBILE-EDIT] window.OP construit avec ' + op.length + ' lieux');

    // L'éditeur a peut-être déjà appelé setupOPMarkers avant qu'on ait fini :
    // si oui, on lui demande de retraiter en réinjectant le mode reorg.
    // Note : pas d'API publique, donc on ne peut pas. Mais comme loadCountryPlacesAndBuildOP
    // est lancé AVANT init() (synchrone du point de vue du caller car init est lui-même async),
    // si on attend cette promesse avant init, c'est bon. Voir launch().
  }

  function tryFetchJSON(url) {
    return fetch(url, { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) return null;
        var ct = r.headers.get('content-type') || '';
        if (!ct.includes('application/json') && !ct.includes('text/')) return null;
        return r.json();
      })
      .catch(function () { return null; });
  }

  // ─────────────────────────────────────────────
  // TOGGLE AUTRES PLACES (hors mode édition)
  // ─────────────────────────────────────────────
  // État : array des markers OP affichés en mode normal (pas d'édition)
  var normalOpMarkers = [];
  var normalOpVisible = false;
  var normalOpData = null; // cache des places chargées

  // Couleurs identiques à l'éditeur
  function opColor(r) {
    if (r >= 8.8) return '#1565C0';
    if (r >= 7.6) return '#43A047';
    if (r >= 6.1) return '#7CB342';
    if (r >= 3.1) return '#78909C';
    if (r > 0) return '#B0BEC5';
    return '#CFD8DC';
  }

  function escHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // Charge les places et retourne le tableau, en cachant le résultat.
  async function getOrLoadPlacesArray() {
    if (normalOpData) return normalOpData;
    var st = global.state;
    if (!st || !st.cc) return [];
    var cc = st.cc.toUpperCase();
    var ccLow = cc.toLowerCase();
    var lang = getLang();
    var langOrder = [lang, 'en', 'fr'].filter(function (v, i, a) { return a.indexOf(v) === i; });
    var data = null;
    for (var i = 0; i < langOrder.length; i++) {
      var L = langOrder[i];
      data = await tryFetchJSON('/data/Roadtripsprefabriques/countries/' + cc + '/' + ccLow + '.places.master-' + L + '.json');
      if (data) break;
      data = await tryFetchJSON('/data/Roadtripsprefabriques/countries/' + cc + '/' + cc + '.places.master-' + L + '.json');
      if (data) break;
    }
    if (!data) { normalOpData = []; return normalOpData; }
    var arr = Array.isArray(data) ? data : (data.places || []);
    var usedPids = {};
    st.steps.forEach(function (s) {
      var pid = s.place_id || s.placeId;
      if (pid) usedPids[pid] = 1;
    });
    var out = [];
    arr.forEach(function (p) {
      var pid = p.place_id || p.id;
      if (!pid || usedPids[pid]) return;
      var lat = (p.lat != null) ? Number(p.lat) : (p.coords && p.coords[0]);
      var lon = (p.lon != null) ? Number(p.lon) : ((p.lng != null) ? Number(p.lng) : (p.coords && p.coords[1]));
      if (lat == null || lon == null) return;
      out.push({
        pid: pid,
        name: p.name || p.title || '',
        lat: lat, lng: lon,
        rating: Number(p.rating) || 0,
        visits: Array.isArray(p.visits) ? p.visits.map(function (v) { return typeof v === 'string' ? { text: v } : v; }) : [],
        activities: Array.isArray(p.activities) ? p.activities.map(function (a) { return typeof a === 'string' ? { text: a } : a; }) : [],
      });
    });
    normalOpData = out;
    return out;
  }

  function buildOpPopupHtml(p) {
    var h = '<div style="min-width:200px;max-width:300px;font-family:Inter,system-ui,sans-serif;line-height:1.45">';
    h += '<div style="font-size:1rem;font-weight:700;color:#113f7a;margin-bottom:4px">' + escHtml(p.name) + '</div>';
    if (p.rating) {
      var stars = '';
      var r = Math.round(p.rating / 2);
      for (var i = 0; i < 5; i++) stars += i < r ? '★' : '☆';
      h += '<div style="color:#f4a623;font-size:.82rem;margin-bottom:8px">' + stars + ' <span style="color:#666;font-size:.78rem">(' + p.rating.toFixed(1) + ')</span></div>';
    }
    if (p.visits && p.visits.length) {
      h += '<div style="margin-bottom:6px"><div style="font-size:.78rem;font-weight:600;color:#113f7a;margin-bottom:3px">📍 Visites (' + p.visits.length + ')</div>';
      p.visits.slice(0, 3).forEach(function (v) {
        h += '<div style="font-size:.8rem;color:#444;padding:2px 0">' + escHtml(v.text || v) + '</div>';
      });
      if (p.visits.length > 3) h += '<div style="font-size:.72rem;color:#999">+ ' + (p.visits.length - 3) + ' autres</div>';
      h += '</div>';
    }
    if (p.activities && p.activities.length) {
      h += '<div><div style="font-size:.78rem;font-weight:600;color:#113f7a;margin-bottom:3px">🎯 Activités (' + p.activities.length + ')</div>';
      p.activities.slice(0, 3).forEach(function (a) {
        h += '<div style="font-size:.8rem;color:#444;padding:2px 0">' + escHtml(a.text || a) + '</div>';
      });
      if (p.activities.length > 3) h += '<div style="font-size:.72rem;color:#999">+ ' + (p.activities.length - 3) + ' autres</div>';
      h += '</div>';
    }
    h += '</div>';
    return h;
  }

  function showNormalOpMarkers(places) {
    var L = global.L;
    var map = global.map;
    if (!L || !map) return;
    hideNormalOpMarkers();
    places.forEach(function (p) {
      var col = opColor(p.rating);
      var rad = p.rating >= 8.8 ? 9 : (p.rating >= 7.6 ? 8 : 6);
      var m = L.circleMarker([p.lat, p.lng], {
        radius: rad, fillColor: col, color: '#fff', weight: 2, fillOpacity: 0.85
      }).addTo(map);
      m.bindPopup(buildOpPopupHtml(p), { maxWidth: 320, autoPanPadding: [20, 20], className: 'ort-mobile-op-popup' });
      normalOpMarkers.push(m);
    });
  }

  function hideNormalOpMarkers() {
    var map = global.map;
    if (!map) return;
    normalOpMarkers.forEach(function (m) {
      try { map.removeLayer(m); } catch (e) {}
    });
    normalOpMarkers = [];
  }

  // API publique : toggle l'affichage des autres places hors édition.
  // Retourne le nouvel état (true = visibles, false = masquées).
  async function toggleOtherPlaces() {
    if (normalOpVisible) {
      hideNormalOpMarkers();
      normalOpVisible = false;
      return false;
    }
    var places = await getOrLoadPlacesArray();
    if (!places.length) {
      console.warn('[ORT-MOBILE-EDIT] Aucune autre place à afficher');
      return false;
    }
    showNormalOpMarkers(places);
    normalOpVisible = true;
    return true;
  }

  async function launch() {
    var lang = t();

    // 1. Vérifier qu'on a un itinéraire
    if (!global.state || !Array.isArray(global.state.steps) || global.state.steps.length === 0) {
      toast(lang.noData);
      return;
    }

    // 2. Vérifier connexion
    if (!isLoggedIn()) {
      showLoginPrompt();
      return;
    }

    // 3. Setup
    ensureFakeTextPanel();
    hookFetch();
    installReturnHook();

    // 4. Charger l'éditeur si pas déjà
    try {
      toast(lang.loading, 1500);
      await loadEditorScript();
    } catch (e) {
      console.error('[ORT-MOBILE-EDIT] Chargement éditeur échoué:', e);
      toast('❌ Chargement éditeur échoué');
      return;
    }

    if (!global.ORT_ITIN_EDITOR || typeof global.ORT_ITIN_EDITOR.init !== 'function') {
      toast('❌ Éditeur non disponible');
      return;
    }

    // 5. Init de l'éditeur avec les params du voyage courant
    var st = global.state;
    var cc = (st.cc || '').toUpperCase();
    var itinId = st._originalItinId || st.itinId || 'mobile-trip';

    // 5a. L'éditeur attend window.map (instance Leaflet) et window.mk (dict day→marker).
    //     Le mobile expose window.map dans initMap. On construit mk à partir de state.steps.
    if (!global.map) {
      console.error('[ORT-MOBILE-EDIT] window.map absent — vérifier que initMap a été appelé et expose window.map');
      toast('❌ Carte non initialisée');
      return;
    }
    await buildEditorMarkersFromState();

    toast(lang.warnSave, 4000);

    try {
      await global.ORT_ITIN_EDITOR.init({
        cc: cc,
        itinId: itinId,
        lang: getLang(),
      });
    } catch (e) {
      console.error('[ORT-MOBILE-EDIT] Init éditeur échoué:', e);
      toast('❌ Démarrage éditeur échoué : ' + (e.message || e));
    }
  }

  global.ORT_MOBILE_EDIT = { launch: launch, toggleOtherPlaces: toggleOtherPlaces };
})(window);
