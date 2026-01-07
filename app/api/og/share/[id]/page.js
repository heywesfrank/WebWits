import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

// Initialize Supabase for Server-Side Fetching
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function generateMetadata({ params }) {
  const id = params.id;

  // 1. Fetch the specific comment and its related meme
  const { data: comment } = await supabase
    .from('comments')
    .select(`
      content,
      vote_count,
      profiles (username),
      memes (image_url)
    `)
    .eq('id', id)
    .single();

  if (!comment) {
    return {
      title: 'WebWits - Daily Caption Battle',
      description: 'Join the battle!'
    };
  }

  // 2. Construct the Dynamic OG Image URL
  const { content, profiles, memes } = comment;
  const username = profiles?.username || 'Anon';
  const memeUrl = memes?.image_url || '';
  
  // We construct the URL to our new API route
  const ogImageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'https://itswebwits.com' : 'http://localhost:3000'}/api/og?content=${encodeURIComponent(content)}&username=${encodeURIComponent(username)}&memeUrl=${encodeURIComponent(memeUrl)}`;

  return {
    title: `Can you beat this caption?`,
    description: `"${content}" — @${username} on WebWits`,
    openGraph: {
      title: `WebWits Caption Battle`,
      description: `"${content}" — @${username}`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: 'WebWits Share Card',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `WebWits Caption Battle`,
      description: `"${content}"`,
      images: [ogImageUrl],
    },
  };
}

export default function SharePage({ params }) {
  // 3. Redirect to home (or deep link to the specific comment if you build that later)
  redirect('/'); 
}
