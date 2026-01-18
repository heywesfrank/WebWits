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

  const waitUntilActive = async (registration) => {
    if (registration.active) return;
    
    const waitingWorker = registration.installing || registration.waiting;
    if (!waitingWorker) {
        if (registration.active) return;
        return;
    }

    return new Promise((resolve) => {
        const interval = setInterval(() => {
            if (registration.active) {
                clearInterval(interval);
                resolve();
            }
        }, 100);

        const stateListener = () => {
             if (waitingWorker.state === 'redundant') {
                 clearInterval(interval);
                 waitingWorker.removeEventListener('statechange', stateListener);
                 resolve(); 
             }
        };
        waitingWorker.addEventListener('statechange', stateListener);

        setTimeout(() => {
             if (!registration.active) {
                clearInterval(interval);
                waitingWorker.removeEventListener('statechange', stateListener);
                resolve();
             }
        }, 10000);
    });
  };

  const subscribe = async () => {
    try {
      setLoading(true);

      const isSecure = window.isSecureContext;
      const hasSW = 'serviceWorker' in navigator;
      const hasPush = 'PushManager' in window;
      
      if (!isSecure || !hasSW || !hasPush) {
        throw new Error("Push API not supported");
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error("Permission denied");
      }

      const customCheck = await fetch('/custom-sw.js');
      if (!customCheck.ok) throw new Error("SW missing");

      const swUrl = `/custom-sw.js?v=${Date.now()}`;
      
      let registration = await navigator.serviceWorker.register(swUrl);
      
      try {
        await registration.update();
      } catch (e) { }
      
      await waitUntilActive(registration);

      if (!navigator.serviceWorker.controller) {
          await new Promise(resolve => {
              const t = setTimeout(() => resolve(), 3000);
              const handler = () => {
                  clearTimeout(t);
                  navigator.serviceWorker.removeEventListener('controllerchange', handler);
                  resolve();
              }
              navigator.serviceWorker.addEventListener('controllerchange', handler);
          });
      }

      let freshReg = await navigator.serviceWorker.getRegistration();
      if (!freshReg?.active) {
           freshReg = await navigator.serviceWorker.register(swUrl);
           await waitUntilActive(freshReg);
      }
      
      if (!freshReg?.active) {
         throw new Error("SW activation failed");
      }

      if (!VAPID_PUBLIC_KEY) throw new Error("VAPID Key missing");
      
      const convertedKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      
      const subscription = await freshReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey
      });
      
      const res = await fetch('/api/web-push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription, user_id: userId }),
      });

      if (!res.ok) throw new Error("API subscribe failed");

      alert("Notifications enabled successfully!");
      return true;

    } catch (error) {
      console.error("Push Subscribe Error:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { subscribe, loading };
}
