// components/DailySpin.js
"use client";
import { useState, useEffect } from "react";
import { X, Sparkles, Trophy, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DailySpin({ session, userProfile, onSpinComplete, canSpin = true }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [prize, setPrize] = useState(null);
  const [rotation, setRotation] = useState(0);

  // Check availability on load
  useEffect(() => {
    let timeoutId;

    // We now check 'canSpin' before scheduling the modal
    if (userProfile && session && canSpin) {
      // FIX: Force EST/New York Timezone for client-side check
      const today = new Date().toLocaleDateString('en-CA', { 
        timeZone: 'America/New_York' 
      });

      if (userProfile.last_spin_date !== today) {
        // Schedule the popup
        timeoutId = setTimeout(() => {
           setIsOpen(true);
        }, 1500);
      }
    }

    // CLEANUP: If 'canSpin' changes to false (e.g. WinnerModal triggers), cancel the timer!
    return () => {
        if (timeoutId) clearTimeout(timeoutId);
    };
  }, [userProfile, session, canSpin]);

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

        const segments = [
            { id: 0, val: 50 }, { id: 1, val: 100 }, { id: 2, val: 200 },
            { id: 3, val: 300 }, { id: 4, val: 400 }, { id: 5, val: 500 }
        ];

        // Find match (Handle the duplicate 300 case randomly to vary visual landing)
        let targetSegment = segments.find(s => s.val === data.prize);
        if (data.prize === 300) {
           const options = segments.filter(s => s.val === 300);
           targetSegment = options[Math.floor(Math.random() * options.length)];
        }
        
        // Calculate Angle
        const segmentCenter = (targetSegment.id * 60) + 30;
        const variance = Math.floor(Math.random() * 40) - 20;
        const finalRotation = 1800 + (360 - segmentCenter) + variance;
        
        setRotation(finalRotation);

        // Wait for animation
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

  const wheelSegments = [
    { id: 0, val: 50, label: '50', color: '#03A9FC', text: 'white' },   
    { id: 1, val: 100, label: '100', color: '#028BCF', text: 'white' }, 
    { id: 2, val: 200, label: '200', color: '#026CA2', text: 'white' },  
    { id: 3, val: 300, label: '300', color: '#014E74', text: 'white' },
    { id: 4, val: 300, label: '300', color: '#012F47', text: 'white' },  
    { id: 5, val: 500, label: '500', color: '#FFFFFF', text: 'blue' }    
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
                Test your luck, win <strong className="text-[#0284c7]">free</strong> WitCoins.
              </p>
            </div>

            <div className="relative w-72 h-72 mx-auto mb-8">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                 <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[24px] border-t-amber-600 filter drop-shadow-md"></div>
              </div>

              <div 
                 className="w-full h-full rounded-full border-4 border-white shadow-[0_0_30px_rgba(0,0,0,0.1)] overflow-hidden relative transition-transform"
                 style={{ 
                   transform: `rotate(${rotation}deg)`,
                   transition: isSpinning ? 'transform 4s cubic-bezier(0.2, 0, 0.2, 1)' : 'none'
                 }}
              >
                 <div 
                   className="w-full h-full absolute inset-0"
                   style={{
                     background: `conic-gradient(
                       #03A9FC 0deg 60deg,   
                       #028BCF 60deg 120deg,  
                       #026CA2 120deg 180deg, 
                       #014E74 180deg 240deg, 
                       #012F47 240deg 300deg, 
                       #FFFFFF 300deg 360deg  
                     )`
                   }}
                 />
                 
                 <div className="absolute inset-0 select-none pointer-events-none">
                    {wheelSegments.map((seg) => (
                      <span
                        key={seg.id}
                        className={`absolute top-1/2 left-1/2 font-display font-black text-2xl ${seg.text === 'white' ? 'text-white drop-shadow-sm' : 'text-[#0284c7]'}`}
                        style={{
                          transform: `translate(-50%, -50%) rotate(${seg.id * 60 + 30}deg) translateY(-85px)`
                        }}
                      >
                         {seg.val === 500 ? (
                            <div className="flex flex-col items-center justify-center -space-y-1">
                                <Star size={16} className="fill-[#FFD700] text-[#FFD700] mb-0.5" />
                                <span>{seg.label}</span>
                            </div>
                        ) : (
                            seg.label
                        )}
                      </span>
                    ))}
                 </div>

                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full shadow-inner flex items-center justify-center border border-gray-100 z-10">
                    <Trophy size={24} className="text-[#0284c7]" />
                 </div>
              </div>
            </div>

            <div className="text-center h-20 flex items-center justify-center">
              {prize ? (
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1.1, opacity: 1 }}
                  className="space-y-2"
                >
                  <div className="text-4xl font-black text-[#0284c7] flex items-center justify-center gap-2 font-display">
                    <Sparkles className="fill-[#0284c7]" /> +{prize}
                  </div>
                  <button onClick={close} className="text-xs font-bold text-black hover:text-gray-800 uppercase tracking-wider">
                    Claim & Close
                  </button>
                </motion.div>
              ) : (
                <button 
                  onClick={handleSpin}
                  disabled={isSpinning}
                  className="w-full bg-[#0284c7] hover:bg-[#0369a1] text-white font-black text-lg py-4 rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
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
