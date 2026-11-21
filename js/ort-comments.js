/* ort-comments.js - Commentaires + alertes sur les pages itineraires
 * ------------------------------------------------------------------
 * Design "Fiches serrees".
 * Depend de : le conteneur #ortCommentsHost et ses attributs data-*,
 *             window.ortEnsureFirebase()
 * Collections Firestore :
 *   ort_comments        : un document par commentaire
 *   ort_comment_counts  : un document par itineraire ET par langue { n: nombre }
 *   ort_alerts          : un document par signalement
 * Aucune lecture Firestore tant que le visiteur n'a pas bouge (anti-robots).
 */
(function () {
  'use strict';

  console.log('[ORT-CM] fichier charge');

  var host = document.getElementById('ortCommentsHost');
  if (!host) {
    console.warn('[ORT-CM] arret : conteneur #ortCommentsHost absent de la page');
    return;
  }

  var TRIP  = window.ORT_TRIP || {};
  var ITIN  = host.getAttribute('data-itin')  || TRIP.itin  || '';
  var TITLE = host.getAttribute('data-title') || TRIP.title || document.title || '';
  var LANG  = (host.getAttribute('data-lang') || TRIP.lang || document.documentElement.lang || 'fr').slice(0, 2);

  if (!ITIN) {
    console.warn('[ORT-CM] arret : aucun identifiant d itineraire');
    return;
  }
  var ITIN_KEY  = ITIN.replace(/::/g, '__').replace(/[^A-Za-z0-9_\-]/g, '_');
  var COUNT_KEY = ITIN_KEY + '__' + LANG;
  var RTL = (LANG === 'ar');

  /* ---------------- Textes ---------------- */
  var T = {
    fr: { title:'Commentaires des voyageurs', first:'Aucun commentaire pour le moment.',
          placeholder:'Votre commentaire\u2026', send:'Envoyer', sending:'Envoi\u2026',
          sent:'Merci, votre commentaire est publie.', login:'Se connecter pour commenter',
          err:'Envoi impossible, reessayez.', readErr:'Commentaires momentanement indisponibles.',
          empty:'Ecrivez quelque chose avant d\u2019envoyer.',
          footIn:'Votre prenom sera visible.', footOut:'Lecture libre, ecriture reservee aux membres.',
          team:'Equipe OneRoadTrip', repliedOn:'a repondu le',
          alertTip:'Signaler une erreur', alertTitle:'Signaler un probleme',
          alertPh:'Que voulez-vous nous signaler ?', alertSent:'Merci, signalement envoye.',
          cancel:'Annuler' },
    en: { title:'Traveller comments', first:'No comments yet.',
          placeholder:'Your comment\u2026', send:'Send', sending:'Sending\u2026',
          sent:'Thanks, your comment is published.', login:'Sign in to comment',
          err:'Could not send, please retry.', readErr:'Comments temporarily unavailable.',
          empty:'Please write something first.',
          footIn:'Your first name will be visible.', footOut:'Free to read, members only to write.',
          team:'OneRoadTrip team', repliedOn:'replied on',
          alertTip:'Report an error', alertTitle:'Report a problem',
          alertPh:'What would you like to report?', alertSent:'Thanks, report sent.',
          cancel:'Cancel' },
    es: { title:'Comentarios de viajeros', first:'Todavia no hay comentarios.',
          placeholder:'Tu comentario\u2026', send:'Enviar', sending:'Enviando\u2026',
          sent:'Gracias, tu comentario esta publicado.', login:'Inicia sesion para comentar',
          err:'No se pudo enviar, reintenta.', readErr:'Comentarios no disponibles por ahora.',
          empty:'Escribe algo antes de enviar.',
          footIn:'Tu nombre sera visible.', footOut:'Lectura libre, escritura solo para miembros.',
          team:'Equipo OneRoadTrip', repliedOn:'respondio el',
          alertTip:'Informar de un error', alertTitle:'Informar de un problema',
          alertPh:'Que quieres senalar?', alertSent:'Gracias, aviso enviado.',
          cancel:'Cancelar' },
    it: { title:'Commenti dei viaggiatori', first:'Nessun commento per ora.',
          placeholder:'Il tuo commento\u2026', send:'Invia', sending:'Invio\u2026',
          sent:'Grazie, il tuo commento e pubblicato.', login:'Accedi per commentare',
          err:'Invio non riuscito, riprova.', readErr:'Commenti momentaneamente non disponibili.',
          empty:'Scrivi qualcosa prima di inviare.',
          footIn:'Il tuo nome sara visibile.', footOut:'Lettura libera, scrittura riservata ai membri.',
          team:'Team OneRoadTrip', repliedOn:'ha risposto il',
          alertTip:'Segnala un errore', alertTitle:'Segnala un problema',
          alertPh:'Cosa vuoi segnalare?', alertSent:'Grazie, segnalazione inviata.',
          cancel:'Annulla' },
    pt: { title:'Comentarios de viajantes', first:'Ainda nao ha comentarios.',
          placeholder:'O seu comentario\u2026', send:'Enviar', sending:'A enviar\u2026',
          sent:'Obrigado, o seu comentario esta publicado.', login:'Inicie sessao para comentar',
          err:'Nao foi possivel enviar, tente de novo.', readErr:'Comentarios temporariamente indisponiveis.',
          empty:'Escreva algo antes de enviar.',
          footIn:'O seu nome sera visivel.', footOut:'Leitura livre, escrita reservada a membros.',
          team:'Equipa OneRoadTrip', repliedOn:'respondeu a',
          alertTip:'Assinalar um erro', alertTitle:'Reportar um problema',
          alertPh:'O que deseja reportar?', alertSent:'Obrigado, reporte enviado.',
          cancel:'Cancelar' },
    de: { title:'Kommentare von Reisenden', first:'Noch keine Kommentare.',
          placeholder:'Ihr Kommentar\u2026', send:'Senden', sending:'Wird gesendet\u2026',
          sent:'Danke, Ihr Kommentar ist veroffentlicht.', login:'Zum Kommentieren anmelden',
          err:'Senden fehlgeschlagen, bitte erneut versuchen.', readErr:'Kommentare vorubergehend nicht verfugbar.',
          empty:'Bitte zuerst etwas schreiben.',
          footIn:'Ihr Vorname wird sichtbar sein.', footOut:'Lesen frei, Schreiben nur fur Mitglieder.',
          team:'OneRoadTrip Team', repliedOn:'antwortete am',
          alertTip:'Fehler melden', alertTitle:'Problem melden',
          alertPh:'Was mochten Sie melden?', alertSent:'Danke, Meldung gesendet.',
          cancel:'Abbrechen' },
    nl: { title:'Reacties van reizigers', first:'Nog geen reacties.',
          placeholder:'Uw reactie\u2026', send:'Versturen', sending:'Versturen\u2026',
          sent:'Bedankt, uw reactie is geplaatst.', login:'Log in om te reageren',
          err:'Versturen mislukt, probeer opnieuw.', readErr:'Reacties tijdelijk niet beschikbaar.',
          empty:'Schrijf eerst iets.',
          footIn:'Uw voornaam wordt zichtbaar.', footOut:'Vrij te lezen, schrijven voor leden.',
          team:'OneRoadTrip team', repliedOn:'antwoordde op',
          alertTip:'Een fout melden', alertTitle:'Probleem melden',
          alertPh:'Wat wilt u melden?', alertSent:'Bedankt, melding verstuurd.',
          cancel:'Annuleren' },
    ar: { title:'\u062a\u0639\u0644\u064a\u0642\u0627\u062a \u0627\u0644\u0645\u0633\u0627\u0641\u0631\u064a\u0646', first:'\u0644\u0627 \u062a\u0648\u062c\u062f \u062a\u0639\u0644\u064a\u0642\u0627\u062a \u0628\u0639\u062f.',
          placeholder:'\u062a\u0639\u0644\u064a\u0642\u0643\u2026', send:'\u0625\u0631\u0633\u0627\u0644', sending:'\u062c\u0627\u0631\u064d \u0627\u0644\u0625\u0631\u0633\u0627\u0644\u2026',
          sent:'\u0634\u0643\u0631\u064b\u0627\u060c \u062a\u0645 \u0646\u0634\u0631 \u062a\u0639\u0644\u064a\u0642\u0643.', login:'\u0633\u062c\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0644\u0644\u062a\u0639\u0644\u064a\u0642',
          err:'\u062a\u0639\u0630\u0631 \u0627\u0644\u0625\u0631\u0633\u0627\u0644\u060c \u062d\u0627\u0648\u0644 \u0645\u062c\u062f\u062f\u064b\u0627.', readErr:'\u0627\u0644\u062a\u0639\u0644\u064a\u0642\u0627\u062a \u063a\u064a\u0631 \u0645\u062a\u0627\u062d\u0629 \u062d\u0627\u0644\u064a\u064b\u0627.',
          empty:'\u0627\u0643\u062a\u0628 \u0634\u064a\u0626\u064b\u0627 \u0642\u0628\u0644 \u0627\u0644\u0625\u0631\u0633\u0627\u0644.',
          footIn:'\u0633\u064a\u0638\u0647\u0631 \u0627\u0633\u0645\u0643.', footOut:'\u0627\u0644\u0642\u0631\u0627\u0621\u0629 \u0645\u062a\u0627\u062d\u0629\u060c \u0648\u0627\u0644\u0643\u062a\u0627\u0628\u0629 \u0644\u0644\u0623\u0639\u0636\u0627\u0621.',
          team:'\u0641\u0631\u064a\u0642 OneRoadTrip', repliedOn:'\u0631\u062f \u0641\u064a',
          alertTip:'\u0627\u0644\u0625\u0628\u0644\u0627\u063a \u0639\u0646 \u062e\u0637\u0623', alertTitle:'\u0627\u0644\u0625\u0628\u0644\u0627\u063a \u0639\u0646 \u0645\u0634\u0643\u0644\u0629',
          alertPh:'\u0645\u0627 \u0627\u0644\u0630\u064a \u062a\u0631\u064a\u062f \u0627\u0644\u0625\u0628\u0644\u0627\u063a \u0639\u0646\u0647\u061f', alertSent:'\u0634\u0643\u0631\u064b\u0627\u060c \u062a\u0645 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0628\u0644\u0627\u063a.',
          cancel:'\u0625\u0644\u063a\u0627\u0621' }
  };
  var t = T[LANG] || T.en;

  /* ---------------- Utilitaires ---------------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function el(tag, cls, html) {
    var d = document.createElement(tag);
    if (cls) d.className = cls;
    if (html != null) d.innerHTML = html;
    return d;
  }
  function fbReady() {
    if (window.ortEnsureFirebase) return window.ortEnsureFirebase();
    if (window.firebase && window.firebase.firestore) return Promise.resolve();
    return Promise.reject(new Error('firebase absent'));
  }
  function currentUser() {
    try { return (window.firebase && firebase.auth && firebase.auth().currentUser) || null; } catch (e) { return null; }
  }
  function openLogin() {
    if (typeof OrtAuthModal !== 'undefined') {
      try {
        var m = new OrtAuthModal();
        Promise.resolve(m.init()).then(function () {
          m.mode = 'login';
          if (m.updateUI) m.updateUI();
          m.show();
        });
        return;
      } catch (e) { /* on retombe sur Google */ }
    }
    try {
      var p = new firebase.auth.GoogleAuthProvider();
      p.setCustomParameters({ prompt: 'select_account' });
      firebase.auth().signInWithPopup(p);
    } catch (e) { }
  }
  function toDate(ts) {
    try { return ts && ts.toDate ? ts.toDate() : (ts ? new Date(ts) : null); } catch (e) { return null; }
  }
  function fmtShort(ts) {
    var d = toDate(ts);
    if (!d) return '';
    try { return d.toLocaleDateString(LANG, { month: 'short', day: 'numeric' }); } catch (e) { return ''; }
  }
  function fmtIso(ts) {
    var d = toDate(ts);
    try { return d ? d.toISOString().slice(0, 10) : ''; } catch (e) { return ''; }
  }
  function fmtLong(ts) {
    var d = toDate(ts);
    if (!d) return '';
    try { return d.toLocaleDateString(LANG, { month: 'long', day: 'numeric' }); } catch (e) { return ''; }
  }
  function initiales(nom) {
    var mots = String(nom || '?').trim().split(/[\s\-']+/).filter(Boolean);
    if (!mots.length) return '?';
    var a = mots[0].charAt(0);
    var b = mots.length > 1 ? mots[mots.length - 1].charAt(0) : '';
    return (a + b).toUpperCase();
  }
  function teinte(cle) {
    var n = 0, s = String(cle || '');
    for (var i = 0; i < s.length; i++) n = (n + s.charCodeAt(i)) % 3;
    return n === 1 ? ' ort-ava-2' : (n === 2 ? ' ort-ava-3' : '');
  }

  /* ---------------- Styles ---------------- */
  var CSS = ''
    + '.ort-alert{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;vertical-align:middle;'
    + 'inline-size:21px;block-size:21px;margin-inline-start:9px;border:0;border-radius:50%;'
    + 'background:#c2410c;color:#fff;font:700 12px/1 inherit;cursor:pointer;padding:0;position:relative}'
    + '.ort-alert::before{content:"!"}'
    + '.ort-alert:hover{background:#a5330a}'
    + '.ort-alert:focus-visible{outline:2px solid #113f7a;outline-offset:2px}'
    + '.ort-alert-h1{inline-size:27px;block-size:27px;font-size:15px;margin-inline-start:12px;'
    + 'box-shadow:0 2px 8px rgba(0,0,0,.35)}'
    + '.ort-alert::after{content:attr(data-tip);position:absolute;bottom:135%;left:50%;transform:translateX(-50%);'
    + 'background:#1e293b;color:#fff;font:600 11px/1.2 inherit;white-space:nowrap;padding:5px 9px;border-radius:6px;'
    + 'opacity:0;pointer-events:none;transition:opacity .15s;z-index:60}'
    + '.ort-alert:hover::after,.ort-alert:focus::after{opacity:1}'
    + '@media(max-width:760px){.ort-alert::after{display:none}.ort-alert-h1{inline-size:23px;block-size:23px;font-size:13px}}'

    + '#ortCommentsHost{inline-size:100%}'
    + '.ort-panel{border:1px solid #dbe2ec;border-radius:5px;overflow:hidden;background:#f5f7fa;color:#222b36;'
    + 'font:14.5px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;text-align:start}'
    + '.ort-panel>summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:8px;'
    + 'padding:11px 14px;background:#113f7a;color:#fff;font-size:14px;font-weight:600}'
    + '.ort-panel>summary::-webkit-details-marker{display:none}'
    + '.ort-panel>summary:hover{background:#0d3462}'
    + '.ort-panel>summary:focus-visible{outline:2px solid #c2410c;outline-offset:-3px}'
    + '.ort-caret{flex:0 0 auto;inline-size:0;block-size:0;border-block-start:5px solid transparent;'
    + 'border-block-end:5px solid transparent;border-inline-start:6px solid #fff;transition:transform .14s linear}'
    + '[dir="rtl"] .ort-caret{transform:scaleX(-1)}'
    + '.ort-panel[open] .ort-caret{transform:rotate(90deg)}'
    + '[dir="rtl"] .ort-panel[open] .ort-caret{transform:scaleX(-1) rotate(-90deg)}'
    + '.ort-badge{margin-inline-start:auto;background:#3a6199;border-radius:20px;padding:1px 9px;font-size:12.5px}'

    + '.ort-list{margin:0;padding:10px;list-style:none;max-block-size:330px;overflow-y:auto;'
    + 'display:flex;flex-direction:column;gap:8px;overscroll-behavior:contain}'
    + '.ort-empty{padding:14px 12px;color:#96a0ad;font-size:13.5px}'
    + '.ort-ko{padding:14px 12px;color:#b91c1c;font-size:13.5px}'
    + '.ort-card{background:#fff;border:1px solid #e2e8f0;border-radius:5px;padding:10px 12px}'
    + '.ort-top{display:flex;flex-wrap:wrap;align-items:center;gap:4px 9px;margin-block-end:5px}'
    + '.ort-ava{flex:0 0 auto;inline-size:28px;block-size:28px;border-radius:50%;background:#eaf0f7;color:#113f7a;'
    + 'font:600 11px/1 inherit;display:flex;align-items:center;justify-content:center;object-fit:cover;overflow:hidden}'
    + '.ort-ava-2{background:#fdefe7;color:#a5330a}'
    + '.ort-ava-3{background:#eaf1ea;color:#33613c}'
    + '.ort-name{font-size:14px;font-weight:700;color:#113f7a;overflow-wrap:break-word;min-inline-size:0}'
    + '.ort-date{font-size:11.5px;color:#96a0ad;margin-inline-start:auto;white-space:nowrap}'
    + '.ort-text{margin:0;color:#333c48;overflow-wrap:break-word;text-wrap:pretty}'

    + '.ort-reply{margin:10px -12px -10px;padding:9px 12px 10px;background:#eef3f9;border-block-start:1px solid #dde5f0}'
    + '.ort-reply-top{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-block-end:4px}'
    + '.ort-tag{background:#113f7a;color:#fff;border-radius:3px;padding:2px 7px;font-size:10.5px;font-weight:700;'
    + 'letter-spacing:.07em;text-transform:uppercase}'
    + '.ort-tag-when{font-size:11.5px;color:#7d8ca0}'
    + '.ort-reply-text{margin:0;font-size:14px;color:#2f4360;overflow-wrap:break-word;text-wrap:pretty}'

    + '.ort-write{padding:10px;border-block-start:1px solid #dbe2ec;background:#fff}'
    + '.ort-row{display:flex;flex-wrap:wrap;align-items:flex-end;gap:8px}'
    + '.ort-ta{flex:1 1 180px;min-inline-size:0;box-sizing:border-box;min-block-size:40px;resize:vertical;'
    + 'padding:9px 11px;background:#fff;border:1px solid #d5dde8;border-radius:4px;font:inherit;font-size:14px;'
    + 'line-height:1.45;color:#222b36}'
    + '.ort-ta::placeholder{color:#a1abb8}'
    + '.ort-ta:focus{outline:none;border-color:#113f7a;box-shadow:inset 0 0 0 1px #113f7a}'
    + '.ort-send{flex:0 0 auto;border:0;background:#113f7a;color:#fff;border-radius:4px;padding:10px 15px;'
    + 'font:600 14px/1.2 inherit;cursor:pointer}'
    + '.ort-send:hover{background:#0d3462}'
    + '.ort-send[disabled]{opacity:.55;cursor:default}'
    + '.ort-login{display:block;inline-size:100%;box-sizing:border-box;padding:10px 14px;background:#fff;'
    + 'border:1px solid #113f7a;border-radius:4px;color:#113f7a;font:600 14px/1.3 inherit;cursor:pointer;text-align:center}'
    + '.ort-login:hover{background:#eef3f9}'
    + '.ort-send:focus-visible,.ort-login:focus-visible{outline:2px solid #c2410c;outline-offset:2px}'
    + '.ort-foot{margin:7px 0 0;font-size:11.5px;color:#96a0ad}'
    + '.ort-foot.ok{color:#0a7d2c}'
    + '.ort-foot.ko{color:#b91c1c}'
    + '@media (max-width:520px){.ort-list{max-block-size:44vh}}'

    + '#ortAlOv{position:fixed;inset:0;background:rgba(8,15,30,.55);z-index:99990;display:flex;'
    + 'align-items:center;justify-content:center;padding:16px}'
    + '#ortAlBox{background:#fff;border-radius:6px;max-inline-size:430px;inline-size:100%;padding:18px;'
    + 'box-shadow:0 18px 50px rgba(0,0,0,.35);text-align:start;box-sizing:border-box;'
    + 'font:14.5px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}'
    + '#ortAlBox h4{margin:0 0 3px;font-size:15px;color:#113f7a}'
    + '#ortAlBox .al-tg{font-size:12px;color:#7d8ca0;margin:0 0 12px;overflow-wrap:break-word}'
    + '#ortAlBox textarea{inline-size:100%;box-sizing:border-box;min-block-size:96px;resize:vertical;'
    + 'border:1px solid #d5dde8;border-radius:4px;padding:9px 11px;font:inherit;font-size:14px}'
    + '#ortAlBox textarea:focus{outline:none;border-color:#113f7a;box-shadow:inset 0 0 0 1px #113f7a}'
    + '#ortAlBox .al-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-block-start:10px}'
    + '#ortAlBox .al-cancel{background:#fff;border:1px solid #d5dde8;color:#4a5768;border-radius:4px;'
    + 'padding:10px 15px;font:600 14px/1.2 inherit;cursor:pointer}'
    + '#ortAlBox .al-msg{font-size:12.5px;color:#0a7d2c;margin-inline-start:auto}'
    + '#ortAlBox .al-msg.ko{color:#b91c1c}';

  (function () {
    var s = document.createElement('style');
    s.textContent = CSS;
    document.head.appendChild(s);
  })();

  /* ---------------- Construction du bloc ---------------- */
  var panel = el('details', 'ort-panel');
  if (RTL) panel.setAttribute('dir', 'rtl');
  panel.innerHTML =
    '<summary><span class="ort-caret" aria-hidden="true"></span>'
    + '<span>' + esc(t.title) + '</span>'
    + '<span class="ort-badge" id="ortBadge" style="display:none">0</span></summary>'
    + '<ul class="ort-list" id="ortList"><li class="ort-empty">\u2026</li></ul>'
    + '<div class="ort-write" id="ortWrite"></div>';
  host.appendChild(panel);
  console.log('[ORT-CM] bloc installe pour', COUNT_KEY);

  var listEl  = panel.querySelector('#ortList');
  var writeEl = panel.querySelector('#ortWrite');
  var badgeEl = panel.querySelector('#ortBadge');
  var charge  = false;

  panel.addEventListener('toggle', function () {
    if (panel.open && !charge) { charge = true; loadComments(); }
  });

  /* Compteur : une seule lecture, et seulement si un humain a bouge */
  var compte = false;
  function loadCount() {
    if (compte) return;
    compte = true;
    var cache = null;
    try { cache = sessionStorage.getItem('ortCmN:' + COUNT_KEY); } catch (e) { }
    if (cache !== null) { showCount(parseInt(cache, 10) || 0); return; }
    fbReady().then(function () {
      return firebase.firestore().collection('ort_comment_counts').doc(COUNT_KEY).get();
    }).then(function (d) {
      var n = (d.exists && d.data().n) || 0;
      try { sessionStorage.setItem('ortCmN:' + COUNT_KEY, String(n)); } catch (e) { }
      showCount(n);
    }).catch(function () { });
  }
  function showCount(n) {
    if (n > 0) { badgeEl.textContent = n; badgeEl.style.display = ''; }
    else { badgeEl.style.display = 'none'; }
  }
  function syncCount(vrai) {
    if (!currentUser()) return;
    firebase.firestore().collection('ort_comment_counts').doc(COUNT_KEY)
      .set({ itin: ITIN, itinKey: ITIN_KEY, lang: LANG, title: TITLE, n: vrai }, { merge: true })
      .catch(function () { });
  }
  ['mousemove', 'scroll', 'touchstart', 'keydown'].forEach(function (ev) {
    window.addEventListener(ev, loadCount, { once: true, passive: true });
  });

  /* ---------------- Lecture ---------------- */
  function loadComments() {
    fbReady().then(function () {
      // Pas de tri cote serveur : evite d'avoir a creer un index composite.
      return firebase.firestore().collection('ort_comments')
        .where('itinKey', '==', ITIN_KEY)
        .limit(200).get();
    }).then(function (snap) {
      var rows = [];
      snap.forEach(function (doc) {
        var c = doc.data();
        if ((c.lang || 'fr') === LANG) rows.push(c);
      });
      rows.sort(function (a, b) {
        var ta = a.ts && a.ts.toMillis ? a.ts.toMillis() : 0;
        var tb = b.ts && b.ts.toMillis ? b.ts.toMillis() : 0;
        return tb - ta;
      });

      listEl.innerHTML = '';
      if (!rows.length) {
        listEl.appendChild(el('li', 'ort-empty', esc(t.first)));
        showCount(0);
        try { sessionStorage.setItem('ortCmN:' + COUNT_KEY, '0'); } catch (e) { }
        syncCount(0);
      } else {
        showCount(rows.length);
        try { sessionStorage.setItem('ortCmN:' + COUNT_KEY, String(rows.length)); } catch (e) { }
        syncCount(rows.length);
        rows.forEach(function (c) { listEl.appendChild(carte(c)); });
      }
      buildForm();
    }).catch(function (e) {
      console.warn('[ORT-CM] lecture impossible', e);
      listEl.innerHTML = '';
      listEl.appendChild(el('li', 'ort-ko', esc(t.readErr)));
      buildForm();
    });
  }

  function carte(c) {
    var nom = c.name || '?';
    var av = c.photo
      ? '<img class="ort-ava" src="' + esc(c.photo) + '" alt="" referrerpolicy="no-referrer">'
      : '<span class="ort-ava' + teinte(c.uid || nom) + '" aria-hidden="true">' + esc(initiales(nom)) + '</span>';

    var rep = '';
    if (c.reply) {
      var quand = fmtLong(c.replyTs);
      rep = '<div class="ort-reply"><div class="ort-reply-top">'
          + '<span class="ort-tag">' + esc(t.team) + '</span>'
          + (quand ? '<span class="ort-tag-when">' + esc(t.repliedOn) + ' ' + esc(quand) + '</span>' : '')
          + '</div><p class="ort-reply-text">' + esc(c.reply) + '</p></div>';
    }

    return el('li', 'ort-card',
      '<div class="ort-top">' + av
      + '<span class="ort-name">' + esc(nom) + '</span>'
      + '<time class="ort-date" datetime="' + esc(fmtIso(c.ts)) + '">' + esc(fmtShort(c.ts)) + '</time>'
      + '</div><p class="ort-text">' + esc(c.text || '') + '</p>' + rep);
  }

  /* ---------------- Ecriture ---------------- */
  function buildForm() {
    fbReady().then(function () {
      firebase.auth().onAuthStateChanged(function (u) { renderForm(u); });
      renderForm(currentUser());
    }).catch(function () { renderForm(null); });
  }

  function renderForm(user) {
    writeEl.innerHTML = '';
    if (!user) {
      var b = el('button', 'ort-login', esc(t.login));
      b.type = 'button';
      b.addEventListener('click', openLogin);
      writeEl.appendChild(b);
      writeEl.appendChild(el('p', 'ort-foot', esc(t.footOut)));
      return;
    }

    var row = el('div', 'ort-row');
    var ta = el('textarea', 'ort-ta');
    ta.placeholder = t.placeholder;
    ta.maxLength = 1500;
    ta.setAttribute('aria-label', t.placeholder);
    var btn = el('button', 'ort-send', esc(t.send));
    btn.type = 'button';
    row.appendChild(ta); row.appendChild(btn);
    var foot = el('p', 'ort-foot', esc(t.footIn));
    writeEl.appendChild(row); writeEl.appendChild(foot);

    btn.addEventListener('click', function () {
      var txt = ta.value.trim();
      if (!txt) { foot.className = 'ort-foot ko'; foot.textContent = t.empty; return; }
      btn.disabled = true; btn.textContent = t.sending;
      var db = firebase.firestore();
      db.collection('ort_comments').add({
        itin: ITIN, itinKey: ITIN_KEY, itinTitle: TITLE, lang: LANG,
        uid: user.uid, name: user.displayName || (user.email || '').split('@')[0] || '?',
        email: user.email || '', photo: user.photoURL || '',
        text: txt, ts: firebase.firestore.FieldValue.serverTimestamp()
      }).then(function () {
        return db.collection('ort_comment_counts').doc(COUNT_KEY).set({
          itin: ITIN, itinKey: ITIN_KEY, lang: LANG, title: TITLE,
          n: firebase.firestore.FieldValue.increment(1)
        }, { merge: true });
      }).then(function () {
        try { sessionStorage.removeItem('ortCmN:' + COUNT_KEY); } catch (e) { }
        foot.className = 'ort-foot ok'; foot.textContent = t.sent;
        ta.value = '';
        btn.disabled = false; btn.textContent = t.send;
        loadComments();
      }).catch(function (e) {
        console.warn('[ORT-CM] envoi impossible', e);
        foot.className = 'ort-foot ko'; foot.textContent = t.err;
        btn.disabled = false; btn.textContent = t.send;
      });
    });
  }

  /* ---------------- Boutons de signalement ---------------- */
  function boutonAlerte(classes) {
    // Le point d exclamation est pose par le style, pas par le texte du bouton.
    // Ecrit en texte, il partait dans tout textContent recopie ailleurs, et le
    // selecteur d etapes affichait un ! mort a cote du nom du lieu.
    var b = el('button', 'ort-alert' + (classes ? ' ' + classes : ''), '');
    b.type = 'button';
    b.title = t.alertTip;
    b.setAttribute('data-tip', t.alertTip);
    b.setAttribute('aria-label', t.alertTip);
    return b;
  }

  function addMainFlag() {
    var h1 = document.querySelector('.hr h1') || document.querySelector('h1');
    if (!h1 || h1.querySelector('.ort-alert')) return;
    var b = boutonAlerte('ort-alert-h1');
    b.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      openAlert('general', TITLE, '', '');
    });
    h1.appendChild(b);
  }

  function addFlags(root) {
    root.querySelectorAll('.ds .dh h3').forEach(function (titre) {
      if (titre.querySelector('.ort-alert')) return;
      var b = boutonAlerte('');
      b.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        var sec = titre.closest('.ds');
        var day = sec ? (sec.getAttribute('data-day') || '') : '';
        var nom = (titre.textContent || '').replace('!', '').trim().replace(/\s+/g, ' ').slice(0, 120);
        openAlert('etape', nom, day, '');
      });
      titre.appendChild(b);
    });
  }

  function openAlert(kind, label, day, extra) {
    if (document.getElementById('ortAlOv')) return;
    var ov = el('div'); ov.id = 'ortAlOv';
    var bx = el('div'); bx.id = 'ortAlBox';
    if (RTL) bx.setAttribute('dir', 'rtl');
    bx.innerHTML = '<h4>' + esc(t.alertTitle) + '</h4>'
      + '<p class="al-tg">' + esc(label || TITLE) + (day ? ' \u00b7 J' + esc(day) : '') + '</p>'
      + '<textarea id="alTx" placeholder="' + esc(t.alertPh) + '" maxlength="1200"></textarea>'
      + '<div class="al-row"><button class="ort-send" id="alGo" type="button">' + esc(t.send) + '</button>'
      + '<button class="al-cancel" id="alNo" type="button">' + esc(t.cancel) + '</button>'
      + '<span class="al-msg" id="alMsg"></span></div>';
    ov.appendChild(bx);
    document.body.appendChild(ov);

    ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
    bx.querySelector('#alNo').addEventListener('click', function () { ov.remove(); });

    bx.querySelector('#alGo').addEventListener('click', function () {
      var ta = bx.querySelector('#alTx');
      var msg = bx.querySelector('#alMsg');
      var go = bx.querySelector('#alGo');
      var txt = ta.value.trim();
      if (!txt) { msg.className = 'al-msg ko'; msg.textContent = t.empty; return; }
      go.disabled = true; go.textContent = t.sending;
      fbReady().then(function () {
        var u = currentUser();
        return firebase.firestore().collection('ort_alerts').add({
          itin: ITIN, itinKey: ITIN_KEY, itinTitle: TITLE, lang: LANG,
          kind: kind, label: label || '', day: day || '', extra: extra || '',
          url: location.href, text: txt,
          uid: u ? u.uid : '', email: u ? (u.email || '') : '',
          name: u ? (u.displayName || '') : '',
          done: false, ts: firebase.firestore.FieldValue.serverTimestamp()
        });
      }).then(function () {
        msg.className = 'al-msg'; msg.textContent = t.alertSent;
        setTimeout(function () { ov.remove(); }, 1400);
      }).catch(function (e) {
        console.warn('[ORT-AL] envoi impossible', e);
        msg.className = 'al-msg ko'; msg.textContent = t.err;
        go.disabled = false; go.textContent = t.send;
      });
    });
  }

  function scan() {
    try { addMainFlag(); } catch (e) { }
    try { addFlags(document); } catch (e) { }
  }
  scan();
  setTimeout(scan, 1200);
  setTimeout(scan, 3500);
  var tp = document.getElementById('textPanel') || document.body;
  try {
    new MutationObserver(function () {
      clearTimeout(window.__ortFlagT);
      window.__ortFlagT = setTimeout(scan, 400);
    }).observe(tp, { childList: true, subtree: true });
  } catch (e) { }

  window.ortOpenAlert = openAlert;
})();
