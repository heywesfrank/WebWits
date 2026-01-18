// public/custom-sw.js

console.log("[SW] Custom Service Worker Loaded");

self.addEventListener('install', (event) => {
  console.log("[SW] Install Event");
  // Force this new worker to become the active one, kicking out the old one
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log("[SW] Activate Event");
  // Immediately take control of the page (so we don't have to reload)
  event.waitUntil(self.clients.claim());
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
    badge: '/badge.png',
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
