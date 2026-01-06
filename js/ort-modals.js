/**
 * OneRoadTrip - Modales de connexion et partage
 * À inclure dans tous les fronts (RT Detail, Simple, Mobile)
 */

// === MODALE DE CONNEXION (Sauvegarde) ===
function showLoginModalForSave() {
  const lang = (document.documentElement.lang || 'fr').slice(0, 2);
  const labels = {
    fr: {
      title: '🔐 Connexion requise',
      message: 'Vous devez être connecté pour sauvegarder votre voyage dans le dashboard.',
      button: '🔐 Se connecter'
    },
    en: {
      title: '🔐 Login required',
      message: 'You must be logged in to save your trip to the dashboard.',
      button: '🔐 Sign in'
    }
  }[lang] || {
    title: '🔐 Login required',
    message: 'You must be logged in to save your trip to the dashboard.',
    button: '🔐 Sign in'
  };

  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; inset: 0; background: rgba(0,0,0,0.6);
    display: flex; align-items: center; justify-content: center;
    z-index: 10000; font-family: system-ui, sans-serif;
  `;

  const modal = document.createElement('div');
  modal.style.cssText = `
    background: white; border-radius: 12px; padding: 32px;
    max-width: 400px; width: 90%; text-align: center;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  `;

  modal.innerHTML = `
    <div style="font-size: 3em; margin-bottom: 16px;">🔐</div>
    <h2 style="color: #113f7a; margin-bottom: 12px; font-size: 1.4em;">
      ${labels.title}
    </h2>
    <p style="color: #666; margin-bottom: 24px; font-size: 1em; line-height: 1.5;">
      ${labels.message}
    </p>
    <div style="display: flex; gap: 12px; justify-content: center;">
      <button id="loginBtn" style="
        background: #113f7a; color: white; border: none;
        padding: 12px 24px; border-radius: 8px; cursor: pointer;
        font-weight: 600; font-size: 1em; flex: 1;
      ">
        ${labels.button}
      </button>
      <button id="closeBtn" style="
        background: #f0f0f0; color: #333; border: none;
        padding: 12px 24px; border-radius: 8px; cursor: pointer;
        font-weight: 600; font-size: 1em; flex: 1;
      ">
        ✕ Fermer
      </button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  modal.querySelector('#closeBtn').addEventListener('click', () => overlay.remove());
  modal.querySelector('#loginBtn').addEventListener('click', () => {
    // Rediriger vers page de connexion ou ouvrir modal auth
    if (typeof showAuthModal === 'function') {
      showAuthModal();
    } else if (typeof openAuthModal === 'function') {
      openAuthModal();
    } else {
      window.location.href = '/auth.html';
    }
    overlay.remove();
  });
}

// === MODALE DE PARTAGE (RT doit être sauvegardé) ===
function showSaveBeforeShareModal() {
  const lang = (document.documentElement.lang || 'fr').slice(0, 2);
  const labels = {
    fr: {
      title: '💾 Sauvegarde requise',
      message: 'Votre voyage doit être sauvegardé sur le dashboard avant de pouvoir le partager avec d\'autres.',
      button: '💾 Sauvegarder d\'abord'
    },
    en: {
      title: '💾 Save required',
      message: 'Your trip must be saved to the dashboard before you can share it with others.',
      button: '💾 Save first'
    }
  }[lang] || {
    title: '💾 Save required',
    message: 'Your trip must be saved to the dashboard before you can share it with others.',
    button: '💾 Save first'
  };

  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; inset: 0; background: rgba(0,0,0,0.6);
    display: flex; align-items: center; justify-content: center;
    z-index: 10000; font-family: system-ui, sans-serif;
  `;

  const modal = document.createElement('div');
  modal.style.cssText = `
    background: white; border-radius: 12px; padding: 32px;
    max-width: 400px; width: 90%; text-align: center;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  `;

  modal.innerHTML = `
    <div style="font-size: 3em; margin-bottom: 16px;">💾</div>
    <h2 style="color: #113f7a; margin-bottom: 12px; font-size: 1.4em;">
      ${labels.title}
    </h2>
    <p style="color: #666; margin-bottom: 24px; font-size: 1em; line-height: 1.5;">
      ${labels.message}
    </p>
    <div style="display: flex; gap: 12px; justify-content: center;">
      <button id="saveBtn" style="
        background: #113f7a; color: white; border: none;
        padding: 12px 24px; border-radius: 8px; cursor: pointer;
        font-weight: 600; font-size: 1em; flex: 1;
      ">
        ${labels.button}
      </button>
      <button id="closeBtn" style="
        background: #f0f0f0; color: #333; border: none;
        padding: 12px 24px; border-radius: 8px; cursor: pointer;
        font-weight: 600; font-size: 1em; flex: 1;
      ">
        ✕ Fermer
      </button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  modal.querySelector('#closeBtn').addEventListener('click', () => overlay.remove());
  modal.querySelector('#saveBtn').addEventListener('click', () => {
    // Déclencher la sauvegarde
    const saveBtn = document.getElementById('btnSave');
    if (saveBtn) {
      saveBtn.click();
    }
    overlay.remove();
  });
}

console.log('[ORT-MODALS] ✅ Modales chargées');
