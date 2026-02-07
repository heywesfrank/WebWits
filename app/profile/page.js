"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Camera, Loader2, Link as LinkIcon, Save } from "lucide-react";
import { COUNTRY_CODES } from "@/lib/countries";

function getCountryCode(countryName) {
  return COUNTRY_CODES[countryName]?.toLowerCase() || null;
}

export default function ProfilePage() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Social Link State
  const [socialLink, setSocialLink] = useState("");
  const [savingLink, setSavingLink] = useState(false);

  const router = useRouter();
  const fileInputRef = useRef(null);

  const countryCode = getCountryCode(profile?.country);

  useEffect(() => {
    const getProfile = async () => {
      try {
        setLoading(true);
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!currentSession) {
          router.push('/login');
          return;
        }

        setSession(currentSession);

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentSession.user.id)
          .single();

        if (error) throw error;
        setProfile(data);
        if (data.social_link) setSocialLink(data.social_link);
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    getProfile();
  }, [router]);

  const handleFileChange = async (event) => {
    try {
      setUploading(true);
      const file = event.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 1. Upload
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get URL
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      // 3. Update Profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
            avatar_url: urlData.publicUrl,
            updated_at: new Date()
        })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      // 4. Update Local State
      setProfile(prev => ({ ...prev, avatar_url: urlData.publicUrl }));
      // Optional: reload to refresh header instantly
      window.location.reload(); 

    } catch (error) {
      alert('Error updating avatar: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveSocial = async () => {
    try {
      setSavingLink(true);
      
      let linkToSave = socialLink.trim();
      // Basic validation to ensure protocol exists if they typed something
      if (linkToSave && !/^https?:\/\//i.test(linkToSave)) {
          linkToSave = 'https://' + linkToSave;
          setSocialLink(linkToSave);
      }

      const { error } = await supabase
        .from('profiles')
        .update({ social_link: linkToSave })
        .eq('id', session.user.id);

      if (error) throw error;
      
      // Update local profile state
      setProfile(prev => ({ ...prev, social_link: linkToSave }));
      alert("Social link updated!");

    } catch (error) {
      alert('Error saving link: ' + error.message);
    } finally {
      setSavingLink(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-gray-900">
        <Loader2 className="animate-spin text-yellow-400" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-md mx-auto mt-10">
        
        {/* Navigation */}
        <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-black font-bold mb-8 transition-colors">
          <ArrowLeft size={20} /> Back to Battle
        </Link>

        {/* Profile Card */}
        <div className="bg-white border border-gray-200 shadow-xl rounded-3xl p-8 text-center relative overflow-hidden">
          
          <div className="relative inline-block group cursor-pointer mb-6">
             
             {/* Wrapper: Constrains the flag to the circle area */}
             <div 
               className="relative"
               onClick={() => !uploading && fileInputRef.current?.click()}
             >
                {/* The Circle */}
                <div className="w-32 h-32 rounded-full border-4 border-yellow-400 p-1 bg-white shadow-lg overflow-hidden relative">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-4xl text-gray-400 font-bold rounded-full">
                        {profile?.username?.[0]?.toUpperCase()}
                      </div>
                    )}
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                      <Camera className="text-white" size={24} />
                    </div>

                    {/* Loading Overlay */}
                    {uploading && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                        <Loader2 className="animate-spin text-white" size={24} />
                      </div>
                    )}
                </div>

                {/* Flag Overlay - Positioned relative to the 32x32 circle wrapper */}
                {countryCode && (
                    <img 
                      src={`https://flagcdn.com/w40/${countryCode}.png`}
                      alt={profile.country}
                      title={profile.country}
                      className="absolute bottom-1 right-1 w-8 h-6 rounded shadow-md border-2 border-white object-cover z-20 pointer-events-none"
                    />
                )}
             </div>

             {/* Helper Text */}
             <p className="text-xs text-gray-400 mt-3 font-medium">Click circle to change</p>

             {/* Hidden Input */}
             <input 
               type="file" 
               ref={fileInputRef} 
               onChange={handleFileChange} 
               accept="image/*"
               className="hidden" 
             />
          </div>

          <div className="space-y-2 mb-6">
            <h1 className="text-3xl font-black font-display tracking-tight text-gray-900">
              {profile?.username || "Unknown Warrior"}
            </h1>
            <p className="text-gray-500 font-medium">
              WebWits Contestant
            </p>
          </div>

          {/* Influencer Social Link Section */}
          {profile?.influencer && (
            <div className="mt-8 pt-6 border-t border-gray-100 animate-in fade-in slide-in-from-bottom-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 text-left">
                Your Social Link (Influencer)
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon size={16} className="absolute left-3 top-3 text-gray-400" />
                  <input 
                    type="text" 
                    value={socialLink}
                    onChange={(e) => setSocialLink(e.target.value)}
                    placeholder="https://instagram.com/..."
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                  />
                </div>
                <button 
                  onClick={handleSaveSocial}
                  disabled={savingLink}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl transition-colors shadow-sm disabled:opacity-50"
                >
                  {savingLink ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-2 text-left">
                This link will turn your username blue in the arena. Make it count.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
