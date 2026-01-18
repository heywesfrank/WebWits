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
  const rawMemeUrl = comment?.memes?.image_url || `${DOMAIN}/logo.png`;

  // [!code fix] CONSTRUCT OG IMAGE URL
  // Instead of using the raw Giphy URL (which is animated/problematic),
  // we pass it to our /api/og endpoint. This endpoint will fetch the authorized
  // image and generate a static PNG card with the caption and branding.
  const searchParams = new URLSearchParams();
  searchParams.set('content', content);
  searchParams.set('username', username);
  searchParams.set('memeUrl', rawMemeUrl);
  
  const ogImageUrl = `${DOMAIN}/api/og?${searchParams.toString()}`;

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
      // We point to our generated PNG
      images: [{ url: ogImageUrl, width: 1200, height: 630 }], 
      type: 'website',
      siteName: 'WebWits',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [ogImageUrl],
    },
  };
}

export default function SharePage() {
  return <ShareRedirect />;
}
