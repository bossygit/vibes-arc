/**
 * POST /api/push/subscribe — auto-contenu (zéro import runtime local).
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

function getEnv(): { url: string; key: string } {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return { url, key };
}

async function requireUserId(authHeader?: string | null): Promise<string> {
  const token = (authHeader || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) throw new Error('Missing bearer token');
  const { url, key } = getEnv();
  const r = await fetch(url + '/auth/v1/user', {
    headers: { apikey: key, Authorization: 'Bearer ' + token },
  });
  if (!r.ok) throw new Error('Invalid token');
  const user = (await r.json()) as { id?: string };
  if (!user?.id) throw new Error('Invalid token');
  return user.id;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');
  try {
    const userId = await requireUserId(req.headers.authorization);
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const subscription = body?.subscription;
    if (!subscription?.endpoint) return res.status(400).send('Missing subscription endpoint in request body');

    const keys = subscription.keys || {};
    const payload = {
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh: keys.p256dh ?? null,
      auth: keys.auth ?? null,
      subscription: subscription,
      user_agent: req.headers['user-agent'] ?? null,
      updated_at: new Date().toISOString(),
    };

    const { url, key } = getEnv();
    const r = await fetch(url + '/rest/v1/push_subscriptions', {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: 'Bearer ' + key,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Prefer: 'resolution=merge-duplicates,on_conflict=user_id,endpoint,return=minimal',
      },
      body: JSON.stringify(payload),
    });

    if (!r.ok) return res.status(500).send(`Supabase: ${await r.text()}`);
    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(401).send(`Auth: ${e?.message || 'Unauthorized'}`);
  }
}
