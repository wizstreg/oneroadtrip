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
    
    // Calculer la date de départ si disponible
    const startDateStr = enriched.startDateStr || '';
    let baseDate = null;
    if (startDateStr) {
      baseDate = new Date(startDateStr);
      if (isNaN(baseDate.getTime())) baseDate = null;
    }
    
    // Calculer l'offset cumulé des nuits pour les dates
    let nightsOffset = 0;
    
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
      
      // Image par défaut si aucune photo (van/camion)
      if (!step.photo || step.photos.length === 0) {
        step.photo = '/img/default-roadtrip.jpg'; // Image de van/camion par défaut
        step.photos = [step.photo];
        step._hasDefaultPhoto = true;
      }
      
      // Fallback: image de van/camion si aucune photo
      if (!step.photo || step.photos.length === 0) {
        const fallbackImages = [
          'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80', // Van sur route
          'https://images.unsplash.com/photo-1527786356703-4b100091cd2c?w=800&q=80', // Campervan
          'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80', // Route scenic
          'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&q=80', // Road trip
          'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80'  // Voyage
        ];
        // Utiliser l'index pour varier les images
        step.photo = fallbackImages[idx % fallbackImages.length];
        step.photos = [step.photo];
        step.photoIsFallback = true;
        console.log(`[CARNET] Étape ${idx}: pas de photo, fallback utilisé`);
      }
      
      // Mapper distance/temps - gérer tous les formats possibles
      if (step.to_next_leg) {
        step.distanceKm = step.to_next_leg.distance_km || 0;
        step.driveMin = step.to_next_leg.drive_min || 0;
      } else if (step._distanceKmToNext !== undefined || step._driveMinToNext !== undefined) {
        // Format alternatif utilisé dans roadtrip_detail.html
        step.distanceKm = step._distanceKmToNext || 0;
        step.driveMin = step._driveMinToNext || 0;
      } else if (step.distanceToNext !== undefined) {
        // Autre format possible
        step.distanceKm = step.distanceToNext || 0;
        step.driveMin = step.driveMinToNext || Math.round((step.distanceToNext || 0) * 1.2);
      }
      
      // Calculer les dates de l'étape
      if (baseDate) {
        const nights = Number(step.nights || 0);
        const arrivalDate = new Date(baseDate);
        arrivalDate.setDate(arrivalDate.getDate() + nightsOffset);
        
        step.arrivalDate = arrivalDate.toISOString().split('T')[0]; // Format YYYY-MM-DD
        step.arrivalDateDisplay = arrivalDate.toLocaleDateString(); // Format local
        
        if (nights > 0) {
          const departureDate = new Date(arrivalDate);
          departureDate.setDate(departureDate.getDate() + nights);
          step.departureDate = departureDate.toISOString().split('T')[0];
          step.departureDateDisplay = departureDate.toLocaleDateString();
        }
        
        nightsOffset += nights;
      }
      
      console.log(`[CARNET] Étape ${idx} (${step.name}): ${step.photos.length} photos, ${step.distanceKm || 0}km, date: ${step.arrivalDate || 'N/A'}`);
    });
    
    // Hero image
    if (!enriched.heroImage && enriched.steps[0]?.photo) {
      enriched.heroImage = enriched.steps[0].photo;
    }
    
    // Ajouter la date de départ formatée
    if (baseDate) {
      enriched.startDate = startDateStr;
      enriched.startDateDisplay = baseDate.toLocaleDateString();
      
      // Calculer la date de fin
      const totalNights = enriched.steps.reduce((sum, s) => sum + Number(s.nights || 0), 0);
      const endDate = new Date(baseDate);
      endDate.setDate(endDate.getDate() + totalNights);
      enriched.endDate = endDate.toISOString().split('T')[0];
      enriched.endDateDisplay = endDate.toLocaleDateString();
      enriched.totalNights = totalNights;
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