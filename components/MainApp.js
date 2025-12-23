"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Send, ThumbsUp, Trophy, Loader2, Clock, Flame, 
  Share2, Flag, AlertTriangle, X, History, Award 
} from "lucide-react";
import Header from "./Header";
import ArchiveSection from "./ArchiveSection"; // <--- Imported here

// --- Sub-components ---

// 1. Toast Notification Component
const ToastContainer = ({ toasts, removeToast }) => (
  <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
    {toasts.map((toast) => (
      <div 
        key={toast.id} 
        className={`pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-bold animate-in slide-in-from-right-full transition-all ${
          toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-yellow-400 text-black'
        }`}
      >
        <span>{toast.msg}</span>
        <button onClick={() => removeToast(toast.id)} className="ml-2 hover:opacity-70">
          <X size={14} />
        </button>
      </div>
    ))}
  </div>
);

// 2. Skeleton Loader Component
const Skeleton = ({ className }) => (
  <div className={`bg-gray-700/50 animate-pulse rounded ${className}`} />
);

// 3. User Profile Modal
const UserProfileModal = ({ user, isOpen, onClose }) => {
  if (!isOpen || !user) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-800 border border-gray-700 w-full max-w-md rounded-2xl p-6 relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={24} />
        </button>
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-yellow-400 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl text-black font-black">
            {user.email[0].toUpperCase()}
          </div>
          <h2 className="text-2xl font-bold text-white">{user.email.split('@')[0]}</h2>
          <p className="text-gray-400 text-sm">Contestant</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700 text-center">
            <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">0</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Daily Wins</div>
          </div>
          <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700 text-center">
            <ThumbsUp className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">0</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Total Votes</div>
          </div>
        </div>

        <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
          <h3 className="text-sm font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
            <Award size={16} /> Achievements
          </h3>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-yellow-400/10 text-yellow-400 text-xs rounded border border-yellow-400/20">
              Early Adopter
            </span>
            <span className="px-2 py-1 bg-purple-500/10 text-purple-400 text-xs rounded border border-purple-500/20">
              Meme Lord
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function MainApp({ session }) {
  // Data State
  const [meme, setMeme] = useState(null);
  const [captions, setCaptions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [archivedMemes, setArchivedMemes] = useState([]);
  
  // UI State
  const [newCaption, setNewCaption] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState("top");
  const [viewMode, setViewMode] = useState("active"); // 'active' | 'archive'
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [toasts, setToasts] = useState([]);

  // Toast Helper
  const addToast = (msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  useEffect(() => {
    fetchData();
    setupRealtime();

    // Countdown Timer (Updates every second)
    const timer = setInterval(() => {
      const now = new Date();
      // Assume deadline is next midnight UTC
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

  // Sort Effect
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
        
        // Fetch the profile for the new comment
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
      
      // 1. Fetch Active Meme
      let { data: activeMeme } = await supabase
        .from("memes")
        .select("*")
        .eq("status", "active")
        .single();
      
      setMeme(activeMeme);

      // 2. Fetch Archived Memes
      let { data: archives } = await supabase
        .from("memes")
        .select("*")
        .neq("status", "active")
        .order("created_at", { ascending: false });
      
      setArchivedMemes(archives || []);

      // 3. Fetch Captions for Active Meme
      if (activeMeme) {
        const { data } = await supabase
          .from("comments")
          .select(`*, profiles(username)`)
          .eq("meme_id", activeMeme.id);
        
        setCaptions(data || []);
      }

      // 4. Fetch Leaderboard
      const { data: topUsers } = await supabase
        .from("profiles")
        .select("username, weekly_points")
        .order("weekly_points", { ascending: false })
        .limit(5);

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
    // Optimistic Update
    const previousCaptions = [...captions];
    setCaptions(current =>
      current.map(c => c.id === commentId ? { ...c, vote_count: c.vote_count + 1 } : c)
    );

    const { error } = await supabase.from("votes").insert({
      user_id: session.user.id,
      comment_id: commentId,
    });

    if (error) {
      setCaptions(previousCaptions); // Rollback
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
    // Optimistic Hide
    setCaptions(current => current.filter(c => c.id !== commentId));
    addToast("Caption reported and hidden.", "info");
    // In a real app: await supabase.from('reports').insert(...)
  };

  // --- Render ---

  if (loading && !meme) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center space-y-4">
         <Loader2 className="animate-spin text-yellow-400 w-10 h-10" />
         <p className="text-gray-400 animate-pulse">Summoning memes...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white font-sans selection:bg-yellow-400 selection:text-black">
      <Header session={session} onOpenProfile={() => setShowProfileModal(true)} />
      <ToastContainer toasts={toasts} removeToast={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
      <UserProfileModal user={session.user} isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />

      <div className="max-w-4xl mx-auto p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Main Column */}
        <div className="md:col-span-2 space-y-6">
          
          {/* View Toggles */}
          <div className="flex bg-gray-800/50 p-1 rounded-xl border border-gray-700 w-fit">
            <button 
              onClick={() => setViewMode('active')}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition ${viewMode === 'active' ? 'bg-yellow-400 text-black' : 'text-gray-400 hover:text-white'}`}
            >
              <Flame size={16} /> Active Battle
            </button>
            <button 
              onClick={() => setViewMode('archive')}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition ${viewMode === 'archive' ? 'bg-yellow-400 text-black' : 'text-gray-400 hover:text-white'}`}
            >
              <History size={16} /> Archive
            </button>
          </div>

          {viewMode === 'active' ? (
            <>
              {/* Active Meme Card */}
              <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-xl shadow-2xl overflow-hidden relative group">
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur text-white text-xs font-mono py-1 px-3 rounded-full border border-white/10 flex items-center gap-2">
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
                  <form onSubmit={submitCaption} className="p-4 flex gap-2 bg-gray-900/40 border-t border-gray-700/50">
                    <input
                      type="text"
                      value={newCaption}
                      onChange={(e) => setNewCaption(e.target.value)}
                      placeholder="Write a witty caption..."
                      disabled={submitting}
                      className="flex-1 p-3 rounded-lg bg-gray-900/50 border border-gray-600 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none transition-all"
                    />
                    <button 
                      type="submit"
                      disabled={submitting || !newCaption.trim()}
                      className="bg-yellow-400 text-black font-bold p-3 rounded-lg hover:bg-yellow-300 disabled:opacity-50 transition"
                    >
                      {submitting ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                    </button>
                  </form>
                )}
              </div>

              {/* Captions List */}
              <div className="flex justify-between items-center px-1">
                 <h3 className="font-bold text-gray-300">
                   {captions.length} {captions.length === 1 ? 'Caption' : 'Captions'}
                 </h3>
                 <div className="flex gap-2 text-sm bg-gray-800/50 p-1 rounded-lg border border-gray-700">
                   <button onClick={() => setSortBy('top')} className={`px-3 py-1 rounded transition ${sortBy === 'top' ? 'bg-yellow-400/20 text-yellow-400' : 'text-gray-400 hover:text-white'}`}>Top</button>
                   <button onClick={() => setSortBy('new')} className={`px-3 py-1 rounded transition ${sortBy === 'new' ? 'bg-yellow-400/20 text-yellow-400' : 'text-gray-400 hover:text-white'}`}>New</button>
                 </div>
              </div>

              <div className="space-y-4">
                {loading ? (
                   [1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)
                ) : captions.map((caption) => (
                  <div key={caption.id} className="bg-gray-800/40 backdrop-blur-md border border-gray-700/50 p-4 rounded-xl shadow-lg flex gap-4 transition hover:border-gray-600 group">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-xs text-gray-400">@{caption.profiles?.username || "anon"}</span>
                        {caption.user_id === session.user.id && (
                          <span className="bg-yellow-400/20 text-yellow-400 text-[10px] px-1.5 py-0.5 rounded border border-yellow-400/30 font-bold">YOU</span>
                        )}
                        {caption.vote_count > 10 && <span className="text-[10px] bg-red-500/20 text-red-400 px-1 rounded">🔥 Hot</span>}
                      </div>
                      <p className="text-lg text-gray-200 leading-snug">{caption.content}</p>
                      
                      {/* Action Bar */}
                      <div className="flex gap-4 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleShare(caption.content)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition">
                          <Share2 size={12} /> Share
                        </button>
                        <button onClick={() => handleReport(caption.id)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition">
                          <Flag size={12} /> Report
                        </button>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleVote(caption.id)}
                      className="flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-yellow-400 transition h-fit p-2 rounded-lg hover:bg-yellow-400/10"
                    >
                      <ThumbsUp size={24} className={`${caption.vote_count > 0 ? 'fill-yellow-400/20' : ''}`} />
                      <span className="font-bold text-sm">{caption.vote_count}</span>
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            // Archive View using the new component
            <ArchiveSection archives={archivedMemes} />
          )}
        </div>

        {/* Sidebar */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 p-5 rounded-xl shadow sticky top-24">
            <div className="flex items-center gap-2 mb-4 text-yellow-400 pb-2 border-b border-gray-700">
              <Trophy size={20} />
              <h2 className="font-bold text-lg">Weekly Leaders</h2>
            </div>
            <ul className="space-y-3">
              {leaderboard.map((user, index) => (
                <li key={index} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className={`
                      w-6 h-6 flex items-center justify-center rounded text-xs font-black
                      ${index === 0 ? 'bg-yellow-400 text-black shadow-[0_0_10px_rgba(250,204,21,0.5)]' : 
                        index === 1 ? 'bg-gray-400 text-black' : 
                        index === 2 ? 'bg-orange-700 text-white' : 'bg-gray-700 text-gray-400'}
                    `}>
                      {index + 1}
                    </span>
                    <span className="font-medium text-sm text-gray-300">{user.username}</span>
                  </div>
                  <span className="font-mono font-bold text-yellow-400 text-sm">{user.weekly_points}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Helpful Link to How It Works (Optional but recommended) */}
           <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-xl text-center">
             <a href="/how-it-works" className="text-sm font-bold text-gray-400 hover:text-yellow-400 transition">
               🤔 How to play?
             </a>
           </div>

        </div>
      </div>
    </div>
  );
}
