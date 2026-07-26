/**
 * OneRoadTrip - Widgets Travelpayouts
 * Gère les widgets affiliés : GetYourGuide, Ticketmaster, Location voiture
 * Utilisé par roadtrip_detail.html, roadtrip_detail_simple.html, roadtrip_mobile.html
 */

(function(global) {
  'use strict';

  // === CONFIGURATION TRAVELPAYOUTS ===
  const TRAVELPAYOUTS = {
    trs: '478677',
    shmarker: '688844'
  };

  // === UTILITAIRES ===
  
  function getWidgetLang() {
    return (localStorage.getItem('lang') || document.documentElement.lang || 'fr').slice(0,2);
  }

  function getWidgetLocale() {
    const lang = getWidgetLang();
    return { fr:'fr-FR', en:'en-US', es:'es-ES', it:'it-IT', pt:'pt-PT', ar:'en-US' }[lang] || 'en-US';
  }

  // === I18N WIDGETS ===
  const WIDGET_I18N = {
    loading: { fr:'Chargement...', en:'Loading...', es:'Cargando...', it:'Caricamento...', pt:'Carregando...', ar:'جار التحميل...' },
    errorLoad: { fr:'Impossible de charger. Cliquez ci-dessous.', en:'Unable to load. Click below.', es:'No se puede cargar. Haga clic abajo.', it:'Impossibile caricare. Clicca sotto.', pt:'Não foi possível carregar. Clique abaixo.', ar:'تعذر التحميل. انقر أدناه.' },
    // GYG
    activitiesNear: { fr:'Activités à proximité de', en:'Activities near', es:'Actividades cerca de', it:'Attività vicino a', pt:'Atividades perto de', ar:'أنشطة بالقرب من' },
    seeMoreActivities: { fr:'Voir toutes les activités à', en:'See all activities in', es:'Ver todas las actividades en', it:'Vedi tutte le attività a', pt:'Ver todas as atividades em', ar:'عرض جميع الأنشطة في' },
    // Ticketmaster
    showsNear: { fr:'Spectacles à', en:'Shows in', es:'Espectáculos en', it:'Spettacoli a', pt:'Espetáculos em', ar:'عروض في' },
    seeMoreShows: { fr:'Voir tous les spectacles', en:'See all shows', es:'Ver todos los espectáculos', it:'Vedi tutti gli spettacoli', pt:'Ver todos os espetáculos', ar:'عرض جميع العروض' }
  };

  function wt(key) {
    const lang = getWidgetLang();
    return WIDGET_I18N[key]?.[lang] || WIDGET_I18N[key]?.fr || key;
  }

  // === GETYOURGUIDE WIDGET ===
  
  function getGygDomain() {
    const lang = getWidgetLang();
    return { fr:'fr', en:'com', es:'es', it:'it', pt:'pt', ar:'com' }[lang] || 'com';
  }

  function openGygModal(step, idx) {
    const modal = document.getElementById('gygModal');
    const container = document.getElementById('gygWidgetContainer');
    const stepNameEl = document.getElementById('gygStepName');
    const moreLinkEl = document.getElementById('gygMoreLink');
    if (!modal || !container) return;
    
    const placeName = step?.name || 'cette destination';
    const locale = getWidgetLocale();
    const lang = locale.split('-')[0];
    const gygDomain = getGygDomain();
    
    // Récupérer la date de l'étape
    const stepDate = (typeof getStay22CheckinDate === 'function') ? getStay22CheckinDate(idx) : null;
    
    if (stepNameEl) {
      const dateDisplay = stepDate ? ` <span style="color:#64748b;font-size:0.9em;">(${new Date(stepDate).toLocaleDateString(locale)})</span>` : '';
      stepNameEl.innerHTML = `${wt('activitiesNear')} <strong>${placeName}</strong>${dateDisplay}`;
    }
    
    // Lien "Voir plus" vers GetYourGuide
    const moreUrl = `https://www.getyourguide.${gygDomain}/s/?q=${encodeURIComponent(placeName)}&partner_id=YQ9RFXj5`;
    if (moreLinkEl) {
      moreLinkEl.innerHTML = `
        <a href="${moreUrl}" target="_blank" rel="noopener" 
           style="display:inline-flex;align-items:center;gap:8px;padding:12px 24px;background:#113f7a;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;transition:background 0.2s;"
           onmouseover="this.style.background='#0d2f5c'" onmouseout="this.style.background='#113f7a'">
          🔍 ${wt('seeMoreActivities')} ${placeName}
        </a>
      `;
    }
    
    // URL du widget avec 6 items
    const widgetUrl = `https://trpwdg.com/content?trs=${TRAVELPAYOUTS.trs}&shmarker=${TRAVELPAYOUTS.shmarker}&place=${encodeURIComponent(placeName)}&items=6&locale=${locale}&powered_by=true&campaign_id=108&promo_id=4039`;
    
    // Afficher loader puis charger le widget
    container.innerHTML = `<div style="text-align:center;padding:40px;color:#64748b;">${wt('loading')}</div>`;
    
    // Créer et injecter le script
    const script = document.createElement('script');
    script.src = widgetUrl;
    script.async = true;
    script.charset = 'utf-8';
    
    container.innerHTML = '';
    container.appendChild(script);
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    console.log('[GYG] Modal ouverte pour:', placeName, '| date:', stepDate, '| locale:', locale);
  }

  function closeGygModal() {
    const modal = document.getElementById('gygModal');
    if (modal) {
      modal.classList.remove('show');
      document.body.style.overflow = '';
      const container = document.getElementById('gygWidgetContainer');
      if (container) container.innerHTML = '';
    }
  }

  // === TICKETMASTER WIDGET ===
  
  function getCountryFromCC() {
    const cc = (window.CC || window.state?.cc || window.state?.country || '').toUpperCase();
    const supported = ['US','CA','MX','AU','NZ','GB','IE','DE','FR','ES','IT','NL','BE','AT','CH','PL','SE','NO','DK','FI'];
    return supported.includes(cc) ? cc : 'FR';
  }

  function openTicketmasterModal(step, idx) {
    const modal = document.getElementById('ticketmasterModal');
    const container = document.getElementById('tmWidgetContainer');
    const stepNameEl = document.getElementById('tmStepName');
    const moreLinkEl = document.getElementById('tmMoreLink');
    if (!modal || !container) return;
    
    const placeName = step?.name || 'cette destination';
    const locale = getWidgetLocale();
    const lang = locale.split('-')[0];
    const country = getCountryFromCC();
    
    // Récupérer la date de l'étape
    let startDate = '';
    if (typeof getStay22CheckinDate === 'function') {
      startDate = getStay22CheckinDate(idx) || '';
    }
    if (!startDate) {
      startDate = new Date().toISOString().split('T')[0];
    }
    
    if (stepNameEl) {
      const dateDisplay = ` <span style="color:#64748b;font-size:0.9em;">(${new Date(startDate).toLocaleDateString(locale)})</span>`;
      stepNameEl.innerHTML = `${wt('showsNear')} <strong>${placeName}</strong>${dateDisplay}`;
    }
    
    // Lien "Voir plus" vers Ticketmaster
    const moreUrl = `https://www.ticketmaster.com/search?q=${encodeURIComponent(placeName)}&startDate=${startDate}`;
    if (moreLinkEl) {
      moreLinkEl.innerHTML = `
        <a href="${moreUrl}" target="_blank" rel="noopener" 
           style="display:inline-flex;align-items:center;gap:8px;padding:12px 24px;background:#026cdf;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;transition:background 0.2s;"
           onmouseover="this.style.background='#0653b6'" onmouseout="this.style.background='#026cdf'">
          🔍 ${wt('seeMoreShows')}
        </a>
      `;
    }
    
    // URL du widget Ticketmaster via Travelpayouts
    const widgetUrl = `https://trpwdg.com/content?trs=${TRAVELPAYOUTS.trs}&start_date=${startDate}&country=${country}&sort=relevance%2Cdesc&powered_by=true&min_lines=5&promo_id=5431&shmarker=${TRAVELPAYOUTS.shmarker}&campaign_id=183`;
    
    console.log('[TICKETMASTER] Widget URL:', widgetUrl);
    
    // Afficher loader
    container.innerHTML = `<div style="text-align:center;padding:40px;color:#64748b;">${wt('loading')}</div>`;
    
    // Créer et injecter le script
    const script = document.createElement('script');
    script.src = widgetUrl;
    script.async = true;
    script.charset = 'utf-8';
    
    // Timeout fallback
    const loadTimeout = setTimeout(() => {
      if (!container.querySelector('[class*="trp"]') && !container.querySelector('a[href*="ticket"]')) {
        container.innerHTML = `
          <div style="text-align:center;padding:30px;color:#64748b;">
            <div style="font-size:2rem;margin-bottom:10px;">🎭</div>
            <p>${wt('errorLoad')}</p>
            <a href="${moreUrl}" target="_blank" rel="noopener" 
               style="display:inline-block;margin-top:12px;padding:12px 24px;background:#026cdf;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">
              🔍 ${wt('seeMoreShows')}
            </a>
          </div>
        `;
      }
    }, 5000);
    
    script.onload = () => {
      clearTimeout(loadTimeout);
      console.log('[TICKETMASTER] Script chargé OK');
    };
    
    script.onerror = () => {
      clearTimeout(loadTimeout);
      console.error('[TICKETMASTER] Erreur chargement');
      container.innerHTML = `
        <div style="text-align:center;padding:30px;color:#64748b;">
          <div style="font-size:2rem;margin-bottom:10px;">🎭</div>
          <p>${wt('errorLoad')}</p>
          <a href="${moreUrl}" target="_blank" rel="noopener" 
             style="display:inline-block;margin-top:12px;padding:12px 24px;background:#026cdf;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">
            🔍 ${wt('seeMoreShows')}
          </a>
        </div>
      `;
    };
    
    container.innerHTML = '';
    container.appendChild(script);
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    console.log('[TICKETMASTER] Modal ouverte | place:', placeName, '| country:', country, '| date:', startDate);
  }

  function closeTicketmasterModal() {
    const modal = document.getElementById('ticketmasterModal');
    if (modal) {
      modal.classList.remove('show');
      document.body.style.overflow = '';
      const container = document.getElementById('tmWidgetContainer');
      if (container) container.innerHTML = '';
    }
  }

  // === CAR RENTAL WIDGET ===
  
  function openCarRentalModal() {
    const modal = document.getElementById('carRentalModal');
    const container = document.getElementById('carWidgetContainer');
    if (!modal || !container) return;
    
    const lang = getWidgetLang();
    const locale = { fr:'fr', en:'en', es:'es', it:'it', pt:'pt', ar:'en' }[lang] || 'en';
    
    // URL du widget voiture
    const widgetUrl = `https://trpwdg.com/content?trs=${TRAVELPAYOUTS.trs}&shmarker=${TRAVELPAYOUTS.shmarker}&locale=${locale}&powered_by=true&campaign_id=172&promo_id=4850`;
    
    console.log('[CAR RENTAL] Widget URL:', widgetUrl);
    
    // Afficher loader
    container.innerHTML = `<div style="text-align:center;padding:40px;color:#64748b;">${wt('loading')}</div>`;
    
    // Créer et injecter le script
    const script = document.createElement('script');
    script.src = widgetUrl;
    script.async = true;
    script.charset = 'utf-8';
    
    script.onload = () => console.log('[CAR RENTAL] Script chargé OK');
    script.onerror = () => console.error('[CAR RENTAL] Erreur chargement');
    
    container.innerHTML = '';
    container.appendChild(script);
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    console.log('[CAR RENTAL] Modal ouverte');
  }

  function closeCarRentalModal() {
    const modal = document.getElementById('carRentalModal');
    if (modal) {
      modal.classList.remove('show');
      document.body.style.overflow = '';
      const container = document.getElementById('carWidgetContainer');
      if (container) container.innerHTML = '';
    }
  }

  // === TIQETS (lien direct - utilise ORT_PARTNERS si disponible) ===
  
  function openTiqetsModal(step, idx) {
    const placeName = step?.name || '';
    const lang = getWidgetLang();
    
    // Récupérer la date de l'étape
    let dateParam = '';
    if (typeof getStay22CheckinDate === 'function') {
      const stepDate = getStay22CheckinDate(idx);
      if (stepDate) {
        dateParam = `&date=${stepDate}`;
      }
    }
    
    // Utiliser ORT_PARTNERS si disponible, sinon lien direct
    let tiqetsUrl;
    if (window.ORT_PARTNERS && window.ORT_PARTNERS.AFFILIATE) {
      tiqetsUrl = window.ORT_PARTNERS.AFFILIATE.tiqets(placeName, lang) + dateParam;
    } else {
      tiqetsUrl = `https://tiqets.tpo.li/L1uxd085?q=${encodeURIComponent(placeName)}${dateParam}&lang=${lang}`;
    }
    
    console.log('[TIQETS] Redirection vers:', tiqetsUrl);
    window.open(tiqetsUrl, '_blank', 'noopener');
  }

  function closeTiqetsModal() {
    // Pas de modal pour Tiqets (lien direct)
  }

  // === INITIALISATION ===
  
  function init() {
    // Écouteurs globaux pour fermer les modales
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeGygModal();
        closeTicketmasterModal();
        closeCarRentalModal();
      }
    });
    
    // Fermer au clic sur overlay
    ['gygModal', 'ticketmasterModal', 'carRentalModal'].forEach(id => {
      const modal = document.getElementById(id);
      if (modal) {
        modal.addEventListener('click', function(e) {
          if (e.target === this) {
            if (id === 'gygModal') closeGygModal();
            else if (id === 'ticketmasterModal') closeTicketmasterModal();
            else if (id === 'carRentalModal') closeCarRentalModal();
          }
        });
      }
    });
    
    console.log('[ORT-WIDGETS] ✅ Module chargé');
  }

  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // === EXPORT ===
  
  const ORT_WIDGETS = {
    // Config
    TRAVELPAYOUTS,
    WIDGET_I18N,
    
    // Utilitaires
    getWidgetLang,
    getWidgetLocale,
    wt,
    
    // GYG
    openGygModal,
    closeGygModal,
    
    // Ticketmaster
    openTicketmasterModal,
    closeTicketmasterModal,
    getCountryFromCC,
    
    // Car Rental
    openCarRentalModal,
    closeCarRentalModal,
    
    // Tiqets
    openTiqetsModal,
    closeTiqetsModal
  };

  // Export global
  global.ORT_WIDGETS = ORT_WIDGETS;
  
  // Raccourcis globaux pour compatibilité
  global.openGygModal = openGygModal;
  global.closeGygModal = closeGygModal;
  global.openTicketmasterModal = openTicketmasterModal;
  global.closeTicketmasterModal = closeTicketmasterModal;
  global.openCarRentalModal = openCarRentalModal;
  global.closeCarRentalModal = closeCarRentalModal;
  global.openTiqetsModal = openTiqetsModal;
  global.closeTiqetsModal = closeTiqetsModal;

})(typeof window !== 'undefined' ? window : this);
