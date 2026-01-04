/**
 * OneRoadTrip - Module de Partage
 * 
 * Permet de partager un roadtrip en mode visualisation ou modification
 * via des liens publics ou par email
 */

(function(window) {
  'use strict';
  
  // ══════════════════════════════════════════════════════════════
  // I18N
  // ══════════════════════════════════════════════════════════════
  const I18N = {
    fr: {
      shareTrip: 'Partager ce voyage',
      shareMode: 'Mode de partage',
      viewOnly: 'Lecture seule',
      viewOnlyDesc: 'Peut voir le roadtrip mais pas le modifier',
      editMode: 'Modification',
      editModeDesc: 'Peut modifier le roadtrip (dates, étapes, résas)',
      generateLink: 'Générer le lien',
      copyLink: 'Copier le lien',
      linkCopied: 'Lien copié !',
      shareVia: 'Partager via',
      email: 'Email',
      whatsapp: 'WhatsApp',
      close: 'Fermer',
      warning: '⚠️ Toute personne avec ce lien pourra accéder au voyage',
      warningEdit: '⚠️ Toute personne avec ce lien pourra MODIFIER le voyage',
      revokeAccess: 'Révoquer l\'accès',
      accessRevoked: 'Accès révoqué',
      shareExpiry: 'Ce lien expire dans 30 jours',
      noShareWithoutSave: 'Sauvegardez d\'abord le voyage pour le partager',
      loginRequired: 'Connectez-vous pour partager ce voyage'
    },
    en: {
      shareTrip: 'Share this trip',
      shareMode: 'Share mode',
      viewOnly: 'View only',
      viewOnlyDesc: 'Can view the roadtrip but not modify it',
      editMode: 'Edit mode',
      editModeDesc: 'Can modify the roadtrip (dates, steps, bookings)',
      generateLink: 'Generate link',
      copyLink: 'Copy link',
      linkCopied: 'Link copied!',
      shareVia: 'Share via',
      email: 'Email',
      whatsapp: 'WhatsApp',
      close: 'Close',
      warning: '⚠️ Anyone with this link can access the trip',
      warningEdit: '⚠️ Anyone with this link can EDIT the trip',
      revokeAccess: 'Revoke access',
      accessRevoked: 'Access revoked',
      shareExpiry: 'This link expires in 30 days',
      noShareWithoutSave: 'Save the trip first to share it',
      loginRequired: 'Log in to share this trip'
    },
    es: {
      shareTrip: 'Compartir este viaje',
      shareMode: 'Modo de compartir',
      viewOnly: 'Solo lectura',
      viewOnlyDesc: 'Puede ver el viaje pero no modificarlo',
      editMode: 'Modo edición',
      editModeDesc: 'Puede modificar el viaje (fechas, etapas, reservas)',
      generateLink: 'Generar enlace',
      copyLink: 'Copiar enlace',
      linkCopied: '¡Enlace copiado!',
      shareVia: 'Compartir vía',
      email: 'Email',
      whatsapp: 'WhatsApp',
      close: 'Cerrar',
      warning: '⚠️ Cualquiera con este enlace puede acceder al viaje',
      warningEdit: '⚠️ Cualquiera con este enlace puede EDITAR el viaje',
      revokeAccess: 'Revocar acceso',
      accessRevoked: 'Acceso revocado',
      shareExpiry: 'Este enlace expira en 30 días',
      noShareWithoutSave: 'Guarda el viaje primero para compartirlo',
      loginRequired: 'Inicia sesión para compartir este viaje'
    },
    it: {
      shareTrip: 'Condividi questo viaggio',
      shareMode: 'Modalità condivisione',
      viewOnly: 'Solo lettura',
      viewOnlyDesc: 'Può vedere il viaggio ma non modificarlo',
      editMode: 'Modalità modifica',
      editModeDesc: 'Può modificare il viaggio (date, tappe, prenotazioni)',
      generateLink: 'Genera link',
      copyLink: 'Copia link',
      linkCopied: 'Link copiato!',
      shareVia: 'Condividi via',
      email: 'Email',
      whatsapp: 'WhatsApp',
      close: 'Chiudi',
      warning: '⚠️ Chiunque con questo link può accedere al viaggio',
      warningEdit: '⚠️ Chiunque con questo link può MODIFICARE il viaggio',
      revokeAccess: 'Revoca accesso',
      accessRevoked: 'Accesso revocato',
      shareExpiry: 'Questo link scade tra 30 giorni',
      noShareWithoutSave: 'Salva prima il viaggio per condividerlo',
      loginRequired: 'Accedi per condividere questo viaggio'
    },
    pt: {
      shareTrip: 'Compartilhar esta viagem',
      shareMode: 'Modo de compartilhamento',
      viewOnly: 'Somente leitura',
      viewOnlyDesc: 'Pode ver a viagem mas não modificá-la',
      editMode: 'Modo edição',
      editModeDesc: 'Pode modificar a viagem (datas, etapas, reservas)',
      generateLink: 'Gerar link',
      copyLink: 'Copiar link',
      linkCopied: 'Link copiado!',
      shareVia: 'Compartilhar via',
      email: 'Email',
      whatsapp: 'WhatsApp',
      close: 'Fechar',
      warning: '⚠️ Qualquer pessoa com este link pode acessar a viagem',
      warningEdit: '⚠️ Qualquer pessoa com este link pode EDITAR a viagem',
      revokeAccess: 'Revogar acesso',
      accessRevoked: 'Acesso revogado',
      shareExpiry: 'Este link expira em 30 dias',
      noShareWithoutSave: 'Salve a viagem primeiro para compartilhá-la',
      loginRequired: 'Faça login para compartilhar esta viagem'
    },
    ar: {
      shareTrip: 'مشاركة هذه الرحلة',
      shareMode: 'وضع المشاركة',
      viewOnly: 'للعرض فقط',
      viewOnlyDesc: 'يمكنه رؤية الرحلة لكن لا يمكنه تعديلها',
      editMode: 'وضع التعديل',
      editModeDesc: 'يمكنه تعديل الرحلة (التواريخ، المراحل، الحجوزات)',
      generateLink: 'إنشاء الرابط',
      copyLink: 'نسخ الرابط',
      linkCopied: 'تم نسخ الرابط!',
      shareVia: 'مشاركة عبر',
      email: 'البريد الإلكتروني',
      whatsapp: 'واتساب',
      close: 'إغلاق',
      warning: '⚠️ أي شخص لديه هذا الرابط يمكنه الوصول للرحلة',
      warningEdit: '⚠️ أي شخص لديه هذا الرابط يمكنه تعديل الرحلة',
      revokeAccess: 'إلغاء الوصول',
      accessRevoked: 'تم إلغاء الوصول',
      shareExpiry: 'ينتهي هذا الرابط خلال 30 يوم',
      noShareWithoutSave: 'احفظ الرحلة أولاً لمشاركتها',
      loginRequired: 'سجل الدخول لمشاركة هذه الرحلة'
    }
  };
  
  let lang = localStorage.getItem('ORT_LANG') || localStorage.getItem('lang')?.slice(0,2) || 'fr';
  if (!I18N[lang]) lang = 'en';
  
  const t = (key) => I18N[lang]?.[key] || I18N.en[key] || key;
  
  // ══════════════════════════════════════════════════════════════
  // GÉNÉRATION DE TOKEN
  // ══════════════════════════════════════════════════════════════
  
  function generateShareToken() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 24; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }
  
  // ══════════════════════════════════════════════════════════════
  // FIRESTORE OPERATIONS
  // ══════════════════════════════════════════════════════════════
  
  /**
   * Crée ou met à jour un lien de partage dans Firestore
   */
  async function createShareLink(tripId, mode = 'viewer') {
    const user = firebase.auth().currentUser;
    if (!user) {
      throw new Error(t('loginRequired'));
    }
    
    const db = firebase.firestore();
    const token = generateShareToken();
    const expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 jours
    
    const shareData = {
      token,
      mode, // 'viewer' ou 'editor'
      createdAt: Date.now(),
      expiresAt,
      createdBy: user.uid
    };
    
    // Sauvegarder dans le document du trip
    const tripRef = db.collection('users').doc(user.uid).collection('trips').doc(tripId);
    await tripRef.update({
      publicShare: shareData
    });
    
    // Aussi sauvegarder dans une collection publique pour l'accès par token
    const shareRef = db.collection('sharedTrips').doc(token);
    await shareRef.set({
      tripId,
      ownerId: user.uid,
      mode,
      createdAt: Date.now(),
      expiresAt
    });
    
    console.log('[SHARE] ✅ Lien créé:', token, 'mode:', mode);
    
    return {
      token,
      mode,
      expiresAt,
      url: buildShareUrl(token)
    };
  }
  
  /**
   * Révoque un lien de partage
   */
  async function revokeShareLink(tripId) {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    const db = firebase.firestore();
    
    // Récupérer le token actuel
    const tripRef = db.collection('users').doc(user.uid).collection('trips').doc(tripId);
    const tripDoc = await tripRef.get();
    const currentShare = tripDoc.data()?.publicShare;
    
    if (currentShare?.token) {
      // Supprimer de la collection sharedTrips
      await db.collection('sharedTrips').doc(currentShare.token).delete();
    }
    
    // Supprimer du trip
    await tripRef.update({
      publicShare: firebase.firestore.FieldValue.delete()
    });
    
    console.log('[SHARE] ✅ Lien révoqué');
  }
  
  /**
   * Vérifie et charge un trip partagé par token
   */
  async function loadSharedTrip(token) {
    const db = firebase.firestore();
    
    // Chercher dans sharedTrips
    const shareDoc = await db.collection('sharedTrips').doc(token).get();
    
    if (!shareDoc.exists) {
      console.warn('[SHARE] Token invalide ou expiré');
      return null;
    }
    
    const shareData = shareDoc.data();
    
    // Vérifier expiration
    if (shareData.expiresAt && shareData.expiresAt < Date.now()) {
      console.warn('[SHARE] Lien expiré');
      return null;
    }
    
    // Charger le trip du propriétaire
    const tripRef = db.collection('users').doc(shareData.ownerId).collection('trips').doc(shareData.tripId);
    const tripDoc = await tripRef.get();
    
    if (!tripDoc.exists) {
      console.warn('[SHARE] Trip non trouvé');
      return null;
    }
    
    return {
      trip: tripDoc.data(),
      tripId: shareData.tripId,
      ownerId: shareData.ownerId,
      mode: shareData.mode, // 'viewer' ou 'editor'
      isShared: true
    };
  }
  
  /**
   * Construit l'URL de partage
   */
  function buildShareUrl(token) {
    const baseUrl = window.location.origin;
    return `${baseUrl}/roadtrip_detail.html?share=${token}`;
  }
  
  // ══════════════════════════════════════════════════════════════
  // UI - MODALE DE PARTAGE
  // ══════════════════════════════════════════════════════════════
  
  /**
   * Affiche la modale de partage
   */
  function showShareModal(tripId, tripTitle = 'Voyage') {
    const user = firebase.auth().currentUser;
    if (!user) {
      alert(t('loginRequired'));
      return;
    }
    
    if (!tripId || !tripId.startsWith('trip_')) {
      alert(t('noShareWithoutSave'));
      return;
    }
    
    // Supprimer modale existante
    const existingModal = document.getElementById('shareModal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'shareModal';
    modal.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.7);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    `;
    
    modal.innerHTML = `
      <div style="background:#fff;border-radius:16px;max-width:450px;width:100%;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.3)">
        <div style="background:#113f7a;color:#fff;padding:16px 20px;display:flex;align-items:center;justify-content:space-between">
          <h2 style="margin:0;font-size:1.1rem">🔗 ${t('shareTrip')}</h2>
          <button onclick="document.getElementById('shareModal').remove()" style="background:none;border:none;color:#fff;font-size:1.5rem;cursor:pointer;padding:0">×</button>
        </div>
        
        <div style="padding:20px">
          <div style="font-weight:600;margin-bottom:12px">${t('shareMode')}</div>
          
          <label style="display:flex;align-items:flex-start;gap:12px;padding:14px;background:#f8fafc;border:2px solid #e5e7eb;border-radius:10px;cursor:pointer;margin-bottom:10px" id="shareOptionViewer">
            <input type="radio" name="shareMode" value="viewer" checked style="margin-top:3px">
            <div>
              <div style="font-weight:600;color:#1f2937">👁️ ${t('viewOnly')}</div>
              <div style="font-size:0.85rem;color:#6b7280">${t('viewOnlyDesc')}</div>
            </div>
          </label>
          
          <label style="display:flex;align-items:flex-start;gap:12px;padding:14px;background:#f8fafc;border:2px solid #e5e7eb;border-radius:10px;cursor:pointer;margin-bottom:16px" id="shareOptionEditor">
            <input type="radio" name="shareMode" value="editor" style="margin-top:3px">
            <div>
              <div style="font-weight:600;color:#1f2937">✏️ ${t('editMode')}</div>
              <div style="font-size:0.85rem;color:#6b7280">${t('editModeDesc')}</div>
            </div>
          </label>
          
          <div id="shareWarning" style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:10px;margin-bottom:16px;font-size:0.85rem;color:#92400e">
            ${t('warning')}
          </div>
          
          <div id="shareLinkBox" style="display:none;margin-bottom:16px">
            <input type="text" id="shareLinkInput" readonly style="width:100%;padding:12px;border:1px solid #d1d5db;border-radius:8px;font-size:0.9rem;background:#f9fafb">
            <div style="display:flex;gap:8px;margin-top:10px">
              <button onclick="ORT_SHARE.copyLink()" style="flex:1;padding:10px;background:#113f7a;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600">📋 ${t('copyLink')}</button>
              <button onclick="ORT_SHARE.shareWhatsApp()" style="padding:10px 16px;background:#25D366;color:#fff;border:none;border-radius:8px;cursor:pointer" title="WhatsApp">💬</button>
              <button onclick="ORT_SHARE.shareEmail()" style="padding:10px 16px;background:#EA4335;color:#fff;border:none;border-radius:8px;cursor:pointer" title="Email">📧</button>
            </div>
            <div style="text-align:center;margin-top:10px;font-size:0.8rem;color:#6b7280">${t('shareExpiry')}</div>
          </div>
          
          <button id="generateLinkBtn" onclick="ORT_SHARE.generateLink('${tripId}')" style="width:100%;padding:14px;background:#16a34a;color:#fff;border:none;border-radius:10px;cursor:pointer;font-weight:700;font-size:1rem">
            🔗 ${t('generateLink')}
          </button>
          
          <button id="revokeLinkBtn" onclick="ORT_SHARE.revokeLink('${tripId}')" style="display:none;width:100%;padding:10px;background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;border-radius:8px;cursor:pointer;margin-top:10px;font-size:0.9rem">
            🚫 ${t('revokeAccess')}
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Mettre à jour l'avertissement selon le mode
    const radios = modal.querySelectorAll('input[name="shareMode"]');
    radios.forEach(radio => {
      radio.addEventListener('change', () => {
        const warning = document.getElementById('shareWarning');
        if (radio.value === 'editor') {
          warning.innerHTML = t('warningEdit');
          warning.style.background = '#fef2f2';
          warning.style.borderColor = '#ef4444';
          warning.style.color = '#dc2626';
        } else {
          warning.innerHTML = t('warning');
          warning.style.background = '#fef3c7';
          warning.style.borderColor = '#f59e0b';
          warning.style.color = '#92400e';
        }
      });
    });
    
    // Fermer au clic sur le backdrop
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
    
    // Stocker les infos pour les fonctions
    window._shareModalData = { tripId, tripTitle };
  }
  
  /**
   * Génère le lien de partage
   */
  async function generateLink(tripId) {
    const btn = document.getElementById('generateLinkBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '⏳ ...';
    btn.disabled = true;
    
    try {
      const mode = document.querySelector('input[name="shareMode"]:checked')?.value || 'viewer';
      const result = await createShareLink(tripId, mode);
      
      // Afficher le lien
      document.getElementById('shareLinkInput').value = result.url;
      document.getElementById('shareLinkBox').style.display = 'block';
      document.getElementById('generateLinkBtn').style.display = 'none';
      document.getElementById('revokeLinkBtn').style.display = 'block';
      
      // Stocker l'URL pour partage
      window._shareModalData.shareUrl = result.url;
      
    } catch (e) {
      console.error('[SHARE] Erreur:', e);
      alert(e.message || 'Erreur lors de la génération du lien');
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  }
  
  /**
   * Copie le lien dans le presse-papiers
   */
  function copyLink() {
    const input = document.getElementById('shareLinkInput');
    if (!input) return;
    
    navigator.clipboard.writeText(input.value).then(() => {
      const btn = event.target;
      const original = btn.innerHTML;
      btn.innerHTML = `✅ ${t('linkCopied')}`;
      setTimeout(() => { btn.innerHTML = original; }, 2000);
    });
  }
  
  /**
   * Partage via WhatsApp
   */
  function shareWhatsApp() {
    const url = window._shareModalData?.shareUrl;
    const title = window._shareModalData?.tripTitle || 'Voyage';
    if (url) {
      window.open(`https://wa.me/?text=${encodeURIComponent(title + ' - ' + url)}`, '_blank');
    }
  }
  
  /**
   * Partage par email
   */
  function shareEmail() {
    const url = window._shareModalData?.shareUrl;
    const title = window._shareModalData?.tripTitle || 'Voyage';
    if (url) {
      window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent('Découvre mon voyage: ' + url)}`, '_blank');
    }
  }
  
  /**
   * Révoque le lien de partage
   */
  async function revokeLink(tripId) {
    if (!confirm(t('revokeAccess') + '?')) return;
    
    try {
      await revokeShareLink(tripId);
      
      // Réinitialiser la modale
      document.getElementById('shareLinkBox').style.display = 'none';
      document.getElementById('generateLinkBtn').style.display = 'block';
      document.getElementById('revokeLinkBtn').style.display = 'none';
      
      alert(t('accessRevoked'));
    } catch (e) {
      console.error('[SHARE] Erreur révocation:', e);
    }
  }
  
  // ══════════════════════════════════════════════════════════════
  // VÉRIFICATION MODE PARTAGÉ AU CHARGEMENT
  // ══════════════════════════════════════════════════════════════
  
  /**
   * Vérifie si on accède via un lien de partage et configure le mode
   */
  async function checkSharedAccess() {
    const params = new URLSearchParams(window.location.search);
    const shareToken = params.get('share');
    
    if (!shareToken) {
      return null;
    }
    
    console.log('[SHARE] Accès via lien partagé:', shareToken);
    
    try {
      const sharedData = await loadSharedTrip(shareToken);
      
      if (!sharedData) {
        alert('Ce lien de partage est invalide ou a expiré.');
        return null;
      }
      
      console.log('[SHARE] Trip chargé, mode:', sharedData.mode);
      
      // Stocker le mode pour l'UI
      window._sharedTripMode = sharedData.mode;
      window._sharedTripData = sharedData;
      
      // Désactiver l'édition si mode viewer
      if (sharedData.mode === 'viewer') {
        document.body.classList.add('shared-view-only');
        console.log('[SHARE] Mode lecture seule activé');
      }
      
      return sharedData;
      
    } catch (e) {
      console.error('[SHARE] Erreur chargement:', e);
      return null;
    }
  }
  
  /**
   * Vérifie si l'utilisateur peut modifier le trip actuel
   */
  function canEdit() {
    // Si c'est un trip partagé en mode viewer, pas de modif
    if (window._sharedTripMode === 'viewer') {
      return false;
    }
    return true;
  }
  
  // ══════════════════════════════════════════════════════════════
  // EXPORT
  // ══════════════════════════════════════════════════════════════
  
  window.ORT_SHARE = {
    // UI
    showModal: showShareModal,
    generateLink,
    copyLink,
    shareWhatsApp,
    shareEmail,
    revokeLink,
    
    // Accès partagé
    checkSharedAccess,
    loadSharedTrip,
    canEdit,
    
    // Helpers
    createShareLink,
    revokeShareLink,
    buildShareUrl,
    
    // Traductions
    t,
    setLang: (newLang) => { if (I18N[newLang]) lang = newLang; },
    
    VERSION: '1.0'
  };
  
  console.log('[SHARE] ✅ Module ORT_SHARE v1.0 chargé');
  
})(window);
