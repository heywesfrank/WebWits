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

  // 1. Fetch data with explicit foreign keys
  // This ensures we successfully get the meme data (unlike the original null error)
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
  
  // 2. Start with raw URL from DB
  let finalImageUrl = comment?.memes?.image_url || `${DOMAIN}/logo.png`;

  // 3. CLEAN ID EXTRACTION
  // We extract just the ID to build a clean, static URL.
  // Input:  .../media/v1.Y2lk.../1AjUYHTwbRYzVHQM3x/giphy.webp
  // Output: https://media.giphy.com/media/1AjUYHTwbRYzVHQM3x/480w_still.jpg
  if (finalImageUrl.includes('giphy.com')) {
    try {
      const parts = finalImageUrl.split('/');
      // The ID is always the segment right before the filename ("giphy.webp")
      const fileIndex = parts.findIndex(part => part.startsWith('giphy.'));
      
      if (fileIndex > 0) {
         const giphyId = parts[fileIndex - 1];
         // Use the public 'media.giphy.com' endpoint which is more reliable than 'i.giphy.com' for stills
         finalImageUrl = `https://media.giphy.com/media/${giphyId}/480w_still.jpg`;
      }
    } catch (e) {
      console.error("Error parsing Giphy URL:", e);
      // Fallback: If parsing fails, use the original (it might show as a gif, but better than broken)
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
      // This is now a clean JPG url
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
