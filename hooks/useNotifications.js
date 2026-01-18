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
    if (!VAPID_PUBLIC_KEY) {
      alert("Critical Error: NEXT_PUBLIC_VAPID_PUBLIC_KEY is missing.");
      return false;
    }

    try {
      setLoading(true);

      // 1. Ensure the Service Worker is registered
      // We explicitly register to ensure it exists, though next-pwa usually handles this.
      // This is idempotent (safe to call multiple times).
      await navigator.serviceWorker.register('/sw.js');

      // 2. Wait for the Service Worker to be ACTIVE
      // 'ready' is a Promise that never rejects and waits until the SW is actually active.
      // This completely solves the "no active service worker" error.
      const registration = await navigator.serviceWorker.ready;

      // 3. Double check (rare edge case on some Android versions)
      if (!registration.active) {
        throw new Error("Service Worker registered but not active. Please refresh.");
      }

      // 4. Subscribe
      const convertedKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
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
      // specific error handling for user
      if (error.message.includes("no active service worker")) {
         alert("Please refresh the page and try again. The app is updating.");
      } else {
         alert(`Error: ${error.message}`);
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { subscribe, loading };
}
