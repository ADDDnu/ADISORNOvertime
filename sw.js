const CACHE = 'ot-app-v14';
const ASSETS = [
  './',
  './login.html',
  './index.html',
  './manifest.webmanifest',
  './js/login.js?v=14',
  './js/app.js?v=14',
  './assets/app_icon.png',
  './assets/user_photo.jpeg'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const isHTML = req.headers.get('accept')?.includes('text/html');

  if (isHTML) {
    e.respondWith(
      fetch(req).then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return r;
      }).catch(() => caches.match(req))
    );
  } else {
    e.respondWith(
      caches.match(req).then(cached => cached || fetch(req).then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return r;
      }))
    );
  }
});
