import type { VercelRequest, VercelResponse } from '@vercel/node';

const COACH_API_URL = process.env.VIBES_ARC_COACH_API_URL
  || process.env.COACH_API_URL
  || 'https://knpvbwlfdriavrebvzdy.supabase.co/functions/v1/coach-api';
const COACH_API_KEY = process.env.COACH_API_KEY || process.env.VIBES_ARC_API_KEY || '';

const VALID_MODULES = [
  'inner_child', 'priming', 'manifestation', 'focus_wheel',
  'money_mindset', 'magic_gratitude', 'environment',
] as const;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization' });
  }

  const token = authHeader.slice(7);
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnon = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnon) {
    return res.status(503).json({ error: 'Supabase not configured' });
  }

  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: supabaseAnon,
    },
  });
  if (!userRes.ok) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  const user = await userRes.json() as { id?: string };
  if (!user.id) {
    return res.status(401).json({ error: 'User not found' });
  }

  if (!COACH_API_KEY) {
    return res.status(503).json({ error: 'Coach API key not configured' });
  }

  const body = req.body as { modules?: Record<string, unknown> };
  const modules = body?.modules || {};
  const synced: string[] = [];
  const errors: string[] = [];

  for (const [moduleType, data] of Object.entries(modules)) {
    if (!VALID_MODULES.includes(moduleType as typeof VALID_MODULES[number])) {
      errors.push(`Invalid module: ${moduleType}`);
      continue;
    }
    try {
      const resp = await fetch(
        `${COACH_API_URL}/psychology?user_id=${encodeURIComponent(user.id)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': COACH_API_KEY,
          },
          body: JSON.stringify({ module_type: moduleType, data }),
        },
      );
      if (resp.ok) {
        synced.push(moduleType);
      } else {
        const err = await resp.text();
        errors.push(`${moduleType}: ${err.slice(0, 100)}`);
      }
    } catch (e) {
      errors.push(`${moduleType}: ${(e as Error).message}`);
    }
  }

  return res.status(200).json({
    success: errors.length === 0,
    synced,
    errors: errors.length ? errors : undefined,
  });
}
