const CACHE_PREFIX = "phenix-pwa-";
const CACHE_VERSION = "v2";
const CACHE_NAME = CACHE_PREFIX + CACHE_VERSION;
const BASE = new URL(self.registration.scope);
const PAGE_URL = new URL("index.html", BASE).href;
const ROOT_URL = new URL("./", BASE).href;
const SHELL = [
  ROOT_URL,
  PAGE_URL,
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
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      const cached = await caches.match(PAGE_URL) || await caches.match(ROOT_URL);
      const refresh = fetch(request).then(async response => {
        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(PAGE_URL, response.clone());
          await cache.put(ROOT_URL, response.clone());
        }
        return response;
      });
      if (cached) {
        event.waitUntil(refresh.catch(() => {}));
        return cached;
      }
      return refresh;
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response && response.ok && response.type === "basic") {
      event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone())).catch(() => {}));
    }
    return response;
  })());
});
