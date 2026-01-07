import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { LogOut, User, ChevronDown, BookOpen } from "lucide-react";
import { COUNTRY_CODES } from "@/lib/countries";

function getCountryCode(countryName) {
  return COUNTRY_CODES[countryName]?.toLowerCase() || null;
}

export default function Header({ session, profile }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Helpers to get display values
  const username = profile?.username || session?.user?.email?.split('@')[0];
  const avatarUrl = profile?.avatar_url;
  const countryCode = getCountryCode(profile?.country);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
// ... existing code ...
            {/* User Trigger */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-3 hover:bg-gray-50 p-1.5 rounded-full pr-3 transition-colors border border-transparent hover:border-gray-100"
            >
              <div className="relative">
                <div className="h-9 w-9 bg-gray-100 rounded-full overflow-hidden border border-gray-200 shadow-sm relative">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={username} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-yellow-100 text-yellow-600 font-bold text-xs">
                      {username?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                {countryCode && (
                  <img 
                    src={`https://flagcdn.com/w20/${countryCode}.png`}
                    alt={profile.country}
                    title={profile.country}
                    className="absolute -bottom-1 -right-1 w-4 h-3 rounded-[2px] shadow-sm border border-white object-cover"
                  />
                )}
              </div>
              
              <div className="hidden sm:flex flex-col items-start text-left">
                <span className="text-sm font-bold text-gray-900 leading-none">
// ... existing code ...
