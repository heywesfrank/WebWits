export default function LeaderboardList({ leaderboard }) {
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
            <span className="block font-mono font-bold text-white">{user.weekly_points}</span>
            <span className="text-[10px] text-gray-500 uppercase">pts</span>
          </div>
        </div>
      ))}
    </div>
  );
}
