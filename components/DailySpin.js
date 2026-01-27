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
        // Wheel Configuration (6 Segments - 60 degrees each)
        const segments = [
            { id: 0, val: 5 }, { id: 1, val: 10 }, { id: 2, val: 15 },
            { id: 3, val: 20 }, { id: 4, val: 25 }, { id: 5, val: 50 }
        ];

        // Find match
        const targetSegment = segments.find(s => s.val === data.prize);
        
        // Calculate Angle
        // Segment center is (id * 60) + 30
        const segmentCenter = (targetSegment.id * 60) + 30;
        
        // Random variance +/- 20 deg to feel natural (stay inside the 60deg slice)
        const variance = Math.floor(Math.random() * 40) - 20;
        
        // Target rotation: Top is 0/360.
        // We spin clockwise. We want segmentCenter to end up at 0.
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

  // Segments for rendering labels
  const wheelSegments = [
    { id: 0, val: 5, label: '5', color: '#CD7F32', text: 'white' },   // Bronze
    { id: 1, val: 10, label: '10', color: '#C0C0C0', text: 'gray-900' }, // Silver
    { id: 2, val: 15, label: '15', color: '#CD7F32', text: 'white' },   // Bronze
    { id: 3, val: 20, label: '20', color: '#C0C0C0', text: 'gray-900' }, // Silver
    { id: 4, val: 25, label: '25', color: '#D4AF37', text: 'white' },   // Gold
    { id: 5, val: 50, label: '50', color: '#FFD700', text: 'white' }    // Bright Gold
  ];

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
              <p className="text-gray-500 font-medium text-sm">
                Test your luck, win <strong className="text-amber-500">free</strong> credits.
              </p>
            </div>

            {/* THE WHEEL CONTAINER */}
            <div className="relative w-72 h-72 mx-auto mb-8">
              {/* Pointer Triangle */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                 <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[24px] border-t-amber-600 filter drop-shadow-md"></div>
              </div>

              {/* Rotating Disc */}
              <div 
                 className="w-full h-full rounded-full border-4 border-white shadow-[0_0_30px_rgba(0,0,0,0.1)] overflow-hidden relative transition-transform"
                 style={{ 
                   transform: `rotate(${rotation}deg)`,
                   transition: isSpinning ? 'transform 4s cubic-bezier(0.2, 0, 0.2, 1)' : 'none'
                 }}
              >
                 {/* CSS Conic Gradient for 6 Slices */}
                 <div 
                   className="w-full h-full absolute inset-0"
                   style={{
                     background: `conic-gradient(
                       #CD7F32 0deg 60deg,   
                       #C0C0C0 60deg 120deg,  
                       #CD7F32 120deg 180deg, 
                       #C0C0C0 180deg 240deg, 
                       #D4AF37 240deg 300deg, 
                       #FFD700 300deg 360deg  
                     )`
                   }}
                 />
                 
                 {/* Labels */}
                 <div className="absolute inset-0 select-none pointer-events-none">
                    {wheelSegments.map((seg) => (
                      <span
                        key={seg.id}
                        className={`absolute top-1/2 left-1/2 font-display font-black text-2xl ${seg.text === 'white' ? 'text-white drop-shadow-sm' : 'text-gray-900'}`}
                        style={{
                          // Center origin, Rotate to angle, Translate Outwards
                          // 30 is the offset to center in the 60deg slice
                          // translateY(-85px) pushes the number to the edge of the slice
                          transform: `translate(-50%, -50%) rotate(${seg.id * 60 + 30}deg) translateY(-85px)`
                        }}
                      >
                        {seg.label}
                      </span>
                    ))}
                 </div>

                 {/* Inner Center Circle */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full shadow-inner flex items-center justify-center border border-gray-100 z-10">
                    <Trophy size={24} className="text-amber-400" />
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
                  <div className="text-4xl font-black text-amber-500 flex items-center justify-center gap-2 font-display">
                    <Sparkles className="fill-amber-500" /> +{prize}
                  </div>
                  <button onClick={close} className="text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-wider">
                    Claim & Close
                  </button>
                </motion.div>
              ) : (
                <button 
                  onClick={handleSpin}
                  disabled={isSpinning}
                  className="w-full bg-[#D4AF37] hover:bg-[#C5A028] text-white font-black text-lg py-4 rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
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
