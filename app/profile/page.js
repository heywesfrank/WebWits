import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Camera, Loader2 } from "lucide-react";
import { COUNTRY_CODES } from "@/lib/countries";

function getCountryCode(countryName) {
  return COUNTRY_CODES[countryName]?.toLowerCase() || null;
}

export default function ProfilePage() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
// ... existing code ...
  const fileInputRef = useRef(null);
  
  const countryCode = getCountryCode(profile?.country);

  useEffect(() => {
    const getProfile = async () => {
// ... existing code ...
        {/* Profile Card */}
        <div className="bg-white border border-gray-200 shadow-xl rounded-3xl p-8 text-center relative overflow-hidden">
          
          <div className="relative inline-block group cursor-pointer mb-6">
             {/* The Circle - Clickable */}
             <div className="relative">
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
               {countryCode && (
                  <img 
                    src={`https://flagcdn.com/w40/${countryCode}.png`}
                    alt={profile.country}
                    title={profile.country}
                    className="absolute bottom-1 right-1 w-8 h-6 rounded shadow-md border-2 border-white object-cover z-20"
                  />
               )}
             </div>

             {/* Helper Text */}
             <p className="text-xs text-gray-400 mt-3 font-medium">Click circle to change</p>

             {/* Hidden Input */}
// ... existing code ...
