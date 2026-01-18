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
  const [logs, setLogs] = useState([]); // [!code ++] New Log State

  // Helper to add logs to state and console simultaneously
  const addLog = (msg) => {
    const timestamp = new Date().toLocaleTimeString();
    const logLine = `[${timestamp}] ${msg}`;
    console.log(logLine);
    setLogs(prev => [...prev, logLine]);
  };

  const subscribe = async () => {
    setLogs([]); // Clear previous logs on new attempt
    addLog("🚀 Starting Subscribe Flow...");
    addLog(`User ID: ${userId || 'Missing'}`);

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      addLog("❌ Browser not supported (No SW or PushManager)");
      alert("Browser not supported");
      return false;
    }

    if (!VAPID_PUBLIC_KEY) {
      addLog("❌ Missing VAPID Key in env vars");
      alert("Missing Configuration");
      return false;
    }

    try {
      setLoading(true);

      // 1. Permission
      addLog("Step 1: Checking permission...");
      const permission = await Notification.requestPermission();
      addLog(`Permission status: ${permission}`);
      
      if (permission !== 'granted') {
        addLog("❌ Permission denied by user");
        alert("Permission denied");
        return false;
      }

      // 2. Register
      addLog("Step 2: Registering SW...");
      const registration = await navigator.serviceWorker.register('/sw.js');
      addLog(`Registration found. Scope: ${registration.scope}`);

      // 3. Update & Wait for Controller
      addLog("Step 3: Forcing update & checking controller...");
      try {
        await registration.update();
      } catch(e) {
        addLog(`⚠️ Update warning: ${e.message}`);
      }
      
      if (!navigator.serviceWorker.controller) {
          addLog("⏳ No controller yet. Waiting for 'controllerchange'...");
          await new Promise(resolve => {
              const handler = () => {
                  addLog("✅ Controller taken!");
                  navigator.serviceWorker.removeEventListener('controllerchange', handler);
                  resolve();
              }
              navigator.serviceWorker.addEventListener('controllerchange', handler);
              setTimeout(() => {
                  addLog("⚠️ Controller wait timed out (4s). Proceeding...");
                  resolve();
              }, 4000);
          });
      } else {
          addLog("✅ Controller already active.");
      }

      // 4. Get Fresh Registration
      addLog("Step 4: Getting fresh registration...");
      const freshReg = await navigator.serviceWorker.getRegistration();
      if (!freshReg) throw new Error("Registration disappeared!");
      if (!freshReg.active) {
          addLog("❌ SW found but not .active property");
          throw new Error("Service Worker not active. Reload required.");
      }
      addLog("✅ Active Worker confirmed.");

      // 5. Subscribe
      addLog("Step 5: Subscribing via PushManager...");
      const convertedKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const subscription = await freshReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey
      });
      addLog("✅ Subscription Object generated.");

      // 6. DB Call
      addLog("Step 6: Sending to DB...");
      const res = await fetch('/api/web-push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription, user_id: userId }),
      });

      if (!res.ok) {
        const text = await res.text();
        addLog(`❌ DB Error Response: ${res.status} ${text}`);
        throw new Error(`DB Error: ${text}`);
      }

      addLog("🎉 SUCCESS! Saved to DB.");
      alert("Notifications enabled successfully!");
      return true;

    } catch (error) {
      addLog(`❌ FATAL ERROR: ${error.message}`);
      
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

  return { subscribe, loading, logs }; // [!code ++] Return logs here
}
