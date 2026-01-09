import { useState } from "react";
import { motion } from "framer-motion";
import { Share2, Flag, Trophy, ThumbsUp, Check } from "lucide-react"; // [!code change] Removed Crown import
import { COUNTRY_CODES } from "@/lib/countries";

function getCountryCode(countryName) {
  return COUNTRY_CODES[countryName]?.toLowerCase() || null;
}

export default function CaptionFeed({ captions, meme, session, viewMode, onVote, onShare, onReport }) {
  const [sortBy, setSortBy] = useState("top");
  
  // Track which specific caption was just copied
  const [copiedId, setCopiedId] = useState(null);

  const sortedCaptions = [...captions].sort((a, b) => 
    sortBy === "top" ? b.vote_count - a.vote_count : new Date(b.created_at) - new Date(a.created_at)
  );

  const handleShareClick = async (caption, index) => {
    // 1. Build the Dynamic Text & URL
    const rank = sortBy === 'top' ? index + 1 : null;
    const shareUrl = `https://itswebwits.com/share/${caption.id}`;
    
    let shareText = "";
    if (rank) {
      shareText = `Can you beat this #${rank} place comment? "${caption.content}"`;
    } else {
      shareText = `Can you beat this comment? "${caption.content}"`;
    }
    
    // Combine for clipboard (Desktop)
    const clipboardText = `${shareText} ${shareUrl}`;

    // 2. Platform Detection
    // We only use the native Share Menu (navigator.share) on Mobile devices.
    // On Desktop, we force a "Copy to Clipboard" because the native menu 
    // often freezes or looks broken on Windows/Mac.
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile && navigator.share) {
      try {
        await navigator.share({
          title: 'WebWits Battle',
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled, ignore
      }
    } else {
      // 3. Desktop Fallback: Copy to Clipboard immediately
      try {
        await navigator.clipboard.writeText(clipboardText);
        
        // Show visual feedback
        setCopiedId(caption.id);
        setTimeout(() => setCopiedId(null), 3000);
      } catch (err) {
        console.error("Failed to copy", err);
        alert("Could not copy link. Manually copy this URL:\n" + shareUrl);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-1">
        <h3 className="font-bold text-gray-800 font-display text-lg">
          {captions.length} {captions.length === 1 ? 'Caption' : 'Captions'}
        </h3>
        <div className="flex gap-2 text-sm bg-gray-100 p-1 rounded-lg border border-gray-200">
          <button onClick={() => setSortBy('top')} className={`px-3 py-1 rounded transition ${sortBy === 'top' ? 'bg-white text-yellow-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>Top</button>
          {viewMode === 'active' && (
            <button onClick={() => setSortBy('new')} className={`px-3 py-1 rounded transition ${sortBy === 'new' ? 'bg-white text-yellow-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>New</button>
          )}
        </div>
      </div>

      {sortedCaptions.map((caption, index) => {
        const isWinner = viewMode === 'archive-detail' && index === 0 && sortBy === 'top';
        const isTopRanked = index === 0 && sortBy === 'top'; // [!code ++]
        const username = caption.profiles?.username || "anon";
        const avatarUrl = caption.profiles?.avatar_url;
        const countryCode = getCountryCode(caption.profiles?.country);

        return (
          <div key={caption.id} className={`relative bg-white border p-4 rounded-xl shadow-sm flex gap-4 transition hover:border-gray-300 group ${isWinner ? 'border-yellow-400 ring-1 ring-yellow-400 bg-yellow-50/30' : 'border-gray-200'}`}>
            {isWinner && (
              <div className="absolute -top-3 -left-2 bg-yellow-400 text-black text-[10px] font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1 z-10">
                <Trophy size={10} /> CHAMPION
              </div>
            )}

            <div className="flex-shrink-0 pt-1">
              <div className="relative inline-block">
                
                {/* [!code ++] Custom Crown Image for 1st Place */}
                {isTopRanked && (
                  <img 
                    src="/crown.png" 
                    alt="Current Leader"
                    className="absolute -top-3 -left-2 z-20 w-8 h-auto -rotate-[20deg] filter drop-shadow-sm pointer-events-none"
                  />
                )}

                <div className="h-9 w-9 bg-gray-100 rounded-full overflow-hidden border border-gray-200 shadow-sm">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={username} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-yellow-100 text-yellow-600 font-bold text-xs">
                      {username?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                {countryCode && (
                  <img 
                    src={`https://flagcdn.com/w20/${countryCode}.png`}
                    alt={caption.profiles.country}
                    title={caption.profiles.country}
                    className="absolute -bottom-1 -right-1 w-4 h-3 rounded-[2px] shadow-sm border border-white object-cover"
                  />
                )}
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`font-bold text-xs ${isWinner ? 'text-black' : 'text-gray-500'}`}>@{username}</span>
                {session && caption.user_id === session.user.id && (
                  <span className="bg-yellow-100 text-yellow-700 text-[10px] px-1.5 py-0.5 rounded border border-yellow-200 font-bold">YOU</span>
                )}
              </div>
              <p className="text-lg text-gray-800 leading-snug font-medium">{caption.content}</p>
              
              {/* UPDATED: Buttons are now ALWAYS visible (removed opacity-0 and group-hover classes) */}
              <div className="flex gap-4 mt-3">
                <button 
                  onClick={() => handleShareClick(caption, index)} 
                  className={`flex items-center gap-1 text-xs transition font-bold ${
                    copiedId === caption.id 
                      ? "text-green-600 bg-green-50 px-2 py-1 rounded-md" 
                      : "text-gray-400 hover:text-yellow-600"
                  }`}
                >
                  {copiedId === caption.id ? <Check size={12} /> : <Share2 size={12} />}
                  {copiedId === caption.id ? "Link Copied!" : "Share"}
                </button>
                
                {viewMode === 'active' && (
                  <button 
                    onClick={() => onReport(caption.id)} 
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition"
                  >
                    <Flag size={12} /> Report
                  </button>
                )}
              </div>
            </div>
            
            <motion.button
              whileHover={viewMode === 'active' ? { scale: 1.1 } : {}}
              whileTap={viewMode === 'active' ? { scale: 0.9 } : {}}
              onClick={() => onVote(caption.id)}
              disabled={viewMode === 'archive-detail'} 
              className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors ${caption.hasVoted ? 'text-yellow-500' : viewMode === 'archive-detail' ? 'text-gray-400 cursor-default' : 'text-gray-400 hover:text-yellow-500'}`}
            >
              {isWinner ? <Trophy size={24} className="fill-yellow-400 text-yellow-600" /> : <ThumbsUp size={24} className={`transition-all ${caption.vote_count > 0 ? 'fill-yellow-100' : ''}`} />}
              <span className={`font-bold text-sm ${isWinner ? 'text-yellow-700' : ''}`}>{caption.vote_count}</span>
            </motion.button>
          </div>
        );
      })}
    </div>
  );
}
