"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; // Imports the helper we made earlier
import { Send, ThumbsUp, Trophy, LogOut } from "lucide-react";

export default function Home() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [meme, setMeme] = useState(null);
  const [captions, setCaptions] = useState([]);
  const [newCaption, setNewCaption] = useState("");
  const [leaderboard, setLeaderboard] = useState([]);

  // 1. On load, check if user is logged in & fetch data
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchData();
    });

    // Listen for auth changes (magic link clicks)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchData();
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Fetch the "Active" Meme and Leaderboard
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
        .order("vote_count", { ascending: false }); // Show top voted first
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

  // 3. Handle Login (Magic Link)
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}`,
      },
    });
    if (error) alert(error.message);
    else alert("Check your email for the magic link!");
    setLoading(false);
  };

  // 4. Handle Submitting a Caption
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

  // 5. Handle Voting
  const handleVote = async (commentId) => {
    // A. Try to record the vote in the 'votes' table
    const { error } = await supabase.from("votes").insert({
      user_id: session.user.id,
      comment_id: commentId,
    });

    if (error) {
      // If error (likely duplicate vote), alert user
      alert("You already voted for this one!");
      return;
    }

    // B. If successful, increment the count on the comment
    // (In a real app, you'd use a Database Trigger for this, but this is easier for now)
    await supabase.rpc("increment_vote", { row_id: commentId });
    fetchData();
  };

  // --- RENDER UI ---

  // If not logged in, show Login Screen
  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 p-4 text-white">
        <h1 className="mb-8 text-4xl font-bold text-yellow-400">WebWits 🤡</h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-4 w-full max-w-sm">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-3 rounded bg-gray-800 border border-gray-700 focus:border-yellow-400 outline-none"
          />
          <button
            disabled={loading}
            className="bg-yellow-400 text-black font-bold p-3 rounded hover:bg-yellow-300 transition"
          >
            {loading ? "Sending..." : "Get Magic Link"}
          </button>
        </form>
      </div>
    );
  }

  // If logged in, show Main App
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
          {/* The Daily Meme */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            {meme ? (
              <img src={meme.image_url} alt="Daily Challenge" className="w-full h-auto" />
            ) : (
              <div className="h-64 flex items-center justify-center bg-gray-200 text-gray-500">
                No active meme right now. Come back later!
              </div>
            )}
            
            {/* Input Area */}
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

          {/* Caption Feed */}
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
