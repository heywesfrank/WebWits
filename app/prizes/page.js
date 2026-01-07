import Link from "next/link";
import { ArrowLeft, Gift, Shirt, Calendar, Crown } from "lucide-react";

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
                Real Wits. <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-yellow-700">Real Rewards.</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-500 max-w-2xl mx-auto font-light leading-relaxed">
                Funny isn't just a personality trait. It's a payday.
            </p>
        </div>

        {/* Prize Tiers - Centered Grid */}
        <div className="grid gap-6 md:grid-cols-2 max-w-2xl mx-auto mb-16">
            
            {/* Monthly */}
            <PrizeCard 
                icon={<Calendar size={32} />}
                tier="Monthly Winner"
                reward="$25 Amazon Gift Card"
                desc="The highest scoring player each month gets the goods sent straight to their inbox."
                color="blue"
            />
            
            {/* Yearly */}
            <PrizeCard 
                icon={<Crown size={32} />}
                tier="Yearly Legend"
                reward="Exclusive Merch"
                desc="The ultimate champion of the year gets limited edition WebWits gear that money can't buy."
                color="dark"
            />
            
        </div>

        {/* Disclaimer */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
            <h3 className="text-lg font-bold mb-2">How do I claim?</h3>
            <p className="text-gray-600 max-w-lg mx-auto">
                Winners are automatically contacted via the email attached to their account. Digital gift cards are sent within 48 hours of the month's end.
            </p>
        </div>

      </div>
    </div>
  );
}

function PrizeCard({ icon, tier, reward, desc, color }) {
    // Mapping your project's "yellow" classes (which are blue)
    const colors = {
        blue: "bg-yellow-50 text-yellow-600 border-yellow-200",
        dark: "bg-gray-50 text-gray-800 border-gray-200",
    };

    return (
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:border-yellow-400 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-yellow-100/50">
            <div className={`w-16 h-16 ${colors[color]} rounded-2xl flex items-center justify-center mb-6 border`}>
                {icon}
            </div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{tier}</h3>
            <div className="text-2xl font-black text-gray-900 mb-4">{reward}</div>
            <p className="text-gray-500 leading-relaxed text-sm">{desc}</p>
        </div>
    );
}
