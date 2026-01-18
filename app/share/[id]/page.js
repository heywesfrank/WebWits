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
  
  // 1. Start with the raw URL from DB
  let finalImageUrl = comment?.memes?.image_url || `${DOMAIN}/logo.png`;

  // 2. [!code fix] ROBUST URL RECONSTRUCTION
  // We don't just replace the extension. We extract the ID and build a clean, public URL.
  // This bypasses any 'v1' token errors or 404s from Giphy.
  if (finalImageUrl.includes('giphy.com')) {
    // Regex to find the ID (it's the alphanum string before /giphy.webp)
    // Example: .../1AjUYHTwbRYzVHQM3x/giphy.webp  -> ID: 1AjUYHTwbRYzVHQM3x
    const match = finalImageUrl.match(/\/([a-zA-Z0-9]+)\/giphy\.(webp|gif|mp4)/);
    
    if (match && match[1]) {
      // Rebuild using the clean, public 'i.giphy.com' host
      finalImageUrl = `https://i.giphy.com/media/${match[1]}/480w_still.jpg`;
    } else {
      // Fallback: Just basic replace if regex fails (remove $ anchor for safety)
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
      // 3. This is now a clean, safe https://i.giphy.com... URL
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
