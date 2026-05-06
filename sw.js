// Service Worker for PWA offline support
const CACHE_NAME = 'tachanun-checker-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/data/omissions.js',
  '/manifest.json'
];

// Install event: cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('Cache addAll error (some assets may not be available offline):', err);
        // Continue even if some assets fail to cache
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event: serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Serve from cache if available
      if (response) {
        return response;
      }

      // Otherwise fetch from network
      return fetch(event.request)
        .then((networkResponse) => {
          // Optionally cache successful network responses
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline fallback: return a simple offline message for HTML requests
          if (event.request.headers.get('accept').includes('text/html')) {
            return new Response(
              '<html><body style="font-family: sans-serif; padding: 2rem;"><h1>Offline</h1><p>The app is currently offline. Some features may not work.</p></body></html>',
              { headers: { 'Content-Type': 'text/html' } }
            );
          }
          return null;
        });
    })
  );
});
