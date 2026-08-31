// sw.js - Универсальный кеш для всех страниц
const CACHE_NAME = 'osplus-pwa-v2';

const FILES_TO_CACHE = [
    '/2d3t/pro/Pro7/index.html',
    '/2d3t/pro/Pro7/manifest.json',
    '/2d3t/pro/Pro7/icon-192.png',
    '/2d3t/pro/Pro7/icon-512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Кэшируем базовые файлы...');
                return cache.addAll(FILES_TO_CACHE).catch(err => {
                    console.warn('[SW] Некоторые файлы не закешированы:', err);
                });
            })
            .then(() => {
                console.log('[SW] ✅ Установка завершена');
                return self.skipWaiting();
            })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(name => {
                    if (name !== CACHE_NAME) {
                        console.log('[SW] 🗑️ Удаляем старый кэш:', name);
                        return caches.delete(name);
                    }
                })
            );
        }).then(() => {
            console.log('[SW] ✅ Активация завершена');
            return self.clients.claim();
        })
    );
});

// ============================================================
// УНИВЕРСАЛЬНЫЙ FETCH - КЕШИРУЕТ ВСЁ!
// ============================================================
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    if (url.pathname.includes('/api/') || url.pathname.includes('/analytics/')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    console.log('[SW] 📦 Из кеша:', url.pathname);
                    
                    if (navigator.onLine) {
                        fetch(event.request)
                            .then(response => {
                                if (response && response.status === 200) {
                                    const clone = response.clone();
                                    caches.open(CACHE_NAME).then(cache => {
                                        cache.put(event.request, clone);
                                        console.log('[SW] 🔄 Обновлен кеш:', url.pathname);
                                    });
                                }
                            })
                            .catch(() => {});
                    }
                    
                    return cachedResponse;
                }
                
                return fetch(event.request)
                    .then(response => {
                        if (response && response.status === 200) {
                            const clone = response.clone();
                            caches.open(CACHE_NAME).then(cache => {
                                cache.put(event.request, clone);
                                console.log('[SW] 💾 Добавлен в кеш:', url.pathname);
                            });
                        }
                        return response;
                    })
                    .catch(() => {
                        console.log('[SW] ⚠️ Офлайн режим для:', url.pathname);
                        return caches.match('/2d3t/pro/Pro7/index.html')
                            .then(fallback => {
                                if (fallback) return fallback;
                                return new Response('Страница недоступна офлайн', {
                                    status: 503,
                                    statusText: 'Service Unavailable'
                                });
                            });
                    });
            })
    );
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

console.log('[SW] ✅ Service Worker загружен');