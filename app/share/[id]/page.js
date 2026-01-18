import { createClient } from '@supabase/supabase-js';
import ShareRedirect from '@/components/ShareRedirect';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const id = params.id;
  const DOMAIN = 'https://itswebwits.com';
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // 1. Fetch data with explicit foreign keys to avoid nulls
  const { data: comment } = await supabase
    .from('comments')
    .select(`
      content, 
      profiles!comments_user_id_fkey (username), 
      memes!comments_meme_id_fkey (image_url)
    `)
    .eq('id', id)
    .single();

  const username = comment?.profiles?.username || 'Anon';
  const content = comment?.content || '';
  
  // 2. Start with the raw URL from DB
  let finalImageUrl = comment?.memes?.image_url || `${DOMAIN}/logo.png`;

  // 3. [!code fix] SIMPLE REPLACEMENT STRATEGY
  // Do not strip the domain or the 'v1...' token path. 
  // Just swap the file ending to get the static jpg version.
  if (finalImageUrl.includes('giphy.com')) {
     // Replace typical Giphy endings with the static 480w jpg
     finalImageUrl = finalImageUrl
        .replace('/giphy.webp', '/480w_still.jpg')
        .replace('/giphy.gif', '/480w_still.jpg')
        .replace('/giphy.mp4', '/480w_still.jpg');
  }

  const title = comment ? `"${content}"` : 'WebWits';
  const description = comment 
    ? `Can you beat this caption by @${username}?` 
    : 'Daily Caption Battle';

  return {
    metadataBase: new URL(DOMAIN),
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: [{ url: finalImageUrl, width: 480, height: 480 }], 
      type: 'website',
      siteName: 'WebWits',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [finalImageUrl],
    },
  };
}

export default function SharePage() {
  return <ShareRedirect />;
}
