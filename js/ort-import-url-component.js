/**
 * ORT Import URL Component v2
 * Background job version with Firestore polling
 * 
 * Usage:
 *   ORT_ImportUrl.open();                    // Opens modal, goes to RT Detail
 *   ORT_ImportUrl.open({destination:'editor'}); // Opens modal, goes to RT Editor
 *   ORT_ImportUrl.close();                   // Closes modal
 */

(function() {
  'use strict';

  // ===== I18N =====
  const I18N = {
    fr: {
      title: "Importer depuis une URL",
      subtitle: "Collez le lien d'un article de voyage pour le transformer en itinéraire",
      placeholder: "https://www.routard.com/guide/...",
      importBtn: "🔮 Importer cet itinéraire",
      importing: "⏳ Analyse en cours...",
      pending: "⏳ Démarrage de l'analyse...",
      processing: "🔄 Récupération de la page...",
      analyzing: "🤖 L'IA analyse le contenu...",
      finalizing: "✨ Finalisation de l'itinéraire...",
      waitMessage: "La création peut prendre 1 à 3 minutes selon la longueur de l'article. Vous pouvez garder cette fenêtre ouverte.",
      success: "✅ Itinéraire créé !",
      error: "❌ Erreur",
      quotaInfo: "Quota restant : {remaining}/{limit} ce mois",
      close: "Fermer",
      // Fallback modal
      fallbackTitle: "Oups, l'IA a besoin d'une pause !",
      fallbackIcon: "🤖💨",
      fallbackExplain: "OneRoadTrip est 100% gratuit et utilise des IA gratuites avec des limites d'utilisation. Pas de panique, vous pouvez importer manuellement !",
      fallbackStep1: "1. Ouvrez l'article dans un nouvel onglet",
      fallbackStep2: "2. Copiez le contenu qui vous intéresse",
      fallbackStep3: "3. Collez-le dans notre outil d'import manuel",
      fallbackOpenArticle: "🔗 Ouvrir l'article",
      fallbackGoManual: "📋 Aller à l'import manuel",
      fallbackErrorDetail: "Détail technique :"
    },
    en: {
      title: "Import from URL",
      subtitle: "Paste a travel article link to transform it into an itinerary",
      placeholder: "https://www.lonelyplanet.com/...",
      importBtn: "🔮 Import this itinerary",
      importing: "⏳ Analyzing...",
      pending: "⏳ Starting analysis...",
      processing: "🔄 Fetching page...",
      analyzing: "🤖 AI is analyzing content...",
      finalizing: "✨ Finalizing itinerary...",
      waitMessage: "Creation may take 1 to 3 minutes depending on article length. You can keep this window open.",
      success: "✅ Itinerary created!",
      error: "❌ Error",
      quotaInfo: "Remaining quota: {remaining}/{limit} this month",
      close: "Close",
      fallbackTitle: "Oops, the AI needs a break!",
      fallbackIcon: "🤖💨",
      fallbackExplain: "OneRoadTrip is 100% free and uses free AI APIs with usage limits. No worries, you can import manually!",
      fallbackStep1: "1. Open the article in a new tab",
      fallbackStep2: "2. Copy the content you're interested in",
      fallbackStep3: "3. Paste it in our manual import tool",
      fallbackOpenArticle: "🔗 Open article",
      fallbackGoManual: "📋 Go to manual import",
      fallbackErrorDetail: "Technical detail:"
    },
    es: {
      title: "Importar desde URL",
      subtitle: "Pega el enlace de un artículo de viaje para transformarlo en itinerario",
      placeholder: "https://www.lonelyplanet.es/...",
      importBtn: "🔮 Importar este itinerario",
      importing: "⏳ Analizando...",
      pending: "⏳ Iniciando análisis...",
      processing: "🔄 Obteniendo página...",
      analyzing: "🤖 La IA está analizando...",
      finalizing: "✨ Finalizando itinerario...",
      waitMessage: "La creación puede tardar de 1 a 3 minutos según la longitud del artículo.",
      success: "✅ ¡Itinerario creado!",
      error: "❌ Error",
      quotaInfo: "Cuota restante: {remaining}/{limit} este mes",
      close: "Cerrar",
      fallbackTitle: "¡Ups, la IA necesita un descanso!",
      fallbackIcon: "🤖💨",
      fallbackExplain: "OneRoadTrip es 100% gratuito y usa APIs de IA gratuitas con límites. ¡No te preocupes, puedes importar manualmente!",
      fallbackStep1: "1. Abre el artículo en una nueva pestaña",
      fallbackStep2: "2. Copia el contenido que te interesa",
      fallbackStep3: "3. Pégalo en nuestra herramienta de importación manual",
      fallbackOpenArticle: "🔗 Abrir artículo",
      fallbackGoManual: "📋 Ir a importación manual",
      fallbackErrorDetail: "Detalle técnico:"
    },
    it: {
      title: "Importa da URL",
      subtitle: "Incolla il link di un articolo di viaggio per trasformarlo in itinerario",
      placeholder: "https://www.lonelyplanetitalia.it/...",
      importBtn: "🔮 Importa questo itinerario",
      importing: "⏳ Analisi in corso...",
      pending: "⏳ Avvio analisi...",
      processing: "🔄 Recupero pagina...",
      analyzing: "🤖 L'IA sta analizzando...",
      finalizing: "✨ Finalizzazione itinerario...",
      waitMessage: "La creazione può richiedere da 1 a 3 minuti a seconda della lunghezza dell'articolo.",
      success: "✅ Itinerario creato!",
      error: "❌ Errore",
      quotaInfo: "Quota rimanente: {remaining}/{limit} questo mese",
      close: "Chiudi",
      fallbackTitle: "Ops, l'IA ha bisogno di una pausa!",
      fallbackIcon: "🤖💨",
      fallbackExplain: "OneRoadTrip è 100% gratuito e usa API AI gratuite con limiti. Niente panico, puoi importare manualmente!",
      fallbackStep1: "1. Apri l'articolo in una nuova scheda",
      fallbackStep2: "2. Copia il contenuto che ti interessa",
      fallbackStep3: "3. Incollalo nel nostro strumento di importazione manuale",
      fallbackOpenArticle: "🔗 Apri articolo",
      fallbackGoManual: "📋 Vai all'importazione manuale",
      fallbackErrorDetail: "Dettaglio tecnico:"
    },
    pt: {
      title: "Importar de URL",
      subtitle: "Cole o link de um artigo de viagem para transformá-lo em roteiro",
      placeholder: "https://www.lonelyplanet.com/...",
      importBtn: "🔮 Importar este roteiro",
      importing: "⏳ Analisando...",
      pending: "⏳ Iniciando análise...",
      processing: "🔄 Obtendo página...",
      analyzing: "🤖 A IA está analisando...",
      finalizing: "✨ Finalizando roteiro...",
      waitMessage: "A criação pode levar de 1 a 3 minutos dependendo do tamanho do artigo.",
      success: "✅ Roteiro criado!",
      error: "❌ Erro",
      quotaInfo: "Cota restante: {remaining}/{limit} este mês",
      close: "Fechar",
      fallbackTitle: "Ops, a IA precisa de uma pausa!",
      fallbackIcon: "🤖💨",
      fallbackExplain: "OneRoadTrip é 100% gratuito e usa APIs de IA gratuitas com limites. Não se preocupe, você pode importar manualmente!",
      fallbackStep1: "1. Abra o artigo em uma nova aba",
      fallbackStep2: "2. Copie o conteúdo que lhe interessa",
      fallbackStep3: "3. Cole em nossa ferramenta de importação manual",
      fallbackOpenArticle: "🔗 Abrir artigo",
      fallbackGoManual: "📋 Ir para importação manual",
      fallbackErrorDetail: "Detalhe técnico:"
    },
    ar: {
      title: "استيراد من رابط",
      subtitle: "الصق رابط مقال سفر لتحويله إلى مسار رحلة",
      placeholder: "https://www.example.com/...",
      importBtn: "🔮 استيراد هذا المسار",
      importing: "⏳ جاري التحليل...",
      pending: "⏳ بدء التحليل...",
      processing: "🔄 جلب الصفحة...",
      analyzing: "🤖 الذكاء الاصطناعي يحلل...",
      finalizing: "✨ إنهاء المسار...",
      waitMessage: "قد يستغرق الإنشاء من 1 إلى 3 دقائق حسب طول المقال.",
      success: "✅ تم إنشاء المسار!",
      error: "❌ خطأ",
      quotaInfo: "الحصة المتبقية: {remaining}/{limit} هذا الشهر",
      close: "إغلاق",
      fallbackTitle: "عفواً، الذكاء الاصطناعي يحتاج استراحة!",
      fallbackIcon: "🤖💨",
      fallbackExplain: "OneRoadTrip مجاني 100% ويستخدم واجهات ذكاء اصطناعي مجانية مع حدود. لا تقلق، يمكنك الاستيراد يدوياً!",
      fallbackStep1: "1. افتح المقال في تبويب جديد",
      fallbackStep2: "2. انسخ المحتوى الذي يهمك",
      fallbackStep3: "3. الصقه في أداة الاستيراد اليدوي",
      fallbackOpenArticle: "🔗 فتح المقال",
      fallbackGoManual: "📋 الذهاب للاستيراد اليدوي",
      fallbackErrorDetail: "تفاصيل تقنية:"
    }
  };

  // ===== CSS =====
  const CSS = `
    .ort-import-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s, visibility 0.3s;
    }
    .ort-import-overlay.active {
      opacity: 1;
      visibility: visible;
    }
    .ort-import-modal {
      background: white;
      border-radius: 16px;
      padding: 32px;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      transform: translateY(20px);
      transition: transform 0.3s;
    }
    .ort-import-overlay.active .ort-import-modal {
      transform: translateY(0);
    }
    .ort-import-title {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 8px;
      color: #1a1a2e;
    }
    .ort-import-subtitle {
      color: #666;
      margin-bottom: 24px;
      font-size: 14px;
    }
    .ort-import-input {
      width: 100%;
      padding: 14px 16px;
      border: 2px solid #e0e0e0;
      border-radius: 10px;
      font-size: 15px;
      margin-bottom: 16px;
      box-sizing: border-box;
      transition: border-color 0.2s;
    }
    .ort-import-input:focus {
      outline: none;
      border-color: #667eea;
    }
    .ort-import-btn {
      width: 100%;
      padding: 14px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .ort-import-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102,126,234,0.4);
    }
    .ort-import-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    .ort-import-status {
      margin-top: 16px;
      padding: 16px;
      border-radius: 10px;
      font-size: 14px;
      display: none;
    }
    .ort-import-status.pending {
      display: block;
      background: #fff3cd;
      color: #856404;
    }
    .ort-import-status.processing {
      display: block;
      background: #e3f2fd;
      color: #1565c0;
    }
    .ort-import-status.success {
      display: block;
      background: #d4edda;
      color: #155724;
    }
    .ort-import-status.error {
      display: block;
      background: #f8d7da;
      color: #721c24;
    }
    .ort-import-wait {
      margin-top: 12px;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 8px;
      font-size: 13px;
      color: #666;
      display: none;
      text-align: center;
    }
    .ort-import-wait.visible {
      display: block;
    }
    .ort-import-progress {
      margin-top: 12px;
      display: none;
    }
    .ort-import-progress.visible {
      display: block;
    }
    .ort-import-progress-bar {
      height: 4px;
      background: #e0e0e0;
      border-radius: 2px;
      overflow: hidden;
    }
    .ort-import-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea, #764ba2);
      width: 0%;
      transition: width 0.5s;
      animation: ort-progress-pulse 2s ease-in-out infinite;
    }
    @keyframes ort-progress-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
    .ort-import-quota {
      margin-top: 16px;
      font-size: 12px;
      color: #888;
      text-align: center;
    }
    .ort-import-close {
      position: absolute;
      top: 16px;
      right: 16px;
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #999;
      line-height: 1;
    }
    .ort-import-close:hover {
      color: #333;
    }
    
    /* Fallback modal */
    .ort-fallback-icon {
      font-size: 64px;
      text-align: center;
      margin-bottom: 16px;
    }
    .ort-fallback-title {
      font-size: 22px;
      font-weight: 700;
      text-align: center;
      margin-bottom: 16px;
      color: #1a1a2e;
    }
    .ort-fallback-explain {
      text-align: center;
      color: #666;
      margin-bottom: 24px;
      font-size: 14px;
      line-height: 1.5;
    }
    .ort-fallback-steps {
      background: #f8f9fa;
      border-radius: 10px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .ort-fallback-step {
      margin-bottom: 12px;
      font-size: 14px;
      color: #333;
    }
    .ort-fallback-step:last-child {
      margin-bottom: 0;
    }
    .ort-fallback-buttons {
      display: flex;
      gap: 12px;
    }
    .ort-fallback-btn {
      flex: 1;
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      text-align: center;
      text-decoration: none;
      transition: transform 0.2s;
    }
    .ort-fallback-btn:hover {
      transform: translateY(-2px);
    }
    .ort-fallback-btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
    }
    .ort-fallback-btn-secondary {
      background: white;
      color: #667eea;
      border: 2px solid #667eea;
    }
    .ort-fallback-error {
      margin-top: 16px;
      font-size: 11px;
      color: #999;
      text-align: center;
    }
  `;

  // ===== STATE =====
  let currentUrl = '';
  let currentJobId = null;
  let currentUid = null;
  let pollInterval = null;
  let options = { destination: 'detail' };

  // ===== HELPERS =====
  function getLang() {
    return (typeof ORT_CONFIG !== 'undefined' && ORT_CONFIG.language) ||
           document.documentElement.lang?.substring(0, 2) ||
           'en';
  }

  function t(key) {
    const lang = getLang();
    return (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;
  }

  function injectCSS() {
    if (document.getElementById('ort-import-url-css')) return;
    const style = document.createElement('style');
    style.id = 'ort-import-url-css';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  // ===== FIREBASE =====
  function getFirestore() {
    if (typeof firebase !== 'undefined' && firebase.firestore) {
      return firebase.firestore();
    }
    return null;
  }

  function getCurrentUser() {
    if (typeof firebase !== 'undefined' && firebase.auth) {
      return firebase.auth().currentUser;
    }
    return null;
  }

  async function getIdToken() {
    const user = getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    return await user.getIdToken();
  }

  // ===== POLLING =====
  function startPolling(uid, jobId) {
    currentUid = uid;
    currentJobId = jobId;
    
    const db = getFirestore();
    if (!db) {
      console.error('Firestore not available');
      return;
    }

    // Listen to job document
    const jobRef = db.collection('users').doc(uid).collection('url_parse_jobs').doc(jobId);
    
    pollInterval = jobRef.onSnapshot((doc) => {
      if (!doc.exists) return;
      
      const data = doc.data();
      console.log('📊 Job status:', data.status);
      
      updateStatusDisplay(data.status, data.error);
      
      if (data.status === 'completed') {
        stopPolling();
        handleSuccess(data.result);
      } else if (data.status === 'error') {
        stopPolling();
        handleError(data.error || 'Unknown error');
      }
    }, (error) => {
      console.error('Polling error:', error);
      stopPolling();
      handleError(error.message);
    });
  }

  function stopPolling() {
    if (pollInterval) {
      pollInterval(); // Unsubscribe
      pollInterval = null;
    }
    currentJobId = null;
    currentUid = null;
  }

  function updateStatusDisplay(status, error) {
    const statusEl = document.getElementById('ort-import-status');
    const waitEl = document.getElementById('ort-import-wait');
    const progressEl = document.getElementById('ort-import-progress');
    const progressFill = document.getElementById('ort-import-progress-fill');
    const btn = document.getElementById('ort-import-btn');
    
    if (!statusEl) return;
    
    // Reset classes
    statusEl.className = 'ort-import-status';
    
    // Map status to display
    const statusMap = {
      'pending': { class: 'pending', text: t('pending'), progress: 10 },
      'processing': { class: 'processing', text: t('processing'), progress: 30 },
      'analyzing': { class: 'processing', text: t('analyzing'), progress: 60 },
      'completed': { class: 'success', text: t('success'), progress: 100 },
      'error': { class: 'error', text: t('error') + ': ' + (error || ''), progress: 0 }
    };
    
    const config = statusMap[status] || statusMap.pending;
    
    statusEl.className = 'ort-import-status ' + config.class;
    statusEl.textContent = config.text;
    statusEl.style.display = 'block';
    
    // Show wait message and progress for non-terminal states
    if (['pending', 'processing', 'analyzing'].includes(status)) {
      waitEl.classList.add('visible');
      progressEl.classList.add('visible');
      progressFill.style.width = config.progress + '%';
      btn.disabled = true;
      btn.textContent = t('importing');
    } else {
      waitEl.classList.remove('visible');
      progressEl.classList.remove('visible');
    }
  }

  // ===== HANDLERS =====
  async function handleImport() {
    const input = document.getElementById('ort-import-url');
    const btn = document.getElementById('ort-import-btn');
    const statusEl = document.getElementById('ort-import-status');
    
    const url = input.value.trim();
    if (!url) return;
    
    currentUrl = url;
    
    // Validate URL
    try {
      new URL(url);
    } catch {
      statusEl.className = 'ort-import-status error';
      statusEl.textContent = t('error') + ': Invalid URL';
      statusEl.style.display = 'block';
      return;
    }
    
    btn.disabled = true;
    btn.textContent = t('importing');
    updateStatusDisplay('pending');
    
    try {
      const token = await getIdToken();
      const user = getCurrentUser();
      
      const response = await fetch('/.netlify/functions/parse-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          url: url,
          language: getLang()
        })
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Request failed');
      }
      
      // Start polling Firestore for job status
      console.log('📋 Job created:', data.jobId);
      startPolling(user.uid, data.jobId);
      
      // Update quota display
      if (data.usage) {
        const quotaEl = document.getElementById('ort-import-quota');
        if (quotaEl) {
          quotaEl.textContent = t('quotaInfo')
            .replace('{remaining}', data.usage.remaining)
            .replace('{limit}', data.usage.limit);
        }
      }
      
    } catch (e) {
      console.error('Import error:', e);
      handleError(e.message);
    }
  }

  function handleSuccess(result) {
    const statusEl = document.getElementById('ort-import-status');
    statusEl.className = 'ort-import-status success';
    statusEl.textContent = t('success');
    
    // Save to localStorage
    const itin = result.data?.itins?.[0];
    if (itin) {
      const cc = itin.itin_id?.split('::')[0] || 'XX';
      const slug = (itin.title || 'trip').toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .substring(0, 40);
      const key = `${cc}_${slug}_${Date.now()}`;
      
      const storageData = {
        itins: result.data.itins,
        places: result.places?.places || [],
        _meta: {
          importedAt: new Date().toISOString(),
          source_url: currentUrl,
          model: result.model
        }
      };
      
      localStorage.setItem(`ort_imported_${key}`, JSON.stringify(storageData));
      console.log('💾 Saved to localStorage:', key);
      
      // Redirect after short delay
      setTimeout(() => {
        close();
        if (options.destination === 'editor') {
          window.location.href = `roadtrip-editor.html?import=${key}`;
        } else {
          window.location.href = `roadtrip_detail.html?import=${key}`;
        }
      }, 1000);
    }
  }

  function handleError(errorMessage) {
    const btn = document.getElementById('ort-import-btn');
    btn.disabled = false;
    btn.textContent = t('importBtn');
    
    // Close main modal and open fallback
    document.getElementById('ort-import-overlay')?.classList.remove('active');
    openFallbackModal(errorMessage);
  }

  // ===== MODALS =====
  function createModal() {
    if (document.getElementById('ort-import-overlay')) return;
    
    const overlay = document.createElement('div');
    overlay.id = 'ort-import-overlay';
    overlay.className = 'ort-import-overlay';
    overlay.innerHTML = `
      <div class="ort-import-modal" style="position:relative;">
        <button class="ort-import-close" onclick="ORT_ImportUrl.close()">&times;</button>
        <div class="ort-import-title">${t('title')}</div>
        <div class="ort-import-subtitle">${t('subtitle')}</div>
        <input type="url" id="ort-import-url" class="ort-import-input" placeholder="${t('placeholder')}">
        <button id="ort-import-btn" class="ort-import-btn">${t('importBtn')}</button>
        <div id="ort-import-status" class="ort-import-status"></div>
        <div id="ort-import-wait" class="ort-import-wait">${t('waitMessage')}</div>
        <div id="ort-import-progress" class="ort-import-progress">
          <div class="ort-import-progress-bar">
            <div id="ort-import-progress-fill" class="ort-import-progress-fill"></div>
          </div>
        </div>
        <div id="ort-import-quota" class="ort-import-quota"></div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Event listeners
    document.getElementById('ort-import-btn').addEventListener('click', handleImport);
    document.getElementById('ort-import-url').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleImport();
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
  }

  function createFallbackModal() {
    if (document.getElementById('ort-fallback-overlay')) return;
    
    const overlay = document.createElement('div');
    overlay.id = 'ort-fallback-overlay';
    overlay.className = 'ort-import-overlay';
    overlay.innerHTML = `
      <div class="ort-import-modal" style="position:relative;">
        <button class="ort-import-close" onclick="ORT_ImportUrl.closeFallback()">&times;</button>
        <div class="ort-fallback-icon">${t('fallbackIcon')}</div>
        <div class="ort-fallback-title">${t('fallbackTitle')}</div>
        <div class="ort-fallback-explain">${t('fallbackExplain')}</div>
        <div class="ort-fallback-steps">
          <div class="ort-fallback-step">${t('fallbackStep1')}</div>
          <div class="ort-fallback-step">${t('fallbackStep2')}</div>
          <div class="ort-fallback-step">${t('fallbackStep3')}</div>
        </div>
        <div class="ort-fallback-buttons">
          <a id="ort-fallback-open" href="#" target="_blank" class="ort-fallback-btn ort-fallback-btn-secondary">${t('fallbackOpenArticle')}</a>
          <a href="import.html" class="ort-fallback-btn ort-fallback-btn-primary">${t('fallbackGoManual')}</a>
        </div>
        <div id="ort-fallback-error" class="ort-fallback-error"></div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeFallback();
    });
  }

  function openFallbackModal(errorMessage) {
    createFallbackModal();
    
    const overlay = document.getElementById('ort-fallback-overlay');
    const openBtn = document.getElementById('ort-fallback-open');
    const errorEl = document.getElementById('ort-fallback-error');
    
    if (currentUrl) {
      openBtn.href = currentUrl;
    }
    
    if (errorMessage) {
      errorEl.textContent = t('fallbackErrorDetail') + ' ' + errorMessage;
    }
    
    overlay.classList.add('active');
  }

  function closeFallback() {
    const overlay = document.getElementById('ort-fallback-overlay');
    if (overlay) overlay.classList.remove('active');
  }

  // ===== PUBLIC API =====
  function open(opts = {}) {
    options = { destination: 'detail', ...opts };
    injectCSS();
    createModal();
    
    // Reset state
    stopPolling();
    const input = document.getElementById('ort-import-url');
    const btn = document.getElementById('ort-import-btn');
    const statusEl = document.getElementById('ort-import-status');
    const waitEl = document.getElementById('ort-import-wait');
    const progressEl = document.getElementById('ort-import-progress');
    
    if (input) input.value = '';
    if (btn) {
      btn.disabled = false;
      btn.textContent = t('importBtn');
    }
    if (statusEl) {
      statusEl.className = 'ort-import-status';
      statusEl.style.display = 'none';
    }
    if (waitEl) waitEl.classList.remove('visible');
    if (progressEl) progressEl.classList.remove('visible');
    
    document.getElementById('ort-import-overlay').classList.add('active');
    input?.focus();
  }

  function close() {
    stopPolling();
    document.getElementById('ort-import-overlay')?.classList.remove('active');
  }

  // ===== EXPORT =====
  window.ORT_ImportUrl = {
    open,
    close,
    closeFallback
  };
})();
