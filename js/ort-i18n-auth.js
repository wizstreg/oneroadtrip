// ort-i18n-auth.js - Traductions pour la modale d'authentification obligatoire
(function() {
  'use strict';

  window.ORT_AUTH_I18N = {
    fr: {
      title: "Inscription requise",
      message: "Pour voir la suite de cet itinéraire, l'imprimer, le personnaliser et enregistrer vos futures réservations, vous devez être inscrit.",
      freeNote: "✓ Toutes ces fonctionnalités sont entièrement gratuites.",
      btnSignup: "Créer mon compte gratuit",
      btnLogin: "J'ai déjà un compte",
      
      // Pour la modale email
      loginTitle: 'Connexion',
      signupTitle: 'Créer un compte',
      email: 'E-mail',
      password: 'Mot de passe',
      confirmPassword: 'Confirmer le mot de passe',
      acceptCgu: 'J\'accepte les',
      cguLink: 'conditions d\'utilisation',
      create: 'Créer mon compte',
      validate: 'Se connecter',
      alreadyHaveAccount: 'Déjà un compte ?',
      noAccountYet: 'Pas encore de compte ?',
      login: 'Se connecter',
      createAccount: 'Créer un compte',
      errFillFields: 'Veuillez remplir tous les champs',
      errInvalidEmail: 'E-mail invalide',
      errPasswordTooShort: 'Mot de passe trop court (min. 6 caractères)',
      errPasswordMismatch: 'Les mots de passe ne correspondent pas',
      errAcceptCgu: 'Veuillez accepter les conditions d\'utilisation',
      errUserNotFound: 'Utilisateur non trouvé',
      errWrongPassword: 'Mot de passe incorrect',
      errEmailInUse: 'Cet e-mail est déjà utilisé',
      errWeakPassword: 'Mot de passe trop faible',
      errTooManyRequests: 'Trop de tentatives, réessayez plus tard',
      errNetworkError: 'Erreur de connexion réseau',
      errPopupBlocked: 'Popup bloquée par le navigateur',
      errGeneric: 'Erreur d\'authentification',
      msgVerificationSent: 'E-mail de vérification envoyé à {email}',
      msgLoginSuccess: 'Connexion réussie !'
    },
    en: {
      title: "Registration required",
      message: "To view the rest of this itinerary, print it, customize it and save your future bookings, you must be registered.",
      freeNote: "✓ All these features are completely free.",
      btnSignup: "Create my free account",
      btnLogin: "I already have an account",
      
      loginTitle: 'Login',
      signupTitle: 'Create account',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm password',
      acceptCgu: 'I accept the',
      cguLink: 'terms of service',
      create: 'Create my account',
      validate: 'Login',
      alreadyHaveAccount: 'Already have an account?',
      noAccountYet: 'No account yet?',
      login: 'Login',
      createAccount: 'Create account',
      errFillFields: 'Please fill all fields',
      errInvalidEmail: 'Invalid email',
      errPasswordTooShort: 'Password too short (min. 6 characters)',
      errPasswordMismatch: 'Passwords do not match',
      errAcceptCgu: 'Please accept terms of service',
      errUserNotFound: 'User not found',
      errWrongPassword: 'Wrong password',
      errEmailInUse: 'Email already in use',
      errWeakPassword: 'Password too weak',
      errTooManyRequests: 'Too many attempts, try again later',
      errNetworkError: 'Network error',
      errPopupBlocked: 'Popup blocked by browser',
      errGeneric: 'Authentication error',
      msgVerificationSent: 'Verification email sent to {email}',
      msgLoginSuccess: 'Login successful!'
    },
    es: {
      title: "Registro requerido",
      message: "Para ver el resto de este itinerario, imprimirlo, personalizarlo y guardar sus futuras reservas, debe estar registrado.",
      freeNote: "✓ Todas estas funciones son completamente gratuitas.",
      btnSignup: "Crear mi cuenta gratuita",
      btnLogin: "Ya tengo una cuenta"
    },
    it: {
      title: "Registrazione richiesta",
      message: "Per vedere il resto di questo itinerario, stamparlo, personalizzarlo e salvare le tue future prenotazioni, devi essere registrato.",
      freeNote: "✓ Tutte queste funzionalità sono completamente gratuite.",
      btnSignup: "Crea il mio account gratuito",
      btnLogin: "Ho già un account"
    },
    pt: {
      title: "Registro obrigatório",
      message: "Para ver o resto deste itinerário, imprimi-lo, personalizá-lo e salvar suas futuras reservas, você deve estar registrado.",
      freeNote: "✓ Todos esses recursos são totalmente gratuitos.",
      btnSignup: "Criar minha conta gratuita",
      btnLogin: "Já tenho uma conta"
    },
    ar: {
      title: "التسجيل مطلوب",
      message: "لعرض بقية هذا المسار وطباعته وتخصيصه وحفظ حجوزاتك المستقبلية، يجب أن تكون مسجلاً.",
      freeNote: "✓ جميع هذه الميزات مجانية تماماً.",
      btnSignup: "إنشاء حسابي المجاني",
      btnLogin: "لدي حساب بالفعل"
    }
  };

  // Helper pour obtenir la langue courante
  window.ORT_AUTH_I18N.getLang = function() {
    const urlLang = new URLSearchParams(location.search).get('lang');
    const storedLang = localStorage.getItem('ort_lang');
    const browserLang = navigator.language?.slice(0, 2);
    return urlLang || storedLang || browserLang || 'fr';
  };

  // Helper pour obtenir une traduction
  window.ORT_AUTH_I18N.t = function(key) {
    const lang = this.getLang();
    const translations = this[lang] || this['en'] || this['fr'];
    return translations[key] || key;
  };

  // Détecter si RTL (arabe)
  window.ORT_AUTH_I18N.isRTL = function() {
    return this.getLang() === 'ar';
  };

  console.log('[ORT-I18N-AUTH] ✅ Module chargé');
})();
