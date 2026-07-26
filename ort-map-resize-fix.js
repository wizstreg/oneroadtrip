/**
 * ORT Map Resize Fix - Patch pour roadtrip_detail.html
 * Corrige le problème de redimensionnement de la carte en sortie de plein écran
 */

(function() {
  'use strict';
  
  console.log('[MAP RESIZE] Patch chargé');

  // ========== FONCTION DE REDIMENSIONNEMENT ==========
  
  /**
   * Recalcule les bounds de l'itinéraire
   */
  function getRoutesBounds() {
    if (!window.state?.steps || window.state.steps.length === 0) {
      return null;
    }
    
    const coords = window.state.steps
      .filter(s => s.lat && s.lon)
      .map(s => [s.lat, s.lon]);
    
    if (coords.length === 0) return null;
    
    return L.latLngBounds(coords);
  }
  
  /**
   * Recentre la carte sur l'itinéraire
   */
  function recenterMap() {
    if (!window.map) return;
    
    const bounds = getRoutesBounds();
    if (!bounds) {
      console.log('[MAP RESIZE] ⚠️ Pas de coordonnées pour recentrer');
      return;
    }
    
    // Recentrer avec animation
    window.map.fitBounds(bounds, {
      padding: [50, 50],
      animate: true,
      duration: 0.5
    });
    
    console.log('[MAP RESIZE] ✅ Carte recentrée sur l\'itinéraire');
  }
  
  function forceMapResize() {
    console.log('[MAP RESIZE] Forçage du redimensionnement...');
    
    // Méthode 1: Leaflet invalidateSize
    if (window.map && typeof window.map.invalidateSize === 'function') {
      // Attendre un peu pour que les transitions CSS se terminent
      setTimeout(() => {
        window.map.invalidateSize({ animate: true, pan: false });
        console.log('[MAP RESIZE] ✅ invalidateSize() appelé');
      }, 100);
      
      // Double appel après les transitions + recentrage
      setTimeout(() => {
        window.map.invalidateSize({ animate: false, pan: false });
        console.log('[MAP RESIZE] ✅ invalidateSize() rappelé (post-transition)');
        
        // Recentrer sur l'itinéraire
        recenterMap();
      }, 400);
    }
    
    // Méthode 2: Forcer un reflow du container
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
      const display = mapContainer.style.display;
      mapContainer.style.display = 'none';
      mapContainer.offsetHeight; // Force reflow
      mapContainer.style.display = display;
      console.log('[MAP RESIZE] ✅ Reflow forcé');
    }
  }

  // ========== HOOK DANS LA FONCTION DE SORTIE DU PLEIN ÉCRAN ==========
  
  /**
   * Hook la fonction qui gère la sortie du plein écran
   */
  function hookFullscreenExit() {
    // Méthode 1: Hook sur toggleMapFullscreen si elle existe
    if (typeof window.toggleMapFullscreen === 'function') {
      const original = window.toggleMapFullscreen;
      window.toggleMapFullscreen = function(...args) {
        const result = original.apply(this, args);
        
        // Si on sort du plein écran
        if (!document.body.classList.contains('view-map-only')) {
          console.log('[MAP RESIZE] Sortie du plein écran détectée');
          forceMapResize();
        }
        
        return result;
      };
      console.log('[MAP RESIZE] ✅ Hook sur toggleMapFullscreen');
    }
    
    // Méthode 2: Observer les changements de classe sur body
    const bodyObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const hadFullscreen = mutation.oldValue?.includes('view-map-only');
          const hasFullscreen = document.body.classList.contains('view-map-only');
          
          // Si on vient de sortir du plein écran
          if (hadFullscreen && !hasFullscreen) {
            console.log('[MAP RESIZE] Sortie du plein écran détectée (observer)');
            forceMapResize();
          }
        }
      });
    });
    
    bodyObserver.observe(document.body, {
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ['class']
    });
    console.log('[MAP RESIZE] ✅ Observer sur body.class');
  }

  // ========== HOOK SUR LES BOUTONS DE FERMETURE ==========
  
  /**
   * Ajoute des listeners sur les boutons qui ferment le plein écran
   */
  function hookCloseButtons() {
    // Boutons potentiels (adapter selon ton HTML)
    const selectors = [
      '.btn-exit-fullscreen',
      '.fullscreen-close',
      '[data-action="exit-fullscreen"]',
      '.btn-close-map'
    ];
    
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(btn => {
        btn.addEventListener('click', () => {
          console.log('[MAP RESIZE] Clic sur bouton de fermeture détecté');
          setTimeout(forceMapResize, 150);
        });
      });
    });
  }

  // ========== HOOK SUR LE TOGGLE LAYOUT (side/stack) ==========
  
  /**
   * Hook le toggle de layout qui peut aussi nécessiter un resize
   */
  function hookLayoutToggle() {
    const layoutToggle = document.getElementById('layoutToggle');
    if (layoutToggle) {
      layoutToggle.addEventListener('click', () => {
        console.log('[MAP RESIZE] Toggle layout détecté');
        setTimeout(forceMapResize, 150);
      });
      console.log('[MAP RESIZE] ✅ Hook sur layoutToggle');
    }
  }

  // ========== DETECTION DE CHANGEMENT DE TAILLE DE FENÊTRE ==========
  
  /**
   * Redimensionne la carte quand la fenêtre change de taille
   */
  function hookWindowResize() {
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        console.log('[MAP RESIZE] Window resize détecté');
        forceMapResize();
      }, 200);
    });
    console.log('[MAP RESIZE] ✅ Hook sur window.resize');
  }

  // ========== DETECTION NATIVE FULLSCREEN API ==========
  
  /**
   * Hook sur l'API Fullscreen native du browser
   */
  function hookNativeFullscreen() {
    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement) {
        console.log('[MAP RESIZE] Sortie du fullscreen natif détectée');
        setTimeout(forceMapResize, 150);
      }
    });
    console.log('[MAP RESIZE] ✅ Hook sur fullscreenchange');
  }

  // ========== EXPOSE FONCTIONS PUBLIQUES ==========
  
  window.forceMapResize = forceMapResize;
  window.recenterMap = recenterMap;

  // ========== INITIALISATION ==========
  
  function init() {
    // Attendre que le DOM soit prêt
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }
    
    // Attendre que la carte soit initialisée
    if (!window.map) {
      setTimeout(init, 500);
      return;
    }
    
    console.log('[MAP RESIZE] Initialisation des hooks...');
    
    hookFullscreenExit();
    hookCloseButtons();
    hookLayoutToggle();
    hookWindowResize();
    hookNativeFullscreen();
    
    console.log('[MAP RESIZE] ✅ Patch activé');
  }

  // Démarrer
  init();
})();