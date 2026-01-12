/**
 * ORT-FOOTER.js v2.0
 * Gestion unifiée du footer et de la bannière cookies OneRoadTrip
 * Cookie banner conforme RGPD avec centre de préférences détaillé
 * 
 * Prérequis :
 * - ort-i18n-auth.js chargé AVANT ce script (optionnel, fallback intégré)
 * 
 * HTML requis dans la page :
 * <footer id="footer-legal"></footer>
 */
(function(){
  'use strict';

  // ============================================
  // CONFIGURATION
  // ============================================
  const COOKIE_CONSENT_KEY = 'ort_cookie_consent_v2';
  const BANNER_ZINDEX = 99999;

  // ============================================
  // MAPPING PAGES "À PROPOS" PAR LANGUE
  // ============================================
  function getAboutPageUrl(lang) {
    const ABOUT_PAGES = {
      fr: 'a-propos.html',
      en: 'about.html',
      es: 'acerca-de.html',
      it: 'chi-siamo.html',
      pt: 'sobre.html',
      ar: 'about-ar.html'
    };
    return ABOUT_PAGES[lang] || ABOUT_PAGES.fr;
  }

  // ============================================
  // TRADUCTIONS COOKIES (6 langues)
  // ============================================
  const COOKIE_I18N = {
    fr: {
      // Banner initial
      bannerTitle: 'Nous respectons votre vie privée',
      bannerText: 'Nous utilisons des cookies pour améliorer votre expérience, analyser le trafic et personnaliser le contenu. Vous pouvez choisir les cookies que vous acceptez.',
      bannerLink: 'Politique de cookies',
      btnSettings: 'Paramétrer',
      btnRejectAll: 'Tout refuser',
      btnAcceptAll: 'Tout accepter',
      
      // Modal préférences
      modalTitle: 'Centre de préférences de confidentialité',
      modalIntro: 'Lorsque vous visitez un site web, celui-ci peut stocker ou récupérer des informations sur votre navigateur, principalement sous forme de cookies. Ces informations peuvent concerner vous, vos préférences ou votre appareil. Elles sont principalement utilisées pour faire fonctionner le site comme vous le souhaitez. Les informations ne vous identifient généralement pas directement, mais peuvent vous offrir une expérience web plus personnalisée. Vous pouvez choisir de ne pas autoriser certains types de cookies.',
      btnMoreInfo: 'Plus d\'informations',
      btnConfirm: 'Confirmer mes choix',
      
      // Catégories
      catNecessary: 'Cookies strictement nécessaires',
      catNecessaryDesc: 'Ces cookies sont essentiels au fonctionnement du site. Ils permettent la navigation, la connexion sécurisée et les fonctionnalités de base. Sans ces cookies, le site ne peut pas fonctionner correctement.',
      catNecessaryAlways: 'Toujours actif',
      
      catAnalytics: 'Cookies analytiques',
      catAnalyticsDesc: 'Ces cookies nous permettent de mesurer l\'audience du site, de comprendre comment les visiteurs l\'utilisent et d\'améliorer ses performances. Toutes les données sont anonymisées.',
      catAnalyticsCookies: 'Cookies utilisés : Google Analytics (_ga, _ga_*, _gid)',
      
      catMarketing: 'Cookies marketing',
      catMarketingDesc: 'Ces cookies sont utilisés pour vous proposer des publicités pertinentes et mesurer l\'efficacité de nos campagnes. Ils peuvent être déposés par nos partenaires publicitaires.',
      catMarketingCookies: 'Cookies utilisés : Partenaires affiliés (Stay22, Travelpayouts)',
      
      // Footer
      legalNotice: 'Mentions légales',
      privacyPolicy: 'Confidentialité',
      cookiePolicy: 'Cookies',
      about: 'À propos',
      manageCookies: 'Gérer mes cookies'
    },
    
    en: {
      bannerTitle: 'We respect your privacy',
      bannerText: 'We use cookies to enhance your experience, analyze traffic and personalize content. You can choose which cookies you accept.',
      bannerLink: 'Cookie Policy',
      btnSettings: 'Cookie Settings',
      btnRejectAll: 'Reject All',
      btnAcceptAll: 'Accept All Cookies',
      
      modalTitle: 'Privacy Preference Center',
      modalIntro: 'When you visit any website, it may store or retrieve information on your browser, mostly in the form of cookies. This information might be about you, your preferences or your device and is mostly used to make the site work as you expect it to. The information does not usually directly identify you, but it can give you a more personalized web experience. Because we respect your right to privacy, you can choose not to allow some types of cookies.',
      btnMoreInfo: 'More information',
      btnConfirm: 'Confirm My Choices',
      
      catNecessary: 'Strictly Necessary Cookies',
      catNecessaryDesc: 'These cookies are essential for the website to function. They enable navigation, secure login and basic features. Without these cookies, the site cannot work properly.',
      catNecessaryAlways: 'Always Active',
      
      catAnalytics: 'Analytics Cookies',
      catAnalyticsDesc: 'These cookies allow us to measure site audience, understand how visitors use it and improve its performance. All data is anonymized.',
      catAnalyticsCookies: 'Cookies used: Google Analytics (_ga, _ga_*, _gid)',
      
      catMarketing: 'Marketing Cookies',
      catMarketingDesc: 'These cookies are used to show you relevant ads and measure the effectiveness of our campaigns. They may be set by our advertising partners.',
      catMarketingCookies: 'Cookies used: Affiliate partners (Stay22, Travelpayouts)',
      
      legalNotice: 'Legal Notice',
      privacyPolicy: 'Privacy',
      cookiePolicy: 'Cookies',
      about: 'About',
      manageCookies: 'Manage cookies'
    },
    
    es: {
      bannerTitle: 'Respetamos su privacidad',
      bannerText: 'Utilizamos cookies para mejorar su experiencia, analizar el tráfico y personalizar el contenido. Puede elegir qué cookies acepta.',
      bannerLink: 'Política de cookies',
      btnSettings: 'Configurar',
      btnRejectAll: 'Rechazar todo',
      btnAcceptAll: 'Aceptar todas',
      
      modalTitle: 'Centro de preferencias de privacidad',
      modalIntro: 'Cuando visita cualquier sitio web, este puede almacenar o recuperar información en su navegador, principalmente en forma de cookies. Esta información puede ser sobre usted, sus preferencias o su dispositivo y se utiliza principalmente para que el sitio funcione como espera. La información generalmente no lo identifica directamente, pero puede brindarle una experiencia web más personalizada. Puede elegir no permitir algunos tipos de cookies.',
      btnMoreInfo: 'Más información',
      btnConfirm: 'Confirmar mis elecciones',
      
      catNecessary: 'Cookies estrictamente necesarias',
      catNecessaryDesc: 'Estas cookies son esenciales para el funcionamiento del sitio. Permiten la navegación, el inicio de sesión seguro y las funciones básicas. Sin estas cookies, el sitio no puede funcionar correctamente.',
      catNecessaryAlways: 'Siempre activo',
      
      catAnalytics: 'Cookies analíticas',
      catAnalyticsDesc: 'Estas cookies nos permiten medir la audiencia del sitio, comprender cómo lo usan los visitantes y mejorar su rendimiento. Todos los datos son anónimos.',
      catAnalyticsCookies: 'Cookies utilizadas: Google Analytics (_ga, _ga_*, _gid)',
      
      catMarketing: 'Cookies de marketing',
      catMarketingDesc: 'Estas cookies se utilizan para mostrarle anuncios relevantes y medir la efectividad de nuestras campañas. Pueden ser establecidas por nuestros socios publicitarios.',
      catMarketingCookies: 'Cookies utilizadas: Socios afiliados (Stay22, Travelpayouts)',
      
      legalNotice: 'Aviso legal',
      privacyPolicy: 'Privacidad',
      cookiePolicy: 'Cookies',
      about: 'Acerca de',
      manageCookies: 'Gestionar cookies'
    },
    
    it: {
      bannerTitle: 'Rispettiamo la tua privacy',
      bannerText: 'Utilizziamo i cookie per migliorare la tua esperienza, analizzare il traffico e personalizzare i contenuti. Puoi scegliere quali cookie accettare.',
      bannerLink: 'Politica sui cookie',
      btnSettings: 'Impostazioni',
      btnRejectAll: 'Rifiuta tutto',
      btnAcceptAll: 'Accetta tutti',
      
      modalTitle: 'Centro preferenze privacy',
      modalIntro: 'Quando visiti un sito web, questo può memorizzare o recuperare informazioni sul tuo browser, principalmente sotto forma di cookie. Queste informazioni potrebbero riguardare te, le tue preferenze o il tuo dispositivo e vengono utilizzate principalmente per far funzionare il sito come ti aspetti. Le informazioni di solito non ti identificano direttamente, ma possono offrirti un\'esperienza web più personalizzata. Puoi scegliere di non consentire alcuni tipi di cookie.',
      btnMoreInfo: 'Maggiori informazioni',
      btnConfirm: 'Conferma le mie scelte',
      
      catNecessary: 'Cookie strettamente necessari',
      catNecessaryDesc: 'Questi cookie sono essenziali per il funzionamento del sito. Consentono la navigazione, l\'accesso sicuro e le funzionalità di base. Senza questi cookie, il sito non può funzionare correttamente.',
      catNecessaryAlways: 'Sempre attivo',
      
      catAnalytics: 'Cookie analitici',
      catAnalyticsDesc: 'Questi cookie ci permettono di misurare il pubblico del sito, capire come i visitatori lo utilizzano e migliorarne le prestazioni. Tutti i dati sono anonimi.',
      catAnalyticsCookies: 'Cookie utilizzati: Google Analytics (_ga, _ga_*, _gid)',
      
      catMarketing: 'Cookie di marketing',
      catMarketingDesc: 'Questi cookie vengono utilizzati per mostrarti annunci pertinenti e misurare l\'efficacia delle nostre campagne. Possono essere impostati dai nostri partner pubblicitari.',
      catMarketingCookies: 'Cookie utilizzati: Partner affiliati (Stay22, Travelpayouts)',
      
      legalNotice: 'Note legali',
      privacyPolicy: 'Privacy',
      cookiePolicy: 'Cookie',
      about: 'Chi siamo',
      manageCookies: 'Gestisci cookie'
    },
    
    pt: {
      bannerTitle: 'Respeitamos a sua privacidade',
      bannerText: 'Utilizamos cookies para melhorar a sua experiência, analisar o tráfego e personalizar o conteúdo. Pode escolher quais cookies aceita.',
      bannerLink: 'Política de cookies',
      btnSettings: 'Configurar',
      btnRejectAll: 'Rejeitar tudo',
      btnAcceptAll: 'Aceitar todos',
      
      modalTitle: 'Centro de preferências de privacidade',
      modalIntro: 'Quando visita qualquer site, este pode armazenar ou recuperar informações no seu navegador, principalmente na forma de cookies. Estas informações podem ser sobre si, as suas preferências ou o seu dispositivo e são usadas principalmente para fazer o site funcionar como espera. As informações geralmente não o identificam diretamente, mas podem proporcionar uma experiência web mais personalizada. Pode optar por não permitir alguns tipos de cookies.',
      btnMoreInfo: 'Mais informações',
      btnConfirm: 'Confirmar as minhas escolhas',
      
      catNecessary: 'Cookies estritamente necessários',
      catNecessaryDesc: 'Estes cookies são essenciais para o funcionamento do site. Permitem a navegação, o login seguro e as funcionalidades básicas. Sem estes cookies, o site não pode funcionar corretamente.',
      catNecessaryAlways: 'Sempre ativo',
      
      catAnalytics: 'Cookies analíticos',
      catAnalyticsDesc: 'Estes cookies permitem-nos medir a audiência do site, compreender como os visitantes o utilizam e melhorar o seu desempenho. Todos os dados são anónimos.',
      catAnalyticsCookies: 'Cookies utilizados: Google Analytics (_ga, _ga_*, _gid)',
      
      catMarketing: 'Cookies de marketing',
      catMarketingDesc: 'Estes cookies são usados para mostrar anúncios relevantes e medir a eficácia das nossas campanhas. Podem ser definidos pelos nossos parceiros de publicidade.',
      catMarketingCookies: 'Cookies utilizados: Parceiros afiliados (Stay22, Travelpayouts)',
      
      legalNotice: 'Aviso legal',
      privacyPolicy: 'Privacidade',
      cookiePolicy: 'Cookies',
      about: 'Sobre',
      manageCookies: 'Gerir cookies'
    },
    
    ar: {
      bannerTitle: 'نحن نحترم خصوصيتك',
      bannerText: 'نستخدم ملفات تعريف الارتباط لتحسين تجربتك وتحليل حركة المرور وتخصيص المحتوى. يمكنك اختيار ملفات تعريف الارتباط التي تقبلها.',
      bannerLink: 'سياسة ملفات تعريف الارتباط',
      btnSettings: 'الإعدادات',
      btnRejectAll: 'رفض الكل',
      btnAcceptAll: 'قبول الكل',
      
      modalTitle: 'مركز تفضيلات الخصوصية',
      modalIntro: 'عند زيارة أي موقع ويب، قد يقوم بتخزين أو استرداد معلومات على متصفحك، غالبًا في شكل ملفات تعريف الارتباط. قد تكون هذه المعلومات عنك أو عن تفضيلاتك أو جهازك وتُستخدم بشكل أساسي لجعل الموقع يعمل كما تتوقع. لا تحدد المعلومات هويتك مباشرة عادةً، ولكنها يمكن أن تمنحك تجربة ويب أكثر تخصيصًا. يمكنك اختيار عدم السماح ببعض أنواع ملفات تعريف الارتباط.',
      btnMoreInfo: 'مزيد من المعلومات',
      btnConfirm: 'تأكيد اختياراتي',
      
      catNecessary: 'ملفات تعريف الارتباط الضرورية',
      catNecessaryDesc: 'هذه الملفات ضرورية لعمل الموقع. تتيح التنقل وتسجيل الدخول الآمن والميزات الأساسية. بدون هذه الملفات، لا يمكن للموقع العمل بشكل صحيح.',
      catNecessaryAlways: 'نشط دائمًا',
      
      catAnalytics: 'ملفات تعريف الارتباط التحليلية',
      catAnalyticsDesc: 'تسمح لنا هذه الملفات بقياس جمهور الموقع وفهم كيفية استخدام الزوار له وتحسين أدائه. جميع البيانات مجهولة المصدر.',
      catAnalyticsCookies: 'الملفات المستخدمة: Google Analytics (_ga, _ga_*, _gid)',
      
      catMarketing: 'ملفات تعريف الارتباط التسويقية',
      catMarketingDesc: 'تُستخدم هذه الملفات لعرض إعلانات ذات صلة وقياس فعالية حملاتنا. قد يتم تعيينها من قبل شركائنا الإعلانيين.',
      catMarketingCookies: 'الملفات المستخدمة: الشركاء التابعون (Stay22, Travelpayouts)',
      
      legalNotice: 'إشعار قانوني',
      privacyPolicy: 'الخصوصية',
      cookiePolicy: 'ملفات تعريف الارتباط',
      about: 'حول',
      manageCookies: 'إدارة ملفات تعريف الارتباط'
    }
  };

  // ============================================
  // UTILITAIRES
  // ============================================
  
  function getLang() {
    // 1. Module i18n si disponible
    if (window.ORT_I18N_AUTH?.detectLang) {
      return window.ORT_I18N_AUTH.detectLang();
    }
    // 2. Paramètre URL (prioritaire si module pas encore chargé)
    const urlLang = new URLSearchParams(window.location.search).get('lang');
    if (urlLang && COOKIE_I18N[urlLang]) {
      return urlLang;
    }
    // 3. localStorage ou navigateur
    return localStorage.getItem('lang') || 
           (navigator.language || 'fr').substring(0, 2).toLowerCase();
  }

  function getT() {
    const lang = getLang();
    return COOKIE_I18N[lang] || COOKIE_I18N.en;
  }

  function isRTL() {
    return getLang() === 'ar';
  }

  function readConsent() {
    try {
      return JSON.parse(localStorage.getItem(COOKIE_CONSENT_KEY) || 'null');
    } catch (e) {
      return null;
    }
  }

  function saveConsent(consent) {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
      applyConsent(consent);
    } catch (e) {
      console.warn('[ORT-FOOTER] Erreur sauvegarde consentement:', e);
    }
    hideBanner();
    hideModal();
  }

  function applyConsent(consent) {
    if (!consent) return;
    
    if (typeof gtag === 'function') {
      gtag('consent', 'update', {
        'analytics_storage': consent.analytics ? 'granted' : 'denied',
        'ad_storage': consent.marketing ? 'granted' : 'denied'
      });
    }
    
    console.log('[ORT-FOOTER] Consentement appliqué:', consent);
  }

  // ============================================
  // FOOTER LÉGAL
  // ============================================
  function injectFooter() {
    const footer = document.getElementById('footer-legal');
    if (!footer) return;

    const T = getT();
    const lang = getLang();
    const rtl = isRTL();

    footer.style.cssText = `
      margin: 18px auto 20px;
      text-align: center;
      font-size: 14px;
      padding: 12px 20px;
      max-width: 600px;
      background: rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(195, 214, 182, 0.4);
      border-radius: 10px;
      backdrop-filter: blur(4px);
      direction: ${rtl ? 'rtl' : 'ltr'};
    `;

    // URLs des pages légales avec suffixe de langue
    const getLegalUrls = (lang) => ({
      cgu: `cgu-${lang}.html`,
      privacy: `confidentialite-${lang}.html`,
      cookies: `cookies-${lang}.html`,
      about: getAboutPageUrl(lang)
    });

    const urls = getLegalUrls(lang);
    const links = [
      { href: urls.cgu, label: T.legalNotice },
      { href: urls.privacy, label: T.privacyPolicy },
      { href: urls.cookies, label: T.cookiePolicy },
      { href: urls.about, label: T.about }
    ];

    footer.innerHTML = links.map((link, i) => {
      const separator = i < links.length - 1 ? ' · ' : '';
      return `<a href="${link.href}" style="color:#fff;text-decoration:none">${link.label}</a>${separator}`;
    }).join('');

    const manageBtn = document.createElement('button');
    manageBtn.id = 'manageCookies';
    manageBtn.type = 'button';
    manageBtn.textContent = T.manageCookies;
    manageBtn.style.cssText = `
      background: none;
      border: 0;
      color: #fff;
      cursor: pointer;
      text-decoration: underline;
      margin-${rtl ? 'right' : 'left'}: 8px;
      font-size: 14px;
    `;
    manageBtn.addEventListener('click', showModal);
    
    footer.appendChild(document.createTextNode(' · '));
    footer.appendChild(manageBtn);
  }

  // ============================================
  // BANNIÈRE COOKIES
  // ============================================
  let bannerElement = null;

  function createBanner() {
    if (bannerElement) return bannerElement;

    const T = getT();
    const lang = getLang();
    const rtl = isRTL();

    bannerElement = document.createElement('div');
    bannerElement.id = 'ortCookieBanner';
    bannerElement.setAttribute('role', 'dialog');
    bannerElement.setAttribute('aria-live', 'polite');
    bannerElement.setAttribute('aria-label', T.bannerTitle);
    
    bannerElement.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: ${BANNER_ZINDEX};
      display: none;
      direction: ${rtl ? 'rtl' : 'ltr'};
    `;

    bannerElement.innerHTML = `
      <div style="
        max-width: 1200px;
        margin: 0 auto;
        background: #fff;
        border-top: 3px solid #113f7a;
        box-shadow: 0 -4px 20px rgba(0,0,0,0.15);
        padding: 20px 24px;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 20px;
      ">
        <div style="flex: 1; min-width: 300px;">
          <div style="font-weight: 600; color: #113f7a; font-size: 16px; margin-bottom: 8px;">
            ${T.bannerTitle}
          </div>
          <div style="color: #444; font-size: 14px; line-height: 1.5;">
            ${T.bannerText}
            <a href="politique-cookies.html?lang=${lang}" style="color: #113f7a; text-decoration: underline; margin-${rtl ? 'right' : 'left'}: 4px;">
              ${T.bannerLink}
            </a>
          </div>
        </div>
        
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <button id="ortBannerSettings" type="button" style="
            padding: 12px 20px;
            border-radius: 8px;
            border: 2px solid #113f7a;
            background: #fff;
            color: #113f7a;
            cursor: pointer;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.2s;
          ">${T.btnSettings}</button>
          
          <button id="ortBannerReject" type="button" style="
            padding: 12px 20px;
            border-radius: 8px;
            border: 2px solid #113f7a;
            background: #fff;
            color: #113f7a;
            cursor: pointer;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.2s;
          ">${T.btnRejectAll}</button>
          
          <button id="ortBannerAccept" type="button" style="
            padding: 12px 20px;
            border-radius: 8px;
            border: 2px solid #113f7a;
            background: #113f7a;
            color: #fff;
            cursor: pointer;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.2s;
          ">${T.btnAcceptAll}</button>
        </div>
      </div>
    `;

    document.body.appendChild(bannerElement);

    document.getElementById('ortBannerSettings').addEventListener('click', () => {
      hideBanner();
      showModal();
    });

    document.getElementById('ortBannerReject').addEventListener('click', () => {
      saveConsent({ necessary: true, analytics: false, marketing: false, ts: Date.now() });
    });

    document.getElementById('ortBannerAccept').addEventListener('click', () => {
      saveConsent({ necessary: true, analytics: true, marketing: true, ts: Date.now() });
    });

    return bannerElement;
  }

  function showBanner() {
    createBanner().style.display = 'block';
  }

  function hideBanner() {
    if (bannerElement) bannerElement.style.display = 'none';
  }

  // ============================================
  // MODALE PRÉFÉRENCES
  // ============================================
  let modalElement = null;

  function createModal() {
    if (modalElement) return modalElement;

    const T = getT();
    const lang = getLang();
    const rtl = isRTL();
    const consent = readConsent() || { necessary: true, analytics: false, marketing: false };

    modalElement = document.createElement('div');
    modalElement.id = 'ortCookieModal';
    modalElement.setAttribute('role', 'dialog');
    modalElement.setAttribute('aria-modal', 'true');
    modalElement.setAttribute('aria-labelledby', 'ortModalTitle');
    
    modalElement.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: ${BANNER_ZINDEX + 1};
      display: none;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.6);
      padding: 20px;
      direction: ${rtl ? 'rtl' : 'ltr'};
    `;

    modalElement.innerHTML = `
      <div style="
        background: #fff;
        border-radius: 12px;
        max-width: 600px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      ">
        <!-- Header -->
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
          background: #f8f9fa;
          border-radius: 12px 12px 0 0;
        ">
          <h2 id="ortModalTitle" style="margin: 0; font-size: 18px; color: #113f7a;">${T.modalTitle}</h2>
          <button id="ortModalClose" type="button" style="
            background: none;
            border: none;
            font-size: 28px;
            cursor: pointer;
            color: #666;
            padding: 0;
            line-height: 1;
          ">&times;</button>
        </div>
        
        <!-- Intro -->
        <div style="padding: 20px 24px; border-bottom: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #444; font-size: 14px; line-height: 1.6;">
            ${T.modalIntro}
          </p>
          <a href="politique-cookies.html?lang=${lang}" target="_blank" style="
            display: inline-block;
            margin-top: 12px;
            color: #113f7a;
            text-decoration: underline;
            font-size: 14px;
          ">${T.btnMoreInfo}</a>
        </div>
        
        <!-- Catégories -->
        <div style="padding: 0 24px;">
          
          <!-- Nécessaires -->
          <div style="padding: 20px 0; border-bottom: 1px solid #e5e7eb;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <h3 style="margin: 0; font-size: 15px; font-weight: 600; color: #113f7a;">${T.catNecessary}</h3>
              <span style="
                background: #10b981;
                color: #fff;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
              ">${T.catNecessaryAlways}</span>
            </div>
            <p style="margin: 0; color: #666; font-size: 13px; line-height: 1.5;">
              ${T.catNecessaryDesc}
            </p>
          </div>
          
          <!-- Analytiques -->
          <div style="padding: 20px 0; border-bottom: 1px solid #e5e7eb;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <h3 style="margin: 0; font-size: 15px; font-weight: 600; color: #113f7a;">${T.catAnalytics}</h3>
              <label class="ort-toggle" style="position: relative; display: inline-block; width: 50px; height: 26px; cursor: pointer;">
                <input type="checkbox" id="ortModalAnalytics" ${consent.analytics ? 'checked' : ''} style="opacity: 0; width: 0; height: 0;">
                <span class="ort-toggle-track" style="
                  position: absolute;
                  inset: 0;
                  background: ${consent.analytics ? '#10b981' : '#ccc'};
                  border-radius: 26px;
                  transition: 0.3s;
                "></span>
                <span class="ort-toggle-thumb" style="
                  position: absolute;
                  height: 20px;
                  width: 20px;
                  left: ${consent.analytics ? '27px' : '3px'};
                  bottom: 3px;
                  background: white;
                  border-radius: 50%;
                  transition: 0.3s;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                "></span>
              </label>
            </div>
            <p style="margin: 0 0 8px 0; color: #666; font-size: 13px; line-height: 1.5;">
              ${T.catAnalyticsDesc}
            </p>
            <p style="margin: 0; color: #999; font-size: 12px; font-style: italic;">
              ${T.catAnalyticsCookies}
            </p>
          </div>
          
          <!-- Marketing -->
          <div style="padding: 20px 0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <h3 style="margin: 0; font-size: 15px; font-weight: 600; color: #113f7a;">${T.catMarketing}</h3>
              <label class="ort-toggle" style="position: relative; display: inline-block; width: 50px; height: 26px; cursor: pointer;">
                <input type="checkbox" id="ortModalMarketing" ${consent.marketing ? 'checked' : ''} style="opacity: 0; width: 0; height: 0;">
                <span class="ort-toggle-track" style="
                  position: absolute;
                  inset: 0;
                  background: ${consent.marketing ? '#10b981' : '#ccc'};
                  border-radius: 26px;
                  transition: 0.3s;
                "></span>
                <span class="ort-toggle-thumb" style="
                  position: absolute;
                  height: 20px;
                  width: 20px;
                  left: ${consent.marketing ? '27px' : '3px'};
                  bottom: 3px;
                  background: white;
                  border-radius: 50%;
                  transition: 0.3s;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                "></span>
              </label>
            </div>
            <p style="margin: 0 0 8px 0; color: #666; font-size: 13px; line-height: 1.5;">
              ${T.catMarketingDesc}
            </p>
            <p style="margin: 0; color: #999; font-size: 12px; font-style: italic;">
              ${T.catMarketingCookies}
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="
          padding: 20px 24px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          flex-wrap: wrap;
          background: #f8f9fa;
          border-radius: 0 0 12px 12px;
        ">
          <button id="ortModalReject" type="button" style="
            padding: 12px 24px;
            border-radius: 8px;
            border: 2px solid #113f7a;
            background: #fff;
            color: #113f7a;
            cursor: pointer;
            font-weight: 600;
            font-size: 14px;
          ">${T.btnRejectAll}</button>
          
          <button id="ortModalConfirm" type="button" style="
            padding: 12px 24px;
            border-radius: 8px;
            border: 2px solid #113f7a;
            background: #113f7a;
            color: #fff;
            cursor: pointer;
            font-weight: 600;
            font-size: 14px;
          ">${T.btnConfirm}</button>
        </div>
      </div>
    `;

    document.body.appendChild(modalElement);

    // Toggle switches
    const analyticsCheckbox = document.getElementById('ortModalAnalytics');
    const marketingCheckbox = document.getElementById('ortModalMarketing');
    
    function setupToggle(checkbox) {
      if (!checkbox) return;
      const label = checkbox.closest('.ort-toggle');
      if (!label) return;
      const track = label.querySelector('.ort-toggle-track');
      const thumb = label.querySelector('.ort-toggle-thumb');
      
      checkbox.addEventListener('change', () => {
        track.style.background = checkbox.checked ? '#10b981' : '#ccc';
        thumb.style.left = checkbox.checked ? '27px' : '3px';
      });
    }
    
    setupToggle(analyticsCheckbox);
    setupToggle(marketingCheckbox);

    // Events
    document.getElementById('ortModalClose').addEventListener('click', hideModal);
    
    modalElement.addEventListener('click', (e) => {
      if (e.target === modalElement) hideModal();
    });

    document.getElementById('ortModalReject').addEventListener('click', () => {
      saveConsent({ necessary: true, analytics: false, marketing: false, ts: Date.now() });
    });

    document.getElementById('ortModalConfirm').addEventListener('click', () => {
      saveConsent({
        necessary: true,
        analytics: analyticsCheckbox?.checked || false,
        marketing: marketingCheckbox?.checked || false,
        ts: Date.now()
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalElement.style.display === 'flex') {
        hideModal();
      }
    });

    return modalElement;
  }

  function showModal() {
    createModal().style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function hideModal() {
    if (modalElement) {
      modalElement.style.display = 'none';
      document.body.style.overflow = '';
    }
  }

  // ============================================
  // INITIALISATION
  // ============================================
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    injectFooter();

    const consent = readConsent();
    if (!consent) {
      setTimeout(showBanner, 800);
    } else {
      applyConsent(consent);
    }

    console.log('[ORT-FOOTER] Initialisé - Consentement:', consent ? 'oui' : 'non');
  }

  init();

  window.ORT_FOOTER = {
    showBanner,
    hideBanner,
    showModal,
    hideModal,
    readConsent,
    saveConsent
  };

})();