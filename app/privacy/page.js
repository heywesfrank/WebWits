import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function PrivacyPage() {
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
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck size={32} className="text-blue-600" />
            </div>
            <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-2">
                Privacy Policy
            </h1>
            <p className="text-gray-500">Last Updated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Content */}
        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">
            
            <Section title="1. What We Are">
                WebWits is a free-to-play web application where users participate in daily meme caption battles for entertainment and the chance to win free prizes.
            </Section>

            <Section title="2. Information We Collect">
                <p className="mb-2">We only collect what’s necessary to operate WebWits:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Account information (such as email or login credentials)</li>
                    <li>Basic usage data (pages visited, interactions, timestamps)</li>
                    <li>Device and browser data (IP address, browser type)</li>
                </ul>
                <p className="mt-2 font-medium">We do not sell personal data.</p>
            </Section>

            <Section title="3. How We Use Your Information">
                <p className="mb-2">We use collected information to:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Operate and improve WebWits</li>
                    <li>Authenticate users and prevent abuse</li>
                    <li>Communicate important updates (not spam)</li>
                    <li>Administer contests and prizes</li>
                </ul>
            </Section>

            <Section title="4. Cookies & Analytics">
                <p className="mb-2">WebWits may use cookies or similar technologies for:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Login sessions</li>
                    <li>Basic analytics</li>
                </ul>
                <p className="mt-2">You can disable cookies in your browser, but some features may not work properly.</p>
            </Section>

            <Section title="5. Third-Party Services">
                We may use trusted third-party services (such as hosting, analytics, or authentication providers). These services only receive data required to perform their function.
            </Section>

            <Section title="6. Data Security">
                We take reasonable steps to protect user data, but no system is 100% secure. Use WebWits at your own discretion.
            </Section>

            <Section title="7. Children’s Privacy">
                WebWits is not intended for users under 13 years old. We do not knowingly collect data from children.
            </Section>

            <Section title="8. Changes to This Policy">
                We may update this Privacy Policy from time to time. Continued use of WebWits means you accept the updated policy.
            </Section>

            <Section title="9. Contact">
                Questions? Contact us through the WebWits platform or email us directly at <a href="mailto:hello@itswebwits.com" className="text-blue-600 hover:underline">hello@itswebwits.com</a>.
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
