const CACHE_NAME = 'coffee-app-v1.0.5';
// Keep the pre-cache minimal to avoid serving stale shells
const urlsToCache = [
  '/index.html',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  const req = event.request;

  // Network-first for navigation requests (prevents stale HTML shell)
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(
      fetch(req)
        .then(networkRes => {
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('/index.html', resClone)).catch(() => {});
          return networkRes;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Cache-first for other assets with network fallback
  event.respondWith(
    caches.match(req).then(cacheRes => {
      return cacheRes || fetch(req).then(networkRes => {
        const resClone = networkRes.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, resClone)).catch(() => {});
        return networkRes;
      }).catch(() => cacheRes);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => Promise.all(
      cacheNames.map(cacheName => cacheName !== CACHE_NAME && caches.delete(cacheName))
    ))
  );
  self.clients.claim();
});

// Background sync for offline data
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Sync any offline data when connection is restored
  return Promise.resolve();
}
