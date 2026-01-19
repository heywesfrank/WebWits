"use client";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
// Added 'Info' to imports
import { LogOut, User, ChevronDown, BookOpen, Megaphone, Info } from "lucide-react";
import { COUNTRY_CODES } from "@/lib/countries";
import InstallPrompt from "./InstallPrompt";

function getCountryCode(countryName) {
  return COUNTRY_CODES[countryName]?.toLowerCase() || null;
}

export default function Header({ session, profile }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const username = profile?.username || session?.user?.email?.split('@')[0];
  const avatarUrl = profile?.avatar_url;
  const countryCode = getCountryCode(profile?.country);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-3 flex justify-between items-center transition-all">
      
      <div className="flex-shrink-0 flex items-center group cursor-pointer" onClick={() => window.location.href = '/'}>
        <img 
          src="/icon.png" 
          alt="WebWits" 
          className="h-10 w-10 md:hidden rounded-xl object-cover shadow-sm transition-transform duration-300 group-hover:scale-105" 
        />
        <img 
          src="/logo.png" 
          alt="WebWits" 
          className="hidden md:block h-16 w-auto object-contain filter drop-shadow-sm transition-transform duration-300 group-hover:scale-105" 
        />
      </div>

      <div className="flex-1 flex justify-center md:hidden min-w-0 px-2">
         <InstallPrompt />
      </div>

      <div className="flex-shrink-0 flex items-center gap-2 sm:gap-4">
        
        {session ? (
          <div className="relative" ref={menuRef}>
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
                    className="absolute -bottom-1 -right-1 w-4 h-3 rounded-[2px] shadow-sm border border-white object-cover"
                  />
                )}
              </div>
              
              <div className="hidden sm:flex flex-col items-start text-left">
                <span className="text-sm font-bold text-gray-900 leading-none">
                  {username}
                </span>
                <span className="text-[10px] text-gray-500 font-medium">Contestant</span>
              </div>
              <ChevronDown size={14} className={`text-gray-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-2 space-y-1">
                  <Link 
                    href="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 transition-colors text-left"
                  >
                    <div className="p-1.5 bg-gray-100 rounded-md text-gray-500">
                      <User size={16} />
                    </div>
                    My Profile
                  </Link>
                  <Link 
                    href="/how-it-works"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 transition-colors text-left"
                  >
                    <div className="p-1.5 bg-gray-100 rounded-md text-gray-500">
                      <BookOpen size={16} />
                    </div>
                    How to Play
                  </Link>

                  {/* --- NEW ICON GUIDE BUTTON --- */}
                  <Link 
                    href="/icon-guide"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 transition-colors text-left"
                  >
                    <div className="p-1.5 bg-gray-100 rounded-md text-gray-500">
                      <Info size={16} />
                    </div>
                    Icon Guide
                  </Link>
                  
                  <a 
                    href="mailto:hello@itswebwits.com?subject=Advertising%20Inquiry&body=Hi%20WebWits%20Team%2C%0A%0AMy%20company%20is%20interested%20in%20advertising%20with%20you.%20Please%20let%20us%20know%20how%20we%20can%20proceed.%0A%0ABest%20regards%2C"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 transition-colors text-left"
                  >
                    <div className="p-1.5 bg-gray-100 rounded-md text-gray-500">
                      <Megaphone size={16} />
                    </div>
                    Advertise with us
                  </a>

                  <div className="h-px bg-gray-100 my-1 mx-2"></div>
                  <button
                    onClick={() => supabase.auth.signOut()}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors text-left"
                  >
                    <div className="p-1.5 bg-red-100 rounded-md text-red-500">
                      <LogOut size={16} />
                    </div>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" className="bg-yellow-400 text-white px-3 md:px-5 py-2 rounded-lg font-bold text-sm hover:bg-yellow-300 transition-colors shadow-sm whitespace-nowrap">
            Sign Up/Login
          </Link>
        )}
      </div>
    </nav>
  );
}
