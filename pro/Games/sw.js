// sw.js - Упрощенная версия для AutoCache
const CACHE_NAME = 'auto-cache-v1';

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll([
                    '/',
                    '/index.html',
                    '/manifest.json',
                    '/icon-192.png',
                    '/icon-512.png',
                    '/offline.html'
                ]);
            })
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        })
        .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    if (event.request.url.includes('/api/')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    if (navigator.onLine) {
                        fetch(event.request)
                            .then(freshResponse => {
                                if (freshResponse.ok) {
                                    caches.open(CACHE_NAME)
                                        .then(cache => cache.put(event.request, freshResponse));
                                }
                            })
                            .catch(() => {});
                    }
                    return response;
                }

                return fetch(event.request)
                    .then(response => {
                        if (response.ok) {
                            const clone = response.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => cache.put(event.request, clone));
                        }
                        return response;
                    })
                    .catch(() => {
                        return caches.match('/offline.html')
                            .then(offline => offline || new Response('Офлайн режим', {
                                status: 503,
                                statusText: 'Service Unavailable'
                            }));
                    });
            })
    );
});