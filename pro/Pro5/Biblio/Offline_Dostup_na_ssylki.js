<script>
// ============================================================
// АВТОМАТИЧЕСКОЕ КЕШИРОВАНИЕ + ПРЕДЗАГРУЗКА ИГР
// ============================================================
(function() {
    "use strict";

    console.log('[APP] 🔄 Запуск AutoCache...');

    // ============================================================
    // 1. РЕГИСТРАЦИЯ SERVICE WORKER
    // ============================================================
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration()
            .then(registration => {
                if (registration) {
                    console.log('[APP] ✅ SW уже зарегистрирован');
                    return registration;
                }
                return navigator.serviceWorker.register('/2d3t/pro/Games/sw.js', {
                    scope: '/2d3t/pro/Games/'
                });
            })
            .then(reg => {
                console.log('[APP] ✅ SW зарегистрирован:', reg);
            })
            .catch(err => {
                console.warn('[APP] ❌ Ошибка регистрации SW:', err);
            });
    }

    // ============================================================
    // 2. СПИСОК ИГР ДЛЯ ПРЕДЗАГРУЗКИ
    // ============================================================
    const GAMES_TO_PRECACHE = [
        'https://2d3t.github.io/2d3t/pro/Games/SuperPaint/index.html',
        'https://2d3t.github.io/2d3t/pro/Games/PaintPro/index.html'
        // Добавьте сюда другие игры, если есть
    ];

    const CACHE_NAME = 'games-pwa-v2';

    // ============================================================
    // 3. ФУНКЦИЯ КЕШИРОВАНИЯ С ОЖИДАНИЕМ
    // ============================================================
    async function cacheUrl(url, retries = 3) {
        if (!('caches' in window)) return false;
        
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                console.log(`[APP] 📥 Попытка ${attempt}/${retries}: ${url}`);
                
                const response = await fetch(url, {
                    mode: 'cors',
                    headers: { 'Cache-Control': 'no-cache' }
                });
                
                if (response && response.ok) {
                    const cache = await caches.open(CACHE_NAME);
                    await cache.put(url, response);
                    console.log(`[APP] ✅ Закешировано: ${url}`);
                    return true;
                }
            } catch (error) {
                console.warn(`[APP] ⚠️ Ошибка (${attempt}/${retries}):`, error.message);
                if (attempt < retries) {
                    await new Promise(r => setTimeout(r, 2000 * attempt));
                }
            }
        }
        return false;
    }

    // ============================================================
    // 4. ПРЕДЗАГРУЗКА ВСЕХ ИГР
    // ============================================================
    async function precacheAllGames() {
        console.log('[APP] 🚀 Начинаем предзагрузку игр...');
        
        if (!navigator.onLine) {
            console.warn('[APP] ⚠️ Нет интернета, предзагрузка невозможна');
            return;
        }

        let successCount = 0;
        for (const gameUrl of GAMES_TO_PRECACHE) {
            if (await cacheUrl(gameUrl, 3)) {
                successCount++;
            }
            await new Promise(r => setTimeout(r, 1000));
        }
        
        console.log(`[APP] ✅ Предзагружено ${successCount}/${GAMES_TO_PRECACHE.length} игр`);
        
        if (successCount === GAMES_TO_PRECACHE.length) {
            console.log('[APP] 🎉 Все игры готовы к офлайн-работе!');
        } else {
            console.warn('[APP] ⚠️ Некоторые игры не загрузились, попробуйте обновить страницу');
        }
    }

    // ============================================================
    // 5. ФУНКЦИЯ УВЕДОМЛЕНИЙ УДАЛЕНА - только логи в консоль
    // ============================================================

    // ============================================================
    // 6. АВТОМАТИЧЕСКОЕ КЕШИРОВАНИЕ ВСЕХ ССЫЛОК
    // ============================================================
    async function cacheAllLinks() {
        if (!('caches' in window)) return;
        
        const links = document.querySelectorAll('a[href]');
        const urls = new Set();
        
        links.forEach(link => {
            const href = link.href;
            if (href && href.startsWith(window.location.origin)) {
                if (!href.includes('#') && 
                    !href.includes('mailto:') && 
                    !href.includes('tel:') &&
                    !href.includes('javascript:')) {
                    urls.add(href);
                }
            }
        });

        let count = 0;
        for (const url of urls) {
            if (await cacheUrl(url, 2)) {
                count++;
                await new Promise(r => setTimeout(r, 200));
            }
        }
        
        if (count > 0) {
            console.log(`[APP] ✅ Закешировано ${count} страниц со ссылок`);
        }
    }

    // ============================================================
    // 7. ЗАПУСК - ПРИОРИТЕТ: СНАЧАЛА ИГРЫ, ПОТОМ ВСЁ ОСТАЛЬНОЕ
    // ============================================================
    
    window.addEventListener('load', () => {
        console.log('[APP] 📄 Страница загружена');
        
        setTimeout(precacheAllGames, 1000);
        
        setTimeout(() => {
            cacheUrl(window.location.href, 2);
        }, 3000);
        
        setTimeout(cacheAllLinks, 5000);
    });

    // ============================================================
    // 8. МОНИТОРИНГ НОВЫХ ССЫЛОК
    // ============================================================
    if (window.MutationObserver) {
        let observerTimeout;
        const observer = new MutationObserver(() => {
            clearTimeout(observerTimeout);
            observerTimeout = setTimeout(() => {
                console.log('[APP] 🔄 Обнаружены изменения, проверяем новые ссылки...');
                cacheAllLinks();
            }, 2000);
        });
        
        setTimeout(() => {
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }, 5000);
    }

    // ============================================================
    // 9. ПРЕДЗАГРУЗКА ПРИ НАВЕДЕНИИ
    // ============================================================
    let hoverTimeout;
    document.addEventListener('mouseover', (event) => {
        const link = event.target.closest('a[href]');
        if (link && link.href && link.href.startsWith(window.location.origin)) {
            if (!link.href.includes('#') && 
                !link.href.includes('mailto:') && 
                !link.href.includes('tel:')) {
                clearTimeout(hoverTimeout);
                hoverTimeout = setTimeout(() => {
                    cacheUrl(link.href, 2);
                }, 500);
            }
        }
    });

    // ============================================================
    // 10. ДОСТУП В КОНСОЛИ
    // ============================================================
    window.precacheAllGames = precacheAllGames;
    window.cacheAll = cacheAllLinks;
    window.cacheUrl = cacheUrl;
    window.cacheStatus = async function() {
        const cache = await caches.open(CACHE_NAME);
        const keys = await cache.keys();
        console.log(`📦 В кеше ${keys.length} файлов:`);
        keys.forEach(req => console.log(`  - ${req.url}`));
        
        const gameUrls = GAMES_TO_PRECACHE;
        let found = 0;
        for (const url of gameUrls) {
            const response = await cache.match(url);
            if (response) {
                console.log(`  ✅ Игра в кеше: ${url}`);
                found++;
            } else {
                console.log(`  ❌ Игра НЕ в кеше: ${url}`);
            }
        }
        console.log(`📊 Игр в кеше: ${found}/${gameUrls.length}`);
    };

    console.log('[APP] ✅ AutoCache инициализирован');
    console.log('[APP] 💡 Доступные команды:');
    console.log('  precacheAllGames() - предзагрузить ВСЕ игры');
    console.log('  cacheAll() - кешировать все ссылки');
    console.log('  cacheStatus() - проверить кеш');
    console.log('  cacheUrl("url") - кешировать конкретный URL');

})();
</script>