"use client";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { LogOut, User, ChevronDown, BookOpen } from "lucide-react";

export default function Header({ session, profile }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Helpers to get display values
  const username = profile?.username || session?.user?.email?.split('@')[0];
  const avatarUrl = profile?.avatar_url;

  // Close menu when clicking outside
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
      {/* Left: Brand & Logo */}
      <div className="flex items-center group cursor-pointer" onClick={() => window.location.href = '/'}>
        <img 
          src="/logo.png" 
          alt="WebWits" 
          className="h-16 w-auto object-contain filter drop-shadow-sm transition-transform duration-300 group-hover:scale-105" 
        />
      </div>

      {/* Right: User Profile OR Sign In */}
      <div className="flex items-center gap-3 sm:gap-4">
        {session ? (
          <div className="relative" ref={menuRef}>
            {/* User Trigger */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-3 hover:bg-gray-50 p-1.5 rounded-full pr-3 transition-colors border border-transparent hover:border-gray-100"
            >
              <div className="h-9 w-9 bg-gray-100 rounded-full overflow-hidden border border-gray-200 shadow-sm relative">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={username} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-yellow-100 text-yellow-600 font-bold text-xs">
                    {username?.[0]?.toUpperCase()}
                  </div>
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

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-2 space-y-1">
                  
                  {/* Option 1: Profile Page */}
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

                  {/* Option 2: How it Works */}
                  <Link 
                    href="/how-it-works"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 transition-colors text-left"
                  >
                    <div className="p-1.5 bg-gray-100 rounded-md text-gray-500">
                      <BookOpen size={16} />
                    </div>
                    How it Works
                  </Link>

                  <div className="h-px bg-gray-100 my-1 mx-2"></div>

                  {/* Option 3: Sign Out */}
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
          <Link href="/login" className="bg-yellow-400 text-black px-5 py-2 rounded-lg font-bold text-sm hover:bg-yellow-300 transition-colors shadow-sm">
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}
