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
  
  // 1. Get the raw URL from the database (currently .../giphy.webp)
  let finalImageUrl = comment?.memes?.image_url || `${DOMAIN}/logo.png`;

  // 2. [!code fix] FORCE "SCREENSHOT" MODE
  // We replace 'giphy.webp' with '480w_still.jpg'.
  // This tells WhatsApp: "Don't try to play an animation. Just show this photo."
  if (finalImageUrl.includes('giphy.com')) {
     finalImageUrl = finalImageUrl.replace(/giphy\.webp$/, '480w_still.jpg');
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
      // 3. This JPG is small, static, and works perfectly in WhatsApp
      images: [{ url: finalImageUrl }], 
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
