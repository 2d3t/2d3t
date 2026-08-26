const CACHE_NAME = 'prox-pwa-v2';
const FILES_TO_CACHE = [
    '/2d3t/Prox/index.html',
    '/2d3t/Prox/manifest.json',
    // Добавляем все иконки в кэш
    '/2d3t/Prox/icon-72.png',
    '/2d3t/Prox/icon-96.png',
    '/2d3t/Prox/icon-128.png',
    '/2d3t/Prox/icon-144.png',
    '/2d3t/Prox/icon-152.png',
    '/2d3t/Prox/icon-192.png',
    '/2d3t/Prox/icon-384.png',
    '/2d3t/Prox/icon-512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Кэшируем ProX с иконками...');
                return cache.addAll(FILES_TO_CACHE);
            })
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
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    // Фоновое обновление кэша
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
                        // Fallback на главную страницу при офлайне
                        return caches.match('/2d3t/Prox/index.html');
                    });
            })
    );
});