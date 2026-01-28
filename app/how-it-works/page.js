import Link from "next/link";
import { ArrowLeft, Trophy, Zap, Clock, Wallet, Flame, Crosshair } from "lucide-react";

export default function HowItWorks() {
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
            <img 
              src="/logo.png" 
              alt="WebWits" 
              className="w-80 h-auto object-contain mx-auto mb-6 filter drop-shadow-md" 
            />
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-gray-900 leading-tight">
                Play. Wit. <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-600">Profit.</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-500 max-w-2xl mx-auto font-light leading-relaxed">
                WebWits isn't just a caption contest. It's a strategy game. <br/>
                Earn credits, buy power-ups, and crush the competition.
            </p>
        </div>

        {/* The Game Loop Grid */}
        <div className="grid gap-6 md:grid-cols-2 mb-16">
            <StepCard 
                icon={<Clock size={28} />}
                color="blue"
                title="1. The Daily Drop"
                desc="Every day at midnight, a new meme drops. The arena opens. You have 24 hours to post the funniest caption."
            />
            <StepCard 
                icon={<Wallet size={28} />}
                color="green"
                title="2. Spin for Credits"
                desc="Log in daily and spin the wheel. Win free Credits instantly. You'll need these to buy weapons in the Store."
            />
            <StepCard 
                icon={<Flame size={28} />}
                color="orange"
                title="3. Power Up & Battle"
                desc="Spend Credits to gain an edge. Buy the 'Ring of Fire' to highlight your caption, 'The Mulligan' to fix typos, or a 'Double Barrel' to post twice."
            />
            <StepCard 
                icon={<Trophy size={28} />}
                color="yellow"
                title="4. Win Real Prizes"
                desc="Credits aren't just for ammo. Save them up to buy real Amazon Gift Cards directly from the shop. Being funny literally pays."
            />
        </div>

        {/* The Armory Section (Power-ups explanation) */}
        <div className="bg-gray-900 text-white rounded-3xl p-8 md:p-12 mb-16 shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6 text-yellow-400">
                    <Crosshair size={32} />
                    <h3 className="text-3xl font-black font-display uppercase tracking-wider">The Armory</h3>
                </div>
                <p className="text-gray-300 mb-8 max-w-2xl text-lg">
                    Wit alone is good. Wit with power-ups is unstoppable. Visit the Store to spend your credits on these game-changers:
                </p>
                
                <div className="grid gap-4 md:grid-cols-2">
                    <PowerUp 
                        name="Ring of Fire" 
                        desc="Ignites your caption with a glowing border. Grabs attention immediately." 
                    />
                    <PowerUp 
                        name="Thumbtack of Glory" 
                        desc="Pins your caption to the top of the feed. Dominate the view." 
                    />
                    <PowerUp 
                        name="The Mulligan" 
                        desc="Made a typo? Regret your joke? Buy an edit token and fix it." 
                    />
                    <PowerUp 
                        name="Double Barrel" 
                        desc="One joke not enough? Unlock a second caption slot for the daily battle." 
                    />
                </div>
            </div>
            
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-yellow-500/20 rounded-full blur-3xl pointer-events-none"></div>
        </div>

        {/* Rules Section */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 mb-16">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900">
                <Zap className="text-yellow-500" /> Ground Rules
            </h3>
            <ul className="space-y-4 text-gray-600">
                <li className="flex gap-3">
                    <span className="text-yellow-500 font-bold">•</span>
                    <span><strong>Vote to win.</strong> The leaderboard is decided by community votes.</span>
                </li>
                <li className="flex gap-3">
                    <span className="text-yellow-500 font-bold">•</span>
                    <span><strong>No hate speech.</strong> We like spicy, not toxic. Keep it fun.</span>
                </li>
                <li className="flex gap-3">
                    <span className="text-yellow-500 font-bold">•</span>
                    <span><strong>Engage often.</strong> The more you play, the more credits you earn.</span>
                </li>
            </ul>
        </div>

        {/* Call to Action */}
        <div className="text-center pb-10">
            <Link 
                href="/" 
                className="inline-block bg-yellow-400 text-black font-black text-xl px-10 py-5 rounded-xl hover:bg-yellow-300 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-yellow-200"
            >
                Start Earning Credits
            </Link>
        </div>
      </div>
    </div>
  );
}

function StepCard({ icon, title, desc, color }) {
    const colors = {
        blue: "bg-blue-50 text-blue-600 border-blue-200",
        purple: "bg-purple-50 text-purple-600 border-purple-200",
        green: "bg-green-50 text-green-600 border-green-200",
        yellow: "bg-yellow-50 text-yellow-600 border-yellow-200",
        orange: "bg-orange-50 text-orange-600 border-orange-200",
    };

    return (
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:border-gray-300 transition-colors">
            <div className={`w-14 h-14 ${colors[color]} rounded-xl flex items-center justify-center mb-6 border`}>
                {icon}
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gray-900">{title}</h3>
            <p className="text-gray-500 leading-relaxed font-medium">{desc}</p>
        </div>
    );
}

function PowerUp({ name, desc }) {
    return (
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
            <h4 className="text-yellow-400 font-bold mb-1">{name}</h4>
            <p className="text-gray-400 text-sm">{desc}</p>
        </div>
    );
}
