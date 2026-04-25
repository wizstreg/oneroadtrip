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
    var p = new URLSearchParams(location.search).get('lang');
    if (p && SUPPORTED.indexOf(p) !== -1) {
      lang = p;
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
      iosTitle: "Installer OneRoadTrip",
      iosStep1: "Touchez",
      iosStep2: "puis « Sur l'écran d'accueil »",
      close: "Fermer"
    },
    en: {
      install: "Install the app",
      iosTitle: "Install OneRoadTrip",
      iosStep1: "Tap",
      iosStep2: "then \"Add to Home Screen\"",
      close: "Close"
    },
    es: {
      install: "Instalar la app",
      iosTitle: "Instalar OneRoadTrip",
      iosStep1: "Toca",
      iosStep2: "y luego «Añadir a pantalla de inicio»",
      close: "Cerrar"
    },
    it: {
      install: "Installa l'app",
      iosTitle: "Installa OneRoadTrip",
      iosStep1: "Tocca",
      iosStep2: "poi « Aggiungi alla schermata Home »",
      close: "Chiudi"
    },
    pt: {
      install: "Instalar a app",
      iosTitle: "Instalar OneRoadTrip",
      iosStep1: "Toque em",
      iosStep2: "e depois « Adicionar ao Ecrã Principal »",
      close: "Fechar"
    },
    ar: {
      install: "تثبيت التطبيق",
      iosTitle: "تثبيت OneRoadTrip",
      iosStep1: "اضغط على",
      iosStep2: "ثم «إضافة إلى الشاشة الرئيسية»",
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

  // ============================================================
  // CSS commun (pour bouton Android et bulle iOS)
  // ============================================================
  var style = document.createElement('style');
  style.textContent = `
    #ort-install-btn, #ort-ios-bubble {
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

    #ort-ios-bubble {
      bottom: 20px;
      left: 16px;
      right: 16px;
      background: #fff;
      color: #1f2937;
      border-radius: 14px;
      padding: 14px 16px;
      max-width: 480px;
      margin: 0 auto;
      direction: ${isRTL ? 'rtl' : 'ltr'};
      text-align: ${isRTL ? 'right' : 'left'};
    }
    #ort-ios-bubble .ort-bubble-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 8px;
    }
    #ort-ios-bubble .ort-bubble-title {
      font-weight: 700;
      font-size: 15px;
      color: #113f7a;
    }
    #ort-ios-bubble .ort-bubble-text {
      font-size: 13px;
      line-height: 1.4;
      color: #4b5563;
    }
    #ort-ios-bubble .ort-share-icon {
      display: inline-flex;
      vertical-align: middle;
      margin: 0 4px;
      color: #2196F3;
    }
    #ort-ios-bubble .ort-close-bubble {
      background: none;
      border: none;
      font-size: 22px;
      line-height: 1;
      color: #9ca3af;
      cursor: pointer;
      padding: 0 4px;
    }
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
  // CAS 1 : iPhone/iPad → bulle d'aide après 10 secondes
  // ============================================================
  if (isIOS) {
    setTimeout(showIOSBubble, 10000);
    return;
  }

  // ============================================================
  // CAS 2 : Android / Chrome / Edge → bouton automatique
  // ============================================================
  var deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    deferredPrompt = e;
    showInstallButton();
  });

  window.addEventListener('appinstalled', function() {
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
        hideInstallButton();
        return;
      }
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function(choice) {
        if (choice.outcome === 'dismissed') {
          localStorage.setItem('ort-pwa-dismissed-at', Date.now().toString());
        }
        deferredPrompt = null;
        hideInstallButton();
      });
    });

    appendWhenReady(btn);
  }

  function hideInstallButton() {
    var btn = document.getElementById('ort-install-btn');
    if (btn) btn.remove();
  }

  // ---- Bulle iOS ----
  function showIOSBubble() {
    if (document.getElementById('ort-ios-bubble')) return;
    var box = document.createElement('div');
    box.id = 'ort-ios-bubble';
    // Icône Partager iOS (carré avec flèche vers le haut)
    var shareIcon =
      '<span class="ort-share-icon">' +
        '<svg width="18" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/>' +
          '<polyline points="16 6 12 2 8 6"/>' +
          '<line x1="12" y1="2" x2="12" y2="15"/>' +
        '</svg>' +
      '</span>';

    box.innerHTML =
      '<div class="ort-bubble-head">' +
        '<div class="ort-bubble-title">' + tr.iosTitle + '</div>' +
        '<button class="ort-close-bubble" aria-label="' + tr.close + '">×</button>' +
      '</div>' +
      '<div class="ort-bubble-text">' +
        tr.iosStep1 + ' ' + shareIcon + ' ' + tr.iosStep2 +
      '</div>';

    box.querySelector('.ort-close-bubble').addEventListener('click', function() {
      localStorage.setItem('ort-pwa-dismissed-at', Date.now().toString());
      box.remove();
    });

    appendWhenReady(box);
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
