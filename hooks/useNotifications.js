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
    console.log("[Push Debug] Starting subscription process...");

    // Check Support
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.error("[Push Debug] Browser does not support Push/SW");
      return false;
    }
    if (!VAPID_PUBLIC_KEY) {
      console.error("[Push Debug] Missing VAPID Key");
      alert("Config Error: VAPID Key missing.");
      return false;
    }

    try {
      setLoading(true);

      // 1. Request Permission
      const permission = await Notification.requestPermission();
      console.log(`[Push Debug] Permission Result: ${permission}`);
      
      if (permission !== 'granted') {
        alert("Notifications blocked. Please enable them in Android Settings.");
        return false;
      }

      // 2. Register Service Worker
      console.log("[Push Debug] registering /sw.js ...");
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log("[Push Debug] Registration object found:", registration);
      
      // Log initial state
      if (registration.active) console.log("[Push Debug] SW is ACTIVE");
      if (registration.waiting) console.log("[Push Debug] SW is WAITING");
      if (registration.installing) console.log("[Push Debug] SW is INSTALLING");

      // 3. Smart Activation Wait (Improved UX)
      if (!registration.active) {
          console.log("[Push Debug] No active worker found. Starting polling loop...");
          
          await new Promise((resolve) => {
              let attempts = 0;
              const interval = setInterval(() => {
                  attempts++;
                  // Log status occasionally
                  if (attempts % 10 === 0) console.log(`[Push Debug] Polling attempt ${attempts}...`);

                  if (registration.active || registration.waiting) {
                      console.log(`[Push Debug] Worker found after ${attempts} attempts! (Active: ${!!registration.active}, Waiting: ${!!registration.waiting})`);
                      clearInterval(interval);
                      resolve();
                  }
                  
                  // Wait up to 8 seconds
                  if (attempts > 80) {
                      console.warn("[Push Debug] Polling timed out. Giving up and trying to subscribe anyway.");
                      clearInterval(interval);
                      resolve(); 
                  }
              }, 100);
          });
      } else {
        console.log("[Push Debug] Worker was already active. Skipping poll.");
      }

      // 4. Subscribe
      console.log("[Push Debug] Converting VAPID key...");
      const convertedKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      
      console.log("[Push Debug] Calling pushManager.subscribe...");
      // This is usually where it fails if the SW isn't ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey
      });
      
      console.log("[Push Debug] Subscription successful:", JSON.stringify(subscription));

      // 5. Send to Database
      console.log("[Push Debug] Sending to /api/web-push/subscribe...");
      const res = await fetch('/api/web-push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription, user_id: userId }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Database sync failed: ${res.status} ${errText}`);
      }
      
      console.log("[Push Debug] DB Sync Success. Flow Complete.");
      alert("You're all set! Notifications enabled. 🔔");
      return true;

    } catch (error) {
      console.error("[Push Debug] FATAL ERROR:", error);
      
      if (error.message && error.message.includes("no active service worker")) {
          console.warn("[Push Debug] Specific Error Caught: No active service worker.");
          alert("Just a moment... the app is still setting up in the background. Please click 'Enable' one more time!");
      } else {
          alert(`Something went wrong: ${error.message}`);
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { subscribe, loading };
}
