// app/api/comment/cut-mic/route.js
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { commentId, userId } = await req.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Fetch Profile & Comment
    const [{ data: profile }, { data: comment }] = await Promise.all([
      supabase.from('profiles').select('cosmetics').eq('id', userId).single(),
      supabase.from('comments').select('id, user_id, mic_cut_until').eq('id', commentId).single()
    ]);

    if (!profile || !comment) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // 2. Verify Powerup Ownership
    const cutCount = profile.cosmetics?.consumable_cut_mic_count || 0;
    if (cutCount <= 0) {
      return NextResponse.json({ error: "You don't own a Cut the Mic powerup. Buy it in the Store." }, { status: 403 });
    }

    // 3. Verify Comment isn't already cut
    if (comment.mic_cut_until && new Date(comment.mic_cut_until) > new Date()) {
       return NextResponse.json({ error: "This user's mic is already cut." }, { status: 400 });
    }
    if (comment.user_id === userId) {
       return NextResponse.json({ error: "You can't cut your own mic." }, { status: 400 });
    }

    // 4. Update Comment (Add 6 Hours)
    const cutUntil = new Date();
    cutUntil.setHours(cutUntil.getHours() + 6);

    const { error: updateError } = await supabase
      .from('comments')
      .update({ 
         mic_cut_until: cutUntil.toISOString(),
         mic_cut_by: userId
      })
      .eq('id', commentId);

    if (updateError) throw updateError;

    // 5. Consume Item
    const newCosmetics = { ...profile.cosmetics };
    newCosmetics.consumable_cut_mic_count = cutCount - 1;

    await supabase
      .from('profiles')
      .update({ cosmetics: newCosmetics })
      .eq('id', userId);

    return NextResponse.json({ success: true, mic_cut_until: cutUntil.toISOString() });

  } catch (error) {
    console.error("Cut Mic Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
