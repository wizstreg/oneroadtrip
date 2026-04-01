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
      contactBtn: "Nous contacter",
      contactDesc: "Un souci pour vous connecter ? Écrivez-nous.",
      contactName: "Votre nom",
      contactEmail: "Votre email",
      contactSubject: "Sujet",
      contactMessage: "Message",
      contactSend: "Envoyer",
      contactSuccess: "Message envoyé ! Nous vous répondons rapidement.",
      contactError: "Erreur d'envoi"
    },
    en: {
      title: "Registration required",
      message: "To view the rest of this itinerary, print it, customize it and save your future bookings, you must be registered.",
      freeNote: "✓ All these features are completely free.",
      btnSignup: "Create my free account",
      btnLogin: "I already have an account",
      contactBtn: "Contact us",
      contactDesc: "Having trouble signing in? Write to us.",
      contactName: "Your name",
      contactEmail: "Your email",
      contactSubject: "Subject",
      contactMessage: "Message",
      contactSend: "Send",
      contactSuccess: "Message sent! We'll get back to you shortly.",
      contactError: "Send error"
    },
    es: {
      title: "Registro requerido",
      message: "Para ver el resto de este itinerario, imprimirlo, personalizarlo y guardar sus futuras reservas, debe estar registrado.",
      freeNote: "✓ Todas estas funciones son completamente gratuitas.",
      btnSignup: "Crear mi cuenta gratuita",
      btnLogin: "Ya tengo una cuenta",
      contactBtn: "Contáctanos",
      contactDesc: "¿Problemas para conectarse? Escríbanos.",
      contactName: "Su nombre",
      contactEmail: "Su email",
      contactSubject: "Asunto",
      contactMessage: "Mensaje",
      contactSend: "Enviar",
      contactSuccess: "¡Mensaje enviado! Le responderemos pronto.",
      contactError: "Error de envío"
    },
    it: {
      title: "Registrazione richiesta",
      message: "Per vedere il resto di questo itinerario, stamparlo, personalizzarlo e salvare le tue future prenotazioni, devi essere registrato.",
      freeNote: "✓ Tutte queste funzionalità sono completamente gratuite.",
      btnSignup: "Crea il mio account gratuito",
      btnLogin: "Ho già un account",
      contactBtn: "Contattaci",
      contactDesc: "Problemi ad accedere? Scrivici.",
      contactName: "Il tuo nome",
      contactEmail: "La tua email",
      contactSubject: "Oggetto",
      contactMessage: "Messaggio",
      contactSend: "Invia",
      contactSuccess: "Messaggio inviato! Ti risponderemo presto.",
      contactError: "Errore di invio"
    },
    pt: {
      title: "Registro obrigatório",
      message: "Para ver o resto deste itinerário, imprimi-lo, personalizá-lo e salvar suas futuras reservas, você deve estar registrado.",
      freeNote: "✓ Todos esses recursos são totalmente gratuitos.",
      btnSignup: "Criar minha conta gratuita",
      btnLogin: "Já tenho uma conta",
      contactBtn: "Fale conosco",
      contactDesc: "Dificuldades para entrar? Escreva-nos.",
      contactName: "Seu nome",
      contactEmail: "Seu email",
      contactSubject: "Assunto",
      contactMessage: "Mensagem",
      contactSend: "Enviar",
      contactSuccess: "Mensagem enviada! Responderemos em breve.",
      contactError: "Erro de envio"
    },
    ar: {
      title: "التسجيل مطلوب",
      message: "لعرض بقية هذا المسار وطباعته وتخصيصه وحفظ حجوزاتك المستقبلية، يجب أن تكون مسجلاً.",
      freeNote: "✓ جميع هذه الميزات مجانية تماماً.",
      btnSignup: "إنشاء حسابي المجاني",
      btnLogin: "لدي حساب بالفعل",
      contactBtn: "تواصل معنا",
      contactDesc: "هل تواجه مشكلة في تسجيل الدخول؟ اكتب لنا.",
      contactName: "اسمك",
      contactEmail: "بريدك الإلكتروني",
      contactSubject: "الموضوع",
      contactMessage: "الرسالة",
      contactSend: "إرسال",
      contactSuccess: "تم إرسال الرسالة! سنرد عليك قريباً.",
      contactError: "خطأ في الإرسال"
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
