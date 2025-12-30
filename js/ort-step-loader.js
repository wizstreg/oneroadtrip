/* ===== ORT-STEP-LOADER.JS - Chargement dynamique avec DEBUGS ===== */

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
    console.log('═══════════════════════════════════════════════════');
    console.log(`📦 [LOADER] loadStep() appelé`);
    console.log(`   tripId: ${tripId}`);
    console.log(`   stepId: ${stepId}`);
    console.log('═══════════════════════════════════════════════════');
    
    try {
      // 1. Charger les données de l'étape
      console.log('🔍 [LOADER] Étape 1/5: Chargement données étape...');
      const stepData = await this.fetchStepData(tripId, stepId);
      console.log('✅ [LOADER] Données étape chargées:', stepData);
      
      // 2. Charger les données personnalisées de l'utilisateur
      console.log('🔍 [LOADER] Étape 2/5: Chargement données utilisateur...');
      const userData = await window.ORT_STEP_COMMON.loadStepData(tripId, stepId);
      console.log('✅ [LOADER] Données utilisateur chargées:', userData);
      
      // 3. Fusionner les données
      console.log('🔍 [LOADER] Étape 3/5: Fusion données...');
      window.ORT_STEP_STATE.data = {
        ...stepData,
        ...userData,
        metadata: {
          ...stepData.metadata,
          ...userData.metadata
        }
      };
      console.log('✅ [LOADER] Données fusionnées:', window.ORT_STEP_STATE.data);

    // 4. Charger tous les composants (AVANT renderHeader)
      console.log('🔍 [LOADER] Étape 4/5: Chargement composants...');
      await this.loadAllComponents();

      // Mettre à jour l'en-tête (APRÈS chargement du composant)
      console.log('🔍 [LOADER] Étape 5/5: Rendu header...');
      this.renderHeader();

     // 5. Rendre les sections
  console.log('🔍 [LOADER] Appel renderSections()...');
  this.renderSections();
  console.log('✅ [LOADER] renderSections() terminé');

  console.log('═══════════════════════════════════════════════════');
  console.log('✅ [LOADER] ✅ Étape chargée avec succès !');
      console.log('✅ [LOADER] ✅ Étape chargée avec succès !');
      console.log('═══════════════════════════════════════════════════');
      
    } catch (error) {
      console.error('═══════════════════════════════════════════════════');
      console.error('❌ [LOADER] ERREUR:', error);
      console.error('═══════════════════════════════════════════════════');
      if (window.ORT_STEP_COMMON?.showToast) {
        window.ORT_STEP_COMMON.showToast('Erreur de chargement', 'error');
      }
    }
  },
  
  async fetchStepData(tripId, stepId) {
    console.log('───────────────────────────────────────────────────');
    console.log('🔍 [FETCH] fetchStepData() appelé');
    console.log('   tripId:', tripId);
    console.log('   stepId:', stepId);
    
    try {
      // tripId = "<uid>::<itin_id>", ex: "POK...::AT::austria-family-roadtrip"
      const parts = String(tripId).split('::');
      const itinId = parts.slice(1).join('::');
      const CC = itinId.split('::')[0].toUpperCase();
      const ccDir = CC.toLowerCase();
      
      console.log('   itinId:', itinId);
      console.log('   CC:', CC);
      console.log('   ccDir:', ccDir);
// ========== PATCH CACHE PRIORITAIRE ==========
      console.log('🔍 [FETCH] Lecture CACHE prioritaire...');
      try {
        const cacheKey1 = `ort.step.cache::${tripId}`;
        const raw = localStorage.getItem(cacheKey1);
        
        if (raw) {
          console.log('   ✅ CACHE trouvé !');
          const cached = JSON.parse(raw);
          
          if (cached && Array.isArray(cached.steps)) {
            const dayNum = Number(String(stepId||'').replace(/^\D+/,''));
            const step = cached.steps[(dayNum||1)-1] || {};
            
            console.log('   📊 Step data:', {
              visits: step.visits?.length || 0,
              activities: step.activities?.length || 0,
              visitsRaw: step.visits,
              activitiesRaw: step.activities
            });
            
          const result = {
              tripId, stepId,
              tripTitle: cached.title || 'Roadtrip',
              day: dayNum || 1,
              region_code: step.region_code || '',
              place_id: step.place_id || '',
              name: step.name || '',
      night: step.night || (step.lat && step.lon ? {
  place_id: step.place_id,
  coords: [step.lat, step.lon]
} : null),
              visits: step.visits || [],
              activities: step.activities || [],
              to_next_leg: step.to_next_leg || null,
              metadata: { country: cached.country || '', source: 'CACHE' }
            };
            
            console.log('✅ [FETCH] Retour depuis CACHE');
            console.log('───────────────────────────────────────────────────');
            return result;
          }
        }
      } catch(e) {
        console.error('   ❌ Erreur cache:', e);
      }
      // ========== FIN PATCH ==========

      // 🔹 Si c'est un roadtrip temporaire "trip_xxx", on lit le cache local
      if (/^trip_\d+$/i.test(itinId)) {
        console.log('🎯 [FETCH] RT TEMPORAIRE détecté (trip_xxx)');
        console.log('🔍 [FETCH] Recherche dans les caches...');
        
        try {
          // 1) Clé standard (stockée par Step/Detail)
          const cacheKey1 = `ort.step.cache::${tripId}`;
          console.log('   📦 Essai cache 1:', cacheKey1);
          let raw = localStorage.getItem(cacheKey1);
          console.log('   Résultat:', raw ? `${raw.length} caractères` : 'NULL');

          // 2) Clé alternative par rtKey (quand on vient de roadtrip_detail?from=temp&rtKey=...)
          if (!raw) {
            const qs = new URLSearchParams(location.search);
            const rtKey = qs.get('rtKey') || localStorage.getItem('ort.lastRtKey') || '';
            console.log('   📦 Essai cache 2 (rtKey):', rtKey);
            
            if (rtKey) {
              const cacheKey2a = `ort.tmp.rt::${rtKey}`;
              const cacheKey2b = `ort.tmp.rt.cache::${rtKey}`;
              console.log('      Test:', cacheKey2a);
              raw = localStorage.getItem(cacheKey2a);
              console.log('      Résultat:', raw ? `${raw.length} caractères` : 'NULL');
              
              if (!raw) {
                console.log('      Test:', cacheKey2b);
                raw = localStorage.getItem(cacheKey2b);
                console.log('      Résultat:', raw ? `${raw.length} caractères` : 'NULL');
              }
            }
          }

          // 3) Clé de secours par itinId (certaines implémentations ne gardent que l'itin)
          if (!raw) {
            const cacheKey3 = `ort.tmp.itin::${itinId}`;
            console.log('   📦 Essai cache 3 (itinId):', cacheKey3);
            raw = localStorage.getItem(cacheKey3);
            console.log('   Résultat:', raw ? `${raw.length} caractères` : 'NULL');
          }

          if (!raw) {
            console.warn('⚠️ [FETCH] Aucun cache trouvé !');
            console.log('💾 [FETCH] Toutes les clés localStorage:');
            Object.keys(localStorage).forEach(k => {
              if (k.includes('ort') || k.includes('step') || k.includes('tmp') || k.includes('rt')) {
                console.log(`   - ${k}: ${localStorage.getItem(k).substring(0, 50)}...`);
              }
            });
          }

          const cached = raw ? JSON.parse(raw) : null;
          
          if (cached && Array.isArray(cached.steps)) {
            const dayNum = Number(String(stepId||'').replace(/^\D+/,''));
            console.log('   🎯 Jour demandé:', dayNum);
            console.log('   📚 Steps disponibles:', cached.steps.length);
            
            const step = cached.steps[(dayNum||1)-1] || {};
            console.log('   ✅ Step trouvé:', step);
            
const result = {
              tripId, stepId,
              tripTitle: cached.title || 'Roadtrip',
              day: dayNum || 1,
              region_code: step.region_code || '',
              place_id: step.place_id || '',
              name: step.name || '',
              night: step.night || (step.lat && step.lon ? {
  place_id: step.place_id,
  coords: [step.lat, step.lon]
} : null),
              visits: step.visits || [],
              activities: step.activities || [],
              to_next_leg: step.to_next_leg || null,
              metadata: { country: cached.country || cached.meta?.country || '', source: 'cache-local' }
            };

            console.log('✅ [FETCH] Données RT temp extraites du cache:');
            console.log('   visits:', result.visits?.length || 0);
            console.log('   activities:', result.activities?.length || 0);
            console.log('───────────────────────────────────────────────────');
            
            return result;
          } else {
            console.warn('⚠️ [FETCH] Cache trouvé mais format incorrect');
            console.log('   cached:', cached);
          }
        } catch(e) {
          console.error('❌ [FETCH] Erreur lecture cache local:', e);
        }
      }

      // Sinon, on va chercher le fichier normal
      const jsonPath = `./data/Roadtripsprefabriques/countries/${ccDir}/${CC}.itins.modules.json`;
      console.log('🌐 [FETCH] RT STANDARD - Chargement JSON:');
      console.log('   Path:', jsonPath);
      console.log('   itinId:', itinId);

      const response = await fetch(jsonPath, { cache: 'no-store' });
      console.log('   Status:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`JSON non trouvé (${response.status})`);
      }

      const json = await response.json();
      console.log('   ✅ JSON chargé, taille:', JSON.stringify(json).length, 'caractères');
      
      const list = json.itineraries || json.itins || json.modules || [];
      console.log('   Itinéraires disponibles:', list.length);

      // Trouver l'itinéraire par itin_id (pas par tripId)
      const itin = list.find(i => (i.itin_id || i.id) === itinId);
      
      if (!itin) {
        console.error('❌ [FETCH] Itinéraire non trouvé dans le JSON !');
        console.log('   Cherché:', itinId);
        console.log('   Disponibles:', list.map(i => i.itin_id || i.id));
        throw new Error('Itinéraire non trouvé');
      }

      console.log('   ✅ Itinéraire trouvé:', itin.title);

      const dayNum = parseInt(String(stepId).replace('day_', ''), 10);
      console.log('   Jour demandé:', dayNum);
      
      const step = (itin.days_plan || []).find(d => d.day === dayNum);
      
      if (!step) {
        console.error('❌ [FETCH] Étape non trouvée !');
        console.log('   Jours disponibles:', (itin.days_plan || []).map(d => d.day));
        throw new Error('Étape non trouvée');
      }

      console.log('   ✅ Étape trouvée:', step);

 const result = {
        tripId,
        stepId,
        tripTitle: itin.title,
        day: step.day,
        region_code: step.region_code,
        place_id: step.place_id,
        name: step.name,
        night: step.night,
        visits: step.visits || [],
        activities: step.activities || [],
        to_next_leg: step.to_next_leg,
        metadata: {
          country: json.country,
          version: json.version
        }
      };
      
      console.log('✅ [FETCH] Données extraites:');
      console.log('   visits:', result.visits?.length || 0);
      console.log('   activities:', result.activities?.length || 0);
      console.log('───────────────────────────────────────────────────');
      
      return result;
      
    } catch (error) {
      console.error('❌ [FETCH] ERREUR:', error);
      console.log('───────────────────────────────────────────────────');
      
      // Fallback : données simulées
      console.warn('⚠️ [FETCH] Utilisation fallback données simulées');
      return {
        tripId,
        stepId,
        tripTitle: 'Voyage test',
        day: 1,
        region_code: 'UNKNOWN',
        night: { coords: [0, 0] },
        visits: [],
        activities: [],
        metadata: { source: 'fallback' }
      };
    }
  },
  
  async loadAllComponents() {
    console.log('───────────────────────────────────────────────────');
    console.log('📦 [COMPONENTS] loadAllComponents()');
    
    const promises = Object.entries(this.components).map(([name, file]) => 
      this.loadComponent(name, file).catch(err => {
        console.error(`❌ [COMPONENT] Erreur ${name}:`, err);
        return null;
      })
    );
    
    await Promise.allSettled(promises);
    console.log('✅ [COMPONENTS] Tous les composants chargés');
    console.log('───────────────────────────────────────────────────');
  },
  
  async loadComponent(name, file) {
    console.log(`🔍 [COMPONENT] Chargement ${name} (${file})...`);
    
    try {
      const response = await fetch(this.componentsPath + file);
      
      if (!response.ok) {
        console.warn(`⚠️ [COMPONENT] ${name} non trouvé (${response.status}), utilisation fallback`);
        return this.useFallback(name);
      }
      
      const html = await response.text();
      console.log(`   ✅ ${name}: ${html.length} caractères`);
      
      // Injecter le HTML dans la section appropriée
      if (name === 'header') {
        const host = document.getElementById('stepHeader');
        host.innerHTML = html;
        console.log('   📍 Injecté dans #stepHeader');
        this.safelyExecuteInlineScripts(host, name);
      } else {
        const section = document.getElementById(`section-${name}`);
        if (section) {
          section.innerHTML = html;
          console.log(`   📍 Injecté dans #section-${name}`);
          // ⚙️ Exécuter les <script> embarqués du fragment
          this.safelyExecuteInlineScripts(section, name);

          // 🔓 Afficher les sections optionnelles si un composant dédié est chargé
          if (['hotels','activities','around','links'].includes(name)) {
            section.style.display = 'block';
            console.log(`   👁️ Section optionnelle ${name} affichée`);
          }
        } else {
          console.warn(`   ⚠️ Section #section-${name} introuvable`);
        }
      }

      // Appliquer les traductions (après exécution des scripts du fragment)
      try {
        if (window.ORT_I18N) window.ORT_I18N.applyTranslations();
      } catch(e) {
        console.warn(`   ⚠️ I18N.applyTranslations a échoué sur ${name}:`, e);
      }

      // Initialiser le composant (s'il expose init())
      try {
        const componentObj = window[`ORT_STEP_${name.toUpperCase()}`];
        if (componentObj && typeof componentObj.init === 'function') {
          console.log(`   🚀 Initialisation ${name}...`);
          componentObj.init();
        } else {
          console.log(`   ℹ️ Aucun init() pour ${name}`);
        }
      } catch (e) {
        console.error(`   ❌ init() a jeté pour ${name}:`, e);
      }
      
    } catch (error) {
      console.error(`❌ [COMPONENT] Erreur ${name}:`, error);
      this.useFallback(name);
    }
  },

  // === Helper : exécute les <script> d'un fragment injecté ===
  safelyExecuteInlineScripts(container, compName) {
    try {
      const scripts = Array.from(container.querySelectorAll('script'));
      for (const old of scripts) {
        const s = document.createElement('script');
        // Copier types/attrs minimaux
        if (old.type) s.type = old.type;
        if (old.noModule) s.noModule = true;
        if (old.defer) s.defer = true;

        if (old.src) {
          // ⚠️ external scripts : recréer le nœud pour forcer l'exécution
          s.src = old.src;
        } else {
          // inline : recopier le code
          s.textContent = old.textContent || '';
        }
        // Remplacer le script original pour conserver l'ordre
        old.replaceWith(s);
      }
      if (scripts.length) {
        console.log(`   🧪 ${compName}: ${scripts.length} <script> exécuté(s)`);
      }
    } catch (e) {
      console.warn(`   ⚠️ ${compName}: échec exécution <script> du fragment:`, e);
    }
  },
  
  useFallback(name) {
    console.log(`⚠️ [FALLBACK] Utilisation fallback pour ${name}`);
    
    const d = window.ORT_STEP_STATE?.data || {};
    const city = (d.night?.place_id || '').split('::')[1]?.replace(/-/g,' ') || d.tripTitle || 'Étape';
    const dateISO = localStorage.getItem('ort.rtStartDate') || '';
    let dateStr = '';
    
    try{
      if (dateISO && Number.isFinite(Number(d.day))) {
        const base = new Date(dateISO); 
        if(!isNaN(base)){ 
          base.setDate(base.getDate() + (Number(d.day)-1)); 
        }
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
        section.style.display = 'block';
      }
    }
    
    if (window.ORT_I18N) {
      window.ORT_I18N.applyTranslations();
    }
    
    console.log(`   ✅ Fallback ${name} appliqué`);
  },

  renderSections() {
    console.log('───────────────────────────────────────────────────');
    console.log('🎨 [RENDER] renderSections()');
    
    // Header
    if (window.ORT_STEP_HEADER && typeof window.ORT_STEP_HEADER.render === 'function') {
      console.log('   🔍 Rendu header...');
      window.ORT_STEP_HEADER.render(window.ORT_STEP_STATE.data);
    }
    
    // Visites
    if (typeof this.renderVisits === 'function') {
      console.log('   🔍 Rendu visites...');
      this.renderVisits();
    } else {
      console.warn('   ⚠️ renderVisits() non disponible');
    }

   // Activités
    console.log('🎨 [RENDER] Test renderActivities...');
    console.log('   Type:', typeof this.renderActivities);
    console.log('   Existe?', !!this.renderActivities);
    
    if (typeof this.renderActivities === 'function') {
      console.log('   ✅ Appel renderActivities()...');
      this.renderActivities();
      console.log('   ✅ renderActivities() terminé');
    } else {
      console.error('   ❌ renderActivities N\'EXISTE PAS !');
      console.log('   Objet complet:', this);
      console.warn('   ⚠️ renderActivities() non disponible');
      const box = document.getElementById('section-activities');
      if (box) box.style.display = 'block';
    }

    // Journal
    if (typeof this.renderJournal === 'function') {
      console.log('   🔍 Rendu journal...');
      this.renderJournal();
    } else {
      console.warn('   ⚠️ renderJournal() non disponible');
    }
    
    console.log('✅ [RENDER] Sections rendues');
    console.log('───────────────────────────────────────────────────');
  },

 renderHeader() {
    // Si le composant step-header.html est chargé
    if (window.ORT_STEP_HEADER && typeof window.ORT_STEP_HEADER.render === 'function') {
      console.log('[HEADER] Utilisation du composant step-header');
      window.ORT_STEP_HEADER.render(window.ORT_STEP_STATE?.data);
      return;
    }
    
    // Sinon fallback simple
    console.log('[HEADER] Fallback simple');
    const d = window.ORT_STEP_STATE?.data;
    const host = document.getElementById('stepHeader');
    
    if (!d || !host) return;

    const city = (d.night?.place_id || '').split('::')[1]?.replace(/-/g, ' ') || d.tripTitle || 'Étape';
    host.innerHTML = `<div class="step-box-header"><h1 class="step-box-title">${city}</h1></div>`;
  },

  renderVisits() {
    console.log('───────────────────────────────────────────────────');
    console.log('🎨 [VISITS] renderVisits()');

    const st = window.ORT_STEP_STATE;
    const data = st?.data;
    
    if (!data) {
      console.warn('⚠️ [VISITS] Pas de données');
      return;
    }

    console.log('   Données:', { visits: data.visits?.length || 0 });

    // Composant dédié présent ?
    if (window.ORT_STEP_VISITS && typeof window.ORT_STEP_VISITS.render === 'function') {
      console.log('   ✅ Composant dédié trouvé, appel render()');
      window.ORT_STEP_VISITS.render(data.visits || []);
      console.log('───────────────────────────────────────────────────');
      return;
    }

    console.log('   ⚠️ Composant dédié absent, utilisation fallback éditable');

    // Fallback éditable
    const box = document.getElementById('section-visits');
    if (!box) {
      console.warn('   ❌ #section-visits introuvable');
      return;
    }

    const visits = Array.isArray(data.visits) 
      ? data.visits.map(v => (typeof v === 'string' ? { text: v } : v)) 
      : [];
      
    console.log('   Visites à afficher:', visits.length);

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
          visits.splice(i,1); 
          renderList();
        };
      });
    };
    renderList();

    box.querySelector('#btnAddVisit').onclick = ()=>{ 
      visits.push({text:''}); 
      renderList(); 
    };
    
    box.querySelector('#btnSaveVisits').onclick = async ()=>{
      console.log('💾 [VISITS] Sauvegarde...');
      const vals = Array.from(list.querySelectorAll('.vtext'))
        .map(i=>({text:i.value.trim()}))
        .filter(x=>x.text);
      st.data.visits = vals;
      
      try{
        await window.ORT_STEP_COMMON.saveStepData(st.tripId, st.stepId, { visits: vals });
        console.log('   ✅ Sauvegarde réussie');
        if (window.ORT_STEP_COMMON?.showToast) {
          window.ORT_STEP_COMMON.showToast('✅ Visites sauvegardées','success');
        }
      }catch(e){
        console.error('   ❌ Échec sauvegarde:', e);
        if (window.ORT_STEP_COMMON?.showToast) {
          window.ORT_STEP_COMMON.showToast('❌ Échec sauvegarde','error');
        }
      }
    };
    
    console.log('✅ [VISITS] Fallback affiché');
    console.log('───────────────────────────────────────────────────');
  },

  renderActivities() {
    console.log('───────────────────────────────────────────────────');
    console.log('🎨 [ACTIVITIES] renderActivities()');
    
    const st = window.ORT_STEP_STATE;
    const data = st?.data;
    
    if (!data) {
      console.warn('⚠️ [ACTIVITIES] Pas de données');
      return;
    }

    console.log('   Données:', { 
      activities: data.activities?.length || 0,
      activitiesRaw: data.activities
    });

    // 🔓 Forcer l'affichage si on a des activités
    const box = document.getElementById('section-activities');
    if (box && data.activities && data.activities.length > 0) {
      box.style.display = 'block';
      console.log('   👁️ Section activities FORCÉE visible');
    }

    // Composant dédié disponible ?
    if (window.ORT_STEP_ACTIVITIES && typeof window.ORT_STEP_ACTIVITIES.render === 'function') {
      console.log('   ✅ Composant dédié trouvé, appel render()');
      window.ORT_STEP_ACTIVITIES.render(data.activities || []);
      console.log('───────────────────────────────────────────────────');
      return;
    }

    console.log('   ⚠️ Composant dédié absent, utilisation fallback');

    if (!box) {
      console.warn('   ❌ #section-activities introuvable');
      return;
    }

    box.style.display = 'block';
    console.log('   👁️ Section activities affichée');

    const rows = Array.isArray(data.activities)
      ? data.activities.map(a => (typeof a === 'string' ? { text: a } : a))
      : [];

    const hasData = rows.length > 0;
    console.log('   Activities à afficher:', rows.length);

    if (hasData) {
      console.log('   📖 Mode LECTURE (activités existantes)');
      
      box.innerHTML = `
        <div class="step-box-header">
          <h2 class="step-box-title" data-i18n="activities.title">Activités</h2>
        </div>
        <div id="actsRead"></div>
      `;

      const targetLang = (document.documentElement.lang || 'fr').slice(0,2).toLowerCase();
      const TR_API = (localStorage.ORT_TR_API || 'http://localhost:8055').replace(/\/+$/,'');
      console.log('   🌐 Langue cible:', targetLang);
      console.log('   🌐 API traduction:', TR_API);

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

      console.log('   🔄 Lancement traduction asynchrone...');
      
      // Traduire en asynchrone via cache serveur
      rows.forEach(async (a,i)=>{
        const txt = a.text || '';
        if (!txt) return;
        
        console.log(`   [ACT ${i}] Traduction de: "${txt.substring(0,30)}..."`);
        
        try {
          const r = await fetch(`${TR_API}/tr-inline`,{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ text: txt, to: targetLang, force: false })
          });
          const d = await r.json().catch(()=>null);
          const out = (d && d.ok && d.text) ? d.text : txt;
          const el = document.getElementById(`act-text-${i}`);
          if (el) {
            el.textContent = out;
            console.log(`   [ACT ${i}] ✅ Traduit: "${out.substring(0,30)}..."`);
          }
        } catch(e) {
          console.warn(`   [ACT ${i}] ❌ tr-inline failed:`, e);
        }
      });

      if (window.ORT_I18N) {
        window.ORT_I18N.applyTranslations();
      }
      
      console.log('✅ [ACTIVITIES] Mode lecture affiché');
      console.log('───────────────────────────────────────────────────');
      return;
    }

    console.log('   ✏️ Mode ÉDITION (aucune activité)');

    // Editeur minimal si aucune activité
    box.innerHTML = `
      <div class="step-box-header"><h2 class="step-box-title" data-i18n="activities.title">Activités</h2></div>
      <div id="actsList"></div>
      <button id="btnAddAct" class="btn">+ Ajouter</button>
      <button id="btnSaveActs" class="btn">💾 Sauver</button>
    `;

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
      console.log('💾 [ACTIVITIES] Sauvegarde...');
      const vals = Array.from(list.querySelectorAll('.atext'))
        .map(i=>({text:i.value.trim()}))
        .filter(x=>x.text);

      st.data.activities = vals;
      
      try{
        await window.ORT_STEP_COMMON.saveStepData(st.tripId, st.stepId, { activities: vals });
        console.log('   ✅ Sauvegarde réussie');
        if (window.ORT_STEP_COMMON?.showToast) {
          window.ORT_STEP_COMMON.showToast('✅ Activités sauvegardées','success');
        }
      }catch(e){
        console.error('   ❌ Échec sauvegarde:', e);
        if (window.ORT_STEP_COMMON?.showToast) {
          window.ORT_STEP_COMMON.showToast('❌ Échec sauvegarde','error');
        }
      }
    };
    
    console.log('✅ [ACTIVITIES] Mode édition affiché');
    console.log('───────────────────────────────────────────────────');
  },

  renderJournal() {
    const data = window.ORT_STEP_STATE.data;
    if (!data || !data.journal) return;
    
    if (window.ORT_STEP_JOURNAL && typeof window.ORT_STEP_JOURNAL.render === 'function') {
      window.ORT_STEP_JOURNAL.render(data.journal);
    }
  }

};

console.log('✅ [LOADER] ort-step-loader.js chargé et prêt');