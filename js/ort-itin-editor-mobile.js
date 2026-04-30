/**
 * ort-itin-editor-mobile.js
 * Éditeur d'itinéraire mobile, autonome.
 *
 * Dépend de l'existant côté roadtrip_mobile.html :
 *   - window.state              (state.steps mutable)
 *   - window.map                (Leaflet map)
 *   - window.markers            (markers itinéraire)
 *   - window.routeLayer         (polyline route OSRM)
 *   - window.PLACES_INDEX       (master du pays, indexé par place_id)
 *   - window.saveTrip()         (sauvegarde async via ORT_STATE)
 *   - window.fetchAndDrawRoute()(recalcule la route OSRM depuis state.steps)
 *   - window.renderMarkers()    (redessine les markers itinéraire)
 *   - window.renderList()       (redessine la liste itinéraire)
 *   - window.i18n(key)          (traduction)
 *   - firebase.auth().currentUser
 *
 * Expose : window.ORT_MOBILE_EDIT = { launch, toggleOtherPlaces, isActive }
 */
(function () {
  'use strict';

  // ---------- État interne ----------
  var st = {
    active: false,
    newOrder: [],          // tableau d'idx (dans allSteps) construit par l'utilisateur
    deleted: [],           // idx supprimés
    addedStepsBuffer: [],  // steps ajoutés via OP, vivent à part jusqu'à validation
    opLayer: null,
    opVisible: false,
    badges: [],
    snapshotSteps: null,
    routeDirty: false,
    routeTimer: null
  };

  // ---------- i18n ----------
  // On utilise window.i18n(key) si dispo. Sinon fallback FR.
  var FALLBACK_FR = {
    oem_intro_title: 'Mode édition activé',
    oem_intro_line1: 'Tap sur un numéro = ajouter au nouvel ordre',
    oem_intro_line2: 'Double-tap sur un numéro = supprimer / réintégrer',
    oem_intro_line3: 'Tap sur un endroit hors itinéraire = possibilité d\u2019ajouter ce lieu',
    oem_intro_footer: 'Validez ou annulez en bas de l\u2019écran.',
    oem_intro_ok: 'C\u2019est parti',
    oem_prereq_login_title: 'Connexion requise',
    oem_prereq_login_body: 'Vous devez être connecté pour modifier votre itinéraire. Vos changements seront enregistrés dans votre Dashboard.',
    oem_prereq_save_title: 'Sauvegarde requise',
    oem_prereq_save_body: 'Pour modifier l\u2019itinéraire, sauvegardez d\u2019abord votre voyage. Voulez-vous le faire maintenant ?',
    oem_prereq_login_btn: 'Se connecter',
    oem_prereq_save_btn: 'Sauvegarder',
    oem_cancel: 'Annuler',
    oem_validate: 'Valider',
    oem_no_changes: 'Aucune modification',
    oem_must_keep_one: 'Au moins une étape requise',
    oem_save_error: 'Erreur de sauvegarde',
    oem_saved: '✅ Itinéraire mis à jour',
    oem_added_toast: '✅ {name} ajouté',
    oem_no_itin: 'Aucun itinéraire à modifier',
    oem_no_map: 'Carte non chargée',
    oem_op_insert_title: 'Insérer {name} :',
    oem_op_at_start: 'Au début',
    oem_op_after: 'Après {name}',
    oem_op_visits: 'Visites',
    oem_op_activities: 'Activités'
  };
  function T(key, params) {
    var s = null;
    try { if (typeof window.i18n === 'function') s = window.i18n(key); } catch (e) {}
    if (!s || s === key) s = FALLBACK_FR[key] || key;
    if (params) {
      Object.keys(params).forEach(function (k) {
        s = s.replace('{' + k + '}', params[k]);
      });
    }
    return s;
  }

  // ---------- Helpers ----------
  function $(id) { return document.getElementById(id); }
  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function escapeAttr(s) {
    if (s == null) return '';
    return String(s).replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }
  function isLoggedIn() {
    try { return !!(window.firebase && firebase.auth && firebase.auth().currentUser); }
    catch (e) { return false; }
  }
  function isTripSaved() {
    var tid = (window.ORT_TRIPID && window.ORT_TRIPID.get && window.ORT_TRIPID.get())
              || window.state?.tripId
              || window.state?._originalItinId;
    if (!tid) return false;
    if (typeof tid === 'string' && tid.startsWith('catalog::')) return false;
    return true;
  }
  function toast(msg, kind) {
    if (typeof window.showToast === 'function') {
      try { window.showToast(msg); return; } catch (e) {}
    }
    var t = document.createElement('div');
    t.textContent = msg;
    Object.assign(t.style, {
      position:'fixed', bottom:'80px', left:'50%', transform:'translateX(-50%)',
      background: kind === 'warn' ? '#b45309' : '#113f7a',
      color:'#fff', padding:'10px 18px', borderRadius:'10px',
      boxShadow:'0 4px 12px rgba(0,0,0,0.3)', zIndex: 14000, fontWeight:'600',
      fontSize:'14px', maxWidth:'90%'
    });
    document.body.appendChild(t);
    setTimeout(function(){
      t.style.transition='opacity .3s'; t.style.opacity='0';
      setTimeout(function(){ try { t.remove(); } catch(e){} }, 300);
    }, 2500);
  }

  // ---------- Modale "prerequis" (login / save) ----------
  function showPrereqModal() {
    var loggedIn = isLoggedIn();
    var saved = loggedIn && isTripSaved();
    if (loggedIn && saved) return false;

    var bg = document.createElement('div');
    bg.id = 'oem-prereq-modal';
    Object.assign(bg.style, {
      position:'fixed', inset:'0', background:'rgba(0,0,0,0.5)',
      zIndex: 15000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px'
    });
    var box = document.createElement('div');
    Object.assign(box.style, {
      background:'#fff', borderRadius:'14px', padding:'24px 22px',
      maxWidth:'360px', width:'100%', boxShadow:'0 10px 30px rgba(0,0,0,0.3)',
      lineHeight:'1.5'
    });
    var title = !loggedIn ? T('oem_prereq_login_title') : T('oem_prereq_save_title');
    var body = !loggedIn ? T('oem_prereq_login_body') : T('oem_prereq_save_body');
    var actionLabel = !loggedIn ? T('oem_prereq_login_btn') : T('oem_prereq_save_btn');

    box.innerHTML =
      '<h3 style="margin:0 0 14px;color:#113f7a;font-size:1.1rem">' + escapeHtml(title) + '</h3>' +
      '<p style="margin:0 0 22px;color:#374151;font-size:.95rem">' + escapeHtml(body) + '</p>' +
      '<div style="display:flex;gap:10px;justify-content:flex-end">' +
      '  <button id="oem-prereq-cancel" style="padding:9px 16px;border-radius:9px;border:1px solid #cbd5e1;background:#fff;cursor:pointer;font-size:.92rem">' + escapeHtml(T('oem_cancel')) + '</button>' +
      '  <button id="oem-prereq-action" style="padding:9px 16px;border-radius:9px;border:none;background:#113f7a;color:#fff;cursor:pointer;font-size:.92rem;font-weight:600">' + escapeHtml(actionLabel) + '</button>' +
      '</div>';
    bg.appendChild(box);
    document.body.appendChild(bg);

    function close() { try { bg.remove(); } catch(e){} }
    $('oem-prereq-cancel').onclick = close;
    $('oem-prereq-action').onclick = function () {
      close();
      if (!loggedIn) {
        var lm = $('loginRequiredModal');
        if (lm) {
          lm.style.display = 'flex';
          if (typeof window.applyI18n === 'function') applyI18n();
        }
      } else if (typeof window.saveTrip === 'function') {
        window.saveTrip().then(function () {
          setTimeout(launch, 300);
        }).catch(function () {});
      }
    };
    return true;
  }

  // ---------- Modale d'intro (à chaque entrée en mode édition) ----------
  function showIntroModal(onOk) {
    var bg = document.createElement('div');
    bg.id = 'oem-intro-modal';
    Object.assign(bg.style, {
      position:'fixed', inset:'0', background:'rgba(0,0,0,0.5)',
      zIndex: 15000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px'
    });
    var box = document.createElement('div');
    Object.assign(box.style, {
      background:'#fff', borderRadius:'14px', padding:'24px 22px',
      maxWidth:'380px', width:'100%', boxShadow:'0 10px 30px rgba(0,0,0,0.3)',
      lineHeight:'1.55'
    });

    box.innerHTML =
      '<h3 style="margin:0 0 16px;color:#113f7a;font-size:1.15rem;text-align:center">✏️ ' + escapeHtml(T('oem_intro_title')) + '</h3>' +
      '<div style="display:flex;flex-direction:column;gap:12px;margin-bottom:18px">' +
      '  <div style="display:flex;gap:10px;align-items:flex-start">' +
      '    <span style="flex:none;width:22px;height:22px;border-radius:50%;background:#113f7a;color:#fff;display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:700">1</span>' +
      '    <span style="color:#374151;font-size:.92rem">' + escapeHtml(T('oem_intro_line1')) + '</span>' +
      '  </div>' +
      '  <div style="display:flex;gap:10px;align-items:flex-start">' +
      '    <span style="flex:none;width:22px;height:22px;border-radius:50%;background:#dc2626;color:#fff;display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:700">✕</span>' +
      '    <span style="color:#374151;font-size:.92rem">' + escapeHtml(T('oem_intro_line2')) + '</span>' +
      '  </div>' +
      '  <div style="display:flex;gap:10px;align-items:flex-start">' +
      '    <span style="flex:none;width:22px;height:22px;border-radius:50%;background:#94a3b8;color:#fff;display:flex;align-items:center;justify-content:center;font-size:.85rem;font-weight:700">+</span>' +
      '    <span style="color:#374151;font-size:.92rem">' + escapeHtml(T('oem_intro_line3')) + '</span>' +
      '  </div>' +
      '</div>' +
      '<p style="margin:0 0 18px;color:#64748b;font-size:.85rem;text-align:center;font-style:italic">' + escapeHtml(T('oem_intro_footer')) + '</p>' +
      '<div style="display:flex;justify-content:center">' +
      '  <button id="oem-intro-ok" style="padding:11px 28px;border-radius:9px;border:none;background:#113f7a;color:#fff;cursor:pointer;font-size:.95rem;font-weight:700">' + escapeHtml(T('oem_intro_ok')) + '</button>' +
      '</div>';
    bg.appendChild(box);
    document.body.appendChild(bg);

    function close() { try { bg.remove(); } catch(e){} }
    $('oem-intro-ok').onclick = function () { close(); onOk(); };
  }

  // ---------- Barre Annuler / Valider ----------
  function showActionBar() {
    var bar = $('oem-action-bar');
    if (bar) { bar.style.display = 'flex'; return; }
    bar = document.createElement('div');
    bar.id = 'oem-action-bar';
    Object.assign(bar.style, {
      position:'fixed', left:'0', right:'0', bottom:'0',
      background:'rgba(255,255,255,0.97)', borderTop:'1px solid #e2e8f0',
      padding:'10px 14px', display:'flex', gap:'10px',
      zIndex: 13000, boxShadow:'0 -2px 12px rgba(0,0,0,0.1)'
    });
    bar.innerHTML =
      '<button id="oem-cancel" style="flex:1;padding:12px;border-radius:10px;border:1px solid #cbd5e1;background:#fff;color:#374151;font-weight:600;cursor:pointer">' + escapeHtml(T('oem_cancel')) + '</button>' +
      '<button id="oem-validate" style="flex:1;padding:12px;border-radius:10px;border:none;background:#113f7a;color:#fff;font-weight:700;cursor:pointer">' + escapeHtml(T('oem_validate')) + '</button>';
    document.body.appendChild(bar);
    $('oem-cancel').onclick = cancel;
    $('oem-validate').onclick = validate;
  }
  function hideActionBar() {
    var bar = $('oem-action-bar');
    if (bar) bar.style.display = 'none';
  }

  // ---------- Snapshot / restore ----------
  function snapshotState() {
    try { st.snapshotSteps = JSON.parse(JSON.stringify(window.state.steps || [])); }
    catch (e) { st.snapshotSteps = null; }
  }
  function restoreSnapshot() {
    if (st.snapshotSteps) {
      window.state.steps = st.snapshotSteps;
      st.snapshotSteps = null;
    }
  }

  // ---------- Construction de l'ordre courant (pour la route + les badges) ----------
  // Retourne le tableau de steps "tel qu'il sera après validation",
  // sans muter l'état.
  function buildCurrentSteps() {
    var allSteps = (st.snapshotSteps || []).slice().concat(st.addedStepsBuffer);
    if (st.newOrder.length > 0) {
      return st.newOrder.map(function (i) { return allSteps[i]; }).filter(Boolean);
    }
    var del = {};
    st.deleted.forEach(function (i) { del[i] = true; });
    return allSteps.filter(function (s, i) { return !del[i]; });
  }

  // ---------- Recalcul de la route (pendant l'édition) ----------
  // On mute state.steps temporairement avec l'ordre courant pour réutiliser
  // window.fetchAndDrawRoute (qui lit state.steps). À l'annulation, on restaure.
  function refreshRouteDebounced() {
    if (st.routeTimer) clearTimeout(st.routeTimer);
    st.routeTimer = setTimeout(function () {
      st.routeTimer = null;
      var newSteps = buildCurrentSteps();
      if (newSteps.length === 0) {
        // pas assez d'étapes : on vire la polyline
        if (window.routeLayer) {
          try { window.map.removeLayer(window.routeLayer); } catch(e){}
          window.routeLayer = null;
        }
        return;
      }
      window.state.steps = newSteps;
      if (typeof window.fetchAndDrawRoute === 'function') {
        try { window.fetchAndDrawRoute(); } catch (e) { console.warn('[OEM] route err', e); }
      }
    }, 350);
  }

  // ---------- Badges numérotés ----------
  function clearBadges() {
    st.badges.forEach(function (b) { try { window.map.removeLayer(b); } catch(e){} });
    st.badges = [];
  }
  function refreshBadges() {
    clearBadges();
    if (!window.map) return;

    var allSteps = (st.snapshotSteps || []).slice().concat(st.addedStepsBuffer);
    var newOrderUsed = st.newOrder.length > 0 || st.deleted.length > 0;

    allSteps.forEach(function (step, idx) {
      if (!step || !step.lat) return;
      var lng = step.lng || step.lon;
      if (!lng) return;

      var label, bg, color;
      if (st.deleted.indexOf(idx) >= 0) {
        label = '✕'; bg = '#dc2626'; color = '#fff';
      } else {
        var rank = st.newOrder.indexOf(idx);
        if (rank >= 0) {
          label = String(rank + 1); bg = '#113f7a'; color = '#fff';
        } else if (!newOrderUsed) {
          label = String(idx + 1); bg = '#94a3b8'; color = '#fff';
        } else {
          label = '?'; bg = '#cbd5e1'; color = '#475569';
        }
      }

      var html = '<div style="background:' + bg + ';color:' + color + ';' +
                 'width:32px;height:32px;border-radius:50%;display:flex;' +
                 'align-items:center;justify-content:center;font-weight:700;' +
                 'font-size:14px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4)">' +
                 label + '</div>';

      var icon = L.divIcon({
        className: 'oem-badge',
        html: html,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      var m = L.marker([step.lat, lng], { icon: icon, zIndexOffset: 1000 });

      var lastTap = 0;
      var tapTimer = null;
      m.on('click', function () {
        var now = Date.now();
        if (now - lastTap < 350) {
          if (tapTimer) { clearTimeout(tapTimer); tapTimer = null; }
          toggleDeleted(idx);
          lastTap = 0;
        } else {
          lastTap = now;
          if (tapTimer) clearTimeout(tapTimer);
          tapTimer = setTimeout(function () {
            tapTimer = null;
            toggleInOrder(idx);
          }, 280);
        }
      });

      m.addTo(window.map);
      st.badges.push(m);
    });
  }

  function toggleInOrder(idx) {
    if (st.deleted.indexOf(idx) >= 0) return;
    var i = st.newOrder.indexOf(idx);
    if (i >= 0) st.newOrder.splice(i, 1);
    else st.newOrder.push(idx);
    refreshBadges();
    refreshRouteDebounced();
  }
  function toggleDeleted(idx) {
    var i = st.deleted.indexOf(idx);
    if (i >= 0) {
      st.deleted.splice(i, 1);
    } else {
      st.deleted.push(idx);
      var j = st.newOrder.indexOf(idx);
      if (j >= 0) st.newOrder.splice(j, 1);
    }
    refreshBadges();
    refreshRouteDebounced();
  }

  // ---------- Couche "autres places" (cercles cliquables) ----------
  function buildOtherPlacesLayer() {
    if (st.opLayer) { try { window.map.removeLayer(st.opLayer); } catch(e){} st.opLayer = null; }
    if (!window.PLACES_INDEX) return;

    var alreadyIn = {};
    var baseSteps = (st.snapshotSteps || window.state.steps || []);
    baseSteps.forEach(function (s) {
      var pid = s.place_id || s.placeId;
      if (pid) alreadyIn[pid] = true;
    });
    st.addedStepsBuffer.forEach(function (s) {
      var pid = s.place_id || s.placeId;
      if (pid) alreadyIn[pid] = true;
    });

    var layer = L.layerGroup();
    Object.keys(window.PLACES_INDEX).forEach(function (pid) {
      if (alreadyIn[pid]) return;
      var p = window.PLACES_INDEX[pid];
      if (!p || !p.lat) return;
      var lng = p.lon || p.lng;
      if (!lng) return;

      var rating = p.rating || 0;
      var bg = rating >= 9 ? '#f59e0b' : rating >= 8 ? '#3b82f6' : rating >= 7 ? '#10b981' : '#94a3b8';

      var html = '<div style="background:' + bg + ';color:#fff;' +
                 'width:24px;height:24px;border-radius:50%;display:flex;' +
                 'align-items:center;justify-content:center;font-size:11px;font-weight:700;' +
                 'border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,0.3);opacity:0.9">+</div>';
      var icon = L.divIcon({
        className: 'oem-op',
        html: html,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      var m = L.marker([p.lat, lng], { icon: icon });
      m.on('click', function () { openOpPopup(pid); });
      layer.addLayer(m);
    });
    layer.addTo(window.map);
    st.opLayer = layer;
  }
  function clearOtherPlacesLayer() {
    if (st.opLayer) { try { window.map.removeLayer(st.opLayer); } catch(e){} st.opLayer = null; }
  }
  function toggleOtherPlaces() {
    st.opVisible = !st.opVisible;
    if (st.opVisible) buildOtherPlacesLayer();
    else clearOtherPlacesLayer();
    return st.opVisible;
  }

  // ---------- Popup d'ajout (autres places) ----------
  // Layout : positions en haut (scrollable, ~4 visibles), puis détails (photos, visites, activités)
  function openOpPopup(pid) {
    var p = window.PLACES_INDEX && window.PLACES_INDEX[pid];
    if (!p) return;
    var existing = $('oem-op-popup');
    if (existing) try { existing.remove(); } catch(e){}

    var photos = (p.photos || p.images || []).slice(0, 3);
    var visits = (p.visits || []).slice(0, 8);
    var activities = (p.activities || []).slice(0, 8);
    var currentOrder = buildCurrentSteps();

    // --- bloc positions (en haut, scrollable, 4 visibles) ---
    var positionsHtml = '<div style="padding:14px 16px 10px;border-bottom:1px solid #e5e7eb">' +
      '<p style="margin:0 0 10px;font-weight:700;color:#113f7a;font-size:.95rem">📍 ' +
      escapeHtml(T('oem_op_insert_title', { name: p.name })) + '</p>' +
      '<div style="max-height:184px;overflow-y:auto;padding-right:4px">'; // ~4 boutons de 44px

    positionsHtml += posBtnHtml(0, '↑', '#e11d48', T('oem_op_at_start'), true);
    currentOrder.forEach(function (step, idx) {
      positionsHtml += posBtnHtml(idx + 1, String(idx + 1), '#113f7a',
        T('oem_op_after', { name: '<strong>' + escapeHtml(step.name) + '</strong>' }), false);
    });

    positionsHtml += '</div></div>';

    // --- détails du lieu (en bas) ---
    var photosHtml = '';
    if (photos.length) {
      photosHtml = '<div style="display:flex;gap:6px;overflow-x:auto;margin-bottom:14px">' +
        photos.map(function (u) {
          return '<img src="' + escapeAttr(u) + '" style="height:90px;border-radius:8px;flex:none;object-fit:cover" loading="lazy" onerror="this.style.display=\'none\'">';
        }).join('') + '</div>';
    }

    var visitsHtml = '';
    if (visits.length) {
      visitsHtml = '<p style="margin:0 0 6px;font-weight:700;color:#374151;font-size:.88rem">🏛️ ' + escapeHtml(T('oem_op_visits')) + '</p>' +
        '<ul style="margin:0 0 14px;padding-left:20px;color:#475569;font-size:.85rem;line-height:1.6">' +
        visits.map(function (v) { return '<li>' + escapeHtml(v.text || v) + '</li>'; }).join('') +
        '</ul>';
    }
    var actsHtml = '';
    if (activities.length) {
      actsHtml = '<p style="margin:0 0 6px;font-weight:700;color:#374151;font-size:.88rem">🎯 ' + escapeHtml(T('oem_op_activities')) + '</p>' +
        '<ul style="margin:0;padding-left:20px;color:#475569;font-size:.85rem;line-height:1.6">' +
        activities.map(function (a) { return '<li>' + escapeHtml(a.text || a) + '</li>'; }).join('') +
        '</ul>';
    }

    var detailsHtml = '<div style="padding:14px 16px 18px;overflow-y:auto;flex:1">' +
      photosHtml + visitsHtml + actsHtml + '</div>';

    // --- assemblage ---
    var bg = document.createElement('div');
    bg.id = 'oem-op-popup';
    Object.assign(bg.style, {
      position:'fixed', inset:'0', background:'rgba(0,0,0,0.5)',
      zIndex: 14500, display:'flex', alignItems:'flex-end', justifyContent:'center'
    });
    var box = document.createElement('div');
    Object.assign(box.style, {
      background:'#fff', borderRadius:'14px 14px 0 0',
      width:'100%', maxWidth:'500px', maxHeight:'85vh',
      display:'flex', flexDirection:'column',
      boxShadow:'0 -4px 16px rgba(0,0,0,0.3)'
    });

    var headerHtml =
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:14px 16px 0">' +
      '  <h3 style="margin:0;color:#113f7a;font-size:1.1rem">' + escapeHtml(p.name) + '</h3>' +
      '  <button id="oem-op-close" style="background:none;border:none;font-size:24px;cursor:pointer;color:#94a3b8;padding:0;line-height:1">×</button>' +
      '</div>';

    box.innerHTML = headerHtml + positionsHtml + detailsHtml;
    bg.appendChild(box);
    document.body.appendChild(bg);

    function close() { try { bg.remove(); } catch(e){} }
    bg.addEventListener('click', function (e) { if (e.target === bg) close(); });
    $('oem-op-close').onclick = close;

    box.querySelectorAll('.oem-pos-btn').forEach(function (btn) {
      btn.onclick = function () {
        var pos = parseInt(btn.dataset.pos, 10);
        addPlaceAt(pid, pos);
        close();
      };
    });
  }

  function posBtnHtml(pos, label, bg, text, isFirst) {
    return '<button class="oem-pos-btn" data-pos="' + pos + '" style="display:flex;align-items:center;gap:10px;width:100%;padding:10px 12px;border:1px solid #e5e7eb;border-radius:9px;background:#fff;cursor:pointer;text-align:left;margin-bottom:6px;font-family:inherit">' +
      '<span style="background:' + bg + ';color:#fff;width:26px;height:26px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:.78rem;font-weight:700;flex:none">' + label + '</span>' +
      '<span style="font-size:.88rem;color:#374151' + (isFirst ? ';font-weight:600' : '') + '">' + text + '</span></button>';
  }

  // ---------- Ajout d'un lieu master à une position ----------
  function addPlaceAt(pid, posInFinalOrder) {
    var p = window.PLACES_INDEX[pid];
    if (!p) return;

    var newStep = {
      name: p.name,
      lat: p.lat,
      lng: p.lon || p.lng,
      lon: p.lon || p.lng,
      nights: p.suggested_days || 1,
      place_id: pid,
      placeId: pid,
      photos: p.photos || p.images || [],
      images: p.images || p.photos || [],
      description: '',
      visits: p.visits || [],
      activities: p.activities || [],
      rating: p.rating || 0,
      suggested_days: p.suggested_days || 1,
      _isNewFromOP: true,
      map_keywords: p.map_keywords || []
    };

    // L'idx de ce nouveau step dans l'union [snapshotSteps, addedStepsBuffer]
    var newIdx = (st.snapshotSteps || []).length + st.addedStepsBuffer.length;
    st.addedStepsBuffer.push(newStep);

    // S'assurer que newOrder reflète l'ordre courant (sinon le nouveau finirait isolé)
    if (st.newOrder.length === 0) {
      var deletedSet = {};
      st.deleted.forEach(function (i) { deletedSet[i] = true; });
      var totalBeforeAdd = newIdx;
      st.newOrder = [];
      for (var k = 0; k < totalBeforeAdd; k++) {
        if (!deletedSet[k]) st.newOrder.push(k);
      }
    }
    st.newOrder.splice(posInFinalOrder, 0, newIdx);

    if (st.opVisible) buildOtherPlacesLayer();
    refreshBadges();
    refreshRouteDebounced();
    toast(T('oem_added_toast', { name: p.name }));
  }

  // ---------- Cycle de vie ----------
  function launch() {
    if (st.active) return;
    if (showPrereqModal()) return;

    if (!window.state || !Array.isArray(window.state.steps) || window.state.steps.length === 0) {
      toast(T('oem_no_itin'), 'warn');
      return;
    }
    if (!window.map) {
      toast(T('oem_no_map'), 'warn');
      return;
    }
    if (typeof window.switchTab === 'function') {
      try { window.switchTab('map'); } catch(e){}
    }

    showIntroModal(function () {
      st.active = true;
      st.newOrder = [];
      st.deleted = [];
      st.addedStepsBuffer = [];
      snapshotState();

      document.body.classList.add('oem-active');

      // Cacher les markers normaux
      if (Array.isArray(window.markers)) {
        window.markers.forEach(function (m) { try { window.map.removeLayer(m); } catch(e){} });
      }

      refreshBadges();
      showActionBar();

      // Afficher la couche OP par défaut
      st.opVisible = true;
      buildOtherPlacesLayer();
    });
  }

  function cancel() {
    if (!st.active) return;
    restoreSnapshot();
    teardown();
    if (typeof window.renderMarkers === 'function') window.renderMarkers();
    if (typeof window.fetchAndDrawRoute === 'function') {
      try { window.fetchAndDrawRoute(); } catch(e){}
    }
    if (typeof window.renderList === 'function') window.renderList();
  }

  function validate() {
    if (!st.active) return;

    if (st.newOrder.length === 0 && st.deleted.length === 0 && st.addedStepsBuffer.length === 0) {
      toast(T('oem_no_changes'));
      // restaurer le snapshot pour être propre (au cas où le state a été mute)
      restoreSnapshot();
      teardown();
      if (typeof window.renderMarkers === 'function') window.renderMarkers();
      return;
    }

    var finalSteps = buildCurrentSteps();
    if (finalSteps.length === 0) {
      toast(T('oem_must_keep_one'), 'warn');
      return;
    }

    // Nettoyage des champs internes
    window.state.steps = finalSteps.map(function (s) {
      var clean = Object.assign({}, s);
      delete clean._isNewFromOP;
      return clean;
    });

    if (typeof window.saveTrip === 'function') {
      window.saveTrip().then(function () {
        teardown();
        if (typeof window.renderMarkers === 'function') window.renderMarkers();
        if (typeof window.fetchAndDrawRoute === 'function') {
          try { window.fetchAndDrawRoute(); } catch(e){}
        }
        if (typeof window.renderList === 'function') window.renderList();
        toast(T('oem_saved'));
      }).catch(function (err) {
        console.error('[OEM] saveTrip failed:', err);
        toast(T('oem_save_error'), 'warn');
      });
    } else {
      teardown();
      if (typeof window.renderMarkers === 'function') window.renderMarkers();
      if (typeof window.fetchAndDrawRoute === 'function') {
        try { window.fetchAndDrawRoute(); } catch(e){}
      }
      if (typeof window.renderList === 'function') window.renderList();
    }
  }

  function teardown() {
    st.active = false;
    st.newOrder = [];
    st.deleted = [];
    st.addedStepsBuffer = [];
    st.snapshotSteps = null;
    if (st.routeTimer) { clearTimeout(st.routeTimer); st.routeTimer = null; }
    clearBadges();
    clearOtherPlacesLayer();
    st.opVisible = false;
    hideActionBar();
    document.body.classList.remove('oem-active');
  }

  // ---------- API publique ----------
  window.ORT_MOBILE_EDIT = {
    launch: launch,
    toggleOtherPlaces: toggleOtherPlaces,
    isActive: function () { return st.active; }
  };

  console.log('[OEM] ort-itin-editor-mobile.js chargé (v2)');
})();
