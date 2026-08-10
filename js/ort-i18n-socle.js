/**
 * OneRoadTrip - SOCLE I18N (en-tete, pied de page, connexion)
 * ============================================================
 * Format unique : une cle, puis les langues.
 * 8 langues : fr, en, es, it, pt, ar, nl, de
 *
 * Ce fichier remplace les dictionnaires eparpilles dans :
 *   - ort-header.js  (NEWS_LABEL, CATALOG_LABEL, BLOG_LABEL, TRIPS_LABEL)
 *   - ort-footer.js  (COOKIE_I18N)
 *   - ort-i18n-auth.js (DICT + ORT_AUTH_I18N)
 *
 * Il reconstruit en fin de fichier les anciens objets (ORT_I18N_AUTH,
 * ORT_AUTH_I18N, ORT_COOKIE_I18N) pour ne rien casser.
 *
 * A charger AVANT ort-header.js et ort-footer.js.
 */
(function () {
  'use strict';

  var LANGS = ['fr', 'en', 'es', 'it', 'pt', 'ar', 'nl', 'de'];
  var RTL = ['ar'];

  var S = {

    // ═══════════════════════════════════════════════════════════
    // EN-TETE : libelles de navigation
    // ═══════════════════════════════════════════════════════════
    navNews: {
      fr: 'Actualités', en: 'News', es: 'Noticias', it: 'Notizie',
      pt: 'Notícias', ar: 'أخبار', nl: 'Nieuws', de: 'Aktuelles'
    },
    navCatalog: {
      fr: 'Catalogue', en: 'Catalogue', es: 'Catálogo', it: 'Catalogo',
      pt: 'Catálogo', ar: 'الكتالوج', nl: 'Catalogus', de: 'Katalog'
    },
    navBlog: {
      fr: 'Blog', en: 'Blog', es: 'Blog', it: 'Blog',
      pt: 'Blog', ar: 'المدونة', nl: 'Blog', de: 'Blog'
    },
    navTrips: {
      fr: 'Vos voyages', en: 'Your trips', es: 'Tus viajes', it: 'I tuoi viaggi',
      pt: 'As suas viagens', ar: 'رحلاتك', nl: 'Jouw reizen', de: 'Deine Reisen'
    },

    // ═══════════════════════════════════════════════════════════
    // CONNEXION : boutons visibles dans l'en-tete
    // ═══════════════════════════════════════════════════════════
    authLogin: {
      fr: 'Se connecter', en: 'Sign in', es: 'Iniciar sesión', it: 'Accedi',
      pt: 'Iniciar sessão', ar: 'تسجيل الدخول', nl: 'Inloggen', de: 'Anmelden'
    },
    authLogout: {
      fr: 'Déconnexion', en: 'Sign out', es: 'Cerrar sesión', it: 'Esci',
      pt: 'Terminar sessão', ar: 'تسجيل الخروج', nl: 'Uitloggen', de: 'Abmelden'
    },
    authEmail: {
      fr: 'E-mail', en: 'Email', es: 'Correo electrónico', it: 'E-mail',
      pt: 'E-mail', ar: 'البريد الإلكتروني', nl: 'E-mail', de: 'E-Mail'
    },
    authPassword: {
      fr: 'Mot de passe', en: 'Password', es: 'Contraseña', it: 'Password',
      pt: 'Palavra-passe', ar: 'كلمة المرور', nl: 'Wachtwoord', de: 'Passwort'
    },
    authConfirmPassword: {
      fr: 'Confirmer le mot de passe', en: 'Confirm password',
      es: 'Confirmar contraseña', it: 'Conferma password',
      pt: 'Confirmar palavra-passe', ar: 'تأكيد كلمة المرور',
      nl: 'Wachtwoord bevestigen', de: 'Passwort bestätigen'
    },

    // ── Connexion : titres de la fenetre
    authLoginTitle: {
      fr: 'Se connecter par e-mail', en: 'Sign in with email',
      es: 'Iniciar sesión con correo', it: 'Accedi con e-mail',
      pt: 'Iniciar sessão por e-mail', ar: 'تسجيل الدخول بالبريد الإلكتروني',
      nl: 'Inloggen met e-mail', de: 'Mit E-Mail anmelden'
    },
    authSignupTitle: {
      fr: 'Créer un compte', en: 'Create an account', es: 'Crear una cuenta',
      it: 'Crea un account', pt: 'Criar uma conta', ar: 'إنشاء حساب',
      nl: 'Account aanmaken', de: 'Konto erstellen'
    },
    authResetTitle: {
      fr: 'Réinitialiser le mot de passe', en: 'Reset password',
      es: 'Restablecer contraseña', it: 'Reimposta password',
      pt: 'Repor palavra-passe', ar: 'إعادة تعيين كلمة المرور',
      nl: 'Wachtwoord opnieuw instellen', de: 'Passwort zurücksetzen'
    },

    // ── Connexion : boutons
    authCancel: {
      fr: 'Annuler', en: 'Cancel', es: 'Cancelar', it: 'Annulla',
      pt: 'Cancelar', ar: 'إلغاء', nl: 'Annuleren', de: 'Abbrechen'
    },
    authValidate: {
      fr: 'Valider', en: 'Confirm', es: 'Validar', it: 'Conferma',
      pt: 'Validar', ar: 'تأكيد', nl: 'Bevestigen', de: 'Bestätigen'
    },
    authCreate: {
      fr: 'Créer', en: 'Create', es: 'Crear', it: 'Crea',
      pt: 'Criar', ar: 'إنشاء', nl: 'Aanmaken', de: 'Erstellen'
    },
    authSendResetLink: {
      fr: 'Envoyer le lien', en: 'Send link', es: 'Enviar enlace',
      it: 'Invia il link', pt: 'Enviar link', ar: 'إرسال الرابط',
      nl: 'Link versturen', de: 'Link senden'
    },
    authForgotPassword: {
      fr: 'Mot de passe oublié ?', en: 'Forgot password?',
      es: '¿Olvidaste tu contraseña?', it: 'Password dimenticata?',
      pt: 'Esqueceu a palavra-passe?', ar: 'هل نسيت كلمة المرور؟',
      nl: 'Wachtwoord vergeten?', de: 'Passwort vergessen?'
    },
    authNoAccountYet: {
      fr: 'Pas encore de compte ?', en: "Don't have an account yet?",
      es: '¿Aún no tienes cuenta?', it: 'Non hai ancora un account?',
      pt: 'Ainda não tem conta?', ar: 'ليس لديك حساب بعد؟',
      nl: 'Nog geen account?', de: 'Noch kein Konto?'
    },
    authAlreadyHaveAccount: {
      fr: 'Déjà un compte ?', en: 'Already have an account?',
      es: '¿Ya tienes cuenta?', it: 'Hai già un account?',
      pt: 'Já tem conta?', ar: 'لديك حساب بالفعل؟',
      nl: 'Al een account?', de: 'Schon ein Konto?'
    },
    authAcceptCgu: {
      fr: "J'accepte les conditions générales d'utilisation",
      en: 'I accept the terms of use',
      es: 'Acepto las condiciones generales de uso',
      it: "Accetto le condizioni generali d'uso",
      pt: 'Aceito os termos e condições de utilização',
      ar: 'أوافق على شروط الاستخدام',
      nl: 'Ik ga akkoord met de gebruiksvoorwaarden',
      de: 'Ich akzeptiere die Nutzungsbedingungen'
    },
    authCguLink: {
      fr: "conditions générales d'utilisation", en: 'terms of use',
      es: 'condiciones generales de uso', it: "condizioni generali d'uso",
      pt: 'termos e condições de utilização', ar: 'شروط الاستخدام',
      nl: 'gebruiksvoorwaarden', de: 'Nutzungsbedingungen'
    },

    // ── Connexion : messages
    authMsgLoginSuccess: {
      fr: 'Connexion réussie', en: 'Signed in successfully',
      es: 'Sesión iniciada correctamente', it: 'Accesso riuscito',
      pt: 'Sessão iniciada com sucesso', ar: 'تم تسجيل الدخول بنجاح',
      nl: 'Succesvol ingelogd', de: 'Erfolgreich angemeldet'
    },
    authMsgEmailNotVerified: {
      fr: "Votre adresse e-mail n'est pas encore vérifiée",
      en: 'Your email address is not verified yet',
      es: 'Tu correo electrónico aún no está verificado',
      it: 'Il tuo indirizzo e-mail non è ancora verificato',
      pt: 'O seu e-mail ainda não foi verificado',
      ar: 'لم يتم التحقق من بريدك الإلكتروني بعد',
      nl: 'Je e-mailadres is nog niet geverifieerd',
      de: 'Deine E-Mail-Adresse ist noch nicht bestätigt'
    },
    authMsgResendVerification: {
      fr: "Renvoyer l'e-mail de vérification",
      en: 'Resend verification email',
      es: 'Reenviar correo de verificación',
      it: "Rinvia l'e-mail di verifica",
      pt: 'Reenviar e-mail de verificação',
      ar: 'إعادة إرسال بريد التحقق',
      nl: 'Verificatiemail opnieuw versturen',
      de: 'Bestätigungs-E-Mail erneut senden'
    },
    authMsgResetSent: {
      fr: 'Lien de réinitialisation envoyé', en: 'Reset link sent',
      es: 'Enlace de restablecimiento enviado', it: 'Link di reimpostazione inviato',
      pt: 'Link de reposição enviado', ar: 'تم إرسال رابط إعادة التعيين',
      nl: 'Herstellink verstuurd', de: 'Link zum Zurücksetzen gesendet'
    },
    authMsgVerificationSent: {
      fr: 'E-mail de vérification envoyé', en: 'Verification email sent',
      es: 'Correo de verificación enviado', it: 'E-mail di verifica inviata',
      pt: 'E-mail de verificação enviado', ar: 'تم إرسال بريد التحقق',
      nl: 'Verificatiemail verstuurd', de: 'Bestätigungs-E-Mail gesendet'
    },
    authMsgVerificationResent: {
      fr: 'E-mail de vérification renvoyé', en: 'Verification email resent',
      es: 'Correo de verificación reenviado', it: 'E-mail di verifica rinviata',
      pt: 'E-mail de verificação reenviado', ar: 'تمت إعادة إرسال بريد التحقق',
      nl: 'Verificatiemail opnieuw verstuurd', de: 'Bestätigungs-E-Mail erneut gesendet'
    },

    // ── Connexion : erreurs
    authErrAcceptCgu: {
      fr: "Vous devez accepter les conditions générales d'utilisation",
      en: 'You must accept the terms of use',
      es: 'Debes aceptar las condiciones generales de uso',
      it: "Devi accettare le condizioni generali d'uso",
      pt: 'Tem de aceitar os termos e condições de utilização',
      ar: 'يجب عليك قبول شروط الاستخدام',
      nl: 'Je moet de gebruiksvoorwaarden accepteren',
      de: 'Du musst die Nutzungsbedingungen akzeptieren'
    },
    authErrEmailInUse: {
      fr: 'Cette adresse e-mail est déjà utilisée',
      en: 'This email address is already in use',
      es: 'Este correo electrónico ya está en uso',
      it: 'Questo indirizzo e-mail è già utilizzato',
      pt: 'Este e-mail já está a ser utilizado',
      ar: 'هذا البريد الإلكتروني مستخدم بالفعل',
      nl: 'Dit e-mailadres is al in gebruik',
      de: 'Diese E-Mail-Adresse wird bereits verwendet'
    },
    authErrFillFields: {
      fr: 'Veuillez remplir tous les champs', en: 'Please fill in all fields',
      es: 'Por favor, completa todos los campos', it: 'Compila tutti i campi',
      pt: 'Preencha todos os campos', ar: 'يرجى ملء جميع الحقول',
      nl: 'Vul alle velden in', de: 'Bitte fülle alle Felder aus'
    },
    authErrGeneric: {
      fr: "Une erreur est survenue. Réessayez.", en: 'An error occurred. Please try again.',
      es: 'Se produjo un error. Inténtalo de nuevo.', it: 'Si è verificato un errore. Riprova.',
      pt: 'Ocorreu um erro. Tente novamente.', ar: 'حدث خطأ. حاول مرة أخرى.',
      nl: 'Er is een fout opgetreden. Probeer het opnieuw.',
      de: 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.'
    },
    authErrInvalidEmail: {
      fr: 'Adresse e-mail invalide', en: 'Invalid email address',
      es: 'Correo electrónico no válido', it: 'Indirizzo e-mail non valido',
      pt: 'E-mail inválido', ar: 'عنوان بريد إلكتروني غير صالح',
      nl: 'Ongeldig e-mailadres', de: 'Ungültige E-Mail-Adresse'
    },
    authErrNetworkError: {
      fr: 'Problème de connexion réseau', en: 'Network connection problem',
      es: 'Problema de conexión de red', it: 'Problema di connessione di rete',
      pt: 'Problema de ligação à rede', ar: 'مشكلة في الاتصال بالشبكة',
      nl: 'Probleem met de netwerkverbinding', de: 'Problem mit der Netzwerkverbindung'
    },
    authErrPasswordMismatch: {
      fr: 'Les mots de passe ne correspondent pas', en: 'Passwords do not match',
      es: 'Las contraseñas no coinciden', it: 'Le password non corrispondono',
      pt: 'As palavras-passe não coincidem', ar: 'كلمتا المرور غير متطابقتين',
      nl: 'De wachtwoorden komen niet overeen', de: 'Die Passwörter stimmen nicht überein'
    },
    authErrPasswordTooShort: {
      fr: 'Le mot de passe doit contenir au moins 6 caractères',
      en: 'Password must be at least 6 characters',
      es: 'La contraseña debe tener al menos 6 caracteres',
      it: 'La password deve contenere almeno 6 caratteri',
      pt: 'A palavra-passe deve ter pelo menos 6 caracteres',
      ar: 'يجب أن تحتوي كلمة المرور على 6 أحرف على الأقل',
      nl: 'Het wachtwoord moet minstens 6 tekens bevatten',
      de: 'Das Passwort muss mindestens 6 Zeichen haben'
    },
    authErrPopupBlocked: {
      fr: 'La fenêtre a été bloquée par votre navigateur',
      en: 'The popup was blocked by your browser',
      es: 'Tu navegador bloqueó la ventana emergente',
      it: 'La finestra è stata bloccata dal browser',
      pt: 'A janela foi bloqueada pelo seu navegador',
      ar: 'تم حظر النافذة من قبل متصفحك',
      nl: 'Het venster is geblokkeerd door je browser',
      de: 'Das Fenster wurde von deinem Browser blockiert'
    },
    authErrTooManyRequests: {
      fr: 'Trop de tentatives. Réessayez plus tard.',
      en: 'Too many attempts. Try again later.',
      es: 'Demasiados intentos. Inténtalo más tarde.',
      it: 'Troppi tentativi. Riprova più tardi.',
      pt: 'Demasiadas tentativas. Tente mais tarde.',
      ar: 'محاولات كثيرة جداً. حاول لاحقاً.',
      nl: 'Te veel pogingen. Probeer het later opnieuw.',
      de: 'Zu viele Versuche. Versuche es später erneut.'
    },
    authErrUserNotFound: {
      fr: 'Aucun compte trouvé pour cette adresse',
      en: 'No account found for this address',
      es: 'No se encontró ninguna cuenta para esta dirección',
      it: 'Nessun account trovato per questo indirizzo',
      pt: 'Nenhuma conta encontrada para este endereço',
      ar: 'لم يتم العثور على حساب لهذا العنوان.',
      nl: 'Geen account gevonden voor dit adres',
      de: 'Kein Konto für diese Adresse gefunden'
    },
    authErrWeakPassword: {
      fr: 'Le mot de passe est trop faible', en: 'Password is too weak',
      es: 'La contraseña es demasiado débil', it: 'La password è troppo debole',
      pt: 'A palavra-passe é demasiado fraca', ar: 'كلمة المرور ضعيفة جداً.',
      nl: 'Het wachtwoord is te zwak', de: 'Das Passwort ist zu schwach'
    },
    authErrWrongPassword: {
      fr: 'Mot de passe incorrect', en: 'Incorrect password',
      es: 'Contraseña incorrecta', it: 'Password errata',
      pt: 'Palavra-passe incorreta', ar: 'كلمة المرور غير صحيحة.',
      nl: 'Onjuist wachtwoord', de: 'Falsches Passwort'
    },

    // ═══════════════════════════════════════════════════════════
    // FENETRE D'INSCRIPTION OBLIGATOIRE
    // ═══════════════════════════════════════════════════════════
    gateTitle: {
      fr: 'Inscription requise', en: 'Registration required',
      es: 'Registro obligatorio', it: 'Registrazione richiesta',
      pt: 'Registo obrigatório', ar: 'التسجيل مطلوب',
      nl: 'Registratie vereist', de: 'Registrierung erforderlich'
    },
    gateMessage: {
      fr: "Pour voir la suite de cet itinéraire, l'imprimer, le personnaliser et enregistrer vos futures réservations, vous devez être inscrit.",
      en: 'To view the rest of this itinerary, print it, customize it and save your future bookings, you must be registered.',
      es: 'Para ver el resto de este itinerario, imprimirlo, personalizarlo y guardar tus futuras reservas, debes estar registrado.',
      it: 'Per vedere il resto di questo itinerario, stamparlo, personalizzarlo e salvare le tue prenotazioni future, devi essere registrato.',
      pt: 'Para ver o resto deste itinerário, imprimi-lo, personalizá-lo e guardar as suas futuras reservas, tem de estar registado.',
      ar: 'لمشاهدة بقية هذا المسار وطباعته وتخصيصه وحفظ حجوزاتك المستقبلية، يجب أن تكون مسجلاً.',
      nl: 'Om de rest van deze route te bekijken, af te drukken, aan te passen en je toekomstige boekingen op te slaan, moet je geregistreerd zijn.',
      de: 'Um den Rest dieser Route zu sehen, sie zu drucken, anzupassen und deine künftigen Buchungen zu speichern, musst du registriert sein.'
    },
    gateFreeNote: {
      fr: '✓ Toutes ces fonctionnalités sont entièrement gratuites.',
      en: '✓ All these features are completely free.',
      es: '✓ Todas estas funciones son totalmente gratuitas.',
      it: '✓ Tutte queste funzionalità sono completamente gratuite.',
      pt: '✓ Todas estas funcionalidades são totalmente gratuitas.',
      ar: '✓ جميع هذه الميزات مجانية تماماً.',
      nl: '✓ Al deze functies zijn volledig gratis.',
      de: '✓ Alle diese Funktionen sind vollständig kostenlos.'
    },
    gateBtnSignup: {
      fr: 'Créer mon compte gratuit', en: 'Create my free account',
      es: 'Crear mi cuenta gratuita', it: 'Crea il mio account gratuito',
      pt: 'Criar a minha conta gratuita', ar: 'إنشاء حسابي المجاني',
      nl: 'Mijn gratis account aanmaken', de: 'Mein kostenloses Konto erstellen'
    },
    gateBtnLogin: {
      fr: "J'ai déjà un compte", en: 'I already have an account',
      es: 'Ya tengo una cuenta', it: 'Ho già un account',
      pt: 'Já tenho uma conta', ar: 'لدي حساب بالفعل',
      nl: 'Ik heb al een account', de: 'Ich habe bereits ein Konto'
    },

    // ═══════════════════════════════════════════════════════════
    // PIED DE PAGE : bandeau cookies
    // ═══════════════════════════════════════════════════════════
    cookieBannerTitle: {
      fr: 'Nous respectons votre vie privée', en: 'We respect your privacy',
      es: 'Respetamos tu privacidad', it: 'Rispettiamo la tua privacy',
      pt: 'Respeitamos a sua privacidade', ar: 'نحن نحترم خصوصيتك',
      nl: 'Wij respecteren je privacy', de: 'Wir respektieren deine Privatsphäre'
    },
    cookieBannerText: {
      fr: 'Nous utilisons des cookies pour améliorer votre expérience, analyser le trafic et personnaliser le contenu. Vous pouvez choisir les cookies que vous acceptez.',
      en: 'We use cookies to improve your experience, analyse traffic and personalise content. You can choose which cookies you accept.',
      es: 'Utilizamos cookies para mejorar tu experiencia, analizar el tráfico y personalizar el contenido. Puedes elegir las cookies que aceptas.',
      it: 'Utilizziamo i cookie per migliorare la tua esperienza, analizzare il traffico e personalizzare i contenuti. Puoi scegliere quali cookie accettare.',
      pt: 'Utilizamos cookies para melhorar a sua experiência, analisar o tráfego e personalizar o conteúdo. Pode escolher os cookies que aceita.',
      ar: 'نستخدم ملفات تعريف الارتباط لتحسين تجربتك وتحليل حركة الزيارات وتخصيص المحتوى. يمكنك اختيار ملفات تعريف الارتباط التي تقبلها.',
      nl: 'We gebruiken cookies om je ervaring te verbeteren, het verkeer te analyseren en de inhoud te personaliseren. Je kunt kiezen welke cookies je accepteert.',
      de: 'Wir verwenden Cookies, um dein Erlebnis zu verbessern, den Verkehr zu analysieren und Inhalte zu personalisieren. Du kannst wählen, welche Cookies du akzeptierst.'
    },
    cookieBannerLink: {
      fr: 'Politique de cookies', en: 'Cookie policy', es: 'Política de cookies',
      it: 'Informativa sui cookie', pt: 'Política de cookies',
      ar: 'سياسة ملفات تعريف الارتباط', nl: 'Cookiebeleid', de: 'Cookie-Richtlinie'
    },
    cookieBtnSettings: {
      fr: 'Paramétrer', en: 'Settings', es: 'Configurar', it: 'Impostazioni',
      pt: 'Definições', ar: 'الإعدادات', nl: 'Instellen', de: 'Einstellungen'
    },
    cookieBtnRejectAll: {
      fr: 'Tout refuser', en: 'Reject all', es: 'Rechazar todo',
      it: 'Rifiuta tutto', pt: 'Rejeitar tudo', ar: 'رفض الكل',
      nl: 'Alles weigeren', de: 'Alle ablehnen'
    },
    cookieBtnAcceptAll: {
      fr: 'Tout accepter', en: 'Accept all', es: 'Aceptar todo',
      it: 'Accetta tutto', pt: 'Aceitar tudo', ar: 'قبول الكل',
      nl: 'Alles accepteren', de: 'Alle akzeptieren'
    },
    cookieModalTitle: {
      fr: 'Centre de préférences de confidentialité', en: 'Privacy preference centre',
      es: 'Centro de preferencias de privacidad', it: 'Centro preferenze privacy',
      pt: 'Centro de preferências de privacidade', ar: 'مركز تفضيلات الخصوصية',
      nl: 'Privacyvoorkeurencentrum', de: 'Datenschutz-Einstellungen'
    },
    cookieModalIntro: {
      fr: "Lorsque vous visitez un site web, celui-ci peut stocker ou récupérer des informations sur votre navigateur, principalement sous forme de cookies. Ces informations peuvent concerner vous, vos préférences ou votre appareil. Elles sont principalement utilisées pour faire fonctionner le site comme vous le souhaitez. Les informations ne vous identifient généralement pas directement, mais peuvent vous offrir une expérience web plus personnalisée. Vous pouvez choisir de ne pas autoriser certains types de cookies.",
      en: 'When you visit a website, it may store or retrieve information in your browser, mostly in the form of cookies. This information may concern you, your preferences or your device. It is mainly used to make the site work as you expect. It usually does not identify you directly, but it can give you a more personalised web experience. You can choose not to allow certain types of cookies.',
      es: 'Cuando visitas un sitio web, este puede almacenar o recuperar información en tu navegador, principalmente en forma de cookies. Esta información puede referirse a ti, a tus preferencias o a tu dispositivo. Se utiliza sobre todo para que el sitio funcione como esperas. Normalmente no te identifica directamente, pero puede ofrecerte una experiencia web más personalizada. Puedes elegir no permitir ciertos tipos de cookies.',
      it: 'Quando visiti un sito web, questo può memorizzare o recuperare informazioni nel tuo browser, principalmente sotto forma di cookie. Queste informazioni possono riguardare te, le tue preferenze o il tuo dispositivo. Servono soprattutto a far funzionare il sito come ti aspetti. Di solito non ti identificano direttamente, ma possono offrirti un\'esperienza web più personalizzata. Puoi scegliere di non consentire alcuni tipi di cookie.',
      pt: 'Quando visita um site, este pode armazenar ou obter informações no seu navegador, sobretudo sob a forma de cookies. Estas informações podem dizer respeito a si, às suas preferências ou ao seu dispositivo. São usadas principalmente para que o site funcione como espera. Normalmente não o identificam diretamente, mas podem oferecer uma experiência web mais personalizada. Pode optar por não permitir certos tipos de cookies.',
      ar: 'عند زيارتك لموقع إلكتروني، قد يقوم بتخزين أو استرجاع معلومات في متصفحك، غالباً على شكل ملفات تعريف ارتباط. قد تتعلق هذه المعلومات بك أو بتفضيلاتك أو بجهازك. تُستخدم أساساً لجعل الموقع يعمل كما تتوقع. وهي عادة لا تعرّفك مباشرة، لكنها قد تمنحك تجربة أكثر تخصيصاً. يمكنك اختيار عدم السماح ببعض أنواع ملفات تعريف الارتباط.',
      nl: 'Wanneer je een website bezoekt, kan deze informatie opslaan of ophalen in je browser, meestal in de vorm van cookies. Die informatie kan over jou, je voorkeuren of je apparaat gaan. Ze wordt vooral gebruikt om de site te laten werken zoals je verwacht. Meestal identificeert ze je niet rechtstreeks, maar ze kan je een persoonlijkere webervaring geven. Je kunt ervoor kiezen bepaalde soorten cookies niet toe te staan.',
      de: 'Wenn du eine Website besuchst, kann sie Informationen in deinem Browser speichern oder abrufen, meist in Form von Cookies. Diese Informationen können dich, deine Einstellungen oder dein Gerät betreffen. Sie dienen vor allem dazu, die Website wie erwartet funktionieren zu lassen. In der Regel identifizieren sie dich nicht direkt, können dir aber ein persönlicheres Web-Erlebnis bieten. Du kannst bestimmte Arten von Cookies ablehnen.'
    },
    cookieBtnMoreInfo: {
      fr: "Plus d'informations", en: 'More information', es: 'Más información',
      it: 'Maggiori informazioni', pt: 'Mais informações', ar: 'مزيد من المعلومات',
      nl: 'Meer informatie', de: 'Weitere Informationen'
    },
    cookieBtnConfirm: {
      fr: 'Confirmer mes choix', en: 'Confirm my choices', es: 'Confirmar mis opciones',
      it: 'Conferma le mie scelte', pt: 'Confirmar as minhas escolhas',
      ar: 'تأكيد اختياراتي', nl: 'Mijn keuzes bevestigen', de: 'Meine Auswahl bestätigen'
    },
    cookieCatNecessary: {
      fr: 'Cookies strictement nécessaires', en: 'Strictly necessary cookies',
      es: 'Cookies estrictamente necesarias', it: 'Cookie strettamente necessari',
      pt: 'Cookies estritamente necessários', ar: 'ملفات تعريف الارتباط الضرورية',
      nl: 'Strikt noodzakelijke cookies', de: 'Unbedingt erforderliche Cookies'
    },
    cookieCatNecessaryDesc: {
      fr: "Ces cookies sont essentiels au fonctionnement du site. Ils permettent la navigation, la connexion sécurisée et les fonctionnalités de base. Sans ces cookies, le site ne peut pas fonctionner correctement.",
      en: 'These cookies are essential for the site to work. They enable navigation, secure sign-in and basic features. Without them the site cannot work properly.',
      es: 'Estas cookies son esenciales para el funcionamiento del sitio. Permiten la navegación, el inicio de sesión seguro y las funciones básicas. Sin ellas el sitio no puede funcionar correctamente.',
      it: 'Questi cookie sono essenziali per il funzionamento del sito. Consentono la navigazione, l\'accesso sicuro e le funzioni di base. Senza di essi il sito non può funzionare correttamente.',
      pt: 'Estes cookies são essenciais para o funcionamento do site. Permitem a navegação, o início de sessão seguro e as funcionalidades básicas. Sem eles o site não funciona corretamente.',
      ar: 'ملفات تعريف الارتباط هذه ضرورية لعمل الموقع. فهي تتيح التصفح وتسجيل الدخول الآمن والوظائف الأساسية. بدونها لا يمكن للموقع أن يعمل بشكل صحيح.',
      nl: 'Deze cookies zijn essentieel voor de werking van de site. Ze maken navigatie, veilig inloggen en basisfuncties mogelijk. Zonder deze cookies werkt de site niet goed.',
      de: 'Diese Cookies sind für den Betrieb der Website unerlässlich. Sie ermöglichen die Navigation, die sichere Anmeldung und die Grundfunktionen. Ohne sie kann die Website nicht richtig funktionieren.'
    },
    cookieCatNecessaryAlways: {
      fr: 'Toujours actif', en: 'Always active', es: 'Siempre activo',
      it: 'Sempre attivo', pt: 'Sempre ativo', ar: 'مفعّل دائماً',
      nl: 'Altijd actief', de: 'Immer aktiv'
    },
    cookieCatAnalytics: {
      fr: 'Cookies analytiques', en: 'Analytics cookies', es: 'Cookies analíticas',
      it: 'Cookie analitici', pt: 'Cookies analíticos', ar: 'ملفات تعريف الارتباط التحليلية',
      nl: 'Analytische cookies', de: 'Analyse-Cookies'
    },
    cookieCatAnalyticsDesc: {
      fr: "Ces cookies nous permettent de mesurer l'audience et de comprendre comment le site est utilisé, afin de l'améliorer. Les données sont agrégées et anonymes.",
      en: 'These cookies let us measure our audience and understand how the site is used so we can improve it. The data is aggregated and anonymous.',
      es: 'Estas cookies nos permiten medir la audiencia y entender cómo se usa el sitio para mejorarlo. Los datos son agregados y anónimos.',
      it: 'Questi cookie ci permettono di misurare il pubblico e capire come viene usato il sito per migliorarlo. I dati sono aggregati e anonimi.',
      pt: 'Estes cookies permitem-nos medir a audiência e perceber como o site é utilizado, para o melhorar. Os dados são agregados e anónimos.',
      ar: 'تتيح لنا ملفات تعريف الارتباط هذه قياس الجمهور وفهم كيفية استخدام الموقع من أجل تحسينه. البيانات مجمّعة ومجهولة الهوية.',
      nl: 'Met deze cookies meten we het bereik en begrijpen we hoe de site wordt gebruikt, zodat we die kunnen verbeteren. De gegevens zijn geaggregeerd en anoniem.',
      de: 'Mit diesen Cookies messen wir die Reichweite und verstehen, wie die Website genutzt wird, um sie zu verbessern. Die Daten sind aggregiert und anonym.'
    },
    cookieCatAnalyticsCookies: {
      fr: 'Google Analytics', en: 'Google Analytics', es: 'Google Analytics',
      it: 'Google Analytics', pt: 'Google Analytics', ar: 'Google Analytics',
      nl: 'Google Analytics', de: 'Google Analytics'
    },
    cookieCatMarketing: {
      fr: 'Cookies marketing', en: 'Marketing cookies', es: 'Cookies de marketing',
      it: 'Cookie di marketing', pt: 'Cookies de marketing', ar: 'ملفات تعريف الارتباط التسويقية',
      nl: 'Marketingcookies', de: 'Marketing-Cookies'
    },
    cookieCatMarketingDesc: {
      fr: "Ces cookies servent à mesurer l'efficacité de nos liens partenaires et à vous proposer des offres pertinentes. Ils peuvent être déposés par nos partenaires de réservation.",
      en: 'These cookies measure how well our partner links perform and help us show you relevant offers. They may be set by our booking partners.',
      es: 'Estas cookies miden la eficacia de nuestros enlaces de socios y nos ayudan a mostrarte ofertas relevantes. Pueden ser instaladas por nuestros socios de reservas.',
      it: 'Questi cookie misurano l\'efficacia dei nostri link partner e ci aiutano a proporti offerte pertinenti. Possono essere depositati dai nostri partner di prenotazione.',
      pt: 'Estes cookies medem a eficácia dos nossos links de parceiros e ajudam-nos a mostrar ofertas relevantes. Podem ser colocados pelos nossos parceiros de reservas.',
      ar: 'تُستخدم ملفات تعريف الارتباط هذه لقياس فعالية روابط شركائنا واقتراح عروض مناسبة لك. وقد يضعها شركاء الحجز لدينا.',
      nl: 'Deze cookies meten hoe goed onze partnerlinks presteren en helpen ons relevante aanbiedingen te tonen. Ze kunnen door onze boekingspartners worden geplaatst.',
      de: 'Diese Cookies messen die Wirksamkeit unserer Partnerlinks und helfen uns, dir passende Angebote zu zeigen. Sie können von unseren Buchungspartnern gesetzt werden.'
    },
    cookieCatMarketingCookies: {
      fr: 'Partenaires de réservation', en: 'Booking partners',
      es: 'Socios de reservas', it: 'Partner di prenotazione',
      pt: 'Parceiros de reservas', ar: 'شركاء الحجز',
      nl: 'Boekingspartners', de: 'Buchungspartner'
    },

    // ═══════════════════════════════════════════════════════════
    // PIED DE PAGE : liens
    // ═══════════════════════════════════════════════════════════
    footLegalNotice: {
      fr: 'Mentions légales', en: 'Legal notice', es: 'Aviso legal',
      it: 'Note legali', pt: 'Aviso legal', ar: 'إشعار قانوني',
      nl: 'Juridische informatie', de: 'Impressum'
    },
    footPrivacyPolicy: {
      fr: 'Politique de confidentialité', en: 'Privacy policy',
      es: 'Política de privacidad', it: 'Informativa sulla privacy',
      pt: 'Política de privacidade', ar: 'سياسة الخصوصية',
      nl: 'Privacybeleid', de: 'Datenschutzerklärung'
    },
    footCookiePolicy: {
      fr: 'Politique de cookies', en: 'Cookie policy', es: 'Política de cookies',
      it: 'Informativa sui cookie', pt: 'Política de cookies',
      ar: 'سياسة ملفات تعريف الارتباط', nl: 'Cookiebeleid', de: 'Cookie-Richtlinie'
    },
    footAbout: {
      fr: 'À propos', en: 'About', es: 'Acerca de', it: 'Chi siamo',
      pt: 'Sobre', ar: 'من نحن', nl: 'Over ons', de: 'Über uns'
    },
    footBlog: {
      fr: 'Blog', en: 'Blog', es: 'Blog', it: 'Blog',
      pt: 'Blog', ar: 'المدونة', nl: 'Blog', de: 'Blog'
    },
    footContact: {
      fr: 'Contact', en: 'Contact', es: 'Contacto', it: 'Contatti',
      pt: 'Contacto', ar: 'اتصل بنا', nl: 'Contact', de: 'Kontakt'
    },
    footManageCookies: {
      fr: 'Gérer les cookies', en: 'Manage cookies', es: 'Gestionar cookies',
      it: 'Gestisci i cookie', pt: 'Gerir cookies', ar: 'إدارة ملفات تعريف الارتباط',
      nl: 'Cookies beheren', de: 'Cookies verwalten'
    },
    footPressPartner: {
      fr: 'Presse & Partenaires', en: 'Press & Partners',
      es: 'Prensa y socios', it: 'Stampa e partner',
      pt: 'Imprensa e parceiros', ar: 'الصحافة والشركاء',
      nl: 'Pers & partners', de: 'Presse & Partner'
    },
    footPressRoom: {
      fr: 'Espace presse', en: 'Press room', es: 'Sala de prensa',
      it: 'Sala stampa', pt: 'Sala de imprensa', ar: 'غرفة الصحافة',
      nl: 'Perskamer', de: 'Pressebereich'
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // NOMS DE LANGUES (toujours ecrits dans leur propre langue)
  // ═══════════════════════════════════════════════════════════════
  var LANG_NAMES = {
    fr: 'Français', en: 'English', es: 'Español', it: 'Italiano',
    pt: 'Português', ar: 'العربية', nl: 'Nederlands', de: 'Deutsch'
  };

  // ═══════════════════════════════════════════════════════════════
  // FUSION dans le dictionnaire central
  // ═══════════════════════════════════════════════════════════════
  window.ORT_I18N = window.ORT_I18N || {};
  Object.keys(S).forEach(function (k) { window.ORT_I18N[k] = S[k]; });

  window.ORT_LANGS = LANGS;
  window.ORT_RTL_LANGS = RTL;
  window.ORT_LANG_NAMES = LANG_NAMES;

  // ═══════════════════════════════════════════════════════════════
  // COMPATIBILITE : on reconstruit les anciens objets
  // pour que ort-header.js et ort-footer.js continuent de marcher
  // ═══════════════════════════════════════════════════════════════
  function byLang(map) {
    // map = { ancienneCle: 'nouvelleCle', ... }  ->  { fr:{...}, en:{...} }
    var out = {};
    LANGS.forEach(function (l) {
      out[l] = {};
      Object.keys(map).forEach(function (oldKey) {
        var entry = S[map[oldKey]];
        out[l][oldKey] = (entry && (entry[l] || entry.fr)) || '';
      });
      out[l].langNames = LANG_NAMES;
    });
    return out;
  }

  var AUTH_MAP = {
    login: 'authLogin', logout: 'authLogout', email: 'authEmail',
    password: 'authPassword', confirmPassword: 'authConfirmPassword',
    loginTitle: 'authLoginTitle', signupTitle: 'authSignupTitle',
    resetTitle: 'authResetTitle', cancel: 'authCancel', validate: 'authValidate',
    create: 'authCreate', sendResetLink: 'authSendResetLink',
    forgotPassword: 'authForgotPassword', noAccountYet: 'authNoAccountYet',
    alreadyHaveAccount: 'authAlreadyHaveAccount', acceptCgu: 'authAcceptCgu',
    cguLink: 'authCguLink', msgLoginSuccess: 'authMsgLoginSuccess',
    msgEmailNotVerified: 'authMsgEmailNotVerified',
    msgResendVerification: 'authMsgResendVerification',
    msgResetSent: 'authMsgResetSent', msgVerificationSent: 'authMsgVerificationSent',
    msgVerificationResent: 'authMsgVerificationResent',
    errAcceptCgu: 'authErrAcceptCgu', errEmailInUse: 'authErrEmailInUse',
    errFillFields: 'authErrFillFields', errGeneric: 'authErrGeneric',
    errInvalidEmail: 'authErrInvalidEmail', errNetworkError: 'authErrNetworkError',
    errPasswordMismatch: 'authErrPasswordMismatch',
    errPasswordTooShort: 'authErrPasswordTooShort',
    errPopupBlocked: 'authErrPopupBlocked', errTooManyRequests: 'authErrTooManyRequests',
    errUserNotFound: 'authErrUserNotFound', errWeakPassword: 'authErrWeakPassword',
    errWrongPassword: 'authErrWrongPassword'
  };

  var GATE_MAP = {
    title: 'gateTitle', message: 'gateMessage', freeNote: 'gateFreeNote',
    btnSignup: 'gateBtnSignup', btnLogin: 'gateBtnLogin'
  };

  var COOKIE_MAP = {
    bannerTitle: 'cookieBannerTitle', bannerText: 'cookieBannerText',
    bannerLink: 'cookieBannerLink', btnSettings: 'cookieBtnSettings',
    btnRejectAll: 'cookieBtnRejectAll', btnAcceptAll: 'cookieBtnAcceptAll',
    modalTitle: 'cookieModalTitle', modalIntro: 'cookieModalIntro',
    btnMoreInfo: 'cookieBtnMoreInfo', btnConfirm: 'cookieBtnConfirm',
    catNecessary: 'cookieCatNecessary', catNecessaryDesc: 'cookieCatNecessaryDesc',
    catNecessaryAlways: 'cookieCatNecessaryAlways',
    catAnalytics: 'cookieCatAnalytics', catAnalyticsDesc: 'cookieCatAnalyticsDesc',
    catAnalyticsCookies: 'cookieCatAnalyticsCookies',
    catMarketing: 'cookieCatMarketing', catMarketingDesc: 'cookieCatMarketingDesc',
    catMarketingCookies: 'cookieCatMarketingCookies',
    legalNotice: 'footLegalNotice', privacyPolicy: 'footPrivacyPolicy',
    cookiePolicy: 'footCookiePolicy', about: 'footAbout', blog: 'footBlog',
    contact: 'footContact', manageCookies: 'footManageCookies',
    pressPartner: 'footPressPartner', pressRoom: 'footPressRoom'
  };

  var authByLang = byLang(AUTH_MAP);
  window.ORT_I18N_AUTH = authByLang;
  window.ORT_I18N_AUTH.get = function (lang) { return authByLang[lang] || authByLang.fr; };

  window.ORT_AUTH_I18N = byLang(GATE_MAP);
  window.ORT_COOKIE_I18N = byLang(COOKIE_MAP);

  console.log('[ORT-I18N-SOCLE] ✅ ' + Object.keys(S).length + ' clés, ' + LANGS.length + ' langues');
})();
