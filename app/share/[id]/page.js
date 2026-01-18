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

  // [!code fix] Explicitly name the foreign keys in the select string
  // Using 'memes!comments_meme_id_fkey' forces the join to work
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
  
  // 1. Start with the raw URL from DB
  let finalImageUrl = comment?.memes?.image_url || `${DOMAIN}/logo.png`;

  // 2. Build Clean Giphy URL
  if (finalImageUrl.includes('giphy.com')) {
    const match = finalImageUrl.match(/\/([a-zA-Z0-9]+)\/giphy\.(webp|gif|mp4)/);
    
    if (match && match[1]) {
      finalImageUrl = `https://i.giphy.com/media/${match[1]}/480w_still.jpg`;
    } else {
      finalImageUrl = finalImageUrl.replace('giphy.webp', '480w_still.jpg');
    }
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
