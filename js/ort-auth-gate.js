// ort-auth-gate.js - Gate d'authentification BLOQUANTE
// Pas de fermeture possible sans connexion
(function() {
  'use strict';

  const AUTH_GATE_DELAY = 1500; // Délai avant d'afficher la gate (laisser le temps à Firebase)
  
  // URLs de redirection (à adapter selon ton site)
  const LOGIN_URL = '/login.html';
  const SIGNUP_URL = '/signup.html';

  // Créer la modale bloquante
  function createAuthGate() {
    const i18n = window.ORT_AUTH_I18N || {};
    const t = (key) => i18n.t ? i18n.t(key) : key;
    const isRTL = i18n.isRTL ? i18n.isRTL() : false;

    // Overlay qui floute et bloque tout
    const overlay = document.createElement('div');
    overlay.id = 'ort-auth-gate-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;

    // Modale
    const modal = document.createElement('div');
    modal.id = 'ort-auth-gate-modal';
    modal.style.cssText = `
      background: white;
      border-radius: 16px;
      padding: 40px;
      max-width: 420px;
      width: 90%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      transform: scale(0.9);
      transition: transform 0.3s ease;
      ${isRTL ? 'direction: rtl;' : ''}
    `;

    modal.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 20px;">🔐</div>
      <h2 style="margin: 0 0 16px 0; font-size: 24px; color: #1a1a1a; font-weight: 700;">
        ${t('title')}
      </h2>
      <p style="margin: 0 0 20px 0; font-size: 15px; color: #555; line-height: 1.6;">
        ${t('message')}
      </p>
      <p style="margin: 0 0 28px 0; font-size: 14px; color: #22c55e; font-weight: 600;">
        ${t('freeNote')}
      </p>
      <button id="ort-auth-gate-signup" style="
        display: block;
        width: 100%;
        padding: 14px 24px;
        margin-bottom: 12px;
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: white;
        border: none;
        border-radius: 10px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
      ">
        ${t('btnSignup')}
      </button>
      <button id="ort-auth-gate-login" style="
        display: block;
        width: 100%;
        padding: 14px 24px;
        background: white;
        color: #3b82f6;
        border: 2px solid #3b82f6;
        border-radius: 10px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s, color 0.2s;
      ">
        ${t('btnLogin')}
      </button>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Animation d'entrée
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      modal.style.transform = 'scale(1)';
    });

    // Hover effects
    const signupBtn = document.getElementById('ort-auth-gate-signup');
    const loginBtn = document.getElementById('ort-auth-gate-login');

    signupBtn.addEventListener('mouseenter', () => {
      signupBtn.style.transform = 'translateY(-2px)';
      signupBtn.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
    });
    signupBtn.addEventListener('mouseleave', () => {
      signupBtn.style.transform = 'translateY(0)';
      signupBtn.style.boxShadow = 'none';
    });

    loginBtn.addEventListener('mouseenter', () => {
      loginBtn.style.background = '#3b82f6';
      loginBtn.style.color = 'white';
    });
    loginBtn.addEventListener('mouseleave', () => {
      loginBtn.style.background = 'white';
      loginBtn.style.color = '#3b82f6';
    });

    // Stocker l'URL actuelle pour revenir après login
    const currentUrl = window.location.href;
    sessionStorage.setItem('ort_auth_redirect', currentUrl);

    // Actions des boutons
    signupBtn.addEventListener('click', () => {
      window.location.href = SIGNUP_URL + '?redirect=' + encodeURIComponent(currentUrl);
    });

    loginBtn.addEventListener('click', () => {
      window.location.href = LOGIN_URL + '?redirect=' + encodeURIComponent(currentUrl);
    });

    // BLOQUER toute fermeture
    // Bloquer Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);

    // Bloquer clic en dehors (ne fait rien)
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        // Petit shake pour montrer qu'on ne peut pas fermer
        modal.style.animation = 'ort-shake 0.5s';
        setTimeout(() => modal.style.animation = '', 500);
      }
    });

    // Ajouter animation shake
    const style = document.createElement('style');
    style.textContent = `
      @keyframes ort-shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
      }
      
      /* Cacher le contenu derrière */
      body.ort-auth-blocked > *:not(#ort-auth-gate-overlay) {
        filter: blur(5px);
        pointer-events: none;
        user-select: none;
      }
      
      /* Empêcher le scroll */
      body.ort-auth-blocked {
        overflow: hidden !important;
      }
    `;
    document.head.appendChild(style);

    // Bloquer le body
    document.body.classList.add('ort-auth-blocked');

    console.log('[ORT-AUTH-GATE] 🔒 Gate affichée - authentification requise');
  }

  // Supprimer la gate
  function removeAuthGate() {
    const overlay = document.getElementById('ort-auth-gate-overlay');
    if (overlay) {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 300);
    }
    document.body.classList.remove('ort-auth-blocked');
    console.log('[ORT-AUTH-GATE] ✅ Gate retirée - utilisateur authentifié');
  }

  // Vérifier l'authentification
  function checkAuth() {
    // Attendre que Firebase soit prêt
    if (typeof firebase === 'undefined' || !firebase.auth) {
      console.log('[ORT-AUTH-GATE] ⏳ Attente Firebase...');
      setTimeout(checkAuth, 200);
      return;
    }

    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        console.log('[ORT-AUTH-GATE] ✅ Utilisateur connecté:', user.email);
        removeAuthGate();
      } else {
        console.log('[ORT-AUTH-GATE] ❌ Utilisateur non connecté');
        // Vérifier si la gate existe déjà
        if (!document.getElementById('ort-auth-gate-overlay')) {
          createAuthGate();
        }
      }
    });
  }

  // Démarrer après un court délai (laisser le temps à Firebase de s'initialiser)
  function init() {
    // Vérifier si on est sur une page qui nécessite l'auth
    // (on peut exclure certaines pages comme login.html, signup.html)
    const excludedPages = ['/login.html', '/signup.html', '/reset-password.html', '/index.html', '/'];
    const currentPath = window.location.pathname;
    
    if (excludedPages.some(page => currentPath.endsWith(page) || currentPath === page)) {
      console.log('[ORT-AUTH-GATE] Page exclue:', currentPath);
      return;
    }

    setTimeout(checkAuth, AUTH_GATE_DELAY);
  }

  // Lancer au chargement
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  console.log('[ORT-AUTH-GATE] Module chargé');
})();
