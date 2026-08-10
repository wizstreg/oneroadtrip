/**
 * ort-i18n-auth.js - PASSERELLE (ne contient plus de texte)
 * =========================================================
 * Tous les textes de connexion et de la fenetre d'inscription
 * sont maintenant dans ort-i18n-socle.js, au format
 * "une cle, puis les langues".
 *
 * Ce fichier ne sert plus qu'a verifier que les anciens noms
 * (ORT_I18N_AUTH, ORT_AUTH_I18N) existent bien, pour que
 * ort-header.js et ort-auth-gate.js continuent de marcher sans
 * la moindre modification.
 *
 * A charger APRES ort-i18n-socle.js.
 */
(function () {
  'use strict';

  if (!window.ORT_I18N_AUTH || !window.ORT_AUTH_I18N) {
    console.error('[ORT-I18N-AUTH] ❌ ort-i18n-socle.js doit être chargé AVANT ce fichier.');
    return;
  }

  console.log('[ORT-I18N-AUTH] ✅ Passerelle active (textes dans le socle)');
})();
