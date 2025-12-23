"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Send, Mail, AlertCircle, ArrowLeft } from "lucide-react"; // Added Icons

export default function Login() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false); // New: Track success state
  const [errorMsg, setErrorMsg] = useState(""); // New: Track errors

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(""); // Clear previous errors

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}`,
      },
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      setSent(true); // Switch UI to success view
      setLoading(false);
    }
  };

  // 1. Success View (replaces alert)
  if (sent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 text-white">
        <div className="w-full max-w-md bg-gray-800/50 backdrop-blur-md border border-gray-700 p-8 rounded-2xl shadow-2xl text-center">
          <div className="inline-block p-4 bg-green-500/20 rounded-full mb-6 text-green-400">
            <Mail size={48} />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Check your inbox!</h2>
          <p className="text-gray-400 mb-8">
            We sent a magic link to <span className="text-yellow-400">{email}</span>.
            <br />
            Click it to sign in.
          </p>
          <button
            onClick={() => setSent(false)}
            className="text-sm text-gray-500 hover:text-white flex items-center justify-center gap-2 w-full transition-colors"
          >
            <ArrowLeft size={16} /> Try a different email
          </button>
        </div>
      </div>
    );
  }

  // 2. Default Login View
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
              disabled={loading} // Disable input while loading
              className="w-full p-3 rounded-lg bg-gray-900/80 border border-gray-600 text-white placeholder-gray-600 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              required
            />
          </div>

          {/* Inline Error Message */}
          {errorMsg && (
            <div className="p-3 rounded bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

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
