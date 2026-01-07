"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { 
  Send, ThumbsUp, Loader2, Clock, Flame, 
  Share2, Flag, History, Trophy, ArrowLeft 
} from "lucide-react";
import { motion } from "framer-motion";

// Components
import Header from "./Header";
import ArchiveSection from "./ArchiveSection";
import ToastContainer from "./ToastContainer";
import Skeleton from "./Skeleton";
import UserProfileModal from "./UserProfileModal";
import HowToPlayButton from "./HowToPlayButton";
import Onboarding from "./Onboarding";
import LeaderboardWidget, { LeaderboardModal } from "./LeaderboardWidget";

// --- CUSTOM HOOK: Game Logic & State ---
function useGameLogic(session) {
  const [activeMeme, setActiveMeme] = useState(null);
  const [selectedMeme, setSelectedMeme] = useState(null); // For archive detail
  const [captions, setCaptions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [archivedMemes, setArchivedMemes] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("active"); // active, archive, archive-detail
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Toast Helper
  const addToast = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  // 1. Initial Data Fetch
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch User Profile
      if (session?.user) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        setUserProfile(profile);
        if (!profile?.username || !profile?.avatar_url) setShowOnboarding(true);
      } else {
        setUserProfile(null);
      }

      // Fetch Active Meme
      let { data: active } = await supabase.from("memes").select("*").eq("status", "active").single();
      
      // FIX 3: Prevent re-render/reload if meme hasn't changed
      // This ensures the GIF doesn't reload when the window focus changes or session refreshes
      setActiveMeme(prev => (prev?.id === active?.id ? prev : active));

      // Fetch Archives (with self-healing for missing winning_captions)
      let { data: archives } = await supabase
        .from("memes")
        .select(`*, comments (content, vote_count)`)
        .neq("status", "active")
        .order("created_at", { ascending: false });
      
      const processedArchives = (archives || []).map(archive => {
        if (archive.winning_caption) return archive;
        if (archive.comments?.length > 0) {
           const topComment = archive.comments.reduce((p, c) => (p.vote_count > c.vote_count) ? p : c);
           return { ...archive, winning_caption: topComment.content };
        }
        return archive;
      });
      setArchivedMemes(processedArchives);

      // Fetch Active Captions
      if (active) {
        const { data } = await supabase.from("comments").select(`*, profiles(username)`).eq("meme_id", active.id);
        setCaptions(data || []);
      }
      
      // Fetch Leaderboard
      const { data: topUsers } = await supabase.from("profiles").select("username, weekly_points").order("weekly_points", { ascending: false }).limit(5);
      setLeaderboard(topUsers || []);

    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  // 2. Realtime Subscription
  useEffect(() => {
    if (!activeMeme) return;
    const channel = supabase.channel('public:comments')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, async (payload) => {
        if(payload.new.meme_id !== activeMeme.id) return;
        
        // Optimistic check: if we already have this ID (from our own submission), don't duplicate
        setCaptions(curr => {
            if (curr.some(c => c.id === payload.new.id)) return curr;
            // Otherwise, fetch it to get the profile
            supabase.from('comments').select(`*, profiles(username)`).eq('id', payload.new.id).single()
              .then(({ data: newComment }) => {
                 if(newComment) {
                    setCaptions(prev => [newComment, ...prev]);
                    addToast(`New caption from @${newComment.profiles?.username || 'anon'}!`, 'info');
                 }
              });
            return curr;
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'comments' }, (payload) => {
        setCaptions(curr => curr.map(c => c.id === payload.new.id ? { ...c, vote_count: payload.new.vote_count } : c));
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [activeMeme, addToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Actions
  const handleArchiveSelect = async (archiveMeme) => {
    setLoading(true);
    setSelectedMeme(archiveMeme);
    setViewMode('archive-detail');
    const { data } = await supabase.from("comments").select(`*, profiles(username)`).eq("meme_id", archiveMeme.id).order("vote_count", { ascending: false });
    setCaptions(data || []);
    setLoading(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToArena = () => {
    setViewMode('active');
    setSelectedMeme(null);
    fetchData(); // Refresh active data
  };

  return {
    activeMeme, selectedMeme, captions, setCaptions, leaderboard, archivedMemes, userProfile,
    loading, setLoading, viewMode, setViewMode, showOnboarding, setShowOnboarding, toasts, setToasts, addToast,
    fetchData, handleArchiveSelect, handleBackToArena
  };
}

// --- SUB-COMPONENT: Countdown Timer ---
function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState("");
  
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const target = new Date(now);
      target.setUTCHours(5, 0, 0, 0); // 5:00 AM UTC
      if (now > target) target.setDate(target.getDate() + 1);
      
      const diff = target - now;
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute top-4 right-4 bg-black/70 backdrop-blur text-white text-xs font-mono py-1 px-3 rounded-full border border-white/10 flex items-center gap-2 z-10">
      <Clock size={12} className="text-yellow-400" /> 
      <span>Ends in: {timeLeft}</span>
    </div>
  );
}

// --- SUB-COMPONENT: Meme Display Stage ---
function MemeStage({ meme, isActive, loading }) {
  if (loading) return <Skeleton className="w-full h-96" />;
  if (!meme) return <div className="h-64 flex items-center justify-center text-gray-500">No content found.</div>;

  return (
    <div className="relative group bg-black/5">
      {/* Status Badge */}
      {isActive ? (
        <CountdownTimer />
      ) : (
        <div className="absolute top-4 right-4 bg-yellow-400 text-black text-xs font-bold py-1 px-3 rounded-full shadow-lg flex items-center gap-2 z-10">
          <Trophy size={12} className="text-black" /> 
          <span>Winner Declared</span>
        </div>
      )}

      {/* Media */}
      {meme.type === 'video' ? (
        <video 
          src={meme.content_url || meme.image_url} 
          autoPlay muted loop playsInline
          className="w-full h-auto max-h-[600px] object-contain bg-black pointer-events-none" 
        />
      ) : (
        <img src={meme.image_url} alt="Daily Challenge" className="w-full h-auto object-cover" />
      )}
    </div>
  );
}

// --- SUB-COMPONENT: Caption Feed ---
function CaptionFeed({ captions, session, viewMode, onVote, onShare, onReport }) {
  const [sortBy, setSortBy] = useState("top");

  // Local Sort Logic
  const sortedCaptions = [...captions].sort((a, b) => 
    sortBy === "top" ? b.vote_count - a.vote_count : new Date(b.created_at) - new Date(a.created_at)
  );

  return (
    <div className="space-y-4">
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
        return (
          <div key={caption.id} className={`relative bg-white border p-4 rounded-xl shadow-sm flex gap-4 transition hover:border-gray-300 group ${isWinner ? 'border-yellow-400 ring-1 ring-yellow-400 bg-yellow-50/30' : 'border-gray-200'}`}>
            {isWinner && (
              <div className="absolute -top-3 -left-2 bg-yellow-400 text-black text-[10px] font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
                <Trophy size={10} /> CHAMPION
              </div>
            )}

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`font-bold text-xs ${isWinner ? 'text-black' : 'text-gray-500'}`}>@{caption.profiles?.username || "anon"}</span>
                {session && caption.user_id === session.user.id && (
                  <span className="bg-yellow-100 text-yellow-700 text-[10px] px-1.5 py-0.5 rounded border border-yellow-200 font-bold">YOU</span>
                )}
                {caption.vote_count > 10 && viewMode === 'active' && <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded border border-red-200">🔥 Hot</span>}
              </div>
              <p className="text-lg text-gray-800 leading-snug font-medium">{caption.content}</p>
              
              <div className="flex gap-4 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onShare(caption.content)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-800 transition"><Share2 size={12} /> Share</button>
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

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function MainApp({ session }) {
  const {
    activeMeme, selectedMeme, captions, setCaptions, leaderboard, archivedMemes, userProfile,
    loading, viewMode, setViewMode, showOnboarding, setShowOnboarding, toasts, setToasts, addToast,
    fetchData, handleArchiveSelect, handleBackToArena
  } = useGameLogic(session);

  const [newCaption, setNewCaption] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);

  // --- HANDLERS ---
  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    fetchData();
    addToast("Welcome to the arena!", "success");
  };

  const submitCaption = async (e) => {
    e.preventDefault();
    if (!session || !newCaption.trim()) return;
    setSubmitting(true);
    
    // FIX 2: Added .select().single() to return the created row immediately
    const { data: insertedComment, error } = await supabase.from("comments").insert({
      user_id: session.user.id,
      meme_id: activeMeme.id,
      content: newCaption,
    }).select().single();
    
    if (error) {
      addToast(error.message, 'error');
    } else {
      // FIX 2: Manually update local state with the new comment immediately
      // This prevents the need to wait for a refresh or the realtime listener delay
      const commentForUI = {
         ...insertedComment,
         profiles: userProfile || { username: session.user.email.split('@')[0] },
         vote_count: 0
      };
      setCaptions(prev => [commentForUI, ...prev]);

      setNewCaption("");
      addToast("Caption submitted successfully!");
    }
    setSubmitting(false);
  };

  const handleVote = async (commentId) => {
    if (viewMode === 'archive-detail') return; 
    if (!session) { addToast("Please sign in to vote!", "error"); return; }
    
    // Optimistic Update
    const prevCaptions = [...captions];
    setCaptions(curr => curr.map(c => c.id === commentId ? { ...c, vote_count: c.vote_count + 1, hasVoted: true } : c));
    
    const { error } = await supabase.from("votes").insert({ user_id: session.user.id, comment_id: commentId });
    if (error) {
      setCaptions(prevCaptions); // Revert
      addToast("You already voted for this!", "error");
    } else {
      await supabase.rpc("increment_vote", { row_id: commentId });
      addToast("Vote cast!", "success");
    }
  };

  const handleShare = async (text) => {
    const url = "https://web-wits.vercel.app";
    const content = `WebWits Daily Challenge:\n"${text}"\n\nJoin the battle: ${url}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'WebWits', text: content }); } catch (err) {}
    } else {
      navigator.clipboard.writeText(content);
      addToast("Copied to clipboard!");
    }
  };

  const handleReport = (id) => {
    setCaptions(curr => curr.filter(c => c.id !== id));
    addToast("Caption reported and hidden.", "info");
  };

  // --- RENDER HELPERS ---
  if (loading && !activeMeme && viewMode === 'active') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-4">
         <Loader2 className="animate-spin text-yellow-500 w-10 h-10" />
         <p className="text-gray-500 animate-pulse font-mono">Summoning content...</p>
      </div>
    );
  }

  const currentMeme = viewMode === 'active' ? activeMeme : selectedMeme;

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-yellow-200 selection:text-black pb-20 md:pb-0">
      <Header session={session} profile={userProfile} onOpenProfile={() => setShowProfileModal(true)} />
      
      {showOnboarding && <Onboarding session={session} onComplete={handleOnboardingComplete} />}
      <ToastContainer toasts={toasts} removeToast={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
      <UserProfileModal user={session?.user} profile={userProfile} isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
      <LeaderboardModal leaderboard={leaderboard} isOpen={showLeaderboardModal} onClose={() => setShowLeaderboardModal(false)} />

      <div className="max-w-4xl mx-auto p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Main Column */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Game Mode Toggles */}
          <div className="hidden md:flex bg-gray-100 p-1 rounded-xl border border-gray-200 w-fit">
            <button onClick={handleBackToArena} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition ${viewMode === 'active' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
              <Flame size={16} /> Active Battle
            </button>
            <button onClick={() => setViewMode('archive')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition ${viewMode === 'archive' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
              <History size={16} /> Archive
            </button>
          </div>

          {viewMode === 'archive' ? (
             <ArchiveSection archives={archivedMemes} onSelectMeme={handleArchiveSelect} />
          ) : (
            <>
              {/* Back Button (Archive Detail) */}
              {viewMode === 'archive-detail' && (
                <button onClick={() => setViewMode('archive')} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-black mb-2 transition-colors">
                  <ArrowLeft size={16} /> Back to Archives
                </button>
              )}

              {/* Meme Card */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden relative">
                {/* FIX: Only show loading state if we don't have the meme yet.
                   This prevents the skeleton from flashing (and the GIF reloading) 
                   when fetching data in the background or switching tabs.
                */}
                <MemeStage 
                  meme={currentMeme} 
                  isActive={viewMode === 'active'} 
                  loading={loading && !currentMeme} 
                />
                
                {/* Interaction Bar */}
                {viewMode === 'active' && currentMeme && (
                  session ? (
                    <form onSubmit={submitCaption} className="p-4 flex gap-2 bg-gray-50 border-t border-gray-200">
                        <input type="text" value={newCaption} onChange={(e) => setNewCaption(e.target.value)} placeholder="Write a witty caption..." disabled={submitting} className="flex-1 p-3 rounded-lg bg-white border border-gray-300 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none transition-all placeholder:text-gray-500 text-gray-900" />
                        <button type="submit" disabled={submitting || !newCaption.trim()} className="bg-yellow-400 text-black font-bold p-3 rounded-lg hover:bg-yellow-300 disabled:opacity-50 transition shadow-sm">
                          {submitting ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                        </button>
                    </form>
                  ) : (
                    <div className="p-4 bg-gray-50 border-t border-gray-200 text-center">
                        <Link href="/login" className="inline-flex items-center gap-2 text-sm font-bold text-yellow-600 hover:text-yellow-700 hover:underline">
                           <span>Sign in to play & join the battle!</span> <Send size={14} />
                        </Link>
                    </div>
                  )
                )}
                {viewMode === 'archive-detail' && (
                  <div className="p-4 bg-gray-50 border-t border-gray-200 text-center text-sm text-gray-500 font-medium">This contest has ended. All glory is eternal.</div>
                )}
              </div>

              {/* Feed */}
              <CaptionFeed 
                captions={captions} 
                session={session} 
                viewMode={viewMode}
                onVote={handleVote}
                onShare={handleShare}
                onReport={handleReport}
              />
            </>
          )}
        </div>

        {/* Sidebar */}
        {/* FIX 1: Added sticky class here so Leaderboard and Button scroll together */}
        <div className="hidden md:block md:col-span-1 space-y-6 sticky top-24 h-fit">
          <LeaderboardWidget initialWeeklyLeaders={leaderboard} />
          <HowToPlayButton />
        </div>
      </div>

      {/* Mobile Nav */}
       <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 flex justify-around z-40 pb-6 shadow-[0_-5px_10px_rgba(0,0,0,0.05)]">
        <button onClick={handleBackToArena} className={`flex flex-col items-center gap-1 text-xs font-bold transition-all ${viewMode === 'active' ? 'text-yellow-500 scale-105' : 'text-gray-400'}`}>
          <Flame size={20} /> <span>Battle</span>
        </button>
        <button onClick={() => setShowLeaderboardModal(true)} className="flex flex-col items-center gap-1 text-xs font-bold text-gray-400 active:text-gray-900 transition-all">
          <Trophy size={20} /> <span>Rank</span>
        </button>
        <button onClick={() => setViewMode('archive')} className={`flex flex-col items-center gap-1 text-xs font-bold transition-all ${viewMode === 'archive' || viewMode === 'archive-detail' ? 'text-yellow-500 scale-105' : 'text-gray-400'}`}>
          <History size={20} /> <span>Archive</span>
        </button>
      </div>
    </div>
  );
}
