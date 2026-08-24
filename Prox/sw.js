self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                // Если файл есть в кэше — отдаем его immediately
                if (cachedResponse) return cachedResponse;
                
                // Если файла нет, качаем из сети
                return fetch(event.request)
                    .then(response => {
                        // Если скачалось успешно, сохраняем копию в кэш на будущее
                        if (response && response.status === 200) {
                            const clone = response.clone();
                            caches.open(CACHE_NAME).then(cache => {
                                cache.put(event.request, clone);
                            });
                        }
                        return response;
                    })
                    // Если интернета нет вообще, отдаем хотя бы главную страницу
                    .catch(() => caches.match('/2d3t/Prox/index.html'));
            })
    );
});
