/**
 * ort-i18n-builder.js - TEXTES DU CONSTRUCTEUR DE CARTE (carte_builder.html)
 * ==========================================================================
 * Format : une cle, puis les langues.
 * 8 langues : fr, en, es, it, pt, ar, nl, de
 *
 * A charger AVANT le script de carte_builder.html.
 */
(function () {
  "use strict";
  var LANGS = ["fr","en","es","it","pt","ar","nl","de"];

  var KEYS = {
    "pageTitle": {
      "fr": "Construisez votre itinéraire personnalisé",
      "en": "Build your custom itinerary",
      "es": "Construye tu itinerario personalizado",
      "it": "Costruisci il tuo itinerario personalizzato",
      "pt": "Construa seu itinerário personalizado",
      "ar": "ابنِ مسارك المخصص",
      "nl": "Stel je eigen route samen",
      "de": "Erstelle deine eigene Route"
    },
    "panelTitle": {
      "fr": "🗺️ Mon itinéraire personnalisé",
      "en": "🗺️ My custom itinerary",
      "es": "🗺️ Mi itinerario personalizado",
      "it": "🗺️ Il mio itinerario personalizzato",
      "pt": "🗺️ Meu itinerário personalizado",
      "ar": "🗺️ مساري المخصص",
      "nl": "🗺️ Mijn persoonlijke route",
      "de": "🗺️ Meine persönliche Route"
    },
    "panelSubtitle": {
      "fr": "(modifiable sur la page suivante)",
      "en": "(editable on the next page)",
      "es": "(editable en la página siguiente)",
      "it": "(modificabile nella pagina successiva)",
      "pt": "(editável na próxima página)",
      "ar": "(قابل للتعديل في الصفحة التالية)",
      "nl": "(aan te passen op de volgende pagina)",
      "de": "(auf der nächsten Seite bearbeitbar)"
    },
    "zoomHint": {
      "fr": "🔍 Zoomez pour voir plus de lieux",
      "en": "🔍 Zoom in to see more places",
      "es": "🔍 Acerca para ver más lugares",
      "it": "🔍 Zoom per vedere più luoghi",
      "pt": "🔍 Aproxime para ver mais lugares",
      "ar": "🔍 كبّر لرؤية المزيد من الأماكن",
      "nl": "🔍 Zoom in om meer plaatsen te zien",
      "de": "🔍 Zoome hinein, um mehr Orte zu sehen"
    },
    "validate": {
      "fr": "✓ Valider",
      "en": "✓ Validate",
      "es": "✓ Validar",
      "it": "✓ Convalida",
      "pt": "✓ Validar",
      "ar": "✓ تأكيد",
      "nl": "✓ Bevestigen",
      "de": "✓ Bestätigen"
    },
    "reset": {
      "fr": "🔄 Réinitialiser",
      "en": "🔄 Reset",
      "es": "🔄 Reiniciar",
      "it": "🔄 Reimposta",
      "pt": "🔄 Reiniciar",
      "ar": "🔄 إعادة تعيين",
      "nl": "🔄 Opnieuw beginnen",
      "de": "🔄 Zurücksetzen"
    },
    "visitsLabel": {
      "fr": "🏛️ Visites possibles",
      "en": "🏛️ Possible visits",
      "es": "🏛️ Visitas posibles",
      "it": "🏛️ Visite possibili",
      "pt": "🏛️ Visitas possíveis",
      "ar": "🏛️ الزيارات الممكنة",
      "nl": "🏛️ Mogelijke bezienswaardigheden",
      "de": "🏛️ Mögliche Sehenswürdigkeiten"
    },
    "activitiesLabel": {
      "fr": "🎯 Activités",
      "en": "🎯 Activities",
      "es": "🎯 Actividades",
      "it": "🎯 Attività",
      "pt": "🎯 Atividades",
      "ar": "🎯 الأنشطة",
      "nl": "🎯 Activiteiten",
      "de": "🎯 Aktivitäten"
    },
    "duration": {
      "fr": "⏱️ Durée estimée",
      "en": "⏱️ Estimated duration",
      "es": "⏱️ Duración estimada",
      "it": "⏱️ Durata stimata",
      "pt": "⏱️ Duração estimada",
      "ar": "⏱️ المدة المقدرة",
      "nl": "⏱️ Geschatte duur",
      "de": "⏱️ Geschätzte Dauer"
    },
    "stepSearchPlaceholder": {
      "fr": "Chercher une étape par nom…",
      "en": "Search a stop by name…",
      "es": "Buscar una etapa por nombre…",
      "it": "Cerca una tappa per nome…",
      "pt": "Procurar uma etapa por nome…",
      "ar": "ابحث عن مرحلة بالاسم…",
      "nl": "Zoek een stop op naam…",
      "de": "Etappe nach Namen suchen…"
    },
    "stepFoundInOrt": {
      "fr": "Trouvé dans OneRoadTrip",
      "en": "Found in OneRoadTrip",
      "es": "Encontrado en OneRoadTrip",
      "it": "Trovato in OneRoadTrip",
      "pt": "Encontrado no OneRoadTrip",
      "ar": "موجود في OneRoadTrip",
      "nl": "Gevonden in OneRoadTrip",
      "de": "In OneRoadTrip gefunden"
    },
    "stepBrut": {
      "fr": "Nouvelle étape (sans visites listées)",
      "en": "New stop (no listed visits)",
      "es": "Nueva etapa (sin visitas listadas)",
      "it": "Nuova tappa (senza visite elencate)",
      "pt": "Nova etapa (sem visitas listadas)",
      "ar": "مرحلة جديدة (بدون زيارات مدرجة)",
      "nl": "Nieuwe stop (geen bezienswaardigheden vermeld)",
      "de": "Neue Etappe (ohne gelistete Sehenswürdigkeiten)"
    },
    "stepNotFound": {
      "fr": "Non trouvé dans les lieux ORT",
      "en": "Not found in ORT places",
      "es": "No encontrado en lugares ORT",
      "it": "Non trovato nei luoghi ORT",
      "pt": "Não encontrado nos locais ORT",
      "ar": "غير موجود في أماكن ORT",
      "nl": "Niet gevonden in de ORT-plaatsen",
      "de": "Nicht in den ORT-Orten gefunden"
    },
    "stepNearby": {
      "fr": "Villes ORT proches",
      "en": "Nearby ORT cities",
      "es": "Ciudades ORT cercanas",
      "it": "Città ORT vicine",
      "pt": "Cidades ORT próximas",
      "ar": "مدن ORT القريبة",
      "nl": "ORT-steden in de buurt",
      "de": "ORT-Städte in der Nähe"
    },
    "stepValidate": {
      "fr": "Valider",
      "en": "Confirm",
      "es": "Validar",
      "it": "Conferma",
      "pt": "Validar",
      "ar": "تأكيد",
      "nl": "Bevestigen",
      "de": "Bestätigen"
    },
    "stepNoCity": {
      "fr": "Aucune ville trouvée",
      "en": "No city found",
      "es": "Ninguna ciudad encontrada",
      "it": "Nessuna città trovata",
      "pt": "Nenhuma cidade encontrada",
      "ar": "لم يتم العثور على مدينة",
      "nl": "Geen stad gevonden",
      "de": "Keine Stadt gefunden"
    },
    "stepSearchUnavailable": {
      "fr": "Recherche indisponible",
      "en": "Search unavailable",
      "es": "Búsqueda no disponible",
      "it": "Ricerca non disponibile",
      "pt": "Pesquisa indisponível",
      "ar": "البحث غير متاح",
      "nl": "Zoeken niet beschikbaar",
      "de": "Suche nicht verfügbar"
    },
    "stepCalc": {
      "fr": "calcul…",
      "en": "calculating…",
      "es": "calculando…",
      "it": "calcolo…",
      "pt": "a calcular…",
      "ar": "جاري الحساب…",
      "nl": "berekenen…",
      "de": "wird berechnet…"
    },
    "stepTagBrut": {
      "fr": "Ville ajoutée",
      "en": "Added city",
      "es": "Ciudad añadida",
      "it": "Città aggiunta",
      "pt": "Cidade adicionada",
      "ar": "مدينة مضافة",
      "nl": "Stad toegevoegd",
      "de": "Stadt hinzugefügt"
    },
    "stepTagOrt": {
      "fr": "Lieu ORT",
      "en": "ORT place",
      "es": "Lugar ORT",
      "it": "Luogo ORT",
      "pt": "Local ORT",
      "ar": "مكان ORT",
      "nl": "ORT-plaats",
      "de": "ORT-Ort"
    },
    "stepAddNext": {
      "fr": "＋  Ajouter l'étape suivante",
      "en": "＋  Add next stop",
      "es": "＋  Añadir la siguiente etapa",
      "it": "＋  Aggiungi la tappa successiva",
      "pt": "＋  Adicionar a próxima etapa",
      "ar": "＋  إضافة المرحلة التالية",
      "nl": "＋  Volgende stop toevoegen",
      "de": "＋  Nächste Etappe hinzufügen"
    },
    "stepAddFirst": {
      "fr": "＋  Ajouter une étape",
      "en": "＋  Add a stop",
      "es": "＋  Añadir una etapa",
      "it": "＋  Aggiungi una tappa",
      "pt": "＋  Adicionar uma etapa",
      "ar": "＋  إضافة مرحلة",
      "nl": "＋  Een stop toevoegen",
      "de": "＋  Eine Etappe hinzufügen"
    },
    "stepVisits": {
      "fr": "visites",
      "en": "visits",
      "es": "visitas",
      "it": "visite",
      "pt": "visitas",
      "ar": "زيارات",
      "nl": "bezienswaardigheden",
      "de": "Sehenswürdigkeiten"
    },
    "stepActivities": {
      "fr": "activités",
      "en": "activities",
      "es": "actividades",
      "it": "attività",
      "pt": "atividades",
      "ar": "أنشطة",
      "nl": "activiteiten",
      "de": "Aktivitäten"
    },
    "stepIntegrateWith": {
      "fr": "Intégrer avec visites et activités",
      "en": "Add with visits and activities",
      "es": "Añadir con visitas y actividades",
      "it": "Aggiungi con visite e attività",
      "pt": "Adicionar com visitas e atividades",
      "ar": "إضافة مع الزيارات والأنشطة",
      "nl": "Toevoegen met bezienswaardigheden en activiteiten",
      "de": "Mit Sehenswürdigkeiten und Aktivitäten hinzufügen"
    },
    "stepIntegrateWithout": {
      "fr": "Intégrer sans visites",
      "en": "Add without visits",
      "es": "Añadir sin visitas",
      "it": "Aggiungi senza visite",
      "pt": "Adicionar sem visitas",
      "ar": "إضافة بدون زيارات",
      "nl": "Toevoegen zonder bezienswaardigheden",
      "de": "Ohne Sehenswürdigkeiten hinzufügen"
    },
    "stepDiffName": {
      "fr": "⚠️ Ville proche, nom différent",
      "en": "⚠️ Nearby city, different name",
      "es": "⚠️ Ciudad cercana, nombre distinto",
      "it": "⚠️ Città vicina, nome diverso",
      "pt": "⚠️ Cidade próxima, nome diferente",
      "ar": "⚠️ مدينة قريبة باسم مختلف",
      "nl": "⚠️ Stad in de buurt, andere naam",
      "de": "⚠️ Stadt in der Nähe, anderer Name"
    },
    "stepDurOther": {
      "fr": "Autre…",
      "en": "Other…",
      "es": "Otro…",
      "it": "Altro…",
      "pt": "Outro…",
      "ar": "أخرى…",
      "nl": "Anders…",
      "de": "Andere…"
    },
    "howtoTitle": {
      "fr": "Comment ça marche",
      "en": "How it works",
      "es": "Cómo funciona",
      "it": "Come funziona",
      "pt": "Como funciona",
      "ar": "كيف يعمل",
      "nl": "Hoe het werkt",
      "de": "So funktioniert es"
    },
    "stepHowto": {
      "fr": "Ajoutez vos étapes une à une : servez-vous de la recherche, ou cliquez directement sur la carte, que l'endroit soit référencé ou non. Si vous dormez plusieurs nuits au même endroit, resélectionnez-le après vos visites autour : le tracé suivra vos allers-retours.",
      "en": "Add your stops one by one: use the search, or click directly on the map, whether the place is listed or not. If you sleep several nights in the same place, select it again after visiting the surroundings: the route will follow your return trips.",
      "es": "Añade tus etapas una a una: usa la búsqueda o haz clic directamente en el mapa, esté el lugar listado o no. Si duerme varias noches en el mismo lugar, vuelva a seleccionarlo tras visitar los alrededores: el trazado seguirá sus idas y vueltas.",
      "it": "Aggiungi le tappe una a una: usa la ricerca o clicca direttamente sulla mappa, che il luogo sia elencato o no. Se dormi più notti nello stesso posto, riselezionalo dopo le visite nei dintorni: il tracciato seguirà i tuoi ritorni.",
      "pt": "Adicione as etapas uma a uma: use a pesquisa ou clique diretamente no mapa, esteja o local listado ou não. Se dormir várias noites no mesmo local, selecione-o novamente após as visitas em redor: o traçado seguirá os seus regressos.",
      "ar": "أضف مراحلك واحدة تلو الأخرى: استخدم البحث أو انقر مباشرة على الخريطة، سواء كان المكان مدرجًا أم لا. إذا كنت تبيت عدة ليالٍ في المكان نفسه، فأعد اختياره بعد زياراتك في المحيط: سيتبع المسار رحلات عودتك.",
      "nl": "Voeg je stops één voor één toe: gebruik de zoekfunctie of klik direct op de kaart, of de plek nu vermeld staat of niet. Slaap je meerdere nachten op dezelfde plek, selecteer die dan opnieuw na je uitstapjes eromheen: de route volgt je heen-en-weerritten.",
      "de": "Füge deine Etappen nacheinander hinzu: über die Suche oder direkt per Klick auf die Karte, egal ob der Ort gelistet ist oder nicht. Übernachtest du mehrere Nächte am selben Ort, wähle ihn nach den Ausflügen in der Umgebung erneut aus: Die Strecke folgt deinen Hin- und Rückwegen."
    },
    "day": {
      "fr": "jour",
      "en": "day",
      "es": "día",
      "it": "giorno",
      "pt": "dia",
      "ar": "يوم",
      "nl": "dag",
      "de": "Tag"
    },
    "days": {
      "fr": "jours",
      "en": "days",
      "es": "días",
      "it": "giorni",
      "pt": "dias",
      "ar": "أيام",
      "nl": "dagen",
      "de": "Tage"
    },
    "minutes": {
      "fr": "min",
      "en": "min",
      "es": "min",
      "it": "min",
      "pt": "min",
      "ar": "دقيقة",
      "nl": "min",
      "de": "Min."
    },
    "emptyItinerary": {
      "fr": "Cliquez sur les lieux pour les ajouter",
      "en": "Click on places to add them",
      "es": "Haz clic en los lugares para añadirlos",
      "it": "Clicca sui luoghi per aggiungerli",
      "pt": "Clique nos lugares para adicioná-los",
      "ar": "انقر على الأماكن لإضافتها",
      "nl": "Klik op plaatsen om ze toe te voegen",
      "de": "Klicke auf Orte, um sie hinzuzufügen"
    },
    "removePlace": {
      "fr": "Retirer",
      "en": "Remove",
      "es": "Eliminar",
      "it": "Rimuovi",
      "pt": "Remover",
      "ar": "إزالة",
      "nl": "Verwijderen",
      "de": "Entfernen"
    },
    "addPlace": {
      "fr": "+ Ajouter à mon itinéraire",
      "en": "+ Add to my itinerary",
      "es": "+ Añadir a mi itinerario",
      "it": "+ Aggiungi al mio itinerario",
      "pt": "+ Adicionar ao meu itinerário",
      "ar": "+ إضافة إلى مساري",
      "nl": "+ Toevoegen aan mijn route",
      "de": "+ Zu meiner Route hinzufügen"
    },
    "removeFromItinerary": {
      "fr": "✕ Retirer de l'itinéraire",
      "en": "✕ Remove from itinerary",
      "es": "✕ Eliminar del itinerario",
      "it": "✕ Rimuovi dall'itinerario",
      "pt": "✕ Remover do itinerário",
      "ar": "✕ إزالة من المسار",
      "nl": "✕ Uit de route verwijderen",
      "de": "✕ Aus der Route entfernen"
    },
    "allCountries": {
      "fr": "-- Tous les pays --",
      "en": "-- All countries --",
      "es": "-- Todos los países --",
      "it": "-- Tutti i paesi --",
      "pt": "-- Todos os países --",
      "ar": "-- جميع البلدان --",
      "nl": "-- Alle landen --",
      "de": "-- Alle Länder --"
    },
    "placesVisible": {
      "fr": "lieux visibles",
      "en": "places visible",
      "es": "lugares visibles",
      "it": "luoghi visibili",
      "pt": "lugares visíveis",
      "ar": "أماكن مرئية",
      "nl": "zichtbare plaatsen",
      "de": "sichtbare Orte"
    },
    "back": {
      "fr": "← Retour",
      "en": "← Back",
      "es": "← Volver",
      "it": "← Indietro",
      "pt": "← Voltar",
      "ar": "← رجوع",
      "nl": "← Terug",
      "de": "← Zurück"
    },
    "legendTitle": {
      "fr": "Lieux",
      "en": "Places",
      "es": "Lugares",
      "it": "Luoghi",
      "pt": "Lugares",
      "ar": "الأماكن",
      "nl": "Plaatsen",
      "de": "Orte"
    },
    "mustSee": {
      "fr": "Incontournable",
      "en": "Must-see",
      "es": "Imprescindible",
      "it": "Imperdibile",
      "pt": "Imperdível",
      "ar": "لا يفوتك",
      "nl": "Niet te missen",
      "de": "Unbedingt sehen"
    },
    "recommended": {
      "fr": "Recommandé",
      "en": "Recommended",
      "es": "Recomendado",
      "it": "Consigliato",
      "pt": "Recomendado",
      "ar": "موصى به",
      "nl": "Aanbevolen",
      "de": "Empfohlen"
    },
    "discover": {
      "fr": "À découvrir",
      "en": "Discover",
      "es": "Por descubrir",
      "it": "Da scoprire",
      "pt": "Para descobrir",
      "ar": "للاكتشاف",
      "nl": "Te ontdekken",
      "de": "Zu entdecken"
    },
    "standard": {
      "fr": "Standard",
      "en": "Standard",
      "es": "Estándar",
      "it": "Standard",
      "pt": "Padrão",
      "ar": "عادي",
      "nl": "Standaard",
      "de": "Standard"
    },
    "selected": {
      "fr": "Sélectionné",
      "en": "Selected",
      "es": "Seleccionado",
      "it": "Selezionato",
      "pt": "Selecionado",
      "ar": "محدد",
      "nl": "Geselecteerd",
      "de": "Ausgewählt"
    },
    "noVisits": {
      "fr": "Aucune visite définie",
      "en": "No visits defined",
      "es": "Sin visitas definidas",
      "it": "Nessuna visita definita",
      "pt": "Nenhuma visita definida",
      "ar": "لا توجد زيارات محددة",
      "nl": "Geen bezienswaardigheden opgegeven",
      "de": "Keine Sehenswürdigkeiten angegeben"
    },
    "noActivities": {
      "fr": "Aucune activité définie",
      "en": "No activities defined",
      "es": "Sin actividades definidas",
      "it": "Nessuna attività definita",
      "pt": "Nenhuma atividade definida",
      "ar": "لا توجد أنشطة محددة",
      "nl": "Geen activiteiten opgegeven",
      "de": "Keine Aktivitäten angegeben"
    },
    "configTitle": {
      "fr": "Configurez votre voyage",
      "en": "Configure your trip",
      "es": "Configura tu viaje",
      "it": "Configura il tuo viaggio",
      "pt": "Configure sua viagem",
      "ar": "إعداد رحلتك",
      "nl": "Stel je reis in",
      "de": "Konfiguriere deine Reise"
    },
    "labelDepartDate": {
      "fr": "Date de départ :",
      "en": "Departure date:",
      "es": "Fecha de salida:",
      "it": "Data di partenza:",
      "pt": "Data de partida:",
      "ar": "تاريخ المغادرة:",
      "nl": "Vertrekdatum:",
      "de": "Abreisedatum:"
    },
    "labelNbDays": {
      "fr": "Nombre de jours souhaités :",
      "en": "Number of days:",
      "es": "Número de días:",
      "it": "Numero di giorni:",
      "pt": "Número de dias:",
      "ar": "عدد الأيام:",
      "nl": "Gewenst aantal dagen:",
      "de": "Gewünschte Anzahl Tage:"
    },
    "labelRythme": {
      "fr": "Rythme :",
      "en": "Pace:",
      "es": "Ritmo:",
      "it": "Ritmo:",
      "pt": "Ritmo:",
      "ar": "الإيقاع:",
      "nl": "Tempo:",
      "de": "Tempo:"
    },
    "labelMaxHotels": {
      "fr": "Changements d'hôtel maximum :",
      "en": "Maximum hotel changes:",
      "es": "Cambios de hotel máximos:",
      "it": "Cambi hotel massimi:",
      "pt": "Mudanças de hotel máximas:",
      "ar": "الحد الأقصى لتغيير الفنادق:",
      "nl": "Maximaal aantal hotelwissels:",
      "de": "Maximale Hotelwechsel:"
    },
    "rythmeSlow": {
      "fr": "Tranquille",
      "en": "Relaxed",
      "es": "Tranquilo",
      "it": "Rilassato",
      "pt": "Tranquilo",
      "ar": "هادئ",
      "nl": "Rustig",
      "de": "Entspannt"
    },
    "rythmeNormal": {
      "fr": "Normal",
      "en": "Normal",
      "es": "Normal",
      "it": "Normale",
      "pt": "Normal",
      "ar": "عادي",
      "nl": "Normaal",
      "de": "Normal"
    },
    "rythmeFast": {
      "fr": "Soutenu",
      "en": "Intensive",
      "es": "Intenso",
      "it": "Intenso",
      "pt": "Intenso",
      "ar": "مكثف",
      "nl": "Stevig",
      "de": "Intensiv"
    },
    "cancel": {
      "fr": "Annuler",
      "en": "Cancel",
      "es": "Cancelar",
      "it": "Annulla",
      "pt": "Cancelar",
      "ar": "إلغاء",
      "nl": "Annuleren",
      "de": "Abbrechen"
    },
    "confirm": {
      "fr": "Valider",
      "en": "Confirm",
      "es": "Validar",
      "it": "Conferma",
      "pt": "Validar",
      "ar": "تأكيد",
      "nl": "Bevestigen",
      "de": "Bestätigen"
    },
    "revisitTitle": {
      "fr": "Étape déjà sélectionnée",
      "en": "Stop already selected",
      "es": "Etapa ya seleccionada",
      "it": "Tappa già selezionata",
      "pt": "Etapa já selecionada",
      "ar": "محطة محددة مسبقاً",
      "nl": "Stop al geselecteerd",
      "de": "Etappe bereits ausgewählt"
    },
    "revisitQuestion": {
      "fr": "{place} fait déjà partie de votre circuit. Que voulez-vous faire ?",
      "en": "{place} is already part of your trip. What would you like to do?",
      "es": "{place} ya forma parte de su circuito. ¿Qué desea hacer?",
      "it": "{place} fa già parte del tuo itinerario. Cosa vuoi fare?",
      "pt": "{place} já faz parte do seu circuito. O que deseja fazer?",
      "ar": "{place} موجودة بالفعل في مسارك. ماذا تريد أن تفعل؟",
      "nl": "{place} maakt al deel uit van je route. Wat wil je doen?",
      "de": "{place} ist bereits Teil deiner Route. Was möchtest du tun?"
    },
    "revisitAgain": {
      "fr": "↩ Revenir à {place}",
      "en": "↩ Return to {place}",
      "es": "↩ Volver a {place}",
      "it": "↩ Tornare a {place}",
      "pt": "↩ Voltar a {place}",
      "ar": "↩ العودة إلى {place}",
      "nl": "↩ Terug naar {place}",
      "de": "↩ Zurück nach {place}"
    },
    "revisitRemove": {
      "fr": "🗑 Retirer cette étape",
      "en": "🗑 Remove this stop",
      "es": "🗑 Quitar esta etapa",
      "it": "🗑 Rimuovere questa tappa",
      "pt": "🗑 Remover esta etapa",
      "ar": "🗑 إزالة هذه المحطة",
      "nl": "🗑 Deze stop verwijderen",
      "de": "🗑 Diese Etappe entfernen"
    },
    "manageStop": {
      "fr": "Gérer cette étape ▾",
      "en": "Manage this stop ▾",
      "es": "Gestionar esta etapa ▾",
      "it": "Gestisci questa tappa ▾",
      "pt": "Gerir esta etapa ▾",
      "ar": "إدارة هذه المحطة ▾",
      "nl": "Deze stop beheren ▾",
      "de": "Diese Etappe verwalten ▾"
    },
    "loopsTitle": {
      "fr": "Boucles",
      "en": "Loops",
      "es": "Bucles",
      "it": "Anelli",
      "pt": "Circuitos",
      "ar": "الحلقات",
      "nl": "Lussen",
      "de": "Schleifen"
    },
    "loopLabel": {
      "fr": "Boucle {n}",
      "en": "Loop {n}",
      "es": "Bucle {n}",
      "it": "Anello {n}",
      "pt": "Circuito {n}",
      "ar": "الحلقة {n}",
      "nl": "Lus {n}",
      "de": "Schleife {n}"
    },
    "linksLabel": {
      "fr": "Liaisons",
      "en": "Transfers",
      "es": "Enlaces",
      "it": "Trasferimenti",
      "pt": "Ligações",
      "ar": "التنقلات",
      "nl": "Verbindingen",
      "de": "Verbindungen"
    },
  "saveTrip": {
    "fr": "Sauvegarder",
    "en": "Save",
    "es": "Guardar",
    "it": "Salva",
    "pt": "Guardar",
    "ar": "حفظ",
    "nl": "Opslaan",
    "de": "Speichern"
  },
  "fullscreen": {
    "fr": "Plein écran",
    "en": "Fullscreen",
    "es": "Pantalla completa",
    "it": "Schermo intero",
    "pt": "Ecrã inteiro",
    "ar": "ملء الشاشة",
    "nl": "Volledig scherm",
    "de": "Vollbild"
  },
  "exitFullscreen": {
    "fr": "Quitter le plein écran",
    "en": "Exit fullscreen",
    "es": "Salir de pantalla completa",
    "it": "Esci da schermo intero",
    "pt": "Sair do ecrã inteiro",
    "ar": "إنهاء ملء الشاشة",
    "nl": "Volledig scherm verlaten",
    "de": "Vollbild beenden"
  }
  };


  // Nom du dossier dans les adresses du site.
  // NE JAMAIS MODIFIER une valeur existante : toutes les URL en dependent.
  var LSLUG = {
    "fr": "itineraires",
    "en": "itineraries",
    "es": "rutas",
    "pt": "roteiros",
    "it": "itinerari",
    "ar": "masar",
    "nl": "routes",
    "de": "routen"
  };

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

  window.ORT_I18N_BUILDER = {
    LANGS: LANGS,
    LSLUG: LSLUG,
    KEYS: KEYS,
    T: parLangue(KEYS)
  };
})();
