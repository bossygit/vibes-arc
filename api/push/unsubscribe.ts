import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireUserFromBearer } from './_supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');
  try {
    const { supabase, user } = await requireUserFromBearer(req.headers.authorization);
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const endpoint = body?.endpoint;
    if (!endpoint) return res.status(400).send('Missing endpoint');

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('endpoint', endpoint);

    if (error) return res.status(500).send(error.message);
    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(401).send(e?.message || 'Unauthorized');
  }
}

