// public/custom-sw.js

console.log("[SW] Custom Service Worker Loaded");

self.addEventListener('install', (event) => {
  console.log("[SW] Install Event");
  self.skipWaiting(); // Force activation
});

self.addEventListener('activate', (event) => {
  console.log("[SW] Activate Event");
  event.waitUntil(self.clients.claim()); // Grab control immediately
});

// [!code focus:4] Required for PWA Standalone Mode
self.addEventListener('fetch', (event) => {
  // Simple pass-through. The presence of this listener tells the browser
  // that the app is capable of handling offline requests (even if we just pass them through).
  return; 
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
    badge: '/badge-tray.png',
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
