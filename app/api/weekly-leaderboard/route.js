import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendNotificationToUser } from '@/lib/sendPush';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Fetch Top 10 Monthly Users
    const { data: leaders } = await supabase
      .from('profiles')
      .select('id, username, monthly_points')
      .order('monthly_points', { ascending: false })
      .limit(10);

    if (leaders && leaders.length > 0) {
      const notifications = leaders.map((user, index) => {
        const rank = index + 1;
        let bodyMsg = `You are #${rank} on the monthly leaderboard. Keep it up!`;
        
        if (rank <= 3) bodyMsg = `You are #${rank} on the leaderboard! 👑 Defend your throne!`;
        else if (rank <= 10) bodyMsg = `You are #${rank}! You're in the strike zone for a prize.`;

        return sendNotificationToUser(user.id, {
          title: "💰 Prize Alert",
          body: bodyMsg,
          url: "https://itswebwits.com"
        });
      });

      await Promise.all(notifications);
    }

    return NextResponse.json({ success: true, notified_count: leaders?.length || 0 });

  } catch (error) {
    console.error("Weekly Leaderboard Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
