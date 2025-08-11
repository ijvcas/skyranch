const CACHE_VERSION = 'v2';
const CACHE_NAME = `skyranch-${CACHE_VERSION}`;
const ASSET_CACHE = `skyranch-assets-${CACHE_VERSION}`;

const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/lovable-uploads/953e2699-9daf-4fea-86c8-e505a1e54eb3.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (!key.includes(CACHE_VERSION)) {
            return caches.delete(key);
          }
        })
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle GET
  if (req.method !== 'GET') return;

  // SPA navigation fallback to index.html when offline
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Cache static assets (Vite outputs under /assets/) with stale-while-revalidate
  if (url.origin === self.location.origin && url.pathname.startsWith('/assets/')) {
    event.respondWith(staleWhileRevalidate(req, ASSET_CACHE));
    return;
  }

  // Default: try cache first then network, and cache successful responses
  event.respondWith(cacheFirst(req, CACHE_NAME));
});

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkFetch = fetch(request).then((response) => {
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached);

  return cached || networkFetch;
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.status === 200 && request.url.startsWith(self.location.origin)) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    return cached || Promise.reject(e);
  }
}

// Background sync for offline data (placeholder)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil((async () => {
      // Implement your sync logic here
      console.log('Syncing data...');
    })());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación de SkyRanch',
    icon: '/lovable-uploads/953e2699-9daf-4fea-86c8-e505a1e54eb3.png',
    badge: '/lovable-uploads/953e2699-9daf-4fea-86c8-e505a1e54eb3.png',
    vibrate: [100, 50, 100],
    data: { dateOfArrival: Date.now(), primaryKey: 1 },
  };

  event.waitUntil(self.registration.showNotification('SkyRanch', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});