// app/api/store/purchase/route.js
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Define server items
const SERVER_ITEMS = {
    "effect_fire": { cost: 100, name: "Ring of Fire", type: "meme_bound" },
    "badge_verified": { cost: 500, name: "Verified Badge", type: "cosmetic" },
    "border_gold": { cost: 1000, name: "Golden Aura", type: "cosmetic" },
    "consumable_edit": { cost: 150, name: "The Mulligan", type: "consumable" }, // [!code ++]
    "prize_amazon_5": { cost: 2500, name: "$5 Amazon Card", type: "prize" },
    "prize_amazon_10": { cost: 5000, name: "$10 Amazon Card", type: "prize" }
};

export async function POST(req) {
  try {
    const { itemId } = await req.json();
    const item = SERVER_ITEMS[itemId];
    
    if (!item) return NextResponse.json({ error: "Invalid Item" }, { status: 400 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(authHeader.split(' ')[1]);
    if (authError || !authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = authUser.id;

    // Fetch Profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits, cosmetics')
      .eq('id', userId)
      .single();

    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    if ((profile.credits || 0) < item.cost) return NextResponse.json({ error: "Insufficient credits" }, { status: 400 });

    // Transaction Data
    const newCredits = profile.credits - item.cost;
    let updateData = { credits: newCredits };
    const currentCosmetics = profile.cosmetics || {};

    if (item.type === 'meme_bound') {
        const { data: activeMeme } = await supabase
            .from('memes')
            .select('id')
            .eq('status', 'active')
            .single();
            
        if (!activeMeme) return NextResponse.json({ error: "No active battle to ignite." }, { status: 400 });

        updateData.cosmetics = { 
            ...currentCosmetics, 
            [`${itemId}_meme_id`]: activeMeme.id 
        };
    } 
    // [!code block: Logic for Consumables (Mulligan)]
    else if (item.type === 'consumable') {
        if (itemId === 'consumable_edit') {
             const { data: activeMeme } = await supabase
                .from('memes')
                .select('id')
                .eq('status', 'active')
                .single();
                
             if (!activeMeme) return NextResponse.json({ error: "No active battle." }, { status: 400 });
             
             // Check if they already have an unused mulligan for this meme
             if (currentCosmetics[`${itemId}_meme_id`] === activeMeme.id) {
                return NextResponse.json({ error: "You already have a pending edit." }, { status: 400 });
             }

             // Grant permission for this specific meme
             updateData.cosmetics = { 
                ...currentCosmetics, 
                [`${itemId}_meme_id`]: activeMeme.id 
             };
        }
    }
    // [!code block end]
    else if (item.type === 'cosmetic') {
        if (currentCosmetics[itemId]) return NextResponse.json({ error: "Item already owned" }, { status: 400 });
        updateData.cosmetics = { ...currentCosmetics, [itemId]: true };
    }

    // Execute Update
    const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

    if (updateError) throw updateError;

    // Log Purchase
    await supabase.from('purchases').insert({
        user_id: userId,
        item_id: itemId,
        item_name: item.name,
        cost: item.cost,
        status: 'completed'
    });

    return NextResponse.json({ success: true, newCredits });

  } catch (error) {
    console.error("Purchase Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
