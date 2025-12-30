/**
 * ORT-AUTH-MODAL.js
 * Modal d'authentification multilingue pour Vision Photo
 * Utilise Firebase Auth + ort-i18n-auth.js
 */

class OrtAuthModal {
  constructor() {
    this.mode = 'login'; // 'login' ou 'signup'
    this.lang = window.ORT_I18N_AUTH?.detectLang?.() || 'fr';
    this.i18n = window.ORT_I18N_AUTH?.get?.(this.lang) || {};
    this.firebase = null;
  }

  // ===== INIT =====
  async init(firebaseConfig) {
    // Attendre Firebase
    for (let i = 0; i < 20; i++) {
      if (window.firebase?.apps?.length) {
        this.firebase = window.firebase;
        break;
      }
      await new Promise(r => setTimeout(r, 100));
    }

    if (!this.firebase) {
      console.error('Firebase non initialisé après timeout');
      return false;
    }

    this.createHTML();
    this.attachEvents();
    return true;
  }

  // ===== CREATE HTML =====
  createHTML() {
    const html = `
      <div id="authModalOverlay" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:10000;padding:20px;">
        <div id="authModal" style="background:white;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,0.2);width:100%;max-width:400px;padding:32px;position:relative;">
          
          <!-- Close button -->
          <button id="authModalClose" style="position:absolute;top:12px;right:12px;background:none;border:none;font-size:24px;cursor:pointer;color:#999;">✕</button>
          
          <!-- Title -->
          <h2 id="authTitle" style="margin:0 0 24px;text-align:center;font-size:1.5rem;color:#333;"></h2>
          
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
            <button id="authModeToggle" style="background:none;border:none;color:#2196f3;cursor:pointer;font-weight:600;text-decoration:underline;margin-left:4px;"></button>
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

    formEl.addEventListener('submit', (e) => this.handleSubmit(e));
    closeBtn.addEventListener('click', () => this.close());
    toggleBtn.addEventListener('click', () => this.toggleMode());
    overlayEl.addEventListener('click', (e) => {
      if (e.target === overlayEl) this.close();
    });

    this.updateUI();
  }

  // ===== UPDATE UI =====
  updateUI() {
    const isSignup = this.mode === 'signup';
    const t = this.i18n;

    // Title
    document.getElementById('authTitle').textContent = isSignup ? t.signupTitle : t.loginTitle;

    // Labels
    document.getElementById('labelEmail').textContent = t.email;
    document.getElementById('labelPassword').textContent = t.password;
    document.getElementById('labelConfirmPassword').textContent = t.confirmPassword;

    // CGU
    const cguDiv = document.getElementById('cguDiv');
    cguDiv.style.display = isSignup ? 'block' : 'none';
    if (isSignup) {
      document.getElementById('cguText').innerHTML = `${t.acceptCgu} <a href="/cgu-${this.lang}.html" target="_blank" style="color:#2196f3;text-decoration:underline;">${t.cguLink}</a>`;
    }

    // Confirm password
    document.getElementById('confirmPasswordDiv').style.display = isSignup ? 'block' : 'none';

    // Submit button
    document.getElementById('authSubmit').textContent = isSignup ? t.create : t.validate;

    // Mode toggle
    document.getElementById('modeToggleText').textContent = isSignup ? t.alreadyHaveAccount : t.noAccountYet;
    document.getElementById('authModeToggle').textContent = isSignup ? t.login : t.createAccount;

    // Clear form
    document.getElementById('authForm').reset();
    document.getElementById('authError').style.display = 'none';
  }

  // ===== TOGGLE MODE =====
  toggleMode() {
    this.mode = this.mode === 'login' ? 'signup' : 'login';
    this.updateUI();
  }

  // ===== HANDLE SUBMIT =====
  async handleSubmit(e) {
    e.preventDefault();

    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    const confirmPassword = document.getElementById('authConfirmPassword').value;
    const cguAccepted = document.getElementById('authCgu').checked;

    const t = this.i18n;
    const errorDiv = document.getElementById('authError');

    // Validation
    if (!email || !password) {
      this.showError(t.errFillFields);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.showError(t.errInvalidEmail);
      return;
    }

    if (password.length < 6) {
      this.showError(t.errPasswordTooShort);
      return;
    }

    if (this.mode === 'signup') {
      if (password !== confirmPassword) {
        this.showError(t.errPasswordMismatch);
        return;
      }
      if (!cguAccepted) {
        this.showError(t.errAcceptCgu);
        return;
      }
    }

    // Auth
    try {
      const auth = this.firebase.auth();

      if (this.mode === 'signup') {
        await this.firebase.auth().createUserWithEmailAndPassword(email, password);
        await auth.currentUser.sendEmailVerification();
        this.showSuccess(t.msgVerificationSent.replace('{email}', email));
        setTimeout(() => this.close(), 2000);
      } else {
        await this.firebase.auth().signInWithEmailAndPassword(email, password);
        this.showSuccess(t.msgLoginSuccess);
        setTimeout(() => this.close(), 1000);
      }
    } catch (err) {
      this.showError(this.mapFirebaseError(err.code));
    }
  }

  // ===== MAP FIREBASE ERRORS =====
  mapFirebaseError(code) {
    const t = this.i18n;
    const map = {
      'auth/user-not-found': t.errUserNotFound,
      'auth/wrong-password': t.errWrongPassword,
      'auth/email-already-in-use': t.errEmailInUse,
      'auth/weak-password': t.errWeakPassword,
      'auth/too-many-requests': t.errTooManyRequests,
      'auth/network-request-failed': t.errNetworkError,
      'auth/popup-blocked': t.errPopupBlocked,
    };
    return map[code] || t.errGeneric;
  }

  // ===== SHOW ERROR =====
  showError(msg) {
    const errorDiv = document.getElementById('authError');
    errorDiv.textContent = msg;
    errorDiv.style.display = 'block';
    errorDiv.style.background = '#fee';
    errorDiv.style.color = '#c33';
  }

  // ===== SHOW SUCCESS =====
  showSuccess(msg) {
    const errorDiv = document.getElementById('authError');
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
