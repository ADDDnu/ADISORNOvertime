const CACHE = 'ot-app-v17';
const ASSETS = [
  './',
  './index.html',
  './login.html',
  './js/app.js',
  './js/login.js',
  './manifest.webmanifest',
  './assets/app_icon.png'
];
self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});
self.addEventListener('fetch', e=>{
  e.respondWith(caches.match(e.request).then(res=>res || fetch(e.request)));
});
