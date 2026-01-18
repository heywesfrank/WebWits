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
    console.log("🚀 [PUSH LOG] Starting Subscribe Flow for user:", userId);

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.error("❌ [PUSH LOG] Browser not supported");
      alert("Browser not supported");
      return false;
    }

    if (!VAPID_PUBLIC_KEY) {
      console.error("❌ [PUSH LOG] Missing VAPID Key");
      alert("Missing Configuration");
      return false;
    }

    try {
      setLoading(true);

      // 1. Permission
      console.log("🔍 [PUSH LOG] Checking permission...");
      const permission = await Notification.requestPermission();
      console.log("✅ [PUSH LOG] Permission status:", permission);
      
      if (permission !== 'granted') {
        alert("Permission denied");
        return false;
      }

      // 2. Register
      console.log("🔍 [PUSH LOG] Registering SW...");
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log("✅ [PUSH LOG] Registration found:", registration);

      // 3. Update & Wait for Controller
      console.log("🔍 [PUSH LOG] Forcing update...");
      await registration.update();
      
      if (!navigator.serviceWorker.controller) {
          console.log("⏳ [PUSH LOG] No controller. Waiting for claim...");
          await new Promise(resolve => {
              const handler = () => {
                  console.log("✅ [PUSH LOG] Controller taken!");
                  navigator.serviceWorker.removeEventListener('controllerchange', handler);
                  resolve();
              }
              navigator.serviceWorker.addEventListener('controllerchange', handler);
              setTimeout(() => {
                  console.warn("⚠️ [PUSH LOG] Controller wait timeout (4s). Proceeding anyway.");
                  resolve();
              }, 4000);
          });
      } else {
          console.log("✅ [PUSH LOG] Controller active.");
      }

      // 4. Get Fresh Registration
      const freshReg = await navigator.serviceWorker.getRegistration();
      if (!freshReg || !freshReg.active) {
          throw new Error("Service Worker not active. Reload required.");
      }

      // 5. Subscribe
      console.log("🔍 [PUSH LOG] Subscribing via PushManager...");
      const convertedKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const subscription = await freshReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey
      });
      console.log("✅ [PUSH LOG] Subscription Object generated:", JSON.stringify(subscription));

      // 6. DB Call
      console.log("🔍 [PUSH LOG] Sending to DB...");
      const res = await fetch('/api/web-push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription, user_id: userId }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("❌ [PUSH LOG] DB Error Response:", text);
        throw new Error(`DB Error: ${text}`);
      }

      console.log("🎉 [PUSH LOG] SUCCESS! Saved to DB.");
      alert("Notifications enabled successfully!");
      return true;

    } catch (error) {
      console.error("❌ [PUSH LOG] FATAL ERROR:", error);
      if (error.message.includes("not active") || error.message.includes("Reload")) {
          const reload = confirm("Setup incomplete. Reload now to finish?");
          if (reload) window.location.reload();
      } else {
          alert("Error: " + error.message);
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { subscribe, loading };
}
