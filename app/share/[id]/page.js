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
  
  // 1. Get the URL from the database (currently a .webp)
  let finalImageUrl = comment?.memes?.image_url || `${DOMAIN}/logo.png`;

  // 2. [!code fix] THE MAGIC SWAP
  // Since your DB has 'giphy.webp', we just change the extension to 'giphy.gif'
  // WhatsApp will accept this .gif file!
  if (finalImageUrl.includes('giphy.com')) {
     finalImageUrl = finalImageUrl.replace(/giphy\.webp$/, 'giphy.gif');
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
      // 3. Now pointing to the .gif version
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
