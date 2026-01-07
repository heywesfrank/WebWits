"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Camera, Loader2 } from "lucide-react";

export default function ProfilePage() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const fileInputRef = useRef(null);

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
             {/* The Circle - Clickable */}
             <div 
               onClick={() => !uploading && fileInputRef.current?.click()}
               className="w-32 h-32 rounded-full border-4 border-yellow-400 p-1 bg-white shadow-lg overflow-hidden relative"
             >
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

          <div className="space-y-2">
            <h1 className="text-3xl font-black font-display tracking-tight text-gray-900">
              {profile?.username || "Unknown Warrior"}
            </h1>
            <p className="text-gray-500 font-medium">
              WebWits Contestant
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
