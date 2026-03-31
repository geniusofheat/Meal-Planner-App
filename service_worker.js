// ============================================================
// SERVICE WORKER — Meal Planner PWA
// Auto-updating: always fetches fresh files, cache is backup only
// ============================================================

const CACHE_NAME = 'meal-planner';

const FILES_TO_CACHE = [
  '/Meal-Planner-App/index.html',
  '/Meal-Planner-App/index.js',
  '/Meal-Planner-App/login.html',
  '/Meal-Planner-App/meal_planner.html',
  '/Meal-Planner-App/recipe_builder.html',
  '/Meal-Planner-App/cookbook_menu.html',
  '/Meal-Planner-App/favorites_list.html',
  '/Meal-Planner-App/grocery_list.html',
  '/Meal-Planner-App/blue_card_style.css',
  '/Meal-Planner-App/meal_planner.js',
  '/Meal-Planner-App/recipe_builder.js',
  '/Meal-Planner-App/cookbook_menu_data.js',
  '/Meal-Planner-App/meats_data.js',
  '/Meal-Planner-App/dips_and_sauces_data.js',
  '/Meal-Planner-App/desserts_data.js',
  '/Meal-Planner-App/pastas_data.js',
  '/Meal-Planner-App/beans_and_legumes_data.js',
  '/Meal-Planner-App/beverages_data.js',
  '/Meal-Planner-App/breads_and_grains_data.js',
  '/Meal-Planner-App/candy_data.js',
  '/Meal-Planner-App/salads_data.js',
  '/Meal-Planner-App/seafood_data.js',
  '/Meal-Planner-App/favorites_list.js',
  '/Meal-Planner-App/icon_192.png',
  '/Meal-Planner-App/icon_512.png'
];

// Install — cache all files
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
});

// Activate — take control immediately
self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

// Fetch — network first, fall back to cache
// This means users always get the latest version when online
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // Got fresh response — update cache in background
        const clone = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return networkResponse;
      })
      .catch(() => {
        // Network failed — serve from cache (offline fallback)
        return caches.match(event.request);
      })
  );
});
