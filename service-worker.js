const CACHE_NAME = 'alphasignal-cache-v42';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/styles.css',
    '/manifest.json',
    '/tape.js',
    '/assets/pwa-icon-192.png',
    '/assets/pwa-icon-512.png',
    '/js/core.js',
    '/js/views.js',
    '/js/main.js',
    '/js/charts.js',
    '/js/heatmap_engine.js'
];

// Network-first for API calls, cache-first for static assets
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // API calls — always network, no caching
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(event.request).catch(() =>
                new Response(JSON.stringify({ error: 'Offline', offline: true }), {
                    headers: { 'Content-Type': 'application/json' }
                })
            )
        );
        return;
    }

    // Static assets — cache-first, fallback to network
    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) return cached;
            return fetch(event.request).then((response) => {
                if (response && response.status === 200 && response.type === 'basic') {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
                }
                return response;
            });
        }).catch(() => caches.match('/index.html'))
    );
});

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
});

self.addEventListener('activate', (event) => {
    self.clients.claim();
    event.waitUntil(
        caches.keys().then((cacheNames) =>
            Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME) return caches.delete(name);
                })
            )
        )
    );
});
