/**
 * ORT Storage - Module centralisé de gestion localStorage
 * Gère les trips temporaires avec nettoyage automatique
 * 
 * Usage:
 *   ORT_STORAGE.saveTempTrip('FR_custom_123', { itins, places, config });
 *   const trip = ORT_STORAGE.getTempTrip('FR_custom_123');
 *   ORT_STORAGE.cleanOldTempTrips(); // Auto-appelé au chargement
 */

const ORT_STORAGE = {
  // Préfixes standardisés
  PREFIX: 'ORT_',
  TEMP_PREFIX: 'ORT_TEMP_TRIP_',
  KEYS_REGISTRY: 'ORT_TEMP_KEYS',
  
  // Durée de vie des trips temporaires (24h)
  MAX_AGE_MS: 24 * 60 * 60 * 1000,
  
  /**
   * Sauvegarde un trip temporaire
   * @param {string} key - Clé unique (ex: 'FR_custom_1704067200000')
   * @param {Object} data - { itins, places, config }
   */
  saveTempTrip(key, { itins, places, config }) {
    const fullKey = this.TEMP_PREFIX + key;
    
    try {
      if (itins) {
        localStorage.setItem(fullKey + '_itins', JSON.stringify(itins));
      }
      if (places) {
        localStorage.setItem(fullKey + '_places', JSON.stringify(places));
      }
      if (config) {
        localStorage.setItem(fullKey + '_config', JSON.stringify(config));
      }
      
      // Enregistrer le timestamp pour le nettoyage
      this._registerTempKey(fullKey);
      
      console.log(`[ORT_STORAGE] Trip saved: ${key}`);
      return true;
    } catch (e) {
      console.error('[ORT_STORAGE] Error saving trip:', e);
      return false;
    }
  },
  
  /**
   * Récupère un trip temporaire
   * @param {string} key - Clé unique
   * @returns {Object|null} { itins, places, config } ou null si non trouvé
   */
  getTempTrip(key) {
    const fullKey = this.TEMP_PREFIX + key;
    
    try {
      const itinsStr = localStorage.getItem(fullKey + '_itins');
      const placesStr = localStorage.getItem(fullKey + '_places');
      const configStr = localStorage.getItem(fullKey + '_config');
      
      if (!itinsStr && !placesStr) {
        return null;
      }
      
      return {
        itins: itinsStr ? JSON.parse(itinsStr) : null,
        places: placesStr ? JSON.parse(placesStr) : null,
        config: configStr ? JSON.parse(configStr) : null
      };
    } catch (e) {
      console.error('[ORT_STORAGE] Error loading trip:', e);
      return null;
    }
  },
  
  /**
   * Supprime un trip temporaire
   * @param {string} key - Clé unique
   */
  deleteTempTrip(key) {
    const fullKey = this.TEMP_PREFIX + key;
    
    localStorage.removeItem(fullKey + '_itins');
    localStorage.removeItem(fullKey + '_places');
    localStorage.removeItem(fullKey + '_config');
    
    // Retirer du registre
    this._unregisterTempKey(fullKey);
    
    console.log(`[ORT_STORAGE] Trip deleted: ${key}`);
  },
  
  /**
   * Nettoie les trips temporaires > 24h
   * Appelé automatiquement au chargement
   */
  cleanOldTempTrips() {
    try {
      const keysStr = localStorage.getItem(this.KEYS_REGISTRY);
      if (!keysStr) return;
      
      const keys = JSON.parse(keysStr);
      const now = Date.now();
      let cleaned = 0;
      
      Object.entries(keys).forEach(([key, timestamp]) => {
        if (now - timestamp > this.MAX_AGE_MS) {
          localStorage.removeItem(key + '_itins');
          localStorage.removeItem(key + '_places');
          localStorage.removeItem(key + '_config');
          delete keys[key];
          cleaned++;
        }
      });
      
      localStorage.setItem(this.KEYS_REGISTRY, JSON.stringify(keys));
      
      if (cleaned > 0) {
        console.log(`[ORT_STORAGE] Cleaned ${cleaned} old temp trips`);
      }
    } catch (e) {
      console.error('[ORT_STORAGE] Error cleaning old trips:', e);
    }
  },
  
  /**
   * Enregistre une clé dans le registre avec timestamp
   * @private
   */
  _registerTempKey(fullKey) {
    try {
      const keysStr = localStorage.getItem(this.KEYS_REGISTRY);
      const keys = keysStr ? JSON.parse(keysStr) : {};
      keys[fullKey] = Date.now();
      localStorage.setItem(this.KEYS_REGISTRY, JSON.stringify(keys));
    } catch (e) {
      console.error('[ORT_STORAGE] Error registering key:', e);
    }
  },
  
  /**
   * Retire une clé du registre
   * @private
   */
  _unregisterTempKey(fullKey) {
    try {
      const keysStr = localStorage.getItem(this.KEYS_REGISTRY);
      if (!keysStr) return;
      
      const keys = JSON.parse(keysStr);
      delete keys[fullKey];
      localStorage.setItem(this.KEYS_REGISTRY, JSON.stringify(keys));
    } catch (e) {
      console.error('[ORT_STORAGE] Error unregistering key:', e);
    }
  },
  
  /**
   * Liste tous les trips temporaires actifs
   * @returns {Array} Liste des clés de trips
   */
  listTempTrips() {
    try {
      const keysStr = localStorage.getItem(this.KEYS_REGISTRY);
      if (!keysStr) return [];
      
      const keys = JSON.parse(keysStr);
      return Object.keys(keys).map(k => k.replace(this.TEMP_PREFIX, ''));
    } catch (e) {
      return [];
    }
  }
};

// Nettoyage automatique au chargement
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    ORT_STORAGE.cleanOldTempTrips();
  });
}

// Export pour Node.js (si utilisé dans scripts build)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ORT_STORAGE;
}
