self.GFCC_SW_VERSION = "1.5.3-boot-reload";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
    await self.clients.claim();

    const clients = await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true
    });

    await Promise.all(
      clients.map((client) => {
        if (!("navigate" in client)) {
          return Promise.resolve();
        }

        const url = new URL(client.url);

        if (url.searchParams.get("gfcc_sw") === self.GFCC_SW_VERSION) {
          return Promise.resolve();
        }

        url.searchParams.set("gfcc_sw", self.GFCC_SW_VERSION);

        return client.navigate(url.toString());
      })
    );
  })());
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(fetch(event.request));
});
