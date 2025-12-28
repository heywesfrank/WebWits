import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // 1. Init Supabase with SERVICE ROLE key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 2. Fetch content from GIPHY
    const GIPHY_API_KEY = process.env.GIPHY_API_KEY;
    const giphyRes = await fetch(
      `https://api.giphy.com/v1/gifs/random?api_key=${GIPHY_API_KEY}&tag=funny&rating=pg-13`
    );
    const giphyData = await giphyRes.json();
    const gif = giphyData.data;

    if (!gif) throw new Error("No GIF found from Giphy");

    const contentUrl = gif.images.original.mp4; 
    const posterUrl = gif.images.original.webp;

    // --- FIX STARTS HERE ---
    
    // 3. Find the current active meme (if any)
    // Use maybeSingle() so it doesn't throw an error if this is the very first run
    const { data: activeMeme } = await supabase
      .from('memes')
      .select('id')
      .eq('status', 'active')
      .maybeSingle();

    // Only try to archive if an active meme actually exists
    if (activeMeme) {
      let winningCaption = null;

      // Check for comments (Winner calculation)
      const { data: topComments } = await supabase
        .from('comments')
        .select('content, vote_count')
        .eq('meme_id', activeMeme.id)
        .order('vote_count', { ascending: false })
        .limit(1);

      // If we have comments, grab the top one. If not, winningCaption remains null.
      if (topComments && topComments.length > 0) {
        winningCaption = topComments[0].content;
      }

      // Archive the meme and save the winner (or null)
      const { error: archiveError } = await supabase
        .from('memes')
        .update({ 
          status: 'archived',
          winning_caption: winningCaption 
        })
        .eq('id', activeMeme.id);

      if (archiveError) {
        console.error("Error archiving meme:", archiveError);
        // We continue anyway to ensure the NEW meme still gets posted
      }
    }
    // --- FIX ENDS HERE ---

    // 4. Generate Today's Date (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];

    // 5. Insert the new Meme with publish_date
    const { data, error: insertError } = await supabase
      .from('memes')
      .insert({
        status: 'active',
        type: 'video',
        content_url: contentUrl,
        image_url: posterUrl,
        source: 'Giphy Auto-Fetch',
        publish_date: today 
      })
      .select();

    if (insertError) throw insertError;

    return NextResponse.json({ success: true, new_meme: data });

  } catch (error) {
    console.error("Daily Meme Cron Error:", error);
    return NextResponse.json({ error: error.message, details: error }, { status: 500 });
  }
}
