"use client";
import { useState, useRef, useEffect } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { Bell, BellRing, X, Terminal } from "lucide-react";

export default function NotificationModal({ session, isOpen, onClose }) {
  // [!code ++] Destructure logs from the hook
  const { subscribe, loading, logs } = useNotifications(session?.user?.id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const logEndRef = useRef(null);

  // Auto-scroll to bottom of logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleEnable = async () => {
    setIsSubmitting(true);
    const success = await subscribe();
    setIsSubmitting(false);
    
    if (success) {
      // Small delay so user can see the "Success" log before closing
      setTimeout(() => onClose(), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white border border-gray-200 shadow-2xl rounded-2xl p-6 relative animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        
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

        {/* --- [!code ++] DEBUG CONSOLE START --- */}
        {logs.length > 0 && (
          <div className="mt-2 flex-1 overflow-hidden flex flex-col">
             <div className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">
               <Terminal size={12} /> Debug Log
             </div>
             <div className="bg-gray-900 rounded-lg p-3 text-[10px] font-mono text-green-400 overflow-y-auto h-32 md:h-48 border border-gray-700 shadow-inner">
               {logs.map((log, i) => (
                 <div key={i} className="mb-1 border-b border-gray-800/50 pb-0.5 last:border-0 break-words">
                   {log}
                 </div>
               ))}
               <div ref={logEndRef} />
             </div>
          </div>
        )}
        {/* --- DEBUG CONSOLE END --- */}

      </div>
    </div>
  );
}
