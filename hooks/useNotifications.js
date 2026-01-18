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
    // --- CHECK 1: Basic Support ---
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert("This browser does not support push notifications.");
      return false;
    }
    
    // --- CHECK 2: Configuration ---
    if (!VAPID_PUBLIC_KEY) {
      alert("Configuration Error: NEXT_PUBLIC_VAPID_PUBLIC_KEY is missing.");
      return false;
    }

    try {
      setLoading(true);

      // --- STEP 1: Permission ---
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert("Notifications blocked. Please enable them in your browser settings.");
        return false;
      }

      // --- STEP 2: Register & Wait for ACTIVE ---
      // We register the SW
      const registration = await navigator.serviceWorker.register('/sw.js');

      // HELPER: Wait specifically for registration.active
      // This loops every 100ms up to 50 times (5 seconds) to catch the moment it activates.
      const waitForActive = async () => {
        if (registration.active) return registration.active;
        
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const interval = setInterval(() => {
                attempts++;
                if (registration.active) {
                    clearInterval(interval);
                    resolve(registration.active);
                } else if (attempts > 50) { // 5 seconds max
                    clearInterval(interval);
                    reject(new Error("Service Worker installed but failed to activate."));
                }
            }, 100);
        });
      };

      try {
          await waitForActive();
      } catch (e) {
          // Fallback: If polling failed, try the browser's native .ready one last time
          console.warn("Polling active timed out, trying navigator.serviceWorker.ready...");
          await navigator.serviceWorker.ready;
      }

      // Final Check: We MUST have an active worker to subscribe
      if (!registration.active) {
          throw new Error("No active service worker found. Please reload the page.");
      }

      // --- STEP 3: Subscribe ---
      const convertedKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey
      });

      // --- STEP 4: Save to Database ---
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
