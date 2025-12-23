import Link from "next/link";
import { ArrowLeft, Trophy, PenTool, Users, Clock, Zap } from "lucide-react";

export default function HowItWorks() {
  return (
    // Changed bg to white and text to gray
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
                How to <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-600">Win</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-500 max-w-2xl mx-auto font-light leading-relaxed">
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
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 mb-16">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900">
                <Zap className="text-yellow-500" /> Ground Rules
            </h3>
            <ul className="space-y-4 text-gray-600">
                <li className="flex gap-3">
                    <span className="text-yellow-500 font-bold">•</span>
                    <span>Be original. Stolen jokes are for lesser beings.</span>
                </li>
                <li className="flex gap-3">
                    <span className="text-yellow-500 font-bold">•</span>
                    <span>No hate speech or harassment. Keep it spicy, not toxic.</span>
                </li>
                <li className="flex gap-3">
                    <span className="text-yellow-500 font-bold">•</span>
                    <span>One vote per caption. Choose wisely.</span>
                </li>
            </ul>
        </div>

        {/* Call to Action */}
        <div className="text-center pb-10">
            <Link 
                href="/" 
                className="inline-block bg-yellow-400 text-black font-black text-xl px-10 py-5 rounded-xl hover:bg-yellow-300 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-yellow-200"
            >
                Enter the Arena
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
    };

    return (
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:border-gray-300 transition-colors">
            <div className={`w-14 h-14 ${colors[color]} rounded-xl flex items-center justify-center mb-6 border`}>
                {icon}
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gray-900">{title}</h3>
            <p className="text-gray-500 leading-relaxed">{desc}</p>
        </div>
    );
}
