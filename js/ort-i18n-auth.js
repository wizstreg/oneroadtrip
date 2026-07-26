// ort-i18n-auth.js - Traductions pour la modale d'inscription obligatoire ET pour ort-header.js (auth + login)
(function() {
  'use strict';

  // ========================================================================
  // PARTIE 1 - Modale d'INSCRIPTION OBLIGATOIRE (inchangée)
  // Exposee via window.ORT_AUTH_I18N
  // ========================================================================
  window.ORT_AUTH_I18N = {
    fr: {
      title: "Inscription requise",
      message: "Pour voir la suite de cet itinéraire, l'imprimer, le personnaliser et enregistrer vos futures réservations, vous devez être inscrit.",
      freeNote: "✓ Toutes ces fonctionnalités sont entièrement gratuites.",
      btnSignup: "Créer mon compte gratuit",
      btnLogin: "J'ai déjà un compte"
    },
    en: {
      title: "Registration required",
      message: "To view the rest of this itinerary, print it, customize it and save your future bookings, you must be registered.",
      freeNote: "✓ All these features are completely free.",
      btnSignup: "Create my free account",
      btnLogin: "I already have an account"
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

  window.ORT_AUTH_I18N.getLang = function() {
    const urlLang = new URLSearchParams(location.search).get('lang');
    const storedLang = localStorage.getItem('ort_lang');
    const browserLang = navigator.language?.slice(0, 2);
    return urlLang || storedLang || browserLang || 'fr';
  };

  window.ORT_AUTH_I18N.t = function(key) {
    const lang = this.getLang();
    const translations = this[lang] || this['en'] || this['fr'];
    return translations[key] || key;
  };

  window.ORT_AUTH_I18N.isRTL = function() {
    return this.getLang() === 'ar';
  };

  // ========================================================================
  // PARTIE 2 - Header + Auth (NOUVEAU)
  // Exposee via window.ORT_I18N_AUTH (nom attendu par ort-header.js)
  // Contient TOUS les libelles utilises par ort-header.js : bouton login,
  // bouton logout, e-mail, modale email (login/signup/reset), messages,
  // erreurs Firebase.
  // ========================================================================

  // Noms de langues affiches dans le selecteur (toujours dans la langue native)
  var LANG_NAMES = {
    fr: "Français", en: "English", es: "Español",
    it: "Italiano", pt: "Português", ar: "العربية"
  };

  var DICT = {
    fr: {
      // Header - boutons visibles
      login: "Se connecter",
      logout: "Déconnexion",
      email: "E-mail",
      password: "Mot de passe",
      confirmPassword: "Confirmer le mot de passe",
      // Modale email - titres
      loginTitle: "Se connecter par e-mail",
      signupTitle: "Créer un compte",
      resetTitle: "Réinitialiser le mot de passe",
      // Modale email - boutons
      cancel: "Annuler",
      validate: "Valider",
      create: "Créer",
      sendResetLink: "Envoyer le lien",
      forgotPassword: "Mot de passe oublié ?",
      noAccountYet: "Créer un compte",
      alreadyHaveAccount: "J'ai déjà un compte",
      // CGU
      acceptCgu: "J'accepte les",
      cguLink: "CGU",
      // Messages succès
      msgLoginSuccess: "Connexion réussie.",
      msgEmailNotVerified: "Votre e-mail n'est pas encore vérifié. Vérifiez votre boîte de réception.",
      msgResendVerification: "Renvoyer l'e-mail de vérification",
      msgResetSent: "Un lien de réinitialisation a été envoyé à votre adresse.",
      msgVerificationSent: "Un e-mail de vérification a été envoyé à {email}. Cliquez sur le lien pour activer votre compte.",
      msgVerificationResent: "E-mail de vérification renvoyé à {email}.",
      // Erreurs
      errAcceptCgu: "Vous devez accepter les CGU.",
      errEmailInUse: "Cette adresse e-mail est déjà utilisée.",
      errFillFields: "Veuillez remplir tous les champs.",
      errGeneric: "Une erreur est survenue. Réessayez.",
      errInvalidEmail: "Adresse e-mail invalide.",
      errNetworkError: "Erreur réseau. Vérifiez votre connexion.",
      errPasswordMismatch: "Les mots de passe ne correspondent pas.",
      errPasswordTooShort: "Le mot de passe doit contenir au moins 6 caractères.",
      errPopupBlocked: "La fenêtre de connexion a été bloquée. Autorisez les popups.",
      errTooManyRequests: "Trop de tentatives. Réessayez plus tard.",
      errUserNotFound: "Aucun compte trouvé pour cette adresse.",
      errWeakPassword: "Mot de passe trop faible.",
      errWrongPassword: "Mot de passe incorrect.",
      langNames: LANG_NAMES
    },
    en: {
      login: "Sign in",
      logout: "Sign out",
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm password",
      loginTitle: "Sign in with email",
      signupTitle: "Create an account",
      resetTitle: "Reset password",
      cancel: "Cancel",
      validate: "Sign in",
      create: "Create",
      sendResetLink: "Send link",
      forgotPassword: "Forgot password?",
      noAccountYet: "Create an account",
      alreadyHaveAccount: "I already have an account",
      acceptCgu: "I accept the",
      cguLink: "Terms",
      msgLoginSuccess: "Successfully signed in.",
      msgEmailNotVerified: "Your email is not verified yet. Please check your inbox.",
      msgResendVerification: "Resend verification email",
      msgResetSent: "A reset link has been sent to your address.",
      msgVerificationSent: "A verification email has been sent to {email}. Click the link to activate your account.",
      msgVerificationResent: "Verification email resent to {email}.",
      errAcceptCgu: "You must accept the Terms.",
      errEmailInUse: "This email address is already in use.",
      errFillFields: "Please fill in all fields.",
      errGeneric: "An error occurred. Please try again.",
      errInvalidEmail: "Invalid email address.",
      errNetworkError: "Network error. Check your connection.",
      errPasswordMismatch: "Passwords do not match.",
      errPasswordTooShort: "Password must be at least 6 characters.",
      errPopupBlocked: "The sign-in popup was blocked. Please allow popups.",
      errTooManyRequests: "Too many attempts. Please try again later.",
      errUserNotFound: "No account found for this address.",
      errWeakPassword: "Password too weak.",
      errWrongPassword: "Incorrect password.",
      langNames: LANG_NAMES
    },
    es: {
      login: "Iniciar sesión",
      logout: "Cerrar sesión",
      email: "Correo electrónico",
      password: "Contraseña",
      confirmPassword: "Confirmar contraseña",
      loginTitle: "Iniciar sesión por correo",
      signupTitle: "Crear una cuenta",
      resetTitle: "Restablecer la contraseña",
      cancel: "Cancelar",
      validate: "Entrar",
      create: "Crear",
      sendResetLink: "Enviar enlace",
      forgotPassword: "¿Contraseña olvidada?",
      noAccountYet: "Crear una cuenta",
      alreadyHaveAccount: "Ya tengo una cuenta",
      acceptCgu: "Acepto las",
      cguLink: "Condiciones",
      msgLoginSuccess: "Sesión iniciada con éxito.",
      msgEmailNotVerified: "Su correo aún no está verificado. Compruebe su bandeja de entrada.",
      msgResendVerification: "Reenviar el correo de verificación",
      msgResetSent: "Se ha enviado un enlace de restablecimiento a su dirección.",
      msgVerificationSent: "Se ha enviado un correo de verificación a {email}. Haga clic en el enlace para activar su cuenta.",
      msgVerificationResent: "Correo de verificación reenviado a {email}.",
      errAcceptCgu: "Debe aceptar las Condiciones.",
      errEmailInUse: "Esta dirección de correo ya está en uso.",
      errFillFields: "Por favor, rellene todos los campos.",
      errGeneric: "Se produjo un error. Inténtelo de nuevo.",
      errInvalidEmail: "Dirección de correo inválida.",
      errNetworkError: "Error de red. Verifique su conexión.",
      errPasswordMismatch: "Las contraseñas no coinciden.",
      errPasswordTooShort: "La contraseña debe tener al menos 6 caracteres.",
      errPopupBlocked: "La ventana de inicio de sesión fue bloqueada. Permita las ventanas emergentes.",
      errTooManyRequests: "Demasiados intentos. Inténtelo más tarde.",
      errUserNotFound: "No se encontró ninguna cuenta para esta dirección.",
      errWeakPassword: "Contraseña demasiado débil.",
      errWrongPassword: "Contraseña incorrecta.",
      langNames: LANG_NAMES
    },
    it: {
      login: "Accedi",
      logout: "Esci",
      email: "E-mail",
      password: "Password",
      confirmPassword: "Conferma password",
      loginTitle: "Accedi via e-mail",
      signupTitle: "Crea un account",
      resetTitle: "Reimposta la password",
      cancel: "Annulla",
      validate: "Accedi",
      create: "Crea",
      sendResetLink: "Invia link",
      forgotPassword: "Password dimenticata?",
      noAccountYet: "Crea un account",
      alreadyHaveAccount: "Ho già un account",
      acceptCgu: "Accetto i",
      cguLink: "Termini",
      msgLoginSuccess: "Accesso effettuato con successo.",
      msgEmailNotVerified: "La tua e-mail non è ancora verificata. Controlla la tua casella di posta.",
      msgResendVerification: "Rinvia l'e-mail di verifica",
      msgResetSent: "Un link di reimpostazione è stato inviato al tuo indirizzo.",
      msgVerificationSent: "Un'e-mail di verifica è stata inviata a {email}. Clicca sul link per attivare il tuo account.",
      msgVerificationResent: "E-mail di verifica reinviata a {email}.",
      errAcceptCgu: "Devi accettare i Termini.",
      errEmailInUse: "Questo indirizzo e-mail è già in uso.",
      errFillFields: "Compila tutti i campi.",
      errGeneric: "Si è verificato un errore. Riprova.",
      errInvalidEmail: "Indirizzo e-mail non valido.",
      errNetworkError: "Errore di rete. Verifica la connessione.",
      errPasswordMismatch: "Le password non corrispondono.",
      errPasswordTooShort: "La password deve contenere almeno 6 caratteri.",
      errPopupBlocked: "La finestra di accesso è stata bloccata. Consenti i popup.",
      errTooManyRequests: "Troppi tentativi. Riprova più tardi.",
      errUserNotFound: "Nessun account trovato per questo indirizzo.",
      errWeakPassword: "Password troppo debole.",
      errWrongPassword: "Password errata.",
      langNames: LANG_NAMES
    },
    pt: {
      login: "Entrar",
      logout: "Sair",
      email: "E-mail",
      password: "Senha",
      confirmPassword: "Confirmar senha",
      loginTitle: "Entrar por e-mail",
      signupTitle: "Criar uma conta",
      resetTitle: "Redefinir a senha",
      cancel: "Cancelar",
      validate: "Entrar",
      create: "Criar",
      sendResetLink: "Enviar link",
      forgotPassword: "Esqueceu a senha?",
      noAccountYet: "Criar uma conta",
      alreadyHaveAccount: "Já tenho uma conta",
      acceptCgu: "Aceito os",
      cguLink: "Termos",
      msgLoginSuccess: "Login efetuado com sucesso.",
      msgEmailNotVerified: "Seu e-mail ainda não foi verificado. Verifique sua caixa de entrada.",
      msgResendVerification: "Reenviar o e-mail de verificação",
      msgResetSent: "Um link de redefinição foi enviado para o seu endereço.",
      msgVerificationSent: "Um e-mail de verificação foi enviado para {email}. Clique no link para ativar sua conta.",
      msgVerificationResent: "E-mail de verificação reenviado para {email}.",
      errAcceptCgu: "Você deve aceitar os Termos.",
      errEmailInUse: "Este endereço de e-mail já está em uso.",
      errFillFields: "Preencha todos os campos.",
      errGeneric: "Ocorreu um erro. Tente novamente.",
      errInvalidEmail: "Endereço de e-mail inválido.",
      errNetworkError: "Erro de rede. Verifique sua conexão.",
      errPasswordMismatch: "As senhas não coincidem.",
      errPasswordTooShort: "A senha deve ter pelo menos 6 caracteres.",
      errPopupBlocked: "A janela de login foi bloqueada. Permita os pop-ups.",
      errTooManyRequests: "Muitas tentativas. Tente novamente mais tarde.",
      errUserNotFound: "Nenhuma conta encontrada para este endereço.",
      errWeakPassword: "Senha muito fraca.",
      errWrongPassword: "Senha incorreta.",
      langNames: LANG_NAMES
    },
    ar: {
      login: "تسجيل الدخول",
      logout: "تسجيل الخروج",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      confirmPassword: "تأكيد كلمة المرور",
      loginTitle: "تسجيل الدخول بالبريد الإلكتروني",
      signupTitle: "إنشاء حساب",
      resetTitle: "إعادة تعيين كلمة المرور",
      cancel: "إلغاء",
      validate: "تأكيد",
      create: "إنشاء",
      sendResetLink: "إرسال الرابط",
      forgotPassword: "نسيت كلمة المرور؟",
      noAccountYet: "إنشاء حساب",
      alreadyHaveAccount: "لدي حساب بالفعل",
      acceptCgu: "أوافق على",
      cguLink: "الشروط",
      msgLoginSuccess: "تم تسجيل الدخول بنجاح.",
      msgEmailNotVerified: "لم يتم التحقق من بريدك الإلكتروني بعد. يرجى مراجعة صندوق الوارد.",
      msgResendVerification: "إعادة إرسال بريد التحقق",
      msgResetSent: "تم إرسال رابط إعادة التعيين إلى عنوانك.",
      msgVerificationSent: "تم إرسال بريد التحقق إلى {email}. انقر على الرابط لتفعيل حسابك.",
      msgVerificationResent: "تم إعادة إرسال بريد التحقق إلى {email}.",
      errAcceptCgu: "يجب الموافقة على الشروط.",
      errEmailInUse: "هذا البريد الإلكتروني مستخدم بالفعل.",
      errFillFields: "يرجى ملء جميع الحقول.",
      errGeneric: "حدث خطأ. حاول مرة أخرى.",
      errInvalidEmail: "البريد الإلكتروني غير صالح.",
      errNetworkError: "خطأ في الشبكة. تحقق من اتصالك.",
      errPasswordMismatch: "كلمات المرور غير متطابقة.",
      errPasswordTooShort: "يجب أن تحتوي كلمة المرور على 6 أحرف على الأقل.",
      errPopupBlocked: "تم حظر نافذة تسجيل الدخول. يرجى السماح بالنوافذ المنبثقة.",
      errTooManyRequests: "محاولات كثيرة جداً. حاول لاحقاً.",
      errUserNotFound: "لم يتم العثور على حساب لهذا العنوان.",
      errWeakPassword: "كلمة المرور ضعيفة جداً.",
      errWrongPassword: "كلمة المرور غير صحيحة.",
      langNames: LANG_NAMES
    }
  };

  // Expose la variable attendue par ort-header.js
  // API utilisee : ORT_I18N_AUTH.get(lang) ou ORT_I18N_AUTH.fr (fallback)
  window.ORT_I18N_AUTH = {
    fr: DICT.fr,
    en: DICT.en,
    es: DICT.es,
    it: DICT.it,
    pt: DICT.pt,
    ar: DICT.ar,
    get: function(lang) {
      return DICT[lang] || DICT.fr;
    }
  };

  console.log('[ORT-I18N-AUTH] ✅ Module chargé (modale inscription + header auth)');
})();
