const CACHE_PREFIX = "phenix-pwa-";
const CACHE_VERSION = "v3";
const CACHE_NAME = CACHE_PREFIX + CACHE_VERSION;
const BASE = new URL(self.registration.scope);
const INDEX_URL = new URL("index.html", BASE).href;
const SHELL = [
  new URL("./", BASE).href,
  INDEX_URL,
  new URL("manifest.json", BASE).href,
  new URL("assets/phenix-favicon.png", BASE).href,
  new URL("assets/phenix-pwa-192.png", BASE).href,
  new URL("assets/phenix-pwa-512.png", BASE).href,
  new URL("assets/phenix-official-logo.webp", BASE).href,
  new URL("assets/phenix-founder-suman.jpg", BASE).href
];

async function cacheIfMissing(cache, url) {
  if (await cache.match(url)) return;
  try {
    const response = await fetch(url, { cache: "reload" });
    if (response && response.ok && response.type !== "opaque") {
      await cache.put(url, response.clone());
    }
  } catch (error) {
    // Keep the worker installable even if an optional resource is temporarily unavailable.
  }
}

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Reuse existing cached files instead of downloading the large homepage again unnecessarily.
    await Promise.all(SHELL.map(url => cacheIfMissing(cache, url)));
    // Refresh the HTML once when the worker updates so the new prompt/code can be cached.
    try {
      const response = await fetch(INDEX_URL, { cache: "reload" });
      if (response && response.ok && response.type !== "opaque") {
        await cache.put(INDEX_URL, response.clone());
        await cache.put(new URL("./", BASE).href, response.clone());
      }
    } catch (error) {
      // Existing cached HTML remains available if the network is unavailable.
    }
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map(name => caches.delete(name)));
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.enable(); } catch (error) {}
    }
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
      const cache = await caches.open(CACHE_NAME);
      const cached = (await cache.match(request)) || (await cache.match(INDEX_URL)) || (await cache.match(new URL("./", BASE).href));
      const refresh = (async () => {
        try {
          const preload = event.preloadResponse ? await event.preloadResponse : undefined;
          const response = preload || await fetch(request);
          if (response && response.ok && response.type !== "opaque") {
            await cache.put(INDEX_URL, response.clone());
            await cache.put(new URL("./", BASE).href, response.clone());
          }
        } catch (error) {}
      })();
      if (cached) {
        event.waitUntil(refresh);
        return cached;
      }
      const preload = event.preloadResponse ? await event.preloadResponse.catch(() => undefined) : undefined;
      try {
        const response = preload || await fetch(request);
        if (response && response.ok && response.type !== "opaque") {
          event.waitUntil(Promise.all([
            cache.put(INDEX_URL, response.clone()),
            cache.put(new URL("./", BASE).href, response.clone())
          ]).catch(() => {}));
        }
        return response;
      } catch (error) {
        return new Response("PHENIX is temporarily unavailable offline. Please reconnect and try again.", {
          status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" }
        });
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) {
      // Refresh cached same-origin resources in the background while serving them immediately.
      event.waitUntil(fetch(request).then(response => {
        if (response && response.ok && response.type === "basic") return cache.put(request, response.clone());
      }).catch(() => {}));
      return cached;
    }
    const response = await fetch(request);
    if (response && response.ok && response.type === "basic") {
      event.waitUntil(cache.put(request, response.clone()).catch(() => {}));
    }
    return response;
  })());
});
