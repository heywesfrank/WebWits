"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Trophy, Loader2, Star, Crown, Flame, X } from "lucide-react";
import { motion } from "framer-motion";

// ------------------------------------------------------------------
// 1. SHARED LIST COMPONENT (Internal)
// ------------------------------------------------------------------
function LeaderboardList({ leaderboard, scoreKey = "weekly_points" }) {
  return (
    <div className="space-y-4">
      {leaderboard.map((user, index) => (
        <div 
          key={index} 
          className={`relative flex items-center justify-between p-3 rounded-xl border transition-all hover:scale-[1.02] 
            ${index === 0 ? 'bg-gradient-to-r from-yellow-400/20 to-yellow-400/5 border-yellow-400/50' : 
              index === 1 ? 'bg-gray-800/80 border-gray-600' : 
              index === 2 ? 'bg-gray-800/60 border-orange-700/50' : 'bg-transparent border-transparent'
            }`}
        >
          <div className="flex items-center gap-3">
            {/* Rank Badge */}
            <div className={`
              w-8 h-8 flex items-center justify-center rounded-lg font-black text-sm shadow-lg
              ${index === 0 ? 'bg-yellow-400 text-black' : 
                index === 1 ? 'bg-gray-300 text-black' : 
                index === 2 ? 'bg-orange-600 text-white' : 'text-gray-500 font-medium'}
            `}>
              {index + 1}
            </div>
            
            {/* User Details */}
            <div className="flex flex-col">
              <span className={`font-bold text-sm ${index === 0 ? 'text-yellow-400' : 'text-gray-200'}`}>
                {user.username}
              </span>
              {index === 0 && <span className="text-[10px] text-yellow-500/80 font-mono uppercase tracking-wider">Current King</span>}
            </div>
          </div>
          
          <div className="text-right">
            <span className="block font-mono font-bold text-white">
              {user[scoreKey] !== undefined ? user[scoreKey] : 0}
            </span>
            <span className="text-[10px] text-gray-500 uppercase">pts</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------
// 2. MAIN WIDGET COMPONENT (Sidebar)
// ------------------------------------------------------------------
export default function LeaderboardWidget({ initialWeeklyLeaders = [] }) {
  const [activeTab, setActiveTab] = useState("weekly");
  const [leaders, setLeaders] = useState(initialWeeklyLeaders);
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: "daily", label: "Daily", icon: Flame, title: "Daily Champions" },
    { id: "weekly", label: "Weekly", icon: Trophy, title: "Weekly Leaders" },
    { id: "monthly", label: "Monthly", icon: Star, title: "Monthly Stars" },
    { id: "all_time", label: "All Time", icon: Crown, title: "Hall of Fame" },
  ];

  useEffect(() => {
    // Optimization: Use initial data for weekly tab to avoid re-fetching immediately
    if (activeTab === "weekly" && initialWeeklyLeaders.length > 0) {
      setLeaders(initialWeeklyLeaders);
      return;
    }

    const fetchLeaders = async () => {
      setLoading(true);
      try {
        let sortColumn = "weekly_points";
        
        // Map tabs to DB columns (Ensure these columns exist in your 'profiles' table)
        switch (activeTab) {
          case "daily": sortColumn = "daily_points"; break;
          case "weekly": sortColumn = "weekly_points"; break;
          case "monthly": sortColumn = "monthly_points"; break;
          case "all_time": sortColumn = "total_points"; break;
          default: sortColumn = "weekly_points";
        }

        const { data, error } = await supabase
          .from("profiles")
          .select(`username, ${sortColumn}`)
          .order(sortColumn, { ascending: false })
          .limit(5);

        if (error) {
           console.error("Error fetching leaders:", error);
           setLeaders([]); 
        } else {
           setLeaders(data || []);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaders();
  }, [activeTab, initialWeeklyLeaders]);

  const activeTabInfo = tabs.find(t => t.id === activeTab);
  const Icon = activeTabInfo?.icon || Trophy;

  // Determine which property to display
  const getScoreKey = () => {
     switch(activeTab) {
         case 'daily': return 'daily_points';
         case 'monthly': return 'monthly_points';
         case 'all_time': return 'total_points';
         default: return 'weekly_points';
     }
  };

  return (
    <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm sticky top-24 transition-all">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 text-yellow-500 pb-2 border-b border-gray-100">
        <Icon size={20} className="animate-in zoom-in duration-300" key={activeTab} />
        <h2 className="font-bold text-lg font-display">{activeTabInfo?.title}</h2>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-gray-50 rounded-lg mb-4 border border-gray-100">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-1.5 text-[10px] sm:text-xs font-bold rounded-md transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-white text-yellow-600 shadow-sm border border-gray-200"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List Content */}
      <div className="min-h-[200px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40 space-y-2 opacity-50">
            <Loader2 className="animate-spin text-yellow-500" size={24} />
            <span className="text-xs text-gray-400 font-medium">Loading stats...</span>
          </div>
        ) : leaders.length > 0 ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
             <LeaderboardList leaderboard={leaders} scoreKey={getScoreKey()} />
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 text-sm">
            <p>No leaders found for this period.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// 3. MODAL COMPONENT (Mobile Popup)
// ------------------------------------------------------------------
export function LeaderboardModal({ leaderboard, isOpen, onClose }) {
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
          {/* Mobile modal defaults to showing the data passed in (usually weekly) */}
          <LeaderboardList leaderboard={leaderboard} scoreKey="weekly_points" />
        </div>
      </motion.div>
    </div>
  );
}
