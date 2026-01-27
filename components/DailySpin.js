"use client";
import { useState, useEffect } from "react";
import { X, Sparkles, Trophy } from "lucide-react";
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
        setTimeout(() => setIsOpen(true), 1500);
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
        // Wheel Configuration (8 Segments)
        // 0: 5 Credits (0-45deg)
        // 1: 10 Credits (45-90deg)
        // 2: 5 Credits (90-135deg)
        // 3: 25 Credits (135-180deg)
        // 4: 5 Credits (180-225deg)
        // 5: 10 Credits (225-270deg)
        // 6: 5 Credits (270-315deg)
        // 7: 50 Credits (315-360deg)
        
        const segments = [
            { id: 0, val: 5 }, { id: 1, val: 10 }, { id: 2, val: 5 }, { id: 3, val: 25 },
            { id: 4, val: 5 }, { id: 5, val: 10 }, { id: 6, val: 5 }, { id: 7, val: 50 }
        ];

        // Find all segments that match the winning prize
        const possibleSegments = segments.filter(s => s.val === data.prize);
        
        // Pick one random segment from the matching ones
        const targetSegment = possibleSegments[Math.floor(Math.random() * possibleSegments.length)];
        
        // Calculate Angle
        // Each segment is 45 degrees. Center of segment is (id * 45) + 22.5
        const segmentCenter = (targetSegment.id * 45) + 22.5;
        
        // Random variance +/- 15 deg to feel natural
        const variance = Math.floor(Math.random() * 30) - 15;
        
        // Target rotation: We want the segment at the TOP (0 deg or 360).
        // If the wheel rotates clockwise, we need to subtract the segment position.
        // Add 5 full spins (1800) + alignment calculation.
        const finalRotation = 1800 + (360 - segmentCenter) + variance;
        
        setRotation(finalRotation);

        // Wait for animation to finish (4 seconds easing)
        setTimeout(() => {
          setPrize(data.prize);
          setIsSpinning(false);
          if (onSpinComplete) onSpinComplete(data.newTotal);
        }, 4000);

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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-white w-full max-w-sm rounded-3xl p-6 relative shadow-2xl overflow-hidden border border-gray-200"
          >
            <button onClick={close} className="absolute top-4 right-4 text-gray-400 hover:text-black z-20">
              <X size={24} />
            </button>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-gray-900 font-display">
                Daily Spin
              </h2>
              <p className="text-gray-500 font-medium text-sm">Test your luck, win credits.</p>
            </div>

            {/* THE WHEEL CONTAINER */}
            <div className="relative w-72 h-72 mx-auto mb-8">
              {/* Pointer Triangle */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                 <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[24px] border-t-yellow-600 filter drop-shadow-md"></div>
              </div>

              {/* Rotating Disc */}
              <div 
                 className="w-full h-full rounded-full border-4 border-white shadow-[0_0_30px_rgba(0,0,0,0.1)] overflow-hidden relative transition-transform"
                 style={{ 
                   transform: `rotate(${rotation}deg)`,
                   transition: isSpinning ? 'transform 4s cubic-bezier(0.2, 0, 0.2, 1)' : 'none'
                 }}
              >
                 {/* CSS Conic Gradient for 8 Slices */}
                 <div 
                   className="w-full h-full absolute inset-0"
                   style={{
                     background: `conic-gradient(
                       #f0f9ff 0deg 45deg,   
                       #e0f2fe 45deg 90deg,  
                       #f0f9ff 90deg 135deg, 
                       #bae6fd 135deg 180deg, 
                       #f0f9ff 180deg 225deg, 
                       #e0f2fe 225deg 270deg, 
                       #f0f9ff 270deg 315deg, 
                       #0ea5e9 315deg 360deg  
                     )`
                   }}
                 />
                 
                 {/* Labels */}
                 <div className="absolute inset-0 font-display font-black text-gray-700 select-none">
                    {/* 0: 5 (Top Right) */}
                    <span className="absolute top-[12%] right-[38%] rotate-[22.5deg] text-lg">5</span>
                    
                    {/* 1: 10 (Right Top) */}
                    <span className="absolute top-[35%] right-[12%] rotate-[67.5deg] text-lg">10</span>
                    
                    {/* 2: 5 (Right Bottom) */}
                    <span className="absolute bottom-[35%] right-[12%] rotate-[112.5deg] text-lg">5</span>

                    {/* 3: 25 (Bottom Right) */}
                    <span className="absolute bottom-[12%] right-[38%] rotate-[157.5deg] text-xl text-yellow-600">25</span>

                    {/* 4: 5 (Bottom Left) */}
                    <span className="absolute bottom-[12%] left-[38%] rotate-[202.5deg] text-lg">5</span>

                    {/* 5: 10 (Left Bottom) */}
                    <span className="absolute bottom-[35%] left-[12%] rotate-[247.5deg] text-lg">10</span>

                    {/* 6: 5 (Left Top) */}
                    <span className="absolute top-[35%] left-[12%] rotate-[292.5deg] text-lg">5</span>

                    {/* 7: 50 (Top Left - RARE) */}
                    <span className="absolute top-[12%] left-[38%] rotate-[337.5deg] text-2xl text-white drop-shadow-sm">50</span>
                 </div>

                 {/* Inner Center Circle */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full shadow-inner flex items-center justify-center border border-gray-100 z-10">
                    <Trophy size={24} className="text-yellow-400" />
                 </div>
              </div>
            </div>

            {/* RESULTS OR BUTTON */}
            <div className="text-center h-20 flex items-center justify-center">
              {prize ? (
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1.1, opacity: 1 }}
                  className="space-y-2"
                >
                  <div className="text-4xl font-black text-yellow-500 flex items-center justify-center gap-2 font-display">
                    <Sparkles className="fill-yellow-500" /> +{prize}
                  </div>
                  <button onClick={close} className="text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-wider">
                    Claim & Close
                  </button>
                </motion.div>
              ) : (
                <button 
                  onClick={handleSpin}
                  disabled={isSpinning}
                  className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black text-lg py-4 rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
                >
                  {isSpinning ? "SPINNING..." : "SPIN TO WIN"}
                </button>
              )}
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
