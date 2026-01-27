import Link from "next/link";
import { ArrowLeft, Smile } from "lucide-react";

export default function ComedyDisclaimerPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 p-6 font-sans">
      <div className="max-w-3xl mx-auto">
        
        {/* Navigation */}
        <nav className="flex items-center justify-between mb-12">
            <Link href="/" className="group flex items-center gap-2 text-gray-500 hover:text-black transition-colors px-4 py-2 rounded-full hover:bg-gray-100">
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                <span className="font-bold">Back to Battle</span>
            </Link>
        </nav>

        {/* Header */}
        <div className="mb-12 border-b border-gray-100 pb-8">
            <div className="w-16 h-16 bg-yellow-50 rounded-2xl flex items-center justify-center mb-6">
                <Smile size={32} className="text-yellow-600" />
            </div>
            <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-2">
                Comedy Disclaimer
            </h1>
            <p className="text-gray-500">Last Updated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Content */}
        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">
            
            <Section title="1. Nature of Content">
                Users acknowledge that WebWits hosts user-generated comedic content which may include satire, parody, irony, exaggeration, or dark humor. The content found on this platform is intended solely for entertainment purposes.
            </Section>

            <Section title="2. User Responsibility">
                Users agree not to hold WebWits, its creators, or affiliates liable for emotional distress, offense taken, or personal interpretations of comedic content. By entering the arena, you accept that humor is subjective and that you may encounter jokes you do not find funny or agreeable.
            </Section>

            <Section title="3. No Malicious Intent">
                While roasting and banter are core mechanics of WebWits, actual harassment, hate speech, and threats are strictly prohibited as per our Terms of Use. However, users must distinguish between competitive banter ("roasting") and actual malice.
            </Section>

            <Section title="4. Fiction & Exaggeration">
                Captions and memes are often works of fiction or exaggerated reality. Statements made within the context of the game should not be treated as factual declarations or genuine political/social stances.
            </Section>

            <Section title="5. Waiver of Liability">
                By using WebWits, you waive your right to pursue legal action based on feelings of offense, shock, or dismay resulting from user-generated jokes, memes, or captions.
            </Section>

        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
    return (
        <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">{title}</h2>
            <div className="text-gray-600">{children}</div>
        </section>
    );
}
