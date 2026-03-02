// app/icon-guide/page.js
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function IconGuide() {
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
        <div className="text-center mb-16 space-y-6">
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-gray-900">
                Icon <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-600">Guide</span>
            </h1>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto font-light">
                Decode the symbols of the arena.
            </p>
        </div>

        {/* Icon Grid */}
        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            
            {/* Country Flag */}
            <div className="bg-white p-8 rounded-2xl border border-gray-200 flex items-start gap-4 shadow-sm hover:border-gray-300 transition-colors">
                 <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-100">
                    <img src="/canada.png" alt="Flag" className="w-10 h-auto rounded shadow-sm opacity-80" />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold mb-2">Country Flag</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        Represents the country the player is roasting from. We are a global battlefield.
                    </p>
                 </div>
            </div>

            {/* Star Badge */}
            <div className="bg-white p-8 rounded-2xl border border-gray-200 flex items-start gap-4 shadow-sm hover:border-gray-300 transition-colors">
                 <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-blue-100">
                    <img src="/badge.png" alt="Verified" className="w-8 h-8 object-contain" />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold mb-2">Verified Creator</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        Marks a famous influencer or known content creator.
                    </p>
                 </div>
            </div>

            {/* The Crown */}
            <div className="bg-white p-8 rounded-2xl border border-gray-200 flex items-start gap-4 shadow-sm hover:border-gray-300 transition-colors">
                 <div className="w-16 h-16 bg-yellow-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-yellow-100">
                    <img src="/crown.png" alt="Crown" className="w-10 h-10 object-contain" />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold mb-2">The Crown</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        The highest honor. This player won yesterday's battle. Treat them with respect (or roast them harder).
                    </p>
                 </div>
            </div>

            {/* Fire */}
            <div className="bg-white p-8 rounded-2xl border border-gray-200 flex items-start gap-4 shadow-sm hover:border-gray-300 transition-colors">
                 <div className="w-16 h-16 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-orange-100">
                    <img src="/fire.png" alt="On Fire" className="w-10 h-10 object-contain drop-shadow-sm" />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold mb-2">On Fire</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        This caption is heating up! The more fire emojis you see, the faster the votes are rolling in.
                    </p>
                 </div>
            </div>

            {/* Ring of Fire */}
            <div className="bg-white p-8 rounded-2xl border border-gray-200 flex items-start gap-4 shadow-sm hover:border-gray-300 transition-colors">
                 <div className="w-16 h-16 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-orange-100">
                    <img src="/ringoffire.png" alt="Ring of Fire" className="w-10 h-10 object-contain drop-shadow-sm" />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold mb-2">Ring of Fire</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        Ignite your active caption. Burns until the battle ends.
                    </p>
                 </div>
            </div>

            {/* Thumbtack of Glory */}
            <div className="bg-white p-8 rounded-2xl border border-gray-200 flex items-start gap-4 shadow-sm hover:border-gray-300 transition-colors">
                 <div className="w-16 h-16 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-red-100">
                    <img src="/thumbtackofglory.png" alt="Thumbtack of Glory" className="w-10 h-10 object-contain drop-shadow-sm" />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold mb-2">Thumbtack of Glory</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        Glue your wit to the ceiling. Stays on top for the full battle.
                    </p>
                 </div>
            </div>

            {/* The Mulligan */}
            <div className="bg-white p-8 rounded-2xl border border-gray-200 flex items-start gap-4 shadow-sm hover:border-gray-300 transition-colors">
                 <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-blue-100">
                    <img src="/mulligan.png" alt="The Mulligan" className="w-10 h-10 object-contain drop-shadow-sm" />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold mb-2">The Mulligan</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        We all make mistakes. Fix yours. Grants one caption edit.
                    </p>
                 </div>
            </div>

            {/* Double Barrel */}
            <div className="bg-white p-8 rounded-2xl border border-gray-200 flex items-start gap-4 shadow-sm hover:border-gray-300 transition-colors">
                 <div className="w-16 h-16 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-purple-100">
                    <img src="/doublebarrel.png" alt="Double Barrel" className="w-10 h-10 object-contain drop-shadow-sm" />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold mb-2">Double Barrel</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        One joke wasn't enough? Reload and fire a second caption today.
                    </p>
                 </div>
            </div>

            {/* Cut the Mic */}
            <div className="bg-white p-8 rounded-2xl border border-gray-200 flex items-start gap-4 shadow-sm hover:border-gray-300 transition-colors">
                 <div className="w-16 h-16 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-red-100">
                    <img src="/cutthemic.png" alt="Cut the Mic" className="w-10 h-10 object-contain drop-shadow-sm" />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold mb-2">Cut the Mic</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        Silence a rival. Prevents their comment from receiving any votes for 6 hours.
                    </p>
                 </div>
            </div>

            {/* Squeezal */}
            <div className="bg-white p-8 rounded-2xl border border-gray-200 flex items-start gap-4 shadow-sm hover:border-gray-300 transition-colors">
                 <div className="w-16 h-16 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-purple-100">
                    <img src="/squeezal.png" alt="Squeezal" className="w-10 h-10 object-contain drop-shadow-sm" />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold mb-2">Squeezal</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        Shrinks a rival's caption so small it requires zooming in to read. Lasts for 6 hours.
                    </p>
                 </div>
            </div>

        </div>
      </div>
    </div>
  );
}
