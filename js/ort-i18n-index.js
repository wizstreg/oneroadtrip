/**
 * ort-i18n-index.js - TEXTES DE LA PAGE D ACCUEIL
 * ================================================
 * Sortis de index.html. Format : une cle, puis les langues.
 * 8 langues : fr, en, es, it, pt, ar, nl, de
 *
 * Pour ajouter une langue : ajouter son code dans LANGS ci-dessous,
 * puis remplir la ligne correspondante dans chaque cle.
 *
 * A charger AVANT le script principal de index.html.
 * Expose window.ORT_I18N_INDEX.
 */
(function () {
  "use strict";

  var LANGS = ["fr","en","es","it","pt","ar","nl","de"];

  // Nom du dossier dans les adresses du site.
  // NE JAMAIS MODIFIER une valeur existante : toutes les URL en dependent.
  var LANG_FOLDERS = {
    "fr": "itineraires",
    "en": "itineraries",
    "es": "rutas",
    "it": "itinerari",
    "pt": "roteiros",
    "ar": "masar",
    "nl": "routes",
    "de": "routen"
  };
  var LILIA_FOLDERS = {
    "fr": "itineraires",
    "en": "itineraries",
    "es": "rutas",
    "it": "itinerari",
    "pt": "roteiros",
    "ar": "masar",
    "nl": "routes",
    "de": "routen"
  };

  // Titre de la liste d itineraires
  var LH = {
    "fr": "Itinéraires proposés",
    "en": "Suggested itineraries",
    "es": "Rutas propuestas",
    "it": "Itinerari proposti",
    "pt": "Roteiros propostos",
    "ar": "المسارات المقترحة",
    "nl": "Voorgestelde routes",
    "de": "Vorgeschlagene Routen"
  };

  // Textes principaux (ancien LANG_META)
  var META_KEYS = {
    "flag": {
      "fr": "🇫🇷",
      "en": "🇬🇧",
      "es": "🇪🇸",
      "it": "🇮🇹",
      "pt": "🇵🇹",
      "ar": "🇸🇦",
      "nl": "🇳🇱",
      "de": "🇩🇪"
    },
    "name": {
      "fr": "Français",
      "en": "English",
      "es": "Español",
      "it": "Italiano",
      "pt": "Português",
      "ar": "العربية",
      "nl": "Nederlands",
      "de": "Deutsch"
    },
    "heroTitle": {
      "fr": "Tous les itinéraires",
      "en": "All itineraries",
      "es": "Todas las rutas",
      "it": "Tutti gli itinerari",
      "pt": "Todos os roteiros",
      "ar": "جميع المسارات",
      "nl": "Alle routes",
      "de": "Alle Routen"
    },
    "heroSub": {
      "fr": "Consultez, modifiez, complétez, partagez nos itinéraires ou créez le vôtre de toutes pièces. Importez vos réservations, éditez votre carnet de voyage et consultez votre voyage hors ligne.",
      "en": "Browse, edit, complete, share our itineraries or create your own from scratch. Import your bookings, edit your travel journal and access your trip offline.",
      "es": "Consulta, modifica, completa, comparte nuestras rutas o crea la tuya desde cero.",
      "it": "Consulta, modifica, completa, condividi i nostri itinerari o creane uno da zero.",
      "pt": "Consulte, modifique, complete, partilhe os nossos roteiros ou crie o seu de raiz.",
      "ar": "تصفح وعدّل وشارك مساراتنا أو أنشئ مسارك الخاص.",
      "nl": "Bekijk, bewerk, vul aan en deel onze routes of maak er zelf een van nul af aan. Importeer je boekingen, werk je reisdagboek bij en bekijk je reis offline.",
      "de": "Durchstöbere, bearbeite, ergänze und teile unsere Routen oder erstelle deine eigene von Grund auf. Importiere deine Buchungen, pflege dein Reisetagebuch und sieh dir deine Reise offline an."
    },
    "homeLink": {
      "fr": "Retour à l’accueil",
      "en": "Back to home",
      "es": "Volver al inicio",
      "it": "Torna alla home",
      "pt": "Voltar ao início",
      "ar": "العودة",
      "nl": "Terug naar de startpagina",
      "de": "Zurück zur Startseite"
    },
    "searchPh": {
      "fr": "Rechercher un itinéraire...",
      "en": "Search an itinerary...",
      "es": "Buscar una ruta...",
      "it": "Cerca un itinerario...",
      "pt": "Pesquisar um roteiro...",
      "ar": "ابحث عن مسار...",
      "nl": "Zoek een route...",
      "de": "Route suchen..."
    },
    "allCountries": {
      "fr": "Tous les pays",
      "en": "All countries",
      "es": "Todos los países",
      "it": "Tutti i paesi",
      "pt": "Todos os países",
      "ar": "كل الدول",
      "nl": "Alle landen",
      "de": "Alle Länder"
    },
    "allThemes": {
      "fr": "Tous les thèmes",
      "en": "All themes",
      "es": "Todos los temas",
      "it": "Tutti i temi",
      "pt": "Todos os temas",
      "ar": "كل المواضيع",
      "nl": "Alle thema's",
      "de": "Alle Themen"
    },
    "loading": {
      "fr": "Chargement des itinéraires...",
      "en": "Loading itineraries...",
      "es": "Cargando rutas...",
      "it": "Caricamento itinerari...",
      "pt": "A carregar roteiros...",
      "ar": "جارٍ تحميل المسارات...",
      "nl": "Routes laden...",
      "de": "Routen werden geladen..."
    },
    "results": {
      "fr": " résultats sur ",
      "en": " results out of ",
      "es": " resultados de ",
      "it": " risultati su ",
      "pt": " resultados em ",
      "ar": " نتيجة من ",
      "nl": " resultaten van ",
      "de": " Ergebnisse von "
    },
    "days": {
      "fr": "Jours",
      "en": "Days",
      "es": "Días",
      "it": "Giorni",
      "pt": "Dias",
      "ar": "أيام",
      "nl": "Dagen",
      "de": "Tage"
    },
    "km": {
      "fr": "Km",
      "en": "Km",
      "es": "Km",
      "it": "Km",
      "pt": "Km",
      "ar": "كم",
      "nl": "Km",
      "de": "Km"
    },
    "stops": {
      "fr": "Étapes",
      "en": "Stops",
      "es": "Paradas",
      "it": "Tappe",
      "pt": "Paragens",
      "ar": "محطات",
      "nl": "Stops",
      "de": "Etappen"
    },
    "itins": {
      "fr": "itinéraires",
      "en": "itineraries",
      "es": "rutas",
      "it": "itinerari",
      "pt": "roteiros",
      "ar": "مسار",
      "nl": "routes",
      "de": "Routen"
    },
    "countries": {
      "fr": "pays",
      "en": "countries",
      "es": "países",
      "it": "paesi",
      "pt": "países",
      "ar": "دولة",
      "nl": "landen",
      "de": "Länder"
    },
    "placesLabel": {
      "fr": "lieux",
      "en": "places",
      "es": "lugares",
      "it": "luoghi",
      "pt": "lugares",
      "ar": "أماكن",
      "nl": "plaatsen",
      "de": "Orte"
    },
    "visitsLabel": {
      "fr": "visites",
      "en": "visits",
      "es": "visitas",
      "it": "visite",
      "pt": "visitas",
      "ar": "زيارات",
      "nl": "bezienswaardigheden",
      "de": "Sehenswürdigkeiten"
    },
    "activitiesLabel": {
      "fr": "activités",
      "en": "activities",
      "es": "actividades",
      "it": "attività",
      "pt": "atividades",
      "ar": "أنشطة",
      "nl": "activiteiten",
      "de": "Aktivitäten"
    },
    "rbTitle": {
      "fr": "🚀 Laissez-nous construire votre itinéraire",
      "en": "🚀 Let us build your itinerary",
      "es": "🚀 Déjenos construir su ruta",
      "it": "🚀 Lascia che costruiamo il tuo itinerario",
      "pt": "🚀 Deixe-nos construir o seu roteiro",
      "ar": "🚀 دعنا نبني مسارك",
      "nl": "🚀 Laat ons je route samenstellen",
      "de": "🚀 Lass uns deine Route erstellen"
    },
    "startCity": {
      "fr": "Ville de départ",
      "en": "Departure city",
      "es": "Ciudad de salida",
      "it": "Città di partenza",
      "pt": "Cidade de partida",
      "ar": "مدينة الانطلاق",
      "nl": "Vertrekstad",
      "de": "Startstadt"
    },
    "endCity": {
      "fr": "Ville d’arrivée",
      "en": "Arrival city",
      "es": "Ciudad de llegada",
      "it": "Città di arrivo",
      "pt": "Cidade de chegada",
      "ar": "مدينة الوصول",
      "nl": "Aankomststad",
      "de": "Zielstadt"
    },
    "duration": {
      "fr": "Durée",
      "en": "Duration",
      "es": "Duración",
      "it": "Durata",
      "pt": "Duração",
      "ar": "المدة",
      "nl": "Duur",
      "de": "Dauer"
    },
    "maxKmLabel": {
      "fr": "Km/jour max",
      "en": "Km/day max",
      "es": "Km/día máx",
      "it": "Km/giorno max",
      "pt": "Km/dia máx",
      "nl": "Km/dag max",
      "de": "Km/Tag max"
    },
    "detour": {
      "fr": "Détour (km)",
      "en": "Detour (km)",
      "es": "Desvío (km)",
      "it": "Deviazione (km)",
      "pt": "Desvio (km)",
      "ar": "انحراف (كم)",
      "nl": "Omweg (km)",
      "de": "Umweg (km)"
    },
    "loop": {
      "fr": "Circuit (retour au départ)",
      "en": "Round trip (return to start)",
      "es": "Circuito (vuelta al inicio)",
      "it": "Circuito (ritorno alla partenza)",
      "pt": "Circuito (regresso ao início)",
      "ar": "دائري (العودة)",
      "nl": "Rondreis (terug naar start)",
      "de": "Rundreise (zurück zum Start)"
    },
    "generate": {
      "fr": "🚀 Générer",
      "en": "🚀 Generate",
      "es": "🚀 Generar",
      "it": "🚀 Genera",
      "pt": "🚀 Gerar",
      "ar": "🚀 إنشاء",
      "nl": "🚀 Genereren",
      "de": "🚀 Erstellen"
    },
    "sortCountry": {
      "fr": "Tri par pays",
      "en": "Sort by country",
      "es": "Ordenar por país",
      "it": "Ordina per paese",
      "pt": "Ordenar por país",
      "ar": "ترتيب حسب الدولة",
      "nl": "Sorteren op land",
      "de": "Nach Land sortieren"
    },
    "sortRecent": {
      "fr": "Plus récents",
      "en": "Most recent",
      "es": "Más recientes",
      "it": "Più recenti",
      "pt": "Mais recentes",
      "ar": "الأحدث",
      "nl": "Meest recent",
      "de": "Neueste zuerst"
    },
    "sortDaysAsc": {
      "fr": "Durée ↑",
      "en": "Duration ↑",
      "es": "Duración ↑",
      "it": "Durata ↑",
      "pt": "Duração ↑",
      "ar": "المدة ↑",
      "nl": "Duur ↑",
      "de": "Dauer ↑"
    },
    "sortDaysDesc": {
      "fr": "Durée ↓",
      "en": "Duration ↓",
      "es": "Duración ↓",
      "it": "Durata ↓",
      "pt": "Duração ↓",
      "ar": "المدة ↓",
      "nl": "Duur ↓",
      "de": "Dauer ↓"
    },
    "tripsBtn": {
      "fr": "Vos voyages",
      "en": "Your trips",
      "es": "Tus viajes",
      "it": "I tuoi viaggi",
      "pt": "As tuas viagens",
      "ar": "رحلاتك",
      "nl": "Jouw reizen",
      "de": "Deine Reisen"
    },
    "contactBtn": {
      "fr": "Nous contacter",
      "en": "Contact us",
      "es": "Contáctenos",
      "it": "Contattaci",
      "pt": "Fale conosco",
      "ar": "تواصل معنا",
      "nl": "Neem contact op",
      "de": "Kontakt aufnehmen"
    },
    "contactTitle": {
      "fr": "Nous contacter",
      "en": "Contact Us",
      "es": "Contáctenos",
      "it": "Contattaci",
      "pt": "Fale Conosco",
      "ar": "تواصل معنا",
      "nl": "Neem contact op",
      "de": "Kontakt aufnehmen"
    },
    "contactDesc": {
      "fr": "Une question ou un problème ? Écrivez-nous.",
      "en": "Have a question or issue? Write to us.",
      "es": "¿Tiene una pregunta? Escríbanos.",
      "it": "Hai una domanda? Scrivici.",
      "pt": "Tem uma pergunta? Escreva-nos.",
      "ar": "هل لديك سؤال؟ اكتب لنا.",
      "nl": "Een vraag of een probleem? Schrijf ons.",
      "de": "Eine Frage oder ein Problem? Schreib uns."
    },
    "contactName": {
      "fr": "Votre nom",
      "en": "Your name",
      "es": "Su nombre",
      "it": "Il tuo nome",
      "pt": "Seu nome",
      "ar": "اسمك",
      "nl": "Je naam",
      "de": "Dein Name"
    },
    "contactEmail": {
      "fr": "Votre email",
      "en": "Your email",
      "es": "Su correo",
      "it": "La tua email",
      "pt": "Seu email",
      "ar": "بريدك",
      "nl": "Je e-mailadres",
      "de": "Deine E-Mail"
    },
    "contactSubject": {
      "fr": "Sujet",
      "en": "Subject",
      "es": "Asunto",
      "it": "Oggetto",
      "pt": "Assunto",
      "ar": "الموضوع",
      "nl": "Onderwerp",
      "de": "Betreff"
    },
    "contactMessage": {
      "fr": "Message",
      "en": "Message",
      "es": "Mensaje",
      "it": "Messaggio",
      "pt": "Mensagem",
      "ar": "الرسالة",
      "nl": "Bericht",
      "de": "Nachricht"
    },
    "contactSend": {
      "fr": "Envoyer",
      "en": "Send",
      "es": "Enviar",
      "it": "Invia",
      "pt": "Enviar",
      "ar": "إرسال",
      "nl": "Versturen",
      "de": "Senden"
    },
    "contactSuccess": {
      "fr": "Message envoyé !",
      "en": "Message sent!",
      "es": "¡Mensaje enviado!",
      "it": "Messaggio inviato!",
      "pt": "Mensagem enviada!",
      "ar": "تم الإرسال!",
      "nl": "Bericht verstuurd!",
      "de": "Nachricht gesendet!"
    },
    "contactError": {
      "fr": "Erreur d'envoi",
      "en": "Send error",
      "es": "Error de envío",
      "it": "Errore di invio",
      "pt": "Erro de envio",
      "ar": "خطأ",
      "nl": "Fout bij verzenden",
      "de": "Fehler beim Senden"
    },
    "latestTitle": {
      "fr": "Derniers itinéraires ajoutés",
      "en": "Latest itineraries added",
      "es": "Últimas rutas añadidas",
      "it": "Ultimi itinerari aggiunti",
      "pt": "Últimos roteiros adicionados",
      "ar": "أحدث المسارات",
      "nl": "Laatst toegevoegde routes",
      "de": "Zuletzt hinzugefügte Routen"
    },
    "allDurations": {
      "fr": "Durée du voyage",
      "en": "Trip duration",
      "es": "Duración del viaje",
      "it": "Durata del viaggio",
      "pt": "Duração da viagem",
      "ar": "مدة الرحلة",
      "nl": "Reisduur",
      "de": "Reisedauer"
    },
    "durWeekend": {
      "fr": "Week-end (1-3j)",
      "en": "Weekend (1-3d)",
      "es": "Fin de semana (1-3d)",
      "it": "Weekend (1-3g)",
      "pt": "Fim de semana (1-3d)",
      "ar": "عطلة نهاية الأسبوع (1-3 أيام)",
      "nl": "Weekend (1-3d)",
      "de": "Wochenende (1-3 T.)"
    },
    "durShort": {
      "fr": "Court séjour (4-7j)",
      "en": "Short stay (4-7d)",
      "es": "Estancia corta (4-7d)",
      "it": "Soggiorno breve (4-7g)",
      "pt": "Estadia curta (4-7d)",
      "ar": "إقامة قصيرة (4-7 أيام)",
      "nl": "Kort verblijf (4-7d)",
      "de": "Kurzreise (4-7 T.)"
    },
    "durMedium": {
      "fr": "Séjour moyen (8-14j)",
      "en": "Medium trip (8-14d)",
      "es": "Viaje medio (8-14d)",
      "it": "Viaggio medio (8-14g)",
      "pt": "Viagem média (8-14d)",
      "ar": "رحلة متوسطة (8-14 يوم)",
      "nl": "Middellange reis (8-14d)",
      "de": "Mittlere Reise (8-14 T.)"
    },
    "durLong": {
      "fr": "Grand voyage (15-21j)",
      "en": "Long trip (15-21d)",
      "es": "Gran viaje (15-21d)",
      "it": "Grande viaggio (15-21g)",
      "pt": "Grande viagem (15-21d)",
      "ar": "رحلة طويلة (15-21 يوم)",
      "nl": "Lange reis (15-21d)",
      "de": "Große Reise (15-21 T.)"
    },
    "durEpic": {
      "fr": "Périple (22j+)",
      "en": "Grand journey (22d+)",
      "es": "Travesía (22d+)",
      "it": "Peripezia (22g+)",
      "pt": "Jornada (22d+)",
      "ar": "رحلة كبرى (22+ يوم)",
      "nl": "Grote tocht (22d+)",
      "de": "Weltreise (22 T.+)"
    },
    "actionCards": {
      "fr": [
        {
          "icon": "🗺️",
          "label": "Choisir un itinéraire sur la carte",
          "href": "pres_simple.html"
        },
        {
          "icon": "🛠️",
          "label": "Construisez votre chemin à partir des lieux",
          "href": "carte_builder.html?mode=expert"
        }
      ],
      "en": [
        {
          "icon": "🗺️",
          "label": "Choose an itinerary on the map",
          "href": "pres_simple.html"
        },
        {
          "icon": "🛠️",
          "label": "Build your path from listed places",
          "href": "carte_builder.html?mode=expert"
        }
      ],
      "es": [
        {
          "icon": "🗺️",
          "label": "Elegir una ruta en el mapa",
          "href": "pres_simple.html"
        },
        {
          "icon": "🛠️",
          "label": "Construye tu camino desde los lugares",
          "href": "carte_builder.html?mode=expert"
        }
      ],
      "it": [
        {
          "icon": "🗺️",
          "label": "Scegli un itinerario sulla mappa",
          "href": "pres_simple.html"
        },
        {
          "icon": "🛠️",
          "label": "Costruisci il tuo percorso dai luoghi",
          "href": "carte_builder.html?mode=expert"
        }
      ],
      "pt": [
        {
          "icon": "🗺️",
          "label": "Escolher um roteiro no mapa",
          "href": "pres_simple.html"
        },
        {
          "icon": "🛠️",
          "label": "Construa o seu caminho a partir dos lugares",
          "href": "carte_builder.html?mode=expert"
        }
      ],
      "ar": [
        {
          "icon": "🗺️",
          "label": "اختر مسارًا على الخريطة",
          "href": "pres_simple.html"
        },
        {
          "icon": "🛠️",
          "label": "ابنِ مسارك من الأماكن",
          "href": "carte_builder.html?mode=expert"
        }
      ],
      "nl": [
        {
          "icon": "🗺️",
          "label": "Kies een route op de kaart",
          "href": "pres_simple.html"
        },
        {
          "icon": "🛠️",
          "label": "Stel je route samen uit de plaatsen",
          "href": "carte_builder.html?mode=expert"
        }
      ],
      "de": [
        {
          "icon": "🗺️",
          "label": "Route auf der Karte auswählen",
          "href": "pres_simple.html"
        },
        {
          "icon": "🛠️",
          "label": "Stelle deine Strecke aus den Orten zusammen",
          "href": "carte_builder.html?mode=expert"
        }
      ]
    }
  };

  // Textes de la refonte (ancien LANG_EXTRA)
  var EXTRA_KEYS = {
    "noResultsTitle": {
      "fr": "Aucun itinéraire ne correspond à ces critères.",
      "en": "No itinerary matches these criteria.",
      "es": "Ninguna ruta coincide con estos criterios.",
      "it": "Nessun itinerario corrisponde a questi criteri.",
      "pt": "Nenhum roteiro corresponde a estes critérios.",
      "ar": "لا يوجد مسار يطابق هذه المعايير.",
      "nl": "Geen enkele route voldoet aan deze criteria.",
      "de": "Keine Route entspricht diesen Kriterien."
    },
    "noResultsText": {
      "fr": "Essayez d'élargir votre recherche : retirez un filtre ou changez de zone, de durée ou de thème.",
      "en": "Try widening your search: remove a filter or change the area, duration or theme.",
      "es": "Amplíe su búsqueda: quite un filtro o cambie la zona, la duración o el tema.",
      "it": "Prova ad ampliare la ricerca: togli un filtro o cambia zona, durata o tema.",
      "pt": "Tente alargar a pesquisa: remova um filtro ou mude a zona, a duração ou o tema.",
      "ar": "وسّع بحثك: أزل عامل تصفية أو غيّر المنطقة أو المدة أو الموضوع.",
      "nl": "Probeer je zoekopdracht te verbreden: verwijder een filter of wijzig het gebied, de duur of het thema.",
      "de": "Erweitere deine Suche: Entferne einen Filter oder ändere Gebiet, Dauer oder Thema."
    },
    "noResultsBtn": {
      "fr": "Réinitialiser les filtres",
      "en": "Reset filters",
      "es": "Restablecer filtros",
      "it": "Reimposta i filtri",
      "pt": "Repor filtros",
      "ar": "إعادة ضبط عوامل التصفية",
      "nl": "Filters wissen",
      "de": "Filter zurücksetzen"
    },
    "heroH1": {
      "fr": "road trips prêts à l'emploi",
      "en": "ready-made road trips",
      "es": "rutas listas para usar",
      "it": "itinerari pronti all'uso",
      "pt": "roteiros prontos a usar",
      "ar": "مسارات جاهزة للاستخدام",
      "nl": "kant-en-klare road trips",
      "de": "fertige Roadtrips"
    },
    "lede": {
      "fr": "Consultez, modifiez et partagez nos itinéraires — ou laissez-vous guider pour construire le vôtre.",
      "en": "Browse, edit and share our itineraries — or let us guide you to build your own.",
      "es": "Consulte, modifique y comparta nuestras rutas, o déjese guiar para crear la suya.",
      "it": "Consulta, modifica e condividi i nostri itinerari, o lasciati guidare per creare il tuo.",
      "pt": "Consulte, modifique e partilhe os nossos roteiros, ou deixe-se guiar para criar o seu.",
      "ar": "تصفح وعدّل وشارك مساراتنا، أو دعنا نرشدك لبناء مسارك.",
      "nl": "Bekijk, bewerk en deel onze routes — of laat je begeleiden om je eigen route te maken.",
      "de": "Durchstöbere, bearbeite und teile unsere Routen — oder lass dich beim Erstellen deiner eigenen begleiten."
    },
    "tabSearch": {
      "fr": "Rechercher",
      "en": "Search",
      "es": "Buscar",
      "it": "Cerca",
      "pt": "Pesquisar",
      "ar": "بحث",
      "nl": "Zoeken",
      "de": "Suchen"
    },
    "tabGuide": {
      "fr": "Laissez-vous guider",
      "en": "Let us guide you",
      "es": "Déjese guiar",
      "it": "Lasciati guidare",
      "pt": "Deixe-se guiar",
      "ar": "دعنا نرشدك",
      "nl": "Laat je begeleiden",
      "de": "Lass dich führen"
    },
    "searchBtn": {
      "fr": "Rechercher",
      "en": "Search",
      "es": "Buscar",
      "it": "Cerca",
      "pt": "Pesquisar",
      "ar": "بحث",
      "nl": "Zoeken",
      "de": "Suchen"
    },
    "goBtn": {
      "fr": "C'est parti",
      "en": "Let's go",
      "es": "Vamos",
      "it": "Si parte",
      "pt": "Vamos lá",
      "ar": "هيا بنا",
      "nl": "We gaan",
      "de": "Los geht's"
    },
    "genHint": {
      "fr": "Indiquez vos villes et la durée : on construit l'itinéraire pour vous, étape par étape.",
      "en": "Enter your cities and duration: we build the itinerary for you, step by step.",
      "es": "Indique sus ciudades y la duración: construimos la ruta por usted, etapa por etapa.",
      "it": "Indica le città e la durata: costruiamo l'itinerario per te, tappa dopo tappa.",
      "pt": "Indique as cidades e a duração: construímos o roteiro por si, etapa a etapa.",
      "ar": "أدخل المدن والمدة: نبني المسار لك خطوة بخطوة.",
      "nl": "Geef je steden en de duur op: wij bouwen de route voor je, stap voor stap.",
      "de": "Gib deine Städte und die Dauer an: Wir bauen die Route für dich, Etappe für Etappe."
    },
    "advanced": {
      "fr": "Options avancées",
      "en": "Advanced options",
      "es": "Opciones avanzadas",
      "it": "Opzioni avanzate",
      "pt": "Opções avançadas",
      "ar": "خيارات متقدمة",
      "nl": "Geavanceerde opties",
      "de": "Erweiterte Optionen"
    },
    "photosLbl": {
      "fr": "Photos",
      "en": "Photos",
      "es": "Fotos",
      "it": "Foto",
      "pt": "Fotos",
      "ar": "صور",
      "nl": "Foto's",
      "de": "Fotos"
    },
    "mapsLbl": {
      "fr": "Cartes",
      "en": "Maps",
      "es": "Mapas",
      "it": "Mappe",
      "pt": "Mapas",
      "ar": "خرائط",
      "nl": "Kaarten",
      "de": "Karten"
    },
    "contactShort": {
      "fr": "Contact",
      "en": "Contact",
      "es": "Contacto",
      "it": "Contatti",
      "pt": "Contacto",
      "ar": "اتصل بنا",
      "nl": "Contact",
      "de": "Kontakt"
    },
    "footerDiscover": {
      "fr": "Découvrir",
      "en": "Discover",
      "es": "Descubrir",
      "it": "Scopri",
      "pt": "Descobrir",
      "ar": "اكتشف",
      "nl": "Ontdekken",
      "de": "Entdecken"
    },
    "footerSpace": {
      "fr": "Votre espace",
      "en": "Your space",
      "es": "Su espacio",
      "it": "Il tuo spazio",
      "pt": "O seu espaço",
      "ar": "مساحتك",
      "nl": "Jouw ruimte",
      "de": "Dein Bereich"
    },
    "footerLangTitle": {
      "fr": "Langue",
      "en": "Language",
      "es": "Idioma",
      "it": "Lingua",
      "pt": "Idioma",
      "ar": "اللغة",
      "nl": "Taal",
      "de": "Sprache"
    },
    "footerTag": {
      "fr": "Des road trips inoubliables, partout dans le monde. Consultez, personnalisez et emportez votre voyage hors ligne.",
      "en": "Unforgettable road trips, all over the world. Browse, customize and take your trip offline.",
      "es": "Road trips inolvidables por todo el mundo. Consulte, personalice y lleve su viaje sin conexión.",
      "it": "Road trip indimenticabili in tutto il mondo. Consulta, personalizza e porta il viaggio offline.",
      "pt": "Road trips inesquecíveis por todo o mundo. Consulte, personalize e leve a sua viagem offline.",
      "ar": "رحلات برية لا تُنسى حول العالم. تصفح وخصّص واصطحب رحلتك دون اتصال.",
      "nl": "Onvergetelijke road trips, overal ter wereld. Bekijk, pas aan en neem je reis offline mee.",
      "de": "Unvergessliche Roadtrips, überall auf der Welt. Ansehen, anpassen und die Reise offline mitnehmen."
    },
    "entries": {
      "fr": [
        {
          "label": "Choisir sur la carte",
          "sub": "Explorez par région",
          "icon": "map",
          "href": "pres_simple.html"
        },
        {
          "label": "À partir des lieux",
          "sub": "Composez votre tracé",
          "icon": "pin",
          "href": "carte_builder.html?mode=expert"
        }
      ],
      "en": [
        {
          "label": "Choose on the map",
          "sub": "Explore by region",
          "icon": "map",
          "href": "pres_simple.html"
        },
        {
          "label": "From the places",
          "sub": "Compose your route",
          "icon": "pin",
          "href": "carte_builder.html?mode=expert"
        }
      ],
      "es": [
        {
          "label": "Elegir en el mapa",
          "sub": "Explore por región",
          "icon": "map",
          "href": "pres_simple.html"
        },
        {
          "label": "Desde los lugares",
          "sub": "Componga su ruta",
          "icon": "pin",
          "href": "carte_builder.html?mode=expert"
        }
      ],
      "it": [
        {
          "label": "Scegli sulla mappa",
          "sub": "Esplora per regione",
          "icon": "map",
          "href": "pres_simple.html"
        },
        {
          "label": "Dai luoghi",
          "sub": "Componi il tuo percorso",
          "icon": "pin",
          "href": "carte_builder.html?mode=expert"
        }
      ],
      "pt": [
        {
          "label": "Escolher no mapa",
          "sub": "Explore por região",
          "icon": "map",
          "href": "pres_simple.html"
        },
        {
          "label": "A partir dos lugares",
          "sub": "Componha o seu trajeto",
          "icon": "pin",
          "href": "carte_builder.html?mode=expert"
        }
      ],
      "ar": [
        {
          "label": "اختر على الخريطة",
          "sub": "استكشف حسب المنطقة",
          "icon": "map",
          "href": "pres_simple.html"
        },
        {
          "label": "من الأماكن",
          "sub": "كوّن مسارك",
          "icon": "pin",
          "href": "carte_builder.html?mode=expert"
        }
      ],
      "nl": [
        {
          "label": "Kies op de kaart",
          "sub": "Verken per regio",
          "icon": "map",
          "href": "pres_simple.html"
        },
        {
          "label": "Vanuit de plaatsen",
          "sub": "Stel je route samen",
          "icon": "pin",
          "href": "carte_builder.html?mode=expert"
        }
      ],
      "de": [
        {
          "label": "Auf der Karte wählen",
          "sub": "Nach Region erkunden",
          "icon": "map",
          "href": "pres_simple.html"
        },
        {
          "label": "Von den Orten aus",
          "sub": "Stelle deine Strecke zusammen",
          "icon": "pin",
          "href": "carte_builder.html?mode=expert"
        }
      ]
    }
  };

  // Filtres distance et nombre d etapes (ancien LANG_EXTRA2)
  var EXTRA2_KEYS = {
    "distLabel": {
      "fr": "Distance",
      "en": "Distance",
      "es": "Distancia",
      "it": "Distanza",
      "pt": "Distância",
      "ar": "المسافة",
      "nl": "Afstand",
      "de": "Entfernung"
    },
    "distUnder": {
      "fr": "Moins de {x}",
      "en": "Under {x}",
      "es": "Menos de {x}",
      "it": "Meno di {x}",
      "pt": "Menos de {x}",
      "ar": "أقل من {x}",
      "nl": "Minder dan {x}",
      "de": "Weniger als {x}"
    },
    "distOver": {
      "fr": "Plus de {x}",
      "en": "Over {x}",
      "es": "Más de {x}",
      "it": "Oltre {x}",
      "pt": "Mais de {x}",
      "ar": "أكثر من {x}",
      "nl": "Meer dan {x}",
      "de": "Mehr als {x}"
    },
    "stepsLabel": {
      "fr": "Nombre d'étapes (départ et arrivée inclus)",
      "en": "Number of stops (including start and end)",
      "es": "Número de etapas (incluidos salida y llegada)",
      "it": "Numero di tappe (inclusi partenza e arrivo)",
      "pt": "Número de etapas (incluindo partida e chegada)",
      "ar": "عدد المراحل (شاملاً الانطلاق والوصول)",
      "nl": "Aantal stops (vertrek en aankomst inbegrepen)",
      "de": "Anzahl der Etappen (Start und Ziel inbegriffen)"
    },
    "stepsAuto": {
      "fr": "Auto",
      "en": "Auto",
      "es": "Auto",
      "it": "Auto",
      "pt": "Auto",
      "ar": "تلقائي",
      "nl": "Auto",
      "de": "Auto"
    },
    "stepsWarn": {
      "fr": "Conseillé : entre 3 et {n} étapes (départ et arrivée inclus). La valeur sera ajustée si besoin.",
      "en": "Recommended: between 3 and {n} stops (including start and end). The value will be adjusted if needed.",
      "es": "Recomendado: entre 3 y {n} etapas (incluidos salida y llegada). El valor se ajustará si es necesario.",
      "it": "Consigliato: tra 3 e {n} tappe (inclusi partenza e arrivo). Il valore sarà adattato se necessario.",
      "pt": "Recomendado: entre 3 e {n} etapas (incluindo partida e chegada). O valor será ajustado se necessário.",
      "ar": "يُنصح بما بين 3 و {n} مراحل (شاملاً الانطلاق والوصول). سيتم تعديل القيمة عند الحاجة.",
      "nl": "Aanbevolen: tussen 3 en {n} stops (vertrek en aankomst inbegrepen). De waarde wordt zo nodig aangepast.",
      "de": "Empfohlen: zwischen 3 und {n} Etappen (Start und Ziel inbegriffen). Der Wert wird bei Bedarf angepasst."
    }
  };

  // Titre et description pour les moteurs (ancien META)
  var PAGEMETA_KEYS = {
    "title": {
      "fr": "OneRoadTrip | 910+ road trips prêts à l'emploi à personnaliser",
      "en": "OneRoadTrip | 910+ ready-made road trips to customize",
      "es": "OneRoadTrip | 910+ rutas listas para personalizar",
      "it": "OneRoadTrip | 910+ itinerari pronti da personalizzare",
      "pt": "OneRoadTrip | 910+ roteiros prontos para personalizar",
      "ar": "OneRoadTrip | أكثر من 910 مسارًا جاهزًا للتخصيص",
      "nl": "OneRoadTrip | 910+ kant-en-klare road trips om aan te passen",
      "de": "OneRoadTrip | 910+ fertige Roadtrips zum Anpassen"
    },
    "desc": {
      "fr": "Planifiez votre road trip sur mesure : choisissez votre point de départ, votre durée et la zone à explorer. OneRoadTrip génère votre itinéraire parmi 910+ parcours et 6500+ lieux testés.",
      "en": "Plan your road trip your way: pick your starting point, duration and the area to explore. OneRoadTrip builds your itinerary from 910+ routes and 6500+ tested places.",
      "es": "Planifica tu road trip a medida: elige tu punto de partida, la duración y la zona a explorar. OneRoadTrip genera tu ruta entre 910+ recorridos y 6500+ lugares probados.",
      "it": "Pianifica il tuo road trip su misura: scegli il punto di partenza, la durata e la zona da esplorare. OneRoadTrip genera il tuo itinerario tra 910+ percorsi e 6500+ luoghi testati.",
      "pt": "Planeie a sua road trip à medida: escolha o ponto de partida, a duração e a zona a explorar. A OneRoadTrip gera o seu roteiro entre 910+ percursos e 6500+ lugares testados.",
      "ar": "خطط لرحلتك البرية كما تريد: اختر نقطة الانطلاق والمدة والمنطقة. ينشئ OneRoadTrip مسارك من بين أكثر من 910 مسارًا و6500 مكان مُختبَر.",
      "nl": "Plan je road trip op jouw manier: kies je vertrekpunt, de duur en het gebied dat je wilt verkennen. OneRoadTrip stelt je route samen uit 910+ routes en 6500+ geteste plaatsen.",
      "de": "Plane deinen Roadtrip nach deinen Wünschen: Wähle Startpunkt, Dauer und das Gebiet, das du erkunden willst. OneRoadTrip erstellt deine Route aus 910+ Strecken und 6500+ geprüften Orten."
    }
  };

  // Les 5 modes d entree, onglets du module (ancien T5)
  var MODES_KEYS = {
    "crit": {
      "fr": [
        "Mot-clé",
        "Pays",
        "Thème",
        "Durée",
        "Distance"
      ],
      "en": [
        "Keyword",
        "Country",
        "Theme",
        "Duration",
        "Distance"
      ],
      "es": [
        "Palabra clave",
        "País",
        "Tema",
        "Duración",
        "Distancia"
      ],
      "it": [
        "Parola chiave",
        "Paese",
        "Tema",
        "Durata",
        "Distanza"
      ],
      "pt": [
        "Palavra-chave",
        "País",
        "Tema",
        "Duração",
        "Distância"
      ],
      "ar": [
        "كلمة مفتاحية",
        "الدولة",
        "الموضوع",
        "المدة",
        "المسافة"
      ],
      "nl": [
        "Trefwoord",
        "Land",
        "Thema",
        "Duur",
        "Afstand"
      ],
      "de": [
        "Stichwort",
        "Land",
        "Thema",
        "Dauer",
        "Entfernung"
      ]
    },
    "h1": {
      "fr": "5 façons de créer ou trouver votre prochain itinéraire",
      "en": "5 ways to create or find your next itinerary",
      "es": "5 formas de crear o encontrar tu próxima ruta",
      "it": "5 modi per creare o trovare il tuo prossimo itinerario",
      "pt": "5 formas de criar ou encontrar o seu próximo roteiro",
      "ar": "٥ طرق لإنشاء أو إيجاد مسارك القادم",
      "nl": "5 manieren om je volgende route te maken of te vinden",
      "de": "5 Wege, deine nächste Route zu erstellen oder zu finden"
    },
    "lede": {
      "fr": "Choisissez votre point d'entrée : nos parcours prêts à l'emploi, un tracé entre deux villes, une sélection de lieux, le planisphère, ou simplement une phrase.",
      "en": "Pick your entry point: our ready-made routes, a route between two cities, a selection of places, the world map, or just one sentence.",
      "es": "Elige tu punto de entrada: nuestras rutas listas, un trazado entre dos ciudades, una selección de lugares, el planisferio o una simple frase.",
      "it": "Scegli il tuo punto di partenza: i nostri percorsi pronti, un tracciato tra due città, una selezione di luoghi, il planisfero o una semplice frase.",
      "pt": "Escolha o seu ponto de entrada: os nossos percursos prontos, um traçado entre duas cidades, uma seleção de lugares, o planisfério ou apenas uma frase.",
      "ar": "اختر نقطة البداية: مساراتنا الجاهزة، أو مسار بين مدينتين، أو مجموعة أماكن، أو خريطة العالم، أو جملة واحدة فقط.",
      "nl": "Kies je startpunt: onze kant-en-klare routes, een traject tussen twee steden, een selectie plaatsen, de wereldkaart, of gewoon één zin.",
      "de": "Wähle deinen Einstieg: unsere fertigen Routen, eine Strecke zwischen zwei Städten, eine Auswahl an Orten, die Weltkarte oder einfach ein Satz."
    },
    "tripsLbl": {
      "fr": "road trips",
      "en": "road trips",
      "es": "road trips",
      "it": "road trips",
      "pt": "road trips",
      "ar": "رحلات برية",
      "nl": "road trips",
      "de": "Roadtrips"
    },
    "tabs": {
      "fr": {
        "search": [
          "Par critères",
          "Pays, thème, durée, distance"
        ],
        "generate": [
          "Entre deux points",
          "On construit le tracé A → B"
        ],
        "places": [
          "À partir des lieux",
          "Vos incontournables d'abord"
        ],
        "globe": [
          "Planisphère",
          "Explorer le monde à la carte"
        ],
        "lilia": [
          "Demander à Lilia",
          "Décrivez le voyage en une phrase"
        ]
      },
      "en": {
        "search": [
          "By criteria",
          "Country, theme, duration, distance"
        ],
        "generate": [
          "Between two points",
          "We build the A → B route"
        ],
        "places": [
          "From the places",
          "Your must-sees first"
        ],
        "globe": [
          "World map",
          "Explore the world on a map"
        ],
        "lilia": [
          "Ask Lilia",
          "Describe your trip in one sentence"
        ]
      },
      "es": {
        "search": [
          "Por criterios",
          "País, tema, duración, distancia"
        ],
        "generate": [
          "Entre dos puntos",
          "Construimos el trazado A → B"
        ],
        "places": [
          "A partir de los lugares",
          "Tus imprescindibles primero"
        ],
        "globe": [
          "Planisferio",
          "Explorar el mundo en el mapa"
        ],
        "lilia": [
          "Preguntar a Lilia",
          "Describe el viaje en una frase"
        ]
      },
      "it": {
        "search": [
          "Per criteri",
          "Paese, tema, durata, distanza"
        ],
        "generate": [
          "Tra due punti",
          "Costruiamo il percorso A → B"
        ],
        "places": [
          "Dai luoghi",
          "Prima le tue tappe imperdibili"
        ],
        "globe": [
          "Planisfero",
          "Esplora il mondo sulla mappa"
        ],
        "lilia": [
          "Chiedi a Lilia",
          "Descrivi il viaggio in una frase"
        ]
      },
      "pt": {
        "search": [
          "Por critérios",
          "País, tema, duração, distância"
        ],
        "generate": [
          "Entre dois pontos",
          "Construímos o traçado A → B"
        ],
        "places": [
          "A partir dos lugares",
          "Os seus imperdíveis primeiro"
        ],
        "globe": [
          "Planisfério",
          "Explorar o mundo no mapa"
        ],
        "lilia": [
          "Perguntar à Lilia",
          "Descreva a viagem numa frase"
        ]
      },
      "ar": {
        "search": [
          "حسب المعايير",
          "الدولة، الموضوع، المدة، المسافة"
        ],
        "generate": [
          "بين نقطتين",
          "نبني المسار من أ إلى ب"
        ],
        "places": [
          "انطلاقًا من الأماكن",
          "أماكنك المفضلة أولاً"
        ],
        "globe": [
          "خريطة العالم",
          "استكشف العالم على الخريطة"
        ],
        "lilia": [
          "اسأل ليليا",
          "صف رحلتك في جملة واحدة"
        ]
      },
      "nl": {
        "search": [
          "Op criteria",
          "Land, thema, duur, afstand"
        ],
        "generate": [
          "Tussen twee punten",
          "Wij bouwen het traject A → B"
        ],
        "places": [
          "Vanuit de plaatsen",
          "Jouw hoogtepunten eerst"
        ],
        "globe": [
          "Wereldkaart",
          "De wereld op de kaart verkennen"
        ],
        "lilia": [
          "Vraag het Lilia",
          "Beschrijf je reis in één zin"
        ]
      },
      "de": {
        "search": [
          "Nach Kriterien",
          "Land, Thema, Dauer, Entfernung"
        ],
        "generate": [
          "Zwischen zwei Punkten",
          "Wir bauen die Strecke A → B"
        ],
        "places": [
          "Von den Orten aus",
          "Deine Höhepunkte zuerst"
        ],
        "globe": [
          "Weltkarte",
          "Die Welt auf der Karte erkunden"
        ],
        "lilia": [
          "Lilia fragen",
          "Beschreibe deine Reise in einem Satz"
        ]
      }
    },
    "placesTitle": {
      "fr": "Partez de ce que vous voulez voir",
      "en": "Start from what you want to see",
      "es": "Empieza por lo que quieres ver",
      "it": "Parti da ciò che vuoi vedere",
      "pt": "Comece pelo que quer ver",
      "ar": "ابدأ مما تريد رؤيته",
      "nl": "Begin bij wat je wilt zien",
      "de": "Beginne bei dem, was du sehen willst"
    },
    "placesText": {
      "fr": "Choisissez vos lieux un par un sur la carte. On relie les points, on calcule la route et on répartit les étapes jour par jour.",
      "en": "Pick your places one by one on the map. We connect the dots, compute the route and split it day by day.",
      "es": "Elige tus lugares uno a uno en el mapa. Unimos los puntos, calculamos la ruta y repartimos las etapas día a día.",
      "it": "Scegli i tuoi luoghi uno per uno sulla mappa. Uniamo i punti, calcoliamo il percorso e distribuiamo le tappe giorno per giorno.",
      "pt": "Escolha os seus lugares um a um no mapa. Ligamos os pontos, calculamos a rota e dividimos as etapas dia a dia.",
      "ar": "اختر أماكنك واحدًا تلو الآخر على الخريطة. نصل النقاط ونحسب الطريق ونوزع المراحل يومًا بيوم.",
      "nl": "Kies je plaatsen één voor één op de kaart. Wij verbinden de punten, berekenen de route en verdelen de etappes dag per dag.",
      "de": "Wähle deine Orte nacheinander auf der Karte. Wir verbinden die Punkte, berechnen die Strecke und teilen sie Tag für Tag auf."
    },
    "placesBtn": {
      "fr": "Ouvrir le constructeur",
      "en": "Open the builder",
      "es": "Abrir el constructor",
      "it": "Apri il costruttore",
      "pt": "Abrir o construtor",
      "ar": "افتح أداة البناء",
      "nl": "Bouwer openen",
      "de": "Baukasten öffnen"
    },
    "globeTitle": {
      "fr": "Le monde entier sur une carte",
      "en": "The whole world on one map",
      "es": "El mundo entero en un mapa",
      "it": "Il mondo intero su una mappa",
      "pt": "O mundo inteiro num mapa",
      "ar": "العالم كله على خريطة واحدة",
      "nl": "De hele wereld op één kaart",
      "de": "Die ganze Welt auf einer Karte"
    },
    "globeText": {
      "fr": "Zoomez sur une région, voyez les itinéraires disponibles et ouvrez celui qui vous parle.",
      "en": "Zoom into a region, see the available itineraries and open the one you like.",
      "es": "Haz zoom en una región, mira las rutas disponibles y abre la que te guste.",
      "it": "Ingrandisci una regione, guarda gli itinerari disponibili e apri quello che ti piace.",
      "pt": "Amplie uma região, veja os roteiros disponíveis e abra o que lhe agradar.",
      "ar": "قرّب منطقة، شاهد المسارات المتاحة وافتح ما يعجبك.",
      "nl": "Zoom in op een regio, bekijk de beschikbare routes en open degene die je aanspreekt.",
      "de": "Zoome in eine Region, sieh dir die verfügbaren Routen an und öffne die, die dich anspricht."
    },
    "globeBtn": {
      "fr": "Ouvrir le planisphère",
      "en": "Open the world map",
      "es": "Abrir el planisferio",
      "it": "Apri il planisfero",
      "pt": "Abrir o planisfério",
      "ar": "افتح خريطة العالم",
      "nl": "Wereldkaart openen",
      "de": "Weltkarte öffnen"
    }
  };

  // Recherche par phrase, Lilia (ancien L)
  var LILIA_KEYS = {
    "title": {
      "fr": "Dites-nous ce que vous cherchez, Lilia trouve l'itinéraire idéal.",
      "en": "Tell us what you're after — Lilia finds your ideal itinerary.",
      "es": "Dinos qué buscas y Lilia encontrará la ruta ideal.",
      "it": "Dicci cosa cerchi e Lilia troverà l'itinerario ideale.",
      "pt": "Diga-nos o que procura e a Lilia encontra o roteiro ideal.",
      "ar": "أخبرنا عمّا تبحث وستجد لك ليليا المسار المثالي.",
      "nl": "Vertel ons wat je zoekt, Lilia vindt de ideale route.",
      "de": "Sag uns, was du suchst, Lilia findet die passende Route."
    },
    "ex": {
      "fr": [
        "un itinéraire nature et montagne à moins de 3 h de Genève, en septembre",
        "des plages au soleil à moins de 4 h de Paris, en famille",
        "voir le Colisée et Pompéi, à moins de 3 h de Paris",
        "vin et gastronomie autour de Lyon, entre amis",
        "Pétra et le Wadi Rum, à moins de 6 h de Paris",
        "un week-end culturel à moins de 2 h de Bruxelles"
      ],
      "en": [
        "nature and mountains under 3 h from Geneva, in September",
        "sunny beaches under 4 h from Paris, with family",
        "see the Colosseum and Pompeii, under 3 h from Paris",
        "wine and food around Lyon, with friends",
        "Petra and Wadi Rum, under 6 h from Paris",
        "a culture weekend under 2 h from Brussels"
      ],
      "es": [
        "naturaleza y montaña a menos de 3 h de Ginebra, en septiembre",
        "playas con sol a menos de 4 h de París, en familia",
        "ver el Coliseo y Pompeya, a menos de 3 h de París",
        "vino y gastronomía cerca de Lyon, con amigos",
        "Petra y Wadi Rum, a menos de 6 h de París",
        "una escapada cultural a menos de 2 h de Bruselas"
      ],
      "it": [
        "natura e montagna a meno di 3 h da Ginevra, a settembre",
        "spiagge al sole a meno di 4 h da Parigi, in famiglia",
        "vedere il Colosseo e Pompei, a meno di 3 h da Parigi",
        "vino e gastronomia vicino a Lione, con gli amici",
        "Petra e il Wadi Rum, a meno di 6 h da Parigi",
        "un weekend culturale a meno di 2 h da Bruxelles"
      ],
      "pt": [
        "natureza e montanha a menos de 3 h de Genebra, em setembro",
        "praias com sol a menos de 4 h de Paris, em família",
        "ver o Coliseu e Pompeia, a menos de 3 h de Paris",
        "vinho e gastronomia perto de Lyon, com amigos",
        "Petra e o Wadi Rum, a menos de 6 h de Paris",
        "um fim de semana cultural a menos de 2 h de Bruxelas"
      ],
      "ar": [
        "طبيعة وجبال على بُعد أقل من 3 ساعات من جنيف، في سبتمبر",
        "شواطئ مشمسة على بُعد أقل من 4 ساعات من باريس، مع العائلة",
        "زيارة الكولوسيوم وبومبي، على بُعد أقل من 3 ساعات من باريس",
        "نبيذ وطعام حول ليون، مع الأصدقاء",
        "البتراء ووادي رم، على بُعد أقل من 6 ساعات من باريس",
        "عطلة ثقافية على بُعد أقل من ساعتين من بروكسل"
      ],
      "nl": [
        "natuur en bergen op minder dan 3 u van Genève, in september",
        "zonnige stranden op minder dan 4 u van Parijs, met het gezin",
        "het Colosseum en Pompeï zien, op minder dan 3 u van Parijs",
        "wijn en gastronomie rond Lyon, met vrienden",
        "Petra en Wadi Rum, op minder dan 6 u van Parijs",
        "een cultureel weekend op minder dan 2 u van Brussel"
      ],
      "de": [
        "Natur und Berge unter 3 Std. von Genf, im September",
        "sonnige Strände unter 4 Std. von Paris, mit der Familie",
        "Kolosseum und Pompeji sehen, unter 3 Std. von Paris",
        "Wein und Küche rund um Lyon, mit Freunden",
        "Petra und Wadi Rum, unter 6 Std. von Paris",
        "ein Kulturwochenende unter 2 Std. von Brüssel"
      ]
    },
    "go": {
      "fr": "Trouver",
      "en": "Find",
      "es": "Buscar",
      "it": "Trova",
      "pt": "Encontrar",
      "ar": "ابحث",
      "nl": "Zoeken",
      "de": "Finden"
    },
    "searching": {
      "fr": "Lilia cherche…",
      "en": "Lilia is searching…",
      "es": "Lilia está buscando…",
      "it": "Lilia sta cercando…",
      "pt": "A Lilia está a procurar…",
      "ar": "ليليا تبحث…",
      "nl": "Lilia zoekt…",
      "de": "Lilia sucht…"
    },
    "none": {
      "fr": "Aucun itinéraire ne correspond. Essayez d'élargir la demande.",
      "en": "No itinerary matches. Try widening your request.",
      "es": "Ninguna ruta coincide. Prueba a ampliar la búsqueda.",
      "it": "Nessun itinerario corrisponde. Prova ad ampliare la richiesta.",
      "pt": "Nenhum roteiro corresponde. Tente alargar o pedido.",
      "ar": "لا يوجد مسار مطابق. حاول توسيع الطلب.",
      "nl": "Geen enkele route komt overeen. Probeer je vraag te verbreden.",
      "de": "Keine Route passt dazu. Formuliere deine Anfrage etwas weiter."
    },
    "err": {
      "fr": "Lilia n'a pas pu répondre, réessayez dans un instant.",
      "en": "Lilia couldn't answer, please try again shortly.",
      "es": "Lilia no pudo responder, inténtalo de nuevo.",
      "it": "Lilia non ha potuto rispondere, riprova tra poco.",
      "pt": "A Lilia não conseguiu responder, tente de novo.",
      "ar": "تعذّر على ليليا الرد، حاول لاحقًا.",
      "nl": "Lilia kon niet antwoorden, probeer het zo dadelijk opnieuw.",
      "de": "Lilia konnte nicht antworten, versuche es gleich noch einmal."
    },
    "flight": {
      "fr": "h de vol",
      "en": "h flight",
      "es": "h de vuelo",
      "it": "h di volo",
      "pt": "h de voo",
      "ar": "ساعة طيران",
      "nl": "u vliegen",
      "de": "Std. Flug"
    },
    "days": {
      "fr": "j",
      "en": "d",
      "es": "d",
      "it": "g",
      "pt": "d",
      "ar": "يوم",
      "nl": "d",
      "de": "T."
    }
  };

  // Liens de la barre (ancien NAV)
  var NAV_KEYS = {
    "news": {
      "fr": "Actualités",
      "en": "News",
      "es": "Noticias",
      "it": "Notizie",
      "pt": "Notícias",
      "ar": "أخبار",
      "nl": "Nieuws",
      "de": "Aktuelles"
    },
    "press": {
      "fr": "Presse",
      "en": "Press",
      "es": "Prensa",
      "it": "Stampa",
      "pt": "Imprensa",
      "ar": "الصحافة",
      "nl": "Pers",
      "de": "Presse"
    },
    "partners": {
      "fr": "Partenaires",
      "en": "Partners",
      "es": "Socios",
      "it": "Partner",
      "pt": "Parceiros",
      "ar": "شركاء",
      "nl": "Partners",
      "de": "Partner"
    }
  };

  // Mois de l annee (ancien MONTHS)
  var MONTHS_KEYS = {
    "0": {
      "fr": "janvier",
      "en": "january",
      "es": "enero",
      "it": "gennaio",
      "pt": "janeiro",
      "ar": "يناير",
      "nl": "januari",
      "de": "Januar"
    },
    "1": {
      "fr": "février",
      "en": "february",
      "es": "febrero",
      "it": "febbraio",
      "pt": "fevereiro",
      "ar": "فبراير",
      "nl": "februari",
      "de": "Februar"
    },
    "2": {
      "fr": "mars",
      "en": "march",
      "es": "marzo",
      "it": "marzo",
      "pt": "março",
      "ar": "مارس",
      "nl": "maart",
      "de": "März"
    },
    "3": {
      "fr": "avril",
      "en": "april",
      "es": "abril",
      "it": "aprile",
      "pt": "abril",
      "ar": "أبريل",
      "nl": "april",
      "de": "April"
    },
    "4": {
      "fr": "mai",
      "en": "may",
      "es": "mayo",
      "it": "maggio",
      "pt": "maio",
      "ar": "مايو",
      "nl": "mei",
      "de": "Mai"
    },
    "5": {
      "fr": "juin",
      "en": "june",
      "es": "junio",
      "it": "giugno",
      "pt": "junho",
      "ar": "يونيو",
      "nl": "juni",
      "de": "Juni"
    },
    "6": {
      "fr": "juillet",
      "en": "july",
      "es": "julio",
      "it": "luglio",
      "pt": "julho",
      "ar": "يوليو",
      "nl": "juli",
      "de": "Juli"
    },
    "7": {
      "fr": "août",
      "en": "august",
      "es": "agosto",
      "it": "agosto",
      "pt": "agosto",
      "ar": "أغسطس",
      "nl": "augustus",
      "de": "August"
    },
    "8": {
      "fr": "septembre",
      "en": "september",
      "es": "septiembre",
      "it": "settembre",
      "pt": "setembro",
      "ar": "سبتمبر",
      "nl": "september",
      "de": "September"
    },
    "9": {
      "fr": "octobre",
      "en": "october",
      "es": "octubre",
      "it": "ottobre",
      "pt": "outubro",
      "ar": "أكتوبر",
      "nl": "oktober",
      "de": "Oktober"
    },
    "10": {
      "fr": "novembre",
      "en": "november",
      "es": "noviembre",
      "it": "novembre",
      "pt": "novembro",
      "ar": "نوفمبر",
      "nl": "november",
      "de": "November"
    },
    "11": {
      "fr": "décembre",
      "en": "december",
      "es": "diciembre",
      "it": "dicembre",
      "pt": "dezembro",
      "ar": "ديسمبر",
      "nl": "december",
      "de": "Dezember"
    }
  };

  // Bandeau meteo (ancien VERDICT_LABELS)
  var VERDICT_KEYS = {
    "when": {
      "fr": "Quand y aller",
      "en": "When to go",
      "es": "Cuándo ir",
      "it": "Quando andare",
      "pt": "Quando ir",
      "ar": "متى تذهب",
      "nl": "Wanneer gaan",
      "de": "Wann hinfahren"
    },
    "na": {
      "fr": "Pas de donnée météo",
      "en": "No weather data",
      "es": "Sin datos meteorológicos",
      "it": "Nessun dato meteo",
      "pt": "Sem dados meteorológicos",
      "ar": "لا توجد بيانات الطقس",
      "nl": "Geen weergegevens",
      "de": "Keine Wetterdaten"
    }
  };

  // Selecteur de zone a main levee (ancien Z_I18N)
  // ATTENTION : l arabe n a jamais existe ici, il retombe sur le francais.
  var ZONE_KEYS = {
    "title": {
      "fr": "🗺️ Dessinez votre zone",
      "en": "🗺️ Draw your area",
      "es": "🗺️ Dibuje su zona",
      "it": "🗺️ Disegna la tua zona",
      "pt": "🗺️ Desenhe a sua zona",
      "nl": "🗺️ Teken je gebied",
      "de": "🗺️ Zeichne dein Gebiet"
    },
    "helpTouch": {
      "fr": "Tracez avec le doigt la zone que vous voulez visiter. Fermez la fenêtre pour nous laisser choisir.",
      "en": "Draw the area you want to visit with your finger. Close to let us decide.",
      "es": "Dibuje con el dedo la zona que quiere visitar. Cierre para que decidamos nosotros.",
      "it": "Disegna con il dito la zona da visitare. Chiudi per lasciarci decidere.",
      "pt": "Desenhe com o dedo a zona que quer visitar. Feche para nos deixar decidir.",
      "nl": "Teken met je vinger het gebied dat je wilt bezoeken. Sluit het venster om ons te laten kiezen.",
      "de": "Zeichne mit dem Finger das Gebiet, das du besuchen möchtest. Schließe das Fenster, damit wir wählen."
    },
    "helpMouse": {
      "fr": "Tracez avec la souris la zone que vous voulez visiter. Fermez la fenêtre pour nous laisser choisir.",
      "en": "Draw the area you want to visit with your mouse. Close to let us decide.",
      "es": "Dibuje con el ratón la zona que quiere visitar. Cierre para que decidamos nosotros.",
      "it": "Disegna con il mouse la zona da visitare. Chiudi per lasciarci decidere.",
      "pt": "Desenhe com o rato a zona que quer visitar. Feche para nos deixar decidir.",
      "nl": "Teken met de muis het gebied dat je wilt bezoeken. Sluit het venster om ons te laten kiezen.",
      "de": "Zeichne mit der Maus das Gebiet, das du besuchen möchtest. Schließe das Fenster, damit wir wählen."
    },
    "reset": {
      "fr": "↺ Effacer",
      "en": "↺ Clear",
      "es": "↺ Borrar",
      "it": "↺ Cancella",
      "pt": "↺ Limpar",
      "nl": "↺ Wissen",
      "de": "↺ Löschen"
    },
    "skip": {
      "fr": "Nous laisser décider",
      "en": "Let us decide",
      "es": "Déjenos decidir",
      "it": "Lasciaci decidere",
      "pt": "Deixe-nos decidir",
      "nl": "Laat ons beslissen",
      "de": "Lass uns entscheiden"
    },
    "validate": {
      "fr": "✓ Valider",
      "en": "✓ Confirm",
      "es": "✓ Confirmar",
      "it": "✓ Conferma",
      "pt": "✓ Confirmar",
      "nl": "✓ Bevestigen",
      "de": "✓ Bestätigen"
    },
    "status": {
      "fr": "Zone dessinée ({n} points)",
      "en": "Area drawn ({n} points)",
      "es": "Zona dibujada ({n} puntos)",
      "it": "Zona disegnata ({n} punti)",
      "pt": "Zona desenhada ({n} pontos)",
      "nl": "Gebied getekend ({n} punten)",
      "de": "Gebiet gezeichnet ({n} Punkte)"
    },
    "edit": {
      "fr": "Modifier / effacer",
      "en": "Edit / clear",
      "es": "Modificar / borrar",
      "it": "Modifica / cancella",
      "pt": "Modificar / limpar",
      "nl": "Bewerken / wissen",
      "de": "Bearbeiten / löschen"
    },
    "needStart": {
      "fr": "Choisissez d’abord une ville de départ (sélectionnez-la dans la liste).",
      "en": "Please choose a departure city first (select from the list).",
      "es": "Elija primero una ciudad de salida (seleccione de la lista).",
      "it": "Scegli prima una città di partenza (seleziona dall’elenco).",
      "pt": "Escolha primeiro uma cidade de partida (selecione na lista).",
      "nl": "Kies eerst een vertrekstad (selecteer die in de lijst).",
      "de": "Wähle zuerst eine Startstadt (aus der Liste auswählen)."
    },
    "warnNoSuggestion": {
      "fr": "Vous n’avez pas sélectionné de ville dans la liste de suggestions. Le résultat pourrait être imprécis (homonymes possibles). Continuer ?",
      "en": "You did not select a city from the suggestions list. Result may be inaccurate (possible homonyms). Continue?",
      "es": "No seleccionó una ciudad de la lista de sugerencias. El resultado puede ser impreciso (homónimos posibles). ¿Continuar?",
      "it": "Non hai selezionato una città dall’elenco. Il risultato potrebbe essere impreciso (omonimi possibili). Continuare?",
      "pt": "Não selecionou uma cidade na lista de sugestões. O resultado pode ser impreciso (homônimos possíveis). Continuar?",
      "nl": "Je hebt geen stad uit de suggestielijst gekozen. Het resultaat kan onnauwkeurig zijn (mogelijke naamgenoten). Doorgaan?",
      "de": "Du hast keine Stadt aus der Vorschlagsliste gewählt. Das Ergebnis kann ungenau sein (mögliche Namensgleichheiten). Fortfahren?"
    }
  };

  // Message d accueil partenaire (ancien T)
  var WELCOME_KEYS = {
    "title": {
      "fr": "Bienvenue !",
      "en": "Welcome!",
      "es": "¡Bienvenido!",
      "it": "Benvenuto!",
      "pt": "Bem-vindo!",
      "ar": "مرحباً!",
      "nl": "Welkom!",
      "de": "Willkommen!"
    },
    "msg": {
      "fr": "Vous arrivez via le CSE Diot Siaci. N'hésitez pas à nous faire part de vos commentaires ou questions en écrivant à <a href=\"mailto:contact@oneroadtrip.com\" style=\"color:#C8102E;\">contact@oneroadtrip.com</a>.",
      "en": "You're coming from the CSE Diot Siaci. Feel free to share your feedback or questions at <a href=\"mailto:contact@oneroadtrip.com\" style=\"color:#C8102E;\">contact@oneroadtrip.com</a>.",
      "es": "Llegas a través del CSE Diot Siaci. No dudes en enviarnos tus comentarios o preguntas a <a href=\"mailto:contact@oneroadtrip.com\" style=\"color:#C8102E;\">contact@oneroadtrip.com</a>.",
      "it": "Arrivi tramite il CSE Diot Siaci. Non esitare a inviarci i tuoi commenti o domande a <a href=\"mailto:contact@oneroadtrip.com\" style=\"color:#C8102E;\">contact@oneroadtrip.com</a>.",
      "pt": "Você chega através do CSE Diot Siaci. Não hesite em enviar seus comentários ou perguntas para <a href=\"mailto:contact@oneroadtrip.com\" style=\"color:#C8102E;\">contact@oneroadtrip.com</a>.",
      "ar": "أنت قادم عبر CSE Diot Siaci. لا تتردد في إرسال تعليقاتك أو أسئلتك إلى <a href=\"mailto:contact@oneroadtrip.com\" style=\"color:#C8102E;\">contact@oneroadtrip.com</a>.",
      "nl": "Je komt binnen via de CSE Diot Siaci. Laat ons gerust je opmerkingen of vragen weten via <a href=\"mailto:contact@oneroadtrip.com\" style=\"color:#C8102E;\">contact@oneroadtrip.com</a>.",
      "de": "Du kommst über den CSE Diot Siaci. Teile uns gerne deine Anmerkungen oder Fragen mit unter <a href=\"mailto:contact@oneroadtrip.com\" style=\"color:#C8102E;\">contact@oneroadtrip.com</a>."
    },
    "foot": {
      "fr": "Bon voyage 👋",
      "en": "Have a great trip 👋",
      "es": "¡Buen viaje! 👋",
      "it": "Buon viaggio 👋",
      "pt": "Boa viagem 👋",
      "ar": "رحلة سعيدة 👋",
      "nl": "Goede reis 👋",
      "de": "Gute Reise 👋"
    },
    "ok": {
      "fr": "OK",
      "en": "OK",
      "es": "OK",
      "it": "OK",
      "pt": "OK",
      "ar": "حسناً",
      "nl": "OK",
      "de": "OK"
    }
  };

  // ================================================================

  // Sous-titre du bandeau (ancien ARGS)
  var ARGS = {
    "fr": "Modifiables de A à Z, avec carte interactive, et 100 % gratuits.",
    "en": "Fully editable, with an interactive map, and 100% free.",
    "es": "Totalmente editables, con mapa interactivo y 100 % gratis.",
    "it": "Completamente modificabili, con mappa interattiva e 100% gratuiti.",
    "pt": "Totalmente editáveis, com mapa interativo e 100% gratuitos.",
    "ar": "قابلة للتعديل بالكامل، مع خريطة تفاعلية، ومجانية 100%.",
    "nl": "Volledig aanpasbaar, met interactieve kaart, en 100% gratis.",
    "de": "Vollständig bearbeitbar, mit interaktiver Karte, und 100% kostenlos."
  };

  // ================================================================
  // Reconstruction au format historique, langue d abord
  // ================================================================
  function parLangue(keys) {
    var out = {};
    LANGS.forEach(function (l) {
      out[l] = {};
      Object.keys(keys).forEach(function (k) {
        var v = keys[k][l];
        out[l][k] = (v === undefined || v === null) ? keys[k].en : v;
      });
    });
    return out;
  }

  window.ORT_I18N_INDEX = {
    LANGS: LANGS,
    LANG_FOLDERS: LANG_FOLDERS,
    LILIA_FOLDERS: LILIA_FOLDERS,
    LH: LH,
    ARGS: ARGS,

    // format une cle puis les langues (a privilegier pour les ajouts)
    META_KEYS: META_KEYS,
    EXTRA_KEYS: EXTRA_KEYS,
    EXTRA2_KEYS: EXTRA2_KEYS,
    PAGEMETA_KEYS: PAGEMETA_KEYS,
    MODES_KEYS: MODES_KEYS,
    LILIA_KEYS: LILIA_KEYS,
    NAV_KEYS: NAV_KEYS,
    MONTHS_KEYS: MONTHS_KEYS,
    VERDICT_KEYS: VERDICT_KEYS,
    ZONE_KEYS: ZONE_KEYS,
    WELCOME_KEYS: WELCOME_KEYS,

    // format historique attendu par index.html
    LANG_META: parLangue(META_KEYS),
    LANG_EXTRA: parLangue(EXTRA_KEYS),
    LANG_EXTRA2: parLangue(EXTRA2_KEYS),
    PAGE_META: parLangue(PAGEMETA_KEYS),
    T5: parLangue(MODES_KEYS),
    L: parLangue(LILIA_KEYS),
    NAV: parLangue(NAV_KEYS),
    MONTHS: parLangue(MONTHS_KEYS),
    VERDICT_LABELS: parLangue(VERDICT_KEYS),
    ZONE: ZONE_KEYS,
    WELCOME: parLangue(WELCOME_KEYS)
  };

  console.log("[ORT-I18N-INDEX] OK " + LANGS.length + " langues");
})();
