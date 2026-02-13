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

    // --- NEW CHECKS: VALIDATION ---

    // 1. Fetch the target comment first to check ownership and meme context
    const { data: targetComment, error: commentError } = await supabase
      .from('comments')
      .select('id, user_id, meme_id')
      .eq('id', commentId)
      .single();

    if (commentError || !targetComment) {
       return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // 2. CHECK: No Self-Voting
    if (targetComment.user_id === userId) {
       return NextResponse.json({ error: "You cannot vote for your own caption." }, { status: 403 });
    }

    // 3. CHECK: One Like Per Day (Per Meme Battle)
    // We check if the user has voted on *any* comment associated with this meme.
    
    // A. Get all comment IDs belonging to this meme
    const { data: memeComments } = await supabase
        .from('comments')
        .select('id')
        .eq('meme_id', targetComment.meme_id);
    
    if (memeComments && memeComments.length > 0) {
        const commentIds = memeComments.map(c => c.id);

        // B. Check if the user has a vote record for any of these comments
        const { data: existingVotes } = await supabase
            .from('comment_votes')
            .select('comment_id')
            .eq('user_id', userId)
            .in('comment_id', commentIds);

        if (existingVotes && existingVotes.length > 0) {
            // STRICT PERMANENCE: If they voted at all, block it.
            // This prevents unvoting (same ID) and changing votes (different ID).
            return NextResponse.json({ error: "Votes are permanent. No take-backs." }, { status: 403 });
        }
    }
    // --- END NEW CHECKS ---

    // 4. Perform the Vote (Toggle)
    // We assume the RPC 'toggle_vote' exists as per your original hook
    const { error: voteError } = await supabase.rpc('toggle_vote', { 
      vote_comment_id: commentId, 
      vote_user_id: userId 
    });

    if (voteError) throw voteError;

    // 5. Fetch the updated comment to check vote count
    const { data: comment, error: fetchError } = await supabase
      .from('comments')
      .select('id, content, vote_count, user_id')
      .eq('id', commentId)
      .single();

    if (fetchError) throw fetchError;

    // 6. Check for Milestones (1, 5, 10, 25, 50)
    // Note: To strictly prevent duplicate alerts (e.g. going 5->4->5), 
    // you would ideally add a 'last_milestone' column to your comments table.
    // This implementation simply checks the current count.
    const milestones = [1, 5, 10, 25, 50]; 
    
    if (milestones.includes(comment.vote_count)) {
      // Don't notify if the voter is the author (self-vote) - redundant now due to check #2 but safe to keep
      if (comment.user_id !== userId) {
        
        let title = "🔥 You're on fire!";
        let body = `Your caption just hit ${comment.vote_count} votes! "${comment.content.substring(0, 20)}..."`;

        if (comment.vote_count === 1) {
            title = "🚀 First Vote!";
            body = `You just got your first vote! The battle has begun. "${comment.content.substring(0, 20)}..."`;
        }

        await sendNotificationToUser(comment.user_id, {
          title: title, 
          body: body,   
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
