// components/WinnerModal.js
import { motion } from "framer-motion";
import { Trophy, Star, X } from "lucide-react";
import { useState } from "react";

export default function WinnerModal({ rank, onClose, userId }) {
  const [closing, setClosing] = useState(false);

  // Config based on rank
  const CONFIG = {
    1: {
      title: "LEGENDARY STATUS",
      msg: "You dropped the mic. Everyone else picked it up and handed it back to you.",
      reward: 75,
      color: "text-yellow-500",
      bg: "bg-yellow-500",
      border: "border-yellow-400"
    },
    2: {
      title: "SO CLOSE",
      msg: "Silver looks good on you. But gold would look better. Keep pushing.",
      reward: 50,
      color: "text-gray-400",
      bg: "bg-gray-400",
      border: "border-gray-300"
    },
    3: {
      title: "PODIUM FINISH",
      msg: "You're officially funnier than 99% of the internet. Not bad.",
      reward: 25,
      color: "text-orange-500",
      bg: "bg-orange-500",
      border: "border-orange-400"
    }
  };

  const details = CONFIG[rank] || CONFIG[3];

  const handleClose = async () => {
    setClosing(true);
    // Call API to clear the rank so it doesn't show again
    await fetch('/api/user/clear-rank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <motion.div 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        className={`w-full max-w-sm bg-white border-2 ${details.border} shadow-[0_0_50px_rgba(250,204,21,0.2)] rounded-3xl p-8 relative text-center overflow-hidden`}
      >
        {/* Background FX */}
        <div className={`absolute top-0 left-0 w-full h-2 ${details.bg}`} />
        
        <div className="mb-6 relative">
            <div className={`w-24 h-24 ${details.bg} bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce`}>
                <Trophy size={48} className={details.color} />
            </div>
            {rank === 1 && (
                <div className="absolute -top-2 -right-2 text-4xl animate-pulse">👑</div>
            )}
        </div>

        <h2 className={`text-3xl font-black font-display mb-2 ${details.color} uppercase tracking-tighter`}>
            {details.title}
        </h2>
        
        <p className="text-gray-600 font-medium mb-6 leading-relaxed">
            {details.msg}
        </p>

        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 mb-6 flex items-center justify-center gap-3">
            <div className="bg-yellow-400 text-black p-2 rounded-lg">
                <Star size={20} fill="black" />
            </div>
            <div className="text-left">
                <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Reward</div>
                <div className="text-2xl font-black text-gray-900 leading-none">+{details.reward} Credits</div>
            </div>
        </div>

        <button 
          onClick={handleClose}
          className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition-all active:scale-95 shadow-xl"
        >
          Claim & Continue
        </button>

      </motion.div>
    </div>
  );
}
