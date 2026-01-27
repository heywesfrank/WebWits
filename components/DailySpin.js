"use client";
import { useState, useEffect } from "react";
import { X, Sparkles, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DailySpin({ session, userProfile, onSpinComplete }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [prize, setPrize] = useState(null);
  const [rotation, setRotation] = useState(0);

  // Check availability on load
  useEffect(() => {
    if (userProfile && session) {
      const today = new Date().toISOString().split('T')[0];
      if (userProfile.last_spin_date !== today) {
        // Add a small delay so it doesn't pop up instantly over other UI
        setTimeout(() => setIsOpen(true), 1000);
      }
    }
  }, [userProfile, session]);

  const handleSpin = async () => {
    if (isSpinning) return;
    setIsSpinning(true);

    try {
      const res = await fetch('/api/daily-spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id })
      });
      
      const data = await res.json();

      if (data.success) {
        // Visual Spin Logic
        // We want to land on the specific section. 
        // 4 Segments: 5 (0-90), 10 (90-180), 25 (180-270), 50 (270-360)
        // Note: CSS Rotation adds up.
        
        let targetDeg = 0;
        // Random variance within the wedge so it doesn't always land dead center
        const variance = Math.floor(Math.random() * 60) + 15; 
        
        if (data.prize === 5) targetDeg = 45;   // Top Right
        if (data.prize === 10) targetDeg = 315; // Top Left (counter-clockwise logic in visual)
        if (data.prize === 25) targetDeg = 225; // Bottom Left
        if (data.prize === 50) targetDeg = 135; // Bottom Right

        // Add 5 full rotations (1800 deg) + target
        const finalRotation = 1800 + (360 - targetDeg) + variance;
        
        setRotation(finalRotation);

        // Wait for animation to finish (3 seconds)
        setTimeout(() => {
          setPrize(data.prize);
          setIsSpinning(false);
          if (onSpinComplete) onSpinComplete(data.newTotal);
        }, 3000);

      } else {
        alert("Error: " + data.message);
        setIsSpinning(false);
      }
    } catch (e) {
      console.error(e);
      setIsSpinning(false);
    }
  };

  const close = () => {
    setIsOpen(false);
    setPrize(null);
    setRotation(0);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className="bg-white w-full max-w-sm rounded-3xl p-6 relative shadow-2xl overflow-hidden border-4 border-yellow-400"
          >
            <button onClick={close} className="absolute top-4 right-4 text-gray-400 hover:text-black z-20">
              <X size={24} />
            </button>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-gray-900 font-display uppercase tracking-widest">
                Daily Spin
              </h2>
              <p className="text-yellow-600 font-bold text-sm">Win Credits!</p>
            </div>

            {/* THE WHEEL */}
            <div className="relative w-64 h-64 mx-auto mb-8">
              {/* Pointer */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                 <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-red-500 filter drop-shadow-md"></div>
              </div>

              {/* Rotating Disc */}
              <div 
                 className="w-full h-full rounded-full border-4 border-gray-900 shadow-xl overflow-hidden relative transition-transform cubic-bezier(0.25, 0.1, 0.25, 1)"
                 style={{ 
                   transform: `rotate(${rotation}deg)`,
                   transitionDuration: isSpinning ? '3s' : '0s'
                 }}
              >
                 {/* Conic Gradient for colored slices */}
                 <div 
                   className="w-full h-full absolute inset-0"
                   style={{
                     background: `conic-gradient(
                       #38bdf8 0% 25%, 
                       #fbbf24 25% 50%, 
                       #f472b6 50% 75%, 
                       #a3e635 75% 100%
                     )`
                   }}
                 />
                 
                 {/* Slice Lines & Labels */}
                 <div className="absolute inset-0">
                    {/* Horizontal Line */}
                    <div className="absolute top-1/2 w-full h-1 bg-gray-900/20 -translate-y-1/2"></div>
                    {/* Vertical Line */}
                    <div className="absolute left-1/2 h-full w-1 bg-gray-900/20 -translate-x-1/2"></div>
                    
                    {/* Labels (Positioned absolutely based on the gradient quadrants) */}
                    <span className="absolute top-[20%] right-[20%] text-white font-black text-xl drop-shadow-md">5</span>
                    <span className="absolute bottom-[20%] right-[20%] text-white font-black text-xl drop-shadow-md">10</span>
                    <span className="absolute bottom-[20%] left-[20%] text-white font-black text-xl drop-shadow-md">25</span>
                    <span className="absolute top-[20%] left-[20%] text-white font-black text-xl drop-shadow-md">50</span>
                 </div>
              </div>
            </div>

            {/* RESULTS OR BUTTON */}
            <div className="text-center h-16">
              {prize ? (
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1.1, opacity: 1 }}
                  className="space-y-1"
                >
                  <div className="text-3xl font-black text-yellow-500 flex items-center justify-center gap-2">
                    <Sparkles className="fill-yellow-500" /> +{prize}
                  </div>
                  <button onClick={close} className="text-sm font-bold text-gray-400 hover:text-gray-600 underline">
                    Awesome, close this
                  </button>
                </motion.div>
              ) : (
                <button 
                  onClick={handleSpin}
                  disabled={isSpinning}
                  className="w-full bg-black text-white font-bold py-4 rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                  {isSpinning ? "Spinning..." : "SPIN NOW"}
                </button>
              )}
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
