// components/CaptionFeed.js
import { useState } from "react";
import { motion } from "framer-motion";
import { Share2, Flag, Trophy, ThumbsUp, Check, MessageCircle, Flame, Edit3, X, Pin } from "lucide-react"; 
import { COUNTRY_CODES } from "@/lib/countries";

function getCountryCode(countryName) {
  return COUNTRY_CODES[countryName]?.toLowerCase() || null;
}

function timeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d`;
}

// Sub-component for username rendering with PWA Deep Link Fix
const SocialUsername = ({ username, isInfluencer, socialLink, className }) => {
    
    const handleClick = (e) => {
        e.stopPropagation(); // Prevent bubbling to the parent card click
        
        if (!socialLink) return;

        // 1. Check if user is on Mobile (Simple User Agent check)
        const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        // 2. Instagram Specific Fix
        if (isMobile && socialLink.includes('instagram.com')) {
            try {
                // Extract username from the URL (e.g. https://instagram.com/jay_brands_it/)
                const urlObj = new URL(socialLink.startsWith('http') ? socialLink : `https://${socialLink}`);
                const pathParts = urlObj.pathname.split('/').filter(Boolean);
                const igUser = pathParts[0]; // Gets 'jay_brands_it'

                if (igUser) {
                    e.preventDefault();
                    // 3. Force Deep Link Scheme
                    window.location.href = `instagram://user?username=${igUser}`;
                    return;
                }
            } catch (err) {
                console.error("Error parsing social link:", err);
                // If parsing fails, it will fall back to the standard <a> tag behavior
            }
        }
    };

    if (isInfluencer && socialLink) {
        return (
            <a 
                href={socialLink} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={`hover:underline !text-blue-600 hover:!text-blue-800 ${className}`}
                onClick={handleClick}
            >
                @{username}
            </a>
        );
    }
    return <span className={className}>@{username}</span>;
};

export default function CaptionFeed({ captions, meme, session, viewMode, onVote, onShare, onReport, onReply, onEdit, editingId, setEditingId }) {
  const [sortBy, setSortBy] = useState("top");
  
  // Reply State
  const [activeReplyId, setActiveReplyId] = useState(null); 
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  
  // Edit State (Removed local editingId, using prop 'editingId' instead)
  const [editText, setEditText] = useState("");

  // Track which specific caption was just copied
  const [copiedId, setCopiedId] = useState(null);

  const sortedCaptions = [...captions].sort((a, b) => {
    // 1. Check for Pins (Thumbtack of Glory)
    const aPin = a.profiles?.cosmetics?.effect_pin_meme_id === meme?.id;
    const bPin = b.profiles?.cosmetics?.effect_pin_meme_id === meme?.id;

    if (aPin && !bPin) return -1; // a comes first
    if (!aPin && bPin) return 1;  // b comes first

    // 2. Standard Sorting
    if (sortBy === "top") {
        const voteDiff = b.vote_count - a.vote_count;
        // Tie-breaker Logic
        if (voteDiff !== 0) return voteDiff;
        
        // If votes are tied, oldest created_at comes FIRST (ascending)
        return new Date(a.created_at) - new Date(b.created_at);
    }
    
    // Sort by "New" (Newest first)
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const handleShareClick = async (caption, index) => {
    const rank = sortBy === 'top' ? index + 1 : null;
    const shareUrl = `https://itswebwits.com/share/${caption.id}`;
    
    let shareText = "";
    if (rank) {
      shareText = `Can you beat this #${rank} place comment? "${caption.content}"`;
    } else {
      shareText = `Can you beat this comment? "${caption.content}"`;
    }
    
    const clipboardText = `${shareText} ${shareUrl}`;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile && navigator.share) {
      try {
        await navigator.share({
          title: 'WebWits Battle',
          text: shareText,
          url: shareUrl,
        });
      } catch (err) { }
    } else {
      try {
        await navigator.clipboard.writeText(clipboardText);
        setCopiedId(caption.id);
        setTimeout(() => setCopiedId(null), 3000);
      } catch (err) {
        console.error("Failed to copy", err);
        alert("Could not copy link. Manually copy this URL:\n" + shareUrl);
      }
    }
  };

  const submitReply = async (commentId) => {
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    await onReply(commentId, replyText);
    setReplyText("");
    setActiveReplyId(null);
    setSubmittingReply(false);
  };

  const handleSaveEdit = async (commentId) => {
    if (!editText.trim()) return;
    // We trigger the parent handler (which opens the modal).
    await onEdit(commentId, editText);
  };

  return (
    <div className="space-y-4">
       {/* CSS for Ring of Fire Animation */}
       <style>{`
        @keyframes burn {
          0% { box-shadow: 0 0 5px #dc2626, 0 0 10px #ea580c; border-color: #dc2626; }
          50% { box-shadow: 0 0 20px #dc2626, 0 0 30px #f97316; border-color: #f97316; }
          100% { box-shadow: 0 0 5px #dc2626, 0 0 10px #ea580c; border-color: #dc2626; }
        }
        .ring-of-fire {
          animation: burn 0.8s infinite alternate;
          border-width: 2px;
          z-index: 10;
        }
      `}</style>

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
        const isTopRanked = index === 0 && sortBy === 'top' && viewMode === 'archive-detail';
        
        const rank = index + 1;
        const showFire = viewMode === 'active' && sortBy === 'top' && rank <= 3;
        const fireCount = showFire ? 4 - rank : 0; 

        const username = caption.profiles?.username || "anon";
        const avatarUrl = caption.profiles?.avatar_url;
        const countryCode = getCountryCode(caption.profiles?.country);
        const isInfluencer = caption.profiles?.influencer;
        const socialLink = caption.profiles?.social_link;

        const fireMemeId = caption.profiles?.cosmetics?.effect_fire_meme_id;
        const hasRingOfFire = fireMemeId && meme && fireMemeId === meme.id;

        // Check for Pin
        const pinMemeId = caption.profiles?.cosmetics?.effect_pin_meme_id;
        const hasPin = pinMemeId && meme && pinMemeId === meme.id;

        // Check for Double Barrel
        const doubleMemeId = caption.profiles?.cosmetics?.consumable_double_meme_id;
        const hasDoubleBarrel = doubleMemeId && meme && doubleMemeId === meme.id;

        // Check for active Mulligan
        const hasMulligan = 
            session?.user?.id === caption.user_id && 
            caption.profiles?.cosmetics?.consumable_edit_meme_id === meme?.id;

        return (
          <div 
            key={caption.id} 
            className={`
                relative bg-white border p-4 rounded-xl shadow-sm flex gap-4 transition hover:border-gray-300 group
                ${isWinner ? 'bg-yellow-50/30' : ''}
                ${hasRingOfFire ? 'ring-of-fire' : (isWinner ? 'border-yellow-400 ring-1 ring-yellow-400' : 'border-gray-200')}
                ${hasPin ? 'border-red-200 bg-red-50/10' : ''}
            `}
          >
            {hasPin && (
              <>
                 <div className="absolute -top-4 -right-3 bg-white rounded-full p-2 shadow-md border border-gray-100 z-20">
                    <Pin size={32} className="text-red-500 fill-red-500 -rotate-45" />
                 </div>
                 <div className="absolute -top-4 -left-3 bg-white rounded-full p-2 shadow-md border border-gray-100 z-20">
                    <Pin size={32} className="text-red-500 fill-red-500 rotate-12" />
                 </div>
              </>
            )}

            {/* Double Barrel Shotguns */}
            {hasDoubleBarrel && (
              <>
                 {/* Right Shotgun */}
                 <div className="absolute -top-4 -right-3 bg-white rounded-full p-2 shadow-md border border-gray-100 z-20">
                    <img 
                      src="/shotgun.png" 
                      alt="Double Barrel" 
                      className="w-8 h-8 object-contain -rotate-12" 
                    />
                 </div>
                 {/* Left Shotgun (Mirrored) */}
                 <div className="absolute -top-4 -left-3 bg-white rounded-full p-2 shadow-md border border-gray-100 z-20">
                    <img 
                      src="/shotgun.png" 
                      alt="Double Barrel" 
                      className="w-8 h-8 object-contain rotate-12 scale-x-[-1]" 
                    />
                 </div>
              </>
            )}

            {isWinner && (
              <div className="absolute -top-3 -left-2 bg-yellow-400 text-black text-[10px] font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1 z-10">
                <Trophy size={10} /> CHAMPION
              </div>
            )}

            <div className="flex-shrink-0 pt-1">
              <div className="relative inline-block">
                {isTopRanked && !hasPin && (
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

                {isInfluencer && (
                  <img src="/badge.png" alt="Influencer" className="absolute -bottom-1 -left-1 w-4 h-4 object-contain z-20 filter drop-shadow-sm" />
                )}

                {countryCode && (
                  <img src={`https://flagcdn.com/w20/${countryCode}.png`} alt={caption.profiles.country} className="absolute -bottom-1 -right-1 w-4 h-3 rounded-[2px] shadow-sm border border-white object-cover" />
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {/* Username with Social Link Logic */}
                <SocialUsername 
                    username={username} 
                    isInfluencer={isInfluencer} 
                    socialLink={socialLink}
                    className={`font-bold text-xs ${isWinner ? 'text-black' : 'text-gray-500'}`} 
                />

                {session && caption.user_id === session.user.id && (
                  <span className="bg-yellow-100 text-yellow-700 text-[10px] px-1.5 py-0.5 rounded border border-yellow-200 font-bold">YOU</span>
                )}
                <span className="text-[10px] text-gray-400">{timeAgo(caption.created_at)}</span>
              </div>

              {editingId === caption.id ? (
                  <div className="mt-1 animate-in fade-in">
                      <input 
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full p-2 border border-blue-400 rounded-lg bg-blue-50 text-gray-900 font-medium focus:ring-1 focus:ring-blue-500 outline-none"
                        autoFocus
                      />
                      <div className="flex gap-2 mt-2">
                          <button onClick={() => handleSaveEdit(caption.id)} className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-md hover:bg-blue-600 flex items-center gap-1">
                             <Check size={12} /> Save
                          </button>
                          <button onClick={() => setEditingId(null)} className="px-3 py-1 bg-gray-200 text-gray-700 text-xs font-bold rounded-md hover:bg-gray-300 flex items-center gap-1">
                             <X size={12} /> Cancel
                          </button>
                      </div>
                  </div>
               ) : (
                  <p className="text-base text-gray-800 leading-snug font-medium break-words">{caption.content}</p>
               )}
              
              <div className="flex gap-4 mt-3 items-center">
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
                  <>
                    <button onClick={() => onReport(caption.id)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition font-bold">
                      <Flag size={12} /> Report
                    </button>

                    {hasMulligan && !editingId && !hasPin && (
                        <button 
                            onClick={() => {
                                setEditingId(caption.id);
                                setEditText(caption.content);
                            }} 
                            className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 transition font-bold bg-blue-50 px-2 py-1 rounded-md"
                        >
                            <Edit3 size={12} /> Edit
                        </button>
                    )}
                    
                    {session && (
                      <button 
                        onClick={() => {
                           setActiveReplyId(activeReplyId === caption.id ? null : caption.id);
                           setTimeout(() => document.getElementById(`reply-input-${caption.id}`)?.focus(), 50);
                        }} 
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition font-bold"
                      >
                         Reply
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* ----- REPLIES SECTION ----- */}
              {(caption.replies?.length > 0 || activeReplyId === caption.id) && (
                <div className="mt-4 space-y-3">
                  {caption.replies?.map((reply) => {
                     const replyCountryCode = getCountryCode(reply.profiles?.country);
                     const isReplyInfluencer = reply.profiles?.influencer;
                     const replySocialLink = reply.profiles?.social_link;

                     return (
                        <div key={reply.id} className="flex gap-3 items-start animate-in fade-in slide-in-from-top-1 duration-300">
                           <div className="relative flex-shrink-0 mt-0.5">
                              <div className="w-6 h-6 rounded-full bg-gray-100 overflow-hidden ring-1 ring-gray-100">
                                  {reply.profiles?.avatar_url ? (
                                    <img src={reply.profiles.avatar_url} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-gray-400">?</div>
                                  )}
                              </div>

                              {isReplyInfluencer && (
                                <img 
                                  src="/badge.png" 
                                  alt="Influencer" 
                                  className="absolute -bottom-1 -left-1 w-3 h-3 object-contain z-20 filter drop-shadow-sm" 
                                />
                              )}

                              {replyCountryCode && (
                                <img 
                                  src={`https://flagcdn.com/w20/${replyCountryCode}.png`}
                                  className="absolute -bottom-0.5 -right-0.5 w-3 h-2 rounded-[1px] shadow-sm border border-white object-cover"
                                />
                              )}
                           </div>
                           
                           <div className="flex-1">
                              <div className="text-sm leading-snug">
                                 {/* Reply Username with Social Link Logic */}
                                 <SocialUsername 
                                    username={reply.profiles?.username} 
                                    isInfluencer={isReplyInfluencer} 
                                    socialLink={replySocialLink}
                                    className="mr-2 font-bold text-xs text-gray-500" 
                                 />
                                 <span className="text-gray-700">{reply.content}</span>
                              </div>
                              <div className="flex gap-3 mt-1">
                                 <span className="text-[10px] text-gray-400 font-medium">{timeAgo(reply.created_at)}</span>
                                 {session && viewMode === 'active' && (
                                   <button 
                                     onClick={() => {
                                       setActiveReplyId(caption.id);
                                       setTimeout(() => document.getElementById(`reply-input-${caption.id}`)?.focus(), 50);
                                     }}
                                     className="text-[10px] text-gray-500 font-bold hover:text-gray-800"
                                   >
                                     Reply
                                   </button>
                                 )}
                              </div>
                           </div>
                        </div>
                     );
                  })}

                  {/* REPLY INPUT */}
                  {activeReplyId === caption.id && (
                     <div className="flex gap-2 items-center pt-1 animate-in fade-in slide-in-from-top-1">
                        <input
                          id={`reply-input-${caption.id}`}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && submitReply(caption.id)}
                          placeholder={`Reply to ${username}...`}
                          className="flex-1 bg-gray-50 border border-gray-200 focus:bg-white focus:border-gray-300 focus:ring-0 rounded-full px-4 py-2 text-sm transition-all outline-none placeholder:text-gray-400"
                        />
                        <button 
                          disabled={!replyText.trim() || submittingReply}
                          onClick={() => submitReply(caption.id)}
                          className="text-blue-500 font-bold text-sm disabled:opacity-50 hover:text-blue-600 px-1"
                        >
                          Post
                        </button>
                     </div>
                  )}
                </div>
              )}
            </div>
            
            <motion.button
              whileHover={viewMode === 'active' ? { scale: 1.1 } : {}}
              whileTap={viewMode === 'active' ? { scale: 0.9 } : {}}
              onClick={() => onVote(caption.id)}
              disabled={viewMode === 'archive-detail'} 
              className={`flex flex-col items-center justify-center gap-1 p-2 h-fit rounded-lg transition-colors ${caption.hasVoted ? 'text-yellow-500' : viewMode === 'archive-detail' ? 'text-gray-400 cursor-default' : 'text-gray-400 hover:text-yellow-500'}`}
            >
              {isWinner ? <Trophy size={24} className="fill-yellow-400 text-yellow-600" /> : <ThumbsUp size={24} className={`transition-all ${caption.vote_count > 0 ? 'fill-yellow-100' : ''}`} />}
              <span className={`font-bold text-sm ${isWinner ? 'text-yellow-700' : ''}`}>{caption.vote_count}</span>
              
              {showFire && (
                <div className="flex -space-x-1 mt-0.5">
                  {Array.from({ length: fireCount }).map((_, i) => (
                    <motion.span
                      key={i}
                      animate={{ scale: [1, 1.25, 1], rotate: [0, i % 2 === 0 ? 10 : -10, 0], y: [0, -2, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse", delay: i * 0.15 }}
                      className="text-sm select-none"
                    >
                      🔥
                    </motion.span>
                  ))}
                </div>
              )}
            </motion.button>
          </div>
        );
      })}
    </div>
  );
}
