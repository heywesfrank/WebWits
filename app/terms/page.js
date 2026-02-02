import Link from "next/link";
import { ArrowLeft, ScrollText } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 p-6 font-sans">
      <div className="max-w-3xl mx-auto">
        
        {/* Navigation */}
        <nav className="flex items-center justify-between mb-12">
            <Link href="/login" className="group flex items-center gap-2 text-gray-500 hover:text-black transition-colors px-4 py-2 rounded-full hover:bg-gray-100">
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                <span className="font-bold">Back</span>
            </Link>
        </nav>

        {/* Header */}
        <div className="mb-12 border-b border-gray-100 pb-8">
            <div className="w-16 h-16 bg-yellow-50 rounded-2xl flex items-center justify-center mb-6">
                <ScrollText size={32} className="text-yellow-600" />
            </div>
            <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-2">
                Terms of Use
            </h1>
            <p className="text-gray-500">Last Updated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Content */}
        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">
            
            <Section title="1. Acceptance of Terms">
                By accessing or using WebWits, you agree to these Terms of Use. If you do not agree, please do not use the app.
            </Section>

            <Section title="2. Eligibility">
                You must be at least 13 years old to use WebWits.
            </Section>

            <Section title="3. Free-to-Play">
                WebWits is completely free to play. No purchase is required to participate or win prizes.
            </Section>

            <Section title="4. User Conduct">
                <p className="mb-2">You agree not to:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Post hateful, abusive, or illegal content</li>
                    <li>Harass other users</li>
                    <li>Attempt to exploit, cheat, or manipulate rankings</li>
                    <li>Upload copyrighted material you do not have rights to</li>
                </ul>
                <p className="mt-2">We reserve the right to remove content or suspend accounts that violate these rules.</p>
            </Section>

            <Section title="5. Content Ownership">
                <ul className="list-disc pl-5 space-y-1">
                    <li>You retain ownership of content you submit</li>
                    <li>By submitting content, you grant WebWits a non-exclusive, royalty-free license to display and promote that content within the app and related marketing</li>
                </ul>
            </Section>

            <Section title="6. Game Mechanics & Fair Play">
                Rankings, votes, and outcomes are determined by WebWits systems. Attempts to game or manipulate results may result in disqualification.
            </Section>

            <Section title="7. Prizes">
                <ul className="list-disc pl-5 space-y-1">
                    <li>Prizes are free and may change at any time</li>
                    <li>No cash alternative unless stated</li>
                    <li>WebWits reserves the right to substitute prizes of equal or greater value</li>
                    <li>Winning odds depend on participation and performance</li>
                </ul>
            </Section>

            <Section title="8. No Guarantee">
                We do not guarantee uninterrupted service, specific outcomes, or winnings.
            </Section>

            <Section title="9. Limitation of Liability">
                WebWits is provided "as is." We are not liable for damages, losses, or issues arising from use of the platform.
            </Section>

            <Section title="10. Termination">
                We may suspend or terminate accounts at our discretion for violations or abuse.
            </Section>

            <Section title="11. Changes to Terms">
                We may update these Terms at any time. Continued use constitutes acceptance.
            </Section>

            <Section title="12. Governing Law">
                These terms are governed by the laws of the jurisdiction in which WebWits operates.
            </Section>

              <Section title="13. Comedy Disclaimer">
                Users acknowledge that WebWits hosts user-generated comedic content which may include satire, parody, irony, exaggeration, or dark humor. Users agree not to hold WebWits liable for emotional distress, offense taken, or interpretations of comedic content.
            </Section>

            <Section title="14. Prohibited Scraping and Automated Access">
                Users may not scrape, crawl, copy, reproduce, or otherwise extract data, content, code, or user interface elements from WebWits through automated means or bulk access methods. This includes, but is not limited to, bots, scripts, spiders, or data-mining tools. Unauthorized copying of the WebWits UI, source code, or underlying systems is strictly prohibited.
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
