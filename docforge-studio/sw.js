// DocForge Studio — Service Worker (Safe Scheme Handling)

const CACHE_NAME = 'docforge-studio-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Filter out unsupported schemes (e.g. chrome-extension://, moz-extension://)
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return;
  }

  // Handle network request cleanly with fallback
  event.respondWith(
    fetch(event.request).catch(async () => {
      const cache = await caches.open(CACHE_NAME);
      return cache.match(event.request);
    })
  );
});
