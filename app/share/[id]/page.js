import { createClient } from '@supabase/supabase-js';
import ShareRedirect from '@/components/ShareRedirect';

export async function generateMetadata({ params }) {
  const id = params.id;
  const DOMAIN = 'https://itswebwits.com';
  
  // 1. Setup Supabase with Service Key (bypasses RLS)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // 2. Fetch the comment
  const { data: comment, error } = await supabase
    .from('comments')
    .select(`content, profiles (username), memes (image_url)`)
    .eq('id', id)
    .single();

  // 3. Fallback: If fetch fails or ID not found, show a generic "WebWits" card
  if (error || !comment) {
    console.error(`[Metadata] Error or Not Found for ID ${id}:`, error);
    
    const fallbackOg = `${DOMAIN}/api/og?content=Daily%20Caption%20Battle&username=WebWits`;
    
    return {
      metadataBase: new URL(DOMAIN),
      title: 'WebWits - Daily Caption Battle',
      description: 'Join the daily battle for the funniest caption.',
      openGraph: {
        title: 'WebWits - Daily Caption Battle',
        description: 'Join the daily battle for the funniest caption.',
        url: `${DOMAIN}/share/${id}`,
        siteName: 'WebWits',
        images: [
          {
            url: fallbackOg,
            width: 1200,
            height: 630,
            alt: 'WebWits Daily Battle',
          },
        ],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: 'WebWits - Daily Caption Battle',
        description: 'Join the daily battle for the funniest caption.',
        images: [fallbackOg],
      },
    };
  }

  // 4. Success: Generate the custom card
  const { content, profiles, memes } = comment;
  const username = profiles?.username || 'Anon';
  const memeUrl = memes?.image_url || '';

  const ogSearchParams = new URLSearchParams();
  ogSearchParams.set('content', content);
  ogSearchParams.set('username', username);
  if (memeUrl) ogSearchParams.set('memeUrl', memeUrl);
  
  const ogImageUrl = `${DOMAIN}/api/og?${ogSearchParams.toString()}`;

  return {
    metadataBase: new URL(DOMAIN),
    title: 'WebWits Battle',
    description: `Can you beat this? "${content}"`,
    openGraph: {
      title: `Caption by @${username}`,
      description: content,
      url: `${DOMAIN}/share/${id}`,
      siteName: 'WebWits',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `Caption by @${username}`,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Caption by @${username}`,
      description: content,
      images: [ogImageUrl],
    },
  };
}

export default function SharePage() {
  return <ShareRedirect />;
}
