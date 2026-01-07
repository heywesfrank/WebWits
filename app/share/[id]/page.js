import { createClient } from '@supabase/supabase-js';
import ShareRedirect from '@/components/ShareRedirect';

// Force dynamic rendering to ensure we fetch the latest data every time
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const id = params.id;
  const DOMAIN = 'https://itswebwits.com';
  
  // 1. Setup Supabase
  // CRITICAL: Ensure 'SUPABASE_SERVICE_ROLE_KEY' is in your Vercel Environment Variables.
  // This is required to read the data without logging in.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // 2. Fetch the comment and the associated meme image
  const { data: comment } = await supabase
    .from('comments')
    .select(`
      content,
      profiles (username),
      memes (image_url)
    `)
    .eq('id', id)
    .single();

  // 3. Define the content for the card
  // If fetch fails, fall back to generic app info
  const title = comment ? `"${comment.content}"` : 'WebWits';
  const description = comment 
    ? `Caption by @${comment.profiles?.username || 'anon'}` 
    : 'Daily Caption Battle';
    
  // Use the meme image directly. Fallback to logo if missing.
  const imageUrl = comment?.memes?.image_url || `${DOMAIN}/logo.png`;

  return {
    metadataBase: new URL(DOMAIN),
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      // The crucial part: pointing directly to the meme image
      images: [
        {
          url: imageUrl,
          width: 800, // Best guess dimensions help platforms render faster
          height: 600,
        }
      ],
      type: 'website',
      siteName: 'WebWits',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [imageUrl],
    },
  };
}

// Client component that redirects to home when a human actually clicks the link
export default function SharePage() {
  return <ShareRedirect />;
}
