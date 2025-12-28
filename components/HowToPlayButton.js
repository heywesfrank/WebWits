import Link from "next/link";

export default function HowToPlayButton() {
  return (
    <Link 
      href="/how-it-works"
      className="group relative block w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-white text-center p-4 rounded-xl font-bold shadow-lg shadow-yellow-400/30 hover:shadow-yellow-400/50 hover:scale-[1.02] active:scale-[0.98] transition-all"
    >
      <div className="flex items-center justify-center gap-2">
        <span className="text-xl group-hover:rotate-12 transition-transform">🤔</span>
        <span className="text-lg font-display">How to Play</span>
      </div>
      <p className="text-xs text-yellow-50 font-medium opacity-90 mt-1">
        Learn the rules & win glory
      </p>
    </Link>
  );
}
