"use client";
import { useState, useEffect } from "react";
import { Download, X, Ban, ShieldAlert } from "lucide-react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    const inStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    setIsStandalone(inStandalone);

    // Check for iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);

    // Listen for PWA install event
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
    // Close the modal after the attempt
    setShowModal(false);
  };

  // If installed or not supported (and not iOS), don't show anything
  if (isStandalone) return null;
  if (!isIOS && !deferredPrompt) return null;

  return (
    <>
      {/* Trigger Button */}
      <button 
        onClick={() => setShowModal(true)}
        className="flex items-center gap-1.5 text-yellow-800 hover:text-yellow-600 font-bold text-sm transition-colors whitespace-nowrap active:opacity-70"
      >
        <Download size={16} />
        <span>Download Free</span>
      </button>

      {/* Thrashing Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white border border-gray-200 shadow-2xl rounded-2xl p-6 relative animate-in zoom-in-95 duration-200">
            
            {/* Close Button */}
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors"
            >
              <X size={20} />
            </button>

            <div className="text-center space-y-4 pt-2">
              {/* Icon */}
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Ban size={32} className="text-red-500" />
              </div>

              {/* Header */}
              <h2 className="text-2xl font-black text-gray-900 font-display leading-tight">
                The App Store is a <span className="text-red-500">Scam.</span>
              </h2>

              {/* Witty Body Text */}
              <div className="text-gray-600 text-sm space-y-3 leading-relaxed">
                <p>
                  Why let them take 30%? We built WebWits for the <strong className="text-gray-900">open web</strong>. 
                </p>
                <p>
                  No walled gardens. No "review" delays. No corporate overlords telling us we aren't funny enough.
                </p>
                <p className="italic text-xs text-gray-500 bg-gray-50 p-2 rounded-lg border border-gray-100">
                  "It's basically illegal to be this free."
                </p>
              </div>

              {/* Action Button */}
              <button 
                onClick={handleInstall}
                className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4"
              >
                <Download size={20} />
                <span>Install the "Rebel" App</span>
              </button>
              
              <p className="text-[10px] text-gray-400 font-medium">
                (It's safe. It's just a PWA. We promise.)
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
