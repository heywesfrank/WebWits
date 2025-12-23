"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Send, ThumbsUp, Trophy, LogOut, Loader2, Clock, Flame } from "lucide-react";

export default function MainApp({ session }) {
  const [meme, setMeme] = useState(null);
  const [captions, setCaptions] = useState([]);
  const [newCaption, setNewCaption] = useState("");
  const [leaderboard, setLeaderboard] = useState([]);
  
  // New UI states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState("top"); // 'top' or 'new'

  // Load data when this component mounts
  useEffect(() => {
    fetchData();
  }, []);

  // Re-sort captions whenever the sort preference or captions list changes
  useEffect(() => {
    if (captions.length === 0) return;
    
    const sorted = [...captions].sort((a, b) => {
      if (sortBy === "top") {
        return b.vote_count - a.vote_count;
      } else {
        return new Date(b.created_at) - new Date(a.created_at);
      }
    });
    
    // Only update if the order actually changed to avoid infinite loops
    if (JSON.stringify(sorted.map(c => c.id)) !== JSON.stringify(captions.map(c => c.id))) {
      setCaptions(sorted);
    }
  }, [sortBy, captions]);

  async function fetchData() {
    try {
      setLoading(true);
      
      // A. Get today's active meme
      let { data: activeMeme, error: memeError } = await supabase
        .from("memes")
        .select("*")
        .eq("status", "active")
        .single();

      if (memeError && memeError.code !== 'PGRST116') {
         console.error("Error fetching meme:", memeError);
      }

      setMeme(activeMeme);

      // B. If there is a meme, get the captions
      let currentCaptions = [];
      if (activeMeme) {
        const { data, error: captionsError } = await supabase
          .from("comments")
          .select(`*, profiles(username)`)
          .eq("meme_id", activeMeme.id);
        
        if (captionsError) console.error(captionsError);
        currentCaptions = data || [];
      }
      
      // Initial sort is by Top
      currentCaptions.sort((a, b) => b.vote_count - a.vote_count);
      setCaptions(currentCaptions);

      // C. Get Weekly Leaderboard
      const { data: topUsers, error: leaderError } = await supabase
        .from("profiles")
        .select("username, weekly_points")
        .order("weekly_points", { ascending: false })
        .limit(5);

      if (leaderError) console.error(leaderError);
      setLeaderboard(topUsers || []);

    } catch (error) {
      console.error("Unexpected error:", error);
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
      alert("Error submitting! (Did you already comment?)");
    } else {
      setNewCaption("");
      fetchData(); // Refresh list to show new caption
    }
  };

  const handleVote = async (commentId) => {
    // 1. Optimistic UI Update: Update the UI immediately before the server responds
    const previousCaptions = [...captions];
    setCaptions((current) =>
      current.map((c) =>
        c.id === commentId ? { ...c, vote_count: c.vote_count + 1 } : c
      )
    );

    // 2. Perform the server request
    const { error } = await supabase.from("votes").insert({
      user_id: session.user.id,
      comment_id: commentId,
    });

    if (error) {
      // 3. Revert UI if it fails (e.g., duplicate vote)
      alert("You already voted for this one!");
      setCaptions(previousCaptions);
      return;
    }

    // 4. Update the actual count in the database
    await supabase.rpc("increment_vote", { row_id: commentId });
    
    // Optional: Fetch data again to ensure sync, or rely on the optimistic update
    // fetchData(); 
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-500">
        <Loader2 className="animate-spin mr-2" /> Loading WebWits...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      {/* Header */}
      <nav className="bg-white shadow p-4 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-yellow-600 flex items-center gap-2">
          <span>🤡</span> WebWits
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 hidden sm:inline">
            {session.user.email}
          </span>
          <button 
            onClick={() => supabase.auth.signOut()}
            className="text-gray-500 hover:text-red-500 transition"
            title="Sign Out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Main Column: Meme & Captions */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            {meme ? (
              <img src={meme.image_url} alt="Daily Challenge" className="w-full h-auto" />
            ) : (
              <div className="h-64 flex flex-col items-center justify-center bg-gray-50 text-gray-400 p-6 text-center">
                <Clock size={48} className="mb-2 opacity-50" />
                <p>No active meme right now.</p>
                <p className="text-sm">Check back later for the next challenge!</p>
              </div>
            )}
            
            {meme && (
              <form onSubmit={submitCaption} className="p-4 border-t flex gap-2 bg-gray-50">
                <input
                  type="text"
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  placeholder="Write a witty caption..."
                  disabled={submitting}
                  className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50"
                />
                <button 
                  type="submit"
                  disabled={submitting || !newCaption.trim()}
                  className="bg-black text-white p-2 rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {submitting ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                </button>
              </form>
            )}
          </div>

          {/* Captions Header & Filters */}
          <div className="flex justify-between items-center px-1">
             <h3 className="font-bold text-gray-700">
               {captions.length} {captions.length === 1 ? 'Caption' : 'Captions'}
             </h3>
             <div className="flex gap-2 text-sm bg-white p-1 rounded-lg border shadow-sm">
               <button 
                 onClick={() => setSortBy('top')}
                 className={`px-3 py-1 rounded flex items-center gap-1 transition ${sortBy === 'top' ? 'bg-yellow-100 text-yellow-800 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
               >
                 <Flame size={14} /> Top
               </button>
               <button 
                 onClick={() => setSortBy('new')}
                 className={`px-3 py-1 rounded flex items-center gap-1 transition ${sortBy === 'new' ? 'bg-yellow-100 text-yellow-800 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
               >
                 <Clock size={14} /> New
               </button>
             </div>
          </div>

          <div className="space-y-4">
            {captions.map((caption) => (
              <div key={caption.id} className="bg-white p-4 rounded-lg shadow flex justify-between items-start transition hover:shadow-md">
                <div className="flex-1 pr-4">
                  <p className="font-semibold text-xs text-gray-400 mb-1 flex items-center gap-1">
                    @{caption.profiles?.username || "anon"}
                    {/* Highlight user's own comments */}
                    {caption.user_id === session.user.id && (
                      <span className="bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-full text-[10px]">YOU</span>
                    )}
                  </p>
                  <p className="text-lg text-gray-800 leading-snug">{caption.content}</p>
                </div>
                <button
                  onClick={() => handleVote(caption.id)}
                  className="flex flex-col items-center gap-1 text-gray-400 hover:text-yellow-600 transition group min-w-[3rem]"
                >
                  <ThumbsUp size={20} className="group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-sm">{caption.vote_count}</span>
                </button>
              </div>
            ))}
            
            {meme && captions.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                Be the first to caption this! 🚀
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Leaderboard */}
        <div className="md:col-span-1">
          <div className="bg-white p-4 rounded-xl shadow sticky top-24 border border-gray-100">
            <div className="flex items-center gap-2 mb-4 text-yellow-600 pb-2 border-b">
              <Trophy size={20} />
              <h2 className="font-bold text-lg">Weekly Leaders</h2>
            </div>
            <ul className="space-y-2">
              {leaderboard.map((user, index) => (
                <li key={index} className="flex justify-between items-center p-2 rounded hover:bg-yellow-50 transition">
                  <div className="flex items-center gap-3">
                    <span className={`
                      w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold
                      ${index === 0 ? 'bg-yellow-400 text-black' : 
                        index === 1 ? 'bg-gray-300 text-gray-800' : 
                        index === 2 ? 'bg-orange-300 text-orange-900' : 'bg-gray-100 text-gray-500'}
                    `}>
                      {index + 1}
                    </span>
                    <span className="font-medium text-sm text-gray-700">{user.username}</span>
                  </div>
                  <span className="font-bold text-yellow-600 text-sm">{user.weekly_points}pts</span>
                </li>
              ))}
              {leaderboard.length === 0 && (
                <p className="text-sm text-center py-4 text-gray-400">No points yet this week!</p>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
