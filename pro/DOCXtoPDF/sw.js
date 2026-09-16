// sw.js - версия кэша обновлена, manifest и index не кэшируются
const CACHE_NAME = 'docxtopdf-pwa-v2'; // ← поднимайте при каждом релизе

const FILES_TO_CACHE = [
    '/2d3t/pro/DOCXtoPDF/icon-192.png',
    '/2d3t/pro/DOCXtoPDF/icon-512.png'
];

// Запросы, которые ВСЕГДА идут в сеть (без кэша)
const NETWORK_ONLY = [
    '/2d3t/pro/DOCXtoPDF/manifest.json',
    '/2d3t/pro/DOCXtoPDF/index.html'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(FILES_TO_CACHE))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(name => {
                    if (name !== CACHE_NAME) {
                        console.log('[SW] Удаляем старый кэш:', name);
                        return caches.delete(name);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Manifest и index всегда берём из сети
    if (NETWORK_ONLY.some(path => url.pathname.endsWith(path))) {
        event.respondWith(
            fetch(event.request).catch(() => caches.match(event.request))
        );
        return;
    }

    // Остальное — cache-first с фоновым обновлением
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    fetch(event.request)
                        .then(response => {
                            if (response && response.status === 200) {
                                const clone = response.clone();
                                caches.open(CACHE_NAME).then(cache => {
                                    cache.put(event.request, clone);
                                });
                            }
                        })
                        .catch(() => {});
                    return cachedResponse;
                }

                return fetch(event.request)
                    .then(response => {
                        if (response && response.status === 200) {
                            const clone = response.clone();
                            caches.open(CACHE_NAME).then(cache => {
                                cache.put(event.request, clone);
                            });
                        }
                        return response;
                    })
                    .catch(() => {
                        return caches.match('/2d3t/pro/DOCXtoPDF/index.html');
                    });
            })
    );
});