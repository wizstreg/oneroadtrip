/*
 * ort-merge.js — Fusion de plusieurs itineraires d'un meme pays.
 *
 * Flux :
 *  1. ORT_MERGE.open(cc, itinId, lang) charge le catalogue du pays + la base photos.
 *  2. Box de selection : chaque itineraire voisin avec vignette (carte OU photo, toggle),
 *     titre, nombre d'etapes, case a cocher, + avertissement.
 *  3. A la validation : concatene, dedoublonne, reordonne par plus proche voisin,
 *     puis passe le tout a l'editeur via ORT_ITIN_EDITOR._startMerged(daysPlan, titre, cc).
 *
 * Vignettes alignees sur index.html :
 *  - carte : https://photos.oneroadtrip.com/<CC>/maps/<slug>.webp (slug reconstruit depuis l'id)
 *  - photo : 1er lieu de l'itineraire dans photos_lieux.json, via proxy wsrv.nl
 */
(function (ROOT) {
  'use strict';

  var I18N = {
    fr: { title: 'Fusionner des itinéraires', intro: 'Cochez un ou plusieurs itinéraires proches à fusionner avec celui-ci.', warn: 'Nous tenterons de réordonner les étapes automatiquement. Vous devrez probablement ajuster certains trajets à la main : c\'est plus simple sur ordinateur.', steps: 'étapes', validate: 'Fusionner', cancel: 'Annuler', none: 'Aucun autre itinéraire disponible pour ce pays.', pick: 'Sélectionnez au moins un itinéraire.', err: 'Chargement impossible.', vMap: 'Carte', vPhoto: 'Photo', cur: 'Itinéraire actuel' },
    en: { title: 'Merge itineraries', intro: 'Tick one or more nearby itineraries to merge with this one.', warn: 'We will try to reorder the stops automatically. You will probably need to adjust some legs by hand: it is easier on a computer.', steps: 'stops', validate: 'Merge', cancel: 'Cancel', none: 'No other itinerary available for this country.', pick: 'Select at least one itinerary.', err: 'Could not load.', vMap: 'Map', vPhoto: 'Photo', cur: 'Current itinerary' },
    es: { title: 'Fusionar itinerarios', intro: 'Marca uno o varios itinerarios cercanos para fusionar con este.', warn: 'Intentaremos reordenar las paradas automáticamente. Probablemente tendrás que ajustar algunos trayectos a mano: es más fácil en un ordenador.', steps: 'paradas', validate: 'Fusionar', cancel: 'Cancelar', none: 'No hay otro itinerario disponible para este país.', pick: 'Selecciona al menos un itinerario.', err: 'No se pudo cargar.', vMap: 'Mapa', vPhoto: 'Foto', cur: 'Itinerario actual' },
    pt: { title: 'Fundir itinerários', intro: 'Marque um ou mais itinerários próximos para fundir com este.', warn: 'Tentaremos reordenar as paragens automaticamente. Provavelmente terá de ajustar alguns trajetos à mão: é mais fácil num computador.', steps: 'paragens', validate: 'Fundir', cancel: 'Cancelar', none: 'Nenhum outro itinerário disponível para este país.', pick: 'Selecione pelo menos um itinerário.', err: 'Não foi possível carregar.', vMap: 'Mapa', vPhoto: 'Foto', cur: 'Itinerário atual' },
    it: { title: 'Unisci itinerari', intro: 'Seleziona uno o più itinerari vicini da unire a questo.', warn: 'Proveremo a riordinare le tappe automaticamente. Probabilmente dovrai sistemare alcuni tragitti a mano: è più facile su un computer.', steps: 'tappe', validate: 'Unisci', cancel: 'Annulla', none: 'Nessun altro itinerario disponibile per questo paese.', pick: 'Seleziona almeno un itinerario.', err: 'Impossibile caricare.', vMap: 'Mappa', vPhoto: 'Foto', cur: 'Itinerario attuale' },
    ar: { title: 'دمج المسارات', intro: 'حدّد مسارًا أو أكثر من المسارات القريبة لدمجها مع هذا المسار.', warn: 'سنحاول إعادة ترتيب المحطات تلقائيًا. غالبًا ستحتاج إلى تعديل بعض المسارات يدويًا: الأمر أسهل على جهاز كمبيوتر.', steps: 'محطات', validate: 'دمج', cancel: 'إلغاء', none: 'لا يوجد مسار آخر متاح لهذا البلد.', pick: 'اختر مسارًا واحدًا على الأقل.', err: 'تعذر التحميل.', vMap: 'خريطة', vPhoto: 'صورة', cur: 'المسار الحالي' }
  };

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function L(lang) { return I18N[lang] || I18N.fr; }

  // ---- données ----
  function fetchJSON(u) {
    return fetch(u, { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }
  function loadItins(cc, lang) {
    var ccLow = cc.toLowerCase();
    var order = [lang, 'en', 'fr'].filter(function (v, i, a) { return a.indexOf(v) === i; });
    var base = '/data/Roadtripsprefabriques/countries/' + cc + '/';
    var urls = [];
    order.forEach(function (l) {
      urls.push(base + ccLow + '.itins.modules-' + l + '.json');
      urls.push(base + cc + '.itins.modules-' + l + '.json');
    });
    var i = 0;
    function next() {
      if (i >= urls.length) return Promise.resolve([]);
      return fetchJSON(urls[i++]).then(function (d) {
        if (!d) return next();
        var arr = d.itins || d.itineraries || d;
        return Array.isArray(arr) ? arr : next();
      });
    }
    return next();
  }
  function itinId(it) { return it.id || it.itin_id || ''; }
  function daysOf(it) { return it.days_plan || it.steps || []; }
  function titleOf(it) { return (it.seo && it.seo.h1_title) || it.title || it.name || itinId(it); }

  // slug aligne sur generate-v3 : id -> slug
  function slugify(id) {
    return String(id).toLowerCase().replace(/::/g, '-').replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }
  // comparaison d'id tolerante : l'id du bouton et celui du fichier modules
  // peuvent differer (::/- ), on compare donc aussi via le slug normalise.
  function sameItin(a, b) { return a === b || slugify(a) === slugify(b); }
  // carte : meme nom de fichier que la home (slug sans prefixe cc, ASCII)
  function mapUrl(cc, id) {
    var s = slugify(id);
    var ccl = cc.toLowerCase();
    if (s.indexOf(ccl + '-') === 0) s = s.substring(ccl.length + 1);
    s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return 'https://photos.oneroadtrip.com/' + cc.toUpperCase() + '/maps/' + s + '.webp';
  }
  // photo : 1er lieu de l'itineraire present dans la base photos, proxifie
  function photoUrl(it, photosDb) {
    if (!photosDb) return '';
    var days = daysOf(it);
    for (var i = 0; i < days.length; i++) {
      var pid = (days[i].night && days[i].night.place_id) || days[i].place_id;
      if (pid && photosDb[pid] && photosDb[pid].photos && photosDb[pid].photos.length) {
        var p = photosDb[pid].photos[0];
        var u = (typeof p === 'string') ? p : (p && p.url);
        if (u) return 'https://wsrv.nl/?url=' + encodeURIComponent(u) + '&w=400&q=78&output=webp&fit=cover&n=-1';
      }
    }
    return '';
  }

  // ---- logique pure de fusion (testable) ----
  function dedupeDays(days) {
    var seen = {}, out = [];
    days.forEach(function (d) {
      var pid = (d.night && d.night.place_id) || d.place_id || d.name;
      if (pid && seen[pid]) return;
      if (pid) seen[pid] = true;
      out.push(d);
    });
    return out;
  }
  function coordsOf(d) {
    var c = (d.night && d.night.coords) || [];
    var lat = (c[0] != null) ? c[0] : d.lat;
    var lng = (c[1] != null) ? c[1] : (d.lng != null ? d.lng : d.lon);
    return [Number(lat), Number(lng)];
  }
  function dist2(a, b) {
    var dx = a[0] - b[0];
    var dy = (a[1] - b[1]) * Math.cos(a[0] * Math.PI / 180);
    return dx * dx + dy * dy;
  }
  function nearestNeighbor(days) {
    if (days.length < 3) return days;
    var pts = days.map(coordsOf);
    for (var k = 0; k < pts.length; k++) {
      if (!isFinite(pts[k][0]) || !isFinite(pts[k][1])) return days;
    }
    var used = {}, order = [days[0]], curIdx = 0;
    used[0] = true;
    for (var n = 1; n < days.length; n++) {
      var best = -1, bd = Infinity;
      for (var i = 0; i < days.length; i++) {
        if (used[i]) continue;
        var dd = dist2(pts[curIdx], pts[i]);
        if (dd < bd) { bd = dd; best = i; }
      }
      if (best < 0) break;
      used[best] = true; order.push(days[best]); curIdx = best;
    }
    return order;
  }
  function mergeAndOrder(daysArrays) {
    var all = [];
    daysArrays.forEach(function (arr) { (arr || []).forEach(function (d) { all.push(d); }); });
    return nearestNeighbor(dedupeDays(all));
  }

  // ---- UI ----
  var state = { cc: '', lang: 'fr', current: null, others: [], photosDb: {}, view: 'map' };

  function closeModal() {
    var bg = document.getElementById('ort-merge-bg');
    if (bg && bg.parentNode) bg.parentNode.removeChild(bg);
  }

  function buildModal() {
    var l = L(state.lang);
    var h = '';
    h += '<div class="ort-merge-box" role="dialog" aria-modal="true">';
    h += '<button class="ort-merge-x" aria-label="' + esc(l.cancel) + '" onclick="ORT_MERGE._close()">\u00d7</button>';
    h += '<h2>' + esc(l.title) + '</h2>';
    h += '<p class="ort-merge-intro">' + esc(l.intro) + '</p>';
    h += '<div class="ort-merge-warn">\u26a0\ufe0f ' + esc(l.warn) + '</div>';
    if (!state.others.length) {
      h += '<p class="ort-merge-empty">' + esc(l.none) + '</p>';
    } else {
      h += '<div class="ort-merge-view"><button data-v="map" class="active" onclick="ORT_MERGE._view(\'map\')">' + esc(l.vMap) + '</button><button data-v="photo" onclick="ORT_MERGE._view(\'photo\')">' + esc(l.vPhoto) + '</button></div>';
      h += '<div class="ort-merge-list">';
      // itineraire actuel en premier : couleur distincte, toujours inclus (pas de case)
      var curPh = photoUrl(state.current, state.photosDb);
      var curMp = mapUrl(state.cc, itinId(state.current));
      h += '<div class="ort-merge-item ort-merge-current">'
        + '<span class="ort-merge-cur-mark">\u2713</span>'
        + '<span class="ort-merge-photo" data-photo="' + esc(curPh) + '" data-map="' + esc(curMp) + '" style="background-image:url(\'' + esc(curMp) + '\')"></span>'
        + '<span class="ort-merge-it-txt"><span class="ort-merge-it-cur">' + esc(l.cur) + '</span>'
        + '<span class="ort-merge-it-title">' + esc(titleOf(state.current)) + '</span>'
        + '<span class="ort-merge-it-meta">' + daysOf(state.current).length + ' ' + esc(l.steps) + '</span></span>'
        + '</div>';
      state.others.forEach(function (it, idx) {
        var ph = photoUrl(it, state.photosDb);
        var mp = mapUrl(state.cc, itinId(it));
        var nStops = daysOf(it).length;
        h += '<label class="ort-merge-item">'
          + '<input type="checkbox" value="' + idx + '">'
          + '<span class="ort-merge-photo" data-photo="' + esc(ph) + '" data-map="' + esc(mp) + '" style="background-image:url(\'' + esc(mp) + '\')"></span>'
          + '<span class="ort-merge-it-txt"><span class="ort-merge-it-title">' + esc(titleOf(it)) + '</span>'
          + '<span class="ort-merge-it-meta">' + nStops + ' ' + esc(l.steps) + '</span></span>'
          + '</label>';
      });
      h += '</div>';
    }
    h += '<div class="ort-merge-actions">';
    h += '<button class="ort-merge-cancel" onclick="ORT_MERGE._close()">' + esc(l.cancel) + '</button>';
    if (state.others.length) h += '<button class="ort-merge-go" onclick="ORT_MERGE._validate()">' + esc(l.validate) + '</button>';
    h += '</div></div>';

    var bg = document.createElement('div');
    bg.id = 'ort-merge-bg';
    bg.className = 'ort-merge-bg';
    bg.innerHTML = h;
    bg.addEventListener('click', function (e) { if (e.target === bg) closeModal(); });
    document.body.appendChild(bg);
  }

  function setView(mode) {
    state.view = mode;
    var bg = document.getElementById('ort-merge-bg');
    if (!bg) return;
    bg.querySelectorAll('.ort-merge-view button').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-v') === mode);
    });
    bg.querySelectorAll('.ort-merge-photo').forEach(function (el) {
      var ph = el.getAttribute('data-photo'), mp = el.getAttribute('data-map');
      var url = (mode === 'photo' && ph) ? ph : mp;
      el.style.backgroundImage = "url('" + url + "')";
    });
  }

  function validate() {
    var l = L(state.lang);
    var boxes = document.querySelectorAll('#ort-merge-bg input[type="checkbox"]:checked');
    if (!boxes.length) { alert(l.pick); return; }
    var picked = [];
    boxes.forEach(function (b) { picked.push(state.others[Number(b.value)]); });

    var daysArrays = [daysOf(state.current)].concat(picked.map(daysOf));
    var ordered = mergeAndOrder(daysArrays);
    var title = titleOf(state.current) + ' (+' + picked.length + ')';

    console.log('[MERGE] validate cochés=', picked.length, '| currentDays=', daysOf(state.current).length, '| pickedDays=', picked.map(function (x) { return daysOf(x).length; }));
    console.log('[MERGE] fusionné=', ordered.length, '| clés=', ordered.map(function (d) { return (d.night && d.night.place_id) || d.place_id || d.name; }));
    console.log('[MERGE] editor._startMerged présent=', !!(ROOT.ORT_ITIN_EDITOR && ROOT.ORT_ITIN_EDITOR._startMerged));

    if (!ROOT.ORT_ITIN_EDITOR || typeof ROOT.ORT_ITIN_EDITOR._startMerged !== 'function') {
      alert('Editor not ready'); return;
    }
    closeModal();
    ROOT.ORT_ITIN_EDITOR._startMerged(ordered, title, state.cc);
  }

  function open(cc, itId, lang) {
    cc = (cc || '').toUpperCase();
    lang = (lang || 'fr').slice(0, 2);
    state.cc = cc; state.lang = lang; state.view = 'map';
    ensureCSS();
    Promise.all([
      loadItins(cc, lang),
      fetchJSON('/data/photos-json/photos_lieux.json')
    ]).then(function (res) {
      var itins = res[0] || [];
      state.photosDb = res[1] || {};
      var current = itins.find(function (it) { return sameItin(itinId(it), itId); });
      if (!current) current = { id: itId, title: document.title, days_plan: [] };
      state.current = current;
      state.others = itins.filter(function (it) { return !sameItin(itinId(it), itId) && daysOf(it).length; });
      console.log('[MERGE] open cc=', cc, 'itId=', itId, '| itins chargés=', itins.length, '| current trouvé=', !!itins.find(function (it) { return sameItin(itinId(it), itId); }), '| currentDays=', daysOf(current).length, '| autres=', state.others.length);
      buildModal();
    }).catch(function () { alert(L(lang).err); });
  }

  var cssDone = false;
  function ensureCSS() {
    if (cssDone) return; cssDone = true;
    var css = '.ort-merge-bg{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:10050;display:flex;align-items:center;justify-content:center;padding:18px}'
      + '.ort-merge-box{position:relative;background:#fff;border-radius:16px;max-width:480px;width:100%;max-height:85vh;overflow:auto;padding:24px;box-shadow:0 25px 80px rgba(0,0,0,.5)}'
      + '.ort-merge-box h2{margin:0 0 8px;font-size:1.25rem;color:#113f7a}'
      + '.ort-merge-intro{margin:0 0 12px;font-size:.9rem;color:#2c3e50;line-height:1.45}'
      + '.ort-merge-warn{background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;border-radius:8px;padding:10px 12px;font-size:.82rem;line-height:1.45;margin-bottom:14px}'
      + '.ort-merge-view{display:inline-flex;background:#f1f5f9;border-radius:20px;padding:3px;margin-bottom:12px}'
      + '.ort-merge-view button{background:none;border:0;padding:6px 16px;border-radius:18px;cursor:pointer;font-size:.82rem;font-weight:600;color:#64748b}'
      + '.ort-merge-view button.active{background:#113f7a;color:#fff}'
      + '.ort-merge-list{display:flex;flex-direction:column;gap:8px;margin-bottom:16px}'
      + '.ort-merge-item{display:flex;align-items:center;gap:12px;border:1px solid #e2e8f0;border-radius:10px;padding:8px 12px 8px 10px;cursor:pointer}'
      + '.ort-merge-item:hover{border-color:#113f7a}'
      + '.ort-merge-item input{width:18px;height:18px;flex:0 0 auto;cursor:pointer}'
      + '.ort-merge-photo{width:78px;height:56px;flex:0 0 auto;border-radius:8px;background-size:cover;background-position:center;background-color:#eaf2f8;transition:transform .18s ease,box-shadow .18s ease}'
      + '.ort-merge-item:hover .ort-merge-photo{transform:scale(2.3);transform-origin:left center;position:relative;z-index:20;box-shadow:0 10px 28px rgba(0,0,0,.45);border:2px solid #fff}'
      + '.ort-merge-current{background:#eef6ff;border-color:#113f7a}'
      + '.ort-merge-cur-mark{width:18px;flex:0 0 auto;text-align:center;color:#113f7a;font-weight:700;font-size:1rem}'
      + '.ort-merge-it-cur{font-size:.7rem;font-weight:700;color:#113f7a;text-transform:uppercase;letter-spacing:.04em;margin-bottom:1px}'
      + '.ort-merge-it-txt{display:flex;flex-direction:column;min-width:0}'
      + '.ort-merge-it-title{font-weight:600;font-size:.92rem;color:#2c3e50;line-height:1.3}'
      + '.ort-merge-it-meta{font-size:.78rem;color:#7f8c8d}'
      + '.ort-merge-empty{font-size:.9rem;color:#7f8c8d;margin:0 0 16px}'
      + '.ort-merge-actions{display:flex;gap:10px;justify-content:flex-end}'
      + '.ort-merge-cancel{background:#f1f5f9;border:none;border-radius:8px;padding:10px 18px;cursor:pointer;font-weight:600;font-size:.9rem;color:#334155}'
      + '.ort-merge-go{background:#113f7a;color:#fff;border:none;border-radius:8px;padding:10px 20px;cursor:pointer;font-weight:700;font-size:.9rem}'
      + '.ort-merge-x{position:absolute;top:12px;right:14px;background:none;border:none;font-size:24px;line-height:1;cursor:pointer;color:#94a3b8}';
    var st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);
  }

  ROOT.ORT_MERGE = {
    open: open,
    _close: closeModal,
    _validate: validate,
    _view: setView,
    // exposés pour tests unitaires
    _dedupeDays: dedupeDays,
    _nearestNeighbor: nearestNeighbor,
    _mergeAndOrder: mergeAndOrder,
    _mapUrl: mapUrl,
    _slugify: slugify
  };

})(typeof window !== 'undefined' ? window : globalThis);
