import { Outfit, Inter } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "WebWits - The Daily Meme Caption Battle",
  description: "Join the ultimate daily caption contest where humor is currency. A new meme drops every 24 hours—submit your best caption, vote on the community favorites, climb the global leaderboard, and win real prizes. Do you have the wit to win?",
  manifest: "/manifest.json",
  keywords: ["meme contest", "caption battle", "daily memes", "funny captions", "webwits", "online games", "win prizes"],
  openGraph: {
    title: "WebWits - The Daily Meme Caption Battle",
    description: "Join the arena. One meme, 24 hours, infinite wit. Battle for the top spot and win prizes.",
    url: 'https://itswebwits.com',
    siteName: 'WebWits',
    images: [
      {
        url: 'https://itswebwits.com/og-image.png', // You should create/host a generic OG image
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "WebWits - Daily Meme Battle",
    description: "One meme. 24 hours. Who is the funniest? Join the battle now.",
    // images: ['https://itswebwits.com/og-image.png'], // Add your image URL here
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* Changed bg-gray-900 to bg-white and text-gray-200 to text-gray-900 */}
      <body className={`${inter.variable} ${outfit.variable} font-sans bg-white text-gray-900`}>
        {children}
      </body>
    </html>
  );
}
