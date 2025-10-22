// Service Worker for Sanj Healthcare PWA
const CACHE_NAME = 'sanj-healthcare-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/design-system.css',
  '/css/components.css',
  '/css/tabs.css',
  '/js/firebase-config.js',
  '/js/navigation.js',
  '/tabs/products.html',
  '/tabs/stock.html',
  '/tabs/finance.html',
  '/tabs/marketing.html',
  '/tabs/debts.html',
  '/tabs/reports.html',
  '/js/products.js',
  '/js/stock.js',
  '/js/finance.js',
  '/js/marketing.js',
  '/js/debts.js',
  '/js/reports.js'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});