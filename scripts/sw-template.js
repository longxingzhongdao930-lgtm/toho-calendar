// This template is populated by scripts/build-offline.mjs after next build.
const CACHE_NAME = "__CACHE_NAME__";
const ASSETS = __ASSETS__;
const ROOT = "__ROOT__";
self.addEventListener("install", (event) =>
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(ASSETS);
      await self.skipWaiting();
    })(),
  ),
);
self.addEventListener("activate", (event) =>
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys())
        if (name.startsWith("toho-static-") && name !== CACHE_NAME)
          await caches.delete(name);
      await self.clients.claim();
    })(),
  ),
);
self.addEventListener("fetch", (event) => {
  const request = event.request,
    url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (request.mode === "navigate" && url.pathname.startsWith(ROOT)) {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match(ROOT);
        return cached || Response.error();
      }),
    );
    return;
  }
  if (ASSETS.includes(url.pathname))
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match(url.pathname)) || fetch(request);
      })(),
    );
});
