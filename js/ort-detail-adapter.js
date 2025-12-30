/**
 * =====================================================
 * ADAPTATEUR STATE MANAGER - ROADTRIP DETAIL
 * =====================================================
 * 
 * Intègre le State Manager dans roadtrip_detail.html
 * Détecte et sauvegarde automatiquement les modifications
 * 
 * @version 1.0.0
 * @date 2025-11-03
 */

(function() {
  'use strict';

  // ===== ÉTAT LOCAL =====
  let currentTripId = null;
  let originalTripData = null;
  let watchersInitialized = false;
  let isSaving = false; // Flag pour ignorer les modifications pendant la sauvegarde

  // ===== INITIALISATION =====
  
  /**
   * Initialise l'adaptateur pour un voyage
   * @param {string} tripId - ID du voyage
   * @param {Object} tripData - Données du voyage
   */
  function init(tripId, tripData) {
    currentTripId = tripId;
    originalTripData = JSON.parse(JSON.stringify(tripData)); // Deep clone

    console.log('🎯 [DETAIL] Adaptateur initialisé pour:', tripId);

    // Initialise les watchers de modifications
    if (!watchersInitialized) {
      setupWatchers();
      watchersInitialized = true;
    }

    // Écoute les événements de sauvegarde
    setupSaveListeners();
  }

  // ===== DÉTECTION DES MODIFICATIONS =====

  /**
   * Configure les observateurs de modifications
   */
  function setupWatchers() {
    console.log('👀 [DETAIL] Configuration des watchers...');
    
    // Observer les inputs du formulaire principal
    watchFormInputs();
    
    // Observer les modifications d'étapes
    watchStepChanges();
    
    // Observer les changements de carte
    watchMapChanges();
    
    // Observer les modifications de titre/description
    watchMetadataChanges();

    console.log('✅ [DETAIL] Watchers configurés');
  }

  /**
   * Observe les inputs de formulaire
   */
  function watchFormInputs() {
    document.addEventListener('input', (e) => {
      // Ignore pendant la sauvegarde
      if (isSaving) return;
      
      const target = e.target;
      
      // Ignore les champs non pertinents
      if (!target.matches('input, textarea, select') || 
          target.hasAttribute('data-no-save')) {
        return;
      }
      
      // Ignore les inputs dans les modals/popups (PDF, etc.)
      if (target.closest('.modal, .popup, [role="dialog"], #pdfModal, .pdf-options')) {
        return;
      }
      
      // Ignore les inputs dont le name commence par "pdf" ou "modal"
      const fieldName = target.name || target.id;
      if (fieldName && (fieldName.startsWith('pdf') || fieldName.startsWith('modal'))) {
        return;
      }
      const value = target.value;

      if (fieldName && currentTripId) {
        console.log('📝 [DETAIL] Input modifié:', fieldName, '=', value);
        
        window.ORT_STATE.markAsModified(currentTripId, 'form', {
          [fieldName]: value
        });
      }
    });

    console.log('✅ [DETAIL] Watcher inputs configuré');
  }

  /**
   * Observe les changements d'étapes (ajout, suppression, réordonnancement)
   */
  function watchStepChanges() {
    // Écoute les événements personnalisés des étapes
    document.addEventListener('ort:step-added', (e) => {
      if (isSaving) return; // Ignore pendant la sauvegarde
      console.log('➕ [DETAIL] Étape ajoutée:', e.detail);
      if (currentTripId) {
        window.ORT_STATE.markAsModified(currentTripId, 'steps', {
          steps: e.detail.steps
        });
      }
    });

    document.addEventListener('ort:step-removed', (e) => {
      if (isSaving) return; // Ignore pendant la sauvegarde
      console.log('➖ [DETAIL] Étape supprimée:', e.detail);
      if (currentTripId) {
        window.ORT_STATE.markAsModified(currentTripId, 'steps', {
          steps: e.detail.steps
        });
      }
    });

    document.addEventListener('ort:step-reordered', (e) => {
      if (isSaving) return; // Ignore pendant la sauvegarde
      console.log('🔀 [DETAIL] Étapes réordonnées:', e.detail);
      if (currentTripId) {
        window.ORT_STATE.markAsModified(currentTripId, 'steps', {
          steps: e.detail.steps
        });
      }
    });

    document.addEventListener('ort:step-updated', (e) => {
      if (isSaving) return; // Ignore pendant la sauvegarde
      console.log('✏️ [DETAIL] Étape modifiée:', e.detail);
      if (currentTripId) {
        window.ORT_STATE.markAsModified(currentTripId, 'steps', {
          steps: e.detail.steps
        });
      }
    });

    console.log('✅ [DETAIL] Watcher steps configuré');
  }

  /**
   * Observe les modifications de carte (drag markers, etc.)
   */
  function watchMapChanges() {
    document.addEventListener('ort:map-marker-moved', (e) => {
      if (isSaving) return; // Ignore pendant la sauvegarde
      console.log('📍 [DETAIL] Marker déplacé:', e.detail);
      if (currentTripId) {
        window.ORT_STATE.markAsModified(currentTripId, 'map', {
          [`step_${e.detail.stepIndex}_coords`]: e.detail.coords
        });
      }
    });

    document.addEventListener('ort:map-route-changed', (e) => {
      if (isSaving) return; // Ignore pendant la sauvegarde
      console.log('🗺️ [DETAIL] Route modifiée:', e.detail);
      if (currentTripId) {
        window.ORT_STATE.markAsModified(currentTripId, 'route', {
          route: e.detail.route
        });
      }
    });

    console.log('✅ [DETAIL] Watcher carte configuré');
  }

  /**
   * Observe les modifications de métadonnées (titre, description, etc.)
   */
  function watchMetadataChanges() {
    // Observe le titre avec contenteditable
    const titleObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'characterData' || mutation.type === 'childList') {
          const titleEl = document.querySelector('[data-trip-title], h1.trip-title, [contenteditable="true"]');
          if (titleEl && currentTripId && titleEl.textContent !== originalTripData?.title) {
            const newTitle = titleEl.textContent || titleEl.value;
            console.log('📝 [DETAIL] Titre modifié:', newTitle);
            window.ORT_STATE.markAsModified(currentTripId, 'metadata', {
              title: newTitle
            });
          }
        }
      });
    });

    // Observer l'élément titre si il existe
    setTimeout(() => {
      const titleEl = document.querySelector('[data-trip-title], h1.trip-title, [contenteditable="true"]');
      if (titleEl) {
        titleObserver.observe(titleEl, {
          characterData: true,
          childList: true,
          subtree: true
        });
        console.log('✅ [DETAIL] Watcher titre configuré');
      }
    }, 1000); // Attend que le DOM soit chargé
  }

  // ===== SAUVEGARDE =====

  /**
   * Configure les listeners de sauvegarde
   */
  function setupSaveListeners() {
    // Bouton sauvegarde explicite
    const saveBtns = [
      document.getElementById('btnSave'),
      document.querySelector('[data-action="save"]'),
      document.querySelector('.btn-save'),
      document.querySelector('button[onclick*="save"]')
    ];
    
    saveBtns.forEach(btn => {
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          saveCurrent(true); // Sauvegarde explicite = marquer comme saved pour le dashboard
        });
        console.log('✅ [DETAIL] Bouton sauvegarde lié');
      }
    });

    // Sauvegarde automatique au changement de focus (perte de focus de la page)
    window.addEventListener('blur', () => {
      if (currentTripId && window.ORT_STATE.hasPendingChanges(currentTripId)) {
        console.log('💾 [DETAIL] Auto-save (blur)');
        window.ORT_STATE.forceSave(currentTripId);
      }
    });

    // Écoute l'événement de sauvegarde personnalisé
    document.addEventListener('ort:save-trip', (e) => {
      // Si l'event contient markAsSaved, l'utiliser, sinon true par défaut (sauvegarde explicite)
      const markAsSaved = e.detail?.markAsSaved !== undefined ? e.detail.markAsSaved : true;
      saveCurrent(markAsSaved);
    });

    console.log('✅ [DETAIL] Listeners de sauvegarde configurés');
  }

  /**
   * Sauvegarde le voyage actuel
   * @param {boolean} markAsSaved - Si true, marque le voyage comme explicitement sauvegardé
   */
  async function saveCurrent(markAsSaved = false) {
    if (!currentTripId) {
      console.warn('[DETAIL] Pas de tripId pour sauvegarder');
      showToast('Erreur : voyage non identifie', 'error');
      return false;
    }

    // Évite les sauvegardes en parallèle et les modifications pendant la sauvegarde
    if (isSaving) {
      console.log('[DETAIL] Sauvegarde déjà en cours, ignoré');
      return false;
    }
    
    isSaving = true;
    console.log('[DETAIL] Sauvegarde du voyage:', currentTripId);
    showToast('Sauvegarde en cours...', 'info');

    try {
      // Collecte toutes les données actuelles
      const tripData = await collectCurrentData();
      
      // Ajoute le flag saved si demandé
      if (markAsSaved) {
        tripData.saved = true;
        console.log('[DETAIL] Voyage marque comme sauvegarde');
      }
      
      // Sauvegarde via State Manager
      const saved = await window.ORT_STATE.saveTrip({
        id: currentTripId,
        ...tripData
      });

      if (saved) {
        console.log('✅ [DETAIL] Voyage sauvegardé avec succès');
        showSaveConfirmation();
        
        // Met à jour la référence originale
        originalTripData = JSON.parse(JSON.stringify(tripData));
        
        // Dispatch event pour notifier les autres modules
        document.dispatchEvent(new CustomEvent('ort:trip-saved', {
          detail: { tripId: currentTripId }
        }));
        
        isSaving = false;
        return true;
      } else {
        console.error('❌ [DETAIL] Erreur lors de la sauvegarde');
        showSaveError();
        isSaving = false;
        return false;
      }
    } catch (error) {
      console.error('❌ [DETAIL] Exception lors de la sauvegarde:', error);
      showSaveError();
      isSaving = false;
      return false;
    }
  }

  /**
   * Collecte toutes les données du voyage depuis le DOM
   */
  async function collectCurrentData() {
    console.log('[DETAIL] Collection des donnees...');
    
    const data = {
      updatedAt: Date.now()
    };

    // Priorite 1 : window.state (contient tout)
    if (window.state) {
      console.log('[DETAIL] Collection depuis window.state');
      
      data.title = window.state.title || 'Sans titre';
      data.country = window.state.cc || window.state.country || 'XX';
      data.steps = window.state.steps || [];
      data.nights = window.state.targetNights || data.steps.length;
      
      // Calcul distance
      data.kms = data.steps.reduce((sum, s) => sum + (parseInt(s.dist) || 0), 0);
      
      // Autres donnees
      data.pace = window.state.pace;
      data.rhythm = window.state.rhythm;
      data.distanceUnit = window.state.distanceUnit;
      
      console.log('  OK Titre:', data.title);
      console.log('  OK Country:', data.country);
      console.log('  OK Steps:', data.steps.length);
      console.log('  OK Nights:', data.nights);
      console.log('  OK Kms:', data.kms);
      
      // Reference itineraire de base
      if (window.state._itinRef) {
        data.baseItinerary = window.state._itinRef;
      }
      
      // 🌐 Métadonnées source pour "Écrire source"
      if (window.state._sourceLanguage) {
        data._sourceLanguage = window.state._sourceLanguage;
        console.log('  ✅ OK Langue source:', data._sourceLanguage);
      }
      if (window.state._originalItinId) {
        data._originalItinId = window.state._originalItinId;
        console.log('  ✅ OK Itin ID:', data._originalItinId);
      }
      if (window.state._originalSourceUrl) {
        data._originalSourceUrl = window.state._originalSourceUrl;
      }
      if (window.state._originalCreatedAt) {
        data._originalCreatedAt = window.state._originalCreatedAt;
      }
      
      // 🔗 GROUPES D'ÉTAPES (V7)
      if (window.state._stepGroups && Object.keys(window.state._stepGroups).length > 0) {
        data._stepGroups = window.state._stepGroups;
        console.log('  ✅ OK Groupes:', Object.keys(data._stepGroups).length);
      } else {
        console.log('  ℹ️ Pas de groupes à sauvegarder');
      }
    } else {
      console.warn('[DETAIL] window.state non disponible!');
    }

    console.log('[DETAIL] Donnees collectees:', Object.keys(data));
    return data;
  }

  /**
   * Collecte les étapes depuis le DOM
   */
  function collectStepsFromDOM(container) {
    const steps = [];
    const stepElements = container.querySelectorAll('[data-step], .step-item, .step-row');
    
    console.log(`  📋 [DETAIL] Collection de ${stepElements.length} étape(s)...`);
    
    stepElements.forEach((el, index) => {
      const step = {
        index: index
      };

      // Titre/Nom
      const titleEl = el.querySelector('[data-step-title], .step-title, .step-name, input[name*="title"]');
      if (titleEl) {
        step.title = titleEl.textContent || titleEl.value || '';
      }

      // Lieu
      const placeEl = el.querySelector('[data-step-place], .step-place, input[name*="place"]');
      if (placeEl) {
        step.place = placeEl.textContent || placeEl.value || '';
      }

      // Nuits
      const nightsEl = el.querySelector('[data-step-nights], input[name*="nights"], .step-nights');
      if (nightsEl) {
        step.nights = parseInt(nightsEl.value || nightsEl.textContent || nightsEl.dataset.nights || '1');
      }

      // Distance
      const distEl = el.querySelector('[data-step-distance], .step-distance, input[name*="distance"]');
      if (distEl) {
        step.distance = parseInt(distEl.value || distEl.textContent || '0');
      }

      // Coordonnées
      const lat = el.dataset.lat || el.querySelector('[data-lat]')?.dataset.lat;
      const lng = el.dataset.lng || el.querySelector('[data-lng]')?.dataset.lng;
      if (lat && lng) {
        step.coords = [parseFloat(lat), parseFloat(lng)];
      }

      // Hôtel
      const hotelEl = el.querySelector('[data-step-hotel], .step-hotel, input[name*="hotel"]');
      if (hotelEl) {
        step.hotel = hotelEl.textContent || hotelEl.value || '';
      }

      steps.push(step);
    });

    return steps;
  }

  // ===== FEEDBACK UTILISATEUR =====

  /**
   * Affiche une confirmation de sauvegarde
   */
  function showSaveConfirmation() {
    showToast('✅ Voyage sauvegardé', 'success');
    
    // Masque l'indicateur de modifications non sauvegardées
    const indicator = document.getElementById('unsaved-indicator');
    if (indicator) {
      indicator.style.display = 'none';
    }
  }

  /**
   * Affiche une erreur de sauvegarde
   */
  function showSaveError() {
    showToast('❌ Erreur sauvegarde', 'error');
  }

  /**
   * Affiche un toast
   */
  function showToast(message, type = 'info') {
    // Cherche une fonction toast existante
    if (typeof window.showToast === 'function') {
      window.showToast(message, type);
      return;
    }

    if (typeof window.toast === 'function') {
      window.toast(message);
      return;
    }

    // Crée un toast simple
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${type === 'error' ? '#cb2b2b' : type === 'success' ? '#2d9f3d' : '#113f7a'};
      color: #fff;
      padding: 12px 24px;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 10000;
      font-weight: 600;
      font-size: 14px;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, type === 'info' ? 1500 : 3000);
  }

  // ===== INDICATEUR MODIFICATIONS =====

  function updateUnsavedIndicator() {
    if (!currentTripId) return;

    const hasChanges = window.ORT_STATE.hasPendingChanges(currentTripId);
    
    let indicator = document.getElementById('unsaved-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'unsaved-indicator';
      indicator.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: #ffc107;
        color: #000;
        padding: 10px 16px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 3px 10px rgba(0,0,0,0.2);
        z-index: 1000;
        display: none;
      `;
      indicator.textContent = '⚠️ Modifications non sauvegardées';
      document.body.appendChild(indicator);
    }

    indicator.style.display = hasChanges ? 'block' : 'none';
  }

  setInterval(() => {
    if (currentTripId) updateUnsavedIndicator();
  }, 1000);

  // ===== AVERTISSEMENT AVANT DÉPART =====

  window.addEventListener('beforeunload', (e) => {
    if (currentTripId && window.ORT_STATE.hasPendingChanges(currentTripId)) {
      e.preventDefault();
      e.returnValue = 'Modifications non sauvegardées. Quitter ?';
      return e.returnValue;
    }
  });

  // ===== API PUBLIQUE =====
  window.ORT_DETAIL_ADAPTER = {
    init,
    saveCurrent,
    collectCurrentData,
    hasPendingChanges: () => {
      return currentTripId ? window.ORT_STATE.hasPendingChanges(currentTripId) : false;
    }
  };

  console.log('✅ [DETAIL] Adaptateur State Manager chargé');

})();