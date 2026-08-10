/**
 * ort-i18n-globe.js - TEXTES DE LA PLANISPHERE (globe.html)
 * =========================================================
 * Format : une cle, puis les langues.
 * 8 langues : fr, en, es, it, pt, ar, nl, de
 *
 * "catalog" est le chemin du fichier de donnees par langue,
 * il suit le nom du dossier d URL de chaque langue.
 *
 * A charger AVANT le script de globe.html.
 */
(function () {
  "use strict";
  var LANGS = ["fr","en","es","it","pt","ar","nl","de"];

  var KEYS = {
    "search": {
      "fr": "Rechercher un pays…",
      "en": "Search a country…",
      "es": "Buscar un país…",
      "it": "Cerca un paese…",
      "pt": "Pesquisar um país…",
      "ar": "ابحث عن بلد…",
      "nl": "Zoek een land…",
      "de": "Land suchen…"
    },
    "none": {
      "fr": "Aucun pays trouvé",
      "en": "No country found",
      "es": "Ningún país encontrado",
      "it": "Nessun paese trovato",
      "pt": "Nenhum país encontrado",
      "ar": "لم يتم العثور على بلد",
      "nl": "Geen land gevonden",
      "de": "Kein Land gefunden"
    },
    "hint": {
      "fr": "Glissez pour explorer · molette pour zoomer · cliquez un groupe pour le scinder",
      "en": "Drag to explore · scroll to zoom · click a group to split it",
      "es": "Arrastra para explorar · rueda para hacer zoom · haz clic en un grupo para dividirlo",
      "it": "Trascina per esplorare · rotella per lo zoom · clicca un gruppo per dividerlo",
      "pt": "Arraste para explorar · roda para ampliar · clique num grupo para o dividir",
      "ar": "اسحب للاستكشاف · العجلة للتكبير · انقر على مجموعة لتقسيمها",
      "nl": "Sleep om te verkennen · scroll om te zoomen · klik op een groep om die te splitsen",
      "de": "Ziehen zum Erkunden · Scrollen zum Zoomen · Klicke auf eine Gruppe, um sie aufzuteilen"
    },
    "itins": {
      "fr": "itinéraires",
      "en": "road trips",
      "es": "rutas",
      "it": "itinerari",
      "pt": "roteiros",
      "ar": "رحلات",
      "nl": "routes",
      "de": "Routen"
    },
    "zoomClick": {
      "fr": "cliquez pour zoomer",
      "en": "click to zoom in",
      "es": "haz clic para acercar",
      "it": "clicca per ingrandire",
      "pt": "clique para ampliar",
      "ar": "انقر للتكبير",
      "nl": "klik om in te zoomen",
      "de": "klicken zum Vergrößern"
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
    "km": {
      "fr": "km",
      "en": "km",
      "es": "km",
      "it": "km",
      "pt": "km",
      "ar": "كم",
      "nl": "km",
      "de": "km"
    },
    "stops": {
      "fr": "étapes",
      "en": "stops",
      "es": "etapas",
      "it": "tappe",
      "pt": "etapas",
      "ar": "محطات",
      "nl": "stops",
      "de": "Etappen"
    },
    "nights": {
      "fr": "nuits conseillées",
      "en": "suggested nights",
      "es": "noches recomendadas",
      "it": "notti consigliate",
      "pt": "noites recomendadas",
      "ar": "ليالٍ مقترحة",
      "nl": "aanbevolen nachten",
      "de": "empfohlene Nächte"
    },
    "cta": {
      "fr": "Voir l'itinéraire",
      "en": "View itinerary",
      "es": "Ver la ruta",
      "it": "Vedi l'itinerario",
      "pt": "Ver o roteiro",
      "ar": "عرض المسار",
      "nl": "Bekijk de route",
      "de": "Route ansehen"
    },
    "catalog": {
      "fr": "/itineraires/search-catalog-fr.json",
      "en": "/itineraries/search-catalog-en.json",
      "es": "/rutas/search-catalog-es.json",
      "it": "/itinerari/search-catalog-it.json",
      "pt": "/roteiros/search-catalog-pt.json",
      "ar": "/masar/search-catalog-ar.json",
      "nl": "/routes/search-catalog-nl.json",
      "de": "/routen/search-catalog-de.json"
    }
  };

  var BACK = {
    "fr": "Accueil",
    "en": "Home",
    "es": "Inicio",
    "it": "Home",
    "pt": "Início",
    "ar": "الرئيسية",
    "nl": "Home",
    "de": "Startseite"
  };


  // Nom du dossier dans les adresses du site.
  // NE JAMAIS MODIFIER une valeur existante : toutes les URL en dependent.
  var FOLDERS = {
    "fr": "itineraires",
    "en": "itineraries",
    "es": "rutas",
    "it": "itinerari",
    "pt": "roteiros",
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

  window.ORT_I18N_GLOBE = {
    LANGS: LANGS,
    FOLDERS: FOLDERS,
    KEYS: KEYS,
    BACK: BACK,
    I18N: parLangue(KEYS)
  };
})();
