<const CACHE_NAME = 'londway-v1';
const STATIC_ASSETS = [
  '/',
  '/accounts',
  '/transfer',
  '/cards',
  '/vaults',
  '/invest',
  '/crypto',
  '/insights',
  '/health-score',
  '/checkbook',
  '/profile',
  '/notifications',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Skip non-GET and external requests
  if (request.method !== 'GET') return;
  if (!request.url.startsWith(self.location.origin)) return;

  // Network-first for API/data, cache-first for static assets
  if (request.url.includes('/api/') || request.url.includes('emailjs') || request.url.includes('supabase')) {
    return; // Let these go to network normally
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetched = fetch(request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || fetched;
    })
  );
});
