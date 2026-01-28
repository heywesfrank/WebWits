// [!code_block: app/api/store/purchase/route.js]
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Define the source of truth for items and costs on the server
const SERVER_ITEMS = {
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

    // 1. Get User
    const { data: { user } } = await supabase.auth.getUser(); // Using getUser instead of getSession for server context
    // Note: Since we are using Service Role key for database ops, we need to extract user ID carefully.
    // However, typically you'd parse the auth cookie. 
    // For simplicity in this project structure, let's assume we pass auth header or use supabase.auth.getUser() if token is passed.
    // If getUser() fails (no token forwarded), we might need to rely on the client passing userId (INSECURE) or properly forwarding headers.
    // Standard Next.js+Supabase App Router pattern:
    
    // Simpler approach for this specific codebase style (checking previous files):
    // Previous files use createClient directly. We need to trust the session or rely on client-side RLS if not using Service Key.
    // Since we handle money/credits, we MUST use Service Key to prevent tampering, but we need the User ID.
    // We will assume the client is authenticated via Supabase Auth and we can get the user via getUser() if cookies are forwarded.
    
    // FALLBACK: To keep it working with the provided `lib/supabase` patterns which might not forward cookies in API routes easily:
    // We will attempt to get the user from the request cookies using a helper or standard method.
    // As a robust fallback for this snippet: We check the auth token from the request header.
    
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

    if (item.type === 'cosmetic' && profile.cosmetics?.[itemId]) {
        return NextResponse.json({ error: "Item already owned" }, { status: 400 });
    }

    // 4. Execute Transaction
    // A. Deduct Credits & Update Inventory
    const newCredits = profile.credits - item.cost;
    
    let updateData = { credits: newCredits };
    
    if (item.type === 'cosmetic') {
        const currentCosmetics = profile.cosmetics || {};
        updateData.cosmetics = { ...currentCosmetics, [itemId]: true };
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
