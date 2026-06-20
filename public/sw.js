/* ============================================================
   PASTIJAGA — SERVICE WORKER
   Network-first for HTML, Cache-first for CSS/JS/images
   ============================================================ */

const CACHE_NAME = 'pastijaga-v1';

const PRE_CACHE = [
  '/',
  '/assets/style.css',
  '/assets/main.js'
];

const OFFLINE_PAGE = '/offline.html';

/* ── INSTALL ── */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([...PRE_CACHE, OFFLINE_PAGE]);
    })
  );
  self.skipWaiting();
});

/* ── ACTIVATE ── */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

/* ── FETCH ── */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) return;

  // HTML requests: Network-first
  if (request.headers.get('Accept')?.includes('text/html') || request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  // CSS, JS, images: Cache-first
  event.respondWith(cacheFirst(request));
});

/* ── STRATEGIES ── */

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    const cached = await caches.match(request);
    return cached || caches.match(OFFLINE_PAGE);
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    return new Response('', { status: 408, statusText: 'Offline' });
  }
}
