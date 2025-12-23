"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Send, ThumbsUp, Trophy, LogOut } from "lucide-react";

export default function MainApp({ session }) {
  const [meme, setMeme] = useState(null);
  const [captions, setCaptions] = useState([]);
  const [newCaption, setNewCaption] = useState("");
  const [leaderboard, setLeaderboard] = useState([]);

  // Load data when this component mounts
  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    // A. Get today's active meme
    let { data: activeMeme } = await supabase
      .from("memes")
      .select("*")
      .eq("status", "active")
      .single();

    setMeme(activeMeme);

    // B. If there is a meme, get the captions
    if (activeMeme) {
      const { data: currentCaptions } = await supabase
        .from("comments")
        .select(`*, profiles(username)`)
        .eq("meme_id", activeMeme.id)
        .order("vote_count", { ascending: false });
      setCaptions(currentCaptions || []);
    }

    // C. Get Weekly Leaderboard
    const { data: topUsers } = await supabase
      .from("profiles")
      .select("username, weekly_points")
      .order("weekly_points", { ascending: false })
      .limit(5);
      
    setLeaderboard(topUsers || []);
  }

  const submitCaption = async (e) => {
    e.preventDefault();
    if (!newCaption.trim()) return;

    const { error } = await supabase.from("comments").insert({
      user_id: session.user.id,
      meme_id: meme.id,
      content: newCaption,
    });

    if (error) {
      alert("Error submitting! (Did you already comment?)");
    } else {
      setNewCaption("");
      fetchData(); // Refresh list
    }
  };

  const handleVote = async (commentId) => {
    const { error } = await supabase.from("votes").insert({
      user_id: session.user.id,
      comment_id: commentId,
    });

    if (error) {
      alert("You already voted for this one!");
      return;
    }

    await supabase.rpc("increment_vote", { row_id: commentId });
    fetchData();
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      {/* Header */}
      <nav className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-yellow-600">WebWits</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            {session.user.email}
          </span>
          <button onClick={() => supabase.auth.signOut()}>
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
              <div className="h-64 flex items-center justify-center bg-gray-200 text-gray-500">
                No active meme right now. Come back later!
              </div>
            )}
            
            {meme && (
              <form onSubmit={submitCaption} className="p-4 border-t flex gap-2">
                <input
                  type="text"
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  placeholder="Write a witty caption..."
                  className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
                <button className="bg-black text-white p-2 rounded hover:bg-gray-800">
                  <Send size={20} />
                </button>
              </form>
            )}
          </div>

          <div className="space-y-4">
            {captions.map((caption) => (
              <div key={caption.id} className="bg-white p-4 rounded-lg shadow flex justify-between items-start">
                <div>
                  <p className="font-semibold text-sm text-gray-500 mb-1">
                    @{caption.profiles?.username || "anon"}
                  </p>
                  <p className="text-lg">{caption.content}</p>
                </div>
                <button
                  onClick={() => handleVote(caption.id)}
                  className="flex items-center gap-1 text-gray-500 hover:text-yellow-600 transition"
                >
                  <ThumbsUp size={18} />
                  <span>{caption.vote_count}</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar: Leaderboard */}
        <div className="md:col-span-1">
          <div className="bg-white p-4 rounded-xl shadow sticky top-4">
            <div className="flex items-center gap-2 mb-4 text-yellow-600">
              <Trophy />
              <h2 className="font-bold text-lg">Weekly Leaders</h2>
            </div>
            <ul className="space-y-2">
              {leaderboard.map((user, index) => (
                <li key={index} className="flex justify-between p-2 rounded bg-gray-50">
                  <span className="font-medium">#{index + 1} {user.username}</span>
                  <span className="font-bold text-yellow-600">{user.weekly_points}pts</span>
                </li>
              ))}
              {leaderboard.length === 0 && (
                <p className="text-sm text-gray-400">No points yet this week!</p>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
