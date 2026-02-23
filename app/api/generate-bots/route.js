// app/api/generate-bots/route.js
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Prevent Next.js from caching this route
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Get the current active meme
    const { data: activeMeme, error: memeError } = await supabase
      .from('memes')
      .select('id, image_url')
      .eq('status', 'active')
      .maybeSingle();

    if (memeError || !activeMeme) {
      return NextResponse.json({ success: false, message: "No active meme found." });
    }

    // 15 Bot UUIDs
    const botIds = [
        "10000000-0000-0000-0000-000000000001", "10000000-0000-0000-0000-000000000002",
        "10000000-0000-0000-0000-000000000003", "10000000-0000-0000-0000-000000000004",
        "10000000-0000-0000-0000-000000000005", "10000000-0000-0000-0000-000000000006",
        "10000000-0000-0000-0000-000000000007", "10000000-0000-0000-0000-000000000008",
        "10000000-0000-0000-0000-000000000009", "10000000-0000-0000-0000-000000000010",
        "10000000-0000-0000-0000-000000000011", "10000000-0000-0000-0000-000000000012",
        "10000000-0000-0000-0000-000000000013", "10000000-0000-0000-0000-000000000014",
        "10000000-0000-0000-0000-000000000015"
    ];

    // 2. Idempotency Check: Did the bots already comment on this meme?
    const { data: existingComments } = await supabase
      .from('comments')
      .select('id')
      .eq('meme_id', activeMeme.id)
      .in('user_id', botIds)
      .limit(1);

    if (existingComments && existingComments.length > 0) {
        return NextResponse.json({ success: true, message: "Bots have already commented on today's meme. Skipping." });
    }

    // 3. Generate Comments with OpenAI (using the gpt-5-nano response model)
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const aiResponse = await openai.responses.create({
        model: "gpt-5-nano",
        input: [
            {
                role: "user",
                content: [
                    {
                        type: "input_text",
                        text: "You are playing a witty internet meme caption game. Look at this image and generate 15 hilarious, highly original, and punchy captions for it. Return ONLY a valid JSON array of exactly 15 strings. Do not include markdown formatting like ```json."
                    },
                    {
                        type: "input_image",
                        image_url: activeMeme.image_url
                    }
                ]
            }
        ]
    });

    let rawText = aiResponse.output_text.trim();
    if (rawText.startsWith('```json')) {
        rawText = rawText.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (rawText.startsWith('```')) {
        rawText = rawText.replace(/^```/, '').replace(/```$/, '').trim();
    }

    const aiCaptions = JSON.parse(rawText);

    // 4. Insert into Database
    const commentsToInsert = aiCaptions.slice(0, 15).map((caption, idx) => ({
        meme_id: activeMeme.id,
        user_id: botIds[idx],
        content: caption,
        vote_count: Math.floor(Math.random() * 4) // Give bots a randomized head start
    }));

    // NOTE: We insert directly into Supabase here. 
    // We intentionally DO NOT call `/api/notify-comment` so that real users 
    // aren't spammed with 15 push notifications at 5:05 AM.
    const { error: insertError } = await supabase.from('comments').insert(commentsToInsert);
    if (insertError) throw insertError;

    return NextResponse.json({ success: true, message: "15 bot comments deployed silently." });

  } catch (error) {
    console.error("Bot Generation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
