// public/custom-sw.js

console.log("[SW] Custom Service Worker Loaded");

const CACHE_NAME = 'webwits-assets-v1';
const ASSETS_TO_CACHE = [
  '/badge-tray.png',
  '/icon.png'
];

self.addEventListener('install', (event) => {
  console.log("[SW] Install Event");
  self.skipWaiting(); // Force activation
  
  // Pre-cache the icons so they are available offline/instantly
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log("[SW] Activate Event");
  event.waitUntil(self.clients.claim()); // Grab control immediately
});

// Required for PWA Standalone Mode
self.addEventListener('fetch', (event) => {
  // If the request is for our icons, try to serve from cache first
  if (ASSETS_TO_CACHE.includes(new URL(event.request.url).pathname)) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});

self.addEventListener('push', function(event) {
  if (!(self.Notification && self.Notification.permission === 'granted')) {
    return;
  }

  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.warn('[SW] Push event but no JSON data');
      return;
    }
  }

  const title = data.title || "WebWits";
  const options = {
    body: data.body || "New update!",
    icon: '/icon.png',
    badge: '/badge-tray.png', // Now served from Cache!
    vibrate: [100, 50, 100], // Optional: adds a standard vibration pattern
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
