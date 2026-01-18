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

export function useNotifications(userId) {
  const [loading, setLoading] = useState(false);

  const subscribe = async () => {
    if (!('serviceWorker' in navigator)) {
      alert("Browser does not support Service Workers");
      return false;
    }
    if (!userId) return false;

    // 1. Check for Key immediately
    if (!VAPID_PUBLIC_KEY) {
      alert("Critical Error: NEXT_PUBLIC_VAPID_PUBLIC_KEY is missing in your deployment settings.");
      return false;
    }

    try {
      setLoading(true);

      // 2. Force Register sw.js
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        // Try registering explicitly
        try {
          registration = await navigator.serviceWorker.register('/sw.js');
        } catch (regError) {
          throw new Error(`SW Register Failed: ${regError.message}`);
        }
      }

      // 3. Wait for Active (Wait up to 5s)
      if (!registration.active) {
        await new Promise(resolve => {
           const interval = setInterval(() => {
              if (registration.active) {
                 clearInterval(interval);
                 resolve();
              }
           }, 100);
           setTimeout(() => { clearInterval(interval); resolve(); }, 5000);
        });
      }

      // Double check active state
      if (!registration.active) {
         // Proceeding anyway, but warning console
         console.warn("Service Worker verified but not yet 'active'. Subscription might fail.");
      }

      // 4. Subscribe
      const convertedKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      if (!convertedKey) throw new Error("VAPID Key conversion failed.");

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey
      });

      // 5. Send to DB
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
      // ALERT THE REAL ERROR to help debug
      alert(`Error: ${error.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { subscribe, loading };
}
