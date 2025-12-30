/**
 * ORT-I18N-AUTH.js
 * Traductions multilingues pour l'authentification, le footer et les cookies
 * Langues : fr, en, es, it, pt, ar
 * 
 * Usage : window.ORT_I18N_AUTH[lang].key
 */
(function(){
  'use strict';

  window.ORT_I18N_AUTH = {
    // ============================================
    // FRANÇAIS
    // ============================================
    fr: {
      // Auth - Labels
      login: "Se connecter",
      logout: "Déconnexion",
      createAccount: "Créer un compte",
      email: "E-mail",
      password: "Mot de passe",
      confirmPassword: "Confirmer le mot de passe",
      forgotPassword: "Mot de passe oublié ?",
      resetPassword: "Réinitialiser le mot de passe",
      sendResetLink: "Envoyer le lien",
      emailSent: "E-mail envoyé",
      validate: "Valider",
      cancel: "Annuler",
      create: "Créer",
      close: "Fermer",
      
      // Auth - Modes
      loginTitle: "Se connecter par e-mail",
      signupTitle: "Créer un compte",
      resetTitle: "Réinitialiser le mot de passe",
      alreadyHaveAccount: "J'ai déjà un compte",
      noAccountYet: "Créer un compte",
      
      // Auth - CGU
      acceptCgu: "J'accepte les",
      cguLink: "Conditions Générales d'Utilisation",
      
      // Auth - Messages
      msgVerificationSent: "Un e-mail de vérification a été envoyé à {email}",
      msgResetSent: "Si l'adresse existe, un e-mail de réinitialisation a été envoyé.",
      msgLoginSuccess: "Connexion réussie.",
      msgEmailNotVerified: "Votre e-mail n'est pas vérifié. Cliquez sur le lien reçu, puis revenez ici.",
      msgResendVerification: "Renvoyer le lien de vérification",
      msgVerificationResent: "Lien de vérification renvoyé à {email}",
      
      // Auth - Erreurs
      errFillFields: "Veuillez remplir tous les champs.",
      errInvalidEmail: "Format d'e-mail invalide.",
      errPasswordTooShort: "Mot de passe trop court (6 caractères minimum).",
      errPasswordMismatch: "Les mots de passe ne correspondent pas.",
      errAcceptCgu: "Veuillez accepter les CGU pour continuer.",
      errUserNotFound: "Aucun compte associé à cet e-mail.",
      errWrongPassword: "Identifiants incorrects.",
      errEmailInUse: "Cet e-mail est déjà utilisé.",
      errWeakPassword: "Mot de passe trop faible.",
      errTooManyRequests: "Trop de tentatives. Réessayez plus tard.",
      errNetworkError: "Problème de connexion réseau.",
      errPopupBlocked: "Connexion impossible (popup bloquée ?).",
      errGeneric: "Une erreur s'est produite. Veuillez réessayer.",
      
      // Footer - Liens légaux
      legalNotice: "Mentions légales",
      privacyPolicy: "Confidentialité",
      cookiePolicy: "Cookies",
      about: "À propos",
      
      // Cookies - Bannière
      cookieText: "Nous utilisons des cookies essentiels pour votre connexion. Les cookies optionnels sont désactivés par défaut.",
      cookieNecessary: "Cookies nécessaires (connexion)",
      cookieAnalytics: "Mesure d'audience",
      cookieMarketing: "Marketing",
      cookieAccept: "Tout accepter",
      cookieReject: "Tout refuser",
      cookieCustomize: "Paramétrer",
      cookieLearnMore: "En savoir plus",
      
      // Langue
      langLabel: "Langue",
      langNames: {
        fr: "Français",
        en: "English",
        it: "Italiano",
        es: "Español",
        pt: "Português",
        ar: "العربية"
      }
    },

    // ============================================
    // ENGLISH
    // ============================================
    en: {
      // Auth - Labels
      login: "Sign in",
      logout: "Log out",
      createAccount: "Create account",
      email: "E-mail",
      password: "Password",
      confirmPassword: "Confirm password",
      forgotPassword: "Forgot password?",
      resetPassword: "Reset password",
      sendResetLink: "Send link",
      emailSent: "E-mail sent",
      validate: "Submit",
      cancel: "Cancel",
      create: "Create",
      close: "Close",
      
      // Auth - Modes
      loginTitle: "Sign in with e-mail",
      signupTitle: "Create account",
      resetTitle: "Reset password",
      alreadyHaveAccount: "I already have an account",
      noAccountYet: "Create account",
      
      // Auth - CGU
      acceptCgu: "I accept the",
      cguLink: "Terms of Service",
      
      // Auth - Messages
      msgVerificationSent: "A verification e-mail has been sent to {email}",
      msgResetSent: "If the address exists, a reset e-mail has been sent.",
      msgLoginSuccess: "Login successful.",
      msgEmailNotVerified: "Your e-mail is not verified. Click the link received, then come back here.",
      msgResendVerification: "Resend verification link",
      msgVerificationResent: "Verification link resent to {email}",
      
      // Auth - Erreurs
      errFillFields: "Please fill in all fields.",
      errInvalidEmail: "Invalid e-mail format.",
      errPasswordTooShort: "Password too short (6 characters minimum).",
      errPasswordMismatch: "Passwords do not match.",
      errAcceptCgu: "Please accept the Terms of Service to continue.",
      errUserNotFound: "No account associated with this e-mail.",
      errWrongPassword: "Invalid credentials.",
      errEmailInUse: "This e-mail is already in use.",
      errWeakPassword: "Password too weak.",
      errTooManyRequests: "Too many attempts. Try again later.",
      errNetworkError: "Network connection problem.",
      errPopupBlocked: "Login failed (popup blocked?).",
      errGeneric: "An error occurred. Please try again.",
      
      // Footer - Liens légaux
      legalNotice: "Legal notice",
      privacyPolicy: "Privacy",
      cookiePolicy: "Cookies",
      about: "About",
      
      // Cookies - Bannière
      cookieText: "We use essential cookies for login. Optional cookies are disabled by default.",
      cookieNecessary: "Necessary cookies (login)",
      cookieAnalytics: "Analytics",
      cookieMarketing: "Marketing",
      cookieAccept: "Accept all",
      cookieReject: "Reject all",
      cookieCustomize: "Customize",
      cookieLearnMore: "Learn more",
      
      // Langue
      langLabel: "Language",
      langNames: {
        fr: "Français",
        en: "English",
        it: "Italiano",
        es: "Español",
        pt: "Português",
        ar: "العربية"
      }
    },

    // ============================================
    // ESPAÑOL
    // ============================================
    es: {
      // Auth - Labels
      login: "Iniciar sesión",
      logout: "Cerrar sesión",
      createAccount: "Crear cuenta",
      email: "Correo electrónico",
      password: "Contraseña",
      confirmPassword: "Confirmar contraseña",
      forgotPassword: "¿Olvidaste la contraseña?",
      resetPassword: "Restablecer contraseña",
      sendResetLink: "Enviar enlace",
      emailSent: "Correo enviado",
      validate: "Validar",
      cancel: "Cancelar",
      create: "Crear",
      close: "Cerrar",
      
      // Auth - Modes
      loginTitle: "Iniciar sesión con correo",
      signupTitle: "Crear cuenta",
      resetTitle: "Restablecer contraseña",
      alreadyHaveAccount: "Ya tengo una cuenta",
      noAccountYet: "Crear cuenta",
      
      // Auth - CGU
      acceptCgu: "Acepto los",
      cguLink: "Términos de Servicio",
      
      // Auth - Messages
      msgVerificationSent: "Se ha enviado un correo de verificación a {email}",
      msgResetSent: "Si la dirección existe, se ha enviado un correo de restablecimiento.",
      msgLoginSuccess: "Inicio de sesión exitoso.",
      msgEmailNotVerified: "Tu correo no está verificado. Haz clic en el enlace recibido y vuelve aquí.",
      msgResendVerification: "Reenviar enlace de verificación",
      msgVerificationResent: "Enlace de verificación reenviado a {email}",
      
      // Auth - Erreurs
      errFillFields: "Por favor completa todos los campos.",
      errInvalidEmail: "Formato de correo inválido.",
      errPasswordTooShort: "Contraseña muy corta (mínimo 6 caracteres).",
      errPasswordMismatch: "Las contraseñas no coinciden.",
      errAcceptCgu: "Por favor acepta los Términos de Servicio para continuar.",
      errUserNotFound: "No hay cuenta asociada a este correo.",
      errWrongPassword: "Credenciales incorrectas.",
      errEmailInUse: "Este correo ya está en uso.",
      errWeakPassword: "Contraseña muy débil.",
      errTooManyRequests: "Demasiados intentos. Inténtalo más tarde.",
      errNetworkError: "Problema de conexión de red.",
      errPopupBlocked: "Inicio de sesión fallido (¿popup bloqueado?).",
      errGeneric: "Ha ocurrido un error. Por favor inténtalo de nuevo.",
      
      // Footer - Liens légaux
      legalNotice: "Aviso legal",
      privacyPolicy: "Privacidad",
      cookiePolicy: "Cookies",
      about: "Acerca de",
      
      // Cookies - Bannière
      cookieText: "Usamos cookies esenciales para el inicio de sesión. Las cookies opcionales están desactivadas por defecto.",
      cookieNecessary: "Cookies necesarias (inicio de sesión)",
      cookieAnalytics: "Analíticas",
      cookieMarketing: "Marketing",
      cookieAccept: "Aceptar todo",
      cookieReject: "Rechazar todo",
      cookieCustomize: "Personalizar",
      cookieLearnMore: "Más información",
      
      // Langue
      langLabel: "Idioma",
      langNames: {
        fr: "Français",
        en: "English",
        it: "Italiano",
        es: "Español",
        pt: "Português",
        ar: "العربية"
      }
    },

    // ============================================
    // ITALIANO
    // ============================================
    it: {
      // Auth - Labels
      login: "Accedi",
      logout: "Esci",
      createAccount: "Crea account",
      email: "E-mail",
      password: "Password",
      confirmPassword: "Conferma password",
      forgotPassword: "Password dimenticata?",
      resetPassword: "Reimposta password",
      sendResetLink: "Invia link",
      emailSent: "E-mail inviata",
      validate: "Conferma",
      cancel: "Annulla",
      create: "Crea",
      close: "Chiudi",
      
      // Auth - Modes
      loginTitle: "Accedi con e-mail",
      signupTitle: "Crea account",
      resetTitle: "Reimposta password",
      alreadyHaveAccount: "Ho già un account",
      noAccountYet: "Crea account",
      
      // Auth - CGU
      acceptCgu: "Accetto i",
      cguLink: "Termini di Servizio",
      
      // Auth - Messages
      msgVerificationSent: "È stata inviata un'e-mail di verifica a {email}",
      msgResetSent: "Se l'indirizzo esiste, è stata inviata un'e-mail di reimpostazione.",
      msgLoginSuccess: "Accesso riuscito.",
      msgEmailNotVerified: "La tua e-mail non è verificata. Clicca sul link ricevuto, poi torna qui.",
      msgResendVerification: "Rinvia link di verifica",
      msgVerificationResent: "Link di verifica rinviato a {email}",
      
      // Auth - Erreurs
      errFillFields: "Per favore compila tutti i campi.",
      errInvalidEmail: "Formato e-mail non valido.",
      errPasswordTooShort: "Password troppo corta (minimo 6 caratteri).",
      errPasswordMismatch: "Le password non corrispondono.",
      errAcceptCgu: "Per favore accetta i Termini di Servizio per continuare.",
      errUserNotFound: "Nessun account associato a questa e-mail.",
      errWrongPassword: "Credenziali non valide.",
      errEmailInUse: "Questa e-mail è già in uso.",
      errWeakPassword: "Password troppo debole.",
      errTooManyRequests: "Troppi tentativi. Riprova più tardi.",
      errNetworkError: "Problema di connessione di rete.",
      errPopupBlocked: "Accesso fallito (popup bloccato?).",
      errGeneric: "Si è verificato un errore. Per favore riprova.",
      
      // Footer - Liens légaux
      legalNotice: "Note legali",
      privacyPolicy: "Privacy",
      cookiePolicy: "Cookie",
      about: "Chi siamo",
      
      // Cookies - Bannière
      cookieText: "Utilizziamo cookie essenziali per l'accesso. I cookie opzionali sono disattivati per impostazione predefinita.",
      cookieNecessary: "Cookie necessari (accesso)",
      cookieAnalytics: "Analisi",
      cookieMarketing: "Marketing",
      cookieAccept: "Accetta tutto",
      cookieReject: "Rifiuta tutto",
      cookieCustomize: "Personalizza",
      cookieLearnMore: "Scopri di più",
      
      // Langue
      langLabel: "Lingua",
      langNames: {
        fr: "Français",
        en: "English",
        it: "Italiano",
        es: "Español",
        pt: "Português",
        ar: "العربية"
      }
    },

    // ============================================
    // PORTUGUÊS
    // ============================================
    pt: {
      // Auth - Labels
      login: "Entrar",
      logout: "Sair",
      createAccount: "Criar conta",
      email: "E-mail",
      password: "Palavra-passe",
      confirmPassword: "Confirmar palavra-passe",
      forgotPassword: "Esqueceu a palavra-passe?",
      resetPassword: "Redefinir palavra-passe",
      sendResetLink: "Enviar link",
      emailSent: "E-mail enviado",
      validate: "Validar",
      cancel: "Cancelar",
      create: "Criar",
      close: "Fechar",
      
      // Auth - Modes
      loginTitle: "Entrar com e-mail",
      signupTitle: "Criar conta",
      resetTitle: "Redefinir palavra-passe",
      alreadyHaveAccount: "Já tenho uma conta",
      noAccountYet: "Criar conta",
      
      // Auth - CGU
      acceptCgu: "Aceito os",
      cguLink: "Termos de Serviço",
      
      // Auth - Messages
      msgVerificationSent: "Foi enviado um e-mail de verificação para {email}",
      msgResetSent: "Se o endereço existir, foi enviado um e-mail de redefinição.",
      msgLoginSuccess: "Login bem-sucedido.",
      msgEmailNotVerified: "O seu e-mail não está verificado. Clique no link recebido e volte aqui.",
      msgResendVerification: "Reenviar link de verificação",
      msgVerificationResent: "Link de verificação reenviado para {email}",
      
      // Auth - Erreurs
      errFillFields: "Por favor preencha todos os campos.",
      errInvalidEmail: "Formato de e-mail inválido.",
      errPasswordTooShort: "Palavra-passe muito curta (mínimo 6 caracteres).",
      errPasswordMismatch: "As palavras-passe não coincidem.",
      errAcceptCgu: "Por favor aceite os Termos de Serviço para continuar.",
      errUserNotFound: "Nenhuma conta associada a este e-mail.",
      errWrongPassword: "Credenciais inválidas.",
      errEmailInUse: "Este e-mail já está em uso.",
      errWeakPassword: "Palavra-passe muito fraca.",
      errTooManyRequests: "Demasiadas tentativas. Tente novamente mais tarde.",
      errNetworkError: "Problema de conexão de rede.",
      errPopupBlocked: "Login falhou (popup bloqueado?).",
      errGeneric: "Ocorreu um erro. Por favor tente novamente.",
      
      // Footer - Liens légaux
      legalNotice: "Aviso legal",
      privacyPolicy: "Privacidade",
      cookiePolicy: "Cookies",
      about: "Sobre",
      
      // Cookies - Bannière
      cookieText: "Utilizamos cookies essenciais para o login. Os cookies opcionais estão desativados por defeito.",
      cookieNecessary: "Cookies necessários (login)",
      cookieAnalytics: "Análise",
      cookieMarketing: "Marketing",
      cookieAccept: "Aceitar tudo",
      cookieReject: "Rejeitar tudo",
      cookieCustomize: "Personalizar",
      cookieLearnMore: "Saber mais",
      
      // Langue
      langLabel: "Idioma",
      langNames: {
        fr: "Français",
        en: "English",
        it: "Italiano",
        es: "Español",
        pt: "Português",
        ar: "العربية"
      }
    },

    // ============================================
    // ARABIC (العربية)
    // ============================================
    ar: {
      // Auth - Labels
      login: "تسجيل الدخول",
      logout: "تسجيل الخروج",
      createAccount: "إنشاء حساب",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      confirmPassword: "تأكيد كلمة المرور",
      forgotPassword: "نسيت كلمة المرور؟",
      resetPassword: "إعادة تعيين كلمة المرور",
      sendResetLink: "إرسال الرابط",
      emailSent: "تم إرسال البريد",
      validate: "تأكيد",
      cancel: "إلغاء",
      create: "إنشاء",
      close: "إغلاق",
      
      // Auth - Modes
      loginTitle: "تسجيل الدخول بالبريد الإلكتروني",
      signupTitle: "إنشاء حساب",
      resetTitle: "إعادة تعيين كلمة المرور",
      alreadyHaveAccount: "لدي حساب بالفعل",
      noAccountYet: "إنشاء حساب",
      
      // Auth - CGU
      acceptCgu: "أوافق على",
      cguLink: "شروط الخدمة",
      
      // Auth - Messages
      msgVerificationSent: "تم إرسال بريد التحقق إلى {email}",
      msgResetSent: "إذا كان العنوان موجودًا، تم إرسال بريد إعادة التعيين.",
      msgLoginSuccess: "تم تسجيل الدخول بنجاح.",
      msgEmailNotVerified: "لم يتم التحقق من بريدك الإلكتروني. انقر على الرابط المستلم ثم عد هنا.",
      msgResendVerification: "إعادة إرسال رابط التحقق",
      msgVerificationResent: "تم إعادة إرسال رابط التحقق إلى {email}",
      
      // Auth - Erreurs
      errFillFields: "يرجى ملء جميع الحقول.",
      errInvalidEmail: "تنسيق البريد الإلكتروني غير صالح.",
      errPasswordTooShort: "كلمة المرور قصيرة جدًا (6 أحرف على الأقل).",
      errPasswordMismatch: "كلمات المرور غير متطابقة.",
      errAcceptCgu: "يرجى قبول شروط الخدمة للمتابعة.",
      errUserNotFound: "لا يوجد حساب مرتبط بهذا البريد الإلكتروني.",
      errWrongPassword: "بيانات الاعتماد غير صحيحة.",
      errEmailInUse: "هذا البريد الإلكتروني مستخدم بالفعل.",
      errWeakPassword: "كلمة المرور ضعيفة جدًا.",
      errTooManyRequests: "محاولات كثيرة جدًا. حاول لاحقًا.",
      errNetworkError: "مشكلة في اتصال الشبكة.",
      errPopupBlocked: "فشل تسجيل الدخول (النافذة المنبثقة محظورة؟).",
      errGeneric: "حدث خطأ. يرجى المحاولة مرة أخرى.",
      
      // Footer - Liens légaux
      legalNotice: "إشعار قانوني",
      privacyPolicy: "الخصوصية",
      cookiePolicy: "ملفات تعريف الارتباط",
      about: "من نحن",
      
      // Cookies - Bannière
      cookieText: "نستخدم ملفات تعريف الارتباط الأساسية لتسجيل الدخول. ملفات تعريف الارتباط الاختيارية معطلة افتراضيًا.",
      cookieNecessary: "ملفات تعريف الارتباط الضرورية (تسجيل الدخول)",
      cookieAnalytics: "التحليلات",
      cookieMarketing: "التسويق",
      cookieAccept: "قبول الكل",
      cookieReject: "رفض الكل",
      cookieCustomize: "تخصيص",
      cookieLearnMore: "معرفة المزيد",
      
      // Langue
      langLabel: "اللغة",
      langNames: {
        fr: "Français",
        en: "English",
        it: "Italiano",
        es: "Español",
        pt: "Português",
        ar: "العربية"
      }
    }
  };

  // ============================================
  // HELPER : Récupère les traductions pour la langue courante
  // ============================================
  window.ORT_I18N_AUTH.get = function(lang) {
    const supported = ['fr', 'en', 'es', 'it', 'pt', 'ar'];
    const l = (lang || 'fr').toLowerCase().slice(0, 2);
    return window.ORT_I18N_AUTH[supported.includes(l) ? l : 'fr'];
  };

  // ============================================
  // HELPER : Détecte la langue courante
  // ============================================
  window.ORT_I18N_AUTH.detectLang = function() {
    const supported = ['fr', 'en', 'es', 'it', 'pt', 'ar'];
    // 1. localStorage
    let lang = (localStorage.getItem('lang') || '').toLowerCase().slice(0, 2);
    if (supported.includes(lang)) return lang;
    // 2. URL param
    const urlLang = new URLSearchParams(window.location.search).get('lang');
    if (urlLang) {
      lang = urlLang.toLowerCase().slice(0, 2);
      if (supported.includes(lang)) return lang;
    }
    // 3. navigator
    lang = (navigator.language || 'fr').toLowerCase().slice(0, 2);
    if (supported.includes(lang)) return lang;
    // 4. fallback
    return 'fr';
  };

})();