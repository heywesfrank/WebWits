import { useState } from 'react';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
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
    // Basic check for browser support
    if (!('serviceWorker' in navigator)) return;
    if (!userId) return;

    try {
      setLoading(true);
      // Wait for the service worker to be ready
      const registration = await navigator.serviceWorker.ready;

      // 1. DIRECT request to the browser/PWA (Requires User Gesture)
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      // 2. Save to your Supabase DB
      const res = await fetch('/api/web-push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription, user_id: userId }),
      });

      if (!res.ok) throw new Error('Failed to sync with server');
      
      // Return true to indicate success
      return true;
    } catch (error) {
      console.error("PWA Subscription Error:", error);
      // Determine if it was a permission denied error
      if (Notification.permission === 'denied') {
        alert("Notifications are blocked. Please enable them in your device settings.");
      } else {
        alert("Could not enable notifications. Please try again.");
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { subscribe, loading };
}
