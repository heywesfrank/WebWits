"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Send, Lock, AlertCircle, UserPlus, LogIn } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false); // Toggle between Login and Sign Up
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState(""); // For signup confirmation messages

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setInfoMsg("");

    let error;
    
    if (isSignUp) {
      // Handle Sign Up
      const { error: signUpError, data } = await supabase.auth.signUp({
        email,
        password,
      });
      error = signUpError;
      
      // If signup was successful but no session (email confirmation required)
      if (!error && !data.session) {
        setInfoMsg("Signup successful! Please check your email to confirm your account.");
        setLoading(false);
        return;
      }
    } else {
      // Handle Sign In
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      error = signInError;
    }

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    }
    // On success, the onAuthStateChange in page.js will automatically redirect to MainApp
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

        <form onSubmit={handleAuth} className="flex flex-col gap-5">
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full p-3 rounded-lg bg-gray-900/80 border border-gray-600 text-white placeholder-gray-600 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none transition-all disabled:opacity-50"
              required
            />
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full p-3 pl-10 rounded-lg bg-gray-900/80 border border-gray-600 text-white placeholder-gray-600 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none transition-all disabled:opacity-50"
                required
                minLength={6}
              />
              <Lock size={18} className="absolute left-3 top-3.5 text-gray-500" />
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Info Message (for Email Confirmation) */}
          {infoMsg && (
            <div className="p-3 rounded bg-green-500/10 border border-green-500/20 flex items-center gap-2 text-green-400 text-sm">
              <Send size={16} />
              <span>{infoMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold p-3 rounded-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              "Processing..."
            ) : (
              <>
                <span>{isSignUp ? "Create Account" : "Sign In"}</span>
                {isSignUp ? <UserPlus size={18} /> : <LogIn size={18} />}
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg("");
              setInfoMsg("");
            }}
            className="text-xs text-gray-500 hover:text-yellow-400 transition-colors"
          >
            {isSignUp
              ? "Already have an account? Sign In"
              : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}
