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
    // [!code warning] OLD CODE (Does not wait):
    // subs.forEach(sub => {
    //   webPush.sendNotification(...)
    // });

    // [!code success] NEW CODE (Waits for all sends to finish):
    const notifications = subs.map(sub => 
      webPush.sendNotification(sub.subscription, JSON.stringify(payload))
        .catch(err => {
          console.error("Push error for sub:", err);
          // Optional: You could delete invalid subscriptions here if err.statusCode === 410
        })
    );

    await Promise.all(notifications);
  }
}

// Do the same for sendNotificationToAll if you use it:
export async function sendNotificationToAll(payload) {
    const { data: subs } = await supabase.from('push_subscriptions').select('subscription');
    
    if (subs && subs.length > 0) {
        const notifications = subs.map(sub => 
            webPush.sendNotification(sub.subscription, JSON.stringify(payload))
            .catch(err => console.error("Push error", err))
        );
        await Promise.all(notifications);
    }
}
