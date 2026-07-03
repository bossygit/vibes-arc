/**
 * POST /api/widgets/link-device
 *
 * Auto-contenu (zéro import runtime local) — même contrainte Vercel que v2/check.
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let deviceId: string | undefined;
  try {
    deviceId = (req.body?.deviceId ?? '').trim();
  } catch {
    if (typeof req.body === 'string') {
      try {
        const parsed = JSON.parse(req.body);
        deviceId = (parsed.deviceId ?? '').trim();
      } catch {
        deviceId = undefined;
      }
    }
  }

  if (!deviceId) {
    return res.status(400).json({ error: 'Missing deviceId in body' });
  }

  try {
    const userId = await requireUserId(req.headers.authorization);
    const { url, key } = getEnv();

    // Upsert merge sur device_id (évite course avec /api/widgets/v2).
    const r = await fetch(url + '/rest/v1/device_widgets', {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: 'Bearer ' + key,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Prefer: 'resolution=merge-duplicates,on_conflict=device_id,return=minimal',
      },
      body: JSON.stringify({
        device_id: deviceId,
        user_id: userId,
        updated_at: new Date().toISOString(),
      }),
    });

    if (!r.ok) {
      return res.status(500).json({
        error: 'Failed to link device',
        detail: await r.text(),
      });
    }

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(401).json({ error: e?.message || 'Unauthorized' });
  }
}
