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

      // --- STEP 2: Register ---
      // We register (or get existing registration)
      const registration = await navigator.serviceWorker.register('/sw.js');

      // --- STEP 3: Smart Wait for ACTIVE (Fail-Fast) ---
      // If it's already active, great.
      if (registration.active) {
          // Proceed immediately
      } else {
          // If not active, we poll for 4 seconds MAX.
          // We DO NOT use navigator.serviceWorker.ready because it causes the "hanging" issue.
          await new Promise((resolve, reject) => {
              let attempts = 0;
              const interval = setInterval(() => {
                  attempts++;
                  
                  // Check if it became active
                  if (registration.active) {
                      clearInterval(interval);
                      resolve();
                  } 
                  // If there is a waiting worker, we can try to skip waiting (optional optimization)
                  else if (registration.waiting) {
                      // It's stuck in waiting, but we'll let the timeout handle the rejection
                      // to keep logic simple.
                  }

                  // STOP after 4 seconds (40 attempts * 100ms)
                  if (attempts > 40) {
                      clearInterval(interval);
                      reject(new Error("Service Worker took too long to activate."));
                  }
              }, 100);
          });
      }

      // Double check just to be safe before calling subscribe
      if (!registration.active) {
          throw new Error("Service Worker not active. Please reload.");
      }

      // --- STEP 4: Subscribe ---
      const convertedKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey
      });

      // --- STEP 5: Save to Database ---
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
      
      if (error.message.includes("took too long") || error.message.includes("reload")) {
          alert("Updates installed! Please reload the app and try again.");
          // Optional: Force reload automatically
          // window.location.reload(); 
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
