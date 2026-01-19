import { NextResponse } from 'next/server';
import { sendNotificationToAll } from '@/lib/sendPush';

// Prevent Next.js from caching this route
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // Feature #3: The "Last Call"
    await sendNotificationToAll({
      title: "⏳ 1 Hour Left!",
      body: "The daily battle ends soon. Vote or submit your caption now!",
      url: "https://itswebwits.com"
    });

    return NextResponse.json({ success: true, message: "Reminder sent" });
  } catch (error) {
    console.error("Reminder Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
