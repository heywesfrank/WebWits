import { Outfit, Inter } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "WebWits",
  description: "Daily caption contest",
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
