const CACHE='ot-app-v17-9';
const ASSETS=[
  './',
  './index.html',
  './login.html',
  './js/app.js?v=17.9',
  './js/login.js?v=17.9',
  './manifest.webmanifest',
  './assets/app_icon.png'
];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch',e=>{ e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))); });
