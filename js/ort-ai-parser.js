/**
 * ORT AI Parser - Module client v2
 * Avec édition, mode manuel, multi-résas (aller/retour)
 */
(function() {
  'use strict';

  const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const API_URL = isLocal 
    ? 'https://www.oneroadtrip.com/.netlify/functions/parse-booking'
    : '/.netlify/functions/parse-booking';
  
  console.log('[AI-PARSER] API URL:', API_URL, isLocal ? '(mode local → prod)' : '');

  const CATEGORIES = {
    travel:     { icon: '🧳', label: { fr: 'Voyage', en: 'Travel', es: 'Viaje', it: 'Viaggio', pt: 'Viagem', ar: 'سفر' }},
    flight:     { icon: '✈️', label: { fr: 'Avion', en: 'Flight', es: 'Vuelo', it: 'Volo', pt: 'Voo', ar: 'طيران' }},
    car_rental: { icon: '🚗', label: { fr: 'Location véhicule', en: 'Car rental', es: 'Alquiler', it: 'Noleggio', pt: 'Aluguel', ar: 'تأجير' }},
    insurance:  { icon: '🛡️', label: { fr: 'Assurance', en: 'Insurance', es: 'Seguro', it: 'Assicurazione', pt: 'Seguro', ar: 'تأمين' }},
    hotel:      { icon: '🏨', label: { fr: 'Hôtel', en: 'Hotel', es: 'Hotel', it: 'Hotel', pt: 'Hotel', ar: 'فندق' }},
    activity:   { icon: '🎯', label: { fr: 'Activité', en: 'Activity', es: 'Actividad', it: 'Attività', pt: 'Atividade', ar: 'نشاط' }},
    visit:      { icon: '🏛️', label: { fr: 'Visite', en: 'Visit', es: 'Visita', it: 'Visita', pt: 'Visita', ar: 'زيارة' }},
    show:       { icon: '🎭', label: { fr: 'Spectacle', en: 'Show', es: 'Espectáculo', it: 'Spettacolo', pt: 'Espetáculo', ar: 'عرض' }}
  };

  let state = { tripId: null, stepId: null, items: [], currentIndex: 0 };
  let retryCount = 0;
  const MAX_RETRIES = 1;

  async function getToken() {
    if (window.firebase?.auth) {
      const user = firebase.auth().currentUser;
      if (user) return user.getIdToken();
    }
    return null;
  }

  async function parseContent(content) {
    const token = await getToken();
    if (!token) throw new Error('Connexion requise');

    console.log('[AI-PARSER] Appel API...');
    
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ content })
    });
    
    console.log('[AI-PARSER] Status:', res.status);
    
    let data;
    try {
      const text = await res.text();
      console.log('[AI-PARSER] Réponse (300 chars):', text.substring(0, 300));
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('Erreur parsing réponse');
    }
    
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Erreur API');
    }
    
    console.log('[AI-PARSER] ✅ Succès, items:', data.count);
    return data;
  }

  function getLang() {
    return window.ORT_I18N?.currentLang || document.documentElement.lang || 'fr';
  }

  function t(key) {
    const lang = getLang();
    const texts = {
      title: { fr: 'Importer une réservation', en: 'Import booking', es: 'Importar reserva', it: 'Importa prenotazione', pt: 'Importar reserva', ar: 'استيراد الحجز' },
      instructions: { fr: 'Collez le contenu de votre email de confirmation', en: 'Paste your confirmation email', es: 'Pegue su email', it: 'Incolla l\'email', pt: 'Cole o email', ar: 'الصق البريد' },
      placeholder: { fr: 'Collez ici...', en: 'Paste here...', es: 'Pegue aquí...', it: 'Incolla qui...', pt: 'Cole aqui...', ar: 'الصق هنا...' },
      analyze: { fr: 'Analyser', en: 'Analyze', es: 'Analizar', it: 'Analizza', pt: 'Analisar', ar: 'تحليل' },
      analyzing: { fr: 'Analyse en cours... Cela peut prendre quelques secondes', en: 'Analyzing... This may take a few seconds', es: 'Analizando...', it: 'Analisi...', pt: 'Analisando...', ar: 'جاري التحليل...' },
      cancel: { fr: 'Annuler', en: 'Cancel', es: 'Cancelar', it: 'Annulla', pt: 'Cancelar', ar: 'إلغاء' },
      back: { fr: 'Retour', en: 'Back', es: 'Volver', it: 'Indietro', pt: 'Voltar', ar: 'رجوع' },
      confirm: { fr: 'Ajouter', en: 'Add', es: 'Añadir', it: 'Aggiungi', pt: 'Adicionar', ar: 'إضافة' },
      confirmAll: { fr: 'Tout ajouter', en: 'Add all', es: 'Añadir todo', it: 'Aggiungi tutto', pt: 'Adicionar tudo', ar: 'إضافة الكل' },
      next: { fr: 'Suivant', en: 'Next', es: 'Siguiente', it: 'Successivo', pt: 'Próximo', ar: 'التالي' },
      success: { fr: 'Réservation ajoutée !', en: 'Booking added!', es: '¡Reserva añadida!', it: 'Prenotazione aggiunta!', pt: 'Reserva adicionada!', ar: 'تمت الإضافة!' },
      successMulti: { fr: 'réservations ajoutées !', en: 'bookings added!', es: 'reservas añadidas!', it: 'prenotazioni aggiunte!', pt: 'reservas adicionadas!', ar: 'حجوزات مضافة!' },
      category: { fr: 'Catégorie', en: 'Category', es: 'Categoría', it: 'Categoria', pt: 'Categoria', ar: 'الفئة' },
      quota: { fr: 'Imports ce mois', en: 'Imports this month', es: 'Importaciones', it: 'Import', pt: 'Importações', ar: 'الواردات' },
      errorShort: { fr: 'Contenu trop court (min 50 car.)', en: 'Content too short (min 50 chars)', es: 'Muy corto', it: 'Troppo corto', pt: 'Muito curto', ar: 'قصير جدا' },
      manual: { fr: 'Saisie manuelle', en: 'Manual entry', es: 'Manual', it: 'Manuale', pt: 'Manual', ar: 'يدوي' },
      name: { fr: 'Nom', en: 'Name', es: 'Nombre', it: 'Nome', pt: 'Nome', ar: 'الاسم' },
      provider: { fr: 'Fournisseur', en: 'Provider', es: 'Proveedor', it: 'Fornitore', pt: 'Fornecedor', ar: 'المزود' },
      dateStart: { fr: 'Date début', en: 'Start date', es: 'Fecha inicio', it: 'Data inizio', pt: 'Data início', ar: 'تاريخ البدء' },
      dateEnd: { fr: 'Date fin', en: 'End date', es: 'Fecha fin', it: 'Data fine', pt: 'Data fim', ar: 'تاريخ الانتهاء' },
      city: { fr: 'Ville', en: 'City', es: 'Ciudad', it: 'Città', pt: 'Cidade', ar: 'المدينة' },
      price: { fr: 'Prix', en: 'Price', es: 'Precio', it: 'Prezzo', pt: 'Preço', ar: 'السعر' },
      ref: { fr: 'Référence', en: 'Reference', es: 'Referencia', it: 'Riferimento', pt: 'Referência', ar: 'المرجع' },
      notes: { fr: 'Notes', en: 'Notes', es: 'Notas', it: 'Note', pt: 'Notas', ar: 'ملاحظات' },
      itemOf: { fr: 'sur', en: 'of', es: 'de', it: 'di', pt: 'de', ar: 'من' }
    };
    return texts[key]?.[lang] || texts[key]?.fr || key;
  }

  function injectStyles() {
    if (document.getElementById('oap-styles')) return;
    const s = document.createElement('style');
    s.id = 'oap-styles';
    s.textContent = `
      .oap-modal{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px}
      .oap-overlay{position:absolute;inset:0;background:rgba(0,0,0,.7)}
      .oap-box{position:relative;background:#fff;border-radius:16px;padding:24px;max-width:600px;width:100%;max-height:90vh;overflow-y:auto;color:#333}
      .oap-close{position:absolute;top:12px;right:12px;width:32px;height:32px;border:none;background:#eee;border-radius:50%;font-size:20px;cursor:pointer}
      .oap-title{margin:0 0 8px;color:#113f7a;font-size:1.4rem}
      .oap-quota{font-size:.85rem;color:#666;margin-bottom:8px}
      .oap-desc{color:#555;margin:0 0 12px}
      .oap-textarea{width:100%;padding:12px;border:2px solid #ddd;border-radius:8px;font-size:14px;min-height:150px;resize:vertical;box-sizing:border-box}
      .oap-textarea:focus{outline:none;border-color:#113f7a}
      .oap-actions{display:flex;gap:12px;margin-top:16px;justify-content:flex-end;flex-wrap:wrap}
      .oap-btn{padding:10px 20px;border-radius:8px;border:1px solid #113f7a;background:#fff;color:#113f7a;font-weight:600;cursor:pointer}
      .oap-btn:hover{background:#f0f4f8}
      .oap-btn-primary{background:#113f7a;color:#fff}
      .oap-btn-primary:hover{background:#0d2f5e}
      .oap-btn-success{background:#22c55e;color:#fff;border-color:#22c55e}
      .oap-btn-success:hover{background:#16a34a}
      .oap-btn:disabled{opacity:.5;cursor:not-allowed}
      .oap-error{background:#ffebee;color:#c62828;padding:12px;border-radius:8px;margin-top:12px;display:none}
      .oap-error.show{display:block}
      .oap-preview{background:#f8fafc;border-radius:12px;padding:16px;margin-bottom:12px}
      .oap-step{display:none}
      .oap-step.active{display:block}
      .oap-model{font-size:.7rem;color:#999;margin-bottom:8px}
      .oap-loading{text-align:center;padding:40px 20px}
      .oap-loading-spinner{font-size:3rem;animation:oap-spin 1s linear infinite;display:inline-block}
      @keyframes oap-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      .oap-loading-text{margin-top:16px;color:#666;font-size:1rem}
      .oap-form{display:grid;gap:12px}
      .oap-form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
      .oap-form-group{display:flex;flex-direction:column;gap:4px}
      .oap-form-group.full{grid-column:span 2}
      .oap-form-label{font-size:.85rem;color:#666;font-weight:500}
      .oap-form-input{padding:10px;border:1px solid #ddd;border-radius:6px;font-size:14px}
      .oap-form-input:focus{outline:none;border-color:#113f7a}
      .oap-form-select{padding:10px;border:1px solid #ddd;border-radius:6px;font-size:14px;background:#fff}
      .oap-counter{text-align:center;font-size:.9rem;color:#666;margin-bottom:12px;font-weight:600}
      .oap-manual-link{font-size:.85rem;color:#113f7a;cursor:pointer;text-decoration:underline;margin-top:8px;display:inline-block}
      @media(max-width:500px){.oap-form-row{grid-template-columns:1fr}.oap-form-group.full{grid-column:span 1}}
    `;
    document.head.appendChild(s);
  }

  function showModal(tripId, stepId) {
    state = { tripId, stepId, items: [], currentIndex: 0 };
    injectStyles();

    const existing = document.getElementById('oap-modal');
    if (existing) existing.remove();

    const m = document.createElement('div');
    m.id = 'oap-modal';
    m.className = 'oap-modal';
    m.innerHTML = `
      <div class="oap-overlay" onclick="ORT_AI_PARSER.close()"></div>
      <div class="oap-box">
        <button class="oap-close" onclick="ORT_AI_PARSER.close()">&times;</button>
        <h2 class="oap-title">📧 ${t('title')}</h2>
        <div class="oap-quota" id="oap-quota"></div>
        <div class="oap-model" id="oap-model"></div>
        
        <div id="oap-step1" class="oap-step active">
          <p class="oap-desc">${t('instructions')}</p>
          <textarea id="oap-input" class="oap-textarea" placeholder="${t('placeholder')}"></textarea>
          <span class="oap-manual-link" onclick="ORT_AI_PARSER._showManual()">✏️ ${t('manual')}</span>
          <div class="oap-actions">
            <button class="oap-btn" onclick="ORT_AI_PARSER.close()">${t('cancel')}</button>
            <button class="oap-btn oap-btn-primary" id="oap-btn" onclick="ORT_AI_PARSER._parse()">🔍 ${t('analyze')}</button>
          </div>
        </div>
        
        <div id="oap-step-loading" class="oap-step">
          <div class="oap-loading">
            <div class="oap-loading-spinner">⏳</div>
            <div class="oap-loading-text">${t('analyzing')}</div>
          </div>
        </div>
        
        <div id="oap-step2" class="oap-step">
          <div class="oap-counter" id="oap-counter"></div>
          <div id="oap-preview-container"></div>
          <div class="oap-actions" id="oap-actions2"></div>
        </div>
        
        <div id="oap-step-manual" class="oap-step">
          <div class="oap-form" id="oap-form"></div>
          <div class="oap-actions">
            <button class="oap-btn" onclick="ORT_AI_PARSER._back()">← ${t('back')}</button>
            <button class="oap-btn oap-btn-success" onclick="ORT_AI_PARSER._confirmManual()">✅ ${t('confirm')}</button>
          </div>
        </div>
        
        <div id="oap-error" class="oap-error"></div>
      </div>
    `;
    document.body.appendChild(m);
    setTimeout(() => document.getElementById('oap-input')?.focus(), 100);
  }

  function close() {
    document.getElementById('oap-modal')?.remove();
    state = { tripId: null, stepId: null, items: [], currentIndex: 0 };
  }

  function showError(msg) {
    const e = document.getElementById('oap-error');
    if (e) { e.textContent = '❌ ' + msg; e.classList.add('show'); }
  }

  function goStep(n) {
    document.querySelectorAll('.oap-step').forEach(s => s.classList.remove('active'));
    document.getElementById('oap-step' + n)?.classList.add('active');
    document.getElementById('oap-error')?.classList.remove('show');
  }

  async function parse() {
    const content = document.getElementById('oap-input')?.value?.trim();
    if (!content || content.length < 50) { showError(t('errorShort')); return; }

    goStep('-loading');

    try {
      const result = await parseContent(content);
      
      state.items = Array.isArray(result.data) ? result.data : [result.data];
      state.currentIndex = 0;
      
      if (result.usage) {
        document.getElementById('oap-quota').innerHTML = `${t('quota')}: <strong>${result.usage.count}/${result.usage.limit}</strong>`;
      }
      if (result._meta?.model) {
        document.getElementById('oap-model').textContent = '✅ ' + result._meta.model;
      }
      
      renderPreview();
      goStep('2');
    } catch (e) {
      goStep('1');
      showError(e.message);
    }
  }

  function renderPreview() {
    const item = state.items[state.currentIndex];
    if (!item) return;
    
    const lang = getLang();
    const cat = CATEGORIES[item.category] || CATEGORIES.activity;
    const total = state.items.length;
    const idx = state.currentIndex + 1;
    
    // Counter
    document.getElementById('oap-counter').textContent = total > 1 ? `${idx} ${t('itemOf')} ${total}` : '';
    
    // Preview éditable
    document.getElementById('oap-preview-container').innerHTML = `
      <div class="oap-preview">
        <div class="oap-form">
          <div class="oap-form-row">
            <div class="oap-form-group">
              <label class="oap-form-label">${t('category')}</label>
              <select class="oap-form-select" id="edit-category">
                ${Object.entries(CATEGORIES).map(([k,v]) => `<option value="${k}" ${k === item.category ? 'selected' : ''}>${v.icon} ${v.label[lang] || v.label.fr}</option>`).join('')}
              </select>
            </div>
            <div class="oap-form-group">
              <label class="oap-form-label">${t('provider')}</label>
              <input type="text" class="oap-form-input" id="edit-provider" value="${esc(item.provider || '')}">
            </div>
          </div>
          <div class="oap-form-group full">
            <label class="oap-form-label">${t('name')} *</label>
            <input type="text" class="oap-form-input" id="edit-name" value="${esc(item.name || '')}" style="font-weight:600">
          </div>
          <div class="oap-form-row">
            <div class="oap-form-group">
              <label class="oap-form-label">📅 ${t('dateStart')}</label>
              <input type="date" class="oap-form-input" id="edit-date_start" value="${item.date_start || ''}">
            </div>
            <div class="oap-form-group">
              <label class="oap-form-label">📅 ${t('dateEnd')}</label>
              <input type="date" class="oap-form-input" id="edit-date_end" value="${item.date_end || ''}">
            </div>
          </div>
          <div class="oap-form-row">
            <div class="oap-form-group">
              <label class="oap-form-label">📍 ${t('city')}</label>
              <input type="text" class="oap-form-input" id="edit-city" value="${esc(item.city || '')}">
            </div>
            <div class="oap-form-group">
              <label class="oap-form-label">💰 ${t('price')}</label>
              <input type="number" class="oap-form-input" id="edit-price" value="${item.price?.amount || ''}" step="0.01">
            </div>
          </div>
          <div class="oap-form-row">
            <div class="oap-form-group">
              <label class="oap-form-label">🔖 ${t('ref')}</label>
              <input type="text" class="oap-form-input" id="edit-ref" value="${esc(item.confirmation_number || '')}">
            </div>
            <div class="oap-form-group">
              <label class="oap-form-label">👥 Guests</label>
              <input type="number" class="oap-form-input" id="edit-guests" value="${item.guests || ''}">
            </div>
          </div>
          <div class="oap-form-group full">
            <label class="oap-form-label">📝 ${t('notes')}</label>
            <input type="text" class="oap-form-input" id="edit-notes" value="${esc(item.notes || '')}">
          </div>
        </div>
      </div>
    `;
    
    // Actions
    let html = `<button class="oap-btn" onclick="ORT_AI_PARSER._back()">← ${t('back')}</button>`;
    if (total > 1 && idx < total) {
      html += `<button class="oap-btn" onclick="ORT_AI_PARSER._nextItem()">→ ${t('next')}</button>`;
    }
    html += `<button class="oap-btn oap-btn-success" onclick="ORT_AI_PARSER._confirmCurrent()">✅ ${t('confirm')}</button>`;
    if (total > 1) {
      html += `<button class="oap-btn oap-btn-primary" onclick="ORT_AI_PARSER._confirmAll()">✅ ${t('confirmAll')} (${total})</button>`;
    }
    document.getElementById('oap-actions2').innerHTML = html;
  }

  function showManualForm() {
    const lang = getLang();
    document.getElementById('oap-form').innerHTML = `
      <div class="oap-form-row">
        <div class="oap-form-group">
          <label class="oap-form-label">${t('category')}</label>
          <select class="oap-form-select" id="manual-category">
            ${Object.entries(CATEGORIES).map(([k,v]) => `<option value="${k}">${v.icon} ${v.label[lang] || v.label.fr}</option>`).join('')}
          </select>
        </div>
        <div class="oap-form-group">
          <label class="oap-form-label">${t('provider')}</label>
          <input type="text" class="oap-form-input" id="manual-provider">
        </div>
      </div>
      <div class="oap-form-group full">
        <label class="oap-form-label">${t('name')} *</label>
        <input type="text" class="oap-form-input" id="manual-name" required>
      </div>
      <div class="oap-form-row">
        <div class="oap-form-group">
          <label class="oap-form-label">📅 ${t('dateStart')}</label>
          <input type="date" class="oap-form-input" id="manual-date_start">
        </div>
        <div class="oap-form-group">
          <label class="oap-form-label">📅 ${t('dateEnd')}</label>
          <input type="date" class="oap-form-input" id="manual-date_end">
        </div>
      </div>
      <div class="oap-form-row">
        <div class="oap-form-group">
          <label class="oap-form-label">📍 ${t('city')}</label>
          <input type="text" class="oap-form-input" id="manual-city">
        </div>
        <div class="oap-form-group">
          <label class="oap-form-label">💰 ${t('price')}</label>
          <input type="number" class="oap-form-input" id="manual-price" step="0.01">
        </div>
      </div>
      <div class="oap-form-group full">
        <label class="oap-form-label">🔖 ${t('ref')}</label>
        <input type="text" class="oap-form-input" id="manual-ref">
      </div>
      <div class="oap-form-group full">
        <label class="oap-form-label">📝 ${t('notes')}</label>
        <input type="text" class="oap-form-input" id="manual-notes">
      </div>
    `;
    goStep('-manual');
  }

  function getEditedItem() {
    const item = { ...state.items[state.currentIndex] };
    item.name = document.getElementById('edit-name')?.value || item.name;
    item.provider = document.getElementById('edit-provider')?.value || null;
    item.date_start = document.getElementById('edit-date_start')?.value || null;
    item.date_end = document.getElementById('edit-date_end')?.value || null;
    item.city = document.getElementById('edit-city')?.value || null;
    item.confirmation_number = document.getElementById('edit-ref')?.value || null;
    item.notes = document.getElementById('edit-notes')?.value || null;
    item.category = document.getElementById('edit-category')?.value || item.category;
    item.guests = parseInt(document.getElementById('edit-guests')?.value) || null;
    const price = document.getElementById('edit-price')?.value;
    item.price = price ? { amount: parseFloat(price), currency: item.price?.currency || 'EUR' } : null;
    return item;
  }

  function getManualItem() {
    const name = document.getElementById('manual-name')?.value?.trim();
    if (!name) { showError(t('name') + ' requis'); return null; }
    
    const price = document.getElementById('manual-price')?.value;
    return {
      id: `booking_${Date.now()}`,
      category: document.getElementById('manual-category')?.value || 'hotel',
      name,
      provider: document.getElementById('manual-provider')?.value || null,
      date_start: document.getElementById('manual-date_start')?.value || null,
      date_end: document.getElementById('manual-date_end')?.value || null,
      city: document.getElementById('manual-city')?.value || null,
      confirmation_number: document.getElementById('manual-ref')?.value || null,
      notes: document.getElementById('manual-notes')?.value || null,
      price: price ? { amount: parseFloat(price), currency: 'EUR' } : null,
      source: 'manual',
      created_at: new Date().toISOString()
    };
  }

  async function confirmCurrent() {
    const item = getEditedItem();
    item._stepId = state.stepId;
    
    try {
      await addToStep(state.tripId, state.stepId, item);
      window.dispatchEvent(new CustomEvent('ort:booking-added', { detail: item }));
      
      state.items.splice(state.currentIndex, 1);
      
      if (state.items.length > 0) {
        if (state.currentIndex >= state.items.length) state.currentIndex = state.items.length - 1;
        renderPreview();
        toast(t('success'), 'success');
      } else {
        toast(t('success'), 'success');
        close();
      }
    } catch (e) {
      showError(e.message);
    }
  }

  async function confirmAll() {
    let added = 0;
    const total = state.items.length;
    
    for (let i = 0; i < total; i++) {
      state.currentIndex = i;
      const item = getEditedItem();
      item._stepId = state.stepId;
      try {
        await addToStep(state.tripId, state.stepId, item);
        window.dispatchEvent(new CustomEvent('ort:booking-added', { detail: item }));
        added++;
      } catch (e) {
        console.error('Erreur ajout item', i, e);
      }
    }
    toast(`${added} ${t('successMulti')}`, 'success');
    close();
  }

  async function confirmManual() {
    const item = getManualItem();
    if (!item) return;
    
    item._stepId = state.stepId;
    
    try {
      await addToStep(state.tripId, state.stepId, item);
      window.dispatchEvent(new CustomEvent('ort:booking-added', { detail: item }));
      toast(t('success'), 'success');
      close();
    } catch (e) {
      showError(e.message);
    }
  }

  function nextItem() {
    state.items[state.currentIndex] = getEditedItem();
    state.currentIndex++;
    if (state.currentIndex >= state.items.length) state.currentIndex = 0;
    renderPreview();
  }

  async function addToStep(tripId, stepId, data) {
    if (stepId === 'travel') return;
    
    if (window.ORT_STATE) {
      const trip = await window.ORT_STATE.getTrip(tripId);
      if (!trip) throw new Error('Voyage non trouvé');
      const idx = parseInt(stepId.replace('day_', '')) - 1;
      if (!trip.steps?.[idx]) throw new Error('Étape non trouvée');
      if (!trip.steps[idx].bookings) trip.steps[idx].bookings = [];
      trip.steps[idx].bookings.push(data);
      await window.ORT_STATE.saveTrip(trip);
      return;
    }
    const key = `ort_bookings_${tripId}_${stepId}`;
    const arr = JSON.parse(localStorage.getItem(key) || '[]');
    arr.push(data);
    localStorage.setItem(key, JSON.stringify(arr));
  }

  function esc(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function toast(msg, type) {
    if (window.ORT_STEP_COMMON?.showToast) { window.ORT_STEP_COMMON.showToast(msg, type); return; }
    const t = document.createElement('div');
    t.style.cssText = `position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:${type==='success'?'#22c55e':'#333'};color:#fff;padding:12px 24px;border-radius:8px;z-index:999999;font-weight:600`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  window.ORT_AI_PARSER = {
    show: showModal,
    close,
    _parse: parse,
    _back: () => goStep('1'),
    _showManual: showManualForm,
    _confirmCurrent: confirmCurrent,
    _confirmAll: confirmAll,
    _confirmManual: confirmManual,
    _nextItem: nextItem,
    CATEGORIES
  };

  console.log('✅ ORT_AI_PARSER chargé v2');
})();