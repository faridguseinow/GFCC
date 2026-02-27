const STATIC_CACHE = "gfcc-static-v1";
const API_CACHE = "gfcc-api-v1";
const PRICE_URL = "/api/prices";
const ONE_HOUR = 60 * 60 * 1000;

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache =>
      cache.addAll([
        "/",
        "/index.html",
        "/manifest.json",
        "/icons/icon-192x192.png",
        "/icons/icon-512x512.png"
      ])
    )
  );
});

self.addEventListener("activate", (event) => {
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 🔹 API cache strategy
  if (url.pathname.includes("/api/prices")) {
    event.respondWith(handlePriceRequest(event.request));
    return;
  }

  // 🔹 Static cache strategy
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

async function handlePriceRequest(request) {
  const cache = await caches.open(API_CACHE);
  const cached = await cache.match(request);

  if (cached) {
    const cachedDate = cached.headers.get("sw-fetched-at");

    if (cachedDate) {
      const age = Date.now() - Number(cachedDate);

      // если старше 1 часа — обновляем в фоне
      if (age > ONE_HOUR) {
        fetchAndUpdate(request, cache);
      }
    }

    return cached;
  }

  return fetchAndUpdate(request, cache);
}

async function fetchAndUpdate(request, cache) {
  const response = await fetch(request);
  const headers = new Headers(response.headers);
  headers.append("sw-fetched-at", Date.now().toString());

  const cloned = new Response(await response.clone().blob(), {
    status: response.status,
    statusText: response.statusText,
    headers
  });

  cache.put(request, cloned.clone());
  return cloned;
}