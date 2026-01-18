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
    .select(`content, profiles (username), memes (image_url)`)
    .eq('id', id)
    .single();

  const username = comment?.profiles?.username || 'Anon';
  const content = comment?.content || '';
  const rawMemeUrl = comment?.memes?.image_url;

  // [!code change] Generate a Dynamic OG Image URL
  // This calls your /api/og route, which converts the meme + text into a PNG.
  // This solves the WhatsApp "WebP" issue.
  const ogImageUrl = rawMemeUrl 
    ? `${DOMAIN}/api/og?content=${encodeURIComponent(content)}&username=${encodeURIComponent(username)}&memeUrl=${encodeURIComponent(rawMemeUrl)}`
    : `${DOMAIN}/logo.png`;

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
      // [!code change] Point to the generated PNG
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
