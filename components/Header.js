"use client";
import Link from "next/link"; // [!code ++]
import { supabase } from "@/lib/supabase";
import { LogOut } from "lucide-react";

export default function Header({ session }) {
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
          <>
            {/* User Info (Hidden on very small screens) */}
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-xs font-bold text-gray-700">
                {session?.user?.email}
              </span>
              <span className="text-[10px] text-gray-400 font-medium bg-gray-100 px-1.5 rounded-full mt-0.5">
                Contestant
              </span>
            </div>

            {/* Divider */}
            <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>

            {/* Sign Out Button */}
            <button
              onClick={() => supabase.auth.signOut()}
              className="group flex items-center gap-2 px-3 py-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-100 border border-transparent transition-all duration-200"
              title="Sign Out"
            >
              <span className="text-xs font-bold hidden md:block">Sign Out</span>
              <LogOut size={18} className="group-hover:stroke-2" />
            </button>
          </>
        ) : (
          <Link href="/login" className="bg-yellow-400 text-black px-5 py-2 rounded-lg font-bold text-sm hover:bg-yellow-300 transition-colors shadow-sm">
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}
