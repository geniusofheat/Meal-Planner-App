const CACHE_NAME = 'meal-planner-v1';

const FILES_TO_CACHE = [
  '/meal-planner-app/index.html',
  '/meal-planner-app/meal-planner.html',
  '/meal-planner-app/recipe-builder.html',
  '/meal-planner-app/cookbook-menu.html',
  '/meal-planner-app/favorites-list.html',
  '/meal-planner-app/blue-card-style.css'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});