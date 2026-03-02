// app/api/comment/squeeze/route.js
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
      supabase.from('comments').select('id, user_id, squeezed_until').eq('id', commentId).single()
    ]);

    if (!profile || !comment) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // 2. Verify Powerup Ownership
    const squeezeCount = profile.cosmetics?.consumable_squeezal_count || 0;
    if (squeezeCount <= 0) {
      return NextResponse.json({ error: "You don't own a Squeezal powerup. Buy it in the Store." }, { status: 403 });
    }

    // 3. Verify Comment isn't already squeezed
    if (comment.squeezed_until && new Date(comment.squeezed_until) > new Date()) {
       return NextResponse.json({ error: "This user's comment is already squeezed." }, { status: 400 });
    }
    if (comment.user_id === userId) {
       return NextResponse.json({ error: "You can't squeeze your own comment." }, { status: 400 });
    }

    // 4. Update Comment (Add 6 Hours)
    const squeezeUntil = new Date();
    squeezeUntil.setHours(squeezeUntil.getHours() + 6);

    const { error: updateError } = await supabase
      .from('comments')
      .update({ 
         squeezed_until: squeezeUntil.toISOString(),
         squeezed_by: userId
      })
      .eq('id', commentId);

    if (updateError) throw updateError;

    // 5. Consume Item
    const newCosmetics = { ...profile.cosmetics };
    newCosmetics.consumable_squeezal_count = squeezeCount - 1;

    await supabase
      .from('profiles')
      .update({ cosmetics: newCosmetics })
      .eq('id', userId);

    return NextResponse.json({ success: true, squeezed_until: squeezeUntil.toISOString() });

  } catch (error) {
    console.error("Squeeze Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
