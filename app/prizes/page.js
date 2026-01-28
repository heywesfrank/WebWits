import Link from "next/link";
import { ArrowLeft, Gift, Crown, ShoppingBag, Coins } from "lucide-react";

export default function PrizesPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Navigation */}
        <nav className="flex items-center justify-between mb-12">
            <Link href="/" className="group flex items-center gap-2 text-gray-500 hover:text-black transition-colors px-4 py-2 rounded-full hover:bg-gray-100">
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                <span className="font-bold">Back to Battle</span>
            </Link>
        </nav>

        {/* Hero Header */}
        <div className="text-center mb-16 space-y-6 animate-in slide-in-from-bottom-4 duration-700">
            <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Gift size={48} className="text-yellow-600" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-gray-900 leading-tight">
                Play. Earn. <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-yellow-700">Redeem.</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-500 max-w-2xl mx-auto font-light leading-relaxed">
                Your wit earns Credits. Your Credits buy rewards. <br/>
                It's a simple economy. Be funny, get paid.
            </p>
        </div>

        {/* Prize Tiers - Grid */}
        <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto mb-16">
            
            {/* Monthly - Bonus Credits */}
            <PrizeCard 
                icon={<Coins size={32} />}
                tier="Monthly Leaderboard"
                reward="Massive Credit Bonus"
                desc="Top the leaderboard at the end of the month? You get a huge injection of credits to spend in the store."
                color="blue"
            />

            {/* Amazon Card - The Goal */}
            <PrizeCard 
                icon={<ShoppingBag size={32} />}
                tier="In The Store"
                reward="$25 Amazon Card"
                desc="Save up your hard-earned credits and buy this directly from the shop. Jeff Bezos' money, now yours."
                color="green"
            />
            
            {/* Yearly - Merch */}
            <PrizeCard 
                icon={<Crown size={32} />}
                tier="Yearly Legend"
                reward="Exclusive Merch"
                desc="The ultimate champion of the year gets limited edition WebWits gear that money can't buy."
                color="dark"
            />
            
        </div>

        {/* Disclaimer / Store Link */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center space-y-6">
            <div>
                <h3 className="text-lg font-bold mb-2">Ready to spend?</h3>
                <p className="text-gray-600 max-w-lg mx-auto">
                    Visit the Store to see what your credits can buy today. Power-ups, edits, and cold hard digital cash.
                </p>
            </div>
            
            <Link 
                href="/store"
                className="inline-flex items-center gap-2 bg-black text-white px-8 py-4 rounded-xl font-bold hover:bg-gray-800 transition-all hover:scale-105 active:scale-95 shadow-lg"
            >
                <ShoppingBag size={20} />
                Go to Store
            </Link>
        </div>

      </div>
    </div>
  );
}

function PrizeCard({ icon, tier, reward, desc, color }) {
    const colors = {
        blue: "bg-blue-50 text-blue-600 border-blue-200", // Monthly
        green: "bg-green-50 text-green-600 border-green-200", // Amazon
        dark: "bg-gray-100 text-gray-800 border-gray-200", // Yearly
    };

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:border-yellow-400 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-yellow-100/50 flex flex-col h-full">
            <div className={`w-14 h-14 ${colors[color]} rounded-2xl flex items-center justify-center mb-6 border`}>
                {icon}
            </div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{tier}</h3>
            <div className="text-xl font-black text-gray-900 mb-4 leading-tight">{reward}</div>
            <p className="text-gray-500 leading-relaxed text-sm flex-1">{desc}</p>
        </div>
    );
}
