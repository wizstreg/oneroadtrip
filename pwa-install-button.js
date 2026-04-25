// ============================================================
// OneRoadTrip - Bouton "Installer l'app"
// ------------------------------------------------------------
// Affiche un petit bouton flottant en bas à droite quand
// le navigateur juge l'app installable. Se cache tout seul
// si l'app est déjà installée ou si l'user a refusé.
// ============================================================

(function() {
  'use strict';

  // Si on tourne déjà DANS l'app installée → on ne montre rien
  if (window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true) {
    return;
  }

  // Si l'user a déjà dit non récemment, on respecte
  const dismissedAt = localStorage.getItem('ort-pwa-dismissed-at');
  if (dismissedAt && (Date.now() - parseInt(dismissedAt, 10)) < 7 * 24 * 60 * 60 * 1000) {
    return; // moins de 7 jours depuis le refus
  }

  let deferredPrompt = null;

  // 1. Capturer l'événement d'installation proposé par Chrome/Edge
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallButton();
  });

  // 2. Détecter installation réussie → cacher le bouton
  window.addEventListener('appinstalled', () => {
    hideInstallButton();
    deferredPrompt = null;
  });

  // ----- UI du bouton -----

  function createInstallButton() {
    const btn = document.createElement('button');
    btn.id = 'ort-install-btn';
    btn.setAttribute('aria-label', 'Installer l\'application OneRoadTrip');
    btn.innerHTML = `
      <span class="ort-install-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      </span>
      <span class="ort-install-text">Installer l'app</span>
      <span class="ort-install-close" aria-label="Fermer">×</span>
    `;

    const style = document.createElement('style');
    style.textContent = `
      #ort-install-btn {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 16px;
        background: linear-gradient(135deg, #2196F3 0%, #4CAF50 100%);
        color: #fff;
        border: none;
        border-radius: 50px;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 4px 16px rgba(0,0,0,0.25);
        cursor: pointer;
        animation: ort-install-slide-in 0.4s ease-out;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      #ort-install-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0,0,0,0.3);
      }
      #ort-install-btn .ort-install-icon {
        display: flex;
        align-items: center;
      }
      #ort-install-btn .ort-install-close {
        margin-left: 6px;
        padding: 0 6px;
        font-size: 18px;
        line-height: 1;
        opacity: 0.7;
        cursor: pointer;
      }
      #ort-install-btn .ort-install-close:hover {
        opacity: 1;
      }
      @keyframes ort-install-slide-in {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @media (max-width: 480px) {
        #ort-install-btn {
          bottom: 16px;
          right: 16px;
          padding: 10px 14px;
          font-size: 13px;
        }
      }
    `;
    document.head.appendChild(style);

    // Clic sur le bouton (hors croix) → lancer l'installation
    btn.addEventListener('click', async (e) => {
      if (e.target.classList.contains('ort-install-close')) {
        // Croix : fermer + retenir le refus pour 7 jours
        localStorage.setItem('ort-pwa-dismissed-at', Date.now().toString());
        hideInstallButton();
        return;
      }
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'dismissed') {
        localStorage.setItem('ort-pwa-dismissed-at', Date.now().toString());
      }
      deferredPrompt = null;
      hideInstallButton();
    });

    return btn;
  }

  function showInstallButton() {
    if (document.getElementById('ort-install-btn')) return;
    const btn = createInstallButton();
    if (document.body) {
      document.body.appendChild(btn);
    } else {
      document.addEventListener('DOMContentLoaded', () => document.body.appendChild(btn));
    }
  }

  function hideInstallButton() {
    const btn = document.getElementById('ort-install-btn');
    if (btn) btn.remove();
  }
})();
