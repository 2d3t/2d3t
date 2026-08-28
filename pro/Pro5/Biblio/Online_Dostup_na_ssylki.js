
<script>
// ============================================================
// УНИВЕРСАЛЬНЫЙ СКРИПТ ДЛЯ ХРАНЕНИЯ + ОФЛАЙН-ПОДДЕРЖКИ
// Вставьте этот код в любую страницу — работает сразу
// ============================================================

(function(global) {
    'use strict';

    // ---------- 1. ХРАНИЛИЩЕ В LOCALSTORAGE ----------
    const Storage = {
        save(key, data) {
            try {
                localStorage.setItem(key, JSON.stringify(data));
                return true;
            } catch (e) {
                console.error('[Storage] Ошибка сохранения:', e);
                return false;
            }
        },

        load(key, defaultData = null) {
            try {
                const raw = localStorage.getItem(key);
                if (raw === null) {
                    if (defaultData !== null) {
                        this.save(key, defaultData);
                    }
                    return defaultData;
                }
                return JSON.parse(raw);
            } catch (e) {
                console.error('[Storage] Ошибка загрузки:', e);
                return defaultData;
            }
        },

        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                console.error('[Storage] Ошибка удаления:', e);
                return false;
            }
        },

        has(key) {
            return localStorage.getItem(key) !== null;
        },

        clear() {
            try {
                localStorage.clear();
                return true;
            } catch (e) {
                console.error('[Storage] Ошибка очистки:', e);
                return false;
            }
        }
    };

    // ---------- 2. РАБОТА С МАССИВАМИ ----------
    const ArrayHelper = {
        add(key, item, defaultData = []) {
            let data = Storage.load(key, defaultData);
            if (!Array.isArray(data)) data = [];
            data.push(item);
            return Storage.save(key, data);
        },

        remove(key, identifier, idField = 'id', defaultData = []) {
            let data = Storage.load(key, defaultData);
            if (!Array.isArray(data)) return false;

            let index = -1;
            if (typeof identifier === 'function') {
                index = data.findIndex(identifier);
            } else if (typeof identifier === 'number' && Number.isInteger(identifier)) {
                index = identifier;
            } else if (identifier !== undefined && identifier !== null) {
                index = data.findIndex(item => item && item[idField] === identifier);
            }

            if (index === -1) return false;
            data.splice(index, 1);
            return Storage.save(key, data);
        },

        update(key, identifier, newData, idField = 'id', defaultData = []) {
            let data = Storage.load(key, defaultData);
            if (!Array.isArray(data)) return false;

            let index = -1;
            if (typeof identifier === 'function') {
                index = data.findIndex(identifier);
            } else if (typeof identifier === 'number' && Number.isInteger(identifier)) {
                index = identifier;
            } else if (identifier !== undefined && identifier !== null) {
                index = data.findIndex(item => item && item[idField] === identifier);
            }

            if (index === -1) return false;
            data[index] = { ...data[index], ...newData };
            return Storage.save(key, data);
        },

        get(key, defaultData = []) {
            const data = Storage.load(key, defaultData);
            return Array.isArray(data) ? data : [];
        },

        find(key, predicate, defaultData = []) {
            const data = this.get(key, defaultData);
            return data.find(predicate) || null;
        },

        filter(key, predicate, defaultData = []) {
            const data = this.get(key, defaultData);
            return data.filter(predicate);
        },

        clear(key) {
            return Storage.save(key, []);
        }
    };

    // ---------- 3. СТАТУС СЕТИ ----------
    const Network = {
        getStatus() {
            return navigator.onLine ? 'online' : 'offline';
        },

        isOnline() {
            return navigator.onLine;
        },

        isOffline() {
            return !navigator.onLine;
        },

        onChange(callback) {
            const onlineHandler = () => callback('online', true);
            const offlineHandler = () => callback('offline', false);
            
            window.addEventListener('online', onlineHandler);
            window.addEventListener('offline', offlineHandler);
            
            return () => {
                window.removeEventListener('online', onlineHandler);
                window.removeEventListener('offline', offlineHandler);
            };
        },

        // Обновить элемент с статусом
        updateStatusElement(elementId, onlineText = '🟢 Онлайн', offlineText = '🔴 Офлайн') {
            const el = document.getElementById(elementId);
            if (!el) return;
            
            const update = () => {
                el.textContent = this.isOnline() ? onlineText : offlineText;
                el.className = this.isOnline() ? 'status-online' : 'status-offline';
            };
            
            update();
            return this.onChange(update);
        }
    };

    // ---------- 4. SERVICE WORKER (ОФЛАЙН-ПОДДЕРЖКА) ----------
    const SW = {
        /**
         * Зарегистрировать Service Worker
         * @param {string} swPath - Путь к sw.js (по умолчанию 'sw.js')
         * @param {Object} options - Опции регистрации
         * @returns {Promise}
         */
        register(swPath = 'sw.js', options = {}) {
            if (!('serviceWorker' in navigator)) {
                console.warn('[SW] Service Worker не поддерживается');
                return Promise.reject(new Error('SW не поддерживается'));
            }

            return navigator.serviceWorker.register(swPath, options)
                .then(registration => {
                    console.log('[SW] ✅ Зарегистрирован');
                    return registration;
                })
                .catch(error => {
                    console.error('[SW] ❌ Ошибка:', error);
                    throw error;
                });
        },

        /**
         * Проверить активен ли SW
         * @returns {Promise<boolean>}
         */
        async isActive() {
            if (!('serviceWorker' in navigator)) return false;
            try {
                const registration = await navigator.serviceWorker.getRegistration();
                return registration !== undefined && registration.active !== null;
            } catch {
                return false;
            }
        },

        /**
         * Создать и зарегистрировать SW из строки (встроенный SW)
         * @param {string} swCode - Код Service Worker
         * @param {string} scope - Scope для SW
         * @returns {Promise}
         */
        registerInline(swCode, scope = '/') {
            if (!('serviceWorker' in navigator)) {
                console.warn('[SW] Service Worker не поддерживается');
                return Promise.reject(new Error('SW не поддерживается'));
            }

            try {
                const blob = new Blob([swCode], { type: 'application/javascript' });
                const swUrl = URL.createObjectURL(blob);
                return navigator.serviceWorker.register(swUrl, { scope });
            } catch (error) {
                console.error('[SW] Ошибка создания inline SW:', error);
                return Promise.reject(error);
            }
        },

        /**
         * Сгенерировать код SW для кеширования текущей страницы
         * @param {string} cacheName - Имя кеша
         * @param {Array} urls - URL для кеширования (по умолчанию текущая страница)
         * @returns {string} - Код SW
         */
        generateCacheSW(cacheName = 'app-v1', urls = null) {
            if (!urls) {
                urls = [window.location.pathname || '/'];
                // Добавляем текущий URL с параметрами
                if (window.location.search) {
                    urls.push(window.location.pathname + window.location.search);
                }
            }

            return `
const CACHE_NAME = '${cacheName}';
const urlsToCache = ${JSON.stringify(urls)};

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Кеширование:', urlsToCache);
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(name => {
                    if (name !== CACHE_NAME) {
                        console.log('[SW] Удаление старого кеша:', name);
                        return caches.delete(name);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
            .catch(() => caches.match('/'))
    );
});
`;
        },

        /**
         * Автоматическая настройка SW (создаёт и регистрирует)
         * @param {string} cacheName - Имя кеша
         * @returns {Promise}
         */
        async setupOffline(cacheName = 'app-v1') {
            const swCode = this.generateCacheSW(cacheName);
            return this.registerInline(swCode);
        }
    };

    // ---------- 5. ВСПОМОГАТЕЛЬНЫЕ УТИЛИТЫ ----------
    const Utils = {
        /**
         * Глубокое копирование
         */
        deepClone(obj) {
            return JSON.parse(JSON.stringify(obj));
        },

        /**
         * Генерация уникального ID
         */
        generateId() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
        },

        /**
         * Форматирование даты
         */
        formatDate(date, format = 'DD.MM.YYYY HH:mm') {
            const d = new Date(date);
            const pad = n => String(n).padStart(2, '0');
            const replacements = {
                'YYYY': d.getFullYear(),
                'MM': pad(d.getMonth() + 1),
                'DD': pad(d.getDate()),
                'HH': pad(d.getHours()),
                'mm': pad(d.getMinutes()),
                'ss': pad(d.getSeconds())
            };
            return format.replace(/YYYY|MM|DD|HH|mm|ss/g, match => replacements[match]);
        },

        /**
         * Показать toast-уведомление
         */
        showToast(message, duration = 2000) {
            // Создаём элемент если его нет
            let toast = document.getElementById('_toast');
            if (!toast) {
                toast = document.createElement('div');
                toast.id = '_toast';
                toast.style.cssText = `
                    position: fixed;
                    bottom: 30px;
                    left: 50%;
                    transform: translateX(-50%) translateY(100px);
                    background: #1e293b;
                    color: white;
                    padding: 12px 24px;
                    border-radius: 60px;
                    font-size: 0.9rem;
                    box-shadow: 0 8px 20px rgba(0,0,0,0.3);
                    opacity: 0;
                    transition: all 0.3s ease;
                    z-index: 9999;
                    pointer-events: none;
                    font-family: system-ui, sans-serif;
                `;
                document.body.appendChild(toast);
            }

            toast.textContent = message;
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';

            clearTimeout(toast._timeout);
            toast._timeout = setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(-50%) translateY(100px)';
            }, duration);
        }
    };

    // ---------- 6. ЭКСПОРТ В ГЛОБАЛЬНЫЙ ОБЪЕКТ ----------
    const OfflineKit = {
        Storage,
        ArrayHelper,
        Network,
        SW,
        Utils,
        version: '1.0.0'
    };

    // Добавляем в глобальный объект
    global.OfflineKit = OfflineKit;

    // Для удобства добавляем сокращения
    global.Store = Storage;
    global.ArrayStore = ArrayHelper;
    global.NetworkStatus = Network;
    global.SWHelper = SW;
    global.Utils = Utils;

    console.log('[OfflineKit] ✅ Загружен v1.0.0');

})(window);
</script>
