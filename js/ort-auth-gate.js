/**
 * ORT-AUTH-GATE.js
 * Vérifie l'authentification au chargement des pages roadtrip_detail
 * Affiche une modale obligatoire si l'utilisateur n'est pas connecté
 * 
 * Prérequis :
 * - ort-i18n-auth.js chargé AVANT ce script
 * - ort-header.js chargé (pour showEmailModal)
 * - Firebase initialisé
 * 
 * Usage : Inclure ce script dans roadtrip_detail.html, roadtrip_detail_simple.html, roadtrip_mobile.html
 * <script src="/js/ort-auth-gate.js"></script>
 */
(function() {
  'use strict';

  const MODAL_ID = 'ortAuthGateModal';
  const MODAL_ZINDEX = 10001; // Au-dessus de la modale auth standard

  // ============================================
  // UTILITAIRES
  // ============================================
  
  /** Récupère la langue courante */
  function getLang() {
    return window.ORT_I18N_AUTH?.detectLang?.() || 'fr';
  }

  /** Récupère les traductions */
  function getT() {
    return window.ORT_I18N_AUTH?.get?.(getLang()) || window.ORT_I18N_AUTH?.fr || {};
  }

  /** Attend que Firebase soit prêt */
  async function waitForFirebase(maxAttempts = 50) {
    for (let i = 0; i < maxAttempts; i++) {
      if (window.firebase?.auth) {
        return window.firebase;
      }
      await new Promise(r => setTimeout(r, 100));
    }
    console.warn('[ORT-AUTH-GATE] Firebase non disponible après timeout');
    return null;
  }

  /** Attend que ORT_HEADER soit prêt */
  async function waitForHeader(maxAttempts = 50) {
    for (let i = 0; i < maxAttempts; i++) {
      if (window.ORT_HEADER?.showEmailModal) {
        return window.ORT_HEADER;
      }
      await new Promise(r => setTimeout(r, 100));
    }
    console.warn('[ORT-AUTH-GATE] ORT_HEADER non disponible après timeout');
    return null;
  }

  // ============================================
  // MODALE INSCRIPTION REQUISE
  // ============================================

  /** Crée et affiche la modale d'inscription obligatoire */
  function showAuthRequiredModal() {
    // Ne pas afficher si déjà présente
    if (document.getElementById(MODAL_ID)) return;

    const T = getT();
    const lang = getLang();
    const isRTL = lang === 'ar';

    const modal = document.createElement('div');
    modal.id = MODAL_ID;
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: ${MODAL_ZINDEX};
      padding: 20px;
      direction: ${isRTL ? 'rtl' : 'ltr'};
    `;

    modal.innerHTML = `
      <div style="
        background: white;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        width: 100%;
        max-width: 420px;
        padding: 32px;
        text-align: center;
      ">
        <!-- Icône -->
        <div style="font-size: 48px; margin-bottom: 16px;">🔐</div>
        
        <!-- Titre -->
        <h2 style="
          margin: 0 0 16px;
          font-size: 1.5rem;
          color: #1a1a2e;
          font-weight: 700;
        ">${T.authRequiredTitle || 'Inscription requise'}</h2>
        
        <!-- Texte explicatif -->
        <p style="
          margin: 0 0 12px;
          color: #555;
          font-size: 1rem;
          line-height: 1.5;
        ">${T.authRequiredText || 'Pour voir la suite de cet itinéraire, vous devez être inscrit.'}</p>
        
        <!-- Mention gratuit -->
        <p style="
          margin: 0 0 24px;
          color: #10b981;
          font-size: 0.95rem;
          font-weight: 600;
        ">✓ ${T.authRequiredFree || 'Toutes ces fonctionnalités sont entièrement gratuites.'}</p>
        
        <!-- Boutons -->
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <button id="ortAuthGateSignup" style="
            background: #2563eb;
            color: white;
            border: none;
            padding: 14px 24px;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
          ">${T.authRequiredSignup || 'Créer mon compte gratuit'}</button>
          
          <button id="ortAuthGateLogin" style="
            background: transparent;
            color: #2563eb;
            border: 2px solid #2563eb;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          ">${T.authRequiredLogin || 'J\'ai déjà un compte'}</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Hover effects
    const btnSignup = document.getElementById('ortAuthGateSignup');
    const btnLogin = document.getElementById('ortAuthGateLogin');

    btnSignup.addEventListener('mouseenter', () => btnSignup.style.background = '#1d4ed8');
    btnSignup.addEventListener('mouseleave', () => btnSignup.style.background = '#2563eb');
    
    btnLogin.addEventListener('mouseenter', () => {
      btnLogin.style.background = '#2563eb';
      btnLogin.style.color = 'white';
    });
    btnLogin.addEventListener('mouseleave', () => {
      btnLogin.style.background = 'transparent';
      btnLogin.style.color = '#2563eb';
    });

    // Event handlers
    btnSignup.addEventListener('click', () => {
      closeAuthRequiredModal();
      if (window.ORT_HEADER?.showEmailModal) {
        window.ORT_HEADER.showEmailModal('signup');
      } else {
        console.error('[ORT-AUTH-GATE] ORT_HEADER.showEmailModal non disponible');
      }
    });

    btnLogin.addEventListener('click', () => {
      closeAuthRequiredModal();
      if (window.ORT_HEADER?.showEmailModal) {
        window.ORT_HEADER.showEmailModal('login');
      } else {
        console.error('[ORT-AUTH-GATE] ORT_HEADER.showEmailModal non disponible');
      }
    });

    // Empêcher le scroll du body
    document.body.style.overflow = 'hidden';

    console.log('[ORT-AUTH-GATE] Modale inscription requise affichée');
  }

  /** Ferme la modale */
  function closeAuthRequiredModal() {
    const modal = document.getElementById(MODAL_ID);
    if (modal) {
      modal.remove();
      document.body.style.overflow = '';
    }
  }

  // ============================================
  // VÉRIFICATION D'AUTHENTIFICATION
  // ============================================

  /** Vérifie si l'utilisateur est authentifié */
  async function checkAuth() {
    const fb = await waitForFirebase();
    if (!fb) {
      console.warn('[ORT-AUTH-GATE] Firebase non disponible, affichage modale par défaut');
      showAuthRequiredModal();
      return;
    }

    // Attendre ORT_HEADER pour avoir showEmailModal
    await waitForHeader();

    // Attendre que Firebase ait restauré la session (premier appel de onAuthStateChanged)
    const user = await new Promise((resolve) => {
      const unsubscribe = fb.auth().onAuthStateChanged((u) => {
        unsubscribe(); // Se désabonner après le premier appel
        resolve(u);
      });
    });

    // Vérifier l'utilisateur
    if (user && (user.emailVerified || user.providerData?.some(p => p.providerId !== 'password'))) {
      // Utilisateur connecté et vérifié (ou via Google)
      console.log('[ORT-AUTH-GATE] ✅ Utilisateur authentifié:', user.email);
      // Ne rien faire, laisser la page se charger normalement
    } else if (user && !user.emailVerified) {
      // Connecté mais email non vérifié
      console.log('[ORT-AUTH-GATE] ⚠️ Email non vérifié:', user.email);
      showAuthRequiredModal();
    } else {
      // Non connecté
      console.log('[ORT-AUTH-GATE] ❌ Utilisateur non connecté');
      showAuthRequiredModal();
    }

    // Écouter les changements futurs (logout, etc.)
    fb.auth().onAuthStateChanged((u) => {
      if (u && (u.emailVerified || u.providerData?.some(p => p.providerId !== 'password'))) {
        closeAuthRequiredModal();
      } else if (!document.getElementById(MODAL_ID)) {
        // Si déconnecté et modale pas affichée, l'afficher
        showAuthRequiredModal();
      }
    });
  }

  // ============================================
  // INITIALISATION
  // ============================================

  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkAuth);
    } else {
      // Petit délai pour laisser Firebase et ORT_HEADER s'initialiser
      setTimeout(checkAuth, 100);
    }
  }

  init();

  // Exposer pour debug et usage externe
  window.ORT_AUTH_GATE = {
    showAuthRequiredModal,
    closeAuthRequiredModal,
    checkAuth
  };

  console.log('[ORT-AUTH-GATE] Module chargé');

})();
