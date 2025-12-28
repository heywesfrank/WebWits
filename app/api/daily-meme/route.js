import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// This route will be called by Vercel Cron
export async function GET(request) {
  // Check for authorization header if you want to secure this manually
  // const authHeader = request.headers.get('authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) { ... }

  try {
    // 1. Init Supabase with SERVICE ROLE key (needed to write/update without user session)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 2. Fetch content from GIPHY
    const GIPHY_API_KEY = process.env.GIPHY_API_KEY;
    // We use the 'random' endpoint with the 'funny' tag. Adjust tag as needed.
    const giphyRes = await fetch(
      `https://api.giphy.com/v1/gifs/random?api_key=${GIPHY_API_KEY}&tag=funny&rating=pg-13`
    );
    const giphyData = await giphyRes.json();
    const gif = giphyData.data;

    if (!gif) throw new Error("No GIF found from Giphy");

    // Giphy provides an MP4 version which is lighter and loops perfectly
    const contentUrl = gif.images.original.mp4; 
    const posterUrl = gif.images.original.webp; // Fallback image

    // 3. Archive the current active meme
    const { error: archiveError } = await supabase
      .from('memes')
      .update({ status: 'archived' })
      .eq('status', 'active');

    if (archiveError) throw archiveError;

    // 4. Insert the new Meme
    const { data, error: insertError } = await supabase
      .from('memes')
      .insert({
        status: 'active',
        type: 'video', // We use 'video' so your MainApp renders the MP4 loop
        content_url: contentUrl,
        image_url: posterUrl,
        source: 'Giphy Auto-Fetch'
      })
      .select();

    if (insertError) throw insertError;

    return NextResponse.json({ success: true, new_meme: data });

  } catch (error) {
    console.error("Daily Meme Cron Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
