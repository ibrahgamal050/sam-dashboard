self.addEventListener('install', (event) => {
  event.waitUntil(caches.open('expo-shell-v2').then((cache) => cache.addAll(['/expo', '/kitchen', '/manifest.json', '/manifest-kitchen.json'])))
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (url.pathname.startsWith('/api/orders') || url.pathname.startsWith('/api/kitchen')) {
    // Network-first for API with fallback
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    )
    return
  }
  if (url.pathname.startsWith('/api/menu')) {
    // Stale-while-revalidate for menu
    event.respondWith(
      caches.open('menu-cache-v1').then(async (cache) => {
        const cached = await cache.match(event.request)
        const fetchPromise = fetch(event.request).then((res) => {
          cache.put(event.request, res.clone())
          return res
        })
        return cached || fetchPromise
      })
    )
    return
  }
  // Cache-first for shell
  event.respondWith(
    caches.match(event.request).then((res) => res || fetch(event.request))
  )
})
