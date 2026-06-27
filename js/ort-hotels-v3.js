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
    topHotels: { fr: 'Meilleurs hôtels', en: 'Top hotels', es: 'Mejores hoteles', pt: 'Melhores hotéis', it: 'Migliori hotel', ar: 'أفضل الفنادق' },
    chooseOnMap: { fr: 'Choisir sur la carte', en: 'Choose on map', es: 'Elegir en el mapa', pt: 'Escolher no mapa', it: 'Scegli sulla mappa', ar: 'اختر على الخريطة' },
    loading: { fr: 'Chargement des hôtels...', en: 'Loading hotels...', es: 'Cargando hoteles...', pt: 'Carregando hotéis...', it: 'Caricamento hotel...', ar: 'جار تحميل الفنادق...' },
    noHotels: { fr: 'Aucun hôtel disponible', en: 'No hotels available', es: 'No hay hoteles disponibles', pt: 'Nenhum hotel disponível', it: 'Nessun hotel disponibile', ar: 'لا توجد فنادق متاحة' },
    midRange: { fr: 'Milieu de gamme', en: 'Mid-range', es: 'Gama media', pt: 'Gama média', it: 'Fascia media', ar: 'متوسط' },
    economic: { fr: 'Économique', en: 'Budget', es: 'Económico', pt: 'Económico', it: 'Economico', ar: 'اقتصادي' },
    premium: { fr: 'Premium', en: 'Premium', es: 'Premium', pt: 'Premium', it: 'Premium', ar: 'فاخر' },
    seeOnBooking: { fr: 'Voir sur Booking', en: 'See on Booking', es: 'Ver en Booking', pt: 'Ver no Booking', it: 'Vedi su Booking', ar: 'عرض على Booking' },
    prev: { fr: 'Précédent', en: 'Previous', es: 'Anterior', pt: 'Anterior', it: 'Precedente', ar: 'السابق' },
    next: { fr: 'Suivant', en: 'Next', es: 'Next', pt: 'Seguinte', it: 'Successivo', ar: 'التالي' },
    eliteBadge: { fr: '★ Coup de cœur', en: '★ Top pick', es: '★ Nuestra favorita', pt: '★ Nosso favorito', it: '★ La nostra preferita', ar: '★ المفضل لدينا' }
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
    return ({ fr: 'fr', en: 'en-gb', es: 'es', pt: 'pt-pt', it: 'it', ar: 'ar' })[lang] || 'en-gb';
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
    for (let i = 2; i <= 20; i++) {
      const key = 'imageUrl' + i;
      if (hotel[key]) push(hotel[key]);
      else if (i > 3) break;
    }
    return out;
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

  // === RENDU DESKTOP : 3 cartes côte à côte avec accordéon horizontal ===
  // Chaque carte garde sa position. Au survol/clic, elle s'élargit (les autres se compriment).
  // L'expansion par défaut est sur le $$$ (haut de gamme = plus belle photo).
  function renderDesktopAccordion(picked, modalContainer) {
    const lang = getLang();

    // Carte ouverte par défaut : élite si présent, sinon mieux notée
    let initialExpanded = 0;
    const eliteIdx = picked.findIndex(p => p.elite);
    if (eliteIdx >= 0) {
      initialExpanded = eliteIdx;
    } else {
      let bestScore = parseFloat(picked[0].hotel.score) || 0;
      for (let i = 1; i < picked.length; i++) {
        const s = parseFloat(picked[i].hotel.score) || 0;
        if (s > bestScore) { bestScore = s; initialExpanded = i; }
      }
    }

    function renderCard(entry, idx) {
      const h = entry.hotel;
      const isElite = !!entry.elite;
      const name = h.name || '';
      const score = h.score || '';
      const photos = collectPhotos(h);
      const photoList = photos.length ? photos : [''];
      const hasMulti = photoList.length > 1;
      const url = buildBookingAffiliateUrl(h.bookingUrl);
      const desc = pickDescription(h, lang);
      const fbColor = colorFromName(name);
      const initial = (name.charAt(0) || '?').toUpperCase();
      const lvLabel = levelLabel(entry.level);

      const imgsH = photoList.map((src, i) =>
        '<img class="ohv3-img' + (i === 0 ? ' ohv3-img-on' : '') + '" data-ohv3-pidx="' + i +
        '" src="' + esc(src) + '" alt="' + esc(name) + '" loading="lazy" onerror="this.style.display=\'none\';">'
      ).join('');

      const badgeH = isElite
        ? '<div class="ohv3-elite-badge">' + esc(t('eliteBadge')) + '</div>'
        : '';

      const imgH =
        '<div class="ohv3-acc-img" style="background:' + fbColor + '"' +
            (hasMulti ? ' data-ohv3-rotate="1"' : '') + '>' +
          '<div class="ohv3-img-fallback"><span>' + esc(initial) + '</span></div>' +
          imgsH +
          badgeH +
          '<div class="ohv3-acc-price">' + priceSymbol(entry.level) + '</div>' +
        '</div>';

      return (
        '<a class="ohv3-acc-card' + (isElite ? ' ohv3-elite' : '') + '" ' +
          'data-ohv3-idx="' + idx + '" ' +
          'href="' + esc(url) + '" target="_blank" rel="noopener sponsored">' +
          imgH +
          '<div class="ohv3-acc-body">' +
            '<div class="ohv3-acc-head">' +
              '<div class="ohv3-acc-name">' + esc(name) + '</div>' +
              (score ? '<span class="ohv3-score">' + esc(score) + '</span>' : '') +
            '</div>' +
            '<div class="ohv3-acc-level">' + esc(lvLabel) + '</div>' +
            '<div class="ohv3-acc-detail">' +
              (desc ? '<p class="ohv3-acc-desc">' + esc(desc) + '</p>' : '') +
            '</div>' +
          '</div>' +
        '</a>'
      );
    }

    const cardsH = picked.map((entry, idx) => renderCard(entry, idx)).join('');

    modalContainer.innerHTML = '<div class="ohv3-acc-wrap" data-ohv3-active="' + initialExpanded + '">' + cardsH + '</div>';

    const wrap = modalContainer.querySelector('.ohv3-acc-wrap');

    function setExpanded(newIdx) {
      if (newIdx < 0 || newIdx >= picked.length) return;
      wrap.setAttribute('data-ohv3-active', String(newIdx));
    }

    modalContainer.querySelectorAll('.ohv3-acc-card').forEach(card => {
      const idx = parseInt(card.getAttribute('data-ohv3-idx'), 10);
      card.addEventListener('mouseenter', () => setExpanded(idx));
    });

    // Auto-rotation des photos : cycle N images via classe .ohv3-img-on
    modalContainer.querySelectorAll('.ohv3-acc-img[data-ohv3-rotate="1"]').forEach((imgEl, idx) => {
      const imgs = imgEl.querySelectorAll('.ohv3-img');
      if (imgs.length < 2) return;
      let cur = 0;
      let paused = false;
      const card = imgEl.closest('.ohv3-acc-card');
      if (card) {
        card.addEventListener('mouseenter', () => { paused = true; });
        card.addEventListener('mouseleave', () => { paused = false; });
      }
      setTimeout(() => {
        const interval = setInterval(() => {
          if (!document.body.contains(imgEl)) { clearInterval(interval); return; }
          if (paused) return;
          imgs[cur].classList.remove('ohv3-img-on');
          cur = (cur + 1) % imgs.length;
          imgs[cur].classList.add('ohv3-img-on');
        }, CONFIG.rotationInterval);
      }, idx * 900);
    });
  }

  // === RENDU MOBILE : 1 carte + flèches ===
  function renderMobileSlider(picked, activeIdx, modalContainer) {
    const lang = getLang();
    const total = picked.length;

    // Si un élite existe et que l'index initial n'est pas spécifié, on ouvre sur l'élite
    const eliteIdx = picked.findIndex(p => p.elite);
    if (eliteIdx >= 0 && (activeIdx == null || activeIdx === 0)) {
      activeIdx = eliteIdx;
    }

    function paint(idx) {
      const cur = picked[idx];
      const h = cur.hotel;
      const isElite = !!cur.elite;
      const name = h.name || '';
      const score = h.score || '';
      const photos = collectPhotos(h);
      const photoList = photos.length ? photos : [''];
      const hasMulti = photoList.length > 1;
      const url = buildBookingAffiliateUrl(h.bookingUrl);
      const desc = pickDescription(h, lang);
      const fbColor = colorFromName(name);
      const initial = (name.charAt(0) || '?').toUpperCase();
      const lvLabel = levelLabel(cur.level);
      const badgeH = isElite
        ? '<div class="ohv3-elite-badge ohv3-elite-badge-m">' + esc(t('eliteBadge')) + '</div>'
        : '';
      const imgsH = photoList.map((src, i) =>
        '<img class="ohv3-mimg' + (i === 0 ? ' ohv3-img-on' : '') + '" data-ohv3-pidx="' + i +
        '" src="' + esc(src) + '" alt="' + esc(name) + '" loading="lazy" onerror="this.style.display=\'none\';">'
      ).join('');
      const dotsH = picked.map((p, i) => {
        let cls = 'ohv3-dot';
        if (i === idx) cls += ' ohv3-dot-on';
        if (p.elite) cls += ' ohv3-dot-elite';
        return '<span class="' + cls + '" data-ohv3-go="' + i + '"></span>';
      }).join('');

      modalContainer.innerHTML =
        '<div class="ohv3-mwrap">' +
          '<div class="ohv3-mtrack' + (hasMulti ? '" data-ohv3-rotate="1"' : '"') + ' style="background:' + fbColor + '">' +
            '<div class="ohv3-img-fallback"><span>' + esc(initial) + '</span></div>' +
            imgsH +
            '<div class="ohv3-moverlay">' +
              badgeH +
              '<div class="ohv3-mprice">' + priceSymbol(cur.level) + '</div>' +
              '<div class="ohv3-minfo">' +
                '<div class="ohv3-mname">' + esc(name) + '</div>' +
                '<div class="ohv3-mmeta">' +
                  (score ? '<span class="ohv3-score">' + esc(score) + '</span>' : '') +
                  '<span class="ohv3-mlevel">' + esc(lvLabel) + '</span>' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<button class="ohv3-arrow ohv3-prev" type="button" aria-label="' + esc(t('prev')) + '">‹</button>' +
            '<button class="ohv3-arrow ohv3-next" type="button" aria-label="' + esc(t('next')) + '">›</button>' +
          '</div>' +
          '<div class="ohv3-dots">' + dotsH + '</div>' +
          (desc ? '<p class="ohv3-mobile-desc">' + esc(desc) + '</p>' : '') +
          '<a class="ohv3-mobile-cta" href="' + esc(url) + '" target="_blank" rel="noopener sponsored">' + esc(t('seeOnBooking')) + '</a>' +
        '</div>';

      // Câblage flèches + dots
      const setActive = newIdx => {
        if (newIdx < 0) newIdx = total - 1;
        if (newIdx >= total) newIdx = 0;
        paint(newIdx);
      };
      const prev = modalContainer.querySelector('.ohv3-prev');
      const next = modalContainer.querySelector('.ohv3-next');
      if (prev) prev.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); setActive(idx - 1); });
      if (next) next.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); setActive(idx + 1); });
      modalContainer.querySelectorAll('.ohv3-dot').forEach(d => {
        d.addEventListener('click', e => {
          e.preventDefault(); e.stopPropagation();
          const go = parseInt(d.getAttribute('data-ohv3-go'), 10);
          if (!isNaN(go)) setActive(go);
        });
      });

      // Auto-rotation des photos dans la carte affichée
      if (hasMulti) {
        const imgs = modalContainer.querySelectorAll('.ohv3-mimg');
        let cur2 = 0;
        const interval = setInterval(() => {
          if (!document.body.contains(modalContainer.querySelector('.ohv3-mtrack'))) {
            clearInterval(interval); return;
          }
          imgs[cur2].classList.remove('ohv3-img-on');
          cur2 = (cur2 + 1) % imgs.length;
          imgs[cur2].classList.add('ohv3-img-on');
        }, CONFIG.rotationInterval);
      }

      // Swipe latéral
      const track = modalContainer.querySelector('.ohv3-mtrack');
      if (track) {
        let sx = 0, sy = 0, moved = false;
        track.addEventListener('touchstart', e => { const t = e.touches[0]; sx = t.clientX; sy = t.clientY; moved = false; }, { passive: true });
        track.addEventListener('touchmove', e => {
          const t = e.touches[0];
          if (Math.abs(t.clientX - sx) > 10 || Math.abs(t.clientY - sy) > 10) moved = true;
        }, { passive: true });
        track.addEventListener('touchend', e => {
          if (!moved) return;
          const t = e.changedTouches[0];
          const dx = t.clientX - sx;
          const dy = t.clientY - sy;
          if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) setActive(dx < 0 ? idx + 1 : idx - 1);
        }, { passive: true });
      }
    }

    paint(activeIdx);
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
      const picked = pickThreeHotels(placeData.hotels);
      if (!picked.length) {
        renderStay22Fallback();
        return;
      }

      // Index initial : le mieux noté
      let initialIdx = 0;
      let bestScore = parseFloat(picked[0].hotel.score) || 0;
      for (let i = 1; i < picked.length; i++) {
        const s = parseFloat(picked[i].hotel.score) || 0;
        if (s > bestScore) { bestScore = s; initialIdx = i; }
      }

      // Choix du rendu selon largeur écran
      const isMobile = window.innerWidth <= 720;
      if (isMobile) {
        renderMobileSlider(picked, initialIdx, containerEl);
      } else {
        renderDesktopAccordion(picked, containerEl);
      }
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
    openHotelsModal, closeHotelsModal
  };
  global.ORT_HOTELS = ORT_HOTELS;
  global.openHotelsModal = openHotelsModal;
  global.closeHotelsModal = closeHotelsModal;

})(typeof window !== 'undefined' ? window : this);
