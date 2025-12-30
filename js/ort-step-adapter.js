/**
 * =====================================================
 * ADAPTATEUR STATE MANAGER - ROADTRIP STEP
 * =====================================================
 * 
 * Gère les modifications dans roadtrip_step.html :
 * Hotels, Restaurants, Vols, Activités, POIs, Photos, Notes, Budget, Liens
 * 
 * @version 1.0.0
 */

(function() {
  'use strict';

  let currentTripId = null;
  let currentStepId = null;
  let watchersInitialized = false;

  function init(tripId, stepId) {
    currentTripId = tripId;
    currentStepId = stepId;
    console.log('🎯 [STEP] Init:', tripId, '/', stepId);

    if (!watchersInitialized) {
      setupWatchers();
      watchersInitialized = true;
    }
    setupSaveListeners();
  }

  function setupWatchers() {
    console.log('👀 [STEP] Setup watchers...');
    watchHotels();
    watchRestaurants();
    watchFlights();
    watchActivities();
    watchPOIs();
    watchPhotos();
    watchNotes();
    watchBudget();
    watchLinks();
    console.log('✅ [STEP] Watchers OK');
  }

  function watchHotels() {
    document.addEventListener('ort:hotel-added', (e) => {
      console.log('🏨 Hotel ajouté');
      markStepModified('hotels', { [`step_${currentStepId}_hotel`]: e.detail });
    });
    document.addEventListener('ort:hotel-updated', (e) => {
      console.log('✏️ Hotel modifié');
      markStepModified('hotels', { [`step_${currentStepId}_hotel`]: e.detail });
    });
    document.addEventListener('ort:hotel-removed', () => {
      console.log('🗑️ Hotel supprimé');
      markStepModified('hotels', { [`step_${currentStepId}_hotel`]: null });
    });
    const hotelInputs = '[name*="hotel"], .hotel-name, .hotel-address';
    document.addEventListener('input', (e) => {
      if (e.target.matches(hotelInputs)) {
        markStepModified('hotels', { [`step_${currentStepId}_hotel`]: collectHotelData() });
      }
    });
  }

  function watchRestaurants() {
    ['added', 'updated', 'removed'].forEach(action => {
      document.addEventListener(`ort:restaurant-${action}`, () => {
        console.log(`🍽️ Restaurant ${action}`);
        markStepModified('restaurants', { [`step_${currentStepId}_restaurants`]: collectRestaurantsData() });
      });
    });
    document.addEventListener('input', (e) => {
      if (e.target.matches('[name*="restaurant"], .restaurant-name')) {
        markStepModified('restaurants', { [`step_${currentStepId}_restaurants`]: collectRestaurantsData() });
      }
    });
  }

  function watchFlights() {
    ['added', 'updated', 'removed'].forEach(action => {
      document.addEventListener(`ort:flight-${action}`, () => {
        console.log(`✈️ Vol ${action}`);
        markStepModified('flights', { [`step_${currentStepId}_flights`]: collectFlightsData() });
      });
    });
    document.addEventListener('input', (e) => {
      if (e.target.matches('[name*="flight"], .flight-number')) {
        markStepModified('flights', { [`step_${currentStepId}_flights`]: collectFlightsData() });
      }
    });
  }

  function watchActivities() {
    ['added', 'updated', 'removed'].forEach(action => {
      document.addEventListener(`ort:activity-${action}`, () => {
        console.log(`🎯 Activité ${action}`);
        markStepModified('activities', { [`step_${currentStepId}_activities`]: collectActivitiesData() });
      });
    });
    document.addEventListener('input', (e) => {
      if (e.target.matches('[name*="activity"], .activity-name')) {
        markStepModified('activities', { [`step_${currentStepId}_activities`]: collectActivitiesData() });
      }
    });
  }

  function watchPOIs() {
    ['added', 'updated', 'removed'].forEach(action => {
      document.addEventListener(`ort:poi-${action}`, () => {
        console.log(`📍 POI ${action}`);
        markStepModified('pois', { [`step_${currentStepId}_pois`]: collectPOIsData() });
      });
    });
  }

  function watchPhotos() {
    ['added', 'removed'].forEach(action => {
      document.addEventListener(`ort:photo-${action}`, () => {
        console.log(`📸 Photo ${action}`);
        markStepModified('photos', { [`step_${currentStepId}_photos`]: collectPhotosData() });
      });
    });
  }

  function watchNotes() {
    const notesInputs = '[name*="note"], .step-notes, textarea.notes';
    document.addEventListener('input', (e) => {
      if (e.target.matches(notesInputs)) {
        console.log('📝 Notes modifiées');
        markStepModified('notes', { [`step_${currentStepId}_notes`]: e.target.value });
      }
    });
  }

  function watchBudget() {
    const budgetInputs = '[name*="budget"], [name*="price"], .budget-amount';
    document.addEventListener('input', (e) => {
      if (e.target.matches(budgetInputs)) {
        console.log('💰 Budget modifié');
        markStepModified('budget', { [`step_${currentStepId}_budget`]: collectBudgetData() });
      }
    });
  }

  function watchLinks() {
    ['added', 'removed'].forEach(action => {
      document.addEventListener(`ort:link-${action}`, () => {
        console.log(`🔗 Lien ${action}`);
        markStepModified('links', { [`step_${currentStepId}_links`]: collectLinksData() });
      });
    });
    document.addEventListener('input', (e) => {
      if (e.target.matches('[name*="link"], .link-url')) {
        markStepModified('links', { [`step_${currentStepId}_links`]: collectLinksData() });
      }
    });
  }

  // COLLECTION DONNÉES
  function collectHotelData() {
    const c = document.querySelector('[data-hotel-container], #hotelSection');
    if (!c) return null;
    return {
      name: c.querySelector('[name*="hotel-name"], .hotel-name')?.value || '',
      address: c.querySelector('[name*="hotel-address"], .hotel-address')?.value || '',
      price: c.querySelector('[name*="hotel-price"], .hotel-price')?.value || '',
      rating: c.querySelector('[name*="hotel-rating"], .hotel-rating')?.value || '',
      url: c.querySelector('[name*="hotel-url"], .hotel-url')?.value || '',
      timestamp: Date.now()
    };
  }

  function collectRestaurantsData() {
    const c = document.querySelector('[data-restaurants-container], #restaurantsSection');
    if (!c) return [];
    const items = c.querySelectorAll('.restaurant-item, [data-restaurant]');
    return Array.from(items).map((item, i) => ({
      id: item.dataset.id || `restaurant_${i}`,
      name: item.querySelector('.restaurant-name')?.value || '',
      type: item.querySelector('.restaurant-type')?.value || '',
      price: item.querySelector('.restaurant-price')?.value || ''
    }));
  }

  function collectFlightsData() {
    const c = document.querySelector('[data-flights-container], #flightsSection');
    if (!c) return [];
    const items = c.querySelectorAll('.flight-item, [data-flight]');
    return Array.from(items).map((item, i) => ({
      id: item.dataset.id || `flight_${i}`,
      number: item.querySelector('.flight-number')?.value || '',
      airline: item.querySelector('.flight-airline')?.value || '',
      from: item.querySelector('.flight-from')?.value || '',
      to: item.querySelector('.flight-to')?.value || '',
      date: item.querySelector('.flight-date')?.value || '',
      time: item.querySelector('.flight-time')?.value || ''
    }));
  }

  function collectActivitiesData() {
    const c = document.querySelector('[data-activities-container], #activitiesSection');
    if (!c) return [];
    const items = c.querySelectorAll('.activity-item, [data-activity]');
    return Array.from(items).map((item, i) => ({
      id: item.dataset.id || `activity_${i}`,
      name: item.querySelector('.activity-name')?.value || item.querySelector('.activity-name')?.textContent || '',
      time: item.querySelector('.activity-time')?.value || '',
      price: item.querySelector('.activity-price')?.value || ''
    }));
  }

  function collectPOIsData() {
    const c = document.querySelector('[data-pois-container], #poisSection');
    if (!c) return [];
    const items = c.querySelectorAll('.poi-item, [data-poi]');
    return Array.from(items).map((item, i) => ({
      id: item.dataset.id || item.dataset.poiId || `poi_${i}`,
      name: item.dataset.name || '',
      type: item.dataset.type || '',
      coords: item.dataset.coords ? item.dataset.coords.split(',').map(Number) : null,
      selected: item.classList.contains('selected') || item.dataset.selected === 'true'
    }));
  }

  function collectPhotosData() {
    const c = document.querySelector('[data-photos-container], #photosSection');
    if (!c) return [];
    const items = c.querySelectorAll('.photo-item, [data-photo]');
    return Array.from(items).map((item, i) => ({
      id: item.dataset.id || `photo_${i}`,
      url: item.dataset.url || item.src || '',
      caption: item.dataset.caption || ''
    }));
  }

  function collectBudgetData() {
    const c = document.querySelector('[data-budget-container], #budgetSection');
    if (!c) return {};
    const items = c.querySelectorAll('[data-budget-item]');
    const budget = {};
    items.forEach(item => {
      const cat = item.dataset.category;
      const amt = item.querySelector('.budget-amount')?.value;
      if (cat && amt) budget[cat] = parseFloat(amt) || 0;
    });
    return budget;
  }

  function collectLinksData() {
    const c = document.querySelector('[data-links-container], #linksSection');
    if (!c) return [];
    const items = c.querySelectorAll('.link-item, [data-link]');
    return Array.from(items).map((item, i) => ({
      id: item.dataset.id || `link_${i}`,
      url: item.querySelector('.link-url')?.value || item.querySelector('.link-url')?.href || '',
      title: item.querySelector('.link-title')?.value || item.querySelector('.link-title')?.textContent || ''
    }));
  }

  function markStepModified(section, data) {
    if (!currentTripId) return;
    window.ORT_STATE.markAsModified(currentTripId, section, data);
  }

  function setupSaveListeners() {
    window.addEventListener('blur', () => {
      if (currentTripId && window.ORT_STATE.hasPendingChanges(currentTripId)) {
        console.log('💾 [STEP] Auto-save');
        window.ORT_STATE.forceSave(currentTripId);
      }
    });
  }

  window.ORT_STEP_ADAPTER = {
    init,
    collectHotelData,
    collectRestaurantsData,
    collectFlightsData,
    collectActivitiesData,
    collectPOIsData,
    collectPhotosData,
    collectBudgetData,
    collectLinksData
  };

  console.log('✅ [STEP] Adaptateur chargé');
})();
