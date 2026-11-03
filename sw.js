/**
 * sw.js — Service Worker para Novaprint App (PWA)
 */

const CACHE_NAME = 'novaprint-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './assets/css/custom.css',
  './assets/js/storage.js',
  './assets/js/sales.js',
  './assets/js/ticket.js',
  './assets/js/ui.js',
  './assets/js/main.js',
  './manifest.json',
  './favicon.ico',
  './favicon.png',
  './assets/img/icon-192.png',
  './assets/img/icon-512.png',
  './assets/img/favicon-32x32.png',
  './assets/img/favicon-16x16.png',
  './assets/img/apple-touch-icon.png',
  './assets/img/logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Fallback offline básico
        return caches.match('./index.html');
      });
    })
  );
});

