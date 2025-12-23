"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Send, ThumbsUp, Trophy, Loader2, Clock, Flame, 
  Share2, Flag, History 
} from "lucide-react";
import { motion } from "framer-motion";
import Header from "./Header";
import ArchiveSection from "./ArchiveSection";

import ToastContainer from "./ToastContainer";
import Skeleton from "./Skeleton";
import LeaderboardList from "./LeaderboardList";
import UserProfileModal from "./UserProfileModal";
import LeaderboardModal from "./LeaderboardModal";

export default function MainApp({ session }) {
  const [meme, setMeme] = useState(null);
  const [captions, setCaptions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [archivedMemes, setArchivedMemes] = useState([]);
  
  const [newCaption, setNewCaption] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState("top");
  const [viewMode, setViewMode] = useState("active"); 
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [toasts, setToasts] = useState([]);

  const addToast = (msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  useEffect(() => {
    fetchData();
    setupRealtime();
    const timer = setInterval(() => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setUTCHours(24, 0, 0, 0);
      const diff = tomorrow - now;
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (captions.length === 0) return;
    const sorted = [...captions].sort((a, b) => 
      sortBy === "top" ? b.vote_count - a.vote_count : new Date(b.created_at) - new Date(a.created_at)
    );
    if (JSON.stringify(sorted.map(c => c.id)) !== JSON.stringify(captions.map(c => c.id))) {
      setCaptions(sorted);
    }
  }, [sortBy, captions]);

  const setupRealtime = () => {
    const channel = supabase
      .channel('public:comments')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, async (payload) => {
        if(payload.new.meme_id !== meme?.id) return;
        const { data: newCommentData } = await supabase
          .from('comments')
          .select(`*, profiles(username)`)
          .eq('id', payload.new.id)
          .single();
        if (newCommentData) {
          setCaptions(current => [newCommentData, ...current]);
          addToast(`New caption from @${newCommentData.profiles?.username || 'anon'}!`, 'info');
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'comments' }, (payload) => {
        setCaptions(current => 
          current.map(c => c.id === payload.new.id ? { ...c, vote_count: payload.new.vote_count } : c)
        );
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  };

  async function fetchData() {
    try {
      setLoading(true);
      let { data: activeMeme } = await supabase.from("memes").select("*").eq("status", "active").single();
      setMeme(activeMeme);
      let { data: archives } = await supabase.from("memes").select("*").neq("status", "active").order("created_at", { ascending: false });
      setArchivedMemes(archives || []);
      if (activeMeme) {
        const { data } = await supabase.from("comments").select(`*, profiles(username)`).eq("meme_id", activeMeme.id);
        setCaptions(data || []);
      }
      const { data: topUsers } = await supabase.from("profiles").select("username, weekly_points").order("weekly_points", { ascending: false }).limit(5);
      setLeaderboard(topUsers || []);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }

  const submitCaption = async (e) => {
    e.preventDefault();
    if (!newCaption.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from("comments").insert({
      user_id: session.user.id,
      meme_id: meme.id,
      content: newCaption,
    });
    setSubmitting(false);
    if (error) {
      addToast(error.message, 'error');
    } else {
      setNewCaption("");
      addToast("Caption submitted successfully!");
    }
  };

  const handleVote = async (commentId) => {
    const previousCaptions = [...captions];
    setCaptions(current =>
      current.map(c => c.id === commentId ? { ...c, vote_count: c.vote_count + 1, hasVoted: true } : c)
    );
    const { error } = await supabase.from("votes").insert({
      user_id: session.user.id,
      comment_id: commentId,
    });
    if (error) {
      setCaptions(previousCaptions); 
      addToast("You already voted for this!", "error");
    } else {
      await supabase.rpc("increment_vote", { row_id: commentId });
      addToast("Vote cast!", "success");
    }
  };

  const handleShare = async (captionText) => {
    const text = `WebWits Daily Challenge:\n"${captionText}"\n\nJoin the battle: https://web-wits.vercel.app`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'WebWits', text });
      } catch (err) { console.log('Share canceled'); }
    } else {
      navigator.clipboard.writeText(text);
      addToast("Copied to clipboard!");
    }
  };

  const handleReport = (commentId) => {
    setCaptions(current => current.filter(c => c.id !== commentId));
    addToast("Caption reported and hidden.", "info");
  };

  if (loading && !meme) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-4">
         <Loader2 className="animate-spin text-yellow-500 w-10 h-10" />
         <p className="text-gray-500 animate-pulse font-mono">Summoning memes...</p>
      </div>
    );
  }

  return (
    // Updated background to white and text to gray
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-yellow-200 selection:text-black pb-20 md:pb-0">
      <Header session={session} onOpenProfile={() => setShowProfileModal(true)} />
      
      <ToastContainer toasts={toasts} removeToast={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
      
      <UserProfileModal user={session.user} isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
      <LeaderboardModal leaderboard={leaderboard} isOpen={showLeaderboardModal} onClose={() => setShowLeaderboardModal(false)} />

      <div className="max-w-4xl mx-auto p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Main Column */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Desktop Toggles */}
          <div className="hidden md:flex bg-gray-100 p-1 rounded-xl border border-gray-200 w-fit">
            <button 
              onClick={() => setViewMode('active')}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition ${viewMode === 'active' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <Flame size={16} /> Active Battle
            </button>
            <button 
              onClick={() => setViewMode('archive')}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition ${viewMode === 'archive' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <History size={16} /> Archive
            </button>
          </div>

          {viewMode === 'active' ? (
            <>
              {/* Active Meme Card */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden relative group">
                <div className="absolute top-4 right-4 bg-black/70 backdrop-blur text-white text-xs font-mono py-1 px-3 rounded-full border border-white/10 flex items-center gap-2 z-10">
                  <Clock size={12} className="text-yellow-400" /> 
                  <span>Ends in: {timeLeft}</span>
                </div>

                {loading ? (
                  <Skeleton className="w-full h-96" />
                ) : meme ? (
                  <img src={meme.image_url} alt="Daily Challenge" className="w-full h-auto" />
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">No active meme.</div>
                )}
                
                {meme && (
                  <form onSubmit={submitCaption} className="p-4 flex gap-2 bg-gray-50 border-t border-gray-200">
                    <input
                      type="text"
                      value={newCaption}
                      onChange={(e) => setNewCaption(e.target.value)}
                      placeholder="Write a witty caption..."
                      disabled={submitting}
                      className="flex-1 p-3 rounded-lg bg-white border border-gray-300 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none transition-all placeholder:text-gray-500 text-gray-900"
                    />
                    <button 
                      type="submit"
                      disabled={submitting || !newCaption.trim()}
                      className="bg-yellow-400 text-black font-bold p-3 rounded-lg hover:bg-yellow-300 disabled:opacity-50 transition shadow-sm"
                    >
                      {submitting ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                    </button>
                  </form>
                )}
              </div>

              {/* Captions List */}
              <div className="flex justify-between items-center px-1">
                 <h3 className="font-bold text-gray-800 font-display text-lg">
                   {captions.length} {captions.length === 1 ? 'Caption' : 'Captions'}
                 </h3>
                 <div className="flex gap-2 text-sm bg-gray-100 p-1 rounded-lg border border-gray-200">
                   <button onClick={() => setSortBy('top')} className={`px-3 py-1 rounded transition ${sortBy === 'top' ? 'bg-white text-yellow-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>Top</button>
                   <button onClick={() => setSortBy('new')} className={`px-3 py-1 rounded transition ${sortBy === 'new' ? 'bg-white text-yellow-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>New</button>
                 </div>
              </div>

              <div className="space-y-4">
                {loading ? (
                   [1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)
                ) : captions.map((caption) => (
                  <div key={caption.id} className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm flex gap-4 transition hover:border-gray-300 group">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-xs text-gray-500">@{caption.profiles?.username || "anon"}</span>
                        {caption.user_id === session.user.id && (
                          <span className="bg-yellow-100 text-yellow-700 text-[10px] px-1.5 py-0.5 rounded border border-yellow-200 font-bold">YOU</span>
                        )}
                        {caption.vote_count > 10 && <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded border border-red-200">🔥 Hot</span>}
                      </div>
                      <p className="text-lg text-gray-800 leading-snug font-medium">{caption.content}</p>
                      
                      {/* Action Bar */}
                      <div className="flex gap-4 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleShare(caption.content)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-800 transition">
                          <Share2 size={12} /> Share
                        </button>
                        <button onClick={() => handleReport(caption.id)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition">
                          <Flag size={12} /> Report
                        </button>
                      </div>
                    </div>
                    
                    {/* Animated Vote Button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleVote(caption.id)}
                      className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors
                        ${caption.hasVoted ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}
                      `}
                    >
                      <ThumbsUp 
                        size={24} 
                        className={`transition-all ${caption.vote_count > 0 ? 'fill-yellow-100' : ''}`} 
                      />
                      <span className="font-bold text-sm">{caption.vote_count}</span>
                    </motion.button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <ArchiveSection archives={archivedMemes} />
          )}
        </div>

        {/* Sidebar (Hidden on Mobile) */}
        <div className="hidden md:block md:col-span-1 space-y-6">
          <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm sticky top-24">
            <div className="flex items-center gap-2 mb-4 text-yellow-500 pb-2 border-b border-gray-100">
              <Trophy size={20} />
              <h2 className="font-bold text-lg font-display">Weekly Leaders</h2>
            </div>
            
            <LeaderboardList leaderboard={leaderboard} />
          </div>
          
           <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-center">
             <a href="/how-it-works" className="text-sm font-bold text-gray-500 hover:text-yellow-600 transition">
               🤔 How to play?
             </a>
           </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 flex justify-around z-40 pb-6 shadow-[0_-5px_10px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => setViewMode('active')} 
          className={`flex flex-col items-center gap-1 text-xs font-bold transition-all ${viewMode === 'active' ? 'text-yellow-500 scale-105' : 'text-gray-400'}`}
        >
          <Flame size={20} />
          <span>Battle</span>
        </button>
        
        <button 
          onClick={() => setShowLeaderboardModal(true)} 
          className="flex flex-col items-center gap-1 text-xs font-bold text-gray-400 active:text-gray-900 transition-all"
        >
          <Trophy size={20} />
          <span>Rank</span>
        </button>

        <button 
          onClick={() => setViewMode('archive')} 
          className={`flex flex-col items-center gap-1 text-xs font-bold transition-all ${viewMode === 'archive' ? 'text-yellow-500 scale-105' : 'text-gray-400'}`}
        >
          <History size={20} />
          <span>Archive</span>
        </button>
      </div>

    </div>
  );
}
