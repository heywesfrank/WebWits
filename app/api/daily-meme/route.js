// app/api/daily-meme/route.js
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

    // --- [NEW] STEP 0.5: RESET DAILY RANKS ---
    // Clear yesterday's winners so people don't get notified twice if they skip a day
    await supabase.from('profiles').update({ daily_rank: null }).neq('id', '00000000-0000-0000-0000-000000000000');

    // --- STEP 1: Fetch Content (Trending -> Random Fallback -> Force) ---
    // [Content fetching logic remains unchanged...]
    let contentUrl = null;
    let posterUrl = null;
    let selectedGif = null;
    let trendingPool = [];

    // Strategy A: Trending
    try {
        const trendingRes = await fetch(
            `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=50&rating=pg-13`,
            { cache: 'no-store' }
        );
        const trendingData = await trendingRes.json();
        if (trendingData.data && trendingData.data.length > 0) {
            trendingPool = trendingData.data;
            const shuffled = [...trendingPool].sort(() => Math.random() - 0.5);
            for (const gif of shuffled) {
                const tempUrl = gif.images.original.mp4;
                const { data: existing } = await supabase.from('memes').select('id').eq('content_url', tempUrl).maybeSingle();
                if (!existing) {
                    selectedGif = gif;
                    break; 
                }
            }
        }
    } catch (e) { console.error("Trending fetch failed:", e); }

    // Strategy B: Random Fallback
    if (!selectedGif) {
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
                    const { data: existing } = await supabase.from('memes').select('id').eq('content_url', tempUrl).maybeSingle();
                    if (!existing) selectedGif = gif;
                }
            } catch (e) { console.error("Random fetch attempt failed:", e); }
        }
    }

    // Strategy C: Emergency Force
    if (!selectedGif && trendingPool.length > 0) {
         selectedGif = trendingPool[Math.floor(Math.random() * trendingPool.length)];
    }

    if (!selectedGif) throw new Error("Critical Failure: Giphy API unreachable or no content returned.");

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

          // --- NOTIFY DAILY WINNER (Push Notification) ---
          const winnerId = comments[0].user_id;
          if (winnerId) {
             await sendNotificationToUser(winnerId, {
                title: "🏆 VICTORY!",
                body: `Your caption won yesterday's battle! You earned 100 credits. "${winningCaption.substring(0, 25)}..."`,
                url: "https://itswebwits.com"
             });
          }

          // 2. Aggregate points (votes) per user
          const userPoints = {};
          comments.forEach(comment => {
            if (comment.vote_count > 0) {
              userPoints[comment.user_id] = (userPoints[comment.user_id] || 0) + comment.vote_count;
            }
          });

          // --- NEW: Calculate Credit Rewards (Top 3) ---
          const userCredits = {};
          const userRanks = {}; // Map to store rank for profile update
          const prizes = [100, 75, 50]; // [!code change] Updated prize amounts

          comments.slice(0, 3).forEach((comment, index) => {
              const prizeAmount = prizes[index];
              const rank = index + 1;
              
              userCredits[comment.user_id] = (userCredits[comment.user_id] || 0) + prizeAmount;
              userRanks[comment.user_id] = rank; // Store rank (1, 2, or 3)
          });

          // 3. Update User Profiles (Points + Credits + Rank)
          // Combine IDs from both points and credits maps to ensure we update everyone
          const allUserIds = new Set([...Object.keys(userPoints), ...Object.keys(userCredits)]);
          const userIds = Array.from(allUserIds);

          if (userIds.length > 0) {
            const { data: currentProfiles } = await supabase
              .from('profiles')
              .select('id, monthly_points, total_points, credits') 
              .in('id', userIds);

            const updates = currentProfiles.map(profile => {
              const pointsEarned = userPoints[profile.id] || 0;
              const creditsEarned = userCredits[profile.id] || 0;
              const rank = userRanks[profile.id] || null; // Will be 1, 2, 3 or null

              return {
                id: profile.id,
                monthly_points: (profile.monthly_points || 0) + pointsEarned,
                total_points: (profile.total_points || 0) + pointsEarned,
                credits: (profile.credits || 0) + creditsEarned, 
                daily_rank: rank, // [!code change] Set the rank for popup
                updated_at: new Date()
              };
            });

            const { error: upsertError } = await supabase
              .from('profiles')
              .upsert(updates);
              
            if (upsertError) console.error("Error updating profiles:", upsertError);
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
