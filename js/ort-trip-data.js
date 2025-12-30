/**
 * =====================================================
 * ORT TRIP DATA - Données utilisateur centralisées
 * =====================================================
 * 
 * Centralise TOUTES les données utilisateur dans le trip Firestore :
 * - steps[].userPhotos (photos utilisateur par étape)
 * - steps[].bookings (réservations par étape)
 * - travelBookings (résas voyage : vol, voiture, assurance)
 * - documents (passeport, visa, permis...)
 * 
 * Remplace le stockage localStorage fragmenté par une source unique.
 * 
 * @version 1.0.0
 * @date 2025-01-01
 */

(function() {
  'use strict';

  // ===== CONSTANTES =====
  const MAX_PHOTOS_PER_STEP = 3;
  const MAX_BOOKINGS_TOTAL = 20;  // Aligné avec ort-state-manager
  const MAX_DOCUMENTS = 10;       // Aligné avec ort-state-manager
  const DEBOUNCE_SAVE_MS = 2000;

  // ===== ÉTAT =====
  let currentTripId = null;
  let tripData = null;
  let saveTimer = null;
  let pendingChanges = false;

  // ===== INITIALISATION =====

  /**
   * Charge les données d'un trip
   * @param {string} tripId - ID du voyage
   * @returns {Object} Données du trip
   */
  async function loadTrip(tripId) {
    console.log('📦 [TRIP-DATA] Chargement trip:', tripId);

    if (!tripId) {
      console.error('❌ [TRIP-DATA] tripId manquant');
      return null;
    }

    currentTripId = tripId;

    // Charge via ORT_STATE si disponible
    if (window.ORT_STATE) {
      tripData = await window.ORT_STATE.getTrip(tripId);
    } else {
      // Fallback localStorage
      const stored = localStorage.getItem(`ort_trip_${tripId}`);
      tripData = stored ? JSON.parse(stored) : null;
    }

    if (!tripData) {
      console.warn('⚠️ [TRIP-DATA] Trip non trouvé:', tripId);
      return null;
    }

    // Initialise les structures si absentes
    ensureStructure();

    // Migration des anciennes données localStorage
    await migrateOldUserContent();

    console.log('✅ [TRIP-DATA] Trip chargé:', {
      steps: tripData.steps?.length || 0,
      travelBookings: tripData.travelBookings?.length || 0,
      documents: tripData.documents?.length || 0
    });

    return tripData;
  }

  /**
   * Assure que la structure de données existe
   */
  function ensureStructure() {
    if (!tripData) return;

    // Structure globale
    if (!tripData.travelBookings) tripData.travelBookings = [];
    if (!tripData.documents) tripData.documents = [];

    // Structure par étape
    if (Array.isArray(tripData.steps)) {
      tripData.steps.forEach(step => {
        if (!step.userPhotos) step.userPhotos = [];
        if (!step.bookings) step.bookings = [];
      });
    }
  }

  /**
   * Migre les anciennes données ort_user_content vers le trip
   */
  async function migrateOldUserContent() {
    if (!tripData || !currentTripId) return;

    const user = window.firebase?.auth?.()?.currentUser;
    const uid = user?.uid || 'anon';
    const oldKey = `ort_user_content_${uid}_${currentTripId}`;
    const oldData = localStorage.getItem(oldKey);

    if (!oldData) return;

    console.log('🔄 [TRIP-DATA] Migration anciennes données:', oldKey);

    try {
      const parsed = JSON.parse(oldData);
      let migrated = false;

      // Migre les données par étape
      for (const [key, value] of Object.entries(parsed)) {
        if (key.startsWith('step_')) {
          const stepIndex = parseInt(key.replace('step_', ''));
          
          // step_travel = travelBookings
          if (key === 'step_travel') {
            if (value.bookings?.length) {
              tripData.travelBookings = [
                ...tripData.travelBookings,
                ...value.bookings.filter(b => b && b.name)
              ];
              migrated = true;
            }
          } else if (!isNaN(stepIndex) && tripData.steps?.[stepIndex]) {
            // Étape normale
            const step = tripData.steps[stepIndex];

            // Photos
            if (value.photos?.length) {
              step.userPhotos = value.photos.filter(p => p).slice(0, MAX_PHOTOS_PER_STEP);
              migrated = true;
            }

            // Bookings
            if (value.bookings?.length) {
              step.bookings = [
                ...step.bookings,
                ...value.bookings.filter(b => b && b.name)
              ];
              migrated = true;
            }
          }
        }
      }

      if (migrated) {
        // Sauvegarde immédiate
        await save(true);

        // Backup et suppression de l'ancien stockage
        localStorage.setItem(`${oldKey}_backup`, oldData);
        localStorage.setItem(`${oldKey}_migrated`, new Date().toISOString());
        localStorage.removeItem(oldKey);

        console.log('✅ [TRIP-DATA] Migration terminée');
      }
    } catch (e) {
      console.error('❌ [TRIP-DATA] Erreur migration:', e);
    }
  }

  // ===== PHOTOS UTILISATEUR =====

  /**
   * Ajoute une photo utilisateur à une étape
   * @param {number} stepIndex - Index de l'étape
   * @param {string} photoUrl - URL de la photo
   * @param {number} slotIndex - Index du slot (0-2)
   */
  function addUserPhoto(stepIndex, photoUrl, slotIndex = null) {
    if (!tripData?.steps?.[stepIndex]) {
      console.error('❌ [TRIP-DATA] Étape invalide:', stepIndex);
      return false;
    }

    const step = tripData.steps[stepIndex];
    if (!step.userPhotos) step.userPhotos = [];

    // Si slot spécifié, remplace
    if (slotIndex !== null && slotIndex >= 0 && slotIndex < MAX_PHOTOS_PER_STEP) {
      step.userPhotos[slotIndex] = photoUrl;
    } else {
      // Sinon, trouve le premier slot vide
      const emptySlot = step.userPhotos.findIndex(p => !p);
      if (emptySlot !== -1) {
        step.userPhotos[emptySlot] = photoUrl;
      } else if (step.userPhotos.length < MAX_PHOTOS_PER_STEP) {
        step.userPhotos.push(photoUrl);
      } else {
        console.warn('⚠️ [TRIP-DATA] Max photos atteint pour étape', stepIndex);
        return false;
      }
    }

    console.log('📷 [TRIP-DATA] Photo ajoutée étape', stepIndex, 'slot', slotIndex);
    scheduleSave();
    return true;
  }

  /**
   * Supprime une photo utilisateur
   * @param {number} stepIndex - Index de l'étape
   * @param {number} slotIndex - Index du slot
   */
  function removeUserPhoto(stepIndex, slotIndex) {
    if (!tripData?.steps?.[stepIndex]?.userPhotos) return false;

    tripData.steps[stepIndex].userPhotos[slotIndex] = null;
    console.log('🗑️ [TRIP-DATA] Photo supprimée étape', stepIndex, 'slot', slotIndex);
    scheduleSave();
    return true;
  }

  /**
   * Récupère les photos d'une étape
   * @param {number} stepIndex - Index de l'étape
   * @returns {Array} Photos de l'étape
   */
  function getStepPhotos(stepIndex) {
    return tripData?.steps?.[stepIndex]?.userPhotos || [];
  }

  // ===== RÉSERVATIONS =====

  /**
   * Compte le nombre total de réservations
   */
  function countTotalBookings() {
    let count = tripData?.travelBookings?.length || 0;
    if (tripData?.steps) {
      tripData.steps.forEach(step => {
        count += step.bookings?.length || 0;
      });
    }
    return count;
  }

  /**
   * Ajoute une réservation à une étape
   * @param {number} stepIndex - Index de l'étape
   * @param {Object} booking - Données de la réservation
   */
  function addStepBooking(stepIndex, booking) {
    if (!tripData?.steps?.[stepIndex]) {
      console.error('❌ [TRIP-DATA] Étape invalide:', stepIndex);
      return false;
    }

    if (countTotalBookings() >= MAX_BOOKINGS_TOTAL) {
      console.warn('⚠️ [TRIP-DATA] Limite de réservations atteinte');
      return false;
    }

    const step = tripData.steps[stepIndex];
    if (!step.bookings) step.bookings = [];

    // Ajoute métadonnées
    booking.id = booking.id || `ort_book_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    booking.addedAt = Date.now();

    step.bookings.push(booking);
    console.log('📋 [TRIP-DATA] Réservation ajoutée étape', stepIndex, ':', booking.name);
    scheduleSave();
    return true;
  }

  /**
   * Supprime une réservation d'une étape
   * @param {number} stepIndex - Index de l'étape
   * @param {number|string} bookingIdOrIndex - Index ou ID de la réservation
   */
  function removeStepBooking(stepIndex, bookingIdOrIndex) {
    if (!tripData?.steps?.[stepIndex]?.bookings) return false;

    const bookings = tripData.steps[stepIndex].bookings;

    if (typeof bookingIdOrIndex === 'string') {
      // Par ID
      const idx = bookings.findIndex(b => b.id === bookingIdOrIndex);
      if (idx !== -1) bookings.splice(idx, 1);
    } else {
      // Par index
      bookings.splice(bookingIdOrIndex, 1);
    }

    console.log('🗑️ [TRIP-DATA] Réservation supprimée étape', stepIndex);
    scheduleSave();
    return true;
  }

  /**
   * Récupère les réservations d'une étape
   * @param {number} stepIndex - Index de l'étape
   */
  function getStepBookings(stepIndex) {
    return tripData?.steps?.[stepIndex]?.bookings || [];
  }

  // ===== RÉSERVATIONS VOYAGE (GLOBAL) =====

  /**
   * Ajoute une réservation de voyage (vol, voiture, etc.)
   * @param {Object} booking - Données de la réservation
   */
  function addTravelBooking(booking) {
    if (!tripData) return false;

    if (countTotalBookings() >= MAX_BOOKINGS_TOTAL) {
      console.warn('⚠️ [TRIP-DATA] Limite de réservations atteinte');
      return false;
    }

    if (!tripData.travelBookings) tripData.travelBookings = [];

    // Ajoute métadonnées
    booking.id = booking.id || `ort_trav_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    booking.addedAt = Date.now();

    tripData.travelBookings.push(booking);
    console.log('✈️ [TRIP-DATA] Réservation voyage ajoutée:', booking.name);
    scheduleSave();
    return true;
  }

  /**
   * Supprime une réservation de voyage
   * @param {number|string} bookingIdOrIndex - Index ou ID
   */
  function removeTravelBooking(bookingIdOrIndex) {
    if (!tripData?.travelBookings) return false;

    if (typeof bookingIdOrIndex === 'string') {
      const idx = tripData.travelBookings.findIndex(b => b.id === bookingIdOrIndex);
      if (idx !== -1) tripData.travelBookings.splice(idx, 1);
    } else {
      tripData.travelBookings.splice(bookingIdOrIndex, 1);
    }

    console.log('🗑️ [TRIP-DATA] Réservation voyage supprimée');
    scheduleSave();
    return true;
  }

  /**
   * Récupère toutes les réservations de voyage
   */
  function getTravelBookings() {
    return tripData?.travelBookings || [];
  }

  // ===== DOCUMENTS =====

  /**
   * Ajoute un document scanné au voyage
   * @param {Object} doc - Données du document
   */
  function addDocument(doc) {
    if (!tripData) return false;

    if (!tripData.documents) tripData.documents = [];

    if (tripData.documents.length >= MAX_DOCUMENTS) {
      console.warn('⚠️ [TRIP-DATA] Limite de documents atteinte');
      return false;
    }

    // Ajoute métadonnées
    doc.id = doc.id || `ort_doc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    doc.addedAt = Date.now();

    tripData.documents.push(doc);
    console.log('📄 [TRIP-DATA] Document ajouté:', doc.type);
    scheduleSave();
    return true;
  }

  /**
   * Supprime un document
   * @param {number|string} docIdOrIndex - Index ou ID
   */
  function removeDocument(docIdOrIndex) {
    if (!tripData?.documents) return false;

    if (typeof docIdOrIndex === 'string') {
      const idx = tripData.documents.findIndex(d => d.id === docIdOrIndex);
      if (idx !== -1) tripData.documents.splice(idx, 1);
    } else {
      tripData.documents.splice(docIdOrIndex, 1);
    }

    console.log('🗑️ [TRIP-DATA] Document supprimé');
    scheduleSave();
    return true;
  }

  /**
   * Récupère tous les documents du voyage
   */
  function getDocuments() {
    return tripData?.documents || [];
  }

  // ===== SAUVEGARDE =====

  /**
   * Programme une sauvegarde différée
   */
  function scheduleSave() {
    pendingChanges = true;

    if (saveTimer) clearTimeout(saveTimer);

    saveTimer = setTimeout(() => {
      save();
    }, DEBOUNCE_SAVE_MS);
  }

  /**
   * Sauvegarde les données du trip
   * @param {boolean} immediate - Force sauvegarde immédiate
   */
  async function save(immediate = false) {
    if (!tripData || !currentTripId) {
      console.warn('⚠️ [TRIP-DATA] Rien à sauvegarder');
      return false;
    }

    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }

    console.log('💾 [TRIP-DATA] Sauvegarde...');

    tripData.updatedAt = Date.now();

    try {
      // Via ORT_STATE si disponible
      if (window.ORT_STATE) {
        await window.ORT_STATE.saveTrip(tripData);
      } else {
        // Fallback localStorage
        localStorage.setItem(`ort_trip_${currentTripId}`, JSON.stringify(tripData));
      }

      pendingChanges = false;
      console.log('✅ [TRIP-DATA] Sauvegardé');

      // Émet un événement
      window.dispatchEvent(new CustomEvent('ort:trip-data-saved', {
        detail: { tripId: currentTripId }
      }));

      return true;
    } catch (e) {
      console.error('❌ [TRIP-DATA] Erreur sauvegarde:', e);
      return false;
    }
  }

  /**
   * Force la sauvegarde immédiate
   */
  async function forceSave() {
    return await save(true);
  }

  /**
   * Vérifie s'il y a des changements non sauvegardés
   */
  function hasPendingChanges() {
    return pendingChanges;
  }

  // ===== UTILITAIRES =====

  /**
   * Récupère les statistiques du trip
   */
  function getStats() {
    if (!tripData) return null;

    let totalPhotos = 0;
    let totalStepBookings = 0;

    if (tripData.steps) {
      tripData.steps.forEach(step => {
        totalPhotos += (step.userPhotos || []).filter(p => p).length;
        totalStepBookings += (step.bookings || []).length;
      });
    }

    return {
      steps: tripData.steps?.length || 0,
      userPhotos: totalPhotos,
      stepBookings: totalStepBookings,
      travelBookings: tripData.travelBookings?.length || 0,
      documents: tripData.documents?.length || 0,
      totalBookings: totalStepBookings + (tripData.travelBookings?.length || 0)
    };
  }

  /**
   * Récupère le trip actuel
   */
  function getCurrentTrip() {
    return tripData;
  }

  /**
   * Récupère l'ID du trip actuel
   */
  function getCurrentTripId() {
    return currentTripId;
  }

  /**
   * Réinitialise (pour changement de voyage)
   */
  function reset() {
    if (saveTimer) clearTimeout(saveTimer);
    if (pendingChanges && tripData) {
      console.warn('⚠️ [TRIP-DATA] Reset avec changements non sauvegardés!');
    }
    currentTripId = null;
    tripData = null;
    pendingChanges = false;
    saveTimer = null;
  }

  // ===== API PUBLIQUE =====
  window.ORT_TRIP_DATA = {
    // Chargement
    loadTrip,
    getCurrentTrip,
    getCurrentTripId,
    reset,

    // Photos utilisateur
    addUserPhoto,
    removeUserPhoto,
    getStepPhotos,

    // Réservations par étape
    addStepBooking,
    removeStepBooking,
    getStepBookings,

    // Réservations voyage
    addTravelBooking,
    removeTravelBooking,
    getTravelBookings,

    // Documents
    addDocument,
    removeDocument,
    getDocuments,

    // Sauvegarde
    save,
    forceSave,
    hasPendingChanges,

    // Stats
    getStats,

    // Constantes
    MAX_PHOTOS_PER_STEP,
    MAX_BOOKINGS_TOTAL,
    MAX_DOCUMENTS
  };

  // Sauvegarde automatique avant fermeture
  window.addEventListener('beforeunload', (e) => {
    if (pendingChanges && tripData) {
      // Tente une sauvegarde synchrone en localStorage
      try {
        localStorage.setItem(`ort_trip_${currentTripId}`, JSON.stringify(tripData));
        console.log('💾 [TRIP-DATA] Sauvegarde beforeunload');
      } catch (err) {
        console.error('❌ [TRIP-DATA] Erreur beforeunload:', err);
      }
    }
  });

  console.log('✅ [TRIP-DATA] Module chargé');

})();
