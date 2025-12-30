/* ===== ORT-STEP-COMMON.JS - Utilitaires & State Management ===== */

window.ORT_STEP_COMMON = {
  
  // === STATE MANAGEMENT ===
  
  getState() {
    return window.ORT_STEP_STATE || {};
  },
  
  updateState(updates) {
    window.ORT_STEP_STATE = {
      ...window.ORT_STEP_STATE,
      ...updates,
      modified: true
    };
    this.autoSave();
  },
  
  // === PERSISTANCE ===
  
  async loadStepData(tripId, stepId) {
    const userId = this.getUserId();
    const key = `ort_step_${userId}_${tripId}_${stepId}`;
    
    try {
      // 1. Essayer localStorage
      const localData = localStorage.getItem(key);
      if (localData) {
        return JSON.parse(localData);
      }
      
      // 2. Essayer IndexedDB (si implémenté)
      if (window.indexedDB && window.ORT_CACHE) {
        const idbData = await this.getFromIndexedDB(key);
        if (idbData) return idbData;
      }
      
      // 3. Essayer Firebase (si connecté)
      if (window.userAuth && window.userAuth.uid) {
        const firebaseData = await this.getFromFirebase(userId, tripId, stepId);
        if (firebaseData) return firebaseData;
      }
      
      // 4. Données vides par défaut
      return this.createEmptyStepData();
      
    } catch (error) {
      console.error('[ORT-COMMON] Erreur chargement données:', error);
      return this.createEmptyStepData();
    }
  },
  
async saveStepData(tripId, stepId, data) {
    const userId = this.getUserId();
    const key = `ort_step_${userId}_${tripId}_${stepId}`;
    
    try {
      // 1. Sauvegarder dans localStorage (cache local)
      localStorage.setItem(key, JSON.stringify(data));
      
      // 2. Sauvegarder via State Manager (sync Firestore)
      if (window.ORT_STATE) {
        // Récupérer le trip complet
        const trip = await window.ORT_STATE.getTrip(tripId);
        if (trip && trip.steps) {
          // Trouver l'index du step (ex: day_3 → index 2)
          const stepIndex = parseInt(stepId.replace('day_', '')) - 1;
          
          if (trip.steps[stepIndex]) {
            // Fusionner les données du step
            trip.steps[stepIndex] = {
              ...trip.steps[stepIndex],
              ...data,
              updatedAt: Date.now()
            };
            
            // Sauvegarder le trip complet (Firestore + localStorage)
            await window.ORT_STATE.saveTrip(trip);
            console.log('✅ [STEP] Step sauvegardé via State Manager');
          }
        }
      }
      
      this.showToast(window.ORT_I18N.translate('msg.saved'));
      return true;
      
    } catch (error) {
      console.error('[ORT-COMMON] Erreur sauvegarde:', error);
      this.showToast(window.ORT_I18N.translate('msg.error'), 'error');
      return false;
    }
  },
  
  createEmptyStepData() {
    return {
      visits_modified: [],
      journal: {
        text: '',
        mood: null,
        weather: null,
        temperature: null,
        photos: []
      },
      poi_selected: [],
      hotels_user: [],
      activities_extra_user: [],
      external_refs: [],
      metadata: {
        created: Date.now(),
        updated: Date.now()
      }
    };
  },
  
  // Auto-save toutes les 60s
  autoSaveInterval: null,
  
  startAutoSave() {
    if (this.autoSaveInterval) clearInterval(this.autoSaveInterval);
    
    this.autoSaveInterval = setInterval(() => {
      if (window.ORT_STEP_STATE && window.ORT_STEP_STATE.modified) {
        this.saveCurrentState();
      }
    }, 60000); // 60 secondes
  },
  
  autoSave() {
    // Debounce: sauvegarder 2s après la dernière modif
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    
    this.saveTimeout = setTimeout(() => {
      this.saveCurrentState();
    }, 2000);
  },
  
  async saveCurrentState() {
    const state = this.getState();
    if (!state.tripId || !state.stepId || !state.data) return;
    
    await this.saveStepData(state.tripId, state.stepId, state.data);
    window.ORT_STEP_STATE.modified = false;
  },
  
  // === FIREBASE (stubs - à implémenter selon votre backend) ===
  
  async getFromFirebase(userId, tripId, stepId) {
    // TODO: implémenter avec Firebase SDK
    // const doc = await firebase.firestore()
    //   .collection('userTrips')
    //   .doc(userId)
    //   .collection(tripId)
    //   .doc(stepId)
    //   .get();
    // return doc.exists ? doc.data() : null;
    return null;
  },
  
  async saveToFirebase(userId, tripId, stepId, data) {
    // TODO: implémenter avec Firebase SDK
    // await firebase.firestore()
    //   .collection('userTrips')
    //   .doc(userId)
    //   .collection(tripId)
    //   .doc(stepId)
    //   .set(data, { merge: true });
    console.log('[Firebase] Sauvegarde simulée:', { userId, tripId, stepId });
  },
  
  // === INDEXEDDB (optionnel) ===
  
  async getFromIndexedDB(key) {
    // TODO: implémenter si IndexedDB utilisé
    return null;
  },
  
  async saveToIndexedDB(key, data) {
    // TODO: implémenter si IndexedDB utilisé
    console.log('[IndexedDB] Sauvegarde simulée:', key);
  },
  
  // === MÉTÉO API ===
  
  async fetchWeather(lat, lon) {
    const apiKey = window.ORT_WEATHER_KEY;
    
    if (!apiKey) {
      console.warn('[WEATHER] Pas de clé API OpenWeatherMap');
      return null;
    }
    
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=${window.ORT_I18N.currentLang}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Météo API error');
      
      const data = await response.json();
      
      return {
        icon: this.mapWeatherIcon(data.weather[0].icon),
        description: data.weather[0].description,
        temp: Math.round(data.main.temp),
        humidity: data.main.humidity,
        wind: data.wind.speed
      };
      
    } catch (error) {
      console.error('[WEATHER] Erreur:', error);
      return null;
    }
  },
  
  mapWeatherIcon(owmIcon) {
    // Mapper les codes OpenWeatherMap vers nos icônes
    const mapping = {
      '01d': 'sunny',
      '01n': 'sunny',
      '02d': 'cloudy',
      '02n': 'cloudy',
      '03d': 'cloudy',
      '03n': 'cloudy',
      '04d': 'cloudy',
      '04n': 'cloudy',
      '09d': 'rainy',
      '09n': 'rainy',
      '10d': 'rainy',
      '10n': 'rainy',
      '11d': 'stormy',
      '11n': 'stormy',
      '13d': 'snowy',
      '13n': 'snowy'
    };
    return mapping[owmIcon] || 'cloudy';
  },
  
  // === UTILITAIRES ===
  
  getUserId() {
    // 1. Firebase Auth
    if (window.userAuth && window.userAuth.uid) {
      return window.userAuth.uid;
    }
    
    // 2. LocalStorage
    let localId = localStorage.getItem('ORT_USER_ID');
    if (!localId) {
      localId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('ORT_USER_ID', localId);
    }
    return localId;
  },
  
  showToast(message, type = 'success') {
    const toast = document.createElement('div');
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: type === 'error' ? '#dc2626' : '#113f7a',
      color: '#fff',
      padding: '12px 24px',
      borderRadius: '10px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      zIndex: '14000',
      fontWeight: '700',
      maxWidth: '90vw'
    });
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  },
  
expandSection(sectionName) {
    const section = document.getElementById(`section-${sectionName}`);
    if (!section) return;
    
    // TOUJOURS retirer tous les boutons close existants d'abord
    document.querySelectorAll('.close-fullscreen-btn').forEach(btn => btn.remove());
    
    section.classList.toggle('fullscreen');
    
    // Ajouter bouton de fermeture en mode fullscreen
    if (section.classList.contains('fullscreen')) {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'step-box-btn close-fullscreen-btn';
      closeBtn.textContent = '✕ Fermer';
      closeBtn.onclick = () => this.expandSection(sectionName);
      section.appendChild(closeBtn);
    }
  },
  
  formatDuration(minutes) {
    if (minutes < 60) {
      return `${minutes} ${window.ORT_I18N.translate('visits.min')}`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h${mins}` : `${hours}h`;
  },
  
  formatDistance(km) {
    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
  },
  
  // === EXPORT ===
  
  async exportToJSON(data) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `ort_step_${window.ORT_STEP_STATE.stepId}_${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    this.showToast(window.ORT_I18N.translate('msg.exportSuccess'));
  },
  
  async exportToHTML(data) {
    // TODO: implémenter génération HTML
    const html = this.generateHTMLBook(data);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `ort_step_${window.ORT_STEP_STATE.stepId}.html`;
    a.click();
    
    URL.revokeObjectURL(url);
    this.showToast(window.ORT_I18N.translate('msg.exportSuccess'));
  },
  
  generateHTMLBook(data) {
    // Template HTML simple
    return `
<!DOCTYPE html>
<html lang="${window.ORT_I18N.currentLang}">
<head>
  <meta charset="utf-8">
  <title>OneRoadTrip - Étape ${window.ORT_STEP_STATE.stepId}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #113f7a; }
    .section { margin: 30px 0; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px; }
    .photos { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
    img { width: 100%; border-radius: 8px; }
  </style>
</head>
<body>
  <h1>📍 Étape ${window.ORT_STEP_STATE.stepId}</h1>
  
  <div class="section">
    <h2>📝 Carnet de voyage</h2>
    <p>${data.journal.text || 'Aucun texte'}</p>
    <p><strong>Humeur:</strong> ${data.journal.mood || 'N/A'}</p>
    <p><strong>Météo:</strong> ${data.journal.weather || 'N/A'} - ${data.journal.temperature || '?'}°C</p>
    ${data.journal.photos.length > 0 ? `
      <div class="photos">
        ${data.journal.photos.map(p => `<img src="${p}" alt="Photo">`).join('')}
      </div>
    ` : ''}
  </div>
  
  <div class="section">
    <h2>📍 POI sélectionnés</h2>
    ${data.poi_selected.length > 0 ? `
      <ul>
        ${data.poi_selected.map(poi => `<li>${poi.name} - ${poi.timing || 'N/A'}</li>`).join('')}
      </ul>
    ` : '<p>Aucun POI</p>'}
  </div>
  
  <footer style="margin-top: 40px; text-align: center; color: #6b7280;">
    <p>Généré par OneRoadTrip - ${new Date().toLocaleDateString()}</p>
  </footer>
</body>
</html>
    `;
  },
  
  // === PARTAGE ===
  
  async shareJournal() {
    // TODO: appeler backend pour générer lien public
    // const shareId = await fetch('/api/share-journal', {
    //   method: 'POST',
    //   body: JSON.stringify({
    //     userId: this.getUserId(),
    //     tripId: window.ORT_STEP_STATE.tripId,
    //     stepId: window.ORT_STEP_STATE.stepId,
    //     data: window.ORT_STEP_STATE.data
    //   })
    // }).then(r => r.json());
    
    // Simulation
    const shareId = 'share_' + Math.random().toString(36).substr(2, 12);
    const shareUrl = `https://oneroadtrip.com/share/${shareId}`;
    
    // Copier dans le presse-papier
    try {
      await navigator.clipboard.writeText(shareUrl);
      this.showToast(window.ORT_I18N.translate('msg.shareSuccess'));
    } catch (error) {
      console.error('[SHARE] Erreur copie:', error);
      alert(`Lien de partage: ${shareUrl}`);
    }
  }
  
};

// === AUTO-INIT ===
document.addEventListener('DOMContentLoaded', () => {
  window.ORT_STEP_COMMON.startAutoSave();
});

// Sauvegarder avant fermeture
window.addEventListener('beforeunload', () => {
  if (window.ORT_STEP_STATE && window.ORT_STEP_STATE.modified) {
    window.ORT_STEP_COMMON.saveCurrentState();
  }
});
