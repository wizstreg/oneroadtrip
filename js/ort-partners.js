/**
 * OneRoadTrip - Module Partenaires & Réservations
 * Gère les liens affiliés, modales partenaires et widgets
 * Utilisé par roadtrip_detail.html, roadtrip_detail_simple.html et roadtrip_mobile.html
 */

(function(global) {
  'use strict';

  // === CONFIGURATION AFFILIÉS ===
  const AFFILIATE_LINKS = {
    qeeq: 'https://qeeq.tpo.li/rMRoXmko',
    getTransfer: 'https://gettransfer.tpo.li/NQ4bVvpZ',
    gyg: 'https://getyourguide.tpo.li/YQ9RFXj5',
    tiqets: 'https://tiqets.tpo.li/L1uxd085',
    ekta: 'https://ektatraveling.com',
    // Location de van CamperDays (Awin), par langue du site
    camperdays: {
      fr: 'https://tidd.ly/43y5Ajw',
      es: 'https://tidd.ly/4aKeqyk'
      // en, it, pt : à compléter quand les accords seront validés
    }
  };

  // Stay22 Config
  const STAY22_CONFIG = {
    AID: 'oneroadtrip',
    BASE_ALLEZ: 'https://www.stay22.com/allez/roam',
    MAINCOLOR: '113f7a'
  };

  // Travelpayouts Config
  const TRAVELPAYOUTS = {
    trs: '478677',
    shmarker: '688844'
  };

  // === I18N PARTENAIRES ===
  const PARTNER_I18N = {
    vehicleTitle: {
      fr: '🚕 Véhicules & Transferts', en: '🚕 Vehicles & Transfers',
      es: '🚕 Vehículos y Traslados', it: '🚕 Veicoli e Trasferimenti',
      pt: '🚕 Veículos e Transfers', ar: '🚕 المركبات والنقل'
    },
    vehicleText: {
      fr: 'Que recherchez-vous pour votre voyage ?', en: 'What are you looking for?',
      es: '¿Qué necesitas para tu viaje?', it: 'Di cosa hai bisogno per il tuo viaggio?',
      pt: 'O que você precisa para sua viagem?', ar: 'ماذا تحتاج لرحلتك؟'
    },
    carTitle: { fr: 'Location de voiture', en: 'Car Rental', es: 'Alquiler de coches', it: 'Noleggio auto', pt: 'Aluguel de carros', ar: 'تأجير السيارات' },
    carDesc: { fr: 'Louez un véhicule et explorez en liberté', en: 'Rent a car and explore freely', es: 'Alquila un coche y explora libremente', it: 'Noleggia un\'auto ed esplora liberamente', pt: 'Alugue um carro e explore livremente', ar: 'استأجر سيارة واستكشف بحرية' },
    transferTitle: { fr: 'Transfert aéroport', en: 'Airport Transfer', es: 'Traslado aeropuerto', it: 'Trasferimento aeroporto', pt: 'Transfer aeroporto', ar: 'النقل من المطار' },
    transferDesc: { fr: 'Chauffeur privé, prix fixe garanti', en: 'Private driver, fixed price', es: 'Conductor privado, precio fijo', it: 'Autista privato, prezzo fisso', pt: 'Motorista particular, preço fixo', ar: 'سائق خاص، سعر ثابت' },
    carRedirectTitle: { fr: '🚗 Location de voiture', en: '🚗 Car Rental', es: '🚗 Alquiler de coches', it: '🚗 Noleggio auto', pt: '🚗 Aluguel de carros', ar: '🚗 تأجير السيارات' },
    carRedirectText: {
      fr: 'Nous travaillons avec <strong>QEEQ.com</strong>, leader mondial de la location de véhicules.<br><br>🏆 <strong>Meilleurs prix garantis</strong> — Comparaison de +500 loueurs<br>🔄 <strong>Annulation gratuite</strong> — Flexibilité totale<br>🚗 <strong>+7 millions de véhicules</strong> — Du compact au SUV<br>🌍 <strong>Présent dans 170+ pays</strong>',
      en: 'We partner with <strong>QEEQ.com</strong>, the world leader in car rental.<br><br>🏆 <strong>Best prices guaranteed</strong> — Comparing 500+ suppliers<br>🔄 <strong>Free cancellation</strong> — Total flexibility<br>🚗 <strong>+7 million vehicles</strong> — From compact to SUV<br>🌍 <strong>Available in 170+ countries</strong>',
      es: 'Trabajamos con <strong>QEEQ.com</strong>, líder mundial en alquiler de vehículos.<br><br>🏆 <strong>Mejores precios garantizados</strong> — Comparación de +500 proveedores<br>🔄 <strong>Cancelación gratuita</strong> — Flexibilidad total<br>🚗 <strong>+7 millones de vehículos</strong> — Del compacto al SUV<br>🌍 <strong>Presente en 170+ países</strong>',
      it: 'Collaboriamo con <strong>QEEQ.com</strong>, leader mondiale nel noleggio veicoli.<br><br>🏆 <strong>Miglior prezzo garantito</strong> — Confronto di +500 fornitori<br>🔄 <strong>Cancellazione gratuita</strong> — Flessibilità totale<br>🚗 <strong>+7 milioni di veicoli</strong> — Dalla compatta al SUV<br>🌍 <strong>Presente in 170+ paesi</strong>',
      pt: 'Trabalhamos com <strong>QEEQ.com</strong>, líder mundial em aluguel de veículos.<br><br>🏆 <strong>Melhores preços garantidos</strong> — Comparação de +500 fornecedores<br>🔄 <strong>Cancelamento gratuito</strong> — Flexibilidade total<br>🚗 <strong>+7 milhões de veículos</strong> — Do compacto ao SUV<br>🌍 <strong>Presente em 170+ países</strong>',
      ar: 'نتعاون مع <strong>QEEQ.com</strong>، الرائد العالمي في تأجير السيارات.<br><br>🏆 <strong>أفضل الأسعار مضمونة</strong> — مقارنة +500 مورد<br>🔄 <strong>إلغاء مجاني</strong> — مرونة كاملة<br>🚗 <strong>+7 مليون مركبة</strong> — من المدمجة إلى SUV<br>🌍 <strong>متوفر في 170+ دولة</strong>'
    },
    transferRedirectTitle: { fr: '🚐 Transfert aéroport', en: '🚐 Airport Transfer', es: '🚐 Traslado aeropuerto', it: '🚐 Trasferimento aeroporto', pt: '🚐 Transfer aeroporto', ar: '🚐 النقل من المطار' },
    transferRedirectText: {
      fr: 'Nous travaillons avec <strong>GetTransfer</strong>, spécialiste des transferts privés.<br><br>🚘 <strong>Chauffeur professionnel</strong> — Accueil personnalisé à l\'arrivée<br>💰 <strong>Prix fixe garanti</strong> — Pas de surprise, pas de compteur<br>⏰ <strong>Disponible 24h/24</strong> — Même pour les vols tardifs<br>📱 <strong>Suivi en temps réel</strong> — Localisation du chauffeur',
      en: 'We partner with <strong>GetTransfer</strong>, the private transfer specialist.<br><br>🚘 <strong>Professional driver</strong> — Personalized welcome on arrival<br>💰 <strong>Fixed price guaranteed</strong> — No surprises, no meter<br>⏰ <strong>Available 24/7</strong> — Even for late flights<br>📱 <strong>Real-time tracking</strong> — Driver location',
      es: 'Trabajamos con <strong>GetTransfer</strong>, especialista en traslados privados.<br><br>🚘 <strong>Conductor profesional</strong> — Bienvenida personalizada a la llegada<br>💰 <strong>Precio fijo garantizado</strong> — Sin sorpresas, sin taxímetro<br>⏰ <strong>Disponible 24/7</strong> — Incluso para vuelos tardíos<br>📱 <strong>Seguimiento en tiempo real</strong> — Ubicación del conductor',
      it: 'Collaboriamo con <strong>GetTransfer</strong>, specialista nei trasferimenti privati.<br><br>🚘 <strong>Autista professionale</strong> — Accoglienza personalizzata all\'arrivo<br>💰 <strong>Prezzo fisso garantito</strong> — Nessuna sorpresa, nessun tassametro<br>⏰ <strong>Disponibile 24/7</strong> — Anche per voli in ritardo<br>📱 <strong>Tracciamento in tempo reale</strong> — Posizione dell\'autista',
      pt: 'Trabalhamos com <strong>GetTransfer</strong>, especialista em transfers privados.<br><br>🚘 <strong>Motorista profissional</strong> — Recepção personalizada na chegada<br>💰 <strong>Preço fixo garantido</strong> — Sem surpresas, sem taxímetro<br>⏰ <strong>Disponível 24h</strong> — Mesmo para voos atrasados<br>📱 <strong>Rastreamento em tempo real</strong> — Localização do motorista',
      ar: 'نتعاون مع <strong>GetTransfer</strong>، المتخصص في النقل الخاص.<br><br>🚘 <strong>سائق محترف</strong> — استقبال شخصي عند الوصول<br>💰 <strong>سعر ثابت مضمون</strong> — بدون مفاجآت، بدون عداد<br>⏰ <strong>متاح 24/7</strong> — حتى للرحلات المتأخرة<br>📱 <strong>تتبع في الوقت الحقيقي</strong> — موقع السائق'
    },
    insuranceTitle: { fr: '🛡 Assurance voyage', en: '🛡 Travel Insurance', es: '🛡 Seguro de viaje', it: '🛡 Assicurazione viaggio', pt: '🛡 Seguro viagem', ar: '🛡 تأمين السفر' },
    insuranceText: {
      fr: 'Nous vous dirigeons vers <strong>Ekta Traveling</strong>.<br><br>✅ Couverture médicale mondiale<br>✅ Annulation & bagages<br>✅ Assistance 24h/24',
      en: 'Redirecting to <strong>Ekta Traveling</strong>.<br><br>✅ Worldwide medical coverage<br>✅ Cancellation & baggage<br>✅ 24/7 assistance',
      es: 'Te redirigimos a <strong>Ekta Traveling</strong>.<br><br>✅ Cobertura médica mundial<br>✅ Cancelación y equipaje<br>✅ Asistencia 24/7',
      it: 'Ti reindirizziamo a <strong>Ekta Traveling</strong>.<br><br>✅ Copertura medica mondiale<br>✅ Cancellazione e bagagli<br>✅ Assistenza 24/7',
      pt: 'Redirecionando para <strong>Ekta Traveling</strong>.<br><br>✅ Cobertura médica mundial<br>✅ Cancelamento e bagagem<br>✅ Assistência 24h',
      ar: 'نوجهك إلى <strong>Ekta Traveling</strong>.<br><br>✅ تغطية طبية عالمية<br>✅ الإلغاء والأمتعة<br>✅ مساعدة 24/7'
    },
    cancel: { fr: 'Annuler', en: 'Cancel', es: 'Cancelar', it: 'Annulla', pt: 'Cancelar', ar: 'إلغاء' },
    continue: { fr: 'Continuer', en: 'Continue', es: 'Continuar', it: 'Continua', pt: 'Continuar', ar: 'متابعة' },
    redirecting: { fr: 'Redirection dans', en: 'Redirecting in', es: 'Redirigiendo en', it: 'Reindirizzamento tra', pt: 'Redirecionando em', ar: 'إعادة التوجيه في' },
    loading: { fr: 'Chargement...', en: 'Loading...', es: 'Cargando...', it: 'Caricamento...', pt: 'Carregando...', ar: 'جار التحميل...' },
    flightTabSearch: { fr: '🔍 Rechercher un vol', en: '🔍 Search flights', es: '🔍 Buscar vuelos', it: '🔍 Cerca voli', pt: '🔍 Pesquisar voos', ar: '🔍 البحث عن رحلات' },
    flightTabCompensation: { fr: '💰 Compensation retard', en: '💰 Delay compensation', es: '💰 Compensación retraso', it: '💰 Rimborso ritardo', pt: '💰 Compensação atraso', ar: '💰 تعويض التأخير' }
  };

  // État interne
  let partnerTarget = null;
  let partnerCountdownTimer = null;

  // === FONCTIONS UTILITAIRES ===
  
  function getPartnerLang() {
    return (localStorage.getItem('lang') || document.documentElement.lang || 'fr').slice(0,2);
  }

  function pt(key) {
    const lang = getPartnerLang();
    return PARTNER_I18N[key]?.[lang] || PARTNER_I18N[key]?.fr || key;
  }

  // === GÉNÉRATEURS DE LIENS ===
  
  const AFFILIATE = {
    // Location voiture QEEQ
    car: () => AFFILIATE_LINKS.qeeq,
    
    // Transfert GetTransfer
    transfer: () => AFFILIATE_LINKS.getTransfer,
    
    // Location de van CamperDays, par langue. Renvoie null si pas de lien pour cette langue.
    camper: (lang) => {
      const l = lang || getPartnerLang();
      return AFFILIATE_LINKS.camperdays[l] || null;
    },
    
    // GetYourGuide avec ville
    gyg: (city) => `${AFFILIATE_LINKS.gyg}?q=${encodeURIComponent(city || '')}`,
    
    // Tiqets avec ville et langue
    tiqets: (city, lang) => `${AFFILIATE_LINKS.tiqets}?q=${encodeURIComponent(city || '')}&lang=${lang || getPartnerLang()}`,
    
    // Assurance Ekta avec langue
    insurance: (lang) => {
      const insLang = { fr:'fr', en:'en', es:'es', it:'it', pt:'pt', ar:'en' }[lang || getPartnerLang()] || 'en';
      return `${AFFILIATE_LINKS.ekta}/${insLang}/?sub_id=8d611d0d167741c58fdfe9e61-${TRAVELPAYOUTS.shmarker}&utm_source=travelpayouts`;
    },
    
    // Stay22 Hotels
    hotel: (lat, lng, city, nights, checkIn, campaign) => {
      const params = new URLSearchParams({
        aid: STAY22_CONFIG.AID,
        campaign: campaign || 'oneroadtrip',
        lat: lat?.toFixed?.(6) || lat,
        lng: lng?.toFixed?.(6) || lng,
        address: city || '',
        checkin: checkIn || '',
        nights: nights || 1
      });
      return `${STAY22_CONFIG.BASE_ALLEZ}?${params.toString()}`;
    },
    
    // Stay22 Map URL
    hotelMap: (lat, lng, zoom) => {
      const params = new URLSearchParams({
        aid: STAY22_CONFIG.AID,
        lat: lat?.toFixed?.(6) || lat,
        lng: lng?.toFixed?.(6) || lng,
        zoom: zoom || 12,
        maincolor: STAY22_CONFIG.MAINCOLOR
      });
      return `${STAY22_CONFIG.BASE_ALLEZ}/embed?${params.toString()}`;
    }
  };

  // === MODAL PARTENAIRE ===
  
  function showPartnerModal(type) {
    const modal = document.getElementById('partnerModal');
    const modalContent = document.getElementById('partnerModalContent');
    const modalBody = document.getElementById('partnerModalBody');
    const icon = document.getElementById('partnerIcon');
    const title = document.getElementById('partnerTitle');
    const text = document.getElementById('partnerText');
    const choices = document.getElementById('partnerChoices');
    const widgetContainer = document.getElementById('partnerWidgetContainer');
    const footer = document.getElementById('partnerFooter');
    const cancelBtn = document.getElementById('partnerCancelBtn');
    const continueBtn = document.getElementById('partnerContinueBtn');
    const countdown = document.getElementById('partnerCountdown');
    const lang = getPartnerLang();
    
    if (!modal) {
      console.error('[ORT-PARTNERS] Modal #partnerModal non trouvée');
      return;
    }
    
    // Reset
    partnerTarget = null;
    if (partnerCountdownTimer) clearInterval(partnerCountdownTimer);
    if (text) text.style.display = '';
    if (choices) { choices.style.display = 'none'; choices.innerHTML = ''; }
    if (widgetContainer) { widgetContainer.style.display = 'none'; widgetContainer.innerHTML = ''; }
    if (footer) footer.style.display = '';
    if (countdown) countdown.textContent = '';
    if (modalContent) modalContent.classList.remove('with-widget');
    if (modalBody) modalBody.classList.remove('widget-mode');
    modal.classList.remove('top-aligned');
    const header = document.querySelector('.partner-modal-header');
    if (header) header.classList.remove('compact');
    
    if (type === 'vehicle') {
      // Choix entre location et transfert
      if (icon) icon.textContent = '🚕';
      if (title) title.textContent = pt('vehicleTitle');
      if (text) text.innerHTML = `<p>${pt('vehicleText')}</p>`;
      if (choices) {
        choices.innerHTML = `
          <div class="partner-choice-btn car" onclick="selectPartnerChoice('car')">
            <span class="choice-icon">🚗</span>
            <div class="choice-title">${pt('carTitle')}</div>
            <div class="choice-desc">${pt('carDesc')}</div>
          </div>
          <div class="partner-choice-btn transfer" onclick="selectPartnerChoice('transfer')">
            <span class="choice-icon">🚐</span>
            <div class="choice-title">${pt('transferTitle')}</div>
            <div class="choice-desc">${pt('transferDesc')}</div>
          </div>
        `;
        choices.style.display = 'flex';
      }
      if (footer) footer.style.display = 'none';
      
    } else if (type === 'car') {
      partnerTarget = AFFILIATE.car();
      if (icon) icon.textContent = '🚗';
      if (title) title.textContent = pt('carRedirectTitle');
      if (text) text.innerHTML = pt('carRedirectText');
      if (cancelBtn) cancelBtn.textContent = pt('cancel');
      if (continueBtn) continueBtn.textContent = pt('continue');
      startCountdown(countdown);
      
    } else if (type === 'transfer') {
      partnerTarget = AFFILIATE.transfer();
      if (icon) icon.textContent = '🚐';
      if (title) title.textContent = pt('transferRedirectTitle');
      if (text) text.innerHTML = pt('transferRedirectText');
      if (cancelBtn) cancelBtn.textContent = pt('cancel');
      if (continueBtn) continueBtn.textContent = pt('continue');
      startCountdown(countdown);
      
    } else if (type === 'flight') {
      partnerTarget = null;
      if (text) text.style.display = 'none';
      if (footer) footer.style.display = 'none';
      
      if (header) header.classList.add('compact');
      modal.classList.add('top-aligned');
      
      if (modalContent) modalContent.classList.add('with-widget');
      if (modalBody) modalBody.classList.add('widget-mode');
      if (widgetContainer) {
        widgetContainer.style.display = 'block';
        
        const locale = { fr:'fr', en:'en', es:'es', it:'it', pt:'pt', ar:'en' }[lang] || 'en';
        const currency = { fr:'EUR', en:'USD', es:'EUR', it:'EUR', pt:'EUR', ar:'USD' }[lang] || 'EUR';
        
        const searchWidgetUrl = `https://trpwdg.com/content?trs=${TRAVELPAYOUTS.trs}&shmarker=${TRAVELPAYOUTS.shmarker}&locale=${locale}&curr=${currency}&powered_by=true&border_radius=0&plain=true&color_button=%232681ff&color_button_text=%23ffffff&color_border=%232681ff&promo_id=4132&campaign_id=121`;
        const compensationWidgetUrl = `https://trpwdg.com/content?trs=${TRAVELPAYOUTS.trs}&shmarker=${TRAVELPAYOUTS.shmarker}&locale=${locale}&width=100&powered_by=true&campaign_id=86&promo_id=2110`;
        
        widgetContainer.innerHTML = `
          <style>
            .flight-tabs { display:flex; gap:0; margin-bottom:16px; }
            .flight-tab { flex:1; padding:12px 16px; border:2px solid #2681ff; background:#fff; color:#2681ff; font-weight:600; font-size:0.9rem; cursor:pointer; transition:all 0.2s; }
            .flight-tab:first-child { border-radius:8px 0 0 8px; border-right:none; }
            .flight-tab:last-child { border-radius:0 8px 8px 0; }
            .flight-tab:hover { background:#eff6ff; }
            .flight-tab.active { background:#2681ff; color:#fff; }
            .flight-tab-content { min-height:200px; }
          </style>
          <div class="flight-tabs">
            <button class="flight-tab active" data-tab="search">${pt('flightTabSearch')}</button>
            <button class="flight-tab" data-tab="compensation">${pt('flightTabCompensation')}</button>
          </div>
          <div class="flight-tab-content" id="flightTabSearch"></div>
          <div class="flight-tab-content" id="flightTabCompensation" style="display:none;"></div>
        `;
        
        loadWidgetInContainer('flightTabSearch', searchWidgetUrl);
        
        widgetContainer.querySelectorAll('.flight-tab').forEach(tab => {
          tab.addEventListener('click', () => {
            widgetContainer.querySelectorAll('.flight-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const isSearch = tab.dataset.tab === 'search';
            document.getElementById('flightTabSearch').style.display = isSearch ? 'block' : 'none';
            document.getElementById('flightTabCompensation').style.display = isSearch ? 'none' : 'block';
            
            if (!isSearch) {
              loadWidgetInContainer('flightTabCompensation', compensationWidgetUrl);
            }
          });
        });
      }
      
    } else if (type === 'insurance') {
      partnerTarget = AFFILIATE.insurance(lang);
      if (icon) icon.textContent = '🛡';
      if (title) title.textContent = pt('insuranceTitle');
      if (text) text.innerHTML = pt('insuranceText');
      if (cancelBtn) cancelBtn.textContent = pt('cancel');
      if (continueBtn) continueBtn.textContent = pt('continue');
      startCountdown(countdown);
    }
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    console.log('[ORT-PARTNERS] Modal ouverte pour:', type);
  }

  function loadWidgetInContainer(containerId, widgetUrl) {
    const container = document.getElementById(containerId);
    if (!container || container.dataset.loaded) return;
    container.innerHTML = `<div style="text-align:center;padding:30px;color:#64748b;">${pt('loading')}</div>`;
    const script = document.createElement('script');
    script.src = widgetUrl;
    script.async = true;
    script.charset = 'utf-8';
    script.onload = () => {
      container.dataset.loaded = '1';
      setTimeout(() => {
        const loader = container.querySelector('div[style*="text-align:center"]');
        if (loader && container.children.length > 1) loader.remove();
      }, 500);
    };
    script.onerror = () => {
      container.innerHTML = `<div style="text-align:center;padding:40px;color:#ef4444;">Erreur de chargement</div>`;
    };
    container.appendChild(script);
  }

  function selectPartnerChoice(choice) {
    closePartnerModal();
    setTimeout(() => showPartnerModal(choice), 100);
  }

  function startCountdown(countdownEl) {
    if (!countdownEl) return;
    let seconds = 5;
    countdownEl.textContent = `${pt('redirecting')} ${seconds}s`;
    
    partnerCountdownTimer = setInterval(() => {
      seconds--;
      if (seconds <= 0) {
        clearInterval(partnerCountdownTimer);
        confirmPartnerRedirect();
      } else {
        countdownEl.textContent = `${pt('redirecting')} ${seconds}s`;
      }
    }, 1000);
  }

  function closePartnerModal() {
    const modal = document.getElementById('partnerModal');
    const widgetContainer = document.getElementById('partnerWidgetContainer');
    const header = document.querySelector('.partner-modal-header');
    if (modal) {
      modal.classList.remove('show', 'top-aligned');
      document.body.style.overflow = '';
    }
    if (header) header.classList.remove('compact');
    if (widgetContainer) widgetContainer.innerHTML = '';
    if (partnerCountdownTimer) {
      clearInterval(partnerCountdownTimer);
      partnerCountdownTimer = null;
    }
    partnerTarget = null;
  }

  function confirmPartnerRedirect() {
    if (partnerCountdownTimer) {
      clearInterval(partnerCountdownTimer);
      partnerCountdownTimer = null;
    }
    if (partnerTarget) {
      window.open(partnerTarget, '_blank', 'noopener');
    }
    closePartnerModal();
  }

  // === INITIALISATION ===
  
  function init() {
    // Écouteurs pour la modal
    document.addEventListener('keydown', function(e) { 
      if (e.key === 'Escape') closePartnerModal(); 
    });
    
    const modal = document.getElementById('partnerModal');
    if (modal) {
      modal.addEventListener('click', function(e) { 
        if (e.target === this) closePartnerModal(); 
      });
    }
    
    console.log('[ORT-PARTNERS] ✅ Module chargé');
  }

  // Auto-init au chargement DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // === EXPORT ===
  
  const ORT_PARTNERS = {
    // Configuration
    AFFILIATE_LINKS,
    STAY22_CONFIG,
    TRAVELPAYOUTS,
    PARTNER_I18N,
    
    // Fonctions utilitaires
    getPartnerLang,
    pt,
    
    // Générateurs de liens
    AFFILIATE,
    
    // Modal
    showPartnerModal,
    closePartnerModal,
    selectPartnerChoice,
    confirmPartnerRedirect,
    startCountdown
  };

  // Export global
  global.ORT_PARTNERS = ORT_PARTNERS;
  
  // Raccourcis globaux pour compatibilité
  global.showPartnerModal = showPartnerModal;
  global.closePartnerModal = closePartnerModal;
  global.selectPartnerChoice = selectPartnerChoice;
  global.confirmPartnerRedirect = confirmPartnerRedirect;
  global.startCountdown = startCountdown;
  global.getPartnerLang = getPartnerLang;
  global.pt = pt;

})(typeof window !== 'undefined' ? window : this);
