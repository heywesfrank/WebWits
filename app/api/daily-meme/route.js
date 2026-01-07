import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Prevent Next.js from caching this route
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const GIPHY_API_KEY = process.env.GIPHY_API_KEY;
    
    // --- STEP 1: Fetch a Unique GIF (No Repeats) ---
    let contentUrl = null;
    let posterUrl = null;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 5) {
      attempts++;
      
      // Fetch from Giphy with no-store to avoid caching
      const giphyRes = await fetch(
        `https://api.giphy.com/v1/gifs/random?api_key=${GIPHY_API_KEY}&tag=funny&rating=pg-13`,
        { cache: 'no-store' }
      );
      const giphyData = await giphyRes.json();
      const gif = giphyData.data;

      if (!gif) throw new Error("No GIF found from Giphy");

      const tempContentUrl = gif.images.original.mp4;
      
      // Check if this GIF URL already exists in our DB
      const { data: existing } = await supabase
        .from('memes')
        .select('id')
        .eq('content_url', tempContentUrl)
        .maybeSingle();

      if (!existing) {
        contentUrl = tempContentUrl;
        posterUrl = gif.images.original.webp;
        isUnique = true;
      } else {
        console.log(`Duplicate GIF found (Attempt ${attempts}), retrying...`);
      }
    }

    if (!isUnique) throw new Error("Failed to find a unique GIF after 5 attempts");

    // --- STEP 2: Archive ALL currently active memes (Self-Healing) ---
    // We use .select() instead of .single() to handle cases where multiple memes are active
    const { data: activeMemes } = await supabase
      .from('memes')
      .select('id')
      .eq('status', 'active');

    if (activeMemes && activeMemes.length > 0) {
      for (const meme of activeMemes) {
        let winningCaption = null;

        // Find winner for this specific meme
        const { data: topComments } = await supabase
          .from('comments')
          .select('content, vote_count')
          .eq('meme_id', meme.id)
          .order('vote_count', { ascending: false })
          .limit(1);

        if (topComments && topComments.length > 0) {
          winningCaption = topComments[0].content;
        }

        // Archive it
        await supabase
          .from('memes')
          .update({ 
            status: 'archived',
            winning_caption: winningCaption 
          })
          .eq('id', meme.id);
      }
    }

    // --- STEP 3: Insert the New Meme ---
    const today = new Date().toISOString().split('T')[0];

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
