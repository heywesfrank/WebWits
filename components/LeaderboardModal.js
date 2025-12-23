import { motion } from "framer-motion";
import { Trophy, X } from "lucide-react";
import LeaderboardList from "./LeaderboardList";

export default function LeaderboardModal({ leaderboard, isOpen, onClose }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:hidden">
      <motion.div 
         initial={{ y: 50, opacity: 0 }}
         animate={{ y: 0, opacity: 1 }}
         className="bg-gray-900 border border-gray-700 w-full max-w-md rounded-2xl p-6 relative shadow-2xl h-[80vh] flex flex-col"
      >
        <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
          <h2 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
            <Trophy size={20} /> Leaderboard
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          <LeaderboardList leaderboard={leaderboard} />
        </div>
      </motion.div>
    </div>
  );
}
