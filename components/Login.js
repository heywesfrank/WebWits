"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Send, Lock, AlertCircle, UserPlus, LogIn } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setInfoMsg("");

    let error;
    
    if (isSignUp) {
      const { error: signUpError, data } = await supabase.auth.signUp({
        email,
        password,
      });
      error = signUpError;
      
      if (!error && !data.session) {
        setInfoMsg("Signup successful! Please check your email to confirm your account.");
        setLoading(false);
        return;
      }
    } else {
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
  };

  return (
    // Changed background to white and text to gray-900
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4 text-gray-900">
      {/* Changed card background to white/gray-50, border to gray-200, shadow */}
      <div className="w-full max-w-md bg-white border border-gray-200 p-8 rounded-2xl shadow-2xl">
        
        <div className="text-center mb-8">
          <img 
            src="/logo.png" 
            alt="WebWits" 
            className="w-64 h-auto object-contain mx-auto mb-6" 
          />
          {/* Changed subtitle text color */}
          <p className="text-gray-600 text-sm">
            Daily memes. Witty captions. Eternal glory.
          </p>
        </div>

        <form onSubmit={handleAuth} className="flex flex-col gap-5">
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              // Updated input styles for light theme
              className="w-full p-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none transition-all disabled:opacity-50"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
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
                // Updated input styles for light theme
                className="w-full p-3 pl-10 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none transition-all disabled:opacity-50"
                required
                minLength={6}
              />
              <Lock size={18} className="absolute left-3 top-3.5 text-gray-400" />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded bg-red-50 border border-red-200 flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {infoMsg && (
            <div className="p-3 rounded bg-green-50 border border-green-200 flex items-center gap-2 text-green-600 text-sm">
              <Send size={16} />
              <span>{infoMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold p-3 rounded-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
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
            className="text-xs text-gray-500 hover:text-yellow-600 transition-colors"
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
