"use client";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { LogOut, User, ChevronDown, BookOpen, Info, Facebook, Instagram, Smile, Wallet, ShoppingBag, Star, X, Mail, Users } from "lucide-react"; 
import { COUNTRY_CODES } from "@/lib/countries";
import InstallPrompt from "./InstallPrompt";

function getCountryCode(countryName) {
  return COUNTRY_CODES[countryName]?.toLowerCase() || null;
}

export default function Header({ session, profile, onOpenInvite }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showCollabModal, setShowCollabModal] = useState(false);
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
    <>
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
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-2 space-y-1">
                    
                    {/* CREDITS BADGE - LINK TO STORE */}
                    <Link 
                      href="/store"
                      onClick={() => setIsMenuOpen(false)}
                      className="mx-2 mb-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200 flex items-center justify-between group hover:bg-yellow-100 hover:border-yellow-300 transition-all cursor-pointer"
                    >
                       <div className="flex items-center gap-2">
                          <Wallet size={16} className="text-yellow-600 group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-bold text-yellow-900 uppercase tracking-wider group-hover:text-yellow-700">WitCoins</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <span className="font-display font-black text-lg text-yellow-600">{profile?.credits || 0}</span>
                          <ShoppingBag size={14} className="text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                       </div>
                    </Link>

                    <Link 
                      href="/profile"
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors text-left"
                    >
                      <div className="p-1.5 bg-gray-100 rounded-md text-gray-500">
                        <User size={16} />
                      </div>
                      My Profile
                    </Link>
                    <Link 
                      href="/how-it-works"
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors text-left"
                    >
                      <div className="p-1.5 bg-gray-100 rounded-md text-gray-500">
                        <BookOpen size={16} />
                      </div>
                      How to Play
                    </Link>

                    <Link 
                      href="/icon-guide"
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors text-left"
                    >
                      <div className="p-1.5 bg-gray-100 rounded-md text-gray-500">
                        <Info size={16} />
                      </div>
                      Icon Guide
                    </Link>

                    {/* --- SOCIAL MEDIA LINKS --- */}
                    <a 
                      href="https://www.facebook.com/share/1a2MLgdpj5/"
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors text-left"
                    >
                      <div className="p-1.5 bg-gray-100 rounded-md text-gray-500">
                        <Facebook size={16} />
                      </div>
                      Facebook
                    </a>

                    <a 
                      href="https://www.instagram.com/itswebwits"
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors text-left"
                    >
                      <div className="p-1.5 bg-gray-100 rounded-md text-gray-500">
                        <Instagram size={16} />
                      </div>
                      Instagram
                    </a>

                    <Link 
                      href="/comedy-disclaimer"
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors text-left"
                    >
                      <div className="p-1.5 bg-gray-100 rounded-md text-gray-500">
                        <Smile size={16} />
                      </div>
                      Comedy Disclaimer
                    </Link>

                    {/* INVITE FRIENDS LINK */}
                    <button 
                      onClick={() => {
                        setIsMenuOpen(false);
                        if (onOpenInvite) onOpenInvite();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-green-600 hover:bg-green-50 transition-colors text-left"
                    >
                      <div className="p-1.5 bg-green-100 rounded-md text-green-600">
                        <Users size={16} className="fill-green-500 text-green-500" />
                      </div>
                      Invite Your Friends
                    </button>
                    
                    {/* INFLUENCER COLLAB LINK */}
                    <button 
                      onClick={() => {
                        setIsMenuOpen(false);
                        setShowCollabModal(true);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-blue-600 hover:bg-blue-50 transition-colors text-left"
                    >
                      <div className="p-1.5 bg-yellow-100 rounded-md text-yellow-600">
                        <Star size={16} className="fill-yellow-500 text-yellow-500" />
                      </div>
                      Influencer & Brand Collabs
                    </button>

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

      {/* COLLAB MODAL */}
      {showCollabModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white border border-gray-200 shadow-2xl rounded-2xl p-6 relative animate-in zoom-in-95 duration-200 text-center">
            
            <button 
              onClick={() => setShowCollabModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors"
            >
              <X size={20} />
            </button>

            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
               <Star size={32} className="text-blue-600 fill-blue-600" />
            </div>

            <h2 className="text-2xl font-black text-gray-900 font-display mb-3 leading-tight">
              Direct links. <br/> Real visibility. <br/> Zero fluff.
            </h2>
            
            <p className="text-gray-500 text-sm leading-relaxed mb-8">
              We can turn your username into a direct hyperlink. No "link in bio" scavenger hunts. Just straight traffic to your socials, merch, or manifesto. You bring the clout, we bring the clicks.
            </p>

            <a 
              href="mailto:hello@itswebwits.com"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Mail size={20} />
              <span>Let's Talk</span>
            </a>
            
          </div>
        </div>
      )}
    </>
  );
}
