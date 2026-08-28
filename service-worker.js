const CACHE_NAME = 'layer-pwa-v1';
const APP_SHELL = [
  './',
  './index.html',
  './layer_error_proof.html',
  './manifest.webmanifest',
  './icons/layer-icon.svg',
  './icons/layer-icon-192.png',
  './icons/layer-icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      await Promise.all(APP_SHELL.map(async url => {
        try { await cache.add(url); } catch (error) { /* Optional shell aliases may not exist. */ }
      }));
      await self.skipWaiting();
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      }).catch(() => caches.match(request).then(cached => cached || caches.match('./index.html') || caches.match('./layer_error_proof.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
