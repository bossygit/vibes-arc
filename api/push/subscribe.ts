import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireUserFromBearer } from './_supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');
  try {
    const { supabase, user } = await requireUserFromBearer(req.headers.authorization);
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const subscription = body?.subscription;
    if (!subscription?.endpoint) return res.status(400).send('Missing subscription');

    const keys = subscription.keys || {};
    const payload = {
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: keys.p256dh ?? null,
      auth: keys.auth ?? null,
      subscription: subscription,
      user_agent: req.headers['user-agent'] ?? null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(payload, { onConflict: 'user_id,endpoint' });

    if (error) return res.status(500).send(error.message);
    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(401).send(e?.message || 'Unauthorized');
  }
}

