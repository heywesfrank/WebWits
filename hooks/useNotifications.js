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
    // Log to console so you can inspect via remote debugging if needed
    console.log(`[PushLog] ${msg}`); 
    setLogs(prev => [...prev, `[${timestamp}] ${msg}`]);
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
    setLogs([]); // Clear previous attempts
    addLog("🕵️ STARTING DEEP DEBUG...");

    try {
      setLoading(true);

      // --- CHECK 1: ENVIRONMENT ---
      const isSecure = window.isSecureContext;
      const hasSW = 'serviceWorker' in navigator;
      const hasPush = 'PushManager' in window;
      
      addLog(`Environment: Secure=${isSecure}, SW=${hasSW}, Push=${hasPush}`);

      if (!isSecure) {
        throw new Error("❌ Insecure Context. HTTPS required.");
      }
      if (!hasSW || !hasPush) {
        throw new Error("❌ Push API not supported in this browser engine.");
      }

      // --- CHECK 2: CURRENT STATE ---
      // What does the browser *think* the permission is right now?
      const currentPerm = Notification.permission;
      addLog(`Current 'Notification.permission': ${currentPerm}`);

      // Try the advanced Permissions Query API (gives more detail than Notification.permission)
      if (navigator.permissions && navigator.permissions.query) {
        try {
            const queryStatus = await navigator.permissions.query({ name: 'notifications' });
            addLog(`🔎 Navigator Query Status: ${queryStatus.state}`);
        } catch (qErr) {
            addLog(`⚠️ Permission Query failed: ${qErr.message}`);
        }
      }

      // --- CHECK 3: REQUEST PERMISSION ---
      addLog("🚀 Calling Notification.requestPermission()...");
      
      const permission = await Notification.requestPermission();
      addLog(`📢 Request Result: ${permission}`);

      if (permission === 'denied') {
        throw new Error("❌ Browser explicitly DENIED permission. (Check 'Sites and Downloads' in Samsung Internet settings again)");
      }
      if (permission === 'default') {
        throw new Error("⚠️ Permission ignored/dismissed (Result: default).");
      }
      if (permission !== 'granted') {
        throw new Error(`❌ Unknown permission state: ${permission}`);
      }

      // --- CHECK 4: SW REGISTRATION ---
      // Only proceed if permission passed
      addLog("✅ Permission Granted. Checking Service Worker...");
      
      // Direct File Check
      try {
        const customCheck = await fetch('/custom-sw.js');
        if (!customCheck.ok) throw new Error(`custom-sw.js missing (${customCheck.status})`);
        addLog("✅ custom-sw.js is reachable.");
      } catch (e) {
        addLog(`❌ File check failed: ${e.message}`);
        throw new Error("Service Worker file missing.");
      }

      // Register custom-sw.js
      const swUrl = `/custom-sw.js?v=${Date.now()}`;
      addLog(`Registering ${swUrl}...`);
      
      let registration = await navigator.serviceWorker.register(swUrl);
      addLog("Registration call done.");

      // Update
      try {
        await registration.update();
      } catch (e) {
        addLog(`⚠️ Update failed (non-fatal): ${e.message}`);
      }
      
      await waitUntilActive(registration);

      // 5. Controller Wait
      if (!navigator.serviceWorker.controller) {
          addLog("⏳ Waiting for controller...");
          await new Promise(resolve => {
              // Timeout safety
              const t = setTimeout(() => {
                addLog("⚠️ Controller wait timed out. Proceeding anyway...");
                resolve();
              }, 3000);

              const handler = () => {
                  addLog("✅ Controller taken!");
                  clearTimeout(t);
                  navigator.serviceWorker.removeEventListener('controllerchange', handler);
                  resolve();
              }
              navigator.serviceWorker.addEventListener('controllerchange', handler);
          });
      }

      // 6. Get Fresh Registration
      let freshReg = await navigator.serviceWorker.getRegistration();
      if (!freshReg?.active) {
           addLog("⚠️ SW not active. Retrying registration...");
           freshReg = await navigator.serviceWorker.register(swUrl);
           await waitUntilActive(freshReg);
      }
      
      if (!freshReg?.active) {
         throw new Error("Service Worker failed to activate.");
      }

      // 7. Subscribe
      addLog("Generating keys...");
      if (!VAPID_PUBLIC_KEY) throw new Error("VAPID Key is missing from env");
      
      const convertedKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      
      addLog("Attempting pushManager.subscribe...");
      const subscription = await freshReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey
      });
      
      // 8. DB Call
      addLog("Saving to DB...");
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
      addLog(`🛑 FATAL: ${error.message}`);
      // Don't alert here so you can read the logs in the modal
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { subscribe, loading, logs };
}
