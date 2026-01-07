import { createClient } from '@supabase/supabase-js';
import ShareRedirect from '@/components/ShareRedirect'; // Import the client component

// --- SERVER SIDE METADATA GENERATION ---
export async function generateMetadata({ params }) {
  const id = params.id;
  
  // Initialize Supabase (Server-side compatible)
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

  // 2. Build the Image URL
  const ogSearchParams = new URLSearchParams();
  ogSearchParams.set('content', content);
  ogSearchParams.set('username', username);
  ogSearchParams.set('memeUrl', memeUrl);
  
  // Ensure this matches your actual deployed domain
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

// --- MAIN PAGE COMPONENT ---
export default function SharePage() {
  // Just render the client redirector
  return <ShareRedirect />;
}
