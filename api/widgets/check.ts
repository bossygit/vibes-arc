/**
 * POST /api/widgets/check
 *
 * Coche ou décoche une habitude pour aujourd'hui depuis l'app iOS native.
 * Authentification : deviceId (App Group partagé widget ↔ app).
 *
 * Body JSON :
 *   { "deviceId": string, "habitId": number, "completed": boolean }
 *
 * Retour :
 *   { "ok": true, "completed": boolean, "dayIndex": number }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const START_DATE = new Date(Date.UTC(2025, 9, 1)); // 1er octobre 2025 UTC

function todayDayIndex(): number {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return Math.floor((today.getTime() - START_DATE.getTime()) / 86_400_000);
}

function sbHeaders() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return {
    url,
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Prefer: 'return=minimal',
    },
  };
}

async function sbGet<T = unknown>(
  url: string,
  headers: Record<string, string>
): Promise<{ data: T | null; error: string | null }> {
  try {
    const r = await fetch(url, { headers });
    if (!r.ok) return { data: null, error: await r.text() };
    return { data: (await r.json()) as T, error: null };
  } catch (e) {
    return { data: null, error: String(e) };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(503).json({ error: 'Supabase env vars not configured' });
  }

  // Parse body
  let body: { deviceId?: string; habitId?: number; completed?: boolean };
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {};
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const { deviceId, habitId, completed } = body;

  if (!deviceId || typeof deviceId !== 'string') {
    return res.status(400).json({ error: 'Missing deviceId' });
  }
  if (typeof habitId !== 'number') {
    return res.status(400).json({ error: 'Missing habitId (number)' });
  }
  if (typeof completed !== 'boolean') {
    return res.status(400).json({ error: 'Missing completed (boolean)' });
  }

  const { url, headers } = sbHeaders();

  // 1. Résoudre deviceId → userId
  const { data: devRows, error: devErr } = await sbGet<{ user_id: string }[]>(
    `${url}/rest/v1/device_widgets?select=user_id&device_id=eq.${encodeURIComponent(deviceId)}`,
    headers
  );
  if (devErr || !devRows?.length || !devRows[0].user_id) {
    return res.status(403).json({ error: 'Device not linked to any account' });
  }
  const userId = devRows[0].user_id;

  // 2. Vérifier que l'habitude appartient bien à cet utilisateur
  const { data: habitRows, error: habitErr } = await sbGet<{ id: number }[]>(
    `${url}/rest/v1/habits?select=id&id=eq.${habitId}&user_id=eq.${userId}`,
    headers
  );
  if (habitErr || !habitRows?.length) {
    return res.status(403).json({ error: 'Habit not found or not owned by this device' });
  }

  const dayIndex = todayDayIndex();
  const now = new Date().toISOString();

  // 3. Upsert dans habit_progress
  // On cherche d'abord si une ligne existe pour (habit_id, day_index)
  const { data: existing, error: existErr } = await sbGet<{ id: number }[]>(
    `${url}/rest/v1/habit_progress?select=id&habit_id=eq.${habitId}&day_index=eq.${dayIndex}`,
    headers
  );

  if (existErr) {
    return res.status(500).json({ error: 'Failed to query habit_progress', detail: existErr });
  }

  let writeError: string | null = null;

  if (existing && existing.length > 0) {
    // UPDATE
    const rowId = existing[0].id;
    const r = await fetch(
      `${url}/rest/v1/habit_progress?id=eq.${rowId}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          completed,
          completed_at: completed ? now : null,
          updated_at: now,
        }),
      }
    );
    if (!r.ok) writeError = await r.text();
  } else {
    // INSERT
    const r = await fetch(`${url}/rest/v1/habit_progress`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        habit_id: habitId,
        day_index: dayIndex,
        completed,
        completed_at: completed ? now : null,
        created_at: now,
        updated_at: now,
      }),
    });
    if (!r.ok) writeError = await r.text();
  }

  if (writeError) {
    return res.status(500).json({ error: 'Failed to update habit_progress', detail: writeError });
  }

  return res.status(200).json({ ok: true, completed, dayIndex });
}
