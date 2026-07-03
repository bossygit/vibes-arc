/**
 * POST /api/push/test — auto-contenu (zéro import runtime local hors npm).
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import webpush from 'web-push';

function getEnv(): { url: string; key: string } {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return { url, key };
}

function configureWebPush() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@vibes-arc.local';
  if (!publicKey || !privateKey) throw new Error('Missing VAPID keys');
  webpush.setVapidDetails(subject, publicKey, privateKey);
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
    configureWebPush();
    const userId = await requireUserId(req.headers.authorization);
    const { url, key } = getEnv();
    const qs =
      'select=' + encodeURIComponent('subscription') +
      '&user_id=eq.' + encodeURIComponent(userId) +
      '&limit=5';
    const r = await fetch(url + '/rest/v1/push_subscriptions?' + qs, {
      headers: {
        apikey: key,
        Authorization: 'Bearer ' + key,
        Accept: 'application/json',
      },
    });
    if (!r.ok) return res.status(500).send(await r.text());
    const data = (await r.json()) as { subscription: unknown }[];
    if (!data || data.length === 0) return res.status(400).send('Aucune subscription trouvée.');

    const payload = JSON.stringify({
      title: 'Vibes Arc — test Web Push',
      body: 'Web Push actif: tu peux recevoir des rappels même app fermée (selon navigateur).',
      url: '/',
    });

    await Promise.all(
      data.map(async (row) => {
        try {
          await webpush.sendNotification(row.subscription as any, payload);
        } catch {
          // ignore
        }
      }),
    );

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(500).send(e?.message || 'Error');
  }
}
