"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Send, AlertCircle, Mail, Sparkles } from "lucide-react";
import HowToPlayButton from "./HowToPlayButton";
import PrizesButton from "./PrizesButton";

export default function Login() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  const handleMagicLink = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setInfoMsg("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Redirects back to your site after they click the email link
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setInfoMsg("Check your inbox! We sent you a magic link.");
      setEmail(""); // Clear input on success
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4 text-gray-900">
      <div className="w-full max-w-md bg-white border border-gray-200 p-8 rounded-2xl shadow-2xl">
        
        <div className="text-center mb-8">
          <img 
            src="/logo.png" 
            alt="WebWits" 
            className="w-64 h-auto object-contain mx-auto mb-6" 
          />
          <p className="text-gray-600 text-sm">
            No passwords. Just wit. Enter your email to join the battle.
          </p>
        </div>

        {infoMsg ? (
          <div className="text-center space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Link Sent!</h3>
            <p className="text-gray-500">
              {infoMsg}
            </p>
            <button 
              onClick={() => setInfoMsg("")}
              className="text-sm text-yellow-600 hover:text-yellow-700 font-bold mt-4"
            >
              Try a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleMagicLink} className="flex flex-col gap-5">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full p-3 pl-10 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none transition-all disabled:opacity-50"
                  required
                />
                <Mail size={18} className="absolute left-3 top-3.5 text-gray-400" />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded bg-red-50 border border-red-200 flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold p-3 rounded-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
            >
              {loading ? (
                "Sending Magic..."
              ) : (
                <>
                  <span>Send Magic Link</span>
                  <Sparkles size={18} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Added: How to Play & Prizes Buttons */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <HowToPlayButton />
          <PrizesButton />
        </div>

      </div>
    </div>
  );
}
