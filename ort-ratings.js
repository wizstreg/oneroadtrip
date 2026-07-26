/**
 * ORT Ratings Module - Système d'affichage des notes
 * À injecter dans roadtrip_detail.html via <script src="ort-ratings.js"></script>
 */

(function() {
  'use strict';
  
  // ========== CONFIGURATION ==========
  const RATING_CONFIG = {
    excellent: { min: 9, color: '#22c55e', bg: '#22c55e15', label: 'Exceptionnel' },
    veryGood: { min: 7, color: '#84cc16', bg: '#84cc1615', label: 'Très bien' },
    good: { min: 5, color: '#f59e0b', bg: '#f59e0b15', label: 'Bien' },
    average: { min: 3, color: '#fb923c', bg: '#fb923c15', label: 'Moyen' },
    low: { min: 0, color: '#94a3b8', bg: '#94a3b815', label: 'Non noté' }
  };

  // ========== INJECTION CSS ==========
  function injectStyles() {
    if (document.getElementById('ort-ratings-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'ort-ratings-styles';
    style.textContent = `
      /* Rating badges */
      .rating-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 10px;
        border-radius: 6px;
        font-weight: 700;
        font-size: 0.85rem;
        vertical-align: middle;
        white-space: nowrap;
      }
      
      .rating-badge.excellent { background: ${RATING_CONFIG.excellent.color}; color: #fff; }
      .rating-badge.very-good { background: ${RATING_CONFIG.veryGood.color}; color: #fff; }
      .rating-badge.good { background: ${RATING_CONFIG.good.color}; color: #fff; }
      .rating-badge.average { background: ${RATING_CONFIG.average.color}; color: #fff; }
      .rating-badge.low { background: ${RATING_CONFIG.low.color}; color: #fff; }
      
      /* Background coloré pour les noms de ville */
      .step-name-with-rating {
        padding: 4px 8px;
        border-radius: 6px;
        display: inline-block;
        transition: all 0.2s;
      }
      
      .step-name-with-rating.excellent { background: ${RATING_CONFIG.excellent.bg}; }
      .step-name-with-rating.very-good { background: ${RATING_CONFIG.veryGood.bg}; }
      .step-name-with-rating.good { background: ${RATING_CONFIG.good.bg}; }
      .step-name-with-rating.average { background: ${RATING_CONFIG.average.bg}; }
      .step-name-with-rating.low { background: ${RATING_CONFIG.low.bg}; }
      
      /* Marqueurs carte colorés selon rating */
      .step-marker.rating-excellent { background: ${RATING_CONFIG.excellent.color} !important; }
      .step-marker.rating-very-good { background: ${RATING_CONFIG.veryGood.color} !important; }
      .step-marker.rating-good { background: ${RATING_CONFIG.good.color} !important; }
      .step-marker.rating-average { background: ${RATING_CONFIG.average.color} !important; }
      .step-marker.rating-low { background: ${RATING_CONFIG.low.color} !important; }
    `;
    
    document.head.appendChild(style);
  }

  // ========== HELPERS ==========
  
  /**
   * Obtient la classe CSS selon le rating
   */
  function getRatingClass(rating) {
    if (!rating || rating === 0) return 'low';
    if (rating >= RATING_CONFIG.excellent.min) return 'excellent';
    if (rating >= RATING_CONFIG.veryGood.min) return 'very-good';
    if (rating >= RATING_CONFIG.good.min) return 'good';
    if (rating >= RATING_CONFIG.average.min) return 'average';
    return 'low';
  }

  /**
   * Crée le badge HTML pour afficher le rating
   */
  function createRatingBadge(rating, options = {}) {
    const { showIcon = true, showLabel = false } = options;
    
    if (!rating || rating === 0) {
      return '<span class="rating-badge low">—</span>';
    }
    
    const ratingClass = getRatingClass(rating);
    const displayRating = rating.toFixed(1);
    const icon = showIcon ? '⭐' : '';
    const label = showLabel ? ` ${RATING_CONFIG[ratingClass.replace('-', '')]?.label}` : '';
    
    return `<span class="rating-badge ${ratingClass}">${icon} ${displayRating}/10${label}</span>`;
  }

  /**
   * Obtient le rating d'une place
   */
  function getPlaceRating(step) {
    // Priorité 1: rating direct sur le step
    if (step?.rating && step.rating > 0) {
      return step.rating;
    }
    
    // Priorité 2: chercher dans window.allPlaces
    const placeId = step?.place_id;
    if (!placeId) return 0;
    
    if (window.allPlaces) {
      const place = window.allPlaces.find(p => p.place_id === placeId);
      if (place?.rating) return place.rating;
    }
    
    // Priorité 3: chercher dans window.state.allPlaces
    if (window.state?.allPlaces) {
      const place = window.state.allPlaces.find(p => p.place_id === placeId);
      if (place?.rating) return place.rating;
    }
    
    return 0;
  }

  // ========== ENRICHISSEMENT DOM ==========
  
  /**
   * Ajoute le rating à un élément step dans la liste
   */
  function enrichStepElement(stepElement, step) {
    const rating = getPlaceRating(step);
    if (rating === 0) return;
    
    const ratingClass = getRatingClass(rating);
    const badge = createRatingBadge(rating);
    
    // Trouver le lien du nom de la ville
    const nameLink = stepElement.querySelector('.step-name-link');
    if (nameLink) {
      // Wrapper le texte existant avec le fond coloré
      const textNode = nameLink.childNodes[0];
      if (textNode && textNode.nodeType === Node.TEXT_NODE) {
        const span = document.createElement('span');
        span.className = `step-name-with-rating ${ratingClass}`;
        span.textContent = textNode.textContent;
        nameLink.replaceChild(span, textNode);
      }
      
      // Ajouter le badge après le nom
      nameLink.insertAdjacentHTML('beforeend', ' ' + badge);
    }
  }

  /**
   * Ajoute le rating dans le popup
   */
  function enrichPopup(popupElement, step) {
    const rating = getPlaceRating(step);
    const titleElement = popupElement.querySelector('#popupTitle, .popup-title');
    
    if (titleElement && !titleElement.querySelector('.rating-badge')) {
      const badge = createRatingBadge(rating);
      titleElement.insertAdjacentHTML('beforeend', ' ' + badge);
    }
  }

  /**
   * Colore les marqueurs sur la carte selon le rating
   */
  function colorizeMarkers() {
    if (!window.state?.steps) return;
    
    // Attendre que Leaflet soit chargé
    if (typeof L === 'undefined') {
      setTimeout(colorizeMarkers, 500);
      return;
    }
    
    // Trouver tous les marqueurs step-marker
    document.querySelectorAll('.step-marker').forEach((marker, idx) => {
      const step = window.state.steps[idx];
      if (!step) return;
      
      const rating = getPlaceRating(step);
      const ratingClass = getRatingClass(rating);
      
      // Ajouter la classe de couleur
      marker.classList.add(`rating-${ratingClass}`);
    });
  }

  // ========== OBSERVERS ==========
  
  /**
   * Observe les changements dans la liste des steps
   */
  function observeStepsList() {
    const stepsList = document.querySelector('#stepsListContainer, .steps-list');
    if (!stepsList) {
      setTimeout(observeStepsList, 500);
      return;
    }
    
    // Observer initial
    enrichAllSteps();
    
    // Observer les mutations
    const observer = new MutationObserver(() => {
      enrichAllSteps();
    });
    
    observer.observe(stepsList, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Enrichit tous les steps visibles
   */
  function enrichAllSteps() {
    if (!window.state?.steps) return;
    
    document.querySelectorAll('.step-card, .step-item').forEach((element, idx) => {
      const step = window.state.steps[idx];
      if (step && !element.dataset.ratingEnriched) {
        enrichStepElement(element, step);
        element.dataset.ratingEnriched = 'true';
      }
    });
  }

  /**
   * Observe l'ouverture du popup
   */
  function observePopup() {
    const popupObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.classList?.contains('map-popup') || 
              node.querySelector?.('.map-popup')) {
            const popup = node.classList?.contains('map-popup') ? node : node.querySelector('.map-popup');
            
            // Trouver le step correspondant
            const stepIndex = parseInt(popup.dataset.step || '0');
            const step = window.state?.steps?.[stepIndex];
            
            if (step) {
              enrichPopup(popup, step);
            }
          }
        });
      });
    });
    
    popupObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // ========== HOOKS DANS LES FONCTIONS EXISTANTES ==========
  
  /**
   * Hook dans openPopupForStep (si elle existe)
   */
  function hookPopupFunction() {
    if (typeof window.openPopupForStep === 'function') {
      const original = window.openPopupForStep;
      window.openPopupForStep = function(...args) {
        const result = original.apply(this, args);
        
        // Enrichir après ouverture
        setTimeout(() => {
          const popup = document.querySelector('.map-popup.show');
          if (popup && args[0]) {
            enrichPopup(popup, args[0]);
          }
        }, 50);
        
        return result;
      };
    }
  }

  /**
   * Hook dans drawMarkers (si elle existe)
   */
  function hookMarkersFunction() {
    if (typeof window.drawMarkers === 'function') {
      const original = window.drawMarkers;
      window.drawMarkers = function(...args) {
        const result = original.apply(this, args);
        
        // Coloriser après dessin
        setTimeout(colorizeMarkers, 100);
        
        return result;
      };
    }
  }

  // ========== INITIALISATION ==========
  
  function init() {
    console.log('[ORT Ratings] Initialisation...');
    
    // Injecter les styles
    injectStyles();
    
    // Attendre que le DOM soit prêt
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }
    
    // Attendre que window.state soit disponible
    if (!window.state) {
      setTimeout(init, 500);
      return;
    }
    
    // Lancer les observers
    observeStepsList();
    observePopup();
    
    // Hook dans les fonctions existantes
    hookPopupFunction();
    hookMarkersFunction();
    
    // Coloriser les marqueurs existants
    setTimeout(colorizeMarkers, 1000);
    
    console.log('[ORT Ratings] ✅ Module activé');
  }

  // Exposer les fonctions publiques
  window.ORTRatings = {
    getRatingClass,
    createRatingBadge,
    getPlaceRating,
    enrichStepElement,
    enrichPopup,
    colorizeMarkers,
    refresh: () => {
      enrichAllSteps();
      colorizeMarkers();
    }
  };

  // Démarrer
  init();
})();
