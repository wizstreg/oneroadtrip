/**
 * OneRoadTrip - Système Budget
 * Gère le suivi du budget, les catégories et l'affichage modal
 * Utilisé par roadtrip_detail.html, roadtrip_detail_simple.html, roadtrip_mobile.html
 */

(function(global) {
  'use strict';

  // === CONFIGURATION CATÉGORIES ===
  const BUDGET_CATEGORIES = {
    transport: { icon: '✈️', keys: ['flight', 'car_rental', 'transfer'], label: 'budgetTransport' },
    accommodation: { icon: '🏨', keys: ['hotel'], label: 'budgetAccommodation' },
    activities: { icon: '🎯', keys: ['activity', 'visit', 'show'], label: 'budgetActivities' },
    other: { icon: '📋', keys: ['insurance', 'other'], label: 'budgetOther' }
  };

  // Libelles des categories, ranges ICI pour ne dependre d'aucun autre fichier.
  // Avant, ils etaient demandes au dictionnaire general, qui ne les connait pas :
  // la fenetre affichait "budgetTransport" et "budgetAccommodation" en clair.
  const BUDGET_LABELS = {
    budgetTransport:     { fr: 'Transport',   en: 'Transport',     es: 'Transporte',  it: 'Trasporto', pt: 'Transporte', nl: 'Vervoer',       de: 'Transport',    ar: '\u0627\u0644\u0646\u0642\u0644' },
    budgetAccommodation: { fr: 'H\u00e9bergement', en: 'Accommodation', es: 'Alojamiento', it: 'Alloggio',  pt: 'Alojamento', nl: 'Accommodatie',  de: 'Unterkunft',   ar: '\u0627\u0644\u0625\u0642\u0627\u0645\u0629' },
    budgetActivities:    { fr: 'Activit\u00e9s',   en: 'Activities',    es: 'Actividades', it: 'Attivit\u00e0', pt: 'Atividades', nl: 'Activiteiten',  de: 'Aktivit\u00e4ten',  ar: '\u0627\u0644\u0623\u0646\u0634\u0637\u0629' },
    budgetOther:         { fr: 'Autres',      en: 'Other',         es: 'Otros',       it: 'Altro',     pt: 'Outros',     nl: 'Overige',       de: 'Sonstiges',    ar: '\u0623\u062e\u0631\u0649' },
    noBudget:            { fr: 'Aucune r\u00e9servation', en: 'No bookings', es: 'Sin reservas', it: 'Nessuna prenotazione', pt: 'Sem reservas', nl: 'Geen boekingen', de: 'Keine Buchungen', ar: '\u0644\u0627 \u062a\u0648\u062c\u062f \u062d\u062c\u0648\u0632\u0627\u062a' }
  };
  function budgetLang() {
    try {
      const l = (typeof global.ORT_getLang === 'function') ? global.ORT_getLang()
        : (document.documentElement.lang || 'en');
      return String(l || 'en').slice(0, 2).toLowerCase();
    } catch (e) { return 'en'; }
  }
  // Libelle d'une cle : notre liste d'abord, sinon le dictionnaire general,
  // et jamais le nom brut de la cle.
  function label(key) {
    const own = BUDGET_LABELS[key];
    if (own) return own[budgetLang()] || own.en;
    if (typeof global.t === 'function') {
      const v = global.t(key);
      if (v && v !== key) return v;
    }
    return '';
  }

  // État du budget
  let budgetData = { total: 0, byCategory: {}, items: [], currency: 'EUR', unconverted: [] };

  // Format montant + devise du voyage
  function fmt(amount, decimals) {
    const cur = budgetData.currency || 'EUR';
    if (global.ORT_CURRENCY && global.ORT_CURRENCY.format) {
      return global.ORT_CURRENCY.format(amount, cur, decimals);
    }
    const d = (decimals == null) ? 0 : decimals;
    return (Number(amount) || 0).toFixed(d) + ' ' + cur;
  }

  // === FONCTIONS PRINCIPALES ===

  async function loadBudgetData() {
    if (!window.ORT_TRIP_DATA) return;
    
    // En mode Dashboard, utiliser le tripId de l'URL
    const params = new URLSearchParams(location.search);
    const tripIdFromUrl = params.get('tripId') || params.get('id');
    const tripId = tripIdFromUrl || window.state?.tripId || (window.ORT_TRIPID ? ORT_TRIPID.get() : null);
    
    if (!tripId) {
      console.log('[BUDGET] Pas de tripId trouvé');
      return;
    }
    
    console.log('[BUDGET] Chargement données pour tripId:', tripId);
    await ORT_TRIP_DATA.loadTrip(tripId);
    
    // === INJECTER LES PHOTOS UTILISATEUR DANS state.steps ===
    if (window.state?.steps) {
      window.state.steps.forEach((step, i) => {
        const userPhotos = ORT_TRIP_DATA.getStepPhotos(i) || [];
        if (userPhotos.length > 0) {
          const catalogPhotos = step.images || [];
          const combined = [...userPhotos];
          catalogPhotos.forEach(p => {
            if (p && !combined.includes(p)) combined.push(p);
          });
          step.images = combined;
          console.log(`[PHOTOS] Étape ${i+1}: ${userPhotos.length} photos utilisateur injectées`);
        }
      });
      // Re-render si des photos ont été injectées
      if (window.state.steps.some((s, i) => (ORT_TRIP_DATA.getStepPhotos(i) || []).length > 0)) {
        if (typeof renderRows === 'function') {
          console.log('[PHOTOS] Re-render des étapes avec photos utilisateur');
          renderRows();
        }
      }
    }
    
    const travelBookings = ORT_TRIP_DATA.getTravelBookings() || [];
    const allBookings = [...travelBookings];
    
    // Collect step bookings (deduplicated)
    const seenBookingIds = new Set();
    if (window.state?.steps) {
      window.state.steps.forEach((step, i) => {
        const stepBookings = ORT_TRIP_DATA.getStepBookings(i) || [];
        stepBookings.forEach(b => {
          const bookingId = b.id || `${b.name}-${b.date_start}`;
          if (!seenBookingIds.has(bookingId)) {
            seenBookingIds.add(bookingId);
            allBookings.push({ ...b, stepName: step.name || `Étape ${i+1}` });
          }
        });
      });
    }
    
    // Devise du voyage (par defaut EUR si non definie)
    const tripCurrency = (global.ORT_CURRENCY && global.ORT_CURRENCY.getTripCurrency(tripId)) || 'EUR';

    // Calculate totals
    budgetData = { total: 0, byCategory: { transport: 0, accommodation: 0, activities: 0, other: 0 }, items: [], currency: tripCurrency, unconverted: [] };
    
    allBookings.forEach(b => {
      const isObj = b.price && typeof b.price === 'object';
      const price = isObj ? b.price.amount : b.price;
      const amount = parseFloat(price) || 0;
      if (amount <= 0) return;

      // Devise de la resa: celle du prix objet, sinon on suppose la devise voyage (resas anciennes)
      const itemCurrency = (isObj && b.price.currency ? String(b.price.currency) : tripCurrency).toUpperCase();

      // Si la resa est dans une autre devise (conversion ratee ou import ancien), on ne melange pas
      if (itemCurrency !== tripCurrency.toUpperCase()) {
        budgetData.unconverted.push({ ...b, amount, itemCurrency });
        return;
      }

      budgetData.total += amount;
      budgetData.items.push({ ...b, amount });
      
      // Categorize
      let found = false;
      for (const [cat, def] of Object.entries(BUDGET_CATEGORIES)) {
        if (def.keys.includes(b.category)) {
          budgetData.byCategory[cat] += amount;
          found = true;
          break;
        }
      }
      if (!found) budgetData.byCategory.other += amount;
    });
    
    updateBudgetBadge();
  }

  function updateBudgetBadge() {
    const badge = document.getElementById('budgetBadge');
    const amount = document.getElementById('budgetAmount');
    if (!badge || !amount) return;
    
    if (budgetData.total > 0) {
      badge.style.display = 'inline-flex';
      amount.textContent = fmt(budgetData.total, 0);
      badge.title = typeof t === 'function' ? t('budgetTooltip') : 'Budget total';
    } else {
      badge.style.display = 'none';
    }
  }

  function openBudgetModal() {
    const modal = document.getElementById('budgetModal');
    if (!modal) return;
    
    const tFunc = label;
    
    // Update total
    const totalDisplay = document.getElementById('budgetTotalDisplay');
    if (totalDisplay) totalDisplay.textContent = fmt(budgetData.total, 2);
    
    // Update categories
    const catHtml = Object.entries(BUDGET_CATEGORIES).map(([key, def]) => {
      const val = budgetData.byCategory[key] || 0;
      if (val <= 0) return '';
      const pct = budgetData.total > 0 ? Math.round(val / budgetData.total * 100) : 0;
      return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f1f5f9;color:#113f7a;">
        <span>${def.icon} ${tFunc(def.label)}</span>
        <span style="font-weight:600;color:#113f7a;">${fmt(val, 0)} <span style="color:#64748b;font-size:0.8rem;">(${pct}%)</span></span>
      </div>`;
    }).join('');
    
    const catContainer = document.getElementById('budgetCategories');
    if (catContainer) {
      catContainer.innerHTML = catHtml || `<div style="color:#64748b;text-align:center;padding:20px;">${tFunc('noBudget')}</div>`;
    }
    
    // Update items list
    const itemsHtml = budgetData.items.map(item => {
      const icon = { flight:'✈️', car_rental:'🚗', hotel:'🏨', activity:'🎯', visit:'🏛️', show:'🎭', insurance:'🛡️' }[item.category] || '📋';
      return `<div style="display:flex;align-items:center;gap:10px;padding:10px;background:#f8fafc;border-radius:8px;margin-bottom:6px;">
        <span style="font-size:1.2rem;">${icon}</span>
        <div style="flex:1;">
          <div style="font-weight:600;font-size:0.9rem;color:#113f7a;">${item.name || 'Réservation'}</div>
          <div style="font-size:0.75rem;color:#64748b;">${item.date_start || ''} ${item.stepName ? '• ' + item.stepName : ''}</div>
        </div>
        <div style="font-weight:700;color:#166534;">${fmt(item.amount, 0)}</div>
      </div>`;
    }).join('');
    
    const itemsContainer = document.getElementById('budgetItems');
    if (itemsContainer) {
      let warnHtml = '';
      if (budgetData.unconverted && budgetData.unconverted.length > 0) {
        const list = budgetData.unconverted
          .map(u => `${u.name || 'Réservation'} (${u.amount.toFixed(0)} ${u.itemCurrency})`)
          .join(', ');
        warnHtml = `<div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:10px;margin-bottom:10px;font-size:0.8rem;color:#92400e;">
          ⚠️ ${budgetData.unconverted.length} réservation(s) dans une autre devise, non comptée(s) dans le total : ${list}
        </div>`;
      }
      itemsContainer.innerHTML = warnHtml + itemsHtml;
    }
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeBudgetModal() {
    const modal = document.getElementById('budgetModal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  }

  function goToAddBooking() {
    closeBudgetModal();
    const tripId = window.ORT_TRIPID ? ORT_TRIPID.get() : window.state?.tripId;
    const params = new URLSearchParams(location.search);
    const cc = params.get('cc') || '';
    const itin = params.get('itin') || '';
    
    if (window.ORT_TRIPID) {
      ORT_TRIPID.navigateTo('rt-booking-import.html', { cc, itin });
    } else {
      location.href = `rt-booking-import.html?tripId=${tripId}&cc=${cc}&itin=${itin}`;
    }
  }

  // === GETTERS ===
  
  function getBudgetData() {
    return { ...budgetData };
  }

  function getBudgetTotal() {
    return budgetData.total;
  }

  // === INITIALISATION ===
  
  function init() {
    // Event listeners
    const badge = document.getElementById('budgetBadge');
    if (badge) badge.addEventListener('click', openBudgetModal);
    
    const modal = document.getElementById('budgetModal');
    if (modal) {
      modal.addEventListener('click', function(e) {
        if (e.target === this) closeBudgetModal();
      });
    }
    
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeBudgetModal();
    });
    
    // Écouter les événements de sauvegarde
    window.addEventListener('ort:trip-data-saved', loadBudgetData);
    
    // Refresh automatique des bookings quand on revient sur la page
    let lastDetailVisibilityTime = Date.now();
    document.addEventListener('visibilitychange', async function() {
      if (document.visibilityState === 'visible') {
        const timeSinceHidden = Date.now() - lastDetailVisibilityTime;
        if (timeSinceHidden > 2000 && window.ORT_TRIP_DATA) {
          console.log('[BUDGET] Retour sur la page, refresh des bookings...');
          try {
            const tripId = window.ORT_TRIPID ? ORT_TRIPID.get() : null;
            if (tripId) {
              await ORT_TRIP_DATA.loadTrip(tripId);
              await loadBudgetData();
              console.log('[BUDGET] ✅ Bookings rafraîchis');
            }
          } catch (e) {
            console.warn('[BUDGET] Erreur refresh:', e);
          }
        }
      } else {
        lastDetailVisibilityTime = Date.now();
      }
    });
    
    console.log('[ORT-BUDGET] ✅ Module chargé');
  }

  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // === EXPORT ===
  
  const ORT_BUDGET = {
    // Config
    BUDGET_CATEGORIES,
    
    // Fonctions principales
    loadBudgetData,
    updateBudgetBadge,
    openBudgetModal,
    closeBudgetModal,
    goToAddBooking,
    
    // Getters
    getBudgetData,
    getBudgetTotal
  };

  // Export global
  global.ORT_BUDGET = ORT_BUDGET;
  
  // Raccourcis globaux pour compatibilité
  global.loadBudgetData = loadBudgetData;
  global.updateBudgetBadge = updateBudgetBadge;
  global.openBudgetModal = openBudgetModal;
  global.closeBudgetModal = closeBudgetModal;
  global.goToAddBooking = goToAddBooking;

})(typeof window !== 'undefined' ? window : this);
