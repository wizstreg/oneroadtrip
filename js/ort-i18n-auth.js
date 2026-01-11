// ort-i18n-auth.js - Traductions pour la modale d'authentification obligatoire
(function() {
  'use strict';

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
