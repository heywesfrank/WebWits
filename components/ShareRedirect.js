"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ShareRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect immediately to the home page
    // replace() ensures the back button works correctly (doesn't loop)
    router.replace('/');
  }, [router]);

  // Minimal loading screen that matches your app's bg-white theme
  // This prevents a jarring "dark mode" flash before the main app loads
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="animate-pulse">
        <img src="/logo.png" alt="WebWits" className="w-32 h-auto opacity-50" />
      </div>
    </div>
  );
}
