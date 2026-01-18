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
    // --- CHECK 1: Browser Support ---
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert("This browser does not support push notifications.");
      return false;
    }
    
    // --- CHECK 2: VAPID Key Existence ---
    if (!VAPID_PUBLIC_KEY) {
      alert("Configuration Error: NEXT_PUBLIC_VAPID_PUBLIC_KEY is missing.");
      return false;
    }

    try {
      setLoading(true);

      // --- STEP 1: Explicit Permission Request ---
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert("Notifications blocked. Please enable them in your browser settings.");
        return false;
      }

      // --- STEP 2: Register Service Worker ---
      // We explicitly register /sw.js. If it's already there, this just returns the registration.
      const registration = await navigator.serviceWorker.register('/sw.js');

      // --- STEP 3: Ensure Active Worker (The Fix) ---
      // Instead of relying solely on .ready (which can hang), we check if we already have a valid registration.
      let activeWorker = registration.active || registration.waiting || registration.installing;
      
      // If we have no worker at all, THEN we wait for .ready as a last resort
      if (!activeWorker) {
          const waitForReady = navigator.serviceWorker.ready;
          const timeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Service Worker timed out. Try reloading.")), 10000)
          );
          const readyReg = await Promise.race([waitForReady, timeout]);
          activeWorker = readyReg.active;
      }

      if (!activeWorker) {
        throw new Error("Could not find an active Service Worker.");
      }

      // --- STEP 4: Subscribe ---
      const convertedKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey
      });

      // --- STEP 5: Save to Database ---
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
      
      if (error.message.includes("timed out")) {
        // Fallback: If it timed out, it might actually be working in the background.
        alert("It's taking a while... Try clicking the button one more time.");
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
