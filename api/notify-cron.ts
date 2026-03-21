/**
 * /api/notify-cron
 *
 * Route appelée par le cron Vercel (vercel.json) chaque jour à 19h00 UTC
 * (= 20h00 heure de Brazzaville, WAT = UTC+1).
 *
 * Elle interroge user_prefs pour trouver tous les utilisateurs dont
 * l'heure de notification correspond à l'heure locale courante,
 * puis appelle la Edge Function Supabase `send-notifications` pour chacun.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const CRON_SECRET = process.env.CRON_SECRET;

// Heure locale actuelle (0-23) dans un fuseau donné
function getLocalHour(timeZone: string): number {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      hour12: false,
    });
    return Number(fmt.format(new Date()));
  } catch {
    return new Date().getUTCHours();
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Sécuriser avec CRON_SECRET (Vercel l'envoie automatiquement pour les crons)
  if (CRON_SECRET) {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Missing Supabase env vars' });
  }

  try {
    // 1. Récupérer tous les utilisateurs avec notifications activées
    const prefsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/user_prefs?notif_enabled=eq.true&notif_channel=neq.none&select=user_id,notif_hour,notif_timezone,notif_channel`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          Accept: 'application/json',
        },
      }
    );

    if (!prefsRes.ok) {
      const err = await prefsRes.text();
      return res.status(500).json({ error: `Supabase query failed: ${err}` });
    }

    const users: Array<{
      user_id: string;
      notif_hour: number;
      notif_timezone: string;
      notif_channel: string;
    }> = await prefsRes.json();

    if (!users || users.length === 0) {
      return res.status(200).json({ ok: true, sent: 0, message: 'No users with notifications enabled' });
    }

    // 2. Filtrer les utilisateurs dont c'est l'heure de notification
    const usersToNotify = users.filter((u) => {
      const localHour = getLocalHour(u.notif_timezone || 'Africa/Brazzaville');
      return localHour === (u.notif_hour ?? 20);
    });

    if (usersToNotify.length === 0) {
      return res.status(200).json({
        ok: true,
        sent: 0,
        message: `No users to notify at this hour. Checked ${users.length} users.`,
      });
    }

    // 3. Appeler send-notifications pour chaque utilisateur
    const results: Array<{ userId: string; status: string; reason?: string }> = [];

    for (const user of usersToNotify) {
      try {
        const notifRes = await fetch(
          `${SUPABASE_URL}/functions/v1/send-notifications`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: SUPABASE_SERVICE_ROLE_KEY,
              Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({
              mode: 'single',
              reason: 'daily-cron',
              userId: user.user_id,
            }),
          }
        );

        const data = await notifRes.json().catch(() => ({}));
        results.push({
          userId: user.user_id,
          status: data.status ?? (notifRes.ok ? 'sent' : 'error'),
          reason: data.reason,
        });
      } catch (e: any) {
        results.push({
          userId: user.user_id,
          status: 'error',
          reason: e?.message || 'Network error',
        });
      }
    }

    const sent = results.filter((r) => r.status === 'sent').length;
    const errors = results.filter((r) => r.status === 'error').length;

    console.log(`[notify-cron] Sent: ${sent}, Errors: ${errors}, Total checked: ${users.length}`);

    return res.status(200).json({
      ok: true,
      sent,
      errors,
      total_checked: users.length,
      results,
    });
  } catch (e: any) {
    console.error('[notify-cron] Fatal error:', e);
    return res.status(500).json({ error: e?.message || 'Unknown error' });
  }
}
