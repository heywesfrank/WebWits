import Link from "next/link";
import { Gift, Sparkles } from "lucide-react";

export default function PrizesButton() {
  return (
    <Link 
      href="/prizes"
      className="relative block w-full group mt-4"
    >
      {/* Flashing/Pulsing Glow Effect behind the button */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-green-400 to-emerald-600 rounded-xl blur opacity-60 animate-pulse group-hover:opacity-100 transition duration-200"></div>
      
      {/* Main Button Content */}
      <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-xl font-bold shadow-lg flex flex-col items-center justify-center transform transition-transform group-hover:-translate-y-0.5">
        <div className="flex items-center gap-2">
            <Gift className="text-white group-hover:rotate-12 transition-transform" size={24} />
            <span className="text-lg font-display uppercase tracking-wide">Win Prizes</span>
        </div>
        
        <div className="flex items-center gap-1 mt-1 text-xs text-green-50 font-medium">
            <Sparkles size={10} className="text-yellow-300" />
            <span>Cash Rewards Available</span>
            <Sparkles size={10} className="text-yellow-300" />
        </div>
      </div>
    </Link>
  );
}
