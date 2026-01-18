"use client";
import { useState, useEffect } from "react";
import { Download } from "lucide-react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);

  useEffect(() => {
    const inStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    setIsStandalone(inStandalone);

    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      alert("📲 To install on iOS:\n\n1. Tap the 'Share' icon (square with arrow)\n2. Scroll down and tap 'Add to Home Screen'");
    }
  };

  if (isStandalone) return null;
  if (!isIOS && !deferredPrompt) return null;

  return (
    <button 
      onClick={handleInstall}
      // Matches the "Sign Up/Login" button style exactly
      className="bg-yellow-400 text-white px-3 py-2 rounded-lg font-bold text-sm hover:bg-yellow-300 transition-colors shadow-sm whitespace-nowrap flex items-center gap-2"
    >
      <Download size={16} />
      <span>Download Free</span>
    </button>
  );
}
