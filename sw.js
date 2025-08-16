// Service Worker для Carpet Notes Lite
// Обеспечивает офлайн функциональность и кэширование

const CACHE_NAME = 'carpet-notes-v1.3';
const STATIC_CACHE_NAME = 'carpet-notes-static-v1.3';
const DYNAMIC_CACHE_NAME = 'carpet-notes-dynamic-v1.3';

// Файлы для кэширования
const STATIC_FILES = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/manifest.json',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
    'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2'
];

// Файлы критичные для работы офлайн
const CORE_FILES = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js'
];

// Установка Service Worker
self.addEventListener('install', event => {
    console.log('[SW] Установка Service Worker...');
    
    event.waitUntil(
        Promise.all([
            // Кэшируем статические файлы
            caches.open(STATIC_CACHE_NAME).then(cache => {
                console.log('[SW] Кэширование статических файлов...');
                return cache.addAll(STATIC_FILES.map(url => {
                    return new Request(url, { cache: 'reload' });
                }));
            }),
            
            // Кэшируем критичные файлы отдельно
            caches.open(CACHE_NAME).then(cache => {
                console.log('[SW] Кэширование критичных файлов...');
                return cache.addAll(CORE_FILES);
            })
        ]).then(() => {
            console.log('[SW] Все файлы успешно закэшированы');
            // Принудительно активируем новый SW
            return self.skipWaiting();
        }).catch(error => {
            console.error('[SW] Ошибка кэширования:', error);
