
        const CACHE_NAME = 'pwa-cache-v1';
        const FILES_TO_CACHE = [
            '/2d3t/pro/PWA-Studio/index.html',
            '/2d3t/pro/PWA-Studio/manifest.json',
            '/2d3t/pro/PWA-Studio/icon-192.png'
        ];

        self.addEventListener('install', (event) => {
            event.waitUntil(
                caches.open(CACHE_NAME)
                    .then(cache => {
                        console.log('[SW] Кэшируем файлы...');
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
                                return caches.match('/2d3t/pro/PWA-Studio/index.html');
                            });
                    })
            );
        });
        