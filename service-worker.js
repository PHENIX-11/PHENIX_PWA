const CACHE_PREFIX = "phenix-pwa-";
const CACHE_VERSION = "v3";
const CACHE_NAME = CACHE_PREFIX + CACHE_VERSION;
const BASE = new URL(self.registration.scope);
const SHELL = [
  new URL("./", BASE).href,
  new URL("index.html", BASE).href,
  new URL("manifest.json", BASE).href,
  new URL("assets/phenix-favicon.png", BASE).href,
  new URL("assets/phenix-pwa-192.png", BASE).href,
  new URL("assets/phenix-pwa-512.png", BASE).href,
  new URL("assets/phenix-official-logo.webp", BASE).href,
  new URL("assets/phenix-founder-suman.jpg", BASE).href
];
self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Cache the app shell automatically on first visit; no download-permission prompt is used.
    await cache.addAll(SHELL);
    await self.skipWaiting();
  })());
});
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // don't intercept third-party embeds or external links
  if (request.mode === "navigate") {
    // Prefer a fresh page when online, but fall back to the cached page offline.
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(new URL("index.html", BASE).href, response.clone()).catch(() => {});
        }
        return response;
      } catch (error) {
        return (await caches.match(new URL("index.html", BASE).href)) || (await caches.match(new URL("./", BASE).href));
      }
    })());
    return;
  }
  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response && response.ok && response.type === "basic") {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(request, copy)).catch(() => {});
    }
    return response;
  })());
});
