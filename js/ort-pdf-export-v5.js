/**
 * OneRoadTrip - Module d'ouverture de l'éditeur de carnet
 * 
 * Remplace l'ancien ort-pdf-export-v5.js
 * Ouvre l'éditeur de carnet au lieu de générer un PDF directement
 */

(function(window) {
  'use strict';
  
  /**
   * Ouvre l'éditeur de carnet avec les données du voyage
   * @param {Object} state - État du voyage (steps, title, etc.)
   * @param {string} lang - Langue (fr, en, etc.)
   */
  function openEditor(state, lang = 'fr') {
    console.log('[CARNET] Ouverture de l\'éditeur...', state);
    
    if (!state || !state.steps || state.steps.length === 0) {
      console.error('[CARNET] Pas de données de voyage');
      alert('Aucune donnée de voyage à éditer');
      return;
    }
    
    // Enrichir les données avec les photos du cache
    const enrichedState = enrichStateWithPhotos(state);
    
    // Stocker dans sessionStorage pour l'éditeur
    sessionStorage.setItem('ort_editor_trip', JSON.stringify(enrichedState));
    
    // Ouvrir l'éditeur dans un nouvel onglet
    const editorUrl = '/roadtrip-editor.html?lang=' + lang;
    window.open(editorUrl, '_blank');
    
    console.log('[CARNET] ✅ Éditeur ouvert');
  }
  
  /**
   * Enrichit le state avec les photos depuis toutes les sources
   */
  function enrichStateWithPhotos(state) {
    const enriched = JSON.parse(JSON.stringify(state));
    
    enriched.steps.forEach((step, idx) => {
      // Collecter les photos depuis toutes les sources
      const photos = [];
      
      // 1. Photos déjà dans step
      if (step.photo) photos.push(step.photo);
      if (step.photos?.length) photos.push(...step.photos);
      if (step.images?.length) photos.push(...step.images);
      
      // 2. Cache global PHOTOS_CACHE
      if (step.place_id && window.PHOTOS_CACHE) {
        const cached = window.PHOTOS_CACHE[step.place_id]?.photos || [];
        cached.forEach(p => { if (p && !photos.includes(p)) photos.push(p); });
      }
      
      // 3. Fonction getPhotosForPlace
      if (step.place_id && typeof window.getPhotosForPlace === 'function') {
        const fromFn = window.getPhotosForPlace(step.place_id) || [];
        fromFn.forEach(p => { if (p && !photos.includes(p)) photos.push(p); });
      }
      
      // 4. Photos depuis le DOM (carrousels, popups)
      const domPhotos = getPhotosFromDOM(idx, step.name, step.place_id);
      domPhotos.forEach(p => { if (p && !photos.includes(p)) photos.push(p); });
      
      // Stocker
      step.photos = photos.filter(p => p && typeof p === 'string');
      if (!step.photo && step.photos.length > 0) {
        step.photo = step.photos[0];
      }
      
      // Mapper distance/temps
      if (step.to_next_leg) {
        step.distanceKm = step.to_next_leg.distance_km || 0;
        step.driveMin = step.to_next_leg.drive_min || 0;
      }
      
      console.log(`[CARNET] Étape ${idx} (${step.name}): ${step.photos.length} photos`);
    });
    
    // Hero image
    if (!enriched.heroImage && enriched.steps[0]?.photo) {
      enriched.heroImage = enriched.steps[0].photo;
    }
    
    return enriched;
  }
  
  /**
   * Récupère les photos affichées dans le DOM
   */
  function getPhotosFromDOM(stepIdx, stepName, placeId) {
    const photos = [];
    
    // Images dans les lignes d'étapes
    const selectors = [
      `.step-row[data-idx="${stepIdx}"] img`,
      `.step-row[data-index="${stepIdx}"] img`,
      `[data-step="${stepIdx}"] img`,
      `[data-place-id="${placeId}"] img`
    ];
    
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(img => {
        const src = img.src || img.dataset.src;
        if (src && src.startsWith('http') && !src.includes('placeholder') && !src.includes('data:')) {
          photos.push(src);
        }
      });
    });
    
    // Images dans les popups Leaflet ouverts
    document.querySelectorAll('.leaflet-popup-content img').forEach(img => {
      if (img.src && img.src.startsWith('http')) {
        photos.push(img.src);
      }
    });
    
    return photos;
  }
  
  // ===== EXPORT =====
  window.ORT_PDF = {
    export: openEditor,
    exportPDF: openEditor,
    openEditor: openEditor,
    VERSION: '6.0 (Editor)'
  };
  
  // Alias pour compatibilité
  window.ORT_CARNET = window.ORT_PDF;
  
  console.log('[CARNET] ✅ Module Carnet v6 chargé');
  
})(window);