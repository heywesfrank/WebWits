"use client";
import { useState } from 'react';
import { Bell } from 'lucide-react';

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

export default function PushRequest({ userId }) {
  const [loading, setLoading] = useState(false);

  const subscribe = async () => {
    if (!('serviceWorker' in navigator)) return alert('Not supported on this device');
    setLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      await fetch('/api/web-push/subscribe', {
        method: 'POST',
        body: JSON.stringify({ subscription, user_id: userId }),
      });

      alert("Notifications enabled! 🔔");
    } catch (e) {
      console.error(e);
      alert("Could not enable notifications. Try checking browser settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={subscribe} disabled={loading} className="flex items-center gap-2 bg-yellow-400 text-black px-4 py-2 rounded-lg font-bold text-xs mt-4">
      <Bell size={16} /> {loading ? "Enabling..." : "Enable Notifications"}
    </button>
  );
}
