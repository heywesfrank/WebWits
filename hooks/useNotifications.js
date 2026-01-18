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
  const [logs, setLogs] = useState([]);

  const addLog = (msg) => {
    const timestamp = new Date().toLocaleTimeString();
    const logLine = `[${timestamp}] ${msg}`;
    console.log(logLine);
    setLogs(prev => [...prev, logLine]);
  };

  const subscribe = async () => {
    setLogs([]);
    addLog("🚀 Starting Subscribe Flow...");

    // Check Support
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      addLog("❌ Browser not supported");
      return false;
    }
    if (!VAPID_PUBLIC_KEY) {
      addLog("❌ Missing VAPID Key");
      return false;
    }

    try {
      setLoading(true);

      // 1. Permission
      const permission = await Notification.requestPermission();
      addLog(`Permission: ${permission}`);
      if (permission !== 'granted') throw new Error("Permission denied");

      // 2. Pre-Check: Does sw.js actually exist?
      // This prevents the "Unknown: Not found" error by failing fast if the server is offline
      try {
        const check = await fetch('/sw.js');
        if (!check.ok) throw new Error(`sw.js not found (Status: ${check.status})`);
        addLog("✅ sw.js is reachable");
      } catch (e) {
        addLog(`⚠️ warning: sw.js check failed: ${e.message}`);
      }

      // 3. Register
      addLog("Step 3: Registering SW...");
      let registration = await navigator.serviceWorker.register('/sw.js');
      addLog("Registration done.");

      // 4. Update Strategy (Self-Healing)
      addLog("Step 4: Updating...");
      try {
        await registration.update();
      } catch (e) {
        addLog(`⚠️ Update failed: ${e.message}`);
        // If update fails, the registration might be corrupt. We unregister and retry.
        if (e.message.includes("Not found") || e.message.includes("Unknown")) {
            addLog("♻️ Corrupt registration detected. Unregistering...");
            await registration.unregister();
            addLog("♻️ Re-registering fresh...");
            registration = await navigator.serviceWorker.register('/sw.js');
        }
      }

      // 5. Wait for Controller
      if (!navigator.serviceWorker.controller) {
          addLog("⏳ Waiting for controller...");
          await new Promise(resolve => {
              const handler = () => {
                  addLog("✅ Controller taken!");
                  navigator.serviceWorker.removeEventListener('controllerchange', handler);
                  resolve();
              }
              navigator.serviceWorker.addEventListener('controllerchange', handler);
              setTimeout(() => resolve(), 3000); // 3s timeout
          });
      }

      // 6. Get Fresh Registration (with Fallback)
      let freshReg = await navigator.serviceWorker.getRegistration();
      if (!freshReg) {
          addLog("⚠️ Registration disappeared! Forcing re-register...");
          freshReg = await navigator.serviceWorker.register('/sw.js');
      }

      if (!freshReg.active) {
         // One last check: if we just registered, it might be installing.
         // We'll trust that pushManager.subscribe will wait if needed.
         addLog("⚠️ SW not active yet, but proceeding to subscribe...");
      }

      // 7. Subscribe
      addLog("Step 7: Subscribing...");
      const convertedKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const subscription = await freshReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey
      });
      
      // 8. DB Call
      addLog("Step 8: Saving to DB...");
      const res = await fetch('/api/web-push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription, user_id: userId }),
      });

      if (!res.ok) throw new Error(await res.text());

      addLog("🎉 SUCCESS!");
      alert("Notifications enabled successfully!");
      return true;

    } catch (error) {
      addLog(`❌ ERROR: ${error.message}`);
      alert("Error: " + error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { subscribe, loading, logs };
}
