// web/js/poi-panel.js
(function () {
  console.log("poi-panel.js chargé ✅");

  // ---- DOM ----
  const els = {
    list: document.getElementById("poiList"),
    ctUnesco: document.getElementById("ctUnesco"),
    ctParks: document.getElementById("ctParks"),
    tgUnesco: document.getElementById("tgUnesco"),
    tgParks: document.getElementById("tgParks"),
    prev: document.getElementById("prev"),
    next: document.getElementById("next"),
    page: document.getElementById("page"),
  };

  // ---- État ----
  const state = {
    lang: "fr",
    bbox: [-90, -180, 90, 180],   // [S,W,N,E]
    mapZoom: 5,
    toggles: { unesco: true, parks: true },
    dataCache: new Map(),         // "unesco.fr" -> Array
    descCache: new Map(),         // "desc.fr"   -> {id: "..." }
    imgCache: new Map(),          // "img"       -> {id: "url" }
    selected: new Set(),          // ids sélectionnés
    allPoints: [],                // points normaux (après filtres)
    page: 1,
    pageSize: 50,
  };

  // ---- Utils ----
  const post = (msg) => { try { window.parent.postMessage(msg, "*"); } catch(_){} };
  // b = [west, south, east, north]
const inBBox = (p, b) => p.lon >= b[0] && p.lon <= b[2] && p.lat >= b[1] && p.lat <= b[3];


  const normalize = (arr, kind) =>
    (arr || []).map(r => ({
      id: r.id, title: r.title, lat:+r.lat, lon:+r.lon, iso2: r.iso2 || null, kind
    })).filter(x => Number.isFinite(x.lat) && Number.isFinite(x.lon) && x.id);

  async function fetchJSON(url){ try{ const r=await fetch(url,{cache:"no-store"}); if(!r.ok) throw 0; return await r.json(); } catch(_){ return null; } }
  async function loadArray(key,url){ if(!state.dataCache.has(key)) state.dataCache.set(key, Array.isArray(await fetchJSON(url))? await fetchJSON(url): []); return state.dataCache.get(key); }
  async function loadObj(key,url){ if(!state.dataCache.has(key)) state.dataCache.set(key, (await fetchJSON(url)) || {}); return state.dataCache.get(key); }

  async function loadSources(lang){
    const unesco = await loadArray(`unesco.${lang}`, `./data/unesco.${lang}.json`);
    const parks  = await loadArray(`parks.${lang}`,  `./data/parks.${lang}.json`);
    const desc   = await loadObj  (`desc.${lang}`,   `./data/cache/poi_desc.${lang}.json`);
    const imgs   = await loadObj  (`img`,            `./data/cache/poi_img.json`);
    return { unesco, parks, desc, imgs };
  }

  function withMeta(p, caches){
    const d = caches.desc[p.id]; const im = caches.imgs[p.id];
    return { ...p, desc: typeof d === 'string' ? d : undefined, img: typeof im === 'string' ? im : undefined };
  }

  // ---- Rendu liste (page courante) ----
  function renderList(){
    const start = (state.page - 1) * state.pageSize;
    const end   = start + state.pageSize;
    const slice = state.allPoints.slice(start, end);

    els.list.innerHTML = '';
    for (const p of slice){
      const row = document.createElement('div');
      row.className = 'poi-item';
      row.setAttribute('role', 'listitem');
      row.innerHTML = `
        <div class="i ${p.kind === 'unesco' ? 'u' : 'p'}">!</div>
        <div class="t">
          <button class="name" title="Centrer" aria-label="Centrer sur ${escapeHtml(p.title)}">${escapeHtml(p.title)}</button>
        </div>
        <button class="sel" aria-label="${state.selected.has(p.id)?'Retirer':'Ajouter'} ${escapeHtml(p.title)}">
          ${state.selected.has(p.id)?'Retirer':'Ajouter'}
        </button>
      `;

      // Focus carte depuis la liste
      const focus = () => post({ type:"POI_FOCUS", id:p.id, lat:p.lat, lon:p.lon });
      row.querySelector('.name').addEventListener('click', focus);
      row.querySelector('.name').addEventListener('keydown', (ev)=>{ if(ev.key==='Enter'||ev.key===' '){ ev.preventDefault(); focus(); } });
      row.querySelector('.name').setAttribute('tabindex','0');

      // Toggle sélection
      row.querySelector('.sel').addEventListener('click', ()=>{
        if (state.selected.has(p.id)) {
          state.selected.delete(p.id);
          post({ type:"POI_REMOVE", poi:p });
        } else {
          state.selected.add(p.id);
          post({ type:"POI_ADD", poi:p });
        }
        row.querySelector('.sel').textContent = state.selected.has(p.id)?'Retirer':'Ajouter';
        row.querySelector('.sel').setAttribute('aria-label', state.selected.has(p.id)?`Retirer ${p.title}`:`Ajouter ${p.title}`);
      });

      els.list.appendChild(row);
    }
    els.page.textContent = String(state.page);
    els.prev.disabled = state.page <= 1;
    els.next.disabled = state.page >= Math.max(1, Math.ceil(state.allPoints.length / state.pageSize));
  }

  function escapeHtml(s){ return String(s??'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }

  // ---- Update complet (compteurs + bbox + envoi markers) ----
  async function update(){
    const { unesco, parks, desc, imgs } = await loadSources(state.lang);

    // Compteurs bruts
    els.ctUnesco.textContent = (unesco||[]).length;
    els.ctParks.textContent  = (parks||[]).length;

    // Pool points + filtre bbox
    const pool = [
      ...(state.toggles.unesco ? normalize(unesco,'unesco') : []),
      ...(state.toggles.parks  ? normalize(parks, 'park')   : []),
    ];
    const visible = pool.filter(p => inBBox(p, state.bbox));

    // Liste (points uniquement)
    state.allPoints = visible.map(p => withMeta(p, {desc, imgs}));
    state.page = 1;
    renderList();

    // ENVOI AU PARENT : marqueurs carte (points uniquement ici)
    post({
      type: 'POI_MARKERS',
      items: state.allPoints.map(p => ({
        id: p.id, title: p.title, kind: p.kind, lat: p.lat, lon: p.lon, iso2: p.iso2,
        desc: p.desc, img: p.img
      }))
    });
  }

  // ---- UI ----
  els.tgUnesco.addEventListener('change', ()=>{ state.toggles.unesco = !!els.tgUnesco.checked; update(); });
  els.tgParks .addEventListener('change', ()=>{ state.toggles.parks  = !!els.tgParks.checked;  update(); });
  els.prev.addEventListener('click', ()=>{ if(state.page>1){ state.page--; renderList(); } });
  els.next.addEventListener('click', ()=>{ const max=Math.max(1,Math.ceil(state.allPoints.length/state.pageSize)); if(state.page<max){ state.page++; renderList(); } });

  // ---- Messages du parent ----
  window.addEventListener('message', (e)=>{
    const m = e.data;
    if (!m || m.type !== 'POI_STATE') return;
    state.lang = m.lang || state.lang;
    state.bbox = Array.isArray(m.bbox) ? m.bbox : state.bbox;
    state.mapZoom = Number.isFinite(m.mapZoom) ? m.mapZoom : state.mapZoom;
    update();
  });

  // ---- Mode test si ouvert seul ----
  if (window.top === window.self) { state.lang='fr'; state.bbox=[40,-5,52,10]; update(); }
})();

