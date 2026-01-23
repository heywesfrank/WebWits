import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendNotificationToUser, sendNotificationToAll } from '@/lib/sendPush';

// Prevent Next.js from caching this route
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const GIPHY_API_KEY = process.env.GIPHY_API_KEY;
    const today = new Date().toISOString().split('T')[0];

    // --- STEP 0: IDEMPOTENCY CHECK ---
    const { data: existingToday } = await supabase
      .from('memes')
      .select('id, status')
      .eq('publish_date', today)
      .maybeSingle();

    if (existingToday) {
      return NextResponse.json({ 
        success: true, 
        message: `Meme for ${today} already exists. Skipping.`,
        meme: existingToday
      });
    }

    // --- STEP 1: Fetch Content (Trending -> Random Fallback -> Force) ---
    let contentUrl = null;
    let posterUrl = null;
    let selectedGif = null;
    let trendingPool = [];

    // Strategy A: Trending (Primary)
    // Fetch top 50 trending, shuffle them, find first unique one.
    try {
        const trendingRes = await fetch(
            `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=50&rating=pg-13`,
            { cache: 'no-store' }
        );
        const trendingData = await trendingRes.json();
        
        if (trendingData.data && trendingData.data.length > 0) {
            trendingPool = trendingData.data;
            // Shuffle the pool so we don't always pick the #1 trending gif
            const shuffled = [...trendingPool].sort(() => Math.random() - 0.5);
            
            for (const gif of shuffled) {
                const tempUrl = gif.images.original.mp4;
                
                // Check uniqueness
                const { data: existing } = await supabase
                    .from('memes')
                    .select('id')
                    .eq('content_url', tempUrl)
                    .maybeSingle();
                
                if (!existing) {
                    selectedGif = gif;
                    console.log("Selected unique trending meme.");
                    break; 
                }
            }
        }
    } catch (e) {
        console.error("Trending fetch failed:", e);
    }

    // Strategy B: Random Fallback 
    // If no unique trending GIF was found, fall back to the old "random funny" logic.
    if (!selectedGif) {
        console.log("No unique trending meme found. Falling back to Random search.");
        let attempts = 0;
        while (!selectedGif && attempts < 5) {
            attempts++;
            try {
                const randomRes = await fetch(
                    `https://api.giphy.com/v1/gifs/random?api_key=${GIPHY_API_KEY}&tag=funny&rating=pg-13`,
                    { cache: 'no-store' }
                );
                const randomData = await randomRes.json();
                const gif = randomData.data;
                
                if (gif) {
                    const tempUrl = gif.images.original.mp4;
                    const { data: existing } = await supabase
                        .from('memes')
                        .select('id')
                        .eq('content_url', tempUrl)
                        .maybeSingle();
                    
                    if (!existing) {
                        selectedGif = gif;
                    }
                }
            } catch (e) {
                console.error("Random fetch attempt failed:", e);
            }
        }
    }

    // Strategy C: Emergency Force
    // If both strategies failed, we MUST pick something. Use a duplicate if we have to.
    if (!selectedGif && trendingPool.length > 0) {
         console.warn("EMERGENCY: Could not find unique meme. Forcing a selection from Trending pool.");
         selectedGif = trendingPool[Math.floor(Math.random() * trendingPool.length)];
    }

    // If we simply cannot find anything (API Down / No Data), throw error.
    if (!selectedGif) {
        throw new Error("Critical Failure: Giphy API unreachable or no content returned.");
    }

    contentUrl = selectedGif.images.original.mp4;
    posterUrl = selectedGif.images.original.webp;

    // --- STEP 2: Archive & SCORE active memes ---
    const { data: activeMemes } = await supabase
      .from('memes')
      .select('id')
      .eq('status', 'active');

    if (activeMemes && activeMemes.length > 0) {
      
      // A. MONTHLY RESET CHECK
      const currentDay = new Date().getDate();
      if (currentDay === 1) {
         await supabase.from('profiles').update({ monthly_points: 0 }).neq('id', '00000000-0000-0000-0000-000000000000');
         console.log("First of the month: Monthly points reset.");
      }

      for (const meme of activeMemes) {
        let winningCaption = null;

        // 1. Get all comments and their vote counts
        const { data: comments } = await supabase
          .from('comments')
          .select('id, content, vote_count, user_id')
          .eq('meme_id', meme.id)
          .order('vote_count', { ascending: false });

        if (comments && comments.length > 0) {
          winningCaption = comments[0].content;

          // --- NEW: NOTIFY DAILY WINNER (Feature #2) ---
          const winnerId = comments[0].user_id;
          if (winnerId) {
             await sendNotificationToUser(winnerId, {
                title: "🏆 VICTORY!",
                body: `Your caption won yesterday's battle! "${winningCaption.substring(0, 25)}..."`,
                url: "https://itswebwits.com"
             });
          }
          // ---------------------------------------------

          // 2. Aggregate points per user
          const userPoints = {};
          comments.forEach(comment => {
            if (comment.vote_count > 0) {
              userPoints[comment.user_id] = (userPoints[comment.user_id] || 0) + comment.vote_count;
            }
          });

          // 3. Update User Profiles
          const userIds = Object.keys(userPoints);
          if (userIds.length > 0) {
            const { data: currentProfiles } = await supabase
              .from('profiles')
              .select('id, monthly_points, total_points')
              .in('id', userIds);

            const updates = currentProfiles.map(profile => {
              const pointsEarned = userPoints[profile.id] || 0;
              return {
                id: profile.id,
                monthly_points: (profile.monthly_points || 0) + pointsEarned,
                total_points: (profile.total_points || 0) + pointsEarned,
                updated_at: new Date()
              };
            });

            const { error: upsertError } = await supabase
              .from('profiles')
              .upsert(updates);
              
            if (upsertError) console.error("Error updating points:", upsertError);
          }
        }

        // 4. Archive the meme
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
    const { data, error: insertError } = await supabase
      .from('memes')
      .insert({
        status: 'active',
        type: 'video',
        content_url: contentUrl,
        image_url: posterUrl,
        source: 'Giphy Trending',
        publish_date: today 
      })
      .select();

    if (insertError) throw insertError;

    // --- SEND NOTIFICATION ---
    await sendNotificationToAll({
        title: "🔥 New Meme Dropped!",
        body: "The arena is open. Go be funny.",
        url: "https://itswebwits.com"
    });

    return NextResponse.json({ success: true, new_meme: data });

  } catch (error) {
    console.error("Daily Meme Cron Error:", error);
    return NextResponse.json({ error: error.message, details: error }, { status: 500 });
  }
}
