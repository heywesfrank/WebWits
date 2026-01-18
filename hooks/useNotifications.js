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
        alert("Notifications blocked. Please enable them in Settings.");
        return false;
      }

      // 2. Register Service Worker
      console.log("[Push Debug] registering /sw.js ...");
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log("[Push Debug] Registration successful.");

      // 3. FORCE UPDATE: Ensure we aren't using a stale worker
      try {
        await registration.update();
        console.log("[Push Debug] Registration updated.");
      } catch (e) {
        console.warn("[Push Debug] Update failed (offline?):", e);
      }

      // 4. WAIT FOR CONTROLLER (The Critical Fix)
      // We cannot subscribe until navigator.serviceWorker.controller is defined.
      if (!navigator.serviceWorker.controller) {
        console.log("[Push Debug] Page not yet controlled by SW. Waiting for controller...");
        
        await new Promise((resolve) => {
          // Listen for the 'controllerchange' event (triggered by clients.claim() in sw.js)
          const handleControllerChange = () => {
             console.log("[Push Debug] Controller taken! Proceeding...");
             navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
             resolve();
          };
          navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
          
          // Fallback: If it takes too long (4s), we resolve anyway and let the error handling decide
          setTimeout(() => {
             console.warn("[Push Debug] Controller wait timed out. Checking status...");
             resolve(); 
          }, 4000);
        });
      }

      // 5. DOUBLE CHECK REGISTRATION STATE
      // Often after a controller change, the 'registration' variable is stale. We get it fresh.
      const freshReg = await navigator.serviceWorker.getRegistration();
      if (!freshReg || !freshReg.active) {
         throw new Error("Service Worker not active. Please reload the page.");
      }

      // 6. Subscribe
      console.log("[Push Debug] Converting VAPID key...");
      const convertedKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      
      console.log("[Push Debug] Calling pushManager.subscribe...");
      const subscription = await freshReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey
      });
      
      console.log("[Push Debug] Subscription object:", JSON.stringify(subscription));

      // 7. Send to Database
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
      
      console.log("[Push Debug] Success!");
      alert("You're all set! Notifications enabled. 🔔");
      return true;

    } catch (error) {
      console.error("[Push Debug] FATAL ERROR:", error);
      
      if (error.message && error.message.includes("not active")) {
          // If we are STILL stuck, the only guaranteed fix is a reload.
          const shouldReload = confirm("App setup incomplete. Reload now to finish?");
          if (shouldReload) window.location.reload();
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
