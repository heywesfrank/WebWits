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

  const waitUntilActive = async (registration) => {
    if (registration.active) return;
    
    // Check if there is a worker installing/waiting
    const waitingWorker = registration.installing || registration.waiting;
    if (!waitingWorker) {
        // If the browser says there is no worker, but we just registered, 
        // it usually means it's already active or redundant.
        if (registration.active) return;
        return;
    }

    addLog(`⏳ Monitoring worker state: ${waitingWorker.state}`);
    return new Promise((resolve) => {
        const interval = setInterval(() => {
            if (registration.active) {
                clearInterval(interval);
                resolve();
            }
        }, 100);

        const stateListener = () => {
             addLog(`ℹ️ Worker state changed: ${waitingWorker.state}`);
             if (waitingWorker.state === 'redundant') {
                 addLog("❌ Worker died (redundant). Script error.");
                 clearInterval(interval);
                 waitingWorker.removeEventListener('statechange', stateListener);
                 resolve(); 
             }
        };
        waitingWorker.addEventListener('statechange', stateListener);

        setTimeout(() => {
             if (!registration.active) {
                addLog("⚠️ Activation timeout (10s).");
                clearInterval(interval);
                waitingWorker.removeEventListener('statechange', stateListener);
                resolve();
             }
        }, 10000);
    });
  };

  const subscribe = async () => {
    setLogs([]);
    addLog("🚀 Starting Direct Registration Flow...");

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

      // 2. Direct File Check
      // We are now checking custom-sw.js ONLY
      try {
        const customCheck = await fetch('/custom-sw.js');
        if (!customCheck.ok) throw new Error(`custom-sw.js missing (${customCheck.status})`);
        addLog("✅ custom-sw.js is reachable.");
      } catch (e) {
        addLog(`❌ File check failed: ${e.message}`);
        throw new Error("Service Worker file missing.");
      }

      // 3. Register custom-sw.js DIRECTLY
      // Bypassing /sw.js prevents next-pwa conflicts
      const swUrl = `/custom-sw.js?v=${Date.now()}`;
      addLog(`Step 3: Registering ${swUrl}...`);
      
      let registration = await navigator.serviceWorker.register(swUrl);
      addLog("Registration call done.");

      // 4. Update & Self-Heal
      addLog("Step 4: Ensuring Freshness...");
      try {
        await registration.update();
      } catch (e) {
        addLog(`⚠️ Update failed: ${e.message}`);
        // If update failed, unregister and retry
        addLog("♻️ Unregistering...");
        await registration.unregister();
        addLog("♻️ Re-registering...");
        registration = await navigator.serviceWorker.register(swUrl);
      }
      
      // Monitor Activation
      await waitUntilActive(registration);

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
              setTimeout(() => resolve(), 4000); 
          });
      }

      // 6. Get Fresh Registration
      let freshReg = await navigator.serviceWorker.getRegistration();
      if (!freshReg || !freshReg.active) {
          // One last retry if the previous attempt got stuck
           addLog("⚠️ SW not active. Forcing re-register of custom-sw.js...");
           freshReg = await navigator.serviceWorker.register(swUrl);
           await waitUntilActive(freshReg);
      }

      if (!freshReg?.active) {
         throw new Error("Service Worker failed to activate. Check console.");
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
