// [!code_block: app/api/store/purchase/route.js]
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Define the source of truth for items and costs on the server
const SERVER_ITEMS = {
    "effect_fire": { cost: 100, name: "Ring of Fire", type: "duration", durationMinutes: 60 }, // [!code ++]
    "badge_verified": { cost: 500, name: "Verified Badge", type: "cosmetic" },
    "border_gold": { cost: 1000, name: "Golden Aura", type: "cosmetic" },
    "prize_amazon_5": { cost: 2500, name: "$5 Amazon Card", type: "prize" },
    "prize_amazon_10": { cost: 5000, name: "$10 Amazon Card", type: "prize" }
};

export async function POST(req) {
  try {
    const { itemId } = await req.json();
    const item = SERVER_ITEMS[itemId];
    
    if (!item) {
        return NextResponse.json({ error: "Invalid Item" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Authentication (Robust fallback if cookies aren't forwarded)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(authHeader.split(' ')[1]);
    if (authError || !authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = authUser.id;

    // 2. Fetch Current Credits
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits, cosmetics')
      .eq('id', userId)
      .single();

    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    // 3. Validation
    if ((profile.credits || 0) < item.cost) {
        return NextResponse.json({ error: "Insufficient credits" }, { status: 400 });
    }

    // Check ownership for permanent/active items
    if (item.type === 'cosmetic' && profile.cosmetics?.[itemId]) {
        return NextResponse.json({ error: "Item already owned" }, { status: 400 });
    }
    
    // Check if duration effect is still active
    if (item.type === 'duration') {
       const expiresAt = profile.cosmetics?.[`${itemId}_expires`];
       if (expiresAt && new Date(expiresAt) > new Date()) {
           return NextResponse.json({ error: "Effect still active" }, { status: 400 });
       }
    }

    // 4. Execute Transaction
    const newCredits = profile.credits - item.cost;
    let updateData = { credits: newCredits };
    const currentCosmetics = profile.cosmetics || {};

    if (item.type === 'cosmetic') {
        updateData.cosmetics = { ...currentCosmetics, [itemId]: true };
    } 
    // [!code ++] Handle Duration Items
    else if (item.type === 'duration') {
        const expiresAt = new Date(Date.now() + (item.durationMinutes * 60 * 1000));
        updateData.cosmetics = { 
            ...currentCosmetics, 
            [`${itemId}_expires`]: expiresAt.toISOString() 
        };
    }

    const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

    if (updateError) throw updateError;

    // B. Log Purchase
    await supabase.from('purchases').insert({
        user_id: userId,
        item_id: itemId,
        item_name: item.name,
        cost: item.cost,
        status: item.type === 'prize' ? 'pending_fulfillment' : 'completed'
    });

    return NextResponse.json({ success: true, newCredits });

  } catch (error) {
    console.error("Purchase Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
