  const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/budgetDb.js",
    "/index.js",
    "/manifest.webmanifest",
    "/service-worker.js",
    "/styles.css",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png",
    'https://cdn.jsdelivr.net/npm/chart.js@2.8.0',
  ];

const PRE_CACHE = 'precache-v1';
const DATA_CACHE = "data-cache";

self.addEventListener("install", (event) => {
  event.waitUntil(
      caches
          .open(PRE_CACHE)
          .then((cache) => cache.addAll(FILES_TO_CACHE))
          .then(self.skipWaiting())
  );
});

// The activate handler takes care of cleaning up old caches.
self.addEventListener("activate", (event) => {
  const currentCaches = [PRE_CACHE, DATA_CACHE];
  event.waitUntil(
      caches
          .keys()
          .then((cacheNames) => {
              return cacheNames.filter(
                  (cacheName) => !currentCaches.includes(cacheName)
              );
          })
          .then((cachesToDelete) => {
              return Promise.all(
                  cachesToDelete.map((cacheToDelete) => {
                      return caches.delete(cacheToDelete);
                  })
              );
          })
          .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
// handle date-cache GET requests for data from /api routes
  if (event.request.url.includes("/api/")) {
// make network request and fallback to cache if network request fails (offline)
      event.respondWith(
          caches
              .open(DATA_CACHE)
              .then((cachedResponse) => {
                  return fetch(event.request)
                      .then((response) => {
                          if (response.status === 200) {
                              cachedResponse.put(
                                  event.request.url,
                                  response.clone()
                              );
                          }
                          return response;
                      })
                      .catch((err) => {
                          return err;
                      });
            }).catch(err => console.log(err))
    );

      return
  }
  event.respondWith(
      fetch(event.request).catch(() => {
          return caches.match(event.request).then(response => {
              if (response) {
                  return response
              } else if (event.request.headers.get("accept").includes("text/html")) {
                  return caches.match("/")
              }
          })
      }))
});