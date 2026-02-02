/**
 * ORT-AUTH-MODAL.js
 * Modal d'authentification multilingue pour OneRoadTrip
 * Utilise Firebase Auth + ort-i18n-auth.js
 */

class OrtAuthModal {
  constructor() {
    this.mode = 'login'; // 'login' ou 'signup'
    this.lang = this.getLang();
    this.firebase = null;
  }

  // Détecter la langue
  getLang() {
    if (window.ORT_AUTH_I18N?.getLang) {
      return window.ORT_AUTH_I18N.getLang();
    }
    const urlLang = new URLSearchParams(location.search).get('lang');
    const storedLang = localStorage.getItem('ort_lang');
    const browserLang = navigator.language?.slice(0, 2);
    return urlLang || storedLang || browserLang || 'fr';
  }

  // Obtenir traductions
  t(key) {
    if (window.ORT_AUTH_I18N?.t) {
      return window.ORT_AUTH_I18N.t(key);
    }
    // Fallback minimal en français
    const fallback = {
      loginTitle: 'Connexion',
      signupTitle: 'Créer un compte',
      email: 'E-mail',
      password: 'Mot de passe',
      confirmPassword: 'Confirmer le mot de passe',
      create: 'Créer mon compte',
      validate: 'Se connecter',
      errFillFields: 'Veuillez remplir tous les champs'
    };
    return fallback[key] || key;
  }

  // ===== INIT =====
  async init() {
    // Attendre Firebase
    for (let i = 0; i < 20; i++) {
      if (window.firebase?.apps?.length) {
        this.firebase = window.firebase;
        break;
      }
      await new Promise(r => setTimeout(r, 100));
    }

    if (!this.firebase) {
      console.error('[ORT-AUTH-MODAL] Firebase non initialisé après timeout');
      return false;
    }

    this.createHTML();
    this.attachEvents();
    console.log('[ORT-AUTH-MODAL] ✅ Initialisé');
    return true;
  }

  // ===== CREATE HTML =====
  createHTML() {
    const html = `
      <div id="authModalOverlay" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);display:none;align-items:center;justify-content:center;z-index:10000;padding:20px;">
        <div id="authModal" style="background:white;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,0.2);width:100%;max-width:400px;padding:32px;position:relative;">
          
          <!-- Close button -->
          <button id="authModalClose" style="position:absolute;top:12px;right:12px;background:none;border:none;font-size:24px;cursor:pointer;color:#999;line-height:1;">✕</button>
          
          <!-- Title -->
          <h2 id="authTitle" style="margin:0 0 24px;text-align:center;font-size:1.5rem;color:#333;font-weight:700;"></h2>
          
          <!-- Form -->
          <form id="authForm" style="display:flex;flex-direction:column;gap:16px;">
            
            <!-- Email -->
            <div>
              <label style="display:block;margin-bottom:6px;font-weight:500;color:#333;font-size:0.9rem;" id="labelEmail"></label>
              <input type="email" id="authEmail" placeholder="user@example.com" style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:6px;font-size:1rem;box-sizing:border-box;">
            </div>
            
            <!-- Password -->
            <div>
              <label style="display:block;margin-bottom:6px;font-weight:500;color:#333;font-size:0.9rem;" id="labelPassword"></label>
              <input type="password" id="authPassword" placeholder="••••••" style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:6px;font-size:1rem;box-sizing:border-box;">
            </div>
            
            <!-- Confirm Password (signup only) -->
            <div id="confirmPasswordDiv" style="display:none;">
              <label style="display:block;margin-bottom:6px;font-weight:500;color:#333;font-size:0.9rem;" id="labelConfirmPassword"></label>
              <input type="password" id="authConfirmPassword" placeholder="••••••" style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:6px;font-size:1rem;box-sizing:border-box;">
            </div>
            
            <!-- CGU (signup only) -->
            <div id="cguDiv" style="display:none;font-size:0.85rem;">
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer;color:#333;">
                <input type="checkbox" id="authCgu" style="width:18px;height:18px;cursor:pointer;">
                <span id="cguText"></span>
              </label>
            </div>
            
            <!-- Error message -->
            <div id="authError" style="display:none;background:#fee;color:#c33;padding:10px 12px;border-radius:6px;font-size:0.9rem;"></div>
            
            <!-- Submit button -->
            <button type="submit" id="authSubmit" style="background:#2196f3;color:white;padding:12px;border:none;border-radius:6px;font-weight:600;cursor:pointer;font-size:1rem;margin-top:8px;"></button>
          </form>
          
          <!-- Mode toggle -->
          <div style="text-align:center;margin-top:20px;font-size:0.9rem;color:#666;">
            <span id="modeToggleText"></span>
            <button id="authModeToggle" type="button" style="background:none;border:none;color:#2196f3;cursor:pointer;font-weight:600;text-decoration:underline;margin-left:4px;"></button>
          </div>
          
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
  }

  // ===== ATTACH EVENTS =====
  attachEvents() {
    const formEl = document.getElementById('authForm');
    const closeBtn = document.getElementById('authModalClose');
    const toggleBtn = document.getElementById('authModeToggle');
    const overlayEl = document.getElementById('authModalOverlay');

    if (formEl) formEl.addEventListener('submit', (e) => this.handleSubmit(e));
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());
    if (toggleBtn) toggleBtn.addEventListener('click', () => this.toggleMode());
    if (overlayEl) {
      overlayEl.addEventListener('click', (e) => {
        if (e.target === overlayEl) this.close();
      });
    }

    this.updateUI();
  }

  // ===== UPDATE UI =====
  updateUI() {
    const isSignup = this.mode === 'signup';

    // Title
    const authTitle = document.getElementById('authTitle');
    if (authTitle) authTitle.textContent = isSignup ? this.t('signupTitle') : this.t('loginTitle');

    // Labels
    const labelEmail = document.getElementById('labelEmail');
    const labelPassword = document.getElementById('labelPassword');
    const labelConfirmPassword = document.getElementById('labelConfirmPassword');
    
    if (labelEmail) labelEmail.textContent = this.t('email');
    if (labelPassword) labelPassword.textContent = this.t('password');
    if (labelConfirmPassword) labelConfirmPassword.textContent = this.t('confirmPassword');

    // CGU
    const cguDiv = document.getElementById('cguDiv');
    if (cguDiv) {
      cguDiv.style.display = isSignup ? 'block' : 'none';
      if (isSignup) {
        const cguText = document.getElementById('cguText');
        if (cguText) {
          cguText.innerHTML = `${this.t('acceptCgu')} <a href="/cgu-${this.lang}.html" target="_blank" style="color:#2196f3;text-decoration:underline;">${this.t('cguLink')}</a>`;
        }
      }
    }

    // Confirm password
    const confirmPasswordDiv = document.getElementById('confirmPasswordDiv');
    if (confirmPasswordDiv) confirmPasswordDiv.style.display = isSignup ? 'block' : 'none';

    // Submit button
    const authSubmit = document.getElementById('authSubmit');
    if (authSubmit) authSubmit.textContent = isSignup ? this.t('create') : this.t('validate');

    // Mode toggle
    const modeToggleText = document.getElementById('modeToggleText');
    const authModeToggle = document.getElementById('authModeToggle');
    
    if (modeToggleText) modeToggleText.textContent = isSignup ? this.t('alreadyHaveAccount') : this.t('noAccountYet');
    if (authModeToggle) authModeToggle.textContent = isSignup ? this.t('login') : this.t('createAccount');

    // Clear form
    const authForm = document.getElementById('authForm');
    if (authForm) authForm.reset();
    
    const authError = document.getElementById('authError');
    if (authError) authError.style.display = 'none';
  }

  // ===== TOGGLE MODE =====
  toggleMode() {
    this.mode = this.mode === 'login' ? 'signup' : 'login';
    this.updateUI();
  }

  // ===== HANDLE SUBMIT =====
  async handleSubmit(e) {
    e.preventDefault();

    const emailEl = document.getElementById('authEmail');
    const passwordEl = document.getElementById('authPassword');
    const confirmPasswordEl = document.getElementById('authConfirmPassword');
    const cguEl = document.getElementById('authCgu');

    if (!emailEl || !passwordEl) return;

    const email = emailEl.value.trim();
    const password = passwordEl.value;
    const confirmPassword = confirmPasswordEl ? confirmPasswordEl.value : '';
    const cguAccepted = cguEl ? cguEl.checked : false;

    // Validation
    if (!email || !password) {
      this.showError(this.t('errFillFields'));
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.showError(this.t('errInvalidEmail'));
      return;
    }

    if (password.length < 6) {
      this.showError(this.t('errPasswordTooShort'));
      return;
    }

    if (this.mode === 'signup') {
      if (password !== confirmPassword) {
        this.showError(this.t('errPasswordMismatch'));
        return;
      }
      if (!cguAccepted) {
        this.showError(this.t('errAcceptCgu'));
        return;
      }
    }

    // Auth
    try {
      const auth = this.firebase.auth();

      if (this.mode === 'signup') {
        await auth.createUserWithEmailAndPassword(email, password);
        await auth.currentUser.sendEmailVerification();
        this.showSuccess(this.t('msgVerificationSent').replace('{email}', email));
        setTimeout(() => this.close(), 2000);
      } else {
        await auth.signInWithEmailAndPassword(email, password);
        this.showSuccess(this.t('msgLoginSuccess'));
        setTimeout(() => this.close(), 1000);
      }
    } catch (err) {
      this.showError(this.mapFirebaseError(err.code));
    }
  }

  // ===== MAP FIREBASE ERRORS =====
  mapFirebaseError(code) {
    const map = {
      'auth/user-not-found': 'errUserNotFound',
      'auth/wrong-password': 'errWrongPassword',
      'auth/email-already-in-use': 'errEmailInUse',
      'auth/weak-password': 'errWeakPassword',
      'auth/too-many-requests': 'errTooManyRequests',
      'auth/network-request-failed': 'errNetworkError',
      'auth/popup-blocked': 'errPopupBlocked',
    };
    const key = map[code] || 'errGeneric';
    return this.t(key);
  }

  // ===== SHOW ERROR =====
  showError(msg) {
    const errorDiv = document.getElementById('authError');
    if (!errorDiv) return;
    
    errorDiv.textContent = msg;
    errorDiv.style.display = 'block';
    errorDiv.style.background = '#fee';
    errorDiv.style.color = '#c33';
  }

  // ===== SHOW SUCCESS =====
  showSuccess(msg) {
    const errorDiv = document.getElementById('authError');
    if (!errorDiv) return;
    
    errorDiv.textContent = msg;
    errorDiv.style.display = 'block';
    errorDiv.style.background = '#efe';
    errorDiv.style.color = '#3c3';
  }

  // ===== CLOSE =====
  close() {
    const overlay = document.getElementById('authModalOverlay');
    if (overlay) overlay.remove();
  }

  // ===== SHOW =====
  show() {
    const overlay = document.getElementById('authModalOverlay');
    if (overlay) overlay.style.display = 'flex';
  }
}

// Export
window.OrtAuthModal = OrtAuthModal;
console.log('[ORT-AUTH-MODAL] ✅ Classe chargée');
