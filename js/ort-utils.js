/**
 * ORT-UTILS.js
 * Fonctions utilitaires communes à tous les modules OneRoadTrip
 * 
 * Utilisé par : roadtrip_detail.html, roadtrip_detail_simple.html, roadtrip_mobile.html
 */

(function(global) {
  'use strict';

  const ORT_UTILS = {

    /**
     * Calcul de distance GPS (formule Haversine)
     * @param {number} lat1 - Latitude point 1
     * @param {number} lon1 - Longitude point 1
     * @param {number} lat2 - Latitude point 2
     * @param {number} lon2 - Longitude point 2
     * @returns {number} Distance en kilomètres
     */
    haversineDistance: function(lat1, lon1, lat2, lon2) {
      const R = 6371; // Rayon de la Terre en km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },

    /**
     * Convertit un texte en slug URL-safe
     * @param {string} name - Texte à convertir
     * @returns {string} Slug
     */
    toSlug: function(name) {
      if (!name) return '';
      return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
        .replace(/[^a-z0-9]+/g, '-')     // Remplace les caractères spéciaux par -
        .replace(/^-+|-+$/g, '');        // Supprime les - en début/fin
    },

    /**
     * Ajoute des jours à une date
     * @param {Date|string} d - Date de départ
     * @param {number} n - Nombre de jours à ajouter
     * @returns {Date} Nouvelle date
     */
    addDays: function(d, n) {
      const date = (d instanceof Date) ? new Date(d) : new Date(d);
      date.setDate(date.getDate() + n);
      return date;
    },

    /**
     * Formate une date en chaîne localisée courte
     * @param {Date|string} d - Date à formater
     * @param {string} [lang='fr'] - Code langue (fr, en, es, it, pt, ar)
     * @returns {string} Date formatée (ex: "15 janv.")
     */
    fmtD: function(d, lang) {
      if (!d) return '';
      const date = (d instanceof Date) ? d : new Date(d);
      if (isNaN(date.getTime())) return '';
      
      lang = lang || document.documentElement.lang || 'fr';
      const locale = {
        fr: 'fr-FR',
        en: 'en-US',
        es: 'es-ES',
        it: 'it-IT',
        pt: 'pt-PT',
        ar: 'ar-SA'
      }[lang] || 'fr-FR';

      return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
    },

    /**
     * Formate une date en ISO (YYYY-MM-DD)
     * @param {Date|string} d - Date à formater
     * @returns {string} Date au format ISO
     */
    formatDateISO: function(d) {
      if (!d) return '';
      const date = (d instanceof Date) ? d : new Date(d);
      if (isNaN(date.getTime())) return '';
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },

    /**
     * Parse JSON de manière sécurisée
     * @param {string} str - Chaîne JSON à parser
     * @param {*} [fallback=null] - Valeur par défaut si échec
     * @returns {*} Objet parsé ou fallback
     */
    safeJSONParse: function(str, fallback) {
      if (fallback === undefined) fallback = null;
      if (!str || typeof str !== 'string') return fallback;
      try {
        return JSON.parse(str);
      } catch (e) {
        console.warn('[ORT-UTILS] safeJSONParse failed:', e.message);
        return fallback;
      }
    },

    /**
     * Échappe les caractères HTML dangereux
     * @param {string} v - Valeur à échapper
     * @returns {string} Valeur échappée
     */
    safe: function(v) {
      if (v == null) return '';
      return String(v)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    /**
     * Vérifie si un ID est un ID composé (COMPOSED::)
     * @param {string} id - ID à vérifier
     * @returns {boolean}
     */
    isComposedId: function(id) {
      return id && typeof id === 'string' && id.startsWith('COMPOSED::');
    },

    /**
     * Parse un ID composé en tableau d'IDs
     * @param {string} composedId - ID composé (COMPOSED::id1::id2::id3)
     * @returns {string[]} Tableau d'IDs
     */
    parseComposedIds: function(composedId) {
      if (!this.isComposedId(composedId)) return [composedId];
      const parts = composedId.split('::');
      // Retirer "COMPOSED" et retourner le reste
      return parts.slice(1).filter(id => id && id.length > 0);
    },

    /**
     * Génère un ID unique
     * @param {string} [prefix='id'] - Préfixe de l'ID
     * @returns {string} ID unique
     */
    generateId: function(prefix) {
      prefix = prefix || 'id';
      return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * Retourne l'utilisateur Firebase courant ou null
     * @returns {Object|null} Utilisateur Firebase
     */
    currentUser: function() {
      try {
        return (window.firebase && window.firebase.auth && window.firebase.auth().currentUser) || null;
      } catch (e) {
        return null;
      }
    }
  };

  // Exposer globalement
  global.ORT_UTILS = ORT_UTILS;

  // Raccourcis pour compatibilité avec le code existant
  // Ces fonctions peuvent être appelées directement si besoin
  global.haversineDistance = global.haversineDistance || ORT_UTILS.haversineDistance.bind(ORT_UTILS);
  global.toSlug = global.toSlug || ORT_UTILS.toSlug.bind(ORT_UTILS);
  global.addDays = global.addDays || ORT_UTILS.addDays.bind(ORT_UTILS);
  global.fmtD = global.fmtD || ORT_UTILS.fmtD.bind(ORT_UTILS);
  global.safeJSONParse = global.safeJSONParse || ORT_UTILS.safeJSONParse.bind(ORT_UTILS);
  global.safe = global.safe || ORT_UTILS.safe.bind(ORT_UTILS);
  global.isComposedId = global.isComposedId || ORT_UTILS.isComposedId.bind(ORT_UTILS);
  global.parseComposedIds = global.parseComposedIds || ORT_UTILS.parseComposedIds.bind(ORT_UTILS);

  console.log('[ORT-UTILS] ✅ Module chargé - ' + Object.keys(ORT_UTILS).length + ' fonctions');

})(typeof window !== 'undefined' ? window : this);
