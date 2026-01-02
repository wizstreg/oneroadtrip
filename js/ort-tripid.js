/**
 * =====================================================
 * ORT-TRIPID - Module de gestion centralisée des TripId
 * =====================================================
 * 
 * Ce module assure que window.state.tripId est TOUJOURS défini
 * et constitue la source de vérité unique pour l'identifiant du voyage.
 * 
 * À inclure dans TOUTES les pages RT après ort-config.js
 * 
 * @version 1.0.0
 * @date 2025-01-02
 */

window.ORT_TRIPID = (function() {
  'use strict';
  
  const STORAGE_KEY = 'ORT_CURRENT_TRIP_ID';
  
  /**
   * Génère un tripId selon la source
   * @param {string} source - 'catalog', 'custom', 'creator', 'mobile'
   * @param {Object} params - Paramètres selon le type
   * @returns {string} tripId généré
   */
  function generate(source, params = {}) {
    const timestamp = Date.now();
    switch(source) {
      case 'catalog':
        return `catalog::${params.cc}::${params.itin}`;
      case 'custom':
        return `custom::${timestamp}`;
      case 'creator':
        return `creator::${params.cc}::${params.slug}::${params.creatorId}`;
      case 'mobile':
        return `mobile::${timestamp}`;
      default:
        return `custom::${timestamp}`;
    }
  }
  
  /**
   * Initialise le tripId au chargement de la page
   * DOIT être appelé au début de chaque page RT
   * @param {Object} options - Options d'initialisation
   * @param {string} options.source - Source optionnelle ('mobile', 'detail', etc.)
   * @returns {string} tripId initialisé
   */
  function init(options = {}) {
    const params = new URLSearchParams(location.search);
    let tripId = null;
    
    // Priorité 1: tripId explicite dans URL
    tripId = params.get('tripId') || params.get('id');
    
    // Priorité 2: Reconstruction depuis cc+itin (catalog)
    if (!tripId && params.get('cc') && params.get('itin')) {
      tripId = `catalog::${params.get('cc')}::${params.get('itin')}`;
    }
    
    // Priorité 3: rtKey de carte_builder ou import
    if (!tripId && params.get('rtKey')) {
      tripId = `custom::${params.get('rtKey')}`;
    }
    
    // Priorité 4: from=builder ou from=temp (Route Builder)
    if (!tripId && (params.get('from') === 'builder' || params.get('from') === 'temp')) {
      // Vérifie d'abord localStorage
      tripId = localStorage.getItem(STORAGE_KEY);
      if (!tripId) {
        tripId = generate('custom');
      }
    }
    
    // Priorité 5: localStorage (retour, refresh)
    if (!tripId) {
      tripId = localStorage.getItem(STORAGE_KEY);
    }
    
    // Priorité 6: Génération nouveau selon source
    if (!tripId) {
      const source = options.source || 'custom';
      tripId = generate(source);
    }
    
    // STOCKAGE OBLIGATOIRE
    store(tripId);
    
    console.log('[ORT-TRIPID] ✅ Initialisé:', tripId);
    return tripId;
  }
  
  /**
   * Stocke le tripId partout où nécessaire
   * @param {string} tripId
   * @returns {string} tripId stocké
   */
  function store(tripId) {
    if (!tripId) return null;
    
    // Dans window.state
    window.state = window.state || {};
    window.state.tripId = tripId;
    
    // Compatibilité avec _tripId utilisé dans certains fichiers
    window.state._tripId = tripId;
    
    // Dans localStorage
    localStorage.setItem(STORAGE_KEY, tripId);
    
    return tripId;
  }
  
  /**
   * Récupère le tripId actuel
   * @returns {string|null} tripId ou null
   */
  function get() {
    // Priorité: window.state > localStorage
    return window.state?.tripId || window.state?._tripId || localStorage.getItem(STORAGE_KEY);
  }
  
  /**
   * Vérifie si un tripId existe
   * @returns {boolean}
   */
  function exists() {
    return !!get();
  }
  
  /**
   * Efface le tripId (pour nouveau voyage)
   */
  function clear() {
    if (window.state) {
      delete window.state.tripId;
      delete window.state._tripId;
    }
    localStorage.removeItem(STORAGE_KEY);
    console.log('[ORT-TRIPID] 🗑️ TripId effacé');
  }
  
  /**
   * Construit une URL avec le tripId inclus
   * @param {string} page - Page de destination
   * @param {Object} extraParams - Paramètres additionnels
   * @returns {string} URL complète
   */
  function buildUrl(page, extraParams = {}) {
    const url = new URL(page, location.href);
    const currentTripId = get();
    
    if (currentTripId) {
      url.searchParams.set('tripId', currentTripId);
    }
    
    // Préserver les paramètres existants importants
    const currentParams = new URLSearchParams(location.search);
    const preserveParams = ['cc', 'itin', 'lang', 'region'];
    preserveParams.forEach(param => {
      const value = currentParams.get(param);
      if (value && !extraParams.hasOwnProperty(param)) {
        url.searchParams.set(param, value);
      }
    });
    
    // Ajouter les paramètres supplémentaires
    Object.entries(extraParams).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') {
        url.searchParams.set(k, v);
      }
    });
    
    return url.toString();
  }
  
  /**
   * Navigation vers une autre page avec tripId
   * @param {string} page - Page de destination
   * @param {Object} extraParams - Paramètres additionnels
   */
  function navigateTo(page, extraParams = {}) {
    window.location.href = buildUrl(page, extraParams);
  }
  
  /**
   * Formate un tripId pour l'affichage (version courte)
   * @param {string} tripId
   * @returns {string}
   */
  function format(tripId) {
    if (!tripId) return 'N/A';
    if (tripId.length > 30) {
      return tripId.substring(0, 15) + '...' + tripId.substring(tripId.length - 10);
    }
    return tripId;
  }
  
  return {
    generate,
    init,
    store,
    get,
    exists,
    clear,
    buildUrl,
    navigateTo,
    format,
    STORAGE_KEY
  };
})();

console.log('[ORT-TRIPID] ✅ Module chargé');
