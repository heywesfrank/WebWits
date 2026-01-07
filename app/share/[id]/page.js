"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

// --- SERVER SIDE METADATA GENERATION ---
// This runs on the server before the page loads to generate the Twitter Card
export async function generateMetadata({ params }) {
  const id = params.id;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // 1. Fetch the comment
  const { data: comment } = await supabase
    .from('comments')
    .select(`
      content,
      profiles (username),
      memes (image_url)
    `)
    .eq('id', id)
    .single();

  // Fallback if not found
  if (!comment) {
    return {
      title: 'WebWits',
      description: 'Daily Caption Battle'
    };
  }

  const { content, profiles, memes } = comment;
  const username = profiles?.username || 'Anon';
  const memeUrl = memes?.image_url || '';

  // 2. Build the Image URL (Pointing to YOUR domain, not Supabase)
  // We use encodeURIComponent to ensure special characters don't break the URL
  const ogSearchParams = new URLSearchParams();
  ogSearchParams.set('content', content);
  ogSearchParams.set('username', username);
  ogSearchParams.set('memeUrl', memeUrl);
  // [!code warning] Ensure this matches your actual deployed domain
  const domain = 'https://itswebwits.com'; 
  const ogImageUrl = `${domain}/api/og?${ogSearchParams.toString()}`;

  return {
    title: 'WebWits Battle',
    description: `Can you beat this? "${content}"`,
    openGraph: {
      title: 'WebWits Battle',
      description: `"${content}" — @${username}`,
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'WebWits Battle',
      description: `"${content}" — @${username}`,
      images: [ogImageUrl],
    },
  };
}

// --- CLIENT SIDE REDIRECT ---
// This component renders the page content and handles the user redirect
export default function SharePage() {
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
