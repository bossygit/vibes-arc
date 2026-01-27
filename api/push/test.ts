import type { VercelRequest, VercelResponse } from '@vercel/node';
import webpush from 'web-push';
import { requireUserFromBearer } from './_supabase';

function configureWebPush() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@vibes-arc.local';
  if (!publicKey || !privateKey) throw new Error('Missing VAPID keys');
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');
  try {
    configureWebPush();
    const { supabase, user } = await requireUserFromBearer(req.headers.authorization);
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', user.id)
      .limit(5);

    if (error) return res.status(500).send(error.message);
    if (!data || data.length === 0) return res.status(400).send('Aucune subscription trouvée.');

    const payload = JSON.stringify({
      title: 'Vibes Arc — test Web Push',
      body: 'Web Push actif: tu peux recevoir des rappels même app fermée (selon navigateur).',
      url: '/',
    });

    await Promise.all(
      data.map(async (row: any) => {
        try {
          await webpush.sendNotification(row.subscription as any, payload);
        } catch {
          // ignore
        }
      })
    );

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(500).send(e?.message || 'Error');
  }
}

