"use client";
import { useState } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { Bell, BellRing, X } from "lucide-react";

export default function NotificationModal({ session, isOpen, onClose }) {
  const { subscribe, loading } = useNotifications(session?.user?.id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEnable = async () => {
    setIsSubmitting(true);
    const success = await subscribe();
    setIsSubmitting(false);
    
    if (success) {
      // Small delay so user can see the button state change before closing
      setTimeout(() => onClose(), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white border border-gray-200 shadow-2xl rounded-2xl p-6 relative animate-in zoom-in-95 duration-200 flex flex-col">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center space-y-4 pt-2 mb-4">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
            <BellRing size={32} className="text-yellow-600" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-black text-gray-900 font-display">
              Enable Notifications
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Never miss a battle.
            </p>
          </div>

          <button 
            onClick={handleEnable}
            disabled={loading || isSubmitting}
            className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3.5 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {loading || isSubmitting ? (
              <span>Connecting...</span>
            ) : (
              <>
                <Bell size={20} />
                <span>Enable Now</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
