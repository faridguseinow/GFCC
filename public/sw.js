const STATIC_CACHE = "gfcc-static-v3";
const API_CACHE = "gfcc-api-v3";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // API
  if (url.pathname.includes("/api/prices")) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // Только статика
  if (event.request.destination === "image" ||
      event.request.destination === "script" ||
      event.request.destination === "style") {

    event.respondWith(
      caches.match(event.request).then(cached => {
        return cached || fetch(event.request).then(response => {
          return caches.open(STATIC_CACHE).then(cache => {
            cache.put(event.request, response.clone());
            return response;
          });
        });
      })
    );
  }
});

async function networkFirst(request) {
  const cache = await caches.open(API_CACHE);

  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached;
  }
}