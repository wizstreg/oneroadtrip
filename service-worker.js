// =====================================================================
// OneRoadTrip - fichier UNIQUE du hors ligne (remplace l'ancien sw.js)
//
// Ce qu'il garde sur l'appareil du visiteur :
//   1. les pages et fichiers du site deja ouverts ;
//   2. le "kit voyage" : page mobile, editeur, tableau de bord et tout ce
//      qu'ils chargent. Il n'est telecharge que pour les visiteurs qui
//      ouvrent une de ces pages, pas pour les simples lecteurs ;
//   3. les outils venus d'autres sites : carte, connexion au compte, polices ;
//   4. le fond de carte et les photos deja regardes, avec un plafond.
//
// En ligne, le visiteur recoit toujours la version la plus recente du site.
// La copie gardee ne sert que si le reseau ne repond pas.
//
// Pour forcer tout le monde a repartir de zero : changer VERSION.
// =====================================================================
const VERSION = 'v4';

const C_SITE  = 'ort-site-' + VERSION; // pages et fichiers du site
const C_LIBS  = 'ort-libs-v1';         // carte, connexion, polices
const C_TILES = 'ort-tiles-v1';        // fond de carte deja regarde
const C_IMG   = 'ort-img-v1';          // photos deja vues
const KEEP = [C_SITE, C_LIBS, C_TILES, C_IMG];

const MAX_TILES = 1500;   // plafond du fond de carte
const MAX_IMG   = 300;    // plafond des photos
const NAV_TIMEOUT_MS = 5000; // reseau trop lent : on sert la copie gardee

// Garde au premier passage, pour tout le monde (leger)
const ESSENTIAL = ['/index.html', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png'];

// Kit voyage : ces pages + tous les fichiers qu'elles appellent
const KIT_PAGES = ['/roadtrip_mobile.html', '/roadtrip_detail.html', '/dashboard_user.html'];
const KIT_EXTRA = [
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js'
];
// Liste legere des photos (6 Mo) : sans elle, la page ne sait pas quelle photo
// montrer hors ligne. Fabriquee a la mise en ligne par build-photos-light.js.
const KIT_SITE_FILES = ['/data/photos-json/photos_lieux.light.json'];
const KIT_MARK = '/__ort_kit__';
const KIT_MAX_AGE_MS = 24 * 3600 * 1000; // on revoit le kit une fois par jour au plus
const TRIP_PAGE_RE = /\/(roadtrip_mobile|roadtrip_detail|dashboard_user|custom)(\.html)?$/;

// Fichiers du site trop lourds pour etre gardes sur un telephone.
// La liste complete des photos pese 31 Mo : seule sa version legere est gardee.
const NO_KEEP = [/^\/data\/photos-json\/photos_lieux\.json$/];
const MAX_KEEP_BYTES = 10 * 1024 * 1024;

const LIB_HOSTS = ['cdnjs.cloudflare.com', 'cdn.jsdelivr.net', 'unpkg.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];
const IMG_HOSTS = ['wsrv.nl', 'flagcdn.com', 'photos.oneroadtrip.com'];

// ---------------------------------------------------------------------
// Tri des adresses
// ---------------------------------------------------------------------
function isLib(url) {
  if (LIB_HOSTS.indexOf(url.hostname) !== -1) return true;
  return url.hostname === 'www.gstatic.com' && url.pathname.indexOf('/firebasejs/') === 0;
}
function isTileHost(url) {
  return url.hostname === 'tiles.openfreemap.org' ||
         url.hostname === 'tile.openstreetmap.org' ||
         /\.tile\.openstreetmap\.org$/.test(url.hostname);
}
function isTileFile(url) { return /\.(pbf|png|jpe?g|webp)$/i.test(url.pathname); }
function isImg(url) { return IMG_HOSTS.indexOf(url.hostname) !== -1; }

// Une page du site est gardee sous son adresse SANS ce qui suit le "?".
// roadtrip_mobile.html?tripId=A et ?tripId=B sont la meme page : une seule copie.
function siteKey(url) { return url.origin + url.pathname; }

// ---------------------------------------------------------------------
// Outils
// ---------------------------------------------------------------------
// Une reponse issue d'une redirection ne peut pas etre resservie telle quelle
// pour une page : on la recopie proprement.
async function clean(resp) {
  if (!resp || !resp.redirected) return resp;
  const body = await resp.blob();
  return new Response(body, { status: resp.status, statusText: resp.statusText, headers: resp.headers });
}

async function putSite(key, resp) {
  if (!resp || resp.status !== 200 || resp.type !== 'basic') return;
  try {
    const path = new URL(key).pathname;
    if (NO_KEEP.some((re) => re.test(path))) return;
    const size = Number(resp.headers.get('content-length')) || 0;
    if (size > MAX_KEEP_BYTES) return;
    const cache = await caches.open(C_SITE);
    await cache.put(key, await clean(resp));
  } catch (e) { /* espace plein ou autre : sans gravite */ }
}

// Demande un fichier a un autre site en mode "partageable".
// Sans cela, le navigateur compte chaque fichier garde pour plusieurs Mo.
function corsFetch(url) { return fetch(url, { mode: 'cors', credentials: 'omit' }); }

async function trim(cacheName, max) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    const extra = keys.length - max;
    for (let i = 0; i < extra; i++) await cache.delete(keys[i]); // les plus anciens d'abord
  } catch (e) {}
}

// Copie gardee d'abord, reseau sinon (fichiers qui ne changent pas)
async function cacheFirst(event, cacheName, max) {
  const request = event.request;
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request.url);
  if (hit) return hit;
  let resp;
  try {
    resp = await corsFetch(request.url);
  } catch (e) {
    // Le site d'en face refuse le mode partageable ou le reseau manque :
    // on laisse passer la demande d'origine, sans rien garder.
    return fetch(request);
  }
  if (resp && resp.status === 200) {
    event.waitUntil((async () => {
      try { await cache.put(request.url, resp.clone()); } catch (e) {}
      if (max && Math.random() < 0.05) await trim(cacheName, max);
    })());
  }
  return resp;
}

// Reseau d'abord, copie gardee sinon (fichiers d'un autre site qui peuvent changer)
async function networkFirstCross(event, cacheName) {
  const request = event.request;
  const cache = await caches.open(cacheName);
  try {
    const resp = await corsFetch(request.url);
    if (resp && resp.status === 200) event.waitUntil(cache.put(request.url, resp.clone()).catch(() => {}));
    return resp;
  } catch (e) {
    const hit = await cache.match(request.url);
    if (hit) return hit;
    return fetch(request);
  }
}

async function findSite(url) {
  const cache = await caches.open(C_SITE);
  const p = url.pathname;
  const tries = [p];
  if (/\/$/.test(p)) tries.push(p + 'index.html');
  else if (/\.html$/.test(p)) tries.push(p.replace(/\.html$/, ''));
  else if (!/\.[a-z0-9]+$/i.test(p)) tries.push(p + '.html');
  for (let i = 0; i < tries.length; i++) {
    const hit = await cache.match(url.origin + tries[i]);
    if (hit) return hit;
  }
  return null;
}

function offlinePage() {
  const html = '<!doctype html><html lang="fr"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1"><title>OneRoadTrip</title></head>' +
    '<body style="font-family:system-ui,sans-serif;background:#113f7a;color:#fff;margin:0;padding:40px 24px;text-align:center">' +
    '<h1 style="font-size:22px">Pas de connexion</h1>' +
    '<p>Cette page n\'a pas encore été ouverte sur cet appareil. Ouvrez-la une fois avec du réseau pour la retrouver ensuite hors ligne.</p>' +
    '<hr style="border:0;border-top:1px solid rgba(255,255,255,.3);margin:24px auto;max-width:200px">' +
    '<h1 style="font-size:22px">No connection</h1>' +
    '<p>This page has not been opened on this device yet. Open it once while online to find it offline later.</p>' +
    '<p style="margin-top:28px"><a href="/dashboard_user.html" style="color:#fff">Vos voyages / Your trips</a></p>' +
    '</body></html>';
  return new Response(html, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

// Fichiers du site : reseau d'abord, copie gardee sinon
async function siteRequest(event, url) {
  const request = event.request;
  const isNav = request.mode === 'navigate';
  const key = siteKey(url);

  const network = fetch(request).then((resp) => {
    if (resp && resp.status === 200) event.waitUntil(putSite(key, resp.clone()));
    return resp;
  });

  if (!isNav) {
    try { return await network; }
    catch (e) {
      const hit = await findSite(url);
      if (hit) return hit;
      throw e;
    }
  }

  // Page : si le reseau traine et qu'une copie existe, on sert la copie.
  const cached = await findSite(url);
  if (!cached) {
    try { return await network; } catch (e) { return offlinePage(); }
  }
  network.catch(() => {}); // evite une erreur non rattrapee si la copie gagne
  let timer;
  const slow = new Promise((resolve) => { timer = setTimeout(() => resolve('slow'), NAV_TIMEOUT_MS); });
  try {
    const first = await Promise.race([network, slow]);
    clearTimeout(timer);
    if (first === 'slow') return cached;
    return (first && first.status === 200) ? first : cached;
  } catch (e) {
    clearTimeout(timer);
    return cached;
  }
}

// ---------------------------------------------------------------------
// Kit voyage
// ---------------------------------------------------------------------
function extractAssets(html, pageUrl) {
  const out = [];
  const re = /<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']|<link\b[^>]*\brel\s*=\s*["']stylesheet["'][^>]*\bhref\s*=\s*["']([^"']+)["']|<link\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*\brel\s*=\s*["']stylesheet["']/gi;
  let m;
  while ((m = re.exec(html))) {
    const raw = m[1] || m[2] || m[3];
    if (!raw || /^data:/i.test(raw)) continue;
    try { out.push(new URL(raw, pageUrl)); } catch (e) {}
  }
  return out;
}

async function keepOne(url) {
  try {
    if (url.origin === self.location.origin) {
      if (url.pathname.indexOf('/.netlify/') === 0) return;
      const resp = await fetch(siteKey(url), { cache: 'no-cache' });
      await putSite(siteKey(url), resp);
    } else if (isLib(url)) {
      const cache = await caches.open(C_LIBS);
      if (await cache.match(url.href)) return;
      const resp = await corsFetch(url.href);
      if (resp && resp.status === 200) await cache.put(url.href, resp);
    }
  } catch (e) { /* un fichier manquant ne bloque pas le reste */ }
}

let kitRunning = null;
function ensureKit() {
  if (kitRunning) return kitRunning;
  kitRunning = (async () => {
    const site = await caches.open(C_SITE);
    const mark = await site.match(KIT_MARK);
    if (mark) {
      const when = Number(await mark.text()) || 0;
      if (Date.now() - when < KIT_MAX_AGE_MS) return;
    }
    let ok = 0;
    for (let i = 0; i < KIT_PAGES.length; i++) {
      const pageUrl = new URL(KIT_PAGES[i], self.location.origin);
      try {
        const resp = await fetch(pageUrl.href, { cache: 'no-cache' });
        if (!resp || resp.status !== 200) continue;
        const html = await resp.clone().text();
        await putSite(siteKey(pageUrl), resp);
        ok++;
        const assets = extractAssets(html, pageUrl.href);
        for (let j = 0; j < assets.length; j++) await keepOne(assets[j]);
      } catch (e) {}
    }
    for (let k = 0; k < KIT_EXTRA.length; k++) await keepOne(new URL(KIT_EXTRA[k]));
    for (let f = 0; f < KIT_SITE_FILES.length; f++) await keepOne(new URL(KIT_SITE_FILES[f], self.location.origin));
    // On ne note le kit comme fait que si les pages ont bien ete recues.
    if (ok === KIT_PAGES.length) await site.put(KIT_MARK, new Response(String(Date.now())));
  })().catch(() => {}).then(() => { kitRunning = null; });
  return kitRunning;
}

// ---------------------------------------------------------------------
// Vie du fichier
// ---------------------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(C_SITE);
    for (let i = 0; i < ESSENTIAL.length; i++) {
      try {
        const resp = await fetch(ESSENTIAL[i], { cache: 'no-cache' });
        if (resp && resp.status === 200) await cache.put(self.location.origin + ESSENTIAL[i], await clean(resp));
      } catch (e) {}
    }
  })());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Menage : on supprime les anciennes reserves (ort-v1, ort-cache-v1...)
    const names = await caches.keys();
    await Promise.all(names.filter((n) => KEEP.indexOf(n) === -1).map((n) => caches.delete(n)));
    await self.clients.claim();
    // Si une page voyage est deja ouverte, on prepare le kit tout de suite.
    const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const onTrip = list.some((c) => { try { return TRIP_PAGE_RE.test(new URL(c.url).pathname); } catch (e) { return false; } });
    if (onTrip) ensureKit();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data === 'ORT_KIT') event.waitUntil(ensureKit());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  if (request.headers.has('range')) return;
  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') return;

  let url;
  try { url = new URL(request.url); } catch (e) { return; }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // --- Le site lui-meme ---
  if (url.origin === self.location.origin) {
    if (url.pathname.indexOf('/.netlify/') === 0) return; // recherches et services : jamais gardes
    if (request.mode === 'navigate' && TRIP_PAGE_RE.test(url.pathname)) event.waitUntil(ensureKit());
    event.respondWith(siteRequest(event, url));
    return;
  }

  // --- Autres sites ---
  if (isLib(url)) { event.respondWith(cacheFirst(event, C_LIBS, 0)); return; }
  if (isTileHost(url)) {
    if (isTileFile(url)) event.respondWith(cacheFirst(event, C_TILES, MAX_TILES));
    else event.respondWith(networkFirstCross(event, C_TILES)); // habillage de la carte : peut changer
    return;
  }
  if (isImg(url)) { event.respondWith(cacheFirst(event, C_IMG, MAX_IMG)); return; }

  // Tout le reste (compte, statistiques, partenaires, itineraire routier) : on ne touche pas.
});
