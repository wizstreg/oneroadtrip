/* ===== ORT-STEP-LOADER.JS - Chargement dynamique des composants ===== */

window.ORT_STEP_LOADER = {
  
  componentsPath: 'components/steps/',
  
  components: {
    header: 'step-header.html',
    visits: 'step-visits.html',
    journal: 'step-journal.html',
    map: 'step-map.html',
    recap: 'step-recap.html',
    hotels: 'step-hotels.html',
    activities: 'step-activities.html',
    around: 'step-around.html',
    links: 'step-links.html'
  },
  
  async loadStep(tripId, stepId) {
    console.log(`[LOADER] Chargement étape: ${tripId} / ${stepId}`);
    
    try {
      // 1. Charger les données de l'étape
      const stepData = await this.fetchStepData(tripId, stepId);
      
      // 2. Charger les données personnalisées de l'utilisateur
      const userData = await window.ORT_STEP_COMMON.loadStepData(tripId, stepId);
      
      // 3. Fusionner les données
      window.ORT_STEP_STATE.data = {
        ...stepData,
        ...userData,
        metadata: {
          ...stepData.metadata,
          ...userData.metadata
        }
      };

      // Mettre à jour l'en-tête (ville + date)
      this.renderHeader();

      // 4. Charger tous les composants
      await this.loadAllComponents();

      // 5. Rendre les sections
      this.renderSections();

      
    
      console.log('[LOADER] ✅ Étape chargée');
      
    } catch (error) {
      console.error('[LOADER] Erreur:', error);
      window.ORT_STEP_COMMON.showToast('Erreur de chargement', 'error');
    }
  },
  
   async fetchStepData(tripId, stepId) {
    try {
      // tripId = "<uid>::<itin_id>", ex: "POK...::AT::austria-family-roadtrip"
    const parts  = String(tripId).split('::');
const itinId = parts.slice(1).join('::');
const CC     = itinId.split('::')[0].toUpperCase();
const ccDir  = CC.toLowerCase();

// 🔹 Si c’est un roadtrip temporaire "trip_xxx", on lit le cache local
if (/^trip_\d+$/i.test(itinId)) {
  try {
    // 1) Clé standard (stockée par Step/Detail)
    let raw = localStorage.getItem(`ort.step.cache::${tripId}`);

    // 2) Clé alternative par rtKey (quand on vient de roadtrip_detail?from=temp&rtKey=...)
    if (!raw) {
      const qs = new URLSearchParams(location.search);
      const rtKey = qs.get('rtKey') || localStorage.getItem('ort.lastRtKey') || '';
      if (rtKey) {
        raw = localStorage.getItem(`ort.tmp.rt::${rtKey}`) 
           || localStorage.getItem(`ort.tmp.rt.cache::${rtKey}`);
      }
    }

    // 3) Clé de secours par itinId (certaines implémentations ne gardent que l’itin)
    if (!raw) {
      raw = localStorage.getItem(`ort.tmp.itin::${itinId}`);
    }

    const cached = raw ? JSON.parse(raw) : null;
    if (cached && Array.isArray(cached.steps)) {
      const dayNum = Number(String(stepId||'').replace(/^\D+/,''));
      const step = cached.steps[(dayNum||1)-1] || {};
      return {
        tripId, stepId,
        tripTitle: cached.title || 'Roadtrip',
        day: dayNum || 1,
        region_code: step.region_code || '',
        night: step.night || null,
        visits: step.visits || [],
        activities: step.activities || [],
        to_next_leg: step.to_next_leg || null,
        metadata: { country: cached.country || cached.meta?.country || '', source: 'cache-local' }
      };
    }
  } catch(e) {
    console.warn('[LOADER] Cache local illisible', e);
  }
}


// Sinon, on va chercher le fichier normal
const jsonPath = `./data/Roadtripsprefabriques/countries/${ccDir}/${CC}.itins.modules.json`;
console.log('[LOADER] fetch jsonPath =', jsonPath, '| itinId =', itinId);

const response = await fetch(jsonPath, { cache: 'no-store' });
if (!response.ok) throw new Error('JSON non trouvé');


      const json = await response.json();
      const list = json.itineraries || json.itins || json.modules || [];

      // Trouver l'itinéraire par itin_id (pas par tripId)
      const itin = list.find(i => (i.itin_id || i.id) === itinId);
      if (!itin) throw new Error('Itinéraire non trouvé');

      const dayNum = parseInt(String(stepId).replace('day_', ''), 10);
      const step = (itin.days_plan || []).find(d => d.day === dayNum);
      if (!step) throw new Error('Étape non trouvée');

      return {

        tripId,
        stepId,
        tripTitle: itin.title,

        day: step.day,
        region_code: step.region_code,
        night: step.night,
        visits: step.visits || [],
        activities: step.activities || [],
        to_next_leg: step.to_next_leg,
        metadata: {
          country: json.country,
          version: json.version
        }
      };
      
    } catch (error) {
      console.error('[LOADER] Erreur fetch données:', error);
      
      // Fallback : données simulées
      return {
        tripId,
        stepId,
        tripTitle: 'Voyage test',
        day: 1,
        region_code: 'UNKNOWN',
        night: { coords: [0, 0] },
        visits: [],
        activities: [],
        metadata: {}
      };
    }
  },
  
  async loadAllComponents() {
    const promises = Object.entries(this.components).map(([name, file]) => 
      this.loadComponent(name, file)
    );
    
    await Promise.all(promises);
  },
  
  async loadComponent(name, file) {
    try {
      const response = await fetch(this.componentsPath + file);
      if (!response.ok) {
        console.warn(`[LOADER] Composant ${name} non trouvé, utilisation du fallback`);
        return this.useFallback(name);
      }
      
      const html = await response.text();
      
         // Injecter le HTML dans la section appropriée
      if (name === 'header') {
        document.getElementById('stepHeader').innerHTML = html;
      } else {
        const section = document.getElementById(`section-${name}`);
        if (section) {
          section.innerHTML = html;

          // 🔓 Assurer l'affichage des sections optionnelles si un composant dédié est chargé
          if (['hotels','activities','around','links'].includes(name)) {
            section.style.display = 'block';
          }
        }
      }

      // Appliquer les traductions
      window.ORT_I18N.applyTranslations();

      
      // Initialiser le composant (s'il a une fonction d'init)
      if (window[`ORT_STEP_${name.toUpperCase()}`] && 
          typeof window[`ORT_STEP_${name.toUpperCase()}`].init === 'function') {
        window[`ORT_STEP_${name.toUpperCase()}`].init();
      }
      
    } catch (error) {
      console.error(`[LOADER] Erreur chargement ${name}:`, error);
      this.useFallback(name);
    }
  },
  
  useFallback(name) {
    // Fallback simple si le composant n'est pas trouvé
    const d = window.ORT_STEP_STATE?.data || {};
    const city = (d.night?.place_id || '').split('::')[1]?.replace(/-/g,' ') || d.tripTitle || 'Étape';
    const dateISO = localStorage.getItem('ort.rtStartDate') || '';
    let dateStr = '';
    try{
      if (dateISO && Number.isFinite(Number(d.day))) {
        const base = new Date(dateISO); if(!isNaN(base)){ base.setDate(base.getDate() + (Number(d.day)-1)); }
        const lang=(document.documentElement.lang||'fr').slice(0,2);
        dateStr = isNaN(base)? '' : base.toLocaleDateString(lang);
      }
    }catch{}

    const fallbacks = {
      header: `<div class="step-box-header"><h1 class="step-box-title">${city}</h1>${dateStr?`<div class="mut" data-step-date>${dateStr}</div>`:''}</div>`,
      visits: '<div class="step-box-header"><h2 class="step-box-title" data-i18n="visits.title">Visites</h2></div><p data-i18n="visits.empty">Aucune visite</p>',

      journal: '<div class="step-box-header"><h2 class="step-box-title" data-i18n="journal.title">Carnet</h2></div>',
      map: '<div class="step-box-header"><h2 class="step-box-title" data-i18n="map.title">Carte</h2></div><div id="leafletMap" style="height:400px"></div>',
      recap: '<div class="step-box-header"><h2 class="step-box-title" data-i18n="recap.title">Récap</h2></div>',
      hotels: '<div class="step-box-header"><h2 class="step-box-title" data-i18n="hotels.title">Hôtels</h2></div>',
      activities: '<div class="step-box-header"><h2 class="step-box-title" data-i18n="activities.title">Activités</h2></div>',
      around: '<div class="step-box-header"><h2 class="step-box-title" data-i18n="around.title">Autour</h2></div>',
      links: '<div class="step-box-header"><h2 class="step-box-title" data-i18n="links.title">Liens</h2></div>'
    };
    
    const html = fallbacks[name] || '<p>Composant en cours de développement</p>';
    
    if (name === 'header') {
      document.getElementById('stepHeader').innerHTML = html;
    } else {
      const section = document.getElementById(`section-${name}`);
      if (section) {
  section.innerHTML = html;
  // 🔹 Toujours afficher les sections (fallback ou composant)
  section.style.display = 'block';
}


    }
    
    window.ORT_I18N.applyTranslations();
  },
     renderSections() {
    // Visites
    if (typeof this.renderVisits === 'function') {
      this.renderVisits();
    } else {
      console.warn('[LOADER] renderVisits absent', Object.keys(window.ORT_STEP_LOADER||{}));
    }

    // Activités (sécurisé)
    if (typeof this.renderActivities === 'function') {
      this.renderActivities();
    } else {
      console.warn('[LOADER] renderActivities absent', Object.keys(window.ORT_STEP_LOADER||{}));
      // Affiche au moins la section pour voir le fallback composant
      const box = document.getElementById('section-activities');
      if (box) box.style.display = 'block';
    }

    // Journal
    if (typeof this.renderJournal === 'function') {
      this.renderJournal();
    } else {
      console.warn('[LOADER] renderJournal absent', Object.keys(window.ORT_STEP_LOADER||{}));
    }
  },


  renderHeader() {
    const d = window.ORT_STEP_STATE?.data;
    const host = document.getElementById('stepHeader');
    if (!d || !host) return;

    // Ville depuis night.place_id -> "CC::ville-slug"
    const city = (d.night?.place_id || '')
      .split('::')[1]?.replace(/-/g, ' ')
      || d.tripTitle || 'Étape';

    // Date: base = localStorage.ort.rtStartDate (ISO), + (day-1)
    let dateStr = '';
    try {
      const baseISO = localStorage.getItem('ort.rtStartDate') || '';
      const lang = (document.documentElement.lang || 'fr').slice(0, 2);
      if (baseISO && Number.isFinite(Number(d.day))) {
        const base = new Date(baseISO);
        if (!isNaN(base)) {
          base.setDate(base.getDate() + (Number(d.day) - 1));
          dateStr = base.toLocaleDateString(lang);
        }
      }
    } catch {}

    // Si le composant header n'a rien injecté → fallback enrichi
    if (!host.querySelector('.step-box-header')) {
      host.innerHTML = `
        <div class="step-box-header">
          <h1 class="step-box-title">${city}</h1>
          ${dateStr ? `<div class="mut" data-step-date>${dateStr}</div>` : ''}
        </div>
      `;
      console.log('[LOADER] Header fallback injecté:', { city, dateStr });
    } else {
      // Composant présent : alimente les champs standards si trouvés
      host.querySelector('.step-box-title')?.replaceChildren(document.createTextNode(city));
      const dateEl = host.querySelector('[data-step-date]') || (() => {
        const el = document.createElement('div');
        el.className = 'mut'; el.setAttribute('data-step-date','');
        host.querySelector('.step-box-header')?.appendChild(el);
        return el;
      })();
      dateEl.textContent = dateStr || '';
      console.log('[LOADER] Header composant mis à jour:', { city, dateStr });
    }
  },

  renderVisits() {

    const st = window.ORT_STEP_STATE;
    const data = st?.data;
    if (!data) return;

    // Composant dédié présent ?
    if (window.ORT_STEP_VISITS && typeof window.ORT_STEP_VISITS.render === 'function') {
      window.ORT_STEP_VISITS.render(data.visits || []);
      return;
    }

    // Fallback éditable
    const box = document.getElementById('section-visits');
    if (!box) return;

    const visits = Array.isArray(data.visits) ? data.visits.map(v => (typeof v === 'string' ? { text: v } : v)) : [];
    box.innerHTML = `
      <div class="step-box-header"><h2 class="step-box-title" data-i18n="visits.title">Visites</h2></div>
      <div id="visitsList"></div>
      <button id="btnAddVisit" class="btn">+ Ajouter</button>
      <button id="btnSaveVisits" class="btn">💾 Sauver</button>
    `;

    const list = box.querySelector('#visitsList');
    const renderList = () => {
      list.innerHTML = visits.map((v,i)=>`
        <div class="visit-row" data-i="${i}">
          <input class="vtext" value="${(v.text||'').replace(/"/g,'&quot;')}" style="width:80%">
          <button class="del">✕</button>
        </div>`).join('');
      list.querySelectorAll('.del').forEach(btn=>{
        btn.onclick = (e)=>{
          const i = +btn.closest('.visit-row').dataset.i;
          visits.splice(i,1); renderList();
        };
      });
    };
    renderList();

    box.querySelector('#btnAddVisit').onclick = ()=>{ visits.push({text:''}); renderList(); };
    box.querySelector('#btnSaveVisits').onclick = async ()=>{
      const vals = Array.from(list.querySelectorAll('.vtext')).map(i=>({text:i.value.trim()})).filter(x=>x.text);
      st.data.visits = vals;
      try{
        await window.ORT_STEP_COMMON.saveStepData(st.tripId, st.stepId, { visits: vals });
        window.ORT_STEP_COMMON.showToast('✅ Visites sauvegardées','success');
      }catch(e){
        console.error('[LOADER] save visits error', e);
        window.ORT_STEP_COMMON.showToast('❌ Échec sauvegarde','error');
      }
    };
  },
   renderActivities() {
  const st = window.ORT_STEP_STATE;
  const data = st?.data;
  if (!data) return;

  // Composant dédié disponible ?
  if (window.ORT_STEP_ACTIVITIES && typeof window.ORT_STEP_ACTIVITIES.render === 'function') {
    window.ORT_STEP_ACTIVITIES.render(data.activities || []);
    return;
  }

  // Fallback "Activités": affiche la liste si présente (lecture seule + trad),
  // sinon bascule sur l'éditeur minimal.
  const box = document.getElementById('section-activities');
  if (!box) return;

  box.style.display = 'block';

  const rows = Array.isArray(data.activities)
    ? data.activities.map(a => (typeof a === 'string' ? { text: a } : a))
    : [];

  const hasData = rows.length > 0;

  box.innerHTML = hasData ? `
    <div class="step-box-header">
      <h2 class="step-box-title" data-i18n="activities.title">Activités</h2>
    </div>
    <div id="actsRead"></div>
  ` : `
    <div class="step-box-header"><h2 class="step-box-title" data-i18n="activities.title">Activités</h2></div>
    <div id="actsList"></div>
    <button id="btnAddAct" class="btn">+ Ajouter</button>
    <button id="btnSaveActs" class="btn">💾 Sauver</button>
  `;

  if (hasData) {
    const targetLang = (document.documentElement.lang || 'fr').slice(0,2).toLowerCase();
    const TR_API = (localStorage.ORT_TR_API || 'http://localhost:8055').replace(/\/+$/,'');

    const read = box.querySelector('#actsRead');
    read.innerHTML = rows.map((a,i)=>`
      <div class="visit-item" data-i="${i}">
        <div class="visit-header">
          <div class="visit-number">${i+1}</div>
          <div class="visit-info">
            <div class="visit-text" id="act-text-${i}">${(a.text||'')}</div>
          </div>
        </div>
      </div>
    `).join('');

    // Traduire en asynchrone via cache serveur
    rows.forEach(async (a,i)=>{
      const txt = a.text || '';
      if (!txt) return;
      try {
        const r = await fetch(`${TR_API}/tr-inline`,{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ text: txt, to: targetLang, force: false })
        });
        const d = await r.json().catch(()=>null);
        const out = (d && d.ok && d.text) ? d.text : txt;
        const el = document.getElementById(`act-text-${i}`);
        if (el) el.textContent = out;
      } catch(e) {
        console.warn('[ACTIVITIES] tr-inline failed', e);
      }
    });

    window.ORT_I18N.applyTranslations();
    return;
  }

  // Editeur minimal si aucune activité
  const list = box.querySelector('#actsList');
  const renderList = () => {
    list.innerHTML = rows.map((a,i)=>`
      <div class="act-row" data-i="${i}">
        <input class="atext" value="${(a.text||'').replace(/"/g,'&quot;')}" style="width:80%">
        <button class="del">✕</button>
      </div>`).join('');
    list.querySelectorAll('.del').forEach(btn=>{
      btn.onclick = ()=>{
        const i = +btn.closest('.act-row').dataset.i;
        rows.splice(i,1);
        renderList();
      };
    });
  };
  renderList();

  box.querySelector('#btnAddAct').onclick = ()=>{
    rows.push({text:''});
    renderList();
  };

  box.querySelector('#btnSaveActs').onclick = async ()=>{
    const vals = Array.from(list.querySelectorAll('.atext'))
      .map(i=>({text:i.value.trim()}))
      .filter(x=>x.text);

    st.data.activities = vals;
    try{
      await window.ORT_STEP_COMMON.saveStepData(st.tripId, st.stepId, { activities: vals });
      window.ORT_STEP_COMMON.showToast('✅ Activités sauvegardées','success');
    }catch(e){
      console.error('[LOADER] save activities error', e);
      window.ORT_STEP_COMMON.showToast('❌ Échec sauvegarde','error');
    }
  };
},



  renderJournal() {
    const data = window.ORT_STEP_STATE.data;
    if (!data || !data.journal) return;
    
    // Si le composant journal a une fonction render, l'appeler
    if (window.ORT_STEP_JOURNAL && typeof window.ORT_STEP_JOURNAL.render === 'function') {
      window.ORT_STEP_JOURNAL.render(data.journal);
    }
  }
  


};
