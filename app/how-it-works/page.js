import Link from "next/link";
import { ArrowLeft, Trophy, PenTool, Users, Clock, Zap } from "lucide-react";

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Navigation */}
        <nav className="flex items-center justify-between mb-12">
            <Link href="/" className="group flex items-center gap-2 text-gray-400 hover:text-white transition-colors px-4 py-2 rounded-full hover:bg-white/5">
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                <span className="font-bold">Back to Battle</span>
            </Link>
        </nav>

        {/* Hero Header */}
        <div className="text-center mb-16 space-y-6 animate-in slide-in-from-bottom-4 duration-700">
            <div className="inline-flex items-center justify-center p-4 bg-yellow-400/10 rounded-3xl border border-yellow-400/20 mb-2 shadow-[0_0_30px_rgba(250,204,21,0.1)]">
                <span className="text-5xl filter drop-shadow-md">🤡</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white leading-tight">
                How to <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Win</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">
                Welcome to <strong>WebWits</strong>, the daily arena where humor is the only currency that matters.
            </p>
        </div>

        {/* Steps Grid */}
        <div className="grid gap-6 md:grid-cols-2 mb-16">
            <StepCard 
                icon={<Clock size={28} />}
                color="blue"
                title="1. The Daily Drop"
                desc="Every day at midnight, a new meme image drops. No context, no captions. Just pure potential waiting for your wit."
            />
            <StepCard 
                icon={<PenTool size={28} />}
                color="purple"
                title="2. Craft Your Wit"
                desc="Submit your funniest, wittiest, or most savage caption. You're fighting for votes against the entire internet."
            />
            <StepCard 
                icon={<Users size={28} />}
                color="green"
                title="3. The People Vote"
                desc="The community decides. Upvote what makes you laugh. The leaderboard updates in real-time. Democracy, but funny."
            />
            <StepCard 
                icon={<Trophy size={28} />}
                color="yellow"
                title="4. Eternal Glory"
                desc="At the end of 24 hours, the top caption wins. Points are tallied, and the winner is immortalized in the Archive forever."
            />
        </div>

        {/* Rules Section */}
        <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-8 mb-16">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Zap className="text-yellow-400" /> Ground Rules
            </h3>
            <ul className="space-y-4 text-gray-400">
                <li className="flex gap-3">
                    <span className="text-yellow-400 font-bold">•</span>
                    <span>Be original. Stolen jokes are for lesser beings.</span>
                </li>
                <li className="flex gap-3">
                    <span className="text-yellow-400 font-bold">•</span>
                    <span>No hate speech or harassment. Keep it spicy, not toxic.</span>
                </li>
                <li className="flex gap-3">
                    <span className="text-yellow-400 font-bold">•</span>
                    <span>One vote per caption. Choose wisely.</span>
                </li>
            </ul>
        </div>

        {/* Call to Action */}
        <div className="text-center pb-10">
            <Link 
                href="/" 
                className="inline-block bg-yellow-400 text-black font-black text-xl px-10 py-5 rounded-xl hover:bg-yellow-300 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-yellow-400/20"
            >
                Enter the Arena
            </Link>
        </div>
      </div>
    </div>
  );
}

// Helper Component for the grid
function StepCard({ icon, title, desc, color }) {
    const colors = {
        blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        green: "bg-green-500/10 text-green-400 border-green-500/20",
        yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    };

    return (
        <div className="bg-gray-800/50 p-8 rounded-2xl border border-gray-700/50 backdrop-blur-sm hover:border-gray-600 transition-colors">
            <div className={`w-14 h-14 ${colors[color]} rounded-xl flex items-center justify-center mb-6 border`}>
                {icon}
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gray-100">{title}</h3>
            <p className="text-gray-400 leading-relaxed">{desc}</p>
        </div>
    );
}
