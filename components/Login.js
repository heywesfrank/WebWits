"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AlertCircle, Mail, Sparkles, KeyRound, ArrowRight, Bell } from "lucide-react"; // [!code ++] Added Bell icon for visual feedback
import HowToPlayButton from "./HowToPlayButton";
import PrizesButton from "./PrizesButton";

// [!code ++] 1. Add VAPID helpers at the top
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

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  // ... handleSendCode stays the same ...
  const handleSendCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setInfoMsg("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setInfoMsg("Check your email for the code!");
      setShowOtpInput(true);
    }
    setLoading(false);
  };

  // [!code ++] 2. The Auto-Subscribe Helper
  const subscribeToPush = async (userId) => {
    // Basic checks
    if (!('serviceWorker' in navigator)) return;
    if (!VAPID_PUBLIC_KEY) {
        console.warn("VAPID Key missing");
        return;
    }

    try {
      // 1. Wait for Service Worker
      const registration = await navigator.serviceWorker.ready;

      // 2. Request Subscription (Triggers the browser popup)
      // Since this is called inside the async flow of the button click, 
      // most browsers will still accept it as a user gesture.
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      // 3. Save to DB
      await fetch('/api/web-push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          subscription, 
          user_id: userId 
        }),
      });
      
      console.log("Subscribed to push!");
    } catch (err) {
      console.error("Push subscription failed:", err);
      // We do NOT block login if this fails (e.g. user denies permission)
    }
  };

  // [!code warning] 3. Updated Verification Handler
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    // A. Verify the User
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email'
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      setInfoMsg("Success! Entering the arena...");
      
      // [!code ++] B. Trigger Subscription using the new User ID
      if (data?.session?.user?.id) {
          await subscribeToPush(data.session.user.id);
      }

      // C. Redirect
      router.push("/");
      router.refresh();
    }
  };

  return (
     // ... JSX remains exactly the same ...
     <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4 text-gray-900">
      <div className="w-full max-w-md bg-white border border-gray-200 p-8 rounded-2xl shadow-2xl">
        {/* ... Logo Section ... */}
        
        {/* ... OTP FORM ... */}
        {showOtpInput ? (
          <form onSubmit={handleVerifyOtp} className="...">
             {/* ... Inputs ... */}
             
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold p-3 rounded-lg transition-all ..."
            >
              {loading ? "Entering..." : (
                <><span>Enter Arena</span><ArrowRight size={18} /></>
              )}
            </button>
            
            {/* ... Back Button ... */}
          </form>
        ) : (
          /* ... Email Form ... */
           <form onSubmit={handleSendCode} className="flex flex-col gap-5">
             {/* ... */}
           </form>
        )}
        
        {/* ... Footer Buttons ... */}
      </div>
    </div>
  );
}
