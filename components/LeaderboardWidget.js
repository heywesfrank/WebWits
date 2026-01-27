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
    <div className="space-y-3">
      {leaderboard.map((user, index) => {
        // Calculate Rank: Finds the first index with this score.
        const rank = leaderboard.findIndex(u => u[scoreKey] === user[scoreKey]) + 1;

        // Determine Styles based on RANK
        let containerStyle = 'bg-white border-[#0284c7] hover:bg-gray-50'; // Default Blue
        let badgeStyle = 'bg-[#0284c7] text-white';
        let textStyle = 'text-[#0284c7]';
        let rankLabel = null;

        if (rank === 1) {
          containerStyle = 'bg-white border-[#D4AF37]'; // Gold
          badgeStyle = 'bg-[#D4AF37] text-white';
          textStyle = 'text-[#D4AF37]';
          rankLabel = <span className="text-[9px] text-[#D4AF37]/80 font-mono uppercase tracking-wider">Top Gun</span>;
        } else if (rank === 2) {
          containerStyle = 'bg-white border-[#C0C0C0]'; // Silver
          badgeStyle = 'bg-[#C0C0C0] text-white';
          textStyle = 'text-[#757575]';
        } else if (rank === 3) {
          containerStyle = 'bg-white border-[#CD7F32]'; // Bronze
          badgeStyle = 'bg-[#CD7F32] text-white';
          textStyle = 'text-[#CD7F32]';
        }

        return (
          <div 
            key={index} 
            className={`relative flex items-center justify-between p-3 rounded-xl border-2 transition-all hover:scale-[1.02] ${containerStyle}`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {/* Rank Badge */}
              <div className={`
                w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-md font-black text-xs shadow-sm
                ${badgeStyle}
              `}>
                {rank}
              </div>
              
              {/* User Details */}
              <div className="flex flex-col min-w-0">
                <span className={`font-bold text-xs truncate ${textStyle}`}>
                  {user.username}
                </span>
                {rankLabel}
              </div>
            </div>
            
            <div className="text-right pl-2 flex-shrink-0">
              <span className={`block font-mono font-bold text-xs ${textStyle}`}>
                {user[scoreKey] !== undefined ? user[scoreKey] : 0}
              </span>
              <span className="text-[9px] text-gray-400 uppercase">pts</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------------
// 2. MAIN WIDGET COMPONENT (Desktop)
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
    // If we have less than 50 items (e.g. initial server load of 5), fetch more.
    if (activeTab === "monthly" && initialLeaders.length >= 50) {
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
          .limit(50);

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
    <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm transition-all flex flex-col max-h-[600px]">
      <div className="flex items-center gap-2 mb-4 text-yellow-500 pb-2 border-b border-gray-100 flex-shrink-0">
        <Icon size={20} className="animate-in zoom-in duration-300" key={activeTab} />
        <h2 className="font-bold text-lg font-display">{activeTabInfo?.title}</h2>
      </div>

      <div className="flex p-1 bg-gray-50 rounded-lg mb-4 border border-gray-100 flex-shrink-0">
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

      {/* Scrollable Container with Hidden Scrollbar */}
      <div className="flex-1 overflow-y-auto min-h-[200px] pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {loading && leaders.length === 0 ? (
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
export function LeaderboardModal({ leaderboard: initialMobileLeaders, isOpen, onClose }) {
  const [mobileLeaders, setMobileLeaders] = useState(initialMobileLeaders || []);
  const [loading, setLoading] = useState(false);

  // Fetch more leaders on mount so the list is scrollable on mobile
  useEffect(() => {
    if (!isOpen) return;

    const fetchMobileLeaders = async () => {
      // If we already have a long list passed in, use it.
      if (initialMobileLeaders && initialMobileLeaders.length >= 50) {
        setMobileLeaders(initialMobileLeaders);
        return;
      }
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("username, monthly_points")
          .order("monthly_points", { ascending: false })
          .limit(50);
          
        if (!error && data) {
          setMobileLeaders(data);
        }
      } catch (e) {
        console.error("Mobile leaderboard fetch error", e);
      } finally {
        setLoading(false);
      }
    };

    fetchMobileLeaders();
  }, [isOpen, initialMobileLeaders]);

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:hidden">
      <motion.div 
         initial={{ y: 50, opacity: 0 }}
         animate={{ y: 0, opacity: 1 }}
         className="bg-gray-900 border border-gray-700 w-full max-w-md rounded-2xl p-6 relative shadow-2xl h-[80vh] flex flex-col"
      >
        <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4 flex-shrink-0">
          <h2 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
            <Star size={20} /> Monthly Leaders
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        
        {/* Mobile Scrollable Area with Hidden Scrollbar */}
        <div className="overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
           <div className="bg-white/5 rounded-xl p-2 min-h-full">
              {loading && mobileLeaders.length < 5 ? (
                 <div className="flex justify-center py-10">
                    <Loader2 className="animate-spin text-yellow-400" />
                 </div>
              ) : (
                 <LeaderboardList leaderboard={mobileLeaders} scoreKey="monthly_points" />
              )}
           </div>
        </div>
      </motion.div>
    </div>
  );
}
