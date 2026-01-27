"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Camera, User, Loader2, ArrowRight, Check, Globe, Download } from "lucide-react";
import { COUNTRIES } from "@/lib/countries";

export default function Onboarding({ session, onComplete }) {
  const [step, setStep] = useState(1); // 1: Avatar, 2: Username, 3: Country, 4: Install
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [username, setUsername] = useState("");
  const [country, setCountry] = useState("");
  const [saving, setSaving] = useState(false);

  // --- PWA State ---
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    const inStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    setIsStandalone(inStandalone);

    // Check for iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);

    // Listen for PWA install event
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      alert("📲 To install on iOS:\n\n1. Tap the 'Share' icon (square with arrow)\n2. Scroll down and tap 'Add to Home Screen'");
    } else {
       alert("To install, look for 'Add to Home Screen' or 'Install App' in your browser menu.");
    }
  };

  // Handle Image Upload
  const handleImageUpload = async (event) => {
    try {
      setUploading(true);
      const file = event.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      let { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl);
    } catch (error) {
      alert('Error uploading avatar: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // Handle Profile Save (Moves to Step 4)
  const handleSubmit = async () => {
    if (!username.trim() || !avatarUrl || !country) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          username: username,
          avatar_url: avatarUrl,
          email: session.user.email,
          country: country,
          updated_at: new Date(),
        });

      if (error) throw error;
      setStep(4); // Move to Install Step
    } catch (error) {
      alert('Error saving profile: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Helper for dynamic headings
  const getHeading = () => {
    switch(step) {
      case 1: return "We've seen worse. Pick a pic.";
      case 2: return "What should we call you?";
      case 3: return "Where are you roasting from?";
      case 4: return "Commit to the bit.";
      default: return "";
    }
  };

  const getSubHeading = () => {
    switch(step) {
      case 1: return "Upload an image to represent you in the arena.";
      case 2: return "This name is permanent - choose wisely.";
      case 3: return "Your country (so that we can send the prize). No stalking.";
      case 4: return "Browsers suppress notifications like a jealous ex. Install the app to know when you win.";
      default: return "";
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/80 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-white border border-gray-200 shadow-2xl rounded-2xl p-8 animate-in fade-in zoom-in duration-300">
        
        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          <div className={`h-2 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-yellow-400' : 'bg-gray-100'}`} />
          <div className={`h-2 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-yellow-400' : 'bg-gray-100'}`} />
          <div className={`h-2 flex-1 rounded-full transition-colors ${step >= 3 ? 'bg-yellow-400' : 'bg-gray-100'}`} />
          <div className={`h-2 flex-1 rounded-full transition-colors ${step >= 4 ? 'bg-yellow-400' : 'bg-gray-100'}`} />
        </div>

        <h2 className="text-2xl font-black text-gray-900 mb-2 font-display">
          {getHeading()}
        </h2>
        <p className="text-gray-500 mb-6 text-sm leading-relaxed">
          {getSubHeading()}
        </p>

        {/* STEP 1: AVATAR UPLOAD */}
        {step === 1 && (
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32 bg-gray-100 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center mb-6 overflow-hidden group">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <Camera size={32} className="text-gray-400" />
              )}
              
              <label className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center cursor-pointer transition-colors">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  disabled={uploading}
                  className="hidden" 
                />
                {uploading && <Loader2 className="animate-spin text-yellow-400" />}
              </label>
            </div>

            <button 
              onClick={() => setStep(2)}
              disabled={!avatarUrl}
              className="w-full bg-black text-white font-bold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              Next Step <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* STEP 2: USERNAME */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <div className="relative">
                <User className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Username" 
                  value={username}
                  maxLength={20}
                  onChange={(e) => setUsername(e.target.value.trim())}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none font-bold text-gray-900"
                />
              </div>
              <div className="flex justify-end mt-1">
                 <span className={`text-[10px] font-medium ${username.length === 20 ? 'text-red-500' : 'text-gray-400'}`}>
                    {username.length}/20
                 </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setStep(1)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition"
              >
                Back
              </button>
              <button 
                onClick={() => setStep(3)}
                disabled={!username}
                className="flex-[2] px-4 py-3 bg-black text-white font-bold rounded-xl disabled:opacity-50 hover:bg-gray-800 transition flex items-center justify-center gap-2"
              >
                Next Step <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: COUNTRY DROPDOWN */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <div className="relative">
                <Globe className="absolute left-4 top-3.5 text-gray-400 pointer-events-none" size={20} />
                <select 
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none font-bold text-gray-900 appearance-none cursor-pointer"
                >
                  <option value="" disabled>Select a country</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setStep(2)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition"
              >
                Back
              </button>
              <button 
                onClick={handleSubmit}
                disabled={!country || saving}
                className="flex-[2] px-4 py-3 bg-yellow-400 text-black font-bold rounded-xl hover:bg-yellow-300 transition flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : (
                   <>Next <ArrowRight size={18} /></>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: APP INSTALL */}
        {step === 4 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right duration-300">
             {!isStandalone && (
                <button 
                  onClick={handleInstall}
                  className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Download size={24} />
                  <span className="text-lg">Install WebWits</span>
                </button>
             )}

             {isStandalone && (
                <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl flex items-center gap-3">
                   <Check size={20} />
                   <span className="font-bold">App installed. You're ready.</span>
                </div>
             )}

             <button 
               onClick={onComplete}
               className={`w-full font-bold py-3 rounded-xl transition-colors ${isStandalone ? 'bg-black text-white hover:bg-gray-800' : 'bg-transparent text-gray-400 hover:text-gray-600'}`}
             >
               {isStandalone ? "Enter Arena" : "I'll risk missing out (Skip)"}
             </button>
          </div>
        )}

      </div>
    </div>
  );
}
