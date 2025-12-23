"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Send } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 text-white">
      <div className="w-full max-w-md bg-gray-800/50 backdrop-blur-md border border-gray-700 p-8 rounded-2xl shadow-2xl">
        
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-yellow-400/10 rounded-full mb-4">
            <span className="text-4xl">🤡</span>
          </div>
          <h1 className="text-4xl font-black text-yellow-400 tracking-tight mb-2">
            WebWits
          </h1>
          <p className="text-gray-400 text-sm">
            Daily memes. Witty captions. Eternal glory.
          </p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">
              Sign in with Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-900/80 border border-gray-600 text-white placeholder-gray-600 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none transition-all"
              required
            />
          </div>

          <button
            disabled={loading}
            className="group relative w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold p-3 rounded-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              "Sending Magic Link..."
            ) : (
              <>
                <span>Enter the Arena</span>
                <Send size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-500">
          No password needed. We'll send a magic link to your inbox.
        </p>
      </div>
    </div>
  );
}
