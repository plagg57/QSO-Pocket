const CACHE_NAME = "qso-pocket-v2";
const API_CACHE_NAME = "qso-pocket-api-v1";

// Install: skip waiting to activate immediately
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// Activate: clean old caches and claim clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME && k !== API_CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch handler
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // API calls: network-first with cache fallback for GET requests
  if (url.pathname.startsWith("/api")) {
    if (event.request.method === "GET") {
      // GET API requests: try network, fall back to cache
      event.respondWith(
        fetch(event.request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(API_CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
            return response;
          })
          .catch(() => {
            return caches.open(API_CACHE_NAME).then((cache) => {
              return cache.match(event.request).then((cached) => {
                if (cached) return cached;
                return new Response(JSON.stringify({ error: "offline" }), {
                  status: 503,
                  headers: { "Content-Type": "application/json" },
                });
              });
            });
          })
      );
    } else {
      // POST/PUT/DELETE: network only, return offline error if failed
      event.respondWith(
        fetch(event.request).catch(() => {
          return new Response(JSON.stringify({ error: "offline" }), {
            status: 503,
            headers: { "Content-Type": "application/json" },
          });
        })
      );
    }
    return;
  }

  // Static assets: stale-while-revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request).then((response) => {
          if (response.ok && url.origin === self.location.origin) {
            cache.put(event.request, response.clone());
          }
          return response;
        }).catch(() => {
          if (cached) return cached;
          if (event.request.mode === "navigate") {
            return cache.match("/index.html");
          }
          return new Response("Offline", { status: 503 });
        });
        return cached || fetchPromise;
      });
    })
  );
});
