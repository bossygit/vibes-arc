/**
 * Sync psychology modules from localStorage to Supabase via coach-api.
 * Called on app load when authenticated so the Telegram coach can access this data.
 */

import SupabaseDatabaseClient from '@/database/supabase-client';

const MODULE_KEYS: Record<string, string> = {
  inner_child: 'vibes-arc-inner-child',
  priming: 'vibes-arc-priming-sessions',
  manifestation: 'vibes-arc-manifestation',
  focus_wheel: 'focusWheelGame',
  money_mindset: 'moneyMindsetGame',
  magic_gratitude: 'magicGratitudeChallenge',
  environment: 'vibes-arc-environments',
};

const SYNC_INTERVAL_MS = 30 * 60 * 1000; // 30 min
const LAST_SYNC_KEY = 'vibes-arc-psychology-last-sync';

function readModule(key: string): unknown | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function syncPsychologyModules(force = false): Promise<{ synced: string[] }> {
  const lastSync = localStorage.getItem(LAST_SYNC_KEY);
  if (!force && lastSync) {
    const elapsed = Date.now() - parseInt(lastSync, 10);
    if (elapsed < SYNC_INTERVAL_MS) {
      return { synced: [] };
    }
  }

  const db = SupabaseDatabaseClient.getInstance();
  const user = await db.getCurrentUser();
  if (!user) return { synced: [] };

  const sessionResult = await db.getSession();
  const token = sessionResult?.data?.session?.access_token;
  if (!token) return { synced: [] };

  const modules: Record<string, unknown> = {};
  for (const [moduleType, storageKey] of Object.entries(MODULE_KEYS)) {
    const data = readModule(storageKey);
    if (data !== null) {
      modules[moduleType] = data;
    }
  }

  if (Object.keys(modules).length === 0) {
    return { synced: [] };
  }

  try {
    const resp = await fetch('/api/psychology/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ modules }),
    });

    if (!resp.ok) {
      console.warn('Psychology sync failed:', await resp.text());
      return { synced: [] };
    }

    const result = await resp.json() as { synced?: string[] };
    localStorage.setItem(LAST_SYNC_KEY, String(Date.now()));
    return { synced: result.synced || [] };
  } catch (err) {
    console.warn('Psychology sync error:', err);
    return { synced: [] };
  }
}

export function schedulePsychologySync(): void {
  syncPsychologyModules().catch(() => {});
  window.addEventListener('beforeunload', () => {
    syncPsychologyModules(true).catch(() => {});
  });
}
