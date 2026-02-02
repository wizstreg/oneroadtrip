// ort-auth-gate.js - Gate d'authentification BLOQUANTE
// Pas de fermeture possible sans connexion
// Utilise OrtAuthModal pour l'authentification email
(function() {
  'use strict';

  // Délai de 30 secondes avant d'afficher la gate
  // Permet aux visiteurs de voir le contenu des roadtrips avant de demander l'auth
  const AUTH_GATE_DELAY = 30000; // 30 secondes
  let authModal = null;

  // Créer la modale bloquante
  function createAuthGate() {
    const i18n = window.ORT_AUTH_I18N || {};
    const t = (key) => i18n.t ? i18n.t(key) : key;
    const isRTL = i18n.isRTL ? i18n.isRTL() : false;

    // Overlay qui floute et bloque tout
    // z-index 9999 pour que la modale auth (10000) passe au-dessus
    const overlay = document.createElement('div');
    overlay.id = 'ort-auth-gate-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 9999;
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
      <div style="font-size: 48px; margin-bottom: 20px;">🔒</div>
      <h2 style="margin: 0 0 16px 0; font-size: 24px; color: #1a1a1a; font-weight: 700;">
        ${t('title')}
      </h2>
      <p style="margin: 0 0 20px 0; font-size: 15px; color: #555; line-height: 1.6;">
        ${t('message')}
      </p>
      <p style="margin: 0 0 28px 0; font-size: 14px; color: #22c55e; font-weight: 600;">
        ${t('freeNote')}
      </p>
      <button id="ort-auth-gate-google" style="
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        width: 100%;
        padding: 14px 24px;
        margin-bottom: 12px;
        background: white;
        color: #333;
        border: 2px solid #ddd;
        border-radius: 10px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: border-color 0.2s, box-shadow 0.2s;
      ">
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style="width: 20px; height: 20px;">
        Google
      </button>
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
    const googleBtn = document.getElementById('ort-auth-gate-google');
    const signupBtn = document.getElementById('ort-auth-gate-signup');
    const loginBtn = document.getElementById('ort-auth-gate-login');

    googleBtn.addEventListener('mouseenter', () => {
      googleBtn.style.borderColor = '#4285f4';
      googleBtn.style.boxShadow = '0 4px 12px rgba(66, 133, 244, 0.3)';
    });
    googleBtn.addEventListener('mouseleave', () => {
      googleBtn.style.borderColor = '#ddd';
      googleBtn.style.boxShadow = 'none';
    });

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

    // Actions des boutons
    googleBtn.addEventListener('click', () => {
      signInWithGoogle();
    });

    signupBtn.addEventListener('click', () => {
      openEmailModal('signup');
    });

    loginBtn.addEventListener('click', () => {
      openEmailModal('login');
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
      
      /* Cacher le contenu derrière - SAUF bannières cookies */
      body.ort-auth-blocked > *:not(#ort-auth-gate-overlay):not(#authModalOverlay):not(#ortCookieBanner):not(#ortCookieModal):not([id*="cookie"]):not([id*="Cookie"]):not([id*="consent"]):not([id*="Consent"]) {
        filter: blur(5px);
        pointer-events: none;
        user-select: none;
      }
      
      /* S'assurer que les bannières cookies ORT sont au-dessus et cliquables */
      #ortCookieBanner, #ortCookieModal {
        z-index: 100000 !important;
        filter: none !important;
        pointer-events: auto !important;
        user-select: auto !important;
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

  // Connexion avec Google
  function signInWithGoogle() {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      firebase.auth().signInWithPopup(provider)
        .then((result) => {
          console.log('[ORT-AUTH-GATE] ✅ Connexion Google réussie:', result.user.email);
          // La gate sera fermée automatiquement par onAuthStateChanged
        })
        .catch((error) => {
          console.error('[ORT-AUTH-GATE] ❌ Erreur Google:', error);
          alert(error.message || 'Erreur de connexion Google');
        });
    } catch (e) {
      console.error('[ORT-AUTH-GATE] ❌ Erreur:', e);
    }
  }

  // Ouvrir la modale email avec OrtAuthModal
  async function openEmailModal(mode) {
    // Attendre que OrtAuthModal soit disponible
    let attempts = 0;
    while (typeof OrtAuthModal === 'undefined' && attempts < 20) {
      await new Promise(r => setTimeout(r, 100));
      attempts++;
    }
    
    if (typeof OrtAuthModal === 'undefined') {
      console.error('[ORT-AUTH-GATE] OrtAuthModal non disponible après timeout');
      alert('Erreur: Module d\'authentification non chargé');
      return;
    }
    
    // Créer l'instance si nécessaire
    if (!authModal) {
      authModal = new OrtAuthModal();
      const initialized = await authModal.init();
      if (!initialized) {
        console.error('[ORT-AUTH-GATE] Échec de l\'initialisation de OrtAuthModal');
        alert('Erreur: Impossible d\'initialiser l\'authentification');
        return;
      }
    }
    
    // Configurer le mode (login ou signup)
    authModal.mode = mode;
    authModal.updateUI();
    authModal.show();
    
    console.log('[ORT-AUTH-GATE] Modale email ouverte en mode:', mode);
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
  let authChecked = false;
  
  function checkAuth() {
    // Tester Firebase directement
    try {
      if (typeof firebase === 'undefined' || !firebase.auth) {
        throw new Error('Firebase not loaded');
      }
      const auth = firebase.auth();
      if (!auth) {
        throw new Error('Auth not ready');
      }
      
      console.log('[ORT-AUTH-GATE] ✅ Firebase prêt, attente état auth...');
      
      // TOUJOURS utiliser onAuthStateChanged, jamais currentUser directement
      auth.onAuthStateChanged((user) => {
        if (user) {
          console.log('[ORT-AUTH-GATE] ✅ Utilisateur connecté:', user.email);
          authChecked = true;
          removeAuthGate();
        } else if (!authChecked) {
          // Premier callback avec null - attendre un peu car Firebase peut encore restaurer la session
          console.log('[ORT-AUTH-GATE] ⏳ Pas encore connecté, attente restauration session...');
          setTimeout(() => {
            // Revérifier après le délai
            if (!firebase.auth().currentUser && !document.getElementById('ort-auth-gate-overlay')) {
              console.log('[ORT-AUTH-GATE] ❌ Utilisateur non connecté (confirmé)');
              // Attendre 30 secondes avant d'afficher la gate (pour laisser voir le contenu)
              console.log('[ORT-AUTH-GATE] ⏳ Délai de 30s pour laisser voir le contenu...');
              setTimeout(() => {
                // Vérifier une dernière fois que l'utilisateur ne s'est pas connecté entre temps
                if (!firebase.auth().currentUser && !document.getElementById('ort-auth-gate-overlay')) {
                  createAuthGate();
                }
              }, 30000); // 30 secondes
            }
          }, 1000); // Attendre 1s pour la restauration de session
        }
      });
    } catch (e) {
      console.log('[ORT-AUTH-GATE] ⏳ Attente Firebase...', e.message);
      setTimeout(checkAuth, 300);
    }
  }

  // Démarrer la vérification auth
  function init() {
    // Vérifier si on est sur une page qui nécessite l'auth
    // Pages exclues : accueil, présentation, etc.
    const excludedPages = ['/index.html', '/', '/presentation.html'];
    const currentPath = window.location.pathname;
    
    if (excludedPages.some(page => currentPath.endsWith(page) || currentPath === page)) {
      console.log('[ORT-AUTH-GATE] Page exclue:', currentPath);
      return;
    }

    // Démarrer immédiatement la vérification
    // Si l'utilisateur n'est pas connecté, la gate s'affichera après 30s
    setTimeout(checkAuth, 500); // Court délai pour laisser Firebase s'initialiser
  }

  // Lancer au chargement
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  console.log('[ORT-AUTH-GATE] Module chargé');
})();
