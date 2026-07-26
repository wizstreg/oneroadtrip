/**
 * OneRoadTrip - Module d'ouverture de l'éditeur de carnet
 * 
 * Remplace l'ancien ort-pdf-export-v5.js
 * Ouvre l'éditeur de carnet au lieu de générer un PDF directement
 * 
 * v6.2 - Ajout support format enrichi (practical_context, practical_info, road_type)
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
    
    // === DEBUG: Lister les sources potentielles de practical_context ===
    console.log('[CARNET] 🔍 Recherche practical_context...');
    console.log('[CARNET] - state.practical_context:', state.practical_context);
    console.log('[CARNET] - window.CURRENT_ITIN?.practical_context:', window.CURRENT_ITIN?.practical_context);
    console.log('[CARNET] - window.ITIN_DATA?.practical_context:', window.ITIN_DATA?.practical_context);
    console.log('[CARNET] - window.currentItinerary?.practical_context:', window.currentItinerary?.practical_context);
    console.log('[CARNET] - window._currentItin?.practical_context:', window._currentItin?.practical_context);
    console.log('[CARNET] - window.itinData?.practical_context:', window.itinData?.practical_context);
    
    // Vérifier ORT_STATE
    if (window.ORT_STATE?.getState) {
      const ortState = window.ORT_STATE.getState();
      console.log('[CARNET] - ORT_STATE.getState()?.practical_context:', ortState?.practical_context);
      console.log('[CARNET] - ORT_STATE.getState()?.itin?.practical_context:', ortState?.itin?.practical_context);
    }
    
    // Vérifier si practical_context est dans l'itinéraire original
    if (window.ORT_STATE?.getItinerary) {
      const itin = window.ORT_STATE.getItinerary();
      console.log('[CARNET] - ORT_STATE.getItinerary()?.practical_context:', itin?.practical_context);
    }
    
    // === PRÉ-ENRICHIR STATE AVEC PRACTICAL_CONTEXT SI ABSENT ===
    if (!state.practical_context) {
      // Essayer de récupérer depuis les sources globales
      const sources = [
        { name: 'CURRENT_ITIN', obj: window.CURRENT_ITIN },
        { name: 'ITIN_DATA', obj: window.ITIN_DATA },
        { name: 'currentItinerary', obj: window.currentItinerary },
        { name: '_currentItin', obj: window._currentItin },
        { name: 'itinData', obj: window.itinData },
        { name: 'ORT_STATE.getState()', obj: window.ORT_STATE?.getState?.() },
        { name: 'ORT_STATE.getState().itin', obj: window.ORT_STATE?.getState?.()?.itin },
        { name: 'ORT_STATE.getItinerary()', obj: window.ORT_STATE?.getItinerary?.() },
      ];
      
      for (const { name, obj } of sources) {
        if (obj?.practical_context) {
          state.practical_context = obj.practical_context;
          console.log(`[CARNET] ✅ practical_context injecté depuis ${name}`);
          break;
        }
      }
      
      if (!state.practical_context) {
        console.log('[CARNET] ⚠️ practical_context non trouvé dans aucune source globale');
      }
    }
    
    // Enrichir les données avec les photos du cache
    const enrichedState = enrichStateWithPhotos(state);
    
    // === AJOUTER LE TRIPID DU DASHBOARD SI DISPONIBLE ===
    const params = new URLSearchParams(location.search);
    const dashboardTripId = params.get('tripId') || params.get('id') || state.tripId;
    if (dashboardTripId && dashboardTripId.startsWith('trip_')) {
      enrichedState._dashboardTripId = dashboardTripId;
      console.log('[CARNET] TripId Dashboard inclus:', dashboardTripId);
    }
    
    // Stocker dans sessionStorage pour l'éditeur
    sessionStorage.setItem('ort_editor_trip', JSON.stringify(enrichedState));
    
    // Ouvrir l'éditeur avec le tripId si en mode Dashboard
    let editorUrl = '/roadtrip-editor.html?lang=' + lang;
    if (dashboardTripId && dashboardTripId.startsWith('trip_')) {
      editorUrl += '&tripId=' + encodeURIComponent(dashboardTripId);
    }
    window.open(editorUrl, '_blank');
    
    console.log('[CARNET] ✅ Éditeur ouvert');
  }
  
  /**
   * Enrichit le state avec les photos depuis toutes les sources
   * + Préserve les champs enrichis (practical_context, practical_info, road_type)
   */
  function enrichStateWithPhotos(state) {
    const enriched = JSON.parse(JSON.stringify(state));
    
    // === RÉCUPÉRER PRACTICAL_CONTEXT DEPUIS TOUTES LES SOURCES POSSIBLES ===
    let practicalContext = state.practical_context || null;
    
    // Source 1: Déjà dans state
    if (!practicalContext && enriched.practical_context) {
      practicalContext = enriched.practical_context;
    }
    
    // Source 2: Variable globale CURRENT_ITIN (roadtrip_detail.html)
    if (!practicalContext && window.CURRENT_ITIN?.practical_context) {
      practicalContext = window.CURRENT_ITIN.practical_context;
      console.log('[CARNET] practical_context récupéré depuis CURRENT_ITIN');
    }
    
    // Source 3: ORT_STATE_MANAGER
    if (!practicalContext && window.ORT_STATE?.getState) {
      const ortState = window.ORT_STATE.getState();
      if (ortState?.practical_context) {
        practicalContext = ortState.practical_context;
        console.log('[CARNET] practical_context récupéré depuis ORT_STATE');
      }
    }
    
    // Source 4: Données itinéraire dans window
    if (!practicalContext && window.ITIN_DATA?.practical_context) {
      practicalContext = window.ITIN_DATA.practical_context;
      console.log('[CARNET] practical_context récupéré depuis ITIN_DATA');
    }
    
    // Source 5: ORT_TRIP_DATA
    if (!practicalContext && window.ORT_TRIP_DATA?.getPracticalContext) {
      practicalContext = window.ORT_TRIP_DATA.getPracticalContext();
      console.log('[CARNET] practical_context récupéré depuis ORT_TRIP_DATA');
    }
    
    // Stocker si trouvé
    if (practicalContext) {
      enriched.practical_context = practicalContext;
      console.log('[CARNET] ✅ practical_context trouvé:', {
        best_months: practicalContext.best_months?.length || 0,
        highlights: practicalContext.highlights?.length || 0,
        best_months_values: practicalContext.best_months || [],
        highlights_values: (practicalContext.highlights || []).slice(0, 2)
      });
    } else {
      console.log('[CARNET] ⚠️ practical_context non trouvé dans aucune source');
    }
    
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
        // === PRÉSERVER ROAD_TYPE ===
        if (step.to_next_leg.road_type) {
          step.roadType = step.to_next_leg.road_type;
        }
      } else if (step._distanceKmToNext !== undefined || step._driveMinToNext !== undefined) {
        // Format alternatif utilisé dans roadtrip_detail.html
        step.distanceKm = step._distanceKmToNext || 0;
        step.driveMin = step._driveMinToNext || 0;
        if (step._roadTypeToNext) {
          step.roadType = step._roadTypeToNext;
        }
      } else if (step.distanceToNext !== undefined) {
        // Autre format possible
        step.distanceKm = step.distanceToNext || 0;
        step.driveMin = step.driveMinToNext || Math.round((step.distanceToNext || 0) * 1.2);
      }
      
      // === PRÉSERVER PRACTICAL_INFO SUR LES ACTIVITÉS ===
      if (step.activities && Array.isArray(step.activities)) {
        step.activities = step.activities.map(act => {
          // Si c'est un objet avec practical_info, le préserver
          if (typeof act === 'object' && act !== null) {
            return act; // Déjà un objet, préserver tel quel
          }
          // Si c'est une string, la convertir en objet
          return { text: act };
        });
      }
      
      // === PRÉSERVER PRACTICAL_INFO SUR LES VISITS ===
      if (step.visits && Array.isArray(step.visits)) {
        step.visits = step.visits.map(visit => {
          if (typeof visit === 'object' && visit !== null) {
            return visit;
          }
          return { text: visit };
        });
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
      
      // Debug avec les nouveaux champs
      const hasRoadType = step.roadType ? ` [${step.roadType}]` : '';
      const activitiesWithInfo = (step.activities || []).filter(a => a?.practical_info).length;
      console.log(`[CARNET] Étape ${idx} (${step.name}): ${step.photos.length} photos, ${step.distanceKm || 0}km${hasRoadType}, ${activitiesWithInfo} activités avec infos pratiques`);
    });
    
    // Hero image
    if (!enriched.heroImage && enriched.steps[0]?.photo) {
      enriched.heroImage = enriched.steps[0].photo;
    }
    
    // === COLLECTER LES RÉSERVATIONS ===
    try {
      if (window.ORT_TRIP_DATA) {
        // Résas voyage (vols, assurance, etc.)
        const travelBookings = ORT_TRIP_DATA.getTravelBookings() || [];
        enriched.travelBookings = travelBookings;
        console.log(`[CARNET] ${travelBookings.length} réservations voyage`);
        
        // Résas par étape (hôtels, activités) - dédupliquées
        const allStepBookings = new Map();
        enriched.steps.forEach((step, idx) => {
          const stepBookings = ORT_TRIP_DATA.getStepBookings(idx) || [];
          step.bookings = stepBookings;
          
          // Collecter pour dédupliquer (hôtels multi-nuits)
          stepBookings.forEach(b => {
            const bookingId = b.id || `${b.name}-${b.date_start || ''}-${b.category}`;
            if (!allStepBookings.has(bookingId)) {
              allStepBookings.set(bookingId, {
                booking: b,
                steps: [idx],
                firstStepIndex: idx
              });
            } else {
              const existing = allStepBookings.get(bookingId);
              if (!existing.steps.includes(idx)) {
                existing.steps.push(idx);
              }
            }
          });
        });
        
        // Stocker les bookings dédupliqués avec leur info multi-step
        enriched.stepBookingsMap = Object.fromEntries(allStepBookings);
        console.log(`[CARNET] ${allStepBookings.size} réservations étapes (dédupliquées)`);
        
        // Calculer budget total
        let totalBudget = 0;
        travelBookings.forEach(b => {
          const p = b.price ? (typeof b.price === 'object' ? b.price.amount : b.price) : 0;
          totalBudget += parseFloat(p) || 0;
        });
        allStepBookings.forEach((data) => {
          const p = data.booking.price ? (typeof data.booking.price === 'object' ? data.booking.price.amount : data.booking.price) : 0;
          totalBudget += parseFloat(p) || 0;
        });
        enriched.totalBudget = totalBudget;
        console.log(`[CARNET] Budget total: ${totalBudget}€`);
      }
    } catch (e) {
      console.warn('[CARNET] Erreur collecte bookings:', e);
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
    VERSION: '6.2 (Editor + Format Enrichi)'
  };
  
  // Alias pour compatibilité
  window.ORT_CARNET = window.ORT_PDF;
  
  console.log('[CARNET] ✅ Module Carnet v6.2 chargé (support format enrichi)');
  
})(window);
