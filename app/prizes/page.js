import Link from "next/link";
import { ArrowLeft, Gift, DollarSign, Crown, Shirt } from "lucide-react";

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
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Gift size={48} className="text-green-600" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-gray-900 leading-tight">
                Real Wits. <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600">Real Rewards.</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-500 max-w-2xl mx-auto font-light leading-relaxed">
                Funny isn't just a personality trait. It's a payday.
            </p>
        </div>

        {/* Prize Tiers */}
        <div className="grid gap-6 md:grid-cols-3 mb-16">
            {/* Daily */}
            <PrizeCard 
                icon={<DollarSign size={32} />}
                tier="Daily Winner"
                reward="$10 Cash"
                desc="The top voted caption every 24 hours takes home the daily bounty."
                color="green"
            />
            {/* Weekly */}
            <PrizeCard 
                icon={<Crown size={32} />}
                tier="Weekly King"
                reward="$50 Bonus"
                desc="Accumulate the most points in a week to earn the crown and the cash."
                color="yellow"
            />
            {/* Monthly */}
            <PrizeCard 
                icon={<Shirt size={32} />}
                tier="Monthly Legend"
                reward="Exclusive Merch"
                desc="Top the monthly leaderboard to get limited edition WebWits gear."
                color="purple"
            />
        </div>

        {/* Disclaimer / Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
            <h3 className="text-lg font-bold mb-2">How are prizes paid?</h3>
            <p className="text-gray-600 max-w-lg mx-auto">
                Winners are contacted via the email attached to their account. Cash prizes are sent via PayPal or Venmo within 48 hours of the winner declaration.
            </p>
        </div>

      </div>
    </div>
  );
}

function PrizeCard({ icon, tier, reward, desc, color }) {
    const colors = {
        green: "bg-green-50 text-green-600 border-green-200",
        yellow: "bg-yellow-50 text-yellow-600 border-yellow-200",
        purple: "bg-purple-50 text-purple-600 border-purple-200",
    };

    return (
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:border-gray-300 transition-all hover:-translate-y-1">
            <div className={`w-16 h-16 ${colors[color]} rounded-2xl flex items-center justify-center mb-6 border`}>
                {icon}
            </div>
            <h3 className="text-xl font-bold text-gray-400 uppercase tracking-widest text-xs mb-1">{tier}</h3>
            <div className="text-3xl font-black text-gray-900 mb-4">{reward}</div>
            <p className="text-gray-500 leading-relaxed text-sm">{desc}</p>
        </div>
    );
}
