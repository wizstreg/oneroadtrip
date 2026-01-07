/**
 * =====================================================
 * ORT STATE MANAGER - Gestionnaire d'état centralisé
 * =====================================================
 * 
 * Gère la persistance et synchronisation des voyages
 * - Version gratuite : localStorage
 * - Version payante : Firestore
 * - Support i18n 6 langues (fr, en, it, es, pt, ar)
 * - Détection automatique des modifications
 * - Sauvegarde automatique
 * 
 * @version 1.0.1
 * @date 2025-11-13
 * @patch Fix nested arrays pour Firestore
 */

(function() {
  'use strict';

  // ===== CONFIGURATION FIREBASE =====
  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyChwXhmVSy6FyGVlrBDdi4IJ2LKCyt7VjM",
    authDomain: "oneroadtrip-prod.firebaseapp.com",
    projectId: "oneroadtrip-prod",
    storageBucket: "oneroadtrip-prod.firebasestorage.app",
    messagingSenderId: "451183452295",
    appId: "1:451183452295:web:3004ec5c970c0b53ddd822",
    measurementId: "G-JK3QGQGDDL"
  };

  // ===== CONSTANTES =====
  const STORAGE_PREFIX = 'ort_trip_';
  const STORAGE_INDEX = 'ort_trips_index';
  const AUTO_SAVE_DELAY = 3000; // 3 secondes après dernière modif
  const SUPPORTED_LANGS = ['fr', 'en', 'it', 'es', 'pt', 'ar'];

  // ===== LIMITES FIRESTORE =====
  const MAX_SAVED_TRIPS = 2;      // Max voyages sauvegardés (users normaux)
  const MAX_BOOKINGS_TOTAL = 20;  // Max réservations par voyage
  const MAX_DOCUMENTS = 10;       // Max documents d'identité
  
  // ===== ADMIN (accès illimité) =====
  const ADMIN_EMAILS = [atob('bWFyY3NvcmNpQGZyZWUuZnI=')]; // Encodé base64

  // ===== ÉTAT GLOBAL =====
  let firebaseApp = null;
  let firestoreDb = null;
  let currentUser = null;
  let isPremiumUser = false;
  let autoSaveTimers = {};
  let saveDebounceTimers = {}; // Timers pour debounce des sauvegardes
  let pendingChanges = {}; // { tripId: { section: data } }
  let tripsCache = {}; // Cache en mémoire

  // ===== INITIALISATION =====

  /**
   * Initialise le State Manager
   * @param {Object} options - Options d'initialisation
   * @param {Object} options.user - Utilisateur connecté
   * @param {boolean} options.premium - Si l'utilisateur est premium
   */
  async function init(options = {}) {
    console.log('🚀 [STATE] Initialisation du State Manager...');

    currentUser = options.user || null;
    isPremiumUser = options.premium || false;

    // Si connecté, initialise Firebase/Firestore
    if (currentUser) {
      try {
        await initFirebase();
        console.log('✅ [STATE] Firebase initialisé (mode CLOUD)');
      } catch (error) {
        console.error('❌ [STATE] Erreur Firebase:', error);
        console.log('📦 [STATE] Fallback sur localStorage');
      }
    } else {
      console.log('📦 [STATE] Mode LOCAL (localStorage) - Utilisateur non connecté');
    }

    // Charge l'index des voyages
    await loadTripsIndex();

    console.log('✅ [STATE] State Manager initialisé');
    return true;
  }

  /**
   * Initialise Firebase et Firestore
   */
  async function initFirebase() {
    // Si déjà initialisé, ne rien faire
    if (firestoreDb) {
      console.log('✅ [STATE] Firestore déjà initialisé, skip');
      return;
    }
    
    console.log('🔧 [STATE] Initialisation Firebase...');
    
    // Charge les SDK Firebase dynamiquement
    if (!window.firebase) {
      console.log('📦 [STATE] Chargement SDK Firebase...');
      await loadFirebaseSDK();
      console.log('✅ [STATE] SDK Firebase chargé');
    } else {
      console.log('✅ [STATE] SDK Firebase déjà présent');
    }
    
    // ══════════════════════════════════════════════════════════════
    // CRITIQUE : Vérifier si Firestore SDK est chargé
    // RT Simple ne charge que Auth, pas Firestore !
    // ══════════════════════════════════════════════════════════════
    if (!window.firebase.firestore) {
      console.log('📦 [STATE] Chargement SDK Firestore...');
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
      console.log('✅ [STATE] SDK Firestore chargé');
    }

    // Initialise Firebase App
    if (!firebaseApp) {
      console.log('🔧 [STATE] Initialisation Firebase App...');
      
      // Vérifie si une app existe déjà
      if (firebase.apps && firebase.apps.length > 0) {
        console.log('✅ [STATE] Firebase App déjà initialisé, réutilisation');
        firebaseApp = firebase.apps[0];
      } else {
        firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
        console.log('✅ [STATE] Firebase App initialisé');
      }
    }

    // Initialise Firestore
    console.log('🔧 [STATE] Initialisation Firestore...');
    firestoreDb = firebase.firestore();
    console.log('✅ [STATE] Firestore initialisé');

    // Configure les paramètres Firestore (seulement si pas déjà fait)
    try {
      firestoreDb.settings({
        cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
        merge: true  // Permet de merger avec settings existants
      });
    } catch (settingsErr) {
      console.warn('⚠️ [STATE] Settings Firestore déjà configurés');
    }

    // Active la persistance offline
    try {
      await firestoreDb.enablePersistence();
      console.log('✅ [STATE] Persistance Firestore activée');
    } catch (err) {
      if (err.code === 'failed-precondition') {
        console.warn('⚠️ [STATE] Persistance: plusieurs onglets ouverts');
      } else if (err.code === 'unimplemented') {
        console.warn('⚠️ [STATE] Persistance non supportée par ce navigateur');
      } else {
        console.warn('⚠️ [STATE] Persistance déjà activée ou erreur:', err.code || err);
      }
    }
  }

  /**
   * Charge les SDK Firebase dynamiquement
   */
  function loadFirebaseSDK() {
    return new Promise((resolve, reject) => {
      // Firebase App (core)
      const appScript = document.createElement('script');
      appScript.src = 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js';
      appScript.onload = () => {
        // Firebase Firestore
        const firestoreScript = document.createElement('script');
        firestoreScript.src = 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js';
        firestoreScript.onload = resolve;
        firestoreScript.onerror = reject;
        document.head.appendChild(firestoreScript);
      };
      appScript.onerror = reject;
      document.head.appendChild(appScript);
    });
  }

  // ===== GESTION DES VOYAGES =====

  /**
   * Charge l'index des voyages de l'utilisateur
   */
  async function loadTripsIndex() {
    if (currentUser) {
      // Charge depuis Firestore si connecté
      return await loadTripsFromFirestore();
    } else {
      // Charge depuis localStorage si déconnecté
      return loadTripsFromLocalStorage();
    }
  }

  /**
   * Charge les voyages depuis localStorage
   */
  function loadTripsFromLocalStorage() {
    try {
      const indexStr = localStorage.getItem(STORAGE_INDEX);
      const index = indexStr ? JSON.parse(indexStr) : [];
      
      console.log(`📦 [STATE] ${index.length} voyage(s) trouvé(s) en local`);
      
      // Charge chaque voyage dans le cache
      index.forEach(tripId => {
        const tripData = getTripFromLocalStorage(tripId);
        if (tripData) {
          tripsCache[tripId] = tripData;
        }
      });

      return index;
    } catch (error) {
      console.error('❌ [STATE] Erreur chargement localStorage:', error);
      return [];
    }
  }

  /**
   * Charge les voyages depuis Firestore
   */
  async function loadTripsFromFirestore() {
    if (!firestoreDb || !currentUser) {
      console.warn('⚠️ [STATE] Firestore non disponible');
      return [];
    }

    try {
      const snapshot = await firestoreDb
        .collection('users')
        .doc(currentUser.uid)
        .collection('trips')
        .orderBy('updatedAt', 'desc')
        .get();

      const trips = [];
      snapshot.forEach(doc => {
        const tripData = doc.data();
        tripData.id = doc.id;
        
        // Restaure les données sérialisées
        const restoredData = restoreFromFirestore(tripData);
        restoredData.id = doc.id;
        
        tripsCache[doc.id] = restoredData;
        trips.push(doc.id);
      });

      console.log(`☁️ [STATE] ${trips.length} voyage(s) chargé(s) depuis Firestore`);
      return trips;
    } catch (error) {
      console.error('❌ [STATE] Erreur chargement Firestore:', error);
      return [];
    }
  }

  /**
   * Récupère un voyage depuis localStorage
   */
  function getTripFromLocalStorage(tripId) {
    try {
      const dataStr = localStorage.getItem(STORAGE_PREFIX + tripId);
      return dataStr ? JSON.parse(dataStr) : null;
    } catch (error) {
      console.error(`❌ [STATE] Erreur lecture voyage ${tripId}:`, error);
      return null;
    }
  }

  /**
   * Récupère un voyage (cache, localStorage ou Firestore)
   * @param {string} tripId - ID du voyage
   * @param {boolean} forceReload - Force le rechargement depuis la source
   */
  async function getTrip(tripId, forceReload = false) {
    console.log(`🔍 [STATE] Récupération voyage: ${tripId}`);

    // 🔴 SI c'est un NEW tripId depuis catalogue: chercher le catalogue original
    const catalogSource = sessionStorage.getItem('ort_catalog_source');
    if (catalogSource && tripId.startsWith('trip_')) {
      console.log('[STATE] 📚 NEW tripId depuis catalogue, cherche source:', catalogSource);
      // Faire un appel récursif pour charger le catalogue
      const catalogData = await getTrip(catalogSource, true);
      if (catalogData) {
        console.log('[STATE] ✅ Données catalogue chargées pour NEW tripId');
        // Mettre à jour l'ID et cacher l'origine
        catalogData.id = tripId;
        catalogData.tripId = tripId;
        // Pas nettoyer sessionStorage ici - nettoyer à la sauvegarde
        return catalogData;
      }
    }

    // Si en cache et pas de force reload
    if (!forceReload && tripsCache[tripId]) {
      console.log('💨 [STATE] Voyage trouvé en cache');
      return tripsCache[tripId];
    }

    // Charge selon le mode
    if (isPremiumUser && currentUser) {
      return await getTripFromFirestore(tripId);
    } else {
      const trip = getTripFromLocalStorage(tripId);
      if (trip) {
        tripsCache[tripId] = trip;
      }
      return trip;
    }
  }

  /**
   * Récupère un voyage depuis Firestore
   */
  async function getTripFromFirestore(tripId) {
    if (!firestoreDb || !currentUser) return null;

    try {
      const doc = await firestoreDb
        .collection('users')
        .doc(currentUser.uid)
        .collection('trips')
        .doc(tripId)
        .get();

      if (doc.exists) {
        const tripData = doc.data();
        tripData.id = doc.id;
        
        // Restaure les données sérialisées
        const restoredData = restoreFromFirestore(tripData);
        restoredData.id = doc.id;
        
        tripsCache[tripId] = restoredData;
        console.log('☁️ [STATE] Voyage chargé depuis Firestore');
        return restoredData;
      }
      return null;
    } catch (error) {
      console.error('❌ [STATE] Erreur récupération Firestore:', error);
      return null;
    }
  }

  /**
   * Sauvegarde un voyage complet
   * @param {Object} tripData - Données du voyage
   * @returns {boolean} Succès de la sauvegarde
   * 
   * RÈGLE : Firestore = UNIQUEMENT si saved === true
   *         localStorage = brouillons et modifs temporaires
   */
  async function saveTrip(tripData) {
    if (!tripData || !tripData.id) {
      console.error('❌ [STATE] Données de voyage invalides');
      return false;
    }

    // Prépare les données
    const preparedData = prepareTripData(tripData);

    // Mise à jour du cache
    tripsCache[tripData.id] = preparedData;

    // RÈGLE ABSOLUE : Firestore = saved:true UNIQUEMENT
    // Brouillons et modifs temporaires → localStorage
    if (currentUser && preparedData.saved === true) {
      console.log(`💾 [STATE] Sauvegarde Firestore (saved=true): ${tripData.id}`);
      return await saveTripToFirestore(preparedData);
    } else {
      console.log(`💾 [STATE] Sauvegarde localStorage (brouillon): ${tripData.id}`);
      return saveTripToLocalStorage(preparedData);
    }
  }

  /**
   * Prépare les données du voyage pour la sauvegarde
   */
  function prepareTripData(tripData) {
    // Recupere l'ancienne valeur de saved depuis le cache ou le storage
    let existingSaved;
    
    // 1. D'abord chercher dans le cache mémoire (fonctionne pour tous les modes)
    if (tripsCache[tripData.id] && tripsCache[tripData.id].saved !== undefined) {
      existingSaved = tripsCache[tripData.id].saved;
    }
    
    // 2. Sinon chercher dans localStorage (fallback pour mode local)
    if (existingSaved === undefined) {
      try {
        // Ancien format
        const key = `ort.trips::${currentUser?.uid || 'anon'}`;
        const stored = localStorage.getItem(key);
        if (stored) {
          const trips = JSON.parse(stored);
          const existing = trips.find(t => t.id === tripData.id);
          if (existing?.saved !== undefined) {
            existingSaved = existing.saved;
          }
        }
        
        // Nouveau format (STORAGE_PREFIX)
        if (existingSaved === undefined) {
          const tripStr = localStorage.getItem(STORAGE_PREFIX + tripData.id);
          if (tripStr) {
            const existing = JSON.parse(tripStr);
            if (existing?.saved !== undefined) {
              existingSaved = existing.saved;
            }
          }
        }
      } catch (e) {
        console.warn('[STATE] Erreur lecture saved:', e);
      }
    }
    
 // Nettoyer les undefined pour Firestore
    const cleanData = {};
    for (const [key, value] of Object.entries(tripData)) {
      if (value !== undefined) {
        cleanData[key] = value;
      }
    }
    
    const data = {
      ...cleanData,
      updatedAt: Date.now()
    };
    // Preserve le flag saved s'il existait et qu'il n'est pas explicitement fourni
    if (data.saved === undefined && existingSaved !== undefined) {
      data.saved = existingSaved;
    }
    
    // Par défaut, les voyages NE SONT PAS marqués comme "sauvegardés" dans le dashboard
    // Seul un clic explicite sur "Sauvegarder" (avec saved: true passé) l'enregistre
    // Cela évite les fantômes dans Firestore venant des auto-saves
    if (data.saved === undefined) {
      data.saved = false; // Par défaut, voyage temporaire (non visible dans dashboard)
    }

    // S'assure que la structure de base existe
    if (!data.metadata) {
      data.metadata = {};
    }
    if (!data.steps) {
      data.steps = [];
    }
    if (!data.modifications) {
      data.modifications = {};
    }

    // Structure pour chaque section modifiable
    const sections = [
      'hotels',
      'restaurants', 
      'flights',
      'activities',
      'pois',
      'photos',
      'notes',
      'budget',
      'links'
    ];

    sections.forEach(section => {
      if (!data.modifications[section]) {
        data.modifications[section] = {};
      }
    });

    return data;
  }

  /**
   * Sauvegarde dans localStorage
   */
  function saveTripToLocalStorage(tripData) {
    try {
      // Sauvegarde le voyage
      localStorage.setItem(
        STORAGE_PREFIX + tripData.id,
        JSON.stringify(tripData)
      );

      // Met à jour l'index
      updateLocalStorageIndex(tripData.id);

      console.log('✅ [STATE] Voyage sauvegardé en local');
      
      // Nettoie les modifications en attente
      delete pendingChanges[tripData.id];
      
      return true;
    } catch (error) {
      console.error('❌ [STATE] Erreur sauvegarde localStorage:', error);
      
      // Si quota dépassé, tente de libérer de l'espace
      if (error.name === 'QuotaExceededError') {
        console.warn('⚠️ [STATE] Quota localStorage dépassé, nettoyage...');
        cleanOldTrips();
        // Réessaye
        try {
          localStorage.setItem(
            STORAGE_PREFIX + tripData.id,
            JSON.stringify(tripData)
          );
          updateLocalStorageIndex(tripData.id);
          console.log('✅ [STATE] Voyage sauvegardé après nettoyage');
          delete pendingChanges[tripData.id];
          return true;
        } catch (retryError) {
          console.error('❌ [STATE] Échec après nettoyage:', retryError);
          return false;
        }
      }
      
      return false;
    }
  }

  /**
   * Met à jour l'index localStorage
   */
  function updateLocalStorageIndex(tripId) {
    try {
      const indexStr = localStorage.getItem(STORAGE_INDEX);
      let index = indexStr ? JSON.parse(indexStr) : [];
      
      if (!index.includes(tripId)) {
        index.push(tripId);
        localStorage.setItem(STORAGE_INDEX, JSON.stringify(index));
      }
    } catch (error) {
      console.error('❌ [STATE] Erreur mise à jour index:', error);
    }
  }

  /**
   * Nettoie les anciens voyages pour libérer de l'espace
   */
  function cleanOldTrips() {
    try {
      console.log('🧹 [STATE] Nettoyage anciens voyages...');
      
      const indexStr = localStorage.getItem(STORAGE_INDEX);
      if (!indexStr) return;
      
      const index = JSON.parse(indexStr);
      const trips = [];
      
      // Charge tous les voyages avec leur date
      index.forEach(tripId => {
        const dataStr = localStorage.getItem(STORAGE_PREFIX + tripId);
        if (dataStr) {
          try {
            const data = JSON.parse(dataStr);
            trips.push({
              id: tripId,
              updatedAt: data.updatedAt || 0
            });
          } catch (e) {
            // Voyage corrompu, on le supprime
            localStorage.removeItem(STORAGE_PREFIX + tripId);
          }
        }
      });
      
      // Trie par date (plus récent en premier)
      trips.sort((a, b) => b.updatedAt - a.updatedAt);
      
      // Garde les 10 plus récents, supprime les autres
      const toKeep = trips.slice(0, 10);
      const toDelete = trips.slice(10);
      
      toDelete.forEach(trip => {
        localStorage.removeItem(STORAGE_PREFIX + trip.id);
      });
      
      // Met à jour l'index
      const newIndex = toKeep.map(t => t.id);
      localStorage.setItem(STORAGE_INDEX, JSON.stringify(newIndex));

      console.log(`✅ [STATE] ${toDelete.length} voyage(s) nettoyé(s)`);
    } catch (error) {
      console.error('❌ [STATE] Erreur nettoyage:', error);
    }
  }

  /**
   * Nettoie les nested arrays pour Firestore
   * Firestore ne supporte pas les tableaux imbriqués
   * Solution radicale : sérialise en JSON string les structures complexes
   */
  function cleanNestedArrays(obj, depth = 0) {
    // Limite de profondeur pour éviter récursion infinie
    if (depth > 10) {
      console.warn('⚠️ [STATE] Profondeur max atteinte, objet converti en string');
      return JSON.stringify(obj);
    }
    
    if (Array.isArray(obj)) {
      // Vérifie si le tableau contient directement d'autres tableaux
      const hasNestedArray = obj.some(item => Array.isArray(item));
      if (hasNestedArray) {
        console.log('🔧 [STATE] Tableau imbriqué direct détecté, conversion en JSON string');
        return JSON.stringify(obj);
      }
      return obj.map(item => {
        if (typeof item === 'object' && item !== null) {
          return cleanNestedArrays(item, depth + 1);
        }
        return item;
      });
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const cleaned = {};
      
      for (const [key, value] of Object.entries(obj)) {
        if (Array.isArray(value)) {
          // Pour "steps", toujours vérifier s'il contient visits/activities/photos
          // qui sont des tableaux dans des objets
          const hasAnyNestedArray = value.some(item => {
            if (typeof item !== 'object' || item === null) return false;
            return Object.values(item).some(v => Array.isArray(v));
          });
          
          if (hasAnyNestedArray) {
            // SOLUTION RADICALE : Convertir en JSON string
            console.log(`🔧 [STATE] Nested array détecté dans "${key}", sérialisation JSON`);
            
            // Nettoyer les undefined avant stringify
            const cleanValue = JSON.parse(JSON.stringify(value, (k, v) => v === undefined ? null : v));
            
            cleaned[`${key}_json`] = JSON.stringify(cleanValue);
            cleaned[`${key}_is_json`] = true;
            // Ne pas inclure le tableau original
          } else {
            // Tableau simple : nettoyer récursivement
            cleaned[key] = value.map(item => {
              if (typeof item === 'object' && item !== null) {
                return cleanNestedArrays(item, depth + 1);
              }
              return item;
            });
          }
        } else if (typeof value === 'object' && value !== null) {
          cleaned[key] = cleanNestedArrays(value, depth + 1);
        } else if (value !== undefined) {
          cleaned[key] = value;
        }
      }
      
      return cleaned;
    }
    
    return obj;
  }
  
  /**
   * Restaure les données sérialisées depuis Firestore
   */
  function restoreFromFirestore(obj) {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(item => restoreFromFirestore(item));
    }
    
    const restored = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Si c'est un champ marqué comme JSON sérialisé
      if (key.endsWith('_is_json') && value === true) {
        const baseKey = key.replace('_is_json', '');
        const jsonKey = `${baseKey}_json`;
        
        if (obj[jsonKey]) {
          try {
            // Restaure le tableau depuis le JSON
            restored[baseKey] = JSON.parse(obj[jsonKey]);
            console.log(`🔓 [STATE] Données "${baseKey}" désérialisées depuis Firestore`);
          } catch (e) {
            console.error(`❌ [STATE] Erreur désérialisation "${baseKey}":`, e);
            restored[baseKey] = [];
          }
        }
        // Ne pas inclure les clés _is_json et _json dans l'objet final
      } else if (!key.endsWith('_json') && !key.endsWith('_is_json')) {
        // Restaurer récursivement les autres champs
        if (Array.isArray(value)) {
          restored[key] = value.map(item => restoreFromFirestore(item));
        } else if (typeof value === 'object' && value !== null) {
          restored[key] = restoreFromFirestore(value);
        } else {
          restored[key] = value;
        }
      }
    }
    
    return restored;
  }

  /**
   * Sauvegarde dans Firestore
   */
  async function saveTripToFirestore(tripData) {
    if (!firestoreDb || !currentUser) {
      console.warn('⚠️ [STATE] Firestore non disponible, sauvegarde en local');
      return saveTripToLocalStorage(tripData);
    }

    // Vérifier la limite de voyages sauvegardés (sauf si c'est une mise à jour ou admin)
    const isAdmin = currentUser.email && ADMIN_EMAILS.includes(currentUser.email.toLowerCase());
    
    if (!isAdmin) {
      try {
        const existingDoc = await firestoreDb
          .collection('users')
          .doc(currentUser.uid)
          .collection('trips')
          .doc(tripData.id)
          .get();
        
        if (!existingDoc.exists) {
          // Nouveau voyage : vérifier la limite
          const snapshot = await firestoreDb
            .collection('users')
            .doc(currentUser.uid)
            .collection('trips')
            .get();
          
          if (snapshot.size >= MAX_SAVED_TRIPS) {
            console.error(`❌ [STATE] Limite atteinte: ${MAX_SAVED_TRIPS} voyages max`);
            // Émet un événement pour notifier l'UI
            window.dispatchEvent(new CustomEvent('ort:limit-reached', {
              detail: { type: 'trips', limit: MAX_SAVED_TRIPS, current: snapshot.size }
            }));
            return false;
          }
        }
      } catch (limitError) {
        console.warn('⚠️ [STATE] Erreur vérification limite:', limitError);
        // Continue quand même (mieux vaut sauvegarder que perdre des données)
      }
    }

try {
      // Nettoie les nested arrays avant sauvegarde
      let cleanedData = cleanNestedArrays(tripData);
      
      // Nettoie les undefined (Firestore ne les accepte pas)
      const removeUndefined = (obj) => {
        if (Array.isArray(obj)) return obj.map(removeUndefined);
        if (typeof obj !== 'object' || obj === null) return obj;
        
        const cleaned = {};
        for (const [key, value] of Object.entries(obj)) {
          if (value !== undefined) {
            cleaned[key] = removeUndefined(value);
          }
        }
        return cleaned;
      };
      
      cleanedData = removeUndefined(cleanedData);
      
      console.log('🧹 [STATE] Données nettoyées pour Firestore');
      
      await firestoreDb
        .collection('users')
        .doc(currentUser.uid)
        .collection('trips')
        .doc(tripData.id)
        .set(cleanedData, { merge: true });

      console.log('✅ [STATE] Voyage sauvegardé dans Firestore');
      
      // Nettoie les modifications en attente
      delete pendingChanges[tripData.id];
      
      return true;
    } catch (error) {
      console.error('❌ [STATE] Erreur sauvegarde Firestore:', error);
      
      // Fallback sur localStorage
      console.log('🔄 [STATE] Fallback sur localStorage...');
      return saveTripToLocalStorage(tripData);
    }
  }

  /**
   * Supprime un voyage
   * @param {string} tripId - ID du voyage à supprimer
   */
  async function deleteTrip(tripId) {
    console.log(`🗑️ [STATE] Suppression voyage: ${tripId}`);

    // Supprime du cache
    delete tripsCache[tripId];
    delete pendingChanges[tripId];

    if (currentUser) {
      return await deleteTripFromFirestore(tripId);
    } else {
      return deleteTripFromLocalStorage(tripId);
    }
  }

  /**
   * Supprime depuis localStorage
   */
  function deleteTripFromLocalStorage(tripId) {
    try {
      localStorage.removeItem(STORAGE_PREFIX + tripId);
      
      // Met à jour l'index
      const indexStr = localStorage.getItem(STORAGE_INDEX);
      if (indexStr) {
        let index = JSON.parse(indexStr);
        index = index.filter(id => id !== tripId);
        localStorage.setItem(STORAGE_INDEX, JSON.stringify(index));
      }
      
      console.log('✅ [STATE] Voyage supprimé du localStorage');
      return true;
    } catch (error) {
      console.error('❌ [STATE] Erreur suppression localStorage:', error);
      return false;
    }
  }

  /**
   * Supprime depuis Firestore
   */
  async function deleteTripFromFirestore(tripId) {
    if (!firestoreDb || !currentUser) {
      return deleteTripFromLocalStorage(tripId);
    }

    try {
      await firestoreDb
        .collection('users')
        .doc(currentUser.uid)
        .collection('trips')
        .doc(tripId)
        .delete();

      console.log('✅ [STATE] Voyage supprimé de Firestore');
      return true;
    } catch (error) {
      console.error('❌ [STATE] Erreur suppression Firestore:', error);
      return false;
    }
  }

  // ===== GESTION DES MODIFICATIONS =====

  /**
   * Marque une section comme modifiée (pour auto-save)
   */
  function markAsModified(tripId, section, data) {
    if (!pendingChanges[tripId]) {
      pendingChanges[tripId] = {};
    }
    
    pendingChanges[tripId][section] = {
      data,
      timestamp: Date.now()
    };

    // Debounce auto-save
    if (saveDebounceTimers[tripId]) {
      clearTimeout(saveDebounceTimers[tripId]);
    }

    saveDebounceTimers[tripId] = setTimeout(() => {
      forceSave(tripId);
    }, AUTO_SAVE_DELAY);
  }

  /**
   * Force la sauvegarde immédiate
   */
  async function forceSave(tripId) {
    if (!pendingChanges[tripId]) {
      console.log('ℹ️ [STATE] Aucune modification en attente pour', tripId);
      return;
    }

    console.log('💾 [STATE] Sauvegarde forcée:', tripId);

    let trip = await getTrip(tripId);
    
    // Si le voyage n'existe pas encore, on ne peut pas faire de forceSave
    // Les modifications seront sauvegardées lors du premier saveTrip explicite
    if (!trip) {
      console.log('ℹ️ [STATE] Voyage pas encore créé, modifications en attente conservées:', tripId);
      // Nettoie quand même les pendingChanges pour éviter l'indicateur persistant
      // car ce voyage sera créé lors de la vraie sauvegarde
      delete pendingChanges[tripId];
      return;
    }

    // Applique les modifications en attente
    const changes = pendingChanges[tripId];
    Object.keys(changes).forEach(section => {
      if (!trip.modifications) {
        trip.modifications = {};
      }
      trip.modifications[section] = changes[section].data;
    });

    // Sauvegarde
    await saveTrip(trip);
  }

  /**
   * Vérifie s'il y a des modifications en attente
   */
  function hasPendingChanges(tripId) {
    return !!pendingChanges[tripId];
  }

  /**
   * Annule les modifications en attente
   */
  function cancelPendingChanges(tripId) {
    delete pendingChanges[tripId];
    if (saveDebounceTimers[tripId]) {
      clearTimeout(saveDebounceTimers[tripId]);
      delete saveDebounceTimers[tripId];
    }
    console.log('↩️ [STATE] Modifications annulées:', tripId);
  }

  // ===== i18n - ITINÉRAIRES DE BASE =====

  /**
   * Charge un itinéraire de base depuis les fichiers JSON i18n
   * @param {Object} baseItinerary - Référence de base (country, itin_id)
   * @param {string} lang - Langue (fr, en, it, es, pt, ar)
   */
  async function loadBaseItinerary(baseItinerary, lang = 'fr') {
    if (!baseItinerary || !baseItinerary.country || !baseItinerary.itin) {
      console.error('❌ [STATE] Référence itinéraire invalide');
      return null;
    }

    const validLang = SUPPORTED_LANGS.includes(lang) ? lang : 'fr';
    const cc = baseItinerary.country.toUpperCase();
    const itinId = baseItinerary.itin;

    console.log(`🌍 [STATE] Chargement itinéraire de base: ${cc}/${itinId} (${validLang})`);

    try {
      // Chemin vers le fichier JSON i18n
      const jsonPath = `/data/roadtrips-json/${validLang}/${cc}/${itinId}.json`;
      
      const response = await fetch(jsonPath);
      if (!response.ok) {
        console.warn(`⚠️ [STATE] Fichier introuvable: ${jsonPath}`);
        
        // Fallback sur français si autre langue échoue
        if (validLang !== 'fr') {
          console.log('🔄 [STATE] Tentative fallback sur français...');
          return await loadBaseItinerary(baseItinerary, 'fr');
        }
        
        return null;
      }

      const data = await response.json();
      console.log('✅ [STATE] Itinéraire de base chargé');
      return data;
    } catch (error) {
      console.error('❌ [STATE] Erreur chargement itinéraire:', error);
      
      // Fallback sur français si autre langue échoue
      if (validLang !== 'fr') {
        console.log('🔄 [STATE] Tentative fallback sur français...');
        return await loadBaseItinerary(baseItinerary, 'fr');
      }
      
      return null;
    }
  }

  /**
   * Fusionne l'itinéraire de base avec les modifications utilisateur
   * @param {Object} baseItinerary - Itinéraire de base
   * @param {Object} userModifications - Modifications utilisateur
   */
  function mergeItineraryWithModifications(baseItinerary, userModifications) {
    if (!baseItinerary) return null;
    if (!userModifications) return baseItinerary;

    console.log('🔀 [STATE] Fusion itinéraire + modifications');

    const merged = JSON.parse(JSON.stringify(baseItinerary)); // Deep clone

    // Fusionne les métadonnées
    if (userModifications.metadata) {
      merged.metadata = {
        ...merged.metadata,
        ...userModifications.metadata
      };
    }

    // Fusionne les étapes
    if (userModifications.steps && Array.isArray(userModifications.steps)) {
      merged.steps = mergeSteps(merged.steps, userModifications.steps);
    }

    // Applique les suppressions d'étapes
    if (userModifications.deletedSteps && Array.isArray(userModifications.deletedSteps)) {
      merged.steps = merged.steps.filter((step, index) => 
        !userModifications.deletedSteps.includes(index)
      );
    }

    // Ajoute les étapes personnalisées
    if (userModifications.addedSteps && Array.isArray(userModifications.addedSteps)) {
      merged.steps.push(...userModifications.addedSteps);
    }

    // Applique les modifications de sections
    const sections = ['hotels', 'restaurants', 'flights', 'activities', 'pois', 'photos', 'notes', 'budget', 'links'];
    sections.forEach(section => {
      if (userModifications[section]) {
        if (!merged[section]) {
          merged[section] = {};
        }
        merged[section] = {
          ...merged[section],
          ...userModifications[section]
        };
      }
    });

    console.log('✅ [STATE] Fusion terminée');
    return merged;
  }

  /**
   * Fusionne les étapes de base avec les modifications
   */
  function mergeSteps(baseSteps, modifiedSteps) {
    if (!Array.isArray(baseSteps)) return modifiedSteps || [];
    if (!Array.isArray(modifiedSteps)) return baseSteps;

    return baseSteps.map((baseStep, index) => {
      const modifiedStep = modifiedSteps.find(s => s.index === index || s.id === baseStep.id);
      if (modifiedStep) {
        return {
          ...baseStep,
          ...modifiedStep
        };
      }
      return baseStep;
    });
  }

  // ===== MIGRATION DONNÉES =====

  /**
   * Migre un voyage de localStorage vers Firestore
   * (Appelé lors du passage à premium)
   */
  async function migrateToFirestore(tripId) {
    if (!currentUser || !firestoreDb) {
      console.error('❌ [STATE] Migration impossible: Firestore non disponible');
      return false;
    }

    console.log(`🔄 [STATE] Migration vers Firestore: ${tripId}`);

    // Charge depuis localStorage
    const tripData = getTripFromLocalStorage(tripId);
    if (!tripData) {
      console.error('❌ [STATE] Voyage introuvable en local');
      return false;
    }

    // Sauvegarde dans Firestore
    try {
      const cleanedData = cleanNestedArrays(tripData);
      
      await firestoreDb
        .collection('users')
        .doc(currentUser.uid)
        .collection('trips')
        .doc(tripId)
        .set(cleanedData);

      console.log('✅ [STATE] Migration réussie');
      
      // Optionnel: supprime de localStorage après migration
      // deleteTripFromLocalStorage(tripId);
      
      return true;
    } catch (error) {
      console.error('❌ [STATE] Erreur migration:', error);
      return false;
    }
  }

  /**
   * Migre tous les voyages vers Firestore
   */
  async function migrateAllToFirestore() {
    const index = loadTripsFromLocalStorage();
    const results = {
      total: index.length,
      success: 0,
      failed: 0
    };

    for (const tripId of index) {
      const success = await migrateToFirestore(tripId);
      if (success) {
        results.success++;
      } else {
        results.failed++;
      }
    }

    console.log(`📊 [STATE] Migration terminée:`, results);
    return results;
  }

  // ===== UTILITAIRES =====

  /**
   * Génère un ID unique pour un voyage
   */
  function generateTripId() {
    return `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Obtient la liste de tous les voyages
   */
  /**
   * ╔═══════════════════════════════════════════════════════════╗
   * ║  RÈGLE ABSOLUE - Dashboard = FIRESTORE UNIQUEMENT         ║
   * ║  JAMAIS localStorage quand utilisateur connecté           ║
   * ╚═══════════════════════════════════════════════════════════╝
   */
  async function getAllTrips() {
    // Si connecté + Firestore dispo → UNIQUEMENT Firestore
    if (currentUser && firestoreDb) {
      tripsCache = {};
      await loadTripsFromFirestore();
      console.log(`☁️ [STATE] getAllTrips: ${Object.keys(tripsCache).length} voyage(s) depuis Firestore UNIQUEMENT`);
      return Object.values(tripsCache);
    }
    // Sinon localStorage (offline)
    await loadTripsIndex();
    return Object.values(tripsCache);
  }

  /**
   * Obtient les statistiques de stockage
   */
  function getStorageStats() {
    const stats = {
      mode: isPremiumUser ? 'firestore' : 'localStorage',
      tripsCount: Object.keys(tripsCache).length,
      pendingChangesCount: Object.keys(pendingChanges).length
    };

    if (!isPremiumUser) {
      // Calcule l'utilisation localStorage
      let used = 0;
      for (let key in localStorage) {
        if (key.startsWith(STORAGE_PREFIX) || key === STORAGE_INDEX) {
          used += localStorage[key].length;
        }
      }
      stats.localStorageUsed = `${(used / 1024).toFixed(2)} KB`;
      stats.localStorageLimit = '~5-10 MB';
    }

    return stats;
  }

  // ===== API PUBLIQUE =====
  window.ORT_STATE = {
    // Initialisation
    init,
    updateUser: async function(user) {
      currentUser = user;
      isPremiumUser = user?.premium || false;
      console.log('[STATE] User mis a jour:', user ? user.uid : 'deconnecte');
      
      // Si l'utilisateur vient de se connecter, initialiser Firestore
      if (user && !firestoreDb) {
        console.log('🔧 [STATE] Utilisateur connecté, initialisation Firestore...');
        try {
          await initFirebase();
          console.log('✅ [STATE] Firebase initialisé après connexion');
          
          // Charge depuis Firestore
          const firestoreTrips = await loadTripsFromFirestore();
          
          if (firestoreTrips.length > 0) {
            // Firestore a des données, on les utilise
            console.log('☁️ [STATE] Utilisation des données Firestore');
            tripsCache = {};
            await loadTripsIndex();
          } else {
            // Firestore vide, MIGRER automatiquement depuis localStorage
            console.log('📦 [STATE] Firestore vide, tentative migration localStorage...');
            
            // MIGRATION localStorage → Firestore
            const uid = user.uid;
            const oldSaves = localStorage.getItem(`ort.saves::${uid}`);
            
            if (oldSaves) {
              try {
                const oldTrips = JSON.parse(oldSaves);
                console.log(`📦 [MIGRATION] ${oldTrips.length} trip(s) trouvé(s) dans localStorage`);
                
                // Migrer chaque trip
                for (const trip of oldTrips) {
                  if (trip && trip.id) {
                    console.log(`  → Migration: ${trip.title}`);
                    // CORRECTION: Ne PAS forcer saved = true
                    // Seuls les trips explicitement marqués saved:true doivent apparaître dans le dashboard
                    // Les autres resteront à false par défaut (voir prepareTripData ligne 398)
                    await this.saveTrip(trip);
                  }
                }
                
                // Backup et suppression
                localStorage.setItem(`ort.saves::${uid}::backup`, oldSaves);
                localStorage.setItem(`ort.saves::${uid}::backup_date`, new Date().toISOString());
                localStorage.removeItem(`ort.saves::${uid}`);
                
                console.log('✅ [MIGRATION] Migration terminée vers Firestore');
                
                // Recharger depuis Firestore
                tripsCache = {};
                await loadTripsIndex();
              } catch(e) {
                console.error('❌ [MIGRATION] Erreur:', e);
              }
            } else {
              console.log('💡 [STATE] Aucun trip localStorage à migrer');
            }
          }
        } catch (error) {
          console.error('❌ [STATE] Erreur init Firebase:', error);
          console.log('📦 [STATE] Conservation des données localStorage');
        }
      } else if (user && firestoreDb) {
        // Firestore déjà initialisé, recharger normalement
        const firestoreTrips = await loadTripsFromFirestore();
        if (firestoreTrips.length > 0) {
          tripsCache = {};
          await loadTripsIndex();
        }
      }
      
      // Clear les timers
      Object.values(saveDebounceTimers).forEach(clearTimeout);
      saveDebounceTimers = {};
    },
    
    // Gestion des voyages
    getTrip,
    saveTrip,
    deleteTrip,
    getAllTrips,
    generateTripId,
    
    // Gestion des modifications
    markAsModified,
    forceSave,
    hasPendingChanges,
    cancelPendingChanges,
    
    // i18n
    loadBaseItinerary,
    mergeItineraryWithModifications,
    
    // Migration
    migrateToFirestore,
    migrateAllToFirestore,
    
    // Utilitaires
    getStorageStats,
    
    // Constantes
    SUPPORTED_LANGS,
    
    // Expose currentUser pour debug
    get currentUser() { return currentUser; }
  };

  console.log('✅ [STATE] State Manager chargé');

})();