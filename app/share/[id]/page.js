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
  
  // Default fallback
  let finalImageUrl = `${DOMAIN}/logo.png`;
  let rawMemeUrl = comment?.memes?.image_url;

  if (rawMemeUrl && rawMemeUrl.includes('giphy.com')) {
    try {
      const parts = rawMemeUrl.split('/');
      // Extract the ID (segment before the filename)
      const fileIndex = parts.findIndex(part => part.startsWith('giphy.'));
      
      if (fileIndex > 0) {
         const giphyId = parts[fileIndex - 1];
         // [!code fix] Use 'giphy_s.gif' (Static GIF).
         // This is the safest, smallest static rendition that always exists.
         // WhatsApp accepts static GIFs as preview images.
         finalImageUrl = `https://media.giphy.com/media/${giphyId}/giphy_s.gif`;
      }
    } catch (e) {
      console.error("Error parsing Giphy URL:", e);
      finalImageUrl = rawMemeUrl || finalImageUrl;
    }
  } else if (rawMemeUrl) {
    finalImageUrl = rawMemeUrl;
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
      // Removed hardcoded width/height so WhatsApp calculates it from the actual file
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
