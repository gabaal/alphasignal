const CACHE_NAME = 'alphasignal-v1.76';

// Core shell files to cache for offline use
const SHELL_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/styles.css',
  '/icon-192.png',
  '/icon-512.png',
  '/assets/pwa-icon-192.png',
  '/assets/pwa-icon-512.png',
  '/js/utils.js?v=1.57',
  '/js/auth.js?v=1.57',
  '/js/core.js?v=1.57',
  '/js/main.js?v=1.57',
  '/js/router.js?v=1.57',
  '/js/charts.js?v=1.57'
];

// Install: cache the app shell
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_FILES))
  );
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first for API calls, cache-first for shell
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Always go network-first for API calls and WebSocket upgrades
  if (url.pathname.startsWith('/api/') || event.request.url.startsWith('ws')) {
    return; // Let the browser handle it normally
  }

  // For navigation requests (HTML), network first with offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match('/index.html')
      )
    );
    return;
  }

  // Cache first for static assets (JS, CSS, images)
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cache successful responses for static assets
        if (response.ok && (
          url.pathname.endsWith('.js') ||
          url.pathname.endsWith('.css') ||
          url.pathname.endsWith('.png') ||
          url.pathname.endsWith('.ico')
        )) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
