"use client";
import { useState, useEffect } from "react";
import { Download, Share, PlusSquare } from "lucide-react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true); // Default to true to prevent flicker

  useEffect(() => {
    // 1. Check if already installed (Standalone mode)
    const inStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    setIsStandalone(inStandalone);

    // 2. Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);

    // 3. Listen for Android/Desktop install event
    const handler = (e) => {
      e.preventDefault(); // Prevent Chrome's mini-infobar
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Android / Desktop Chrome
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      // iOS doesn't support programmatic install
      alert("📲 To install on iOS:\n\n1. Tap the 'Share' icon (square with arrow)\n2. Scroll down and tap 'Add to Home Screen'");
    }
  };

  // Don't render if already installed
  if (isStandalone) return null;

  // Don't render if not iOS and no prompt available (e.g. unsupported browser)
  if (!isIOS && !deferredPrompt) return null;

  return (
    <button 
      onClick={handleInstall}
      className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-200 px-3 py-1.5 rounded-full transition-all active:scale-95"
    >
      <Download size={14} className="text-gray-600" />
      <span className="text-xs font-bold text-gray-700 whitespace-nowrap">
        App
      </span>
    </button>
  );
}
