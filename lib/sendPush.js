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

  if (subs) {
    subs.forEach(sub => {
      webPush.sendNotification(sub.subscription, JSON.stringify(payload))
        .catch(err => console.error("Push error", err));
    });
  }
}

export async function sendNotificationToAll(payload) {
    const { data: subs } = await supabase.from('push_subscriptions').select('subscription');
    if (subs) {
        subs.forEach(sub => {
            webPush.sendNotification(sub.subscription, JSON.stringify(payload))
            .catch(err => console.error("Push error", err));
        });
    }
}
