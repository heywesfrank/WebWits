// app/api/reminder/route.js
import { NextResponse } from 'next/server';
import { sendNotificationToAll } from '@/lib/sendPush';

// Prevent Next.js from caching this route
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // Feature #3: The "Last Call" (Now at 9 PM EST)
    await sendNotificationToAll({
      title: "⏰ The Arena is Closing...",
      body: "The contest is almost done. Hop in to battle before the clock strikes midnight!",
      url: "https://itswebwits.com"
    });

    return NextResponse.json({ success: true, message: "Reminder sent" });
  } catch (error) {
    console.error("Reminder Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
