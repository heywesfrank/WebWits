"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Camera, User, Loader2, ArrowRight, Check } from "lucide-react";

export default function Onboarding({ session, onComplete }) {
  const [step, setStep] = useState(1); // 1: Avatar, 2: Username
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);

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

  // Handle Final Submission
  const handleSubmit = async () => {
    if (!username.trim() || !avatarUrl) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          username: username,
          avatar_url: avatarUrl,
          email: session.user.email, // Ensure email is synced
          updated_at: new Date(),
        });

      if (error) throw error;
      onComplete(); // Notify parent to close onboarding
    } catch (error) {
      alert('Error saving profile: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/80 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-white border border-gray-200 shadow-2xl rounded-2xl p-8 animate-in fade-in zoom-in duration-300">
        
        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          <div className={`h-2 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-yellow-400' : 'bg-gray-100'}`} />
          <div className={`h-2 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-yellow-400' : 'bg-gray-100'}`} />
        </div>

        <h2 className="text-2xl font-black text-gray-900 mb-2 font-display">
          {step === 1 ? "Show us your face" : "What should we call you?"}
        </h2>
        <p className="text-gray-500 mb-6 text-sm">
          {step === 1 ? "Upload an avatar to represent you in the arena." : "Pick a unique username for the leaderboard."}
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
                  maxLength={20} // [!code ++] Enforce limit
                  onChange={(e) => setUsername(e.target.value.trim())}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none font-bold text-gray-900"
                />
              </div>
              {/* Character Counter */}
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
                onClick={handleSubmit}
                disabled={!username || saving}
                className="flex-[2] px-4 py-3 bg-yellow-400 text-black font-bold rounded-xl hover:bg-yellow-300 transition flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : (
                   <>Finish <Check size={18} /></>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
