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
      ar: 'about-ar.html',
      nl: 'about-nl.html',
      de: 'about-de.html'
    };
    return ABOUT_PAGES[lang] || ABOUT_PAGES.en;
  }

  // ============================================
  // TRADUCTIONS COOKIES (6 langues)
  // ============================================
  // Traductions du bandeau cookies : elles vivent maintenant dans
  // ort-i18n-socle.js (format une cle puis les langues).
  // On garde le meme nom pour ne rien casser dans le reste du fichier.
  const COOKIE_I18N = window.ORT_COOKIE_I18N || {};

  // ============================================
  // UTILITAIRES
  // ============================================
  
  function getLang() {
    // 1. Chemin URL — source la plus fiable sur les pages statiques
    var pathMap = {itineraires:'fr',itineraries:'en',rutas:'es',roteiros:'pt',itinerari:'it',masar:'ar'};
    var pathMatch = window.location.pathname.match(/^\/(itineraires|itineraries|rutas|roteiros|itinerari|masar)\//);
    if (pathMatch && pathMap[pathMatch[1]]) return pathMap[pathMatch[1]];
    // 2. Module i18n si disponible
    if (window.ORT_I18N_AUTH?.detectLang) {
      return window.ORT_I18N_AUTH.detectLang();
    }
    // 3. Paramètre URL
    const urlLang = new URLSearchParams(window.location.search).get('lang');
    if (urlLang && COOKIE_I18N[urlLang]) {
      return urlLang;
    }
    // 4. localStorage ou navigateur
    return localStorage.getItem('lang') || 
           (navigator.language || 'fr').substring(0, 2).toLowerCase();
  }

  function getT() {
    const lang = getLang();
    return COOKIE_I18N[lang] || COOKIE_I18N.en;
  }

  function isRTL() {
    return (window.ORT_RTL_LANGS || ['ar']).indexOf(getLang()) !== -1;
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

  var GA_ID = 'G-JK3QGQGDDL';
  var CLARITY_ID = 'w1sbx0fb07';
  var analyticsLoaded = false;

  function loadAnalytics() {
    if (analyticsLoaded) return;
    analyticsLoaded = true;

    // Google Analytics
    var ga = document.createElement('script');
    ga.async = true;
    ga.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(ga);
    window.dataLayer = window.dataLayer || [];
    function gtag(){ dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_ID);

    // Microsoft Clarity
    (function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script",CLARITY_ID);
  }

  function applyConsent(consent) {
    if (!consent) return;

    if (consent.analytics) {
      loadAnalytics();
    }

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

    // Masquer le footer sur les pages mobile avec header fixe (évite superposition)
    const hasMobileHeader = !!document.querySelector('header.header') && window.innerWidth <= 1024;
    if (hasMobileHeader) {
      footer.style.display = 'none';
      return;
    }

    footer.style.cssText = `
      margin: 18px auto 20px;
      text-align: center;
      font-size: 14px;
      padding: 10px 20px;
      max-width: 1100px;
      background: #113f7a;
      border: 1px solid rgba(195, 214, 182, 0.4);
      border-radius: 10px;
      backdrop-filter: blur(4px);
      position: relative;
      z-index: 1;
      direction: ${rtl ? 'rtl' : 'ltr'};
      display: flex;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
      gap: 6px 10px;
      line-height: 1.4;
    `;

    // URLs des pages légales avec suffixe de langue
    const getLegalUrls = (lang) => ({
      cgu: `/cgu-${lang}.html`,
      privacy: `/confidentialite-${lang}.html`,
      cookies: `/cookies-${lang}.html`,
      about: '/' + getAboutPageUrl(lang)
    });

    const urls = getLegalUrls(lang);
    const pressPages = { fr: 'press-fr', en: 'press-en', es: 'press-es', it: 'press-it', pt: 'press-pt', nl: 'press-nl', de: 'press-de' };
    const pressUrl = '/presentations/' + (pressPages[lang] || 'press-en') + '.html';
    const links = [
      { href: urls.cgu, label: T.legalNotice },
      { href: urls.privacy, label: T.privacyPolicy },
      { href: urls.cookies, label: T.cookiePolicy },
      { href: urls.about, label: T.about },
      { href: pressUrl, label: T.pressRoom },
      { href: '/blog/', label: T.blog }
    ];

    footer.innerHTML = links.map((link, i) => {
      return `<a href="${link.href}" style="color:#fff;text-decoration:none">${link.label}</a> · `;
    }).join('');

    // Lien Contact : adresse reconstruite au clic, jamais en clair dans le HTML (anti-spam)
    const contactLink = document.createElement('a');
    contactLink.href = '#';
    contactLink.textContent = T.contact;
    contactLink.style.cssText = 'color:#fff;text-decoration:none';
    contactLink.addEventListener('click', (e) => {
      e.preventDefault();
      const u = ['contact', 'oneroadtrip.com'];
      window.location.href = 'mailto:' + u[0] + '@' + u[1];
    });
    footer.appendChild(contactLink);

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

    // Bloc partenaire presse InfosTourisme, aligné sur la même ligne que les liens
    const partnerBlock = document.createElement('div');
    partnerBlock.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-${rtl ? 'right' : 'left'}: 6px;
    `;

    const partnerLabel = document.createElement('span');
    partnerLabel.textContent = T.pressPartner + ' :';
    partnerLabel.style.cssText = `
      color: #fff;
      font-size: 13px;
      opacity: 0.85;
    `;

    const partnerLink = document.createElement('a');
    partnerLink.href = 'https://infostourisme.com/';
    partnerLink.target = '_blank';
    partnerLink.rel = 'noopener';
    partnerLink.setAttribute('aria-label', 'InfosTourisme.com');
    partnerLink.style.cssText = `
      display: inline-flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      background: #ffffff;
      padding: 3px 8px;
      border-radius: 5px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    `;

    const partnerImg = document.createElement('img');
    partnerImg.src = '/assets/logos/logoit2-3-scaled.webp';
    partnerImg.alt = 'InfosTourisme.com';
    partnerImg.loading = 'lazy';
    partnerImg.style.cssText = `
      height: 20px;
      width: auto;
      display: block;
      mix-blend-mode: multiply;
    `;

    partnerLink.appendChild(partnerImg);
    partnerBlock.appendChild(partnerLabel);
    partnerBlock.appendChild(partnerLink);
    footer.appendChild(partnerBlock);
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
            <a href="/politique-cookies.html?lang=${lang}" style="color: #113f7a; text-decoration: underline; margin-${rtl ? 'right' : 'left'}: 4px;">
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
          <a href="/politique-cookies.html?lang=${lang}" target="_blank" style="
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