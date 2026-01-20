import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendNotificationToUser } from '@/lib/sendPush';

export async function POST(req) {
  try {
    const { commentId, userId } = await req.json();
    
    // Use Service Role to allow sending notifications and unrestricted access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Perform the Vote (Toggle)
    // We assume the RPC 'toggle_vote' exists as per your original hook
    const { error: voteError } = await supabase.rpc('toggle_vote', { 
      vote_comment_id: commentId, 
      vote_user_id: userId 
    });

    if (voteError) throw voteError;

    // 2. Fetch the updated comment to check vote count
    const { data: comment, error: fetchError } = await supabase
      .from('comments')
      .select('id, content, vote_count, user_id')
      .eq('id', commentId)
      .single();

    if (fetchError) throw fetchError;

    // 3. Check for Milestones (1, 5, 10, 25, 50)
    // Note: To strictly prevent duplicate alerts (e.g. going 5->4->5), 
    // you would ideally add a 'last_milestone' column to your comments table.
    // This implementation simply checks the current count.
    const milestones = [1, 5, 10, 25, 50]; // [!code change]
    
    if (milestones.includes(comment.vote_count)) {
      // Don't notify if the voter is the author (self-vote)
      if (comment.user_id !== userId) {
        
        // [!code block: Determines message based on count]
        let title = "🔥 You're on fire!";
        let body = `Your caption just hit ${comment.vote_count} votes! "${comment.content.substring(0, 20)}..."`;

        if (comment.vote_count === 1) {
            title = "🚀 First Vote!";
            body = `You just got your first vote! The battle has begun. "${comment.content.substring(0, 20)}..."`;
        }
        // [!code block end]

        await sendNotificationToUser(comment.user_id, {
          title: title, // [!code change]
          body: body,   // [!code change]
          url: "https://itswebwits.com"
        });
      }
    }

    return NextResponse.json({ success: true, new_count: comment.vote_count });

  } catch (error) {
    console.error("Vote API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
