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
    // Attendre ORT_I18N_AUTH - 10 secondes max
    for (let i = 0; i < 100; i++) {
      if (window.ORT_I18N_AUTH?.get) {
        this.lang = window.ORT_I18N_AUTH.detectLang();
        this.i18n = window.ORT_I18N_AUTH.get(this.lang);
        console.log('[AUTH-MODAL] ✅ i18n chargé:', this.lang);
        break;
      }
      await new Promise(r => setTimeout(r, 100));
    }
    
    if (!this.i18n || Object.keys(this.i18n).length === 0) {
      console.warn('[AUTH-MODAL] ⚠️ i18n non chargé, utilisation du fallback français');
      // Fallback français COMPLET
      this.i18n = {
        loginTitle: 'Connexion',
        signupTitle: 'Créer un compte',
        email: 'Email',
        password: 'Mot de passe',
        confirmPassword: 'Confirmer le mot de passe',
        validate: 'Valider',
        create: 'Créer mon compte',
        login: 'Se connecter',
        createAccount: 'Créer un compte',
        alreadyHaveAccount: 'Déjà un compte ?',
        noAccountYet: 'Pas encore de compte ?',
        acceptCgu: "J'accepte les",
        cguLink: 'CGU',
        errGeneric: 'Erreur lors de la connexion',
        errInvalidEmail: 'Email invalide',
        errWrongPassword: 'Mot de passe incorrect',
        errUserNotFound: 'Utilisateur introuvable',
        errEmailInUse: 'Cet email est déjà utilisé',
        errWeakPassword: 'Mot de passe trop faible (minimum 6 caractères)',
        errPasswordMismatch: 'Les mots de passe ne correspondent pas',
        errCguNotAccepted: 'Vous devez accepter les CGU',
        errFillFields: 'Veuillez remplir tous les champs',
        errPasswordTooShort: 'Le mot de passe doit contenir au moins 6 caractères',
        errAcceptCgu: 'Vous devez accepter les CGU',
        errTooManyRequests: 'Trop de tentatives. Réessayez plus tard.',
        errNetworkError: 'Erreur réseau. Vérifiez votre connexion.',
        errPopupBlocked: 'Pop-up bloquée par le navigateur',
        msgVerificationSent: 'Email de vérification envoyé à {email}',
        msgLoginSuccess: 'Connexion réussie !',
        showPassword: 'Afficher',
        hidePassword: 'Masquer'
      };
    }
    
    // Attendre Firebase
    for (let i = 0; i < 20; i++) {
      if (window.firebase?.apps?.length) {
        this.firebase = window.firebase;
        break;
      }
      await new Promise(r => setTimeout(r, 100));
    }

    if (!this.firebase) {
      console.error('[AUTH-MODAL] Firebase non initialisé après timeout');
      return false;
    }

    this.createHTML();
    this.attachEvents();
    return true;
  }

  // ===== CREATE HTML =====
  createHTML() {
    // Vérifier si la modale existe déjà
    const existing = document.getElementById('authModalOverlay');
    if (existing) {
      console.log('[AUTH-MODAL] Modale déjà présente, réutilisation');
      return;
    }
    
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
              <input type="email" id="authEmail" placeholder="user@example.com" autocomplete="email" style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:6px;font-size:1rem;box-sizing:border-box;">
            </div>
            
            <!-- Password -->
            <div>
              <label style="display:block;margin-bottom:6px;font-weight:500;color:#333;font-size:0.9rem;" id="labelPassword"></label>
              <div style="position:relative;">
                <input type="password" id="authPassword" placeholder="••••••" autocomplete="current-password" style="width:100%;padding:10px 40px 10px 12px;border:1px solid #ddd;border-radius:6px;font-size:1rem;box-sizing:border-box;">
                <button type="button" id="togglePassword" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;color:#666;cursor:pointer;font-size:0.85rem;padding:4px 8px;">👁️</button>
              </div>
            </div>
            
            <!-- Confirm Password (signup only) -->
            <div id="confirmPasswordDiv" style="display:none;">
              <label style="display:block;margin-bottom:6px;font-weight:500;color:#333;font-size:0.9rem;" id="labelConfirmPassword"></label>
              <div style="position:relative;">
                <input type="password" id="authConfirmPassword" placeholder="••••••" autocomplete="new-password" style="width:100%;padding:10px 40px 10px 12px;border:1px solid #ddd;border-radius:6px;font-size:1rem;box-sizing:border-box;">
                <button type="button" id="toggleConfirmPassword" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;color:#666;cursor:pointer;font-size:0.85rem;padding:4px 8px;">👁️</button>
              </div>
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
    const togglePasswordBtn = document.getElementById('togglePassword');
    const toggleConfirmPasswordBtn = document.getElementById('toggleConfirmPassword');

    if (!formEl || !closeBtn || !toggleBtn || !overlayEl) {
      console.error('[AUTH-MODAL] Éléments manquants:', { formEl: !!formEl, closeBtn: !!closeBtn, toggleBtn: !!toggleBtn, overlayEl: !!overlayEl });
      return;
    }

    formEl.addEventListener('submit', (e) => this.handleSubmit(e));
    closeBtn.addEventListener('click', () => this.close());
    toggleBtn.addEventListener('click', () => this.toggleMode());
    overlayEl.addEventListener('click', (e) => {
      if (e.target === overlayEl) this.close();
    });

    // Toggle password visibility
    if (togglePasswordBtn) {
      togglePasswordBtn.addEventListener('click', () => {
        const pwdInput = document.getElementById('authPassword');
        const isPassword = pwdInput.type === 'password';
        pwdInput.type = isPassword ? 'text' : 'password';
        togglePasswordBtn.textContent = isPassword ? '🙈' : '👁️';
      });
    }

    // Toggle confirm password visibility
    if (toggleConfirmPasswordBtn) {
      toggleConfirmPasswordBtn.addEventListener('click', () => {
        const pwdInput = document.getElementById('authConfirmPassword');
        const isPassword = pwdInput.type === 'password';
        pwdInput.type = isPassword ? 'text' : 'password';
        toggleConfirmPasswordBtn.textContent = isPassword ? '🙈' : '👁️';
      });
    }

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
    
    // Reset password visibility toggles
    const pwdInput = document.getElementById('authPassword');
    const confirmPwdInput = document.getElementById('authConfirmPassword');
    const togglePwdBtn = document.getElementById('togglePassword');
    const toggleConfirmPwdBtn = document.getElementById('toggleConfirmPassword');
    
    if (pwdInput) pwdInput.type = 'password';
    if (confirmPwdInput) confirmPwdInput.type = 'password';
    if (togglePwdBtn) togglePwdBtn.textContent = '👁️';
    if (toggleConfirmPwdBtn) toggleConfirmPwdBtn.textContent = '👁️';
  }

  // ===== TOGGLE MODE =====
  toggleMode() {
    this.mode = this.mode === 'login' ? 'signup' : 'login';
    this.updateUI();
  }

  // ===== HANDLE SUBMIT =====
  async handleSubmit(e) {
    e.preventDefault();

    const email = document.getElementById('authEmail').value.trim().toLowerCase();
    const password = document.getElementById('authPassword').value;
    const confirmPassword = document.getElementById('authConfirmPassword').value;
    const cguAccepted = document.getElementById('authCgu').checked;
    const t = this.i18n;

    // Validation
    if (!email || !password) {
      this.showError('Veuillez remplir tous les champs');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.showError('Email invalide');
      return;
    }

    if (password.length < 6) {
      this.showError('Mot de passe trop court (minimum 6 caractères)');
      return;
    }

    if (this.mode === 'signup') {
      if (password !== confirmPassword) {
        this.showError('Les mots de passe ne correspondent pas');
        return;
      }
      if (!cguAccepted) {
        this.showError('Vous devez accepter les CGU');
        return;
      }
    }

    // Firebase auth
    try {
      if (this.mode === 'signup') {
        await this.firebase.auth().createUserWithEmailAndPassword(email, password);
        await this.firebase.auth().currentUser.sendEmailVerification();
        this.showSuccess('Compte créé ! Email de vérification envoyé.');
        setTimeout(() => this.close(), 1500);
      } else {
        await this.firebase.auth().signInWithEmailAndPassword(email, password);
        this.showSuccess('Connexion réussie !');
        setTimeout(() => this.close(), 800);
      }
    } catch (err) {
      let msg = 'Erreur : ' + err.message;
      if (err.code === 'auth/email-already-in-use') msg = 'Cet email est déjà utilisé';
      if (err.code === 'auth/user-not-found') msg = 'Utilisateur introuvable';
      if (err.code === 'auth/wrong-password') msg = 'Mot de passe incorrect';
      if (err.code === 'auth/invalid-credential') msg = 'Email ou mot de passe incorrect';
      this.showError(msg);
    }
  }

  // ===== MAP FIREBASE ERRORS =====
  mapFirebaseError(code) {
    const t = this.i18n;
    const map = {
      'auth/user-not-found': t.errUserNotFound || 'Utilisateur introuvable',
      'auth/wrong-password': t.errWrongPassword || 'Mot de passe incorrect',
      'auth/email-already-in-use': t.errEmailInUse || 'Cet email est déjà utilisé',
      'auth/weak-password': t.errWeakPassword || 'Mot de passe trop faible (minimum 6 caractères)',
      'auth/invalid-email': t.errInvalidEmail || 'Email invalide',
      'auth/too-many-requests': t.errTooManyRequests || 'Trop de tentatives. Réessayez plus tard.',
      'auth/network-request-failed': t.errNetworkError || 'Erreur réseau. Vérifiez votre connexion.',
      'auth/popup-blocked': t.errPopupBlocked || 'Pop-up bloquée par le navigateur',
      'auth/missing-password': 'Le mot de passe est requis',
      'auth/invalid-credential': t.errWrongPassword || 'Email ou mot de passe incorrect'
    };
    return map[code] || `${t.errGeneric || 'Erreur'} (${code})`;
  }

  // ===== SHOW ERROR =====
  showError(msg) {
    const errorDiv = document.getElementById('authError');
    if (!errorDiv) {
      console.error('[AUTH-MODAL] Element #authError introuvable');
      return;
    }
    errorDiv.textContent = msg;
    errorDiv.style.display = 'block';
    errorDiv.style.background = '#fee';
    errorDiv.style.color = '#c33';
  }

  // ===== SHOW SUCCESS =====
  showSuccess(msg) {
    const errorDiv = document.getElementById('authError');
    if (!errorDiv) {
      console.error('[AUTH-MODAL] Element #authError introuvable');
      return;
    }
    errorDiv.textContent = msg;
    errorDiv.style.display = 'block';
    errorDiv.style.background = '#efe';
    errorDiv.style.color = '#3c3';
  }

  // ===== CLOSE =====
  close() {
    const overlay = document.getElementById('authModalOverlay');
    if (overlay) {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 300);
    }
  }

  // ===== SHOW =====
  show() {
    const overlay = document.getElementById('authModalOverlay');
    if (overlay) {
      overlay.style.display = 'flex';
      overlay.style.opacity = '1';
    }
  }
}

// Export
window.OrtAuthModal = OrtAuthModal;
