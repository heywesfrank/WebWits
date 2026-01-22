import { NextResponse } from 'next/server';
import { sendNotificationToAll } from '@/lib/sendPush';

export async function POST(req) {
  try {
    const { userId, content } = await req.json();
    
    // Send Notification to everyone EXCEPT the sender (userId)
    await sendNotificationToAll({
      title: "New Caption! 🗳️",
      body: `"${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
      url: "https://itswebwits.com"
    }, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notify Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
