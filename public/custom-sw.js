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

  // 1. Get the URL from the notification data, defaulting to root
  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true // Look for clients even if not currently controlled by this SW
    }).then(function(clientList) {
      // 2. Look for an existing window to focus
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        
        // Check if the client matches your app's scope and can be focused
        if (client.url.startsWith(self.registration.scope) && 'focus' in client) {
          // If you want to force navigation to the specific URL, uncomment the line below:
          // client.navigate(urlToOpen); 
          return client.focus();
        }
      }
      
      // 3. If no existing window is found, open a new one (PWA behavior)
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
