import { motion } from "framer-motion";
import { X, Trophy, ThumbsUp } from "lucide-react";

export default function UserProfileModal({ user, isOpen, onClose }) {
  if (!isOpen || !user) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-800 border border-gray-700 w-full max-w-md rounded-2xl p-6 relative shadow-2xl"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={24} />
        </button>
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-yellow-400 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl text-black font-black">
            {user.email[0].toUpperCase()}
          </div>
          <h2 className="text-2xl font-bold text-white font-display">{user.email.split('@')[0]}</h2>
          <p className="text-gray-400 text-sm">Contestant</p>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700 text-center">
            <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">0</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Daily Wins</div>
          </div>
          <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700 text-center">
            <ThumbsUp className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">0</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Total Votes</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
