"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Send, ThumbsUp, Trophy, Loader2, Clock, Flame } from "lucide-react";
import Header from "./Header";

export default function MainApp({ session }) {
  const [meme, setMeme] = useState(null);
  const [captions, setCaptions] = useState([]);
  const [newCaption, setNewCaption] = useState("");
  const [leaderboard, setLeaderboard] = useState([]);
  
  // New UI states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState("top");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (captions.length === 0) return;
    
    const sorted = [...captions].sort((a, b) => {
      if (sortBy === "top") {
        return b.vote_count - a.vote_count;
      } else {
        return new Date(b.created_at) - new Date(a.created_at);
      }
    });
    
    if (JSON.stringify(sorted.map(c => c.id)) !== JSON.stringify(captions.map(c => c.id))) {
      setCaptions(sorted);
    }
  }, [sortBy, captions]);

  async function fetchData() {
    try {
      setLoading(true);
      
      let { data: activeMeme, error: memeError } = await supabase
        .from("memes")
        .select("*")
        .eq("status", "active")
        .single();

      if (memeError && memeError.code !== 'PGRST116') {
         console.error("Error fetching meme:", memeError);
      }

      setMeme(activeMeme);

      let currentCaptions = [];
      if (activeMeme) {
        const { data, error: captionsError } = await supabase
          .from("comments")
          .select(`*, profiles(username)`)
          .eq("meme_id", activeMeme.id);
        
        if (captionsError) console.error(captionsError);
        currentCaptions = data || [];
      }
      
      currentCaptions.sort((a, b) => b.vote_count - a.vote_count);
      setCaptions(currentCaptions);

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
      fetchData();
    }
  };

  const handleVote = async (commentId) => {
    const previousCaptions = [...captions];
    setCaptions((current) =>
      current.map((c) =>
        c.id === commentId ? { ...c, vote_count: c.vote_count + 1 } : c
      )
    );

    const { error } = await supabase.from("votes").insert({
      user_id: session.user.id,
      comment_id: commentId,
    });

    if (error) {
      alert("You already voted for this one!");
      setCaptions(previousCaptions);
      return;
    }

    await supabase.rpc("increment_vote", { row_id: commentId });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-yellow-400">
        <Loader2 className="animate-spin mr-2" /> Loading WebWits...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      
      {/* Note: You may want to update Header.js as well to match the dark theme */}
      <Header session={session} />

      <div className="max-w-4xl mx-auto p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Main Column: Meme & Captions */}
        <div className="md:col-span-2 space-y-6">
          {/* Active Meme Card */}
          <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
            {meme ? (
              <img src={meme.image_url} alt="Daily Challenge" className="w-full h-auto border-b border-gray-700" />
            ) : (
              <div className="h-64 flex flex-col items-center justify-center bg-gray-900/50 text-gray-500 p-6 text-center">
                <Clock size={48} className="mb-2 opacity-50" />
                <p>No active meme right now.</p>
                <p className="text-sm">Check back later for the next challenge!</p>
              </div>
            )}
            
            {meme && (
              <form onSubmit={submitCaption} className="p-4 flex gap-2 bg-gray-800/30">
                <input
                  type="text"
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  placeholder="Write a witty caption..."
                  disabled={submitting}
                  className="flex-1 p-3 rounded-lg bg-gray-900/80 border border-gray-600 text-white placeholder-gray-600 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none transition-all disabled:opacity-50"
                />
                <button 
                  type="submit"
                  disabled={submitting || !newCaption.trim()}
                  className="bg-yellow-400 text-black font-bold p-3 rounded-lg hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition hover:scale-105"
                >
                  {submitting ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                </button>
              </form>
            )}
          </div>

          {/* Captions Header & Filters */}
          <div className="flex justify-between items-center px-1">
             <h3 className="font-bold text-gray-300">
               {captions.length} {captions.length === 1 ? 'Caption' : 'Captions'}
             </h3>
             <div className="flex gap-2 text-sm bg-gray-800/50 p-1 rounded-lg border border-gray-700 shadow-sm">
               <button 
                 onClick={() => setSortBy('top')}
                 className={`px-3 py-1 rounded flex items-center gap-1 transition ${sortBy === 'top' ? 'bg-yellow-400 text-black font-bold' : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`}
               >
                 <Flame size={14} /> Top
               </button>
               <button 
                 onClick={() => setSortBy('new')}
                 className={`px-3 py-1 rounded flex items-center gap-1 transition ${sortBy === 'new' ? 'bg-yellow-400 text-black font-bold' : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`}
               >
                 <Clock size={14} /> New
               </button>
             </div>
          </div>

          {/* Captions List */}
          <div className="space-y-4">
            {captions.map((caption) => (
              <div key={caption.id} className="bg-gray-800/50 backdrop-blur-md border border-gray-700 p-4 rounded-lg shadow flex justify-between items-start transition hover:border-gray-600">
                <div className="flex-1 pr-4">
                  <p className="font-semibold text-xs text-gray-500 mb-1 flex items-center gap-1">
                    @{caption.profiles?.username || "anon"}
                    {caption.user_id === session.user.id && (
                      <span className="bg-yellow-400/20 text-yellow-400 px-1.5 py-0.5 rounded-full text-[10px] border border-yellow-400/30">YOU</span>
                    )}
                  </p>
                  <p className="text-lg text-gray-200 leading-snug">{caption.content}</p>
                </div>
                <button
                  onClick={() => handleVote(caption.id)}
                  className="flex flex-col items-center gap-1 text-gray-500 hover:text-yellow-400 transition group min-w-[3rem]"
                >
                  <ThumbsUp size={20} className="group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-sm">{caption.vote_count}</span>
                </button>
              </div>
            ))}
            
            {meme && captions.length === 0 && (
              <div className="text-center py-10 text-gray-500">
                Be the first to caption this! 🚀
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Leaderboard */}
        <div className="md:col-span-1">
          <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 p-4 rounded-xl shadow sticky top-24">
            <div className="flex items-center gap-2 mb-4 text-yellow-400 pb-2 border-b border-gray-700">
              <Trophy size={20} />
              <h2 className="font-bold text-lg">Weekly Leaders</h2>
            </div>
            <ul className="space-y-2">
              {leaderboard.map((user, index) => (
                <li key={index} className="flex justify-between items-center p-2 rounded hover:bg-gray-700/50 transition">
                  <div className="flex items-center gap-3">
                    <span className={`
                      w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold
                      ${index === 0 ? 'bg-yellow-400 text-black' : 
                        index === 1 ? 'bg-gray-400 text-black' : 
                        index === 2 ? 'bg-orange-400 text-black' : 'bg-gray-700 text-gray-400'}
                    `}>
                      {index + 1}
                    </span>
                    <span className="font-medium text-sm text-gray-300">{user.username}</span>
                  </div>
                  <span className="font-bold text-yellow-400 text-sm">{user.weekly_points}pts</span>
                </li>
              ))}
              {leaderboard.length === 0 && (
                <p className="text-sm text-center py-4 text-gray-500">No points yet this week!</p>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
