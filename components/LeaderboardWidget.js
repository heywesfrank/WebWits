import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Trophy, Loader2, Star, Crown, X } from "lucide-react";
import { motion } from "framer-motion";

// Prevent infinite loop by using a stable default reference
const DEFAULT_LEADERS = [];

// ------------------------------------------------------------------
// 1. SHARED LIST COMPONENT
// ------------------------------------------------------------------
function LeaderboardList({ leaderboard, scoreKey }) {
  return (
    <div className="space-y-4">
      {leaderboard.map((user, index) => (
        <div 
          key={index} 
          className={`relative flex items-center justify-between p-3 rounded-xl border transition-all hover:scale-[1.02] 
            ${index === 0 ? 'bg-amber-50 border-amber-200' : 
              index === 1 ? 'bg-slate-50 border-slate-200' : 
              index === 2 ? 'bg-orange-50 border-orange-200' : 
              'bg-transparent border-transparent hover:bg-yellow-50'
            }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {/* Rank Badge */}
            <div className={`
              w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-md font-black text-xs shadow-sm
              ${index === 0 ? 'bg-amber-400 text-white' : 
                index === 1 ? 'bg-slate-400 text-white' : 
                index === 2 ? 'bg-orange-400 text-white' : 
                'bg-yellow-100 text-yellow-600'}
            `}>
              {index + 1}
            </div>
            
            {/* User Details */}
            <div className="flex flex-col min-w-0">
              <span className={`font-bold text-xs truncate ${
                index === 0 ? 'text-amber-900' : 
                index === 1 ? 'text-slate-900' : 
                index === 2 ? 'text-orange-900' : 
                'text-yellow-900'
              }`}>
                {user.username}
              </span>
              {index === 0 && <span className="text-[9px] text-amber-600/80 font-mono uppercase tracking-wider">Top Gun</span>}
            </div>
          </div>
          
          <div className="text-right pl-2 flex-shrink-0">
            <span className={`block font-mono font-bold text-xs ${
               index === 0 ? 'text-amber-900' : 
               index === 1 ? 'text-slate-900' : 
               index === 2 ? 'text-orange-900' : 
               'text-gray-500'
            }`}>
              {user[scoreKey] !== undefined ? user[scoreKey] : 0}
            </span>
            <span className="text-[9px] text-gray-400 uppercase">pts</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------
// 2. MAIN WIDGET COMPONENT
// ------------------------------------------------------------------
export default function LeaderboardWidget({ initialLeaders = DEFAULT_LEADERS }) {
  const [activeTab, setActiveTab] = useState("monthly");
  const [leaders, setLeaders] = useState(initialLeaders);
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: "monthly", label: "Monthly", icon: Star, title: "Monthly Leaders" },
    { id: "all_time", label: "All Time", icon: Crown, title: "Hall of Fame" },
  ];

  useEffect(() => {
    // Optimization: If on default tab and initial props are valid, use them.
    // This prevents fetching if the parent already provided the data.
    if (activeTab === "monthly" && initialLeaders.length > 0) {
      setLeaders(initialLeaders);
      return;
    }

    const fetchLeaders = async () => {
      setLoading(true);
      try {
        let sortColumn = "monthly_points";
        if (activeTab === "all_time") sortColumn = "total_points";

        const { data, error } = await supabase
          .from("profiles")
          .select(`username, ${sortColumn}`)
          .order(sortColumn, { ascending: false })
          .limit(10);

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
  }, [activeTab, initialLeaders]);

  const activeTabInfo = tabs.find(t => t.id === activeTab);
  const Icon = activeTabInfo?.icon || Star;

  const getScoreKey = () => {
     return activeTab === 'all_time' ? 'total_points' : 'monthly_points';
  };

  return (
    <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm transition-all">
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
            className={`flex-1 py-2 text-xs font-bold rounded-md transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-white text-yellow-600 shadow-sm border border-gray-200"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[200px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40 space-y-2 opacity-50">
            <Loader2 className="animate-spin text-yellow-500" size={24} />
            <span className="text-xs text-gray-400 font-medium">Calculating ranks...</span>
          </div>
        ) : leaders.length > 0 ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
             <LeaderboardList leaderboard={leaders} scoreKey={getScoreKey()} />
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 text-sm">
            <p>No scores recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// 3. MODAL COMPONENT (Mobile)
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
            <Star size={20} /> Monthly Leaders
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          {/* Note: In dark modal, we might want to invert text colors, but using shared component for now with standard backgrounds */}
           <div className="bg-white/5 rounded-xl p-2">
              <LeaderboardList leaderboard={leaderboard} scoreKey="monthly_points" />
           </div>
        </div>
      </motion.div>
    </div>
  );
}
