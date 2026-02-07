// app/api/daily-spin/route.js
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { userId } = await req.json();
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Get current profile to check date
    const { data: profile } = await supabase
      .from('profiles')
      .select('last_spin_date, credits')
      .eq('id', userId)
      .single();

    if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // FIX: Force EST/New York Timezone. 
    // 'en-CA' locale ensures YYYY-MM-DD format matches the DB.
    const today = new Date().toLocaleDateString('en-CA', { 
      timeZone: 'America/New_York' 
    });

    // 2. Check if already spun today
    if (profile.last_spin_date === today) {
      return NextResponse.json({ success: false, message: "Already spun today" });
    }

    const rand = Math.random() * 100;
    let prizeAmount = 0;

    if (rand < 65) prizeAmount = 50;        
    else if (rand < 81) prizeAmount = 100;  
    else if (rand < 91) prizeAmount = 200;  
    else if (rand < 96) prizeAmount = 300;  
    else if (rand < 99) prizeAmount = 400; 
    else prizeAmount = 500;                

    // 4. Update Profile
    const newCredits = (profile.credits || 0) + prizeAmount;
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        credits: newCredits,
        last_spin_date: today
      })
      .eq('id', userId);

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      prize: prizeAmount, 
      newTotal: newCredits 
    });

  } catch (error) {
    console.error("Spin Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
