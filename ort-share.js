/**
 * OneRoadTrip - Module de partage d'itinéraires
 * Permet de partager des itinéraires en lecture seule
 * Stockage: Firestore (user authenticated) ou localStorage (guest)
 */

window.ORT_SHARE = {
  /**
   * Génère un ID unique pour le partage
   */
  generateShareId: function() {
    return 'share_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },

  /**
   * Crée un lien de partage pour un itinéraire
   */
  createShareLink: async function(tripData, tripTitle) {
    try {
      // Vérifier Firebase
      if (!window.firebase?.firestore) {
        console.warn('[SHARE] Firestore non disponible, utilisation localStorage');
        return this.createLocalShareLink(tripData, tripTitle);
      }

      const user = window.firebase.auth?.().currentUser;
      const shareId = this.generateShareId();

      // Préparer les données sans l'ID user (visible publiquement)
      const shareData = {
        id: shareId,
        title: tripTitle || tripData.title || 'Voyage',
        country: tripData.country || tripData.cc || 'WORLD',
        steps: tripData.steps || [],
        createdAt: new Date().toISOString(),
        createdBy: user?.email || 'anonymous',
        createdByUserId: user?.uid || null, // Pour les rules Firestore
        mode: 'viewer', // lecture seule
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 jours
      };

      // Sauvegarder dans Firestore
      if (user && window.firebase.firestore()) {
        const db = window.firebase.firestore();
        await db.collection('shared_trips').doc(shareId).set(shareData);
        console.log('[SHARE] ✅ Lien créé:', shareId);
      } else {
        // Fallback localStorage
        localStorage.setItem(`ort_share_${shareId}`, JSON.stringify(shareData));
        console.log('[SHARE] ✅ Lien créé (localStorage):', shareId);
      }

      const shareUrl = `${location.origin}${location.pathname}?share=${shareId}`;
      return { shareId, shareUrl, shareData };
    } catch (error) {
      console.error('[SHARE] ❌ Erreur création lien:', error);
      return null;
    }
  },

  /**
   * Fallback localStorage pour partage sans Firebase
   */
  createLocalShareLink: function(tripData, tripTitle) {
    const shareId = this.generateShareId();
    const shareData = {
      id: shareId,
      title: tripTitle || tripData.title || 'Voyage',
      country: tripData.country || tripData.cc || 'WORLD',
      steps: tripData.steps || [],
      createdAt: new Date().toISOString(),
      mode: 'viewer'
    };

    localStorage.setItem(`ort_share_${shareId}`, JSON.stringify(shareData));
    const shareUrl = `${location.origin}${location.pathname}?share=${shareId}`;
    return { shareId, shareUrl, shareData };
  },

  /**
   * Vérifie l'accès au lien partagé et charge les données
   */
  checkSharedAccess: async function() {
    const params = new URLSearchParams(location.search);
    const shareId = params.get('share');

    if (!shareId) return null;

    try {
      // Chercher dans Firestore d'abord
      if (window.firebase?.firestore) {
        const db = window.firebase.firestore();
        const doc = await db.collection('shared_trips').doc(shareId).get();
        
        if (doc.exists) {
          const data = doc.data();
          
          // Vérifier expiration (30 jours)
          if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
            console.warn('[SHARE] ⚠️ Lien expiré');
            return null;
          }

          console.log('[SHARE] ✅ Données trouvées (Firestore)');
          return { mode: 'viewer', data, sourceType: 'firestore' };
        }
      }

      // Fallback localStorage
      const localData = localStorage.getItem(`ort_share_${shareId}`);
      if (localData) {
        const data = JSON.parse(localData);
        console.log('[SHARE] ✅ Données trouvées (localStorage)');
        return { mode: 'viewer', data, sourceType: 'localStorage' };
      }

      console.warn('[SHARE] ⚠️ Lien non trouvé');
      return null;
    } catch (error) {
      console.error('[SHARE] ❌ Erreur accès:', error);
      return null;
    }
  },

  /**
   * Affiche la modale de partage
   */
  showModal: async function(tripId, tripTitle) {
    console.log('[SHARE] 🔄 Début création modale...');
    
    const modal = document.createElement('div');
    modal.id = 'shareModal';
    modal.style.cssText = `
      position: fixed; inset: 0; background: rgba(0,0,0,0.6); 
      display: flex; align-items: center; justify-content: center; 
      z-index: 10000; font-family: system-ui, sans-serif;
    `;

    const box = document.createElement('div');
    box.style.cssText = `
      background: white; border-radius: 12px; padding: 24px; 
      max-width: 450px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    `;

    const lang = (document.documentElement.lang || 'fr').slice(0, 2);
    const labels = {
      fr: {
        title: '🔗 Partager cet itinéraire',
        description: 'Créez un lien pour partager en lecture seule',
        creating: '⏳ Création du lien...',
        success: '✅ Lien généré!',
        copy: 'Copier le lien',
        copied: 'Copié!',
        close: 'Fermer'
      },
      en: {
        title: '🔗 Share this itinerary',
        description: 'Create a read-only link to share',
        creating: '⏳ Creating link...',
        success: '✅ Link generated!',
        copy: 'Copy link',
        copied: 'Copied!',
        close: 'Close'
      }
    }[lang] || {
      title: '🔗 Share this itinerary',
      description: 'Create a read-only link to share',
      creating: '⏳ Creating link...',
      success: '✅ Link generated!',
      copy: 'Copy link',
      copied: 'Copied!',
      close: 'Close'
    };

    // Afficher modale avec "création en cours"
    box.innerHTML = `
      <h2 style="margin: 0 0 8px; color: #113f7a; font-size: 1.3em;">${labels.title}</h2>
      <p style="margin: 0 0 16px; color: #666; font-size: 0.95em;">${labels.description}</p>
      <div id="shareContent" style="min-height: 60px;">
        <p style="text-align: center; color: #999;">${labels.creating}</p>
      </div>
      <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
        <button id="shareCloseBtn" style="background: #f0f0f0; color: #333; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600;">
          ${labels.close}
        </button>
      </div>
    `;

    modal.appendChild(box);
    document.body.appendChild(modal);
    
    console.log('[SHARE] 📱 Modale affichée avec loading');
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        console.log('[SHARE] Fermeture par click');
        modal.remove();
      }
    });
    
    // Fermer avec Escape
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        console.log('[SHARE] Fermeture par Escape');
        modal.remove();
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);

    // MAINTENANT créer le lien
    try {
      console.log('[SHARE] ⏳ Création du lien...');
      const tripData = window.state || {};
      const result = await this.createShareLink(tripData, tripTitle);
      console.log('[SHARE] Résultat:', result ? '✅' : '❌');

      if (result) {
        const contentDiv = box.querySelector('#shareContent');
        if (contentDiv) {
          contentDiv.innerHTML = `
            <div style="background: #f5f5f5; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
              <input type="text" value="${result.shareUrl}" readonly 
                style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; 
                font-size: 0.9em; font-family: monospace; background: white;">
            </div>
            <div style="display: flex; gap: 8px;">
              <button id="shareCopyBtn" style="flex: 1; background: #113f7a; color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer; font-weight: 600;">
                ${labels.copy}
              </button>
              <button id="shareQrBtn" style="background: #f0f0f0; color: #333; border: none; padding: 10px 15px; border-radius: 6px; cursor: pointer; font-weight: 600;">
                QR
              </button>
            </div>
            <p style="margin-top: 12px; font-size: 0.85em; color: #999; text-align: center;">
              📤 ${labels.success}
            </p>
          `;

          const closeBtn = box.querySelector('#shareCloseBtn');
          if (closeBtn) {
            closeBtn.addEventListener('click', () => modal.remove());
          }
          
          const copyBtn = box.querySelector('#shareCopyBtn');
          if (copyBtn) {
            copyBtn.addEventListener('click', () => {
              navigator.clipboard.writeText(result.shareUrl).then(() => {
                const btn = box.querySelector('#shareCopyBtn');
                const old = btn.textContent;
                btn.textContent = labels.copied;
                setTimeout(() => { btn.textContent = old; }, 1500);
              });
            });
          }
        }
      } else {
        const contentDiv = box.querySelector('#shareContent');
        if (contentDiv) {
          contentDiv.innerHTML = '<p style="color: #d32f2f; text-align: center;">❌ Erreur lors de la création du lien</p>';
        }
      }
    } catch (error) {
      console.error('[SHARE] ❌ Erreur:', error);
      const contentDiv = box.querySelector('#shareContent');
      if (contentDiv) {
        contentDiv.innerHTML = '<p style="color: #d32f2f; text-align: center;">❌ Une erreur est survenue</p>';
      }
    }
  },

  /**
   * Nettoie les partages expirés (à appeler périodiquement ou manuellement)
   * Note: Cette fonction nécessite des droits admin sur Firestore
   * Pour une vraie solution, utiliser une Cloud Function planifiée
   */
  cleanupExpiredShares: async function() {
    try {
      if (!window.firebase?.firestore) {
        console.warn('[SHARE] Firestore non disponible pour le nettoyage');
        return { deleted: 0 };
      }

      const db = window.firebase.firestore();
      const now = new Date().toISOString();
      
      // Chercher les partages expirés
      const expiredQuery = await db.collection('shared_trips')
        .where('expiresAt', '<', now)
        .limit(100) // Limiter pour éviter timeout
        .get();

      if (expiredQuery.empty) {
        console.log('[SHARE] Aucun partage expiré à nettoyer');
        return { deleted: 0 };
      }

      // Supprimer par batch
      const batch = db.batch();
      let count = 0;
      
      expiredQuery.forEach(doc => {
        batch.delete(doc.ref);
        count++;
      });

      await batch.commit();
      console.log(`[SHARE] ✅ ${count} partage(s) expiré(s) supprimé(s)`);
      
      return { deleted: count };
    } catch (error) {
      console.error('[SHARE] ❌ Erreur nettoyage:', error);
      return { deleted: 0, error: error.message };
    }
  },

  /**
   * Supprime un partage spécifique (par son créateur)
   */
  deleteShare: async function(shareId) {
    try {
      if (!window.firebase?.firestore) {
        // Fallback localStorage
        localStorage.removeItem(`ort_share_${shareId}`);
        console.log('[SHARE] ✅ Partage supprimé (localStorage)');
        return true;
      }

      const user = window.firebase.auth?.().currentUser;
      if (!user) {
        console.warn('[SHARE] Utilisateur non connecté');
        return false;
      }

      const db = window.firebase.firestore();
      const doc = await db.collection('shared_trips').doc(shareId).get();
      
      if (!doc.exists) {
        console.warn('[SHARE] Partage non trouvé:', shareId);
        return false;
      }

      const data = doc.data();
      
      // Vérifier que c'est le créateur qui supprime
      if (data.createdByUserId !== user.uid) {
        console.warn('[SHARE] Non autorisé à supprimer ce partage');
        return false;
      }

      await db.collection('shared_trips').doc(shareId).delete();
      console.log('[SHARE] ✅ Partage supprimé:', shareId);
      return true;
    } catch (error) {
      console.error('[SHARE] ❌ Erreur suppression:', error);
      return false;
    }
  }
};

console.log('[ORT-SHARE] ✅ Module chargé');
