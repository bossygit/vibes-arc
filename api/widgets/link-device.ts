import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServiceSupabase, requireUserFromBearer } from './_supabase-client';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let deviceId: string | undefined;
  try {
    deviceId = (req.body?.deviceId ?? '').trim();
  } catch {
    // body peut ne pas être déjà parsé
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
    const { user } = await requireUserFromBearer(req.headers.authorization);
    const userId = user.id;

    // requireUserFromBearer valide le JWT puis utilise déjà getServiceSupabase() (service role, pas RLS utilisateur).
    const svc = getServiceSupabase();

    // Un seul upsert (merge sur device_id) : évite course read→insert vs ligne déjà créée par /api/widgets/v2,
    // et simplifie le flux si RLS / visibilité diffère entre SELECT et PATCH selon la clé utilisée sur Vercel.
    const linkResult = await svc
      .from('device_widgets')
      .upsert(
        {
          device_id: deviceId,
          user_id: userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'device_id' }
      );

    if (linkResult.error) {
      return res.status(500).json({
        error: 'Failed to link device',
        detail: linkResult.error.message,
      });
    }

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(401).json({ error: e?.message || 'Unauthorized' });
  }
}

