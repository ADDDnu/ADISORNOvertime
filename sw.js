const CACHE = 'ot-app-v11';
const ASSETS = [
  './',
  './login.html',
  './index.html',
  './manifest.webmanifest',
  './js/login.js',
  './js/dashboard.js',
  './assets/app_icon.png',
  './assets/user_photo.jpeg'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(c => c || fetch(e.request)));
});
