// ============================================================
// OneRoadTrip - Bouton "Installer l'app" + Bulle d'aide iOS
// ------------------------------------------------------------
// Multilingue : fr, en, es, it, pt, ar (RTL pour l'arabe)
// ============================================================

(function() {
  'use strict';

  // ---- Détection de la langue (même logique que ton site) ----
  var SUPPORTED = ['fr','en','es','it','pt','ar'];
  var lang = 'en';
  try {
    // Priorite : 1) ?lang= dans l'URL  2) langue de la page (attribut lang du HTML)
    // 3) langue choisie sur le site (localStorage)  4) langue du navigateur en dernier recours.
    // Avant, le navigateur passait avant la page : un visiteur au navigateur en francais
    // voyait le bouton en francais sur une page espagnole.
    var p = new URLSearchParams(location.search).get('lang');
    var pageLang = (document.documentElement.lang || '').slice(0,2).toLowerCase();
    var storedLang = '';
    try { storedLang = (localStorage.getItem('lang') || '').slice(0,2).toLowerCase(); } catch(e2) {}
    if (p && SUPPORTED.indexOf(p) !== -1) {
      lang = p;
    } else if (SUPPORTED.indexOf(pageLang) !== -1) {
      lang = pageLang;
    } else if (SUPPORTED.indexOf(storedLang) !== -1) {
      lang = storedLang;
    } else {
      var navLangs = navigator.languages || [navigator.language || ''];
      for (var i = 0; i < navLangs.length; i++) {
        var n = (navLangs[i] || '').slice(0,2).toLowerCase();
        if (SUPPORTED.indexOf(n) !== -1) { lang = n; break; }
      }
    }
  } catch(e) {}

  // ---- Traductions ----
  var T = {
    fr: {
      install: "Installer l'app",
      close: "Fermer"
    },
    en: {
      install: "Install the app",
      close: "Close"
    },
    es: {
      install: "Instalar la app",
      close: "Cerrar"
    },
    it: {
      install: "Installa l'app",
      close: "Chiudi"
    },
    pt: {
      install: "Instalar a app",
      close: "Fechar"
    },
    ar: {
      install: "تثبيت التطبيق",
      close: "إغلاق"
    }
  };
  var tr = T[lang] || T.en;
  var isRTL = (lang === 'ar');

  // ---- Si on tourne déjà DANS l'app installée → on ne montre rien ----
  if (window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true) {
    return;
  }

  // ---- Si l'user a refusé récemment, on respecte (7 jours) ----
  var dismissedAt = localStorage.getItem('ort-pwa-dismissed-at');
  if (dismissedAt && (Date.now() - parseInt(dismissedAt, 10)) < 7 * 24 * 60 * 60 * 1000) {
    return;
  }

  // ---- Détection iOS / Android ----
  var ua = navigator.userAgent || '';
  var isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;

  // Sur iPhone/iPad : on n'affiche plus rien du tout.
  // Apple interdit l'installation au clic, l'ancienne bulle d'explication
  // n'etait comprise par personne.
  if (isIOS) return;

  // ============================================================
  // CSS commun (pour bouton Android et bulle iOS)
  // ============================================================
  var style = document.createElement('style');
  style.textContent = `
    #ort-install-btn {
      position: fixed;
      z-index: 9999;
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      box-shadow: 0 4px 16px rgba(0,0,0,0.25);
      animation: ort-install-slide-in 0.4s ease-out;
    }
    #ort-install-btn {
      bottom: 20px;
      ${isRTL ? 'left' : 'right'}: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      background: linear-gradient(135deg, #2196F3 0%, #4CAF50 100%);
      color: #fff;
      border: none;
      border-radius: 50px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      direction: ${isRTL ? 'rtl' : 'ltr'};
    }
    #ort-install-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0,0,0,0.3);
    }
    #ort-install-btn .ort-close {
      margin-${isRTL ? 'right' : 'left'}: 6px;
      padding: 0 6px;
      font-size: 18px;
      line-height: 1;
      opacity: 0.7;
      cursor: pointer;
    }
    #ort-install-btn .ort-close:hover { opacity: 1; }

    @keyframes ort-install-slide-in {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @media (max-width: 480px) {
      #ort-install-btn {
        bottom: 16px;
        ${isRTL ? 'left' : 'right'}: 16px;
        padding: 10px 14px;
        font-size: 13px;
      }
    }
  `;
  document.head.appendChild(style);

  // ============================================================
  // Android / Chrome / Edge → bouton automatique
  // ============================================================
  var deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    deferredPrompt = e;
    showInstallButton();
  });

  window.addEventListener('appinstalled', function() {
    if (window.clarity) clarity('event', 'pwa_installee');
    hideInstallButton();
    deferredPrompt = null;
  });

  // ---- Bouton Android ----
  function showInstallButton() {
    if (document.getElementById('ort-install-btn')) return;
    var btn = document.createElement('button');
    btn.id = 'ort-install-btn';
    btn.setAttribute('aria-label', tr.install);
    btn.innerHTML =
      '<span style="display:flex;align-items:center;">' +
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>' +
          '<polyline points="7 10 12 15 17 10"/>' +
          '<line x1="12" y1="15" x2="12" y2="3"/>' +
        '</svg>' +
      '</span>' +
      '<span>' + tr.install + '</span>' +
      '<span class="ort-close" aria-label="' + tr.close + '">×</span>';

    btn.addEventListener('click', function(e) {
      if (e.target.classList.contains('ort-close')) {
        localStorage.setItem('ort-pwa-dismissed-at', Date.now().toString());
        if (window.clarity) clarity('event', 'pwa_ferme');
        hideInstallButton();
        return;
      }

      // Le signal d'Android a expire ou a deja ete consomme : le bouton ne sert plus a rien.
      if (!deferredPrompt) {
        if (window.clarity) clarity('event', 'pwa_bouton_mort');
        hideInstallButton();
        return;
      }

      if (window.clarity) clarity('event', 'pwa_clic_installer');

      var prompted = deferredPrompt;
      deferredPrompt = null; // consomme tout de suite : un 2e clic ne peut plus rien casser

      try {
        prompted.prompt();
        prompted.userChoice.then(function(choice) {
          if (window.clarity) clarity('event', 'pwa_choix_' + choice.outcome);
          if (choice.outcome === 'dismissed') {
            localStorage.setItem('ort-pwa-dismissed-at', Date.now().toString());
          }
          hideInstallButton();
        }).catch(function(err) {
          if (window.clarity) clarity('event', 'pwa_erreur_choix');
          console.warn('[ORT] userChoice en echec :', err);
          hideInstallButton();
        });
      } catch (err) {
        if (window.clarity) clarity('event', 'pwa_erreur_prompt');
        console.warn('[ORT] prompt() en echec :', err);
        hideInstallButton();
      }
    });

    appendWhenReady(btn);
  }

  function hideInstallButton() {
    var btn = document.getElementById('ort-install-btn');
    if (btn) btn.remove();
  }

  // ---- Utilitaire : ajout au DOM dès qu'il est prêt ----
  function appendWhenReady(el) {
    if (document.body) {
      document.body.appendChild(el);
    } else {
      document.addEventListener('DOMContentLoaded', function() {
        document.body.appendChild(el);
      });
    }
  }
})();
