const CACHE_NAME = 'alphasignal-v1.80-pwa';

// Core shell files to pre-cache
const SHELL_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/styles.css',
  '/icon-192.png',
  '/icon-512.png',
  '/assets/pwa-icon-192.png',
  '/assets/pwa-icon-512.png',
  '/js/utils.js',
  '/js/auth.js',
  '/js/core.js',
  '/js/main.js',
  '/js/router.js',
  '/js/charts.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_FILES))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Network-first for API calls and WebSockets
  if (url.pathname.startsWith('/api/') || event.request.url.startsWith('ws')) {
    return;
  }

  // Navigation requests: Network-first, fallback to index.html from cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match('/index.html')
      )
    );
    return;
  }

  // Stale-While-Revalidate for JS/CSS/Images
  if (
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.ico')
  ) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          if (networkResponse.ok && event.request.url.startsWith('http')) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, clone);
            });
          }
          return networkResponse;
        }).catch(() => {
          // Ignore network errors for background revalidation
        });
        
        // Return cached immediately if available, else wait for network
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Cache-first fallback for anything else
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request);
    })
  );
});
