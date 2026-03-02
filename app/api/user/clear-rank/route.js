// app/api/user/clear-rank/route.js
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { userId, type } = await req.json();

    if (type === 'monthly') {
        const { data: profile } = await supabase.from('profiles').select('cosmetics').eq('id', userId).single();
        if (profile) {
            const cosmetics = { ...(profile.cosmetics || {}) };
            delete cosmetics.monthly_rank;
            delete cosmetics.monthly_reward;
            await supabase.from('profiles').update({ cosmetics }).eq('id', userId);
        }
    } else {
        const { error } = await supabase
          .from('profiles')
          .update({ daily_rank: null })
          .eq('id', userId);

        if (error) throw error;
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
