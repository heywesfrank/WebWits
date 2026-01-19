// app/page.js
import { createClient } from '@supabase/supabase-js';
import MainApp from "@/components/MainApp";

// 1. Force dynamic rendering so the meme updates daily without rebuilding
export const dynamic = 'force-dynamic';

export default async function Home() {
  // 2. Fetch data on the server
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for server-side read access
  );

  // Parallel data fetching for speed
  const [memeRes, leadersRes] = await Promise.all([
    supabase.from("memes").select("*").eq("status", "active").single(),
    supabase.from("profiles").select("username, monthly_points").order("monthly_points", { ascending: false }).limit(5)
  ]);

  const activeMeme = memeRes.data;
  const initialLeaderboard = leadersRes.data || [];

  // 3. Pass this "pre-fetched" data to your Client Component
  return (
    <MainApp 
      initialMeme={activeMeme} 
      initialLeaderboard={initialLeaderboard} 
    />
  );
}
