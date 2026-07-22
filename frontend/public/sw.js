const CACHE_NAME = "qso-pocket-v1";

// Install: skip waiting to activate immediately
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// Activate: clean old caches and claim clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first for API, stale-while-revalidate for static
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // API calls: network only (offline queue handled by app)
  if (url.pathname.startsWith("/api")) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ error: "offline" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        });
      })
    );
    return;
  }

  // Static assets: stale-while-revalidate (serve cache, update in background)
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request).then((response) => {
          if (response.ok && url.origin === self.location.origin) {
            cache.put(event.request, response.clone());
          }
          return response;
        }).catch(() => {
          // If network fails and we have cache, return it
          if (cached) return cached;
          // Fallback for navigation requests
          if (event.request.mode === "navigate") {
            return cache.match("/index.html");
          }
          return new Response("Offline", { status: 503 });
        });

        // Return cached version immediately, update in background
        return cached || fetchPromise;
      });
    })
  );
});
