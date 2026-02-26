/**
 * S16-022: Service worker for offline support.
 * Cache-first for static assets (JS, CSS, images).
 * Network-first for API calls.
 * Caches last-opened spreadsheet data in Cache API.
 */

/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = "gridspace-v1";
const STATIC_CACHE = "gridspace-static-v1";
const API_CACHE = "gridspace-api-v1";

const STATIC_EXTENSIONS = [
  ".js",
  ".css",
  ".woff2",
  ".woff",
  ".ttf",
  ".png",
  ".jpg",
  ".svg",
  ".ico",
];

function isStaticAsset(url: URL): boolean {
  return STATIC_EXTENSIONS.some((ext) => url.pathname.endsWith(ext));
}

function isApiRequest(url: URL): boolean {
  return url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/");
}

function isNavigationRequest(request: Request): boolean {
  return request.mode === "navigate";
}

// Install — pre-cache the app shell
self.addEventListener("install", (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(["/", "/index.html"]);
    }),
  );
  self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener("activate", (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names
          .filter(
            (name) =>
              name !== CACHE_NAME &&
              name !== STATIC_CACHE &&
              name !== API_CACHE,
          )
          .map((name) => caches.delete(name)),
      );
    }),
  );
  self.clients.claim();
});

// Fetch — cache-first for static, network-first for API, cache-first for nav
self.addEventListener("fetch", (event: FetchEvent) => {
  const url = new URL(event.request.url);

  // Skip non-GET and cross-origin
  if (event.request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  if (isStaticAsset(url)) {
    // Cache-first for static assets
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return response;
        });
      }),
    );
    return;
  }

  if (isApiRequest(url)) {
    // Network-first for API: try network, fallback to cache
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(API_CACHE).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then(
            (cached) =>
              cached ||
              new Response(JSON.stringify({ error: "Offline" }), {
                status: 503,
                headers: { "Content-Type": "application/json" },
              }),
          );
        }),
    );
    return;
  }

  if (isNavigationRequest(event.request)) {
    // Navigation — network first, fallback to cached index.html
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match("/index.html").then(
          (cached) =>
            cached ||
            new Response("Offline", {
              status: 503,
              headers: { "Content-Type": "text/html" },
            }),
        );
      }),
    );
    return;
  }
});

// Listen for messages to cache specific spreadsheet data
self.addEventListener("message", (event: ExtendableMessageEvent) => {
  const data = event.data as { type: string; url?: string; payload?: string };
  if (data.type === "CACHE_SPREADSHEET" && data.url && data.payload) {
    caches.open(API_CACHE).then((cache) => {
      const response = new Response(data.payload, {
        headers: { "Content-Type": "application/json" },
      });
      cache.put(data.url!, response);
    });
  }
});

export {};
