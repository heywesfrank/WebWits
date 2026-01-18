import { useState } from 'react';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  if (!base64String) return null;
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Helper: Waits for a SW to become "active"
async function waitForActiveWorker(registration) {
  if (registration.active) return;
  const worker = registration.installing || registration.waiting;
  if (!worker) return;

  return new Promise((resolve, reject) => {
    if (worker.state === 'activated') resolve();
    const listener = () => {
      if (worker.state === 'activated') {
        worker.removeEventListener('statechange', listener);
        resolve();
      }
    };
    worker.addEventListener('statechange', listener);
    setTimeout(() => {
        worker.removeEventListener('statechange', listener);
        reject(new Error("Service Worker activation timed out."));
    }, 5000);
  });
}

export function useNotifications(userId) {
  const [loading, setLoading] = useState(false);

  const subscribe = async () => {
    if (!('serviceWorker' in navigator)) {
      alert("Browser does not support Service Workers");
      return false;
    }
    if (!userId) return false;
    if (!VAPID_PUBLIC_KEY) {
      alert("Critical Error: NEXT_PUBLIC_VAPID_PUBLIC_KEY is missing.");
      return false;
    }

    try {
      setLoading(true);

      // 1. Get existing registration
      let registration = await navigator.serviceWorker.getRegistration();

      // 2. SELF-HEALING: If it exists, try to update it. 
      // If it's "Not Found" (broken), unregister it and start fresh.
      if (registration) {
        try {
          await registration.update();
        } catch (err) {
          console.warn("Existing SW is broken. Unregistering...", err);
          await registration.unregister();
          registration = null; // Force fresh register below
        }
      }

      // 3. Register Fresh (if needed)
      if (!registration) {
         try {
            registration = await navigator.serviceWorker.register('/sw.js');
         } catch (err) {
            // If this fails, sw.js is truly missing from the server
            throw new Error("Could not find /sw.js on the server. Deployment issue?");
         }
      }

      // 4. Wait for Active
      await waitForActiveWorker(registration);
      if (!registration.active) {
         throw new Error("Service Worker installed but didn't activate. Try reloading.");
      }

      // 5. Subscribe
      const convertedKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey
      });

      // 6. Send to DB
      const res = await fetch('/api/web-push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription, user_id: userId }),
      });

      if (!res.ok) throw new Error('Database sync failed');
      
      alert("Success! Notifications enabled. 🔔");
      return true;

    } catch (error) {
      console.error("Subscription Error:", error);
      alert(`Error: ${error.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { subscribe, loading };
}
