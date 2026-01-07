import { createClient } from '@supabase/supabase-js';
import ShareRedirect from '@/components/ShareRedirect';

// Define the domain explicitly
const DOMAIN = 'https://itswebwits.com';

export async function generateMetadata({ params }) {
  const id = params.id;
  
  // 1. USE SERVICE_ROLE_KEY
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // 2. Fetch the comment
  const { data: comment } = await supabase
    .from('comments')
    .select(`
      content,
      profiles (username),
      memes (image_url)
    `)
    .eq('id', id)
    .single();

  // 3. FALLBACK WITH IMAGE
  if (!comment) {
    return {
      metadataBase: new URL(DOMAIN), // Moved here
      title: 'WebWits',
      description: 'Daily Caption Battle',
      openGraph: {
        title: 'WebWits',
        description: 'Daily Caption Battle',
        images: [`${DOMAIN}/logo.png`],
      },
      twitter: {
        card: 'summary_large_image',
        title: 'WebWits',
        description: 'Daily Caption Battle',
        images: [`${DOMAIN}/logo.png`],
      },
    };
  }

  const { content, profiles, memes } = comment;
  const username = profiles?.username || 'Anon';
  const memeUrl = memes?.image_url || '';

  // 4. Build the Image URL
  const ogSearchParams = new URLSearchParams();
  ogSearchParams.set('content', content);
  ogSearchParams.set('username', username);
  ogSearchParams.set('memeUrl', memeUrl);
  
  const ogImageUrl = `${DOMAIN}/api/og?${ogSearchParams.toString()}`;

  return {
    metadataBase: new URL(DOMAIN), // Moved here
    title: 'WebWits Battle',
    description: `Can you beat this? "${content}"`,
    openGraph: {
      title: 'WebWits Battle',
      description: `"${content}" — @${username}`,
      url: `${DOMAIN}/share/${id}`,
      siteName: 'WebWits',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: 'WebWits Battle Card',
        },
      ],
      type: 'website',
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
  return <ShareRedirect />;
}
