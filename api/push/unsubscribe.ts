/**
 * POST /api/push/unsubscribe — auto-contenu (zéro import runtime local).
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
    const endpoint = body?.endpoint;
    if (!endpoint) return res.status(400).send('Missing endpoint');

    const { url, key } = getEnv();
    const qs =
      'user_id=eq.' + encodeURIComponent(userId) +
      '&endpoint=eq.' + encodeURIComponent(endpoint);
    const r = await fetch(url + '/rest/v1/push_subscriptions?' + qs, {
      method: 'DELETE',
      headers: {
        apikey: key,
        Authorization: 'Bearer ' + key,
        Prefer: 'return=minimal',
      },
    });

    if (!r.ok) return res.status(500).send(await r.text());
    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(401).send(e?.message || 'Unauthorized');
  }
}
