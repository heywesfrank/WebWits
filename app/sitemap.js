// app/sitemap.js
import { createClient } from '@supabase/supabase-js';

export default async function sitemap() {
  const baseUrl = 'https://itswebwits.com';
  
  // Get all dynamic pages (e.g., archive/shared memes)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  const { data: comments } = await supabase
    .from('comments')
    .select('id, updated_at')
    .limit(1000); // Adjust limit as needed

  const sharedRoutes = (comments || []).map((comment) => ({
    url: `${baseUrl}/share/${comment.id}`,
    lastModified: new Date(comment.updated_at),
  }));

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/how-it-works`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/prizes`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    ...sharedRoutes,
  ];
}
