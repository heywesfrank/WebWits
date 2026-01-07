"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ShareRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Wait a brief moment then redirect to home
    const timer = setTimeout(() => {
      router.push('/');
    }, 1000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white font-sans">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <img src="/logo.png" alt="WebWits" className="w-32 h-auto" />
        <p className="text-yellow-400 font-bold">Loading Battle...</p>
      </div>
    </div>
  );
}
