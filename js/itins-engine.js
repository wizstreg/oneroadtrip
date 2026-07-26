/* itins-engine.js — moteur sélection + rendu
   suppose Leaflet chargé dans Your-roadtrip.html */

async function loadJSON(url){
  const res = await fetch(url, {cache:'no-store'});
  if(!res.ok) throw new Error('HTTP '+res.status+' '+url);
  return res.json();
}

// Lit state du questionnaire
export function readQuestState(){
  try{ return JSON.parse(localStorage.getItem('ort.quest.simple')||'{}'); }
  catch(_){ return {}; }
}

// Charge la lib d'itinéraires du pays
export async function loadCountryTrips(cc){
  const url = `./data/itins/${cc}.itins.json`;
  const j = await loadJSON(url);
  return (j && Array.isArray(j.trips)) ? j.trips.filter(t=>t.active!==false) : [];
}

// Scoring
function overlap(a,b){ return a && b ? a.filter(x=>b.includes(x)) : []; }

function scoreTrip(trip, answers){
  let s = 0;

  // pace/style/transport/budget
  s += 2 * overlap(trip.tags?.pace, answers.pace).length;
  s += 1 * overlap(trip.tags?.style, answers.style).length;
  s += 1 * overlap(trip.tags?.transport, answers.transport).length;
  if (overlap(trip.tags?.budget, answers.budget).length) s += 1;

  // days
  const days = +answers.days || 0;
  if (days){
    const {min=trip.duration?.base||days, max=trip.duration?.base||days} = trip.duration||{};
    if(days >= min && days <= max) s += 2;
    else {
      const delta = (days < min) ? (min - days) : (days - max);
      s -= Math.min(2, delta); // malus doux
    }
  }

  // saison (simple)
  // TODO si tu veux : parser ["03-10"] etc. pour +1

  return s;
}

// Coupe/étire un itinéraire au nb de jours souhaité
export function adaptTripToDays(trip, daysWanted){
  const clone = structuredClone(trip);
  let used = 0; const outStages = [];
  for(const st of clone.stages){
    if(used >= daysWanted) break;
    const remain = daysWanted - used;
    if(st.days <= remain){
      outStages.push(st);
      used += st.days;
    }else{
      const cut = structuredClone(st);
      cut.days = remain; // tronqué
      cut.desc = cut.desc || {};
      outStages.push(cut);
      used += remain;
    }
  }
  // étirer si manque 1–2 jours et si tu veux: ajouter "Jour libre"
  if(used < daysWanted && outStages.length){
    const extra = daysWanted - used;
    outStages[outStages.length-1].days += extra;
  }

  clone.stages = outStages;
  clone.duration = {min: outStages.reduce((a,s)=>a+s.days,0), base: daysWanted, max: daysWanted};
  return clone;
}

// Sélectionne les N meilleurs (diversifiés)
export function pickTrips(trips, answers, N=3){
  const withScore = trips.map(t=>({t,score:scoreTrip(t,answers)}))
                         .sort((a,b)=>b.score-a.score);
  // Diversification naïve par 1ère étape
  const seen = new Set(); const picked=[];
  for(const row of withScore){
    const key = row.t.stages?.[0]?.id || row.t.id;
    if(seen.has(key)) continue;
    picked.push(row.t);
    seen.add(key);
    if(picked.length>=N) break;
  }
  // fallback si pas assez
  let i=0; while(picked.length<N && i<withScore.length){
    const t = withScore[i++].t;
    if(!picked.includes(t)) picked.push(t);
  }
  return picked;
}

// Rendu carte/table dans un conteneur
export function renderTripCard(container, trip, lang, mapIdx){
  const title = (trip.title?.[lang]) || trip.title?.en || trip.id;
  const summary = (trip.summary?.[lang]) || trip.summary?.en || "";
  const daysTotal = trip.stages.reduce((a,s)=>a+s.days,0);

  container.innerHTML = `
    <div class="card">
      <h3 style="margin:0 0 6px 0">${title} — ${daysTotal} j</h3>
      <p style="margin:0 0 8px 0;opacity:.85">${summary}</p>
      <div id="map${mapIdx}" style="height:260px;border-radius:12px;overflow:hidden;margin-bottom:10px"></div>
      <table style="width:100%;border-collapse:collapse">
        <thead><tr><th style="text-align:left;padding:6px 8px">Jour(s)</th><th style="text-align:left;padding:6px 8px">Étape</th><th style="text-align:left;padding:6px 8px">Détails</th><th></th></tr></thead>
        <tbody id="tb${mapIdx}"></tbody>
      </table>
    </div>
  `;

  // Tab
  const tb = container.querySelector(`#tb${mapIdx}`);
  let dayCursor = 1;
  trip.stages.forEach((s,idx)=>{
    const label = (s.name?.[lang]) || s.name?.en || s.id;
    const d2 = s.days>1 ? `–${dayCursor + s.days -1}` : '';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="padding:6px 8px;border-top:1px solid #eee">${dayCursor}${d2}</td>
      <td style="padding:6px 8px;border-top:1px solid #eee">${label}</td>
      <td style="padding:6px 8px;border-top:1px solid #eee">${(s.desc?.[lang]||s.desc?.en||'')}</td>
      <td style="padding:6px 8px;border-top:1px solid #eee"><button data-zoom="${idx}" class="btn outline">Zoom</button></td>
    `;
    tb.appendChild(tr);
    dayCursor += s.days;
  });

  // Carte Leaflet
  const map = L.map(`map${mapIdx}`, {zoomControl:true});
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    attribution:'&copy; OpenStreetMap'
  }).addTo(map);
  const latlngs = trip.stages.map(s=>[s.lat, s.lng]);
  const markers = latlngs.map((ll,i)=> L.marker(ll).addTo(map).bindPopup((trip.stages[i].name?.[lang])||trip.stages[i].id));
  if(latlngs.length){ map.fitBounds(latlngs, {padding:[20,20]}); }
  // Zoom par étape
  container.querySelectorAll('button[data-zoom]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const i = +btn.dataset.zoom;
      map.setView(latlngs[i], trip.stages[i].zoom || 12, {animate:true});
      markers[i].openPopup();
    });
  });
}
