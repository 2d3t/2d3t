const CACHE_NAME = 'mirrorx-v1';
const FILES_TO_CACHE = [
    '/2d3t/pro/MirrorX/index.html',
    '/2d3t/pro/MirrorX/manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Кэшируем файлы MirrorX');
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
    // Пропускаем запросы к камере и API
    if (event.request.url.includes('/api/') || 
        event.request.url.includes('mediadevices')) {
        return fetch(event.request);
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request).catch(() => {
                    // Возвращаем кэшированную страницу как fallback
                    return caches.match('/2d3t/pro/MirrorX/index.html');
                });
            })
    );
});