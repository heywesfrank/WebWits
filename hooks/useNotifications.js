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

  // Helper: Wait for activation OR installation failure
  const waitUntilActive = async (registration) => {
    if (registration.active) return;

    // Look for the worker that is trying to install
    const waitingWorker = registration.installing || registration.waiting;
    
    if (!waitingWorker) {
        // If there's no worker at all, we can't wait for it
        addLog("⚠️ No waiting worker found to monitor.");
        return;
    }

    addLog(`⏳ Monitoring worker state: ${waitingWorker.state}`);

    return new Promise((resolve) => {
        // 1. Success Listener
        const interval = setInterval(() => {
            if (registration.active) {
                clearInterval(interval);
                resolve();
            }
        }, 100);

        // 2. Failure Listener (Redundant = Installation Failed)
        const stateListener = () => {
             addLog(`ℹ️ Worker state changed: ${waitingWorker.state}`);
             if (waitingWorker.state === 'redundant') {
                 addLog("❌ Worker died (redundant). Script error or install failed.");
                 clearInterval(interval);
                 waitingWorker.removeEventListener('statechange', stateListener);
                 resolve(); // Resolve to let the main flow handle the error
             }
        };
        waitingWorker.addEventListener('statechange', stateListener);

        // 3. Timeout (10 seconds)
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
    addLog("🚀 Starting Subscribe Flow (v4 - Cache Buster)...");

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

      // 2. File Integrity Check
      // We check BOTH files. If custom-sw.js is missing, importScripts will fail.
      try {
        const swCheck = await fetch('/sw.js');
        if (!swCheck.ok) throw new Error(`sw.js missing (${swCheck.status})`);
        
        const customCheck = await fetch('/custom-sw.js');
        if (!customCheck.ok) throw new Error(`custom-sw.js missing (${customCheck.status})`);
        
        addLog("✅ Both SW files are reachable.");
      } catch (e) {
        addLog(`❌ File check failed: ${e.message}`);
        throw new Error("Service Worker files missing. Cannot proceed.");
      }

      // 3. Register with Cache Busting
      // Adding ?v=TIMESTAMP forces the browser to ignore any broken cached versions
      const swUrl = `/sw.js?v=${Date.now()}`;
      addLog(`Step 3: Registering ${swUrl}...`);
      
      let registration = await navigator.serviceWorker.register(swUrl);
      addLog("Registration call done.");

      // 4. Update & Self-Heal
      addLog("Step 4: Checking status...");
      try {
        await registration.update();
      } catch (e) {
        addLog(`⚠️ Update failed: ${e.message}`);
        // If update failed, it's corrupt. Unregister.
        addLog("♻️ Unregistering corrupt SW...");
        await registration.unregister();
        
        addLog("♻️ Re-registering fresh...");
        registration = await navigator.serviceWorker.register(swUrl);
        await waitUntilActive(registration);
      }

      // 5. Controller Wait
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

      // 6. Fresh Reg Check
      let freshReg = await navigator.serviceWorker.getRegistration();
      if (!freshReg) {
          addLog("⚠️ Registration disappeared. Re-registering one last time...");
          freshReg = await navigator.serviceWorker.register(swUrl);
          await waitUntilActive(freshReg);
      } else if (!freshReg.active) {
          await waitUntilActive(freshReg);
      }

      // Final Status Check
      if (!freshReg?.active) {
         // If we are here, the worker died during install or timed out.
         throw new Error("Service Worker failed to install. Check console for script errors.");
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
      // Don't alert "Error" if it's just the reload prompt
      if (!error.message.includes("reload")) {
          alert("Error: " + error.message);
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { subscribe, loading, logs };
}
