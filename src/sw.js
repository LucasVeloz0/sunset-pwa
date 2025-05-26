const CACHE_NAME = 'sunset-cache-v1'
const ASSETS = [
  '/sunset-pwa/',
  '/sunset-pwa/index.html',
  '/sunset-pwa/assets/index-*.js',
  '/sunset-pwa/assets/index-*.css'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
})