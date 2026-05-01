// app/api/reply/edit/route.js
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { filterProfanity } from '@/lib/profanity';
import { isEnglishText } from '@/lib/languageFilter';

export async function POST(req) {
  try {
    const { replyId, content, userId } = await req.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Fetch Reply & verify ownership
    const { data: reply } = await supabase
      .from('replies')
      .select('id, user_id')
      .eq('id', replyId)
      .single();

    if (!reply) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (reply.user_id !== userId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    // 2. Language check - English only
    if (!isEnglishText(content)) {
      return NextResponse.json({ error: "English only! Non-English text is not allowed." }, { status: 400 });
    }

    // 3. Update Reply
    const cleanText = filterProfanity(content);
    const { error: updateError } = await supabase
      .from('replies')
      .update({ content: cleanText })
      .eq('id', replyId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, content: cleanText });

  } catch (error) {
    console.error("Reply Edit Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
