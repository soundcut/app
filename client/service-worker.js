/* global ASSETS */

// eslint-disable-next-line no-unused-vars
const version = 2;
const CACHE_NAME = new Date().toISOString();

self.addEventListener('install', event => {
  const toCache = [
    '/',
    ...Object.values(ASSETS).map(asset => `/public/${asset}`),
  ].map(path => new URL(path, global.location).toString());

  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(toCache)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    global.caches
      .keys()
      .then(cacheNames =>
        Promise.all(
          cacheNames
            .filter(cacheName => cacheName !== CACHE_NAME)
            .map(cacheName => global.caches.delete(cacheName))
        )
      )
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') {
    return;
  }

  const resource = global.caches.match(request).then(cached => {
    return (
      cached ||
      fetch(request).then(responseNetwork => {
        const cloned = responseNetwork.clone();
        if (!cloned || !cloned.ok) {
          return responseNetwork;
        }

        global.caches
          .open(CACHE_NAME)
          .then(cache => cache.put(request, cloned));

        return responseNetwork;
      })
    );
  });

  event.respondWith(resource);
});
