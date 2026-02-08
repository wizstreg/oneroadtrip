/**
 * OneRoadTrip - Service Worker v1.0
 * Cache les pages et ressources pour fonctionnement offline
 */

const CACHE_NAME = 'ort-cache-v1';
const CACHE_VERSION = Date.now();

// Pages principales à cacher
const PAGES = [
  '/',
  '/roadtrip_detail.html',
  '/roadtrip_detail_simple.html',
  '/roadtrip_mobile.html',
  '/dashboard_user.html',
  '/rt-booking-import.html',
  '/rt-bookings.html',
  '/rt-photos.html'
];

// JS locaux essentiels
const LOCAL_JS = [
  '/js/ort-i18n.js',
  '/js/ort-config.js',
  '/js/ort-utils.js',
  '/js/ort-trip-calc.js',
  '/js/ort-data-loader.js',
  '/js/ort-routing.js',
  '/js/ort-tripid.js',
  '/js/ort-trip-data.js',
  '/js/ort-state-manager.js',
  '/js/ort-share.js',
  '/js/ort-modals.js',
  '/js/ort-i18n-auth.js',
  '/js/ort-auth-modal.js',
  '/js/ort-auth-gate.js',
  '/js/ort-hotels.js',
  '/js/ort-partners.js',
  '/js/ort-widgets.js',
  '/js/ort-budget.js',
  '/js/ort-pdf-export-v6.js',
  '/js/ort-route-builder.js',
  '/js/ort-calendar-export.js',
  '/js/ort-footer.js',
  '/js/ort-detail-adapter.js',
  '/js/ort-step-common.js',
  '/bookings-module.js',
  '/ort-map-resize-fix.js',
  '/ort-ratings.js'
];

// CSS
const LOCAL_CSS = [
  '/css/ort-hotels.css'
];

// CDN essentiels
const CDN_RESOURCES = [
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js'
];

// === INSTALL: Pré-cacher toutes les ressources ===
self.addEventListener('install', (event) => {
  console.log('[SW] Install - cache:', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Cacher les ressources locales (ignorer les erreurs pour les fichiers manquants)
      const allResources = [...PAGES, ...LOCAL_JS, ...LOCAL_CSS];
      for (const url of allResources) {
        try {
          await cache.add(url);
        } catch (e) {
          console.warn('[SW] Skip cache (non trouvé):', url);
        }
      }
      // Cacher les CDN
      for (const url of CDN_RESOURCES) {
        try {
          await cache.add(url);
        } catch (e) {
          console.warn('[SW] Skip CDN cache:', url);
        }
      }
      console.log('[SW] ✅ Ressources pré-cachées');
    })
  );
  // Activer immédiatement
  self.skipWaiting();
});

// === ACTIVATE: Nettoyer les anciens caches ===
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate');
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.filter(n => n !== CACHE_NAME).map(n => {
          console.log('[SW] 🗑️ Suppression ancien cache:', n);
          return caches.delete(n);
        })
      );
    })
  );
  // Prendre le contrôle immédiatement
  self.clients.claim();
});

// === FETCH: Network-first, fallback cache ===
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Ignorer les requêtes non-GET
  if (event.request.method !== 'GET') return;
  
  // Ignorer Firestore/Firebase API (géré par IndexedDB persistence)
  if (url.hostname.includes('firestore.googleapis.com') ||
      url.hostname.includes('identitytoolkit.googleapis.com') ||
      url.hostname.includes('securetoken.googleapis.com') ||
      url.hostname.includes('googletagmanager.com') ||
      url.hostname.includes('google-analytics.com')) {
    return;
  }
  
  // Ignorer les requêtes de données JSON pays (dynamiques)
  if (url.pathname.includes('/data/') && url.pathname.endsWith('.json')) {
    event.respondWith(networkFirstWithCache(event.request));
    return;
  }

  // Pour les images: cache-first (elles changent rarement)
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/)) {
    event.respondWith(cacheFirstWithNetwork(event.request));
    return;
  }

  // Pour tout le reste: network-first, fallback cache
  event.respondWith(networkFirstWithCache(event.request));
});

// === STRATEGIES ===

// Network first: essaie le réseau, sinon cache
async function networkFirstWithCache(request) {
  try {
    const response = await fetch(request);
    // Mettre en cache si réponse OK
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    // Pas de réseau → chercher dans le cache
    const cached = await caches.match(request);
    if (cached) {
      console.log('[SW] 📦 Depuis cache (offline):', request.url);
      return cached;
    }
    
    // Si c'est une page HTML, renvoyer la page offline
    if (request.headers.get('accept')?.includes('text/html')) {
      return caches.match('/roadtrip_mobile.html') || 
             caches.match('/roadtrip_detail.html') ||
             new Response('<html><body><h1>Mode hors-ligne</h1><p>Cette page n\'est pas encore en cache. Connectez-vous une première fois pour activer le mode offline.</p></body></html>', {
               headers: { 'Content-Type': 'text/html' }
             });
    }
    
    return new Response('Offline', { status: 503 });
  }
}

// Cache first: essaie le cache, sinon réseau
async function cacheFirstWithNetwork(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    return new Response('', { status: 503 });
  }
}
