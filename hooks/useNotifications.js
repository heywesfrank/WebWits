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
    if (!('serviceWorker' in navigator)) return false;
    if (!userId) return false;

    try {
      setLoading(true);

      // 1. FORCE REGISTRATION
      // Don't just wait. Check if it exists, if not, register it immediately.
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js');
      }

      // 2. Wait for it to be active to avoid "Subscribe on null" errors
      if (!registration.active) {
        await new Promise(resolve => {
           const interval = setInterval(() => {
              if (registration.active) {
                 clearInterval(interval);
                 resolve();
              }
           }, 100);
           // Fallback timeout after 3s to try anyway
           setTimeout(() => { clearInterval(interval); resolve(); }, 3000);
        });
      }

      // 3. Subscribe
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      // 4. Send to DB
      const res = await fetch('/api/web-push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription, user_id: userId }),
      });

      if (!res.ok) throw new Error('Failed to sync with server');
      
      alert("Notifications Active! 🔔");
      return true;

    } catch (error) {
      console.error("Subscription Error:", error);
      alert("Could not enable notifications. Please check your system settings.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { subscribe, loading };
}
