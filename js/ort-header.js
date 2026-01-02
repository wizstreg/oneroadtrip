/**
 * ORT-HEADER.js
 * Gestion unifiée du header OneRoadTrip :
 * - Sélecteur de langue
 * - Authentification Firebase (Google + Email avec création de compte, reset mdp, CGU)
 * - Persistance de la session
 * 
 * Prérequis :
 * - ort-i18n-auth.js chargé AVANT ce script
 * - window.__FIREBASE_CONFIG__ défini (via ort-config.js)
 * 
 * HTML requis dans la page :
 * <select id="langSel" class="langpick"></select>
 * <div class="auth">
 *   <button id="openAuth" class="btn"></button>
 *   <div id="authPop" class="auth-pop">
 *     <button id="btnGoogle" class="btn"></button>
 *     <button id="btnEmail" class="btn"></button>
 *     <button id="btnLogout" class="btn out" style="display:none"></button>
 *   </div>
 * </div>
 */
(function(){
  'use strict';

  // ============================================
  // CONFIGURATION
  // ============================================
  const SUPPORTED_LANGS = ['fr', 'en', 'es', 'it', 'pt', 'ar'];
  const MODAL_ID = 'ortAuthModal';
  const MODAL_ZINDEX = 10000;

  // ============================================
  // UTILITAIRES
  // ============================================
  
  /** Charge un script externe */
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error('Failed to load: ' + src));
      document.head.appendChild(s);
    });
  }

  /** Initialise Firebase si pas déjà fait */
  async function ensureFirebase() {
    if (window.firebase?.apps?.length) return window.firebase;
    
    await loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
    await loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js');
    
    // Attendre que window.firebase soit disponible (max 2s)
    for (let i = 0; i < 20 && !window.firebase; i++) {
      await new Promise(r => setTimeout(r, 100));
    }
    
    if (!window.firebase) {
      console.error('[ORT-HEADER] Firebase non chargé après timeout');
      throw new Error('Firebase not loaded');
    }
    
    const cfg = window.__FIREBASE_CONFIG__;
    if (!cfg || !cfg.apiKey) {
      console.error('[ORT-HEADER] Configuration Firebase manquante (window.__FIREBASE_CONFIG__)');
      throw new Error('Missing Firebase config');
    }
    
    if (!window.firebase.apps?.length) {
      window.firebase.initializeApp(cfg);
    }
    await window.firebase.auth().setPersistence(window.firebase.auth.Auth.Persistence.LOCAL);
    return window.firebase;
  }

  /** Récupère la langue courante */
  function getLang() {
    return window.ORT_I18N_AUTH?.detectLang?.() || 'fr';
  }

  /** Récupère les traductions */
  function getT() {
    return window.ORT_I18N_AUTH?.get?.(getLang()) || window.ORT_I18N_AUTH?.fr || {};
  }

  // ============================================
  // GESTION DE LA LANGUE
  // ============================================
  function initLangSelector() {
    const sel = document.getElementById('langSel');
    if (!sel) return;

    const T = getT();
    const currentLang = getLang();

    // Remplir le select avec les langues
    sel.innerHTML = '';
    SUPPORTED_LANGS.forEach(code => {
      const opt = document.createElement('option');
      opt.value = code;
      opt.textContent = T.langNames?.[code] || code.toUpperCase();
      if (code === currentLang) opt.selected = true;
      sel.appendChild(opt);
    });

    // Appliquer RTL si arabe
    document.documentElement.lang = currentLang;
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';

    // Événement changement
    sel.addEventListener('change', function() {
      const newLang = this.value;
      localStorage.setItem('lang', newLang);
      
      // Recharger avec le nouveau paramètre lang
      const url = new URL(window.location.href);
      url.searchParams.set('lang', newLang);
      window.location.replace(url.toString());
    });
  }

  // ============================================
  // GESTION DE L'AUTHENTIFICATION
  // ============================================
  let currentUser = null;

  /** Met à jour le label du bouton auth */
  function updateAuthButton(user) {
    const btn = document.getElementById('openAuth');
    const btnLogout = document.getElementById('btnLogout');
    const T = getT();

    if (user && user.emailVerified) {
      const name = user.displayName || (user.email || '').split('@')[0];
      btn.innerHTML = '<span>👤 ' + name.slice(0, 12) + '</span>';
      if (btnLogout) btnLogout.style.display = '';
    } else if (user && !user.emailVerified && user.providerData?.some(p => p.providerId !== 'password')) {
      // Connecté via Google (pas besoin de vérification email)
      const name = user.displayName || (user.email || '').split('@')[0];
      btn.innerHTML = '<span>👤 ' + name.slice(0, 12) + '</span>';
      if (btnLogout) btnLogout.style.display = '';
    } else {
      btn.innerHTML = '<span>' + (T.login || 'Se connecter') + '</span>';
      if (btnLogout) btnLogout.style.display = 'none';
    }
  }

  /** Initialise les handlers d'authentification */
  async function initAuthHandlers() {
    const btnOpen = document.getElementById('openAuth');
    const pop = document.getElementById('authPop');
    const btnGoogle = document.getElementById('btnGoogle');
    const btnEmail = document.getElementById('btnEmail');
    const btnLogout = document.getElementById('btnLogout');

    if (!btnOpen || !pop) return;

    const T = getT();

    // Labels des boutons
    if (btnGoogle) btnGoogle.textContent = 'Google';
    if (btnEmail) btnEmail.textContent = T.email || 'E-mail';
    if (btnLogout) btnLogout.textContent = T.logout || 'Déconnexion';

    // Toggle popup
    btnOpen.addEventListener('click', (e) => {
      e.stopPropagation();
      pop.style.display = pop.style.display === 'block' ? 'none' : 'block';
    });

    // Fermer popup si clic ailleurs
    document.addEventListener('click', (e) => {
      if (!btnOpen.contains(e.target) && !pop.contains(e.target)) {
        pop.style.display = 'none';
      }
    });

    // Connexion Google
    if (btnGoogle) {
      btnGoogle.addEventListener('click', async () => {
        try {
          const fb = await ensureFirebase();
          const provider = new firebase.auth.GoogleAuthProvider();
          provider.setCustomParameters({ prompt: 'select_account' });
          await fb.auth().signInWithPopup(provider);
          pop.style.display = 'none';
        } catch (e) {
          alert(T.errPopupBlocked + '\n' + (e.message || e.code));
        }
      });
    }

    // Connexion Email → ouvre la modale
    if (btnEmail) {
      btnEmail.addEventListener('click', () => {
        pop.style.display = 'none';
        showEmailModal('login');
      });
    }

    // Déconnexion
    if (btnLogout) {
      btnLogout.addEventListener('click', async () => {
        try {
          const fb = await ensureFirebase();
          await fb.auth().signOut();
          pop.style.display = 'none';
        } catch (e) {
          console.warn('[ORT-HEADER] Logout error:', e);
        }
      });
    }

    // Observer les changements d'état auth - ATTENDRE Firebase d'abord
    try {
      const fb = await ensureFirebase();
      
      // Vérifier immédiatement l'utilisateur actuel
      const currentUserNow = fb.auth().currentUser;
      if (currentUserNow) {
        console.log('[ORT-HEADER] Utilisateur déjà connecté:', currentUserNow.email);
        updateAuthButton(currentUserNow);
      }
      
      // Puis écouter les changements
      fb.auth().onAuthStateChanged((user) => {
        currentUser = user;
        console.log('[ORT-HEADER] Auth state changed:', user ? user.email : 'non connecté');
        updateAuthButton(user);
      });
    } catch (e) {
      console.warn('[ORT-HEADER] Firebase init error:', e);
    }
  }

  // ============================================
  // MODALE EMAIL (Login / Signup / Reset)
  // ============================================
  
  /** Crée ou récupère la modale */
  function getOrCreateModal() {
    let modal = document.getElementById(MODAL_ID);
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = MODAL_ID;
    modal.style.cssText = `
      display:none;position:fixed;inset:0;
      background:rgba(0,0,0,.5);
      align-items:center;justify-content:center;
      z-index:${MODAL_ZINDEX};
    `;
    modal.innerHTML = `
      <div class="ort-modal-card" style="
        width:min(440px,92vw);
        background:#fff;
        border-radius:14px;
        border:1px solid #c3d6b6;
        padding:18px;
        box-shadow:0 10px 30px rgba(0,0,0,.16);
        color:#113f7a;
      ">
        <h3 id="ortAuthTitle" style="margin:0 0 6px;font-size:1.2rem"></h3>
        <div id="ortAuthMsg" style="display:none;padding:12px;border-radius:8px;margin:8px 0;border:1px solid"></div>
        
        <input id="ortAuthEmail" type="email" placeholder="" style="
          width:100%;padding:10px 12px;border:1px solid #113f7a;border-radius:10px;margin:8px 0;
          font-size:1rem;
        ">
        
        <div id="ortAuthPwdWrap" style="position:relative">
          <input id="ortAuthPwd" type="password" placeholder="" style="
            width:100%;padding:10px 12px;border:1px solid #113f7a;border-radius:10px;margin:8px 0;
            font-size:1rem;
          ">
          <button id="ortAuthEye" type="button" style="
            position:absolute;right:8px;top:50%;transform:translateY(-50%);
            border:0;background:transparent;cursor:pointer;padding:6px;
          ">👁</button>
        </div>
        
        <div id="ortAuthPwd2Wrap" style="display:none">
          <input id="ortAuthPwd2" type="password" placeholder="" style="
            width:100%;padding:10px 12px;border:1px solid #113f7a;border-radius:10px;margin:8px 0;
            font-size:1rem;
          ">
        </div>
        
        <div id="ortAuthCguWrap" style="display:none;margin:12px 0">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:0.9rem">
            <input type="checkbox" id="ortAuthCgu" style="width:18px;height:18px">
            <span id="ortAuthCguLabel"></span>
          </label>
        </div>
        
        <p id="ortAuthNote" style="font-size:13px;color:#475569;margin:8px 0"></p>
        
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <button id="ortAuthToggle" type="button" style="
            background:none;border:0;color:#113f7a;cursor:pointer;
            text-decoration:underline;padding:0;font-size:0.9rem;
          "></button>
          <button id="ortAuthForgot" type="button" style="
            background:none;border:0;color:#113f7a;cursor:pointer;
            text-decoration:underline;padding:0;margin-left:auto;font-size:0.9rem;
          "></button>
        </div>
        
        <button id="ortAuthResend" type="button" style="
          display:none;background:none;border:0;color:#113f7a;cursor:pointer;
          text-decoration:underline;padding:0;margin-top:8px;font-size:0.9rem;
        "></button>
        
        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:12px">
          <button id="ortAuthCancel" type="button" style="
            background:#fff;color:#113f7a;border:1px solid #113f7a;
            border-radius:10px;padding:8px 16px;cursor:pointer;font-weight:600;
          "></button>
          <button id="ortAuthSubmit" type="button" style="
            background:#113f7a;color:#fff;border:1px solid #113f7a;
            border-radius:10px;padding:8px 16px;cursor:pointer;font-weight:600;
          "></button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Fermer si clic sur overlay
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });

    // Toggle password visibility
    document.getElementById('ortAuthEye').addEventListener('click', () => {
      const pwd = document.getElementById('ortAuthPwd');
      const pwd2 = document.getElementById('ortAuthPwd2');
      const newType = pwd.type === 'password' ? 'text' : 'password';
      pwd.type = newType;
      if (pwd2) pwd2.type = newType;
    });

    return modal;
  }

  /** Affiche la modale email */
  function showEmailModal(mode) {
    // mode: 'login' | 'signup' | 'reset'
    const modal = getOrCreateModal();
    const T = getT();
    const lang = getLang();

    const title = document.getElementById('ortAuthTitle');
    const msgDiv = document.getElementById('ortAuthMsg');
    const emailInput = document.getElementById('ortAuthEmail');
    const pwdWrap = document.getElementById('ortAuthPwdWrap');
    const pwdInput = document.getElementById('ortAuthPwd');
    const pwd2Wrap = document.getElementById('ortAuthPwd2Wrap');
    const pwd2Input = document.getElementById('ortAuthPwd2');
    const cguWrap = document.getElementById('ortAuthCguWrap');
    const cguCheckbox = document.getElementById('ortAuthCgu');
    const cguLabel = document.getElementById('ortAuthCguLabel');
    const note = document.getElementById('ortAuthNote');
    const toggleBtn = document.getElementById('ortAuthToggle');
    const forgotBtn = document.getElementById('ortAuthForgot');
    const resendBtn = document.getElementById('ortAuthResend');
    const cancelBtn = document.getElementById('ortAuthCancel');
    const submitBtn = document.getElementById('ortAuthSubmit');

    // Reset
    msgDiv.style.display = 'none';
    resendBtn.style.display = 'none';
    emailInput.value = '';
    pwdInput.value = '';
    pwd2Input.value = '';
    cguCheckbox.checked = false;

    // Placeholders
    emailInput.placeholder = T.email || 'E-mail';
    pwdInput.placeholder = T.password || 'Mot de passe';
    pwd2Input.placeholder = T.confirmPassword || 'Confirmer le mot de passe';
    cancelBtn.textContent = T.cancel || 'Annuler';

    // CGU label avec lien
    cguLabel.innerHTML = `${T.acceptCgu || "J'accepte les"} <a href="cgu-${lang}.html" target="_blank" style="color:#113f7a">${T.cguLink || 'CGU'}</a>`;

    // Configuration selon le mode
    if (mode === 'login') {
      title.textContent = T.loginTitle || 'Se connecter par e-mail';
      pwdWrap.style.display = '';
      pwd2Wrap.style.display = 'none';
      cguWrap.style.display = 'none';
      forgotBtn.style.display = '';
      forgotBtn.textContent = T.forgotPassword || 'Mot de passe oublié ?';
      toggleBtn.textContent = T.noAccountYet || 'Créer un compte';
      submitBtn.textContent = T.validate || 'Valider';
      note.textContent = '';
    } else if (mode === 'signup') {
      title.textContent = T.signupTitle || 'Créer un compte';
      pwdWrap.style.display = '';
      pwd2Wrap.style.display = '';
      cguWrap.style.display = '';
      forgotBtn.style.display = 'none';
      toggleBtn.textContent = T.alreadyHaveAccount || "J'ai déjà un compte";
      submitBtn.textContent = T.create || 'Créer';
      note.textContent = '';
    } else if (mode === 'reset') {
      title.textContent = T.resetTitle || 'Réinitialiser le mot de passe';
      pwdWrap.style.display = 'none';
      pwd2Wrap.style.display = 'none';
      cguWrap.style.display = 'none';
      forgotBtn.style.display = 'none';
      toggleBtn.textContent = T.alreadyHaveAccount || "J'ai déjà un compte";
      submitBtn.textContent = T.sendResetLink || 'Envoyer le lien';
      note.textContent = '';
    }

    // Handlers
    const cleanup = () => {
      toggleBtn.onclick = null;
      forgotBtn.onclick = null;
      cancelBtn.onclick = null;
      submitBtn.onclick = null;
      resendBtn.onclick = null;
    };

    toggleBtn.onclick = () => {
      cleanup();
      if (mode === 'login') showEmailModal('signup');
      else showEmailModal('login');
    };

    forgotBtn.onclick = () => {
      cleanup();
      showEmailModal('reset');
    };

    cancelBtn.onclick = () => {
      cleanup();
      modal.style.display = 'none';
    };

    submitBtn.onclick = () => handleSubmit(mode);

    // Enter key
    const handleEnter = (e) => {
      if (e.key === 'Enter') handleSubmit(mode);
    };
    emailInput.onkeydown = handleEnter;
    pwdInput.onkeydown = handleEnter;
    pwd2Input.onkeydown = handleEnter;

    // Afficher
    modal.style.display = 'flex';
    emailInput.focus();
  }

  /** Affiche un message dans la modale */
  function showModalMsg(text, type) {
    const msgDiv = document.getElementById('ortAuthMsg');
    msgDiv.textContent = text;
    msgDiv.style.display = '';
    if (type === 'success') {
      msgDiv.style.background = '#f0fdf4';
      msgDiv.style.borderColor = '#bbf7d0';
      msgDiv.style.color = '#166534';
    } else {
      msgDiv.style.background = '#fef2f2';
      msgDiv.style.borderColor = '#fecaca';
      msgDiv.style.color = '#dc2626';
    }
  }

  /** Gère la soumission du formulaire */
  async function handleSubmit(mode) {
    const T = getT();
    const modal = document.getElementById(MODAL_ID);
    const emailInput = document.getElementById('ortAuthEmail');
    const pwdInput = document.getElementById('ortAuthPwd');
    const pwd2Input = document.getElementById('ortAuthPwd2');
    const cguCheckbox = document.getElementById('ortAuthCgu');
    const submitBtn = document.getElementById('ortAuthSubmit');
    const resendBtn = document.getElementById('ortAuthResend');
    const msgDiv = document.getElementById('ortAuthMsg');

    const email = (emailInput.value || '').trim().toLowerCase();
    const password = (pwdInput.value || '').trim();
    const password2 = (pwd2Input.value || '').trim();

    msgDiv.style.display = 'none';
    resendBtn.style.display = 'none';

    // Validations
    if (!email) {
      showModalMsg(T.errFillFields, 'error');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      showModalMsg(T.errInvalidEmail, 'error');
      return;
    }

    if (mode === 'login' || mode === 'signup') {
      if (!password) {
        showModalMsg(T.errFillFields, 'error');
        return;
      }
      if (password.length < 6) {
        showModalMsg(T.errPasswordTooShort, 'error');
        return;
      }
    }

    if (mode === 'signup') {
      if (password !== password2) {
        showModalMsg(T.errPasswordMismatch, 'error');
        return;
      }
      if (!cguCheckbox.checked) {
        showModalMsg(T.errAcceptCgu, 'error');
        return;
      }
    }

    // Désactiver le bouton
    const oldText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = '...';

    try {
      const fb = await ensureFirebase();
      const auth = fb.auth();
      const actionUrl = window.location.origin + '/auth-handler.html';

      if (mode === 'signup') {
        // Création de compte
        const result = await auth.createUserWithEmailAndPassword(email, password);
        await result.user.sendEmailVerification({ url: actionUrl });
        showModalMsg((T.msgVerificationSent || '').replace('{email}', email), 'success');
        
        // Bouton renvoyer
        resendBtn.style.display = '';
        resendBtn.textContent = T.msgResendVerification;
        resendBtn.onclick = async () => {
          try {
            const u = auth.currentUser;
            if (u) {
              await u.sendEmailVerification({ url: actionUrl });
              showModalMsg((T.msgVerificationResent || '').replace('{email}', u.email), 'success');
            }
          } catch (e) {
            showModalMsg(T.errGeneric, 'error');
          }
        };

      } else if (mode === 'login') {
        // Connexion
        try { await auth.signOut(); } catch (_) {}
        const result = await auth.signInWithEmailAndPassword(email, password);
        await result.user.reload();
        
        const user = result.user;
        // Vérifier si connecté via provider externe ou email vérifié
        const hasExternalProvider = user.providerData?.some(p => p.providerId !== 'password');
        
        if (hasExternalProvider || user.emailVerified) {
          showModalMsg(T.msgLoginSuccess, 'success');
          setTimeout(() => { modal.style.display = 'none'; }, 1000);
        } else {
          showModalMsg(T.msgEmailNotVerified, 'error');
          resendBtn.style.display = '';
          resendBtn.textContent = T.msgResendVerification;
          resendBtn.onclick = async () => {
            try {
              await user.sendEmailVerification({ url: actionUrl });
              showModalMsg((T.msgVerificationResent || '').replace('{email}', user.email), 'success');
            } catch (e) {
              showModalMsg(T.errGeneric, 'error');
            }
          };
        }

      } else if (mode === 'reset') {
        // Reset mot de passe
        await auth.sendPasswordResetEmail(email, { url: actionUrl });
        showModalMsg(T.msgResetSent, 'success');
      }

    } catch (e) {
      let msg = T.errGeneric;
      switch (e.code) {
        case 'auth/user-not-found':
          // Auto-switch vers signup si user non trouvé en login
          if (mode === 'login') {
            showEmailModal('signup');
            emailInput.value = email;
            pwdInput.value = password;
            showModalMsg(T.errUserNotFound + ' ' + (T.noAccountYet || ''), 'error');
            return;
          }
          msg = T.errUserNotFound;
          break;
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          msg = T.errWrongPassword;
          break;
        case 'auth/email-already-in-use':
          msg = T.errEmailInUse;
          break;
        case 'auth/weak-password':
          msg = T.errWeakPassword;
          break;
        case 'auth/too-many-requests':
          msg = T.errTooManyRequests;
          break;
        case 'auth/network-request-failed':
          msg = T.errNetworkError;
          break;
        case 'auth/invalid-email':
          msg = T.errInvalidEmail;
          break;
      }
      showModalMsg(msg, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = oldText;
    }
  }

  // ============================================
  // INITIALISATION
  // ============================================
  async function init() {
    // Attendre que le DOM soit prêt
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    // Sauvegarder la langue détectée
    const lang = getLang();
    localStorage.setItem('lang', lang);

    // Générer le HTML du header si vide
    generateHeaderHTML();

    // Initialiser le sélecteur de langue
    initLangSelector();
    
    // Initialiser Firebase ET les handlers auth
    await initAuthHandlers();

    console.log('[ORT-HEADER] Initialisé - Langue:', lang);
  }

  /** Génère le HTML du header si l'élément est vide */
  function generateHeaderHTML() {
    const header = document.getElementById('site-header');
    if (!header || header.children.length > 0) return; // Déjà du contenu

    const T = getT();
    const lang = getLang();

    header.innerHTML = `
      <div class="header-row-1">
        <a class="brandlink" id="homeLink" href="index.html">
          <img src="/assets/symbol.webp" alt="Logo">
          <div class="brand">OneRoadTrip</div>
        </a>
      </div>
      <div class="header-row-2">
        <select id="langSel" class="langpick" aria-label="Langue">
          <option value="fr">Français</option>
          <option value="en">English</option>
          <option value="it">Italiano</option>
          <option value="es">Español</option>
          <option value="pt">Português</option>
          <option value="ar">العربية</option>
        </select>
        <div class="auth">
          <button id="openAuth" class="btn" type="button">
            <span>${T.login || 'Se connecter'}</span>
          </button>
          <div id="authPop" class="auth-pop" role="dialog" aria-label="Connexion">
            <button id="btnGoogle" class="btn" type="button">Google</button>
            <button id="btnEmail" class="btn" type="button">E-mail</button>
            <button id="btnLogout" class="btn out" type="button" style="display:none">${T.logout || 'Déconnexion'}</button>
          </div>
        </div>
      </div>
    `;

    // Sélectionner la langue actuelle
    const sel = header.querySelector('#langSel');
    if (sel) sel.value = lang;
  }

  // Lancer l'initialisation
  init();

  // Exposer pour debug
  window.ORT_HEADER = {
    ensureFirebase,
    getLang,
    getT,
    showEmailModal,
    updateAuthButton
  };

})();
