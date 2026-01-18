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

// Helper: Smartly waits for active, kicking the waiting worker if needed
async function waitForActiveWorker(registration) {
  if (registration.active) return;

  // 1. Check if there's a worker waiting to take over
  const waitingWorker = registration.waiting;
  if (waitingWorker) {
    // KICK IT: Tell it to skip waiting immediately
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
  }

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
    
    // Increased timeout to 15s for slow Android devices
    setTimeout(() => {
        worker.removeEventListener('statechange', listener);
        // Don't reject, just return. Usually if it times out, 
        // it might still be working in the background.
        console.warn("SW activation slow...");
        resolve(); 
    }, 15000);
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

      // 1. Get Registration
      let registration = await navigator.serviceWorker.getRegistration();

      // 2. If missing, register
      if (!registration) {
         try {
            registration = await navigator.serviceWorker.register('/sw.js');
         } catch (err) {
            throw new Error("Could not find /sw.js on the server.");
         }
      }

      // 3. Force Update (Checks server for the new custom-sw.js changes)
      try {
        await registration.update();
      } catch (e) { console.warn("Update check failed", e); }

      // 4. Wait for Active (with the new KICK logic)
      await waitForActiveWorker(registration);

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
