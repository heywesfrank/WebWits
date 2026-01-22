import webPush from 'web-push';
import { createClient } from '@supabase/supabase-js';

// Setup Supabase with Service Role for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

webPush.setVapidDetails(
  process.env.NEXT_PUBLIC_VAPID_SUBJECT,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export async function sendNotificationToUser(userId, payload) {
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('subscription')
    .eq('user_id', userId);

  if (subs && subs.length > 0) {
    const notifications = subs.map(sub => 
      webPush.sendNotification(sub.subscription, JSON.stringify(payload))
        .catch(err => {
          console.error("Push error for sub:", err);
        })
    );

    await Promise.all(notifications);
  }
}

// Updated to accept excludeUserId
export async function sendNotificationToAll(payload, excludeUserId = null) {
    let query = supabase.from('push_subscriptions').select('user_id, subscription');
    
    // If an ID is provided, filter them out so they don't get their own notification
    if (excludeUserId) {
        query = query.neq('user_id', excludeUserId);
    }

    const { data: subs } = await query;
    
    if (subs && subs.length > 0) {
        const notifications = subs.map(sub => 
            webPush.sendNotification(sub.subscription, JSON.stringify(payload))
            .catch(err => console.error("Push error", err))
        );
        await Promise.all(notifications);
    }
}
