"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; // [!code ++]
import { supabase } from "@/lib/supabase";
import { AlertCircle, Mail, Sparkles, KeyRound, ArrowRight } from "lucide-react";
import HowToPlayButton from "./HowToPlayButton";
import PrizesButton from "./PrizesButton";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  // 1. Request the Code
  const handleSendCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setInfoMsg("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setInfoMsg("Check your email for the code!");
      setShowOtpInput(true);
    }
    setLoading(false);
  };

  // 2. Verify the Code
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email'
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      setInfoMsg("Success! Entering the arena...");
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4 text-gray-900">
      <div className="w-full max-w-md bg-white border border-gray-200 p-8 rounded-2xl shadow-2xl">
        
        <div className="text-center mb-8">
          <img src="/logo.png" alt="WebWits" className="w-64 h-auto object-contain mx-auto mb-6" />
          <p className="text-gray-600 text-sm">
            {showOtpInput ? "Enter the code sent to your email." : "No passwords. Just wit. Enter your email to join the battle."}
          </p>
        </div>

        {/* OTP INPUT FORM */}
        {showOtpInput ? (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5 animate-in fade-in slide-in-from-right duration-300">
             <div>
              <label htmlFor="otp" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Confirmation Code
              </label>
              <div className="relative">
                <input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  disabled={loading}
                  autoFocus
                  className="w-full p-3 pl-10 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none transition-all disabled:opacity-50 text-xl tracking-widest font-mono"
                  required
                />
                <KeyRound size={18} className="absolute left-3 top-3.5 text-gray-400" />
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
              {loading ? "Verifying..." : (
                <><span>Enter Arena</span><ArrowRight size={18} /></>
              )}
            </button>
            
            <button 
              type="button"
              onClick={() => { setShowOtpInput(false); setInfoMsg(""); setOtp(""); }}
              className="text-xs text-center text-gray-400 hover:text-gray-600"
            >
              Start over with a different email
            </button>
          </form>
        ) : (
          /* EMAIL INPUT FORM */
          <form onSubmit={handleSendCode} className="flex flex-col gap-5">
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
              {loading ? "Sending..." : (
                <><span>Get Login Code</span><Sparkles size={18} /></>
              )}
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-gray-100">
          <HowToPlayButton />
          <PrizesButton />
          
          {/* [!code ++] New Footer Links */}
          <div className="mt-6 text-center text-xs text-gray-400 flex justify-center gap-4">
            <Link href="/terms" className="hover:text-gray-600 hover:underline">Terms of Use</Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-gray-600 hover:underline">Privacy Policy</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
