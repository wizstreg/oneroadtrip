/**
 * OneRoadTrip - Module Devise
 * - Demande la devise du voyage a la 1ere tentative d'import de resa
 * - Stocke la devise par tripId
 * - Fournit le format d'affichage (symbole + montant)
 *
 * Branchement Firestore: voir readStored() / writeStored() plus bas.
 * Aujourd'hui le stockage se fait en localStorage par tripId.
 */

(function (global) {
  'use strict';

  // === LISTE DES DEVISES (les 5 demandees en tete) ===
  // symbol: chaine affichee. Quand pas de symbole propre et clair, on garde le code.
  const TOP = ['EUR', 'USD', 'GBP', 'AUD', 'JPY'];

  const CURRENCIES = {
    EUR: { symbol: '\u20AC',  name: 'Euro' },
    USD: { symbol: '$',       name: 'Dollar US' },
    GBP: { symbol: '\u00A3',  name: 'Livre sterling' },
    AUD: { symbol: 'A$',      name: 'Dollar australien' },
    JPY: { symbol: '\u00A5',  name: 'Yen' },

    AED: { symbol: 'AED',     name: 'Dirham EAU' },
    BRL: { symbol: 'R$',      name: 'Real bresilien' },
    CAD: { symbol: 'C$',      name: 'Dollar canadien' },
    CHF: { symbol: 'CHF',     name: 'Franc suisse' },
    CNY: { symbol: 'CN\u00A5', name: 'Yuan' },
    DKK: { symbol: 'kr',      name: 'Couronne danoise' },
    HKD: { symbol: 'HK$',     name: 'Dollar de Hong Kong' },
    INR: { symbol: '\u20B9',  name: 'Roupie indienne' },
    MAD: { symbol: 'MAD',     name: 'Dirham marocain' },
    MXN: { symbol: 'MX$',     name: 'Peso mexicain' },
    NOK: { symbol: 'kr',      name: 'Couronne norvegienne' },
    NZD: { symbol: 'NZ$',     name: 'Dollar neo-zelandais' },
    PLN: { symbol: 'z\u0142', name: 'Zloty' },
    SEK: { symbol: 'kr',      name: 'Couronne suedoise' },
    SGD: { symbol: 'S$',      name: 'Dollar de Singapour' },
    THB: { symbol: '\u0E3F',  name: 'Baht' },
    TND: { symbol: 'TND',     name: 'Dinar tunisien' },
    TRY: { symbol: '\u20BA',  name: 'Livre turque' },
    ZAR: { symbol: 'R',       name: 'Rand' }
  };

  // Ordre d'affichage: les 5 en tete, puis le reste par code.
  function orderedCodes() {
    const rest = Object.keys(CURRENCIES).filter(c => !TOP.includes(c)).sort();
    return [...TOP, ...rest];
  }

  // === I18N (question + aide + bouton) ===
  const I18N = {
    fr: { question: 'Quelle est la devise de votre voyage ?', hint: 'Tous les montants des reservations seront convertis dans cette devise.', confirm: 'Valider' },
    en: { question: 'What is your trip currency?', hint: 'All booking amounts will be converted to this currency.', confirm: 'Confirm' },
    es: { question: '\u00BFCu\u00E1l es la moneda de tu viaje?', hint: 'Todos los importes de las reservas se convertir\u00E1n a esta moneda.', confirm: 'Confirmar' },
    it: { question: 'Qual \u00E8 la valuta del tuo viaggio?', hint: 'Tutti gli importi delle prenotazioni saranno convertiti in questa valuta.', confirm: 'Conferma' },
    pt: { question: 'Qual \u00E9 a moeda da sua viagem?', hint: 'Todos os valores das reservas ser\u00E3o convertidos para esta moeda.', confirm: 'Confirmar' },
    ar: { question: '\u0645\u0627 \u0647\u064A \u0639\u0645\u0644\u0629 \u0631\u062D\u0644\u062A\u0643\u061F', hint: '\u0633\u064A\u062A\u0645 \u062A\u062D\u0648\u064A\u0644 \u062C\u0645\u064A\u0639 \u0627\u0644\u0645\u0628\u0627\u0644\u063A \u0625\u0644\u0649 \u0647\u0630\u0647 \u0627\u0644\u0639\u0645\u0644\u0629.', confirm: '\u062A\u0623\u0643\u064A\u062F' }
  };

  function tr(lang, key) {
    return (I18N[lang] && I18N[lang][key]) || I18N.fr[key] || key;
  }

  // === STOCKAGE (localStorage par tripId pour l'instant) ===
  // TODO Firestore: remplacer le corps de readStored/writeStored par l'appel
  // au setter de ORT_TRIP_DATA une fois son API confirmee.
  function storageKey(tripId) {
    return 'ort_trip_currency_' + (tripId || 'default');
  }

  function readStored(tripId) {
    try {
      const v = localStorage.getItem(storageKey(tripId));
      return v && CURRENCIES[v] ? v : null;
    } catch (e) {
      return null;
    }
  }

  function writeStored(tripId, code) {
    try {
      localStorage.setItem(storageKey(tripId), code);
    } catch (e) {
      console.warn('[CURRENCY] Stockage impossible:', e);
    }
  }

  // tripId depuis l'URL ou l'etat global, comme fait ort-budget
  function currentTripId() {
    const params = new URLSearchParams(location.search);
    return params.get('tripId') || params.get('id') ||
      (global.state && global.state.tripId) ||
      (global.ORT_TRIPID ? global.ORT_TRIPID.get() : null);
  }

  function getTripCurrency(tripId) {
    return readStored(tripId || currentTripId());
  }

  function setTripCurrency(tripId, code) {
    if (!CURRENCIES[code]) return null;
    writeStored(tripId || currentTripId(), code);
    return code;
  }

  // === FORMAT D'AFFICHAGE ===
  function getSymbol(code) {
    return (CURRENCIES[code] && CURRENCIES[code].symbol) || code || '';
  }

  // decimals null => entier. Espace insecable entre montant et symbole.
  function format(amount, code, decimals) {
    const n = Number(amount) || 0;
    const d = (decimals == null) ? 0 : decimals;
    return n.toFixed(d) + '\u00A0' + getSymbol(code || 'EUR');
  }

  // Symbole a afficher pour une resa: sa devise si presente, sinon la devise voyage.
  function symbolForBooking(b) {
    const cur = (b && b.price && typeof b.price === 'object' && b.price.currency)
      ? String(b.price.currency)
      : (getTripCurrency() || 'EUR');
    return getSymbol(cur);
  }

  // === CONVERSION (API de taux gratuite, sans cle) ===
  const FX_BASES = [
    'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies',
    'https://latest.currency-api.pages.dev/v1/currencies'
  ];

  async function fetchRate(from, to) {
    const f = String(from || '').toLowerCase();
    const t = String(to || '').toLowerCase();
    if (!f || !t) return null;
    for (const base of FX_BASES) {
      try {
        const res = await fetch(base + '/' + f + '.json');
        if (!res.ok) continue;
        const data = await res.json();
        const rate = data && data[f] && data[f][t];
        if (typeof rate === 'number' && isFinite(rate)) return rate;
      } catch (e) { /* on tente la base suivante */ }
    }
    return null;
  }

  // Convertit un montant. Retourne le montant converti, ou null si taux indispo.
  async function convert(amount, from, to) {
    const a = Number(amount);
    if (!isFinite(a)) return null;
    const f = String(from || '').toUpperCase();
    const tt = String(to || '').toUpperCase();
    if (!f || !tt) return null;
    if (f === tt) return a;
    const rate = await fetchRate(f, tt);
    if (rate == null) return null;
    return a * rate;
  }

  // === MODALE DE CHOIX ===
  function buildOptions() {
    return orderedCodes().map(code => {
      const c = CURRENCIES[code];
      const label = code + ' - ' + c.name + (c.symbol && c.symbol !== code ? ' (' + c.symbol + ')' : '');
      return '<option value="' + code + '">' + label + '</option>';
    }).join('');
  }

  function showModal(lang) {
    return new Promise(function (resolve) {
      const wrap = document.createElement('div');
      wrap.id = 'ortCurrencyModal';
      wrap.setAttribute('style',
        'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:2000;display:flex;align-items:center;justify-content:center;');

      const dir = (lang === 'ar') ? 'rtl' : 'ltr';

      wrap.innerHTML =
        '<div dir="' + dir + '" style="background:#fff;border-radius:12px;max-width:420px;width:90%;padding:24px;box-shadow:0 8px 32px rgba(0,0,0,0.2);">' +
          '<h2 style="margin:0 0 8px;font-size:1.2rem;color:#113f7a;">' + tr(lang, 'question') + '</h2>' +
          '<p style="margin:0 0 16px;font-size:0.9rem;color:#64748b;">' + tr(lang, 'hint') + '</p>' +
          '<select id="ortCurrencySelect" style="width:100%;padding:10px;border:1px solid #cbd5e1;border-radius:8px;font-size:1rem;margin-bottom:16px;">' +
            buildOptions() +
          '</select>' +
          '<button id="ortCurrencyConfirm" style="width:100%;padding:12px;background:#113f7a;color:#fff;border:none;border-radius:8px;font-size:1rem;font-weight:600;cursor:pointer;">' +
            tr(lang, 'confirm') +
          '</button>' +
        '</div>';

      document.body.appendChild(wrap);

      const select = wrap.querySelector('#ortCurrencySelect');
      const confirm = wrap.querySelector('#ortCurrencyConfirm');

      confirm.addEventListener('click', function () {
        const code = select.value;
        document.body.removeChild(wrap);
        resolve(code);
      });
    });
  }

  /**
   * Garantit qu'une devise existe pour le voyage.
   * - Si deja choisie: resout direct.
   * - Sinon: affiche la modale, stocke, resout.
   * A appeler AVANT le 1er import de resa.
   * @returns {Promise<string>} code devise (ex: 'EUR')
   */
  async function ensureTripCurrency(tripId, lang) {
    const id = tripId || currentTripId();
    const existing = readStored(id);
    if (existing) return existing;

    const chosen = await showModal(lang || (global.ORT_LANG) || 'fr');
    writeStored(id, chosen);
    return chosen;
  }

  // === EXPORT ===
  const ORT_CURRENCY = {
    CURRENCIES,
    TOP,
    orderedCodes,
    getTripCurrency,
    setTripCurrency,
    ensureTripCurrency,
    getSymbol,
    format,
    symbolForBooking,
    convert
  };

  global.ORT_CURRENCY = ORT_CURRENCY;

})(typeof window !== 'undefined' ? window : this);
