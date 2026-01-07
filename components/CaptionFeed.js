import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Flag, Trophy, ThumbsUp, Instagram, Twitter, MessageCircle, X, Check, Download, Loader2, Link as LinkIcon } from "lucide-react";
import { COUNTRY_CODES } from "@/lib/countries";
import html2canvas from "html2canvas";

function getCountryCode(countryName) {
  return COUNTRY_CODES[countryName]?.toLowerCase() || null;
}

export default function CaptionFeed({ captions, meme, session, viewMode, onVote, onShare, onReport }) {
  const [sortBy, setSortBy] = useState("top");
  const [shareConfig, setShareConfig] = useState(null); 

  const sortedCaptions = [...captions].sort((a, b) => 
    sortBy === "top" ? b.vote_count - a.vote_count : new Date(b.created_at) - new Date(a.created_at)
  );

  const handleOpenShare = (caption, index) => {
    const rank = sortBy === 'top' ? index + 1 : null;
    setShareConfig({
      content: caption.content,
      username: caption.profiles?.username || "anon",
      rank: rank,
      memeUrl: meme?.image_url,
      memeContent: meme?.content_url,
      memeType: meme?.type
    });
  };

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {shareConfig && (
          <ShareModal 
            config={shareConfig} 
            onClose={() => setShareConfig(null)} 
          />
        )}
      </AnimatePresence>

      {/* Feed Controls */}
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

      {/* List */}
      {sortedCaptions.map((caption, index) => {
        const isWinner = viewMode === 'archive-detail' && index === 0 && sortBy === 'top';
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
                {caption.vote_count > 10 && viewMode === 'active' && <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded border border-red-200">🔥 Hot</span>}
              </div>
              <p className="text-lg text-gray-800 leading-snug font-medium">{caption.content}</p>
              
              <div className="flex gap-4 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleOpenShare(caption, index)} 
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-yellow-600 transition"
                >
                  <Share2 size={12} /> Share
                </button>
                
                {viewMode === 'active' && (
                  <button onClick={() => onReport(caption.id)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition"><Flag size={12} /> Report</button>
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

function ShareModal({ config, onClose }) {
  const [generating, setGenerating] = useState(false);
  const cardRef = useRef(null); 
  
  const shareUrl = "https://itswebwits.com";
  const shareText = config.rank 
    ? `Can you beat this #${config.rank} place comment? "${config.content}"`
    : `Can you beat this comment? "${config.content}"`;

  const handleShareImage = async (platform) => {
    if (!cardRef.current) return;
    setGenerating(true);

    try {
      // 1. Generate Canvas
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true, 
        scale: 2, 
        backgroundColor: null
      });

      // 2. Convert to Blob
      canvas.toBlob(async (blob) => {
        if (!blob) return;

        // Mobile Native Share (All Platforms)
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 't.png', {type:'image/png'})] })) {
          const file = new File([blob], 'webwits-share.png', { type: 'image/png' });
          try {
            await navigator.share({
              title: 'WebWits Battle',
              text: `${shareText} ${shareUrl}`,
              files: [file],
            });
            setGenerating(false);
            return;
          } catch (err) {
            console.log("Sharing failed or cancelled", err);
            // Don't return, fall through to desktop logic if mobile share fails/is cancelled
          }
        }

        // Desktop Logic
        if (platform === 'copy') {
             try {
                // Try writing image to clipboard
                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                ]);
                alert("Image copied to clipboard!"); 
             } catch (err) {
                console.error("Clipboard failed", err);
                // Fallback to download if clipboard fails
                const link = document.createElement('a');
                link.download = `webwits-share-${Date.now()}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
             }
        } else {
             // For Socials on Desktop (Twitter/WhatsApp), we must download
             // because we cannot push a file to their web intent URLs.
             const link = document.createElement('a');
             link.download = `webwits-share-${Date.now()}.png`;
             link.href = canvas.toDataURL('image/png');
             link.click();
        }
        
        setGenerating(false);

      }, 'image/png');

    } catch (err) {
      console.error("Image generation failed", err);
      setGenerating(false);
      alert("Could not generate image. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl relative my-8"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black z-10 bg-white/50 rounded-full p-1">
          <X size={20} />
        </button>

        <div className="p-6 pb-0 text-center">
          <h3 className="font-bold text-lg text-gray-900 mb-6">Share this Wit</h3>
          
          {/* THE CARD PREVIEW */}
          <div ref={cardRef} className="bg-gradient-to-br from-yellow-400 to-yellow-500 p-1 rounded-xl shadow-lg transform rotate-1 transition-transform hover:rotate-0">
             <div className="bg-white rounded-lg overflow-hidden">
                
                {/* Meme Media Display */}
                <div className="w-full bg-black/5 flex items-center justify-center border-b border-gray-100 relative">
                   {config.memeType === 'video' ? (
                     <div className="relative w-full">
                        <img 
                          src={config.memeUrl} 
                          className="w-full max-h-48 object-cover opacity-80" 
                          alt="Meme Context" 
                        />
                        {/* Video Badge Removed per request */}
                     </div>
                   ) : (
                     <img 
                        src={config.memeUrl} 
                        crossOrigin="anonymous"
                        className="w-full max-h-48 object-cover" 
                        alt="Meme Context" 
                     />
                   )}
                   {/* Overlay WebWits Tag */}
                   <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      itswebwits.com
                   </div>
                </div>

                <div className="p-6 text-left relative">
                  <div className="absolute top-0 right-0 opacity-5 pointer-events-none">
                     <Trophy size={100} />
                  </div>
                  
                  {config.rank && (
                    <div className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider mb-3">
                      <Trophy size={10} />
                      <span>Rank #{config.rank}</span>
                    </div>
                  )}
                  
                  <p className="text-xl font-bold text-gray-900 leading-tight mb-4">
                    "{config.content}"
                  </p>
                  
                  <div className="flex justify-between items-end border-t border-gray-100 pt-3">
                     <div className="text-xs text-gray-500">
                        by <span className="font-bold text-black">@{config.username}</span>
                     </div>
                     <div className="text-xs font-black text-yellow-500 tracking-tight">
                        WEBWITS
                     </div>
                  </div>
               </div>
             </div>
          </div>
          
          {/* Pro Tip removed per request */}
        </div>

        {/* Share Buttons */}
        <div className="p-6 grid grid-cols-3 gap-3">
           
           {/* Copy / Link Button */}
           <button 
             onClick={() => handleShareImage('copy')}
             disabled={generating}
             className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
           >
             <div className="w-10 h-10 bg-gradient-to-tr from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                {generating ? <Loader2 className="animate-spin" size={20} /> : <LinkIcon size={20} />}
             </div>
             <span className="text-[10px] font-bold text-gray-500">
               Copy Link
             </span>
           </button>

           {/* WhatsApp */}
           <button 
             onClick={() => handleShareImage('whatsapp')}
             disabled={generating}
             className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
           >
             <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                {generating ? <Loader2 className="animate-spin" size={20} /> : <MessageCircle size={20} />}
             </div>
             <span className="text-[10px] font-bold text-gray-500">WhatsApp</span>
           </button>

           {/* Twitter / X */}
           <button 
             onClick={() => handleShareImage('twitter')}
             disabled={generating}
             className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
           >
             <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                {generating ? <Loader2 className="animate-spin" size={20} /> : <Twitter size={20} />}
             </div>
             <span className="text-[10px] font-bold text-gray-500">X.com</span>
           </button>
        </div>

      </motion.div>
    </div>
  );
}
