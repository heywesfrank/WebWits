// app/api/comment/edit/route.js
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { filterProfanity } from '@/lib/profanity';

export async function POST(req) {
  try {
    const { commentId, content, userId } = await req.json();
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Fetch Profile & Comment
    const [{ data: profile }, { data: comment }] = await Promise.all([
      supabase.from('profiles').select('cosmetics').eq('id', userId).single(),
      supabase.from('comments').select('id, user_id, meme_id').eq('id', commentId).single()
    ]);

    if (!profile || !comment) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (comment.user_id !== userId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    // 2. Verify Mulligan Ownership for THIS meme
    const mulliganKey = 'consumable_edit_meme_id';
    const allowedMemeId = profile.cosmetics?.[mulliganKey];

    if (allowedMemeId !== comment.meme_id) {
      return NextResponse.json({ error: "You need to buy a Mulligan to edit this." }, { status: 403 });
    }

    // 3. Update Comment
    const cleanText = filterProfanity(content);
    const { error: updateError } = await supabase
      .from('comments')
      .update({ content: cleanText })
      .eq('id', commentId);

    if (updateError) throw updateError;

    // 4. CONSUME ITEM (Remove the permission)
    const newCosmetics = { ...profile.cosmetics };
    delete newCosmetics[mulliganKey];

    await supabase
      .from('profiles')
      .update({ cosmetics: newCosmetics })
      .eq('id', userId);

    return NextResponse.json({ success: true, content: cleanText });

  } catch (error) {
    console.error("Edit Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
