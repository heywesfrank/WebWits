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

// Helper: Waits for a SW to become "active" if it's currently installing/waiting
async function waitForActiveWorker(registration) {
  if (registration.active) return; // Already active!

  const worker = registration.installing || registration.waiting;
  if (!worker) return; // No worker found at all?

  return new Promise((resolve, reject) => {
    // If it's already active by the time we add the listener
    if (worker.state === 'activated') resolve();

    const listener = () => {
      if (worker.state === 'activated') {
        worker.removeEventListener('statechange', listener);
        resolve();
      }
    };
    worker.addEventListener('statechange', listener);
    
    // Timeout after 10 seconds so we don't hang forever
    setTimeout(() => {
        worker.removeEventListener('statechange', listener);
        reject(new Error("Service Worker took too long to activate."));
    }, 10000);
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

      // 1. Get or Create Registration
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js');
      }

      // 2. FORCE UPDATES if it's stuck
      // This asks the browser to check for a new version immediately
      await registration.update();

      // 3. WAIT for it to be active (The Fix)
      await waitForActiveWorker(registration);

      // 4. Double check before calling subscribe
      if (!registration.active) {
         throw new Error("Service Worker is installed but not active. Try closing the app completely and reopening it.");
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
