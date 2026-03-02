// components/MonthlyWinnerModal.js
import { motion } from "framer-motion";
import { Trophy, Star, X } from "lucide-react";
import { useState } from "react";

export default function MonthlyWinnerModal({ rank, reward, onClose, userId }) {
  const [closing, setClosing] = useState(false);

  const CONFIG = {
    1: {
      title: "MONTHLY EMPEROR",
      msg: "You didn't just win a battle, you won the entire war. 30 days of pure, unadulterated wit. The crown is yours.",
      color: "text-yellow-500",
      bg: "bg-yellow-500",
      border: "border-yellow-400"
    },
    2: {
      title: "MONTHLY RUNNER-UP",
      msg: "Second place for the entire month. It's like being the second funniest person on earth. Almost perfect.",
      color: "text-gray-400",
      bg: "bg-gray-400",
      border: "border-gray-300"
    },
    3: {
      title: "MONTHLY BRONZE",
      msg: "You survived a month of brutal roasting and claimed the final spot on the podium. Respect.",
      color: "text-orange-500",
      bg: "bg-orange-500",
      border: "border-orange-400"
    }
  };

  const details = CONFIG[rank] || CONFIG[3];

  const handleClose = async () => {
    setClosing(true);
    await fetch('/api/user/clear-rank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, type: 'monthly' })
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <motion.div 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        className={`w-full max-w-sm bg-white border-2 ${details.border} shadow-[0_0_80px_rgba(250,204,21,0.3)] rounded-3xl p-8 relative text-center overflow-hidden`}
      >
        <div className={`absolute top-0 left-0 w-full h-3 ${details.bg}`} />
        
        <div className="mb-6 relative">
            <div className={`w-24 h-24 ${details.bg} bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse`}>
                <Trophy size={56} className={details.color} />
            </div>
            {rank === 1 && (
                <div className="absolute -top-4 -right-2 text-5xl animate-bounce">👑</div>
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
                <Star size={24} fill="black" />
            </div>
            <div className="text-left">
                <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Monthly Payout</div>
                <div className="text-2xl font-black text-gray-900 leading-none">+{reward} WitCoins</div>
            </div>
        </div>

        <button 
          onClick={handleClose}
          disabled={closing}
          className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition-all active:scale-95 shadow-xl disabled:opacity-50"
        >
          Claim Monthly Bag
        </button>

      </motion.div>
    </div>
  );
}
