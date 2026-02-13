/**
 * OneRoadTrip - Gestion des hôtels
 * Charge et affiche les hôtels scrapés depuis Booking.com
 * Utilisé par roadtrip_detail.html, roadtrip_detail_simple.html, roadtrip_mobile.html, roadtrip-editor.html
 */

(function(global) {
  'use strict';

  // === CONFIGURATION ===
  const CONFIG = {
    hotelsBaseUrl: '/hotels', // Base URL pour les fichiers JSON
    maxHotelsPerPlace: 5,     // Nombre max d'hôtels à afficher
    cacheTimeout: 3600000,    // 1 heure en ms
    stay22AID: 'oneroadtrip'  // AID Stay22 pour affiliation
  };

  // Cache en mémoire
  const CACHE = {
    data: {},
    timestamps: {}
  };

  // === I18N ===
  const I18N = {
    topHotels: { 
      fr: 'Meilleurs hôtels', 
      en: 'Top hotels', 
      es: 'Mejores hoteles',
      pt: 'Melhores hotéis', 
      it: 'Migliori hotel', 
      ar: 'أفضل الفنادق'
    },
    chooseOnMap: {
      fr: 'Choisir sur la carte',
      en: 'Choose on map',
      es: 'Elegir en el mapa',
      pt: 'Escolher no mapa',
      it: 'Scegli sulla mappa',
      ar: 'اختر على الخريطة'
    },
    loading: {
      fr: 'Chargement des hôtels...',
      en: 'Loading hotels...',
      es: 'Cargando hoteles...',
      pt: 'Carregando hotéis...',
      it: 'Caricamento hotel...',
      ar: 'جار تحميل الفنادق...'
    },
    noHotels: {
      fr: 'Aucun hôtel disponible',
      en: 'No hotels available',
      es: 'No hay hoteles disponibles',
      pt: 'Nenhum hotel disponível',
      it: 'Nessun hotel disponibile',
      ar: 'لا توجد فنادق متاحة'
    },
    viewHotels: {
      fr: 'Voir les hôtels',
      en: 'View hotels',
      es: 'Ver hoteles',
      pt: 'Ver hotéis',
      it: 'Vedi hotel',
      ar: 'عرض الفنادق'
    }
  };

  function t(key) {
    const lang = getLang();
    return I18N[key]?.[lang] || I18N[key]?.fr || key;
  }

  // === UTILITAIRES ===
  
  function getLang() {
    return (localStorage.getItem('lang') || document.documentElement.lang || 'fr').slice(0, 2);
  }

  function getBookingLangSuffix() {
    const lang = getLang();
    const suffixes = { fr: 'fr', en: 'en-gb', es: 'es', pt: 'pt-pt', it: 'it', ar: 'ar' };
    return suffixes[lang] || 'en-gb';
  }

  function getCountryCode() {
    return (window.CC || window.state?.cc || window.state?.country || 'FR').toUpperCase();
  }

  function parsePlaceId(placeId) {
    // Format: "FR::propriano" -> { country: "FR", slug: "propriano", initial: "p" }
    if (!placeId || typeof placeId !== 'string') return null;
    
    const parts = placeId.split('::');
    if (parts.length < 2) return null;
    
    const country = parts[0].toUpperCase();
    const slug = parts[1];
    const initial = slug[0].toLowerCase();
    
    return { country, slug, initial };
  }

  function buildStay22Url(placeName, coords, lang, cc) {
    // Utiliser ORT_PARTNERS si disponible
    if (window.ORT_PARTNERS && window.ORT_PARTNERS.AFFILIATE && window.ORT_PARTNERS.AFFILIATE.stay22) {
      return window.ORT_PARTNERS.AFFILIATE.stay22(placeName, coords, lang);
    }
    
    // Fallback manuel - Carte interactive Stay22
    const lat = coords[0];
    const lng = coords[1];
    
    const params = new URLSearchParams({
      aid: CONFIG.stay22AID,
      lat: lat.toFixed(6),
      lng: lng.toFixed(6),
      venue: placeName,
      maincolor: '113f7a',  // Bleu ORT
      markerimage: 'https://www.oneroadtrip.com/assets/marker-ort.png'
    });
    
    return `https://www.stay22.com/embed/gm?${params.toString()}`;
  }

  function buildBookingAffiliateUrl(originalUrl, lang, cc) {
    if (!originalUrl) return '#';
    
    // Extraire pays et slug de l'URL Booking
    const match = originalUrl.match(/https:\/\/www\.booking\.com\/hotel\/([a-z]{2})\/([^.?]+)/);
    if (!match) return originalUrl;
    
    const hotelCountry = match[1];
    const hotelSlug = match[2];
    const langSuffix = getBookingLangSuffix();
    
    // Lien Booking direct avec TON AID - Le script LMA Stay22 va le tracker automatiquement
    return `https://www.booking.com/hotel/${hotelCountry}/${hotelSlug}.${langSuffix}.html?aid=${CONFIG.stay22AID}`;
  }

  // === CHARGEMENT DES DONNÉES ===
  
  async function loadHotelsForPlace(placeId) {
    const parsed = parsePlaceId(placeId);
    if (!parsed) {
      console.warn('[ORT-HOTELS] PlaceId invalide:', placeId);
      return null;
    }
    
    const { country, initial } = parsed;
    const cacheKey = `${country}/${initial}`;
    
    // Vérifier le cache
    const now = Date.now();
    if (CACHE.data[cacheKey] && (now - CACHE.timestamps[cacheKey]) < CONFIG.cacheTimeout) {
      console.log('[ORT-HOTELS] Cache hit:', cacheKey);
      return CACHE.data[cacheKey][placeId] || null;
    }
    
    // Charger depuis le serveur
    const url = `${CONFIG.hotelsBaseUrl}/${country}/${initial}.json`;
    console.log('[ORT-HOTELS] Chargement:', url);
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.warn('[ORT-HOTELS] Fichier introuvable:', url);
        return null;
      }
      
      const data = await response.json();
      CACHE.data[cacheKey] = data;
      CACHE.timestamps[cacheKey] = now;
      
      return data[placeId] || null;
    } catch (error) {
      console.error('[ORT-HOTELS] Erreur chargement:', url, error);
      return null;
    }
  }

  async function loadHotelsForMultiplePlaces(placeIds) {
    // Grouper par fichier (country/initial)
    const groups = {};
    
    placeIds.forEach(placeId => {
      const parsed = parsePlaceId(placeId);
      if (!parsed) return;
      
      const key = `${parsed.country}/${parsed.initial}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(placeId);
    });
    
    // Charger tous les fichiers en parallèle
    const promises = Object.keys(groups).map(async key => {
      const [country, initial] = key.split('/');
      const url = `${CONFIG.hotelsBaseUrl}/${country}/${initial}.json`;
      
      try {
        const response = await fetch(url);
        if (!response.ok) return null;
        
        const data = await response.json();
        CACHE.data[key] = data;
        CACHE.timestamps[key] = Date.now();
        
        return data;
      } catch (error) {
        console.error('[ORT-HOTELS] Erreur:', url, error);
        return null;
      }
    });
    
    await Promise.all(promises);
    
    // Extraire les données pour chaque placeId
    const results = {};
    placeIds.forEach(placeId => {
      const parsed = parsePlaceId(placeId);
      if (!parsed) return;
      
      const key = `${parsed.country}/${parsed.initial}`;
      const fileData = CACHE.data[key];
      
      if (fileData && fileData[placeId]) {
        results[placeId] = fileData[placeId];
      }
    });
    
    return results;
  }

  // === AFFICHAGE ===
  
  function renderHotelMiniCard(hotel, lang, cc) {
    const hotelLink = buildBookingAffiliateUrl(hotel.bookingUrl, lang, cc);
    const imgUrl = hotel.imageUrl ? hotel.imageUrl.replace('square240', 'square600') : '';
    
    return `
      <a href="${hotelLink}" target="_blank" rel="noopener sponsored" class="hotel-mini-card">
        <img src="${imgUrl}" alt="${hotel.name}" class="hotel-mini-img" loading="lazy">
        <div class="hotel-mini-info">
          <span class="hotel-mini-score">${hotel.score}</span>
          <span class="hotel-mini-name">${hotel.name}</span>
        </div>
      </a>
    `;
  }

  function renderHotelsCarousel(hotels, placeName, coords, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const lang = getLang();
    const cc = getCountryCode();
    
    if (!hotels || hotels.length === 0) {
      container.innerHTML = `<div class="hotels-empty">${t('noHotels')}</div>`;
      return;
    }
    
    const hotelsToShow = hotels.slice(0, CONFIG.maxHotelsPerPlace);
    const cardsHtml = hotelsToShow.map(h => renderHotelMiniCard(h, lang, cc)).join('');
    
    const stay22Url = buildStay22Url(placeName, coords, lang, cc);
    
    container.innerHTML = `
      <div class="hotels-mini-section">
        <div class="hotels-mini-header">${t('topHotels')}</div>
        <div class="hotels-mini-carousel">
          ${cardsHtml}
          <a href="${stay22Url}" target="_blank" rel="noopener" class="hotel-choose-map">
            <span class="hotel-choose-map-icon">🗺️</span>
            <span class="hotel-choose-map-text">${t('chooseOnMap')}</span>
          </a>
        </div>
      </div>
    `;
  }

  // === MODALE HÔTELS (pour mobile/detail) ===
  
  function openHotelsModal(step, stepIndex) {
    const modal = document.getElementById('hotelsModal');
    if (!modal) {
      console.warn('[ORT-HOTELS] Modale introuvable');
      return;
    }
    
    const placeName = step?.name || 'cette destination';
    const placeId = step?.place_id;
    // Gérer à la fois step.coords (hotels_scrape.json) et step.lat/lon (roadtrip)
    const coords = step?.coords || (step?.lat && step?.lon ? [step.lat, step.lon] : [0, 0]);
    
    console.log('[ORT-HOTELS] openHotelsModal - step:', {
      name: step?.name,
      place_id: placeId,
      coords: coords,
      lat: step?.lat,
      lon: step?.lon
    });
    
    const modalTitle = document.getElementById('hotelsModalTitle');
    const modalContainer = document.getElementById('hotelsModalContainer');
    const modalChooseBtn = document.getElementById('hotelsModalChooseMap');
    
    if (modalTitle) {
      modalTitle.textContent = `${t('topHotels')} - ${placeName}`;
    }
    
    if (modalContainer) {
      modalContainer.innerHTML = `<div class="hotels-modal-loading">${t('loading')}</div>`;
    }
    
    // Charger les hôtels
    loadHotelsForPlace(placeId).then(placeData => {
      if (!placeData || !placeData.hotels || placeData.hotels.length === 0) {
        if (modalContainer) {
          modalContainer.innerHTML = `<div class="hotels-modal-empty">${t('noHotels')}</div>`;
        }
        return;
      }
      
      const lang = getLang();
      const hotelCountry = (placeData.country || 'FR').toLowerCase(); // Pays de l'hôtel
      const hotelsHtml = placeData.hotels.slice(0, CONFIG.maxHotelsPerPlace).map(h => {
        const hotelLink = buildBookingAffiliateUrl(h.bookingUrl, lang, hotelCountry);
        const imgUrl = h.imageUrl ? h.imageUrl.replace('square240', 'square600') : '';
        
        return `
          <a href="${hotelLink}" target="_blank" rel="noopener sponsored" class="hotel-modal-card">
            <img src="${imgUrl}" alt="${h.name}" class="hotel-modal-img" loading="lazy">
            <div class="hotel-modal-info">
              <div class="hotel-modal-name">${h.name}</div>
              <div class="hotel-modal-rating">
                <span class="hotel-modal-score">${h.score}</span>
                ${h.reviews > 0 ? `<span class="hotel-modal-reviews">(${h.reviews} avis)</span>` : ''}
              </div>
            </div>
          </a>
        `;
      }).join('');
      
      if (modalContainer) {
        modalContainer.innerHTML = hotelsHtml;
      }
    }).catch(err => {
      console.error('[ORT-HOTELS] Erreur chargement:', err);
      if (modalContainer) {
        modalContainer.innerHTML = `<div class="hotels-modal-error">${t('noHotels')}</div>`;
      }
    });
    
    // Bouton "Choisir sur la carte"
    if (modalChooseBtn) {
      const lang = getLang();
      const cc = getCountryCode();
      const stay22Url = buildStay22Url(placeName, coords, lang, cc);
      
      modalChooseBtn.href = stay22Url;
      modalChooseBtn.innerHTML = `
        <span class="hotel-choose-icon">🗺️</span>
        <span>${t('chooseOnMap')}</span>
      `;
    }
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    console.log('[ORT-HOTELS] Modale ouverte:', placeName);
  }

  function closeHotelsModal() {
    const modal = document.getElementById('hotelsModal');
    if (modal) {
      modal.classList.remove('show');
      document.body.style.overflow = '';
    }
  }

  // === INITIALISATION ===
  
  function init() {
    // Écouteurs globaux
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeHotelsModal();
      }
    });
    
    // Fermer au clic sur overlay
    const modal = document.getElementById('hotelsModal');
    if (modal) {
      modal.addEventListener('click', function(e) {
        if (e.target === this) {
          closeHotelsModal();
        }
      });
    }
    
    console.log('[ORT-HOTELS] ✅ Module chargé');
  }

  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // === EXPORT ===
  
  const ORT_HOTELS = {
    CONFIG,
    I18N,
    
    // Utilitaires
    getLang,
    getCountryCode,
    parsePlaceId,
    buildStay22Url,
    buildBookingAffiliateUrl,
    
    // Chargement
    loadHotelsForPlace,
    loadHotelsForMultiplePlaces,
    
    // Affichage
    renderHotelMiniCard,
    renderHotelsCarousel,
    
    // Modale
    openHotelsModal,
    closeHotelsModal
  };

  // Export global
  global.ORT_HOTELS = ORT_HOTELS;
  
  // Raccourcis pour compatibilité
  global.openHotelsModal = openHotelsModal;
  global.closeHotelsModal = closeHotelsModal;

})(typeof window !== 'undefined' ? window : this);
