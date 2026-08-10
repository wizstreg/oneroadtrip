/**
 * ort-hotels-v3.js
 *
 * V3 — Affichage des hôtels dans les pages roadtrip (detail + mobile).
 * Lit les shards V3 (hotels/{CC}/{lettre}.json) qui contiennent les nouveaux champs :
 *   priceLevel, imageUrl2, description_fr/en/es/pt/it
 *
 * --- MODALE DESKTOP ---
 *  - Grande carte centrale (l'hôtel "actif", par défaut le $$ recommandé)
 *  - 2 miniatures latérales cliquables (les autres gammes)
 *  - Au clic sur une miniature, elle devient la grande carte (swap instantané)
 *  - Auto-rotation des 2 photos toutes les 4s sur la grande carte
 *  - Bouton "Voir sur Booking" sur la grande carte
 *  - Bouton "Choisir sur la carte" Stay22 dans le footer (inchangé)
 *
 * --- MODALE MOBILE ---
 *  - 1 seule carte visible avec flèches ‹ ›
 *  - Infos en overlay sur la photo (nom, score, prix, badge)
 *  - Tap sur la carte ouvre une vue détaillée (description longue + 2 photos)
 *  - Pas d'auto-rotation
 *
 * --- DESCRIPTIONS ---
 *  Cascade : langue user -> EN -> rien (PAS de fallback FR).
 *
 * --- COMPATIBILITÉ ---
 *  Drop-in remplacement de ort-hotels.js : même API exportée
 *  (openHotelsModal, closeHotelsModal, etc.)
 */

(function(global) {
  'use strict';

  // === CONFIG ===
  const CONFIG = {
    hotelsBaseUrl: '/hotels',
    cacheTimeout: 3600000, // 1 h
    stay22AID: 'oneroadtrip',
    rotationInterval: 4000 // ms
  };

  const CACHE = { data: {}, timestamps: {} };

  // === I18N ===
  const I18N = {
    topHotels: { fr: 'Meilleurs hôtels', en: 'Top hotels', es: 'Mejores hoteles', pt: 'Melhores hotéis', it: 'Migliori hotel', ar: 'أفضل الفنادق' , nl: 'Beste hotels', de: 'Top-Hotels'},
    chooseOnMap: { fr: 'Choisir sur la carte', en: 'Choose on map', es: 'Elegir en el mapa', pt: 'Escolher no mapa', it: 'Scegli sulla mappa', ar: 'اختر على الخريطة' , nl: 'Kiezen op de kaart', de: 'Auf der Karte auswählen'},
    loading: { fr: 'Chargement des hôtels...', en: 'Loading hotels...', es: 'Cargando hoteles...', pt: 'Carregando hotéis...', it: 'Caricamento hotel...', ar: 'جار تحميل الفنادق...' , nl: 'Hotels laden...', de: 'Hotels werden geladen...'},
    noHotels: { fr: 'Aucun hôtel disponible', en: 'No hotels available', es: 'No hay hoteles disponibles', pt: 'Nenhum hotel disponível', it: 'Nessun hotel disponibile', ar: 'لا توجد فنادق متاحة' , nl: 'Geen hotels beschikbaar', de: 'Keine Hotels verfügbar'},
    midRange: { fr: 'Milieu de gamme', en: 'Mid-range', es: 'Gama media', pt: 'Gama média', it: 'Fascia media', ar: 'متوسط' , nl: 'Middenklasse', de: 'Mittelklasse'},
    economic: { fr: 'Économique', en: 'Budget', es: 'Económico', pt: 'Económico', it: 'Economico', ar: 'اقتصادي' , nl: 'Voordelig', de: 'Günstig'},
    premium: { fr: 'Premium', en: 'Premium', es: 'Premium', pt: 'Premium', it: 'Premium', ar: 'فاخر' , nl: 'Premium', de: 'Premium'},
    seeOnBooking: { fr: 'Voir sur Booking', en: 'See on Booking', es: 'Ver en Booking', pt: 'Ver no Booking', it: 'Vedi su Booking', ar: 'عرض على Booking' , nl: 'Bekijken op Booking', de: 'Auf Booking ansehen'},
    prev: { fr: 'Précédent', en: 'Previous', es: 'Anterior', pt: 'Anterior', it: 'Precedente', ar: 'السابق' , nl: 'Vorige', de: 'Zurück'},
    next: { fr: 'Suivant', en: 'Next', es: 'Next', pt: 'Seguinte', it: 'Successivo', ar: 'التالي' , nl: 'Volgende', de: 'Weiter'},
    eliteBadge: { fr: '★ Coup de cœur', en: '★ Top pick', es: '★ Nuestra favorita', pt: '★ Nosso favorito', it: '★ La nostra preferita', ar: '★ المفضل لدينا' , nl: '★ Onze favoriet', de: '★ Unser Favorit'},
    sePitch: {
      fr: 'Et si vous vous laissiez tenter par un des hôtels que nous proposons ? Même si vous prenez un autre hôtel par la suite, cliquer sur nos liens permet de gagner quelques $ et nous permettre de conserver le site gratuit.',
      en: 'What if you treated yourself to one of the hotels we suggest? Even if you book a different hotel later, clicking our links earns us a few $ and helps keep this site free.',
      es: '¿Y si se deja tentar por uno de los hoteles que le proponemos? Aunque luego elija otro hotel, hacer clic en nuestros enlaces nos aporta unos $ y nos permite mantener el sitio gratuito.',
      pt: 'E se se deixasse tentar por um dos hotéis que propomos? Mesmo que depois escolha outro hotel, clicar nos nossos links rende-nos alguns $ e permite-nos manter o site gratuito.',
      it: 'E se vi lasciaste tentare da uno degli hotel che vi proponiamo? Anche se poi sceglierete un altro hotel, cliccare sui nostri link ci fa guadagnare qualche $ e ci permette di mantenere il sito gratuito.',
      ar: 'ماذا لو جرّبتم أحد الفنادق التي نقترحها؟ حتى لو اخترتم فندقًا آخر لاحقًا، فإن النقر على روابطنا يمنحنا بضعة دولارات ويساعدنا على إبقاء الموقع مجانيًا.'
    , nl: 'Waarom niet een van de hotels die wij voorstellen? Ook als je later een ander hotel boekt, levert een klik op onze links ons een paar dollar op en houdt de site gratis.', de: 'Wie wäre es mit einem der Hotels, die wir vorschlagen? Auch wenn du später ein anderes Hotel buchst, bringt ein Klick auf unsere Links ein paar Dollar ein und hält die Seite kostenlos.'}
  };

  function t(key) {
    const lang = getLang();
    return (I18N[key] && I18N[key][lang]) || (I18N[key] && I18N[key].en) || key;
  }

  // === UTILS ===
  function getLang() {
    return (localStorage.getItem('lang') || document.documentElement.lang || 'fr').slice(0, 2);
  }

  function getBookingLangSuffix() {
    const lang = getLang();
    return ({ fr: 'fr', en: 'en-gb', es: 'es', pt: 'pt-pt', it: 'it', ar: 'ar' , nl: 'nl', de: 'de'})[lang] || 'en-gb';
  }

  function getCountryCode() {
    return (window.CC || (window.state && (window.state.cc || window.state.country)) || 'FR').toUpperCase();
  }

  function parsePlaceId(placeId) {
    if (!placeId || typeof placeId !== 'string') return null;
    const parts = placeId.split('::');
    if (parts.length < 2) return null;
    return {
      country: parts[0].toUpperCase(),
      slug: parts[1],
      initial: parts[1][0].toLowerCase()
    };
  }

  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function bigImg(url) {
    if (!url) return '';
    return url.replace('square240', 'square600');
  }

  function priceSymbol(level) {
    if (level === 1) return '$';
    if (level === 3) return '$$$';
    return '$$';
  }

  function pickDescription(hotel, lang) {
    const key = 'description_' + lang;
    if (hotel[key] && hotel[key].trim()) return hotel[key].trim();
    if (hotel.description_en && hotel.description_en.trim()) return hotel.description_en.trim();
    return null;
  }

  function levelLabel(level) {
    if (level === 1) return t('economic');
    if (level === 3) return t('premium');
    return t('midRange');
  }

  // Couleur stable de fallback si la photo plante
  function colorFromName(name) {
    if (!name) return '#94a3b8';
    let hash = 0;
    for (let i = 0; i < name.length; i++) { hash = ((hash << 5) - hash) + name.charCodeAt(i); hash |= 0; }
    const palette = ['#0f4c75', '#3282b8', '#bbe1fa', '#f4a261', '#e76f51', '#2a9d8f', '#264653', '#e9c46a', '#8d6e63', '#5d4037', '#1b9aaa', '#ef476f'];
    return palette[Math.abs(hash) % palette.length];
  }

  function buildBookingAffiliateUrl(originalUrl) {
    if (!originalUrl) return '#';
    const m = originalUrl.match(/https:\/\/www\.booking\.com\/hotel\/([a-z]{2})\/([^.?]+)/);
    if (!m) return originalUrl;
    return 'https://www.booking.com/hotel/' + m[1] + '/' + m[2] + '.' + getBookingLangSuffix() + '.html';
  }

  function buildStay22Url(placeName, coords) {
    if (window.ORT_PARTNERS && window.ORT_PARTNERS.AFFILIATE && window.ORT_PARTNERS.AFFILIATE.stay22) {
      return window.ORT_PARTNERS.AFFILIATE.stay22(placeName, coords, getLang());
    }
    const lat = parseFloat(coords && coords[0]) || 0;
    const lng = parseFloat(coords && coords[1]) || 0;
    if (!lat || !lng) {
      const params = new URLSearchParams({ aid: CONFIG.stay22AID, address: placeName, maincolor: '113f7a' });
      return 'https://www.stay22.com/embed/gm?' + params.toString();
    }
    const params = new URLSearchParams({
      aid: CONFIG.stay22AID, lat: lat.toFixed(6), lng: lng.toFixed(6),
      venue: placeName, maincolor: '113f7a',
      markerimage: 'https://www.oneroadtrip.com/assets/marker-ort.png'
    });
    return 'https://www.stay22.com/embed/gm?' + params.toString();
  }

  // === SÉLECTION DES 3 HÔTELS ($/$$/$$$) ===
  // Si un hotel a "elite:true", il prend son slot prix et passe en premier dans le retour.
  function pickThreeHotels(hotels) {
    if (!hotels || !hotels.length) return [];
    let eliteHotel = null;
    for (let k = 0; k < hotels.length; k++) {
      if (hotels[k] && hotels[k].elite === true) { eliteHotel = hotels[k]; break; }
    }
    const eliteLevel = eliteHotel ? (eliteHotel.priceLevel || 2) : null;
    const byLevel = { 1: [], 2: [], 3: [] };
    hotels.forEach(h => {
      if (h === eliteHotel) return;
      const lvl = h.priceLevel || 2;
      if (!byLevel[lvl]) byLevel[lvl] = [];
      byLevel[lvl].push(h);
    });
    const bestOf = arr => {
      if (!arr || !arr.length) return null;
      return arr.slice().sort((a, b) => (parseFloat(b.score) || 0) - (parseFloat(a.score) || 0))[0];
    };
    const slot1 = (eliteLevel === 1) ? eliteHotel : bestOf(byLevel[1]);
    const slot2 = (eliteLevel === 2) ? eliteHotel : bestOf(byLevel[2]);
    const slot3 = (eliteLevel === 3) ? eliteHotel : bestOf(byLevel[3]);
    const bag = [];
    if (slot1) bag.push({ hotel: slot1, level: 1, elite: slot1 === eliteHotel });
    if (slot2) bag.push({ hotel: slot2, level: 2, elite: slot2 === eliteHotel });
    if (slot3) bag.push({ hotel: slot3, level: 3, elite: slot3 === eliteHotel });
    if (bag.length < 3) {
      const used = bag.map(r => r.hotel);
      const remaining = hotels.filter(h => used.indexOf(h) === -1);
      remaining.sort((a, b) => (parseFloat(b.score) || 0) - (parseFloat(a.score) || 0));
      for (let i = 0; i < remaining.length && bag.length < 3; i++) {
        bag.push({ hotel: remaining[i], level: remaining[i].priceLevel || 2, elite: remaining[i].elite === true });
      }
    }
    bag.sort((a, b) => {
      if (a.elite && !b.elite) return -1;
      if (!a.elite && b.elite) return 1;
      return 0;
    });
    return bag;
  }

  // Collecte ordonnée des photos d'un hotel : imageUrl, imageUrl2, imageUrl3, imageUrl4, ...
  function collectPhotos(hotel) {
    if (!hotel) return [];
    const out = [];
    const seen = {};
    const push = u => {
      if (!u) return;
      const big = bigImg(u);
      if (seen[big]) return;
      seen[big] = 1;
      out.push(big);
    };
    push(hotel.imageUrl);
    const nums = [];
    for (const key in hotel) {
      if (!Object.prototype.hasOwnProperty.call(hotel, key)) continue;
      const m = key.match(/^imageUrl(\d+)$/);
      if (m && hotel[key]) nums.push(parseInt(m[1], 10));
    }
    nums.sort((a, b) => a - b);
    nums.forEach(n => push(hotel['imageUrl' + n]));
    return out;
  }

  // Ordre d'affichage : l'hotel mis en avant d'abord, les autres en secours invisibles.
  function orderHotels(hotels) {
    if (!hotels || !hotels.length) return [];
    const list = hotels.filter(h => h && (h.name || h.bookingUrl));
    if (!list.length) return [];
    const featured = pickFeaturedHotel(list);
    const rest = list.filter(h => h !== featured).sort((a, b) => {
      const pa = collectPhotos(a).length, pb = collectPhotos(b).length;
      if (pb !== pa) return pb - pa;
      return (parseFloat(b.score) || 0) - (parseFloat(a.score) || 0);
    });
    return [featured].concat(rest).map(h => ({
      hotel: h,
      level: h.priceLevel || 2,
      elite: h.elite === true,
      photos: collectPhotos(h)
    }));
  }

  // === CHARGEMENT DES DONNÉES (depuis les shards) ===
  async function loadHotelsForPlace(placeId) {
    const parsed = parsePlaceId(placeId);
    if (!parsed) {
      console.warn('[ORT-HOTELS-V3] PlaceId invalide :', placeId);
      return null;
    }
    const cacheKey = parsed.country + '/' + parsed.initial;
    const now = Date.now();
    if (CACHE.data[cacheKey] && (now - CACHE.timestamps[cacheKey]) < CONFIG.cacheTimeout) {
      return CACHE.data[cacheKey][placeId] || null;
    }
    const url = CONFIG.hotelsBaseUrl + '/' + parsed.country + '/' + parsed.initial + '.json';
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.warn('[ORT-HOTELS-V3] Fichier introuvable :', url);
        return null;
      }
      const data = await res.json();
      CACHE.data[cacheKey] = data;
      CACHE.timestamps[cacheKey] = now;
      return data[placeId] || null;
    } catch (e) {
      console.error('[ORT-HOTELS-V3] Erreur chargement :', url, e);
      return null;
    }
  }

  // === RENDU : UN SEUL HOTEL VISIBLE (desktop + mobile) ===
  // Les autres hotels du lieu restent en secours, invisibles. Si une photo casse
  // on passe a la suivante ; si toutes cassent, on bascule sur l'hotel de secours.
  function renderSingleHotel(ordered, modalContainer) {
    const lang = getLang();
    const backups = ordered.slice(1);
    let timer = null;
    let paused = false;

    function paint(entry) {
      const h = entry.hotel;
      const isElite = !!entry.elite;
      const name = h.name || '';
      const score = h.score || '';
      const photos = (entry.photos && entry.photos.length) ? entry.photos : [];
      const url = buildBookingAffiliateUrl(h.bookingUrl);
      const desc = pickDescription(h, lang);
      const fbColor = colorFromName(name);
      const initial = (name.charAt(0) || '?').toUpperCase();
      const lvLabel = levelLabel(entry.level);
      const badgeH = isElite
        ? '<div class="ohv3-elite-badge">' + esc(t('eliteBadge')) + '</div>'
        : '';
      const imgsH = photos.map((src, i) =>
        '<img class="ohv3-mimg' + (i === 0 ? ' ohv3-img-on' : '') + '" data-ohv3-pidx="' + i +
        '" src="' + esc(src) + '" alt="' + esc(name) + '" loading="lazy">'
      ).join('');

      modalContainer.innerHTML =
        '<div class="ohv3-mwrap">' +
          '<div class="ohv3-mtrack" style="background:' + fbColor + '">' +
            '<div class="ohv3-img-fallback"><span>' + esc(initial) + '</span></div>' +
            imgsH +
            '<div class="ohv3-moverlay">' +
              badgeH +
              '<div class="ohv3-mprice">' + priceSymbol(entry.level) + '</div>' +
              '<div class="ohv3-minfo">' +
                '<div class="ohv3-mname">' + esc(name) + '</div>' +
                '<div class="ohv3-mmeta">' +
                  (score ? '<span class="ohv3-score">' + esc(score) + '</span>' : '') +
                  '<span class="ohv3-mlevel">' + esc(lvLabel) + '</span>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          (desc ? '<p class="ohv3-mobile-desc">' + esc(desc) + '</p>' : '') +
          '<a class="ohv3-mobile-cta" href="' + esc(url) + '" target="_blank" rel="noopener sponsored">' + esc(t('seeOnBooking')) + '</a>' +
        '</div>';

      const track = modalContainer.querySelector('.ohv3-mtrack');
      const imgs = [].slice.call(modalContainer.querySelectorAll('.ohv3-mimg'));

      // Clic sur la photo = lien affilie (comme le bouton)
      if (track && url) {
        track.style.cursor = 'pointer';
        track.addEventListener('click', () => window.open(url, '_blank', 'noopener'));
      }

      function show(img) {
        if (!img) return;
        imgs.forEach(o => o.classList.remove('ohv3-img-on'));
        img.classList.add('ohv3-img-on');
      }

      function nextBackup() {
        if (timer) { clearInterval(timer); timer = null; }
        const b = backups.shift();
        if (!b) {
          modalContainer.innerHTML = '<div class="ohv3-loading">' + esc(t('noHotels')) + '</div>';
          return;
        }
        if (!b.photos || !b.photos.length) return nextBackup();
        paint(b);
      }

      function photoFailed(img) {
        img.setAttribute('data-ohv3-dead', '1');
        img.classList.remove('ohv3-img-on');
        img.style.display = 'none';
        const alive = imgs.filter(o => !o.getAttribute('data-ohv3-dead'));
        if (!alive.length) {
          reportBrokenHotel(name, url, img.getAttribute('src') || '');
          nextBackup();
          return;
        }
        show(alive[0]);
      }

      imgs.forEach(img => {
        img.addEventListener('error', () => photoFailed(img));
        if (img.complete && img.naturalWidth === 0) photoFailed(img);
      });

      if (track) {
        track.addEventListener('mouseenter', () => { paused = true; });
        track.addEventListener('mouseleave', () => { paused = false; });
      }

      if (timer) { clearInterval(timer); timer = null; }
      if (imgs.length > 1) {
        timer = setInterval(() => {
          if (!document.body.contains(track)) { clearInterval(timer); timer = null; return; }
          if (paused) return;
          const alive = imgs.filter(o => !o.getAttribute('data-ohv3-dead'));
          if (alive.length < 2) return;
          const cur = modalContainer.querySelector('.ohv3-mimg.ohv3-img-on');
          const pos = alive.indexOf(cur);
          show(alive[(pos + 1) % alive.length]);
        }, CONFIG.rotationInterval);
      }
    }

    paint(ordered[0]);
  }

  // Signalement d'un hotel dont toutes les photos sont mortes (repare dans l'admin).
  function reportBrokenHotel(name, book, url) {
    try {
      if (!name) return;
      const seen = JSON.parse(sessionStorage.getItem('ohv3_reported') || '[]');
      if (seen.indexOf(name) !== -1) return;
      seen.push(name);
      sessionStorage.setItem('ohv3_reported', JSON.stringify(seen));
      let cc = '', slug = '';
      const m = (book || '').match(/booking\.com\/hotel\/([a-z]{2})\/([^.?]+)/);
      if (m) { cc = m[1]; slug = m[2]; }
      let id = (cc + '__' + slug) || name;
      id = id.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 180);
      const body = { fields: {
        name: { stringValue: name }, cc: { stringValue: cc }, slug: { stringValue: slug },
        bookingUrl: { stringValue: book || '' }, brokenUrl: { stringValue: url || '' },
        ts: { timestampValue: new Date().toISOString() }
      } };
      const api = 'https://firestore.googleapis.com/v1/projects/oneroadtrip-prod/databases/(default)/documents/broken_hotel_photos?documentId=' + encodeURIComponent(id);
      fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => {});
    } catch (e) {}
  }

  // === MODALE ===
  function openHotelsModal(step) {
    const modal = document.getElementById('hotelsModal');
    if (!modal) {
      console.warn('[ORT-HOTELS-V3] Modale hotelsModal introuvable');
      return;
    }

    const placeName = (step && step.name) || 'cette destination';
    const placeId = step && step.place_id;
    const sLat = parseFloat((step && (step.lat || step.latitude))) || 0;
    const sLng = parseFloat((step && (step.lng || step.lon || step.longitude))) || 0;
    const coords = (step && step.coords) || (sLat && sLng ? [sLat, sLng] : [0, 0]);

    const titleEl = document.getElementById('hotelsModalTitle');
    const containerEl = document.getElementById('hotelsModalContainer');
    const chooseBtn = document.getElementById('hotelsModalChooseMap');

    if (titleEl) titleEl.textContent = t('topHotels') + ' - ' + placeName;
    if (containerEl) containerEl.innerHTML = '<div class="ohv3-loading">' + esc(t('loading')) + '</div>';

    // Fallback : si pas d'hôtels, on affiche une carte Stay22 intégrée dans la modale.
    // Plus utile que "Aucun hôtel disponible" : l'utilisateur voit la zone et peut explorer.
    function renderStay22Fallback() {
      if (!containerEl) return;
      const stay22Url = buildStay22Url(placeName, coords);
      containerEl.innerHTML =
        '<div class="ohv3-stay22-wrap">' +
          '<iframe class="ohv3-stay22-iframe" src="' + esc(stay22Url) + '" ' +
            'frameborder="0" loading="lazy" ' +
            'allow="geolocation" ' +
            'title="Stay22 map for ' + esc(placeName) + '"></iframe>' +
        '</div>';
    }

    loadHotelsForPlace(placeId).then(placeData => {
      if (!placeData || !placeData.hotels || placeData.hotels.length === 0) {
        renderStay22Fallback();
        return;
      }
      const ordered = orderHotels(placeData.hotels);
      if (!ordered.length) {
        renderStay22Fallback();
        return;
      }
      // Un seul hotel visible, meme rendu desktop et mobile.
      renderSingleHotel(ordered, containerEl);
    }).catch(err => {
      console.error('[ORT-HOTELS-V3] Erreur :', err);
      // En cas d'erreur réseau aussi, on tente la carte Stay22 (mieux que rien)
      renderStay22Fallback();
    });

    // Bouton Stay22 (footer, inchangé)
    if (chooseBtn) {
      chooseBtn.href = buildStay22Url(placeName, coords);
      chooseBtn.innerHTML = '<span class="hotel-choose-icon">🗺️</span><span>' + esc(t('chooseOnMap')) + '</span>';
    }

    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function closeHotelsModal() {
    const modal = document.getElementById('hotelsModal');
    if (modal) {
      modal.classList.remove('show');
      document.body.style.overflow = '';
    }
  }

  // === CSS injecté une seule fois au load ===
  function injectCSS() {
    if (document.getElementById('ort-hotels-v3-css')) return;
    const style = document.createElement('style');
    style.id = 'ort-hotels-v3-css';
    style.textContent = [
      // Communs
      '.ohv3-loading,.ohv3-empty{padding:32px;text-align:center;color:#64748b;font-size:0.95rem}',
      // Iframe Stay22 quand on n'a pas d'hôtels scrapés
      '.ohv3-stay22-wrap{padding:0;background:#f8fafc}',
      '.ohv3-stay22-iframe{display:block;width:100%;height:520px;border:0;border-radius:0}',
      '@media(max-width:720px){.ohv3-stay22-iframe{height:60vh;min-height:380px}}',
      '.ohv3-img-fallback{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:0;color:#fff;font-size:3rem;font-weight:700;letter-spacing:.05em;background:linear-gradient(135deg,rgba(255,255,255,0.15),rgba(0,0,0,0.15))}',
      '.ohv3-fb-small{font-size:1.6rem}',
      '.ohv3-score{flex-shrink:0;background:#003b95;color:#fff;font-weight:700;font-size:0.82rem;padding:3px 7px;border-radius:6px;line-height:1.1}',
      '.ohv3-badge{position:absolute;top:10px;left:10px;z-index:3;background:#f59e0b;color:#fff;font-size:0.72rem;font-weight:700;padding:4px 10px;border-radius:999px;letter-spacing:.02em;box-shadow:0 2px 6px rgba(245,158,11,0.35)}',

      // === MODALE ÉLARGIE (override du CSS de ort-hotels.css) ===
      // V3 : la modale était trop étroite pour 3 cartes côte à côte avec accordéon.
      '#hotelsModal .hotels-modal-content{max-width:1100px;width:95%}',
      '@media(max-width:720px){#hotelsModal .hotels-modal-content{max-width:100%;width:100%}}',

      // === DESKTOP : ACCORDÉON HORIZONTAL ===
      // Les 3 cartes restent côte à côte. La carte active s'élargit, les 2 autres se compriment.
      // C'est grid-template-columns sur le wrap qui fait toute la magie.
      '.ohv3-acc-wrap{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;padding:16px 20px;transition:grid-template-columns .35s ease}',
      // Carte expanded (colonne plus large) selon data-ohv3-active
      '.ohv3-acc-wrap[data-ohv3-active="0"]{grid-template-columns:2.6fr 1fr 1fr}',
      '.ohv3-acc-wrap[data-ohv3-active="1"]{grid-template-columns:1fr 2.6fr 1fr}',
      '.ohv3-acc-wrap[data-ohv3-active="2"]{grid-template-columns:1fr 1fr 2.6fr}',

      // Carte = lien <a> qui mène à Booking. Curseur main, pas de souligné.
      '.ohv3-acc-card{position:relative;display:flex;flex-direction:column;background:#fff;border-radius:14px;overflow:hidden;text-decoration:none;color:inherit;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,0.04);cursor:pointer;transition:border-color .25s ease,box-shadow .25s ease,transform .25s ease;min-width:0}',
      '.ohv3-acc-card:hover{border-color:#003b95;box-shadow:0 6px 16px rgba(0,59,149,0.18);transform:translateY(-2px)}',

      // La carte active (expanded) est aussi mise en avant visuellement
      '.ohv3-acc-wrap[data-ohv3-active="0"] .ohv3-acc-card[data-ohv3-idx="0"],',
      '.ohv3-acc-wrap[data-ohv3-active="1"] .ohv3-acc-card[data-ohv3-idx="1"],',
      '.ohv3-acc-wrap[data-ohv3-active="2"] .ohv3-acc-card[data-ohv3-idx="2"]{border-color:#003b95;box-shadow:0 4px 14px rgba(0,59,149,0.15)}',

      // Image : ratio 16:9 sur la carte active (plus généreux), 4:3 sur les compressées
      '.ohv3-acc-img{position:relative;width:100%;aspect-ratio:4/3;overflow:hidden;background:#94a3b8}',
      '.ohv3-acc-wrap[data-ohv3-active="0"] .ohv3-acc-card[data-ohv3-idx="0"] .ohv3-acc-img,',
      '.ohv3-acc-wrap[data-ohv3-active="1"] .ohv3-acc-card[data-ohv3-idx="1"] .ohv3-acc-img,',
      '.ohv3-acc-wrap[data-ohv3-active="2"] .ohv3-acc-card[data-ohv3-idx="2"] .ohv3-acc-img{aspect-ratio:16/9}',

      '.ohv3-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .8s ease;will-change:opacity;z-index:1}',
      '.ohv3-img.ohv3-img-on{opacity:1;z-index:2}',
      '.ohv3-mimg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .8s ease;z-index:1}',
      '.ohv3-mimg.ohv3-img-on{opacity:1;z-index:2}',
      // Badge "Coup de coeur" (élite)
      '.ohv3-elite-badge{position:absolute;top:10px;left:10px;z-index:5;background:linear-gradient(135deg,#f4c430,#d4a017);color:#fff;font-size:0.72rem;font-weight:700;padding:4px 10px;border-radius:999px;letter-spacing:.02em;box-shadow:0 2px 6px rgba(212,160,23,0.45)}',
      '.ohv3-elite-badge-m{top:10px;left:10px}',
      // Carte élite : bordure dorée
      '.ohv3-acc-card.ohv3-elite{border-color:#d4a017;box-shadow:0 2px 8px rgba(212,160,23,0.18)}',
      '.ohv3-acc-card.ohv3-elite:hover{border-color:#d4a017;box-shadow:0 6px 16px rgba(212,160,23,0.28)}',
      // Dot élite (mobile)
      '.ohv3-dot.ohv3-dot-elite{background:linear-gradient(135deg,#f4c430,#d4a017)}',
      '.ohv3-dot.ohv3-dot-elite.ohv3-dot-on{transform:scale(1.4)}',

      '.ohv3-acc-price{position:absolute;bottom:10px;right:10px;z-index:3;background:rgba(15,23,42,0.85);color:#fff;font-weight:700;font-size:0.95rem;padding:4px 10px;border-radius:8px;letter-spacing:.02em}',

      '.ohv3-acc-body{padding:12px 14px 14px 14px;display:flex;flex-direction:column;gap:6px;flex:1}',
      '.ohv3-acc-head{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}',
      '.ohv3-acc-name{font-weight:600;color:#0f172a;font-size:0.92rem;line-height:1.3;flex:1;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
      '.ohv3-acc-level{font-size:0.7rem;color:#64748b;text-transform:uppercase;letter-spacing:.04em;font-weight:600}',

      // Détail (description) caché par défaut, visible UNIQUEMENT sur la carte active
      '.ohv3-acc-detail{display:none;flex-direction:column;gap:8px;margin-top:4px}',
      '.ohv3-acc-wrap[data-ohv3-active="0"] .ohv3-acc-card[data-ohv3-idx="0"] .ohv3-acc-detail,',
      '.ohv3-acc-wrap[data-ohv3-active="1"] .ohv3-acc-card[data-ohv3-idx="1"] .ohv3-acc-detail,',
      '.ohv3-acc-wrap[data-ohv3-active="2"] .ohv3-acc-card[data-ohv3-idx="2"] .ohv3-acc-detail{display:flex}',

      // Quand active, le nom peut occuper plus de lignes
      '.ohv3-acc-wrap[data-ohv3-active="0"] .ohv3-acc-card[data-ohv3-idx="0"] .ohv3-acc-name,',
      '.ohv3-acc-wrap[data-ohv3-active="1"] .ohv3-acc-card[data-ohv3-idx="1"] .ohv3-acc-name,',
      '.ohv3-acc-wrap[data-ohv3-active="2"] .ohv3-acc-card[data-ohv3-idx="2"] .ohv3-acc-name{font-size:1.05rem;-webkit-line-clamp:none;display:block}',

      // Description complète (pas de troncature). La carte est cliquable, donc lire = engager Booking.
      '.ohv3-acc-desc{margin:0;font-size:0.88rem;line-height:1.5;color:#334155}',

      // === MOBILE ===
      '.ohv3-mwrap{position:relative;padding:12px}',
      '.ohv3-mtrack{position:relative;width:100%;aspect-ratio:4/3;border-radius:14px;overflow:hidden}',
      '.ohv3-moverlay{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:flex-end;padding:14px 14px 14px 14px;background:linear-gradient(to top,rgba(0,0,0,0.7) 0%,rgba(0,0,0,0.3) 50%,rgba(0,0,0,0) 100%);z-index:2}',
      '.ohv3-mprice{position:absolute;top:10px;right:10px;background:rgba(15,23,42,0.85);color:#fff;font-weight:700;font-size:1rem;padding:4px 12px;border-radius:8px}',
      '.ohv3-badge-m{top:10px;left:10px}',
      '.ohv3-minfo{color:#fff;display:flex;flex-direction:column;gap:6px}',
      '.ohv3-mname{font-weight:600;font-size:1.05rem;line-height:1.3;text-shadow:0 1px 3px rgba(0,0,0,0.4)}',
      '.ohv3-mmeta{display:flex;align-items:center;gap:8px;flex-wrap:wrap}',
      '.ohv3-mlevel{font-size:0.72rem;text-transform:uppercase;letter-spacing:.05em;font-weight:600;background:rgba(255,255,255,0.2);padding:3px 8px;border-radius:6px}',
      // Flèches : maintenant DANS .ohv3-mtrack, donc centrées verticalement sur la photo.
      // 44px, fond blanc opaque, ombre marquée pour bien ressortir sur n\'importe quelle photo.
      '.ohv3-arrow{position:absolute;top:50%;transform:translateY(-50%);z-index:10;width:44px;height:44px;border-radius:50%;border:2px solid #fff;background:#fff;color:#0f172a;font-size:1.8rem;font-weight:700;line-height:1;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;padding:0;-webkit-tap-highlight-color:transparent}',
      '.ohv3-arrow:active{transform:translateY(-50%) scale(0.92)}',
      '.ohv3-prev{left:10px}',
      '.ohv3-next{right:10px}',
      '.ohv3-dots{display:flex;justify-content:center;gap:8px;margin-top:12px}',
      '.ohv3-dot{width:8px;height:8px;border-radius:50%;background:#cbd5e1;cursor:pointer;transition:background .2s ease,transform .2s ease}',
      '.ohv3-dot-on{background:#f59e0b;transform:scale(1.25)}',
      '.ohv3-mobile-desc{margin:14px 4px 0 4px;font-size:0.88rem;line-height:1.5;color:#334155}',
      '.ohv3-mobile-cta{display:block;margin:14px 4px 0 4px;background:#003b95;color:#fff;text-decoration:none;font-weight:600;font-size:0.92rem;text-align:center;padding:11px 14px;border-radius:8px}',

      // Bascule responsive : ≤720px → on cache l'accordéon desktop, c'est le slider mobile qui s'affiche
      '@media(max-width:720px){.ohv3-acc-wrap{display:none}}'
    ].join('\n');
    document.head.appendChild(style);
  }

  // === SUPER ELITE : hotel mis en avant + popup 1 minute apres l'arrivee ===
  // Regle 1 : l'hotel mis en avant d'un lieu = elite:true si present, sinon le plus cher (priceLevel max, score en depart).
  function pickFeaturedHotel(hotels) {
    if (!hotels || !hotels.length) return null;
    for (let i = 0; i < hotels.length; i++) {
      if (hotels[i] && hotels[i].elite === true) return hotels[i];
    }
    // Pas d'elite : on prend l'hotel avec le plus de photos (le plus sur a afficher),
    // departage par la meilleure note. Le niveau de prix ne sert plus a choisir.
    let best = hotels[0];
    let bestPh = collectPhotos(best).length;
    for (let j = 1; j < hotels.length; j++) {
      const a = hotels[j];
      if (!a) continue;
      const ph = collectPhotos(a).length;
      if (ph > bestPh || (ph === bestPh && (parseFloat(a.score) || 0) > (parseFloat(best.score) || 0))) {
        best = a; bestPh = ph;
      }
    }
    return best;
  }

  let _seScheduled = false;
  let _seEl = null;

  function _seEntry(hotel, placeName) {
    if (!hotel) return null;
    const i1 = bigImg(hotel.imageUrl || hotel.coverPhoto);
    const u = buildBookingAffiliateUrl(hotel.bookingUrl);
    if (!i1 || !u || u === '#') return null;
    return { n: hotel.name || '', place: placeName || '', pl: hotel.priceLevel || 0, sc: (hotel.score != null ? hotel.score : ''), u: u, i1: i1, i2: bigImg(hotel.imageUrl2), i3: bigImg(hotel.imageUrl3) };
  }

  function _seDollars(p) { p = parseInt(p, 10) || 0; let s = ''; for (let i = 0; i < p; i++) s += '$'; return s; }

  function _seImgEl(src, alt, cls) {
    const im = document.createElement('img');
    im.src = src; im.alt = alt || ''; im.loading = 'lazy';
    if (cls) im.className = cls;
    im.onerror = function() { im.style.display = 'none'; };
    return im;
  }

  function _seInjectCSS() {
    if (document.getElementById('ortSeCss')) return;
    const st = document.createElement('style');
    st.id = 'ortSeCss';
    st.textContent = '#ortSeOverlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.55);z-index:99998;display:flex;align-items:center;justify-content:center;padding:16px}#ortSeOverlay .se-card{position:relative;background:#fff;border-radius:16px;max-width:420px;width:100%;max-height:90vh;overflow:auto;box-shadow:0 20px 60px rgba(0,0,0,.35)}#ortSeOverlay .se-click{cursor:pointer}#ortSeOverlay .se-hero{display:block;width:100%;height:220px;object-fit:cover;border-radius:16px 16px 0 0}#ortSeOverlay .se-body{padding:14px 18px 6px}#ortSeOverlay .se-name{font-weight:700;font-size:18px;margin-bottom:4px}#ortSeOverlay .se-meta{font-size:14px;color:#444;margin-bottom:8px}#ortSeOverlay .se-pl{color:#0a7d2c;font-weight:700}#ortSeOverlay .se-sc{color:#b8860b;font-weight:700}#ortSeOverlay .se-txt{font-size:14px;line-height:1.45;color:#333;margin:0 0 10px}#ortSeOverlay .se-duo{display:flex;gap:6px;padding:0 18px 16px}#ortSeOverlay .se-duo img{width:calc(50% - 3px);height:120px;object-fit:cover;border-radius:10px}#ortSeOverlay .se-x{position:absolute;top:8px;right:8px;z-index:2;width:32px;height:32px;border:none;border-radius:50%;background:rgba(0,0,0,.55);color:#fff;font-size:18px;cursor:pointer;line-height:30px;padding:0}#ortSeOverlay .se-ar{position:absolute;top:50%;transform:translateY(-50%);z-index:2;width:36px;height:36px;border:none;border-radius:50%;background:rgba(255,255,255,.92);color:#111;font-size:22px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.25);line-height:34px;padding:0}#ortSeOverlay .se-prev{left:8px}#ortSeOverlay .se-next{right:8px}';
    document.head.appendChild(st);
  }

  function _seClose() {
    if (!_seEl) return;
    _seEl.parentNode.removeChild(_seEl);
    _seEl = null;
    document.removeEventListener('keydown', _seKey);
  }

  function _seKey(e) { if (e.key === 'Escape') _seClose(); }

  function _seRender(list, idx) {
    if (!_seEl) return;
    const h = list[idx];
    if (!h) return;
    const card = _seEl.firstChild;
    card.innerHTML = '';
    const x = document.createElement('button');
    x.type = 'button'; x.className = 'se-x'; x.textContent = '\u00d7';
    x.onclick = function(ev) { ev.stopPropagation(); _seClose(); };
    card.appendChild(x);
    if (list.length > 1) {
      const pv = document.createElement('button');
      pv.type = 'button'; pv.className = 'se-ar se-prev'; pv.textContent = '\u2039';
      pv.onclick = function(ev) { ev.stopPropagation(); _seRender(list, (idx - 1 + list.length) % list.length); };
      card.appendChild(pv);
      const nx = document.createElement('button');
      nx.type = 'button'; nx.className = 'se-ar se-next'; nx.textContent = '\u203a';
      nx.onclick = function(ev) { ev.stopPropagation(); _seRender(list, (idx + 1) % list.length); };
      card.appendChild(nx);
    }
    const clk = document.createElement('div');
    clk.className = 'se-click';
    clk.onclick = function() { if (h.u && h.u !== '#') window.open(h.u, '_blank', 'noopener'); };
    if (h.i1) clk.appendChild(_seImgEl(h.i1, h.n, 'se-hero'));
    const body = document.createElement('div');
    body.className = 'se-body';
    const nm = document.createElement('div');
    nm.className = 'se-name'; nm.textContent = h.n;
    body.appendChild(nm);
    const mt = document.createElement('div');
    mt.className = 'se-meta';
    const pn = document.createElement('strong');
    pn.textContent = h.place;
    mt.appendChild(pn);
    if (h.pl) { const pl = document.createElement('span'); pl.className = 'se-pl'; pl.textContent = ' \u00b7 ' + _seDollars(h.pl); mt.appendChild(pl); }
    if (h.sc) { const sc = document.createElement('span'); sc.className = 'se-sc'; sc.textContent = ' \u00b7 \u2605 ' + h.sc; mt.appendChild(sc); }
    body.appendChild(mt);
    const tx = document.createElement('p');
    tx.className = 'se-txt'; tx.textContent = t('sePitch');
    body.appendChild(tx);
    clk.appendChild(body);
    if (h.i2 || h.i3) {
      const duo = document.createElement('div');
      duo.className = 'se-duo';
      if (h.i2) duo.appendChild(_seImgEl(h.i2, h.n, ''));
      if (h.i3) duo.appendChild(_seImgEl(h.i3, h.n, ''));
      clk.appendChild(duo);
    }
    card.appendChild(clk);
  }

  function _seOpen(list, start) {
    if (_seEl) return;
    _seInjectCSS();
    _seEl = document.createElement('div');
    _seEl.id = 'ortSeOverlay';
    const card = document.createElement('div');
    card.className = 'se-card';
    _seEl.appendChild(card);
    _seEl.onclick = function(e) { if (e.target === _seEl) _seClose(); };
    document.body.appendChild(_seEl);
    document.addEventListener('keydown', _seKey);
    _seRender(list, start);
  }

  // Regle 2 : popup super elite 1 minute apres l'arrivee, a chaque ouverture.
  // opts : { getSteps: fn -> [{place_id,name,visits}], getSuperElite: fn -> {place_id,hotel_index,hotel_name}|null, delayMs }
  // Fallback sans superElite : depart sur le lieu qui a le plus de visites.
  function scheduleSuperElitePopup(opts) {
    opts = opts || {};
    if (_seScheduled) return;
    _seScheduled = true;
    const delay = (typeof opts.delayMs === 'number') ? opts.delayMs : 60000;
    setTimeout(async function() {
      try {
        const steps = (typeof opts.getSteps === 'function') ? (opts.getSteps() || []) : (opts.steps || []);
        const seen = {};
        const places = [];
        steps.forEach(function(s) {
          const pid = s.place_id || s.pid || '';
          if (!pid || seen[pid]) return;
          seen[pid] = 1;
          places.push({ pid: pid, name: s.name || '', vis: (s.visits || []).length });
        });
        if (!places.length) return;
        const seCfg = (typeof opts.getSuperElite === 'function') ? opts.getSuperElite() : (opts.superElite || null);
        const list = [];
        let start = -1;
        for (const p of places) {
          const data = await loadHotelsForPlace(p.pid);
          const hotels = data && data.hotels ? data.hotels : null;
          if (!hotels || !hotels.length) continue;
          let hotel = pickFeaturedHotel(hotels);
          let isSE = false;
          if (seCfg && seCfg.place_id === p.pid) {
            const hi = (typeof seCfg.hotel_index === 'number') ? seCfg.hotel_index : 0;
            if (hotels[hi]) {
              hotel = hotels[hi];
              isSE = true;
              if (seCfg.hotel_name && hotel.name && hotel.name !== seCfg.hotel_name) console.warn('[ORT-HOTELS-V3] superElite : hotel_name ne correspond pas a hotel_index (' + hotel.name + ' vs ' + seCfg.hotel_name + ')');
            }
          }
          let e = _seEntry(hotel, p.name);
          if (!e) {
            for (let f = 0; f < hotels.length && !e; f++) e = _seEntry(hotels[f], p.name);
            if (e) isSE = false;
          }
          if (!e) continue;
          e.vis = p.vis;
          if (isSE) start = list.length;
          list.push(e);
        }
        if (!list.length) return;
        if (start < 0) {
          start = 0;
          for (let v = 1; v < list.length; v++) if (list[v].vis > list[start].vis) start = v;
        }
        _seOpen(list, start);
      } catch (e) {
        console.warn('[ORT-HOTELS-V3] popup super elite :', e);
      }
    }, delay);
  }

  // === INIT ===
  function init() {
    injectCSS();
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeHotelsModal(); });
    const modal = document.getElementById('hotelsModal');
    if (modal) {
      modal.addEventListener('click', function(e) { if (e.target === this) closeHotelsModal(); });
    }
    console.log('[ORT-HOTELS-V3] ✅ Module chargé');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // === EXPORT (compat avec ort-hotels.js) ===
  const ORT_HOTELS = {
    CONFIG, I18N,
    getLang, getCountryCode, parsePlaceId,
    buildStay22Url, buildBookingAffiliateUrl,
    loadHotelsForPlace,
    pickThreeHotels,
    orderHotels,
    pickFeaturedHotel,
    scheduleSuperElitePopup,
    openHotelsModal, closeHotelsModal
  };
  global.ORT_HOTELS = ORT_HOTELS;
  global.openHotelsModal = openHotelsModal;
  global.closeHotelsModal = closeHotelsModal;

})(typeof window !== 'undefined' ? window : this);
