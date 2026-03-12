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
    const { supabase, user } = await requireUserFromBearer(req.headers.authorization);
    const userId = user.id;

    // Lier / mettre à jour le device
    const svc = supabase ?? getServiceSupabase();

    const { data: existing, error: readError } = await svc
      .from('device_widgets')
      .select('device_id')
      .eq('device_id', deviceId)
      .maybeSingle();

    if (readError) {
      return res.status(500).json({ error: 'Failed to read device mapping' });
    }

    if (existing) {
      const { error: updateError } = await svc
        .from('device_widgets')
        .update({ user_id: userId })
        .eq('device_id', deviceId);
      if (updateError) {
        return res.status(500).json({ error: 'Failed to update device mapping' });
      }
    } else {
      const { error: insertError } = await svc
        .from('device_widgets')
        .insert({ device_id: deviceId, user_id: userId });
      if (insertError) {
        return res.status(500).json({ error: 'Failed to create device mapping' });
      }
    }

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(401).json({ error: e?.message || 'Unauthorized' });
  }
}

