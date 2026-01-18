import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendNotificationToUser } from '@/lib/sendPush';

export async function POST(req) {
  const { commentId, content, userId } = await req.json();
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  // 1. Insert Reply
  const { data: reply, error } = await supabase
    .from('replies')
    .insert({ comment_id: commentId, user_id: userId, content })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 2. Get Owner of the original comment
  const { data: comment } = await supabase
    .from('comments')
    .select('user_id, content')
    .eq('id', commentId)
    .single();

  // 3. Send Notification (if not replying to self)
  if (comment && comment.user_id !== userId) {
      await sendNotificationToUser(comment.user_id, {
          title: "New Reply! ↩️",
          body: `Someone replied to your caption: "${comment.content.substring(0, 20)}..."`,
          url: "https://itswebwits.com"
      });
  }

  return NextResponse.json({ success: true });
}
