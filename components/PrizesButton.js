import Link from "next/link";
import { Gift, Sparkles } from "lucide-react";

export default function PrizesButton() {
  return (
    <Link 
      href="/prizes"
      className="relative block w-full group mt-4"
    >
      {/* Flashing Blue Glow Animation */}
      <div className="absolute -inset-1 bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-2xl blur opacity-40 animate-pulse group-hover:opacity-75 transition duration-200"></div>
      
      {/* Main Button: White bg to contrast with the solid 'How to Play' button */}
      <div className="relative bg-white border-2 border-yellow-400 text-yellow-700 p-4 rounded-xl font-bold shadow-lg flex flex-col items-center justify-center transform transition-transform group-hover:-translate-y-0.5">
        <div className="flex items-center gap-2">
            <Gift className="text-yellow-500 group-hover:rotate-12 transition-transform" size={24} />
            <span className="text-lg font-display uppercase tracking-wide">Win Prizes</span>
        </div>
        
        <div className="flex items-center gap-1 mt-1 text-xs text-yellow-600 font-medium">
            <Sparkles size={10} className="text-yellow-400 fill-yellow-400" />
            <span>Cash & Merch</span>
            <Sparkles size={10} className="text-yellow-400 fill-yellow-400" />
        </div>
      </div>
    </Link>
  );
}
