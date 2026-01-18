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
      // Updated to look like a text link: Dark Blue text (yellow-800), no background
      className="flex items-center gap-1.5 text-yellow-800 hover:text-yellow-600 font-bold text-sm transition-colors whitespace-nowrap active:opacity-70"
    >
      <Download size={16} />
      <span className="underline underline-offset-2">Download Free</span>
    </button>
  );
}
