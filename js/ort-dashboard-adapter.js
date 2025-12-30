/**
 * =====================================================
 * ADAPTATEUR STATE MANAGER - DASHBOARD USER
 * =====================================================
 * 
 * Gère l'affichage et la manipulation des voyages dans dashboard_user.html
 * - Chargement de la liste des voyages
 * - Affichage des cartes de voyage
 * - Suppression de voyages
 * - Ouverture des voyages
 * 
 * @version 1.0.0
 * @date 2025-11-03
 */

(function() {
  'use strict';

  // ===== ÉTAT LOCAL =====
  let currentLang = 'fr';
  let tripsLoaded = false;

  // ===== INITIALISATION =====

  /**
   * Initialise le dashboard
   */
  async function init() {
    console.log('🎯 [DASHBOARD] Initialisation...');

    // Récupère la langue
    currentLang = localStorage.getItem('ORT_LANG') || 'fr';

    // Charge les voyages
    await loadTrips();

    // Configure les écouteurs d'événements
    setupEventListeners();

    console.log('✅ [DASHBOARD] Initialisé');
  }

  // ===== CHARGEMENT DES VOYAGES =====

  /**
   * Charge tous les voyages de l'utilisateur
   */
  async function loadTrips() {
    console.log('📦 [DASHBOARD] Chargement des voyages...');

    try {
      const allTrips = await window.ORT_STATE.getAllTrips();
      
      // Filtre uniquement les voyages explicitement sauvegardés
      const trips = allTrips.filter(trip => trip.saved === true);
      
      console.log(`✅ [DASHBOARD] ${trips.length} voyage(s) sauvegardé(s) chargé(s) (${allTrips.length} total)`);

      // Affiche les voyages
      displayTrips(trips);

      tripsLoaded = true;
      return trips;
    } catch (error) {
      console.error('❌ [DASHBOARD] Erreur chargement:', error);
      showError('Erreur lors du chargement des voyages');
      return [];
    }
  }

  /**
   * Affiche les voyages dans le dashboard
   */
  function displayTrips(trips) {
    const container = document.querySelector('#list, [data-trips-container], #tripsContainer, .trips-list');
    
    if (!container) {
      console.warn('⚠️ [DASHBOARD] Container des voyages introuvable');
      return;
    }

    // Vide le container
    container.innerHTML = '';

    if (trips.length === 0) {
      container.innerHTML = `
        <div class="no-trips">
          <p>😊 Vous n'avez pas encore de voyage enregistré.</p>
          <p>Commencez par explorer nos itinéraires !</p>
          <a href="index.html?lang=${currentLang}" class="btn">Explorer</a>
        </div>
      `;
      return;
    }

    // Trie les voyages par date de modification (plus récent en premier)
    trips.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    // Crée une carte pour chaque voyage
    trips.forEach(trip => {
      const card = createTripCard(trip);
      container.appendChild(card);
    });

    console.log('✅ [DASHBOARD] Voyages affichés');
  }

  /**
   * Crée une carte de voyage
   */
  function createTripCard(trip) {
    const card = document.createElement('div');
    card.className = 'trip-card';
    card.dataset.tripId = trip.id;

    // Calcule les stats
    const nightsCount = trip.nights || trip.nb_nights || calculateNights(trip.steps);
    const stepsCount = trip.steps?.length || 0;
    const distance = trip.kms || calculateDistance(trip.steps);

    // Date de dernière modification
    const lastModified = trip.updatedAt 
      ? formatDate(trip.updatedAt)
      : 'Date inconnue';

    // Image de fond (si disponible)
    const bgImage = trip.thumbnail || trip.image || getDefaultImage(trip.country);

    card.innerHTML = `
      <div class="trip-card-image" style="background-image: url('${bgImage}')">
        ${trip.country ? `<span class="trip-country-badge">${getCountryFlag(trip.country)} ${trip.country.toUpperCase()}</span>` : ''}
      </div>
      <div class="trip-card-content">
        <h3 class="trip-card-title">${escapeHtml(trip.title || 'Voyage sans titre')}</h3>
        ${trip.description ? `<p class="trip-card-description">${escapeHtml(trip.description.substring(0, 100))}${trip.description.length > 100 ? '...' : ''}</p>` : ''}
        
        <div class="trip-card-stats">
          ${nightsCount ? `<span class="stat">🌙 ${nightsCount} nuit${nightsCount > 1 ? 's' : ''}</span>` : ''}
          ${stepsCount ? `<span class="stat">📍 ${stepsCount} étape${stepsCount > 1 ? 's' : ''}</span>` : ''}
          ${distance ? `<span class="stat">🚗 ${distance} km</span>` : ''}
        </div>
        
        <div class="trip-card-footer">
          <span class="trip-card-date">Modifié ${lastModified}</span>
          <div class="trip-card-actions">
            <button class="btn btn-primary btn-open" data-trip-id="${trip.id}">
              Ouvrir
            </button>
            <button class="btn btn-secondary btn-delete" data-trip-id="${trip.id}">
              🗑️
            </button>
          </div>
        </div>
      </div>
    `;

    return card;
  }

  // ===== ACTIONS SUR LES VOYAGES =====

  /**
   * Ouvre un voyage
   */
  async function openTrip(tripId) {
    console.log('📂 [DASHBOARD] Ouverture voyage:', tripId);

    try {
      // Récupère le voyage
      const trip = await window.ORT_STATE.getTrip(tripId);
      
      if (!trip) {
        showError('Voyage introuvable');
        return;
      }

      // Redirige vers la page de détail avec les bons paramètres
      const params = new URLSearchParams({
        lang: currentLang,
        tripId: tripId
      });

      // Si le voyage a une référence à un itinéraire de base
      if (trip.baseItinerary) {
        params.set('cc', trip.baseItinerary.country);
        if (trip.baseItinerary.region) {
          params.set('region', trip.baseItinerary.region);
        }
        params.set('itin', trip.baseItinerary.itin);
      }

      window.location.href = `roadtrip_detail.html?${params.toString()}`;
    } catch (error) {
      console.error('❌ [DASHBOARD] Erreur ouverture:', error);
      showError('Erreur lors de l\'ouverture du voyage');
    }
  }

  /**
   * Supprime un voyage
   */
  async function deleteTrip(tripId) {
    console.log('🗑️ [DASHBOARD] Suppression voyage:', tripId);

    // Confirmation
    const trip = await window.ORT_STATE.getTrip(tripId);
    const tripName = trip?.title || 'ce voyage';
    
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${tripName}" ?\n\nCette action est irréversible.`)) {
      console.log('❌ [DASHBOARD] Suppression annulée');
      return;
    }

    try {
      const success = await window.ORT_STATE.deleteTrip(tripId);
      
      if (success) {
        console.log('✅ [DASHBOARD] Voyage supprimé');
        showSuccess('Voyage supprimé avec succès');
        
        // Retire la carte du DOM
        const card = document.querySelector(`[data-trip-id="${tripId}"]`);
        if (card) {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.9)';
          card.style.transition = 'all 0.3s';
          setTimeout(() => card.remove(), 300);
        }
        
        // Recharge la liste si vide
        setTimeout(async () => {
          const trips = await window.ORT_STATE.getAllTrips();
          if (trips.length === 0) {
            await loadTrips();
          }
        }, 400);
      } else {
        showError('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('❌ [DASHBOARD] Erreur suppression:', error);
      showError('Erreur lors de la suppression du voyage');
    }
  }

  // ===== EVENT LISTENERS =====

  /**
   * Configure les écouteurs d'événements
   */
  function setupEventListeners() {
    // Délégation d'événements pour les boutons dynamiques
    document.addEventListener('click', (e) => {
      // Bouton "Ouvrir"
      if (e.target.matches('.btn-open') || e.target.closest('.btn-open')) {
        const btn = e.target.matches('.btn-open') ? e.target : e.target.closest('.btn-open');
        const tripId = btn.dataset.tripId;
        if (tripId) {
          openTrip(tripId);
        }
      }

      // Bouton "Supprimer"
      if (e.target.matches('.btn-delete') || e.target.closest('.btn-delete')) {
        e.stopPropagation();
        const btn = e.target.matches('.btn-delete') ? e.target : e.target.closest('.btn-delete');
        const tripId = btn.dataset.tripId;
        if (tripId) {
          deleteTrip(tripId);
        }
      }

      // Clic sur la carte entière (ouvre le voyage)
      if (e.target.matches('.trip-card') || e.target.closest('.trip-card')) {
        if (!e.target.matches('button') && !e.target.closest('button')) {
          const card = e.target.matches('.trip-card') ? e.target : e.target.closest('.trip-card');
          const tripId = card.dataset.tripId;
          if (tripId) {
            openTrip(tripId);
          }
        }
      }
    });

    // Bouton rafraîchir
    const refreshBtn = document.querySelector('[data-action="refresh"], .btn-refresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        console.log('🔄 [DASHBOARD] Rafraîchissement...');
        loadTrips();
      });
    }

    console.log('✅ [DASHBOARD] Event listeners configurés');
  }

  // ===== UTILITAIRES =====

  /**
   * Calcule le nombre de nuits total
   */
  function calculateNights(steps) {
    if (!Array.isArray(steps)) return 0;
    return steps.reduce((total, step) => total + (parseInt(step.nights) || 1), 0);
  }

  /**
   * Calcule la distance totale
   */
  function calculateDistance(steps) {
    if (!Array.isArray(steps)) return 0;
    return steps.reduce((total, step) => total + (parseInt(step.distance) || 0), 0);
  }

  /**
   * Formate une date
   */
  function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = Date.now();
    const diff = now - timestamp;

    // Moins d'1 heure
    if (diff < 3600000) {
      const mins = Math.floor(diff / 60000);
      return `il y a ${mins} min`;
    }

    // Moins de 24h
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `il y a ${hours}h`;
    }

    // Moins de 7 jours
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `il y a ${days} jour${days > 1 ? 's' : ''}`;
    }

    // Date complète
    return date.toLocaleDateString(currentLang, {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  }

  /**
   * Récupère le drapeau du pays
   */
  function getCountryFlag(countryCode) {
    const flags = {
      'IT': '🇮🇹',
      'FR': '🇫🇷',
      'ES': '🇪🇸',
      'PT': '🇵🇹',
      'GR': '🇬🇷',
      'HR': '🇭🇷',
      'SI': '🇸🇮',
      'MT': '🇲🇹',
      'CY': '🇨🇾',
      'MA': '🇲🇦',
      'TN': '🇹🇳',
      'JP': '🇯🇵',
      'PL': '🇵🇱'
    };
    return flags[countryCode?.toUpperCase()] || '🌍';
  }

  /**
   * Récupère l'image par défaut selon le pays
   */
  function getDefaultImage(country) {
    return `/assets/countries/${country?.toLowerCase()}.jpg`;
  }

  /**
   * Échappe le HTML
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Affiche un message de succès
   */
  function showSuccess(message) {
    showToast(message, 'success');
  }

  /**
   * Affiche un message d'erreur
   */
  function showError(message) {
    showToast(message, 'error');
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
    }, 3000);
  }

  // ===== STATISTIQUES =====

  /**
   * Affiche les statistiques globales
   */
  async function displayStats() {
    const trips = await window.ORT_STATE.getAllTrips();
    const statsContainer = document.querySelector('[data-stats-container], #statsContainer');
    
    if (!statsContainer) return;

    const totalNights = trips.reduce((sum, trip) => 
      sum + (trip.nights || calculateNights(trip.steps)), 0
    );
    
    const totalDistance = trips.reduce((sum, trip) => 
      sum + (trip.kms || calculateDistance(trip.steps)), 0
    );

    const countries = [...new Set(trips.map(t => t.country).filter(Boolean))];

    statsContainer.innerHTML = `
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">${trips.length}</div>
          <div class="stat-label">Voyage${trips.length > 1 ? 's' : ''}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${totalNights}</div>
          <div class="stat-label">Nuit${totalNights > 1 ? 's' : ''}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${totalDistance}</div>
          <div class="stat-label">Kilomètres</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${countries.length}</div>
          <div class="stat-label">Pays</div>
        </div>
      </div>
    `;
  }

  // ===== API PUBLIQUE =====
  window.ORT_DASHBOARD_ADAPTER = {
    init,
    loadTrips,
    openTrip,
    deleteTrip,
    displayStats
  };

  console.log('✅ [DASHBOARD] Adaptateur chargé');

})();