/**
 * GET/POST /api/push/cron — auto-contenu (zéro import runtime local hors npm).
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import webpush from 'web-push';

function getEnv(): { url: string; key: string } {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return { url, key };
}

function restHeaders(key: string): Record<string, string> {
  return {
    apikey: key,
    Authorization: 'Bearer ' + key,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

function configureWebPush() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@vibes-arc.local';
  if (!publicKey || !privateKey) throw new Error('Missing VAPID keys');
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

function getTZDateParts(timeZone: string, date: Date) {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
  const parts = fmt.formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value;
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
  };
}

function getDayIndexForTZ(timeZone: string) {
  const now = new Date();
  const p = getTZDateParts(timeZone, now);
  const todayUTC = new Date(Date.UTC(p.year, p.month - 1, p.day));
  const startUTC = new Date(Date.UTC(2025, 9, 1));
  const diff = Math.floor((todayUTC.getTime() - startUTC.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

function getLocalHour(timeZone: string): number {
  const fmt = new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', hour12: false });
  return Number(fmt.format(new Date()));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).send('Unauthorized');
  }
  try {
    configureWebPush();
    const { url, key } = getEnv();
    const hdrs = restHeaders(key);

    const subsQs =
      'select=' + encodeURIComponent('user_id,endpoint,subscription,user_prefs(notif_enabled,notif_hour,notif_timezone)') +
      '&limit=5000';
    const subsRes = await fetch(url + '/rest/v1/push_subscriptions?' + subsQs, { headers: hdrs });
    if (!subsRes.ok) return res.status(500).send(await subsRes.text());
    const subs = (await subsRes.json()) as any[];
    if (!subs || subs.length === 0) return res.status(200).json({ ok: true, sent: 0 });

    let sent = 0;
    const byUser = new Map<string, any[]>();
    subs.forEach((s: any) => {
      const arr = byUser.get(s.user_id) || [];
      arr.push(s);
      byUser.set(s.user_id, arr);
    });

    for (const [userId, userSubs] of byUser.entries()) {
      const prefs = userSubs[0]?.user_prefs;
      if (!prefs?.notif_enabled) continue;
      const tz = prefs.notif_timezone || 'Europe/Paris';

      const localHour = getLocalHour(tz);
      if (localHour < 6 || localHour > 22) continue;

      const dayIndex = getDayIndexForTZ(tz);

      const habitsQs =
        'select=' + encodeURIComponent('id,name,total_days,created_at') +
        '&user_id=eq.' + encodeURIComponent(userId);
      const habitsRes = await fetch(url + '/rest/v1/habits?' + habitsQs, { headers: hdrs });
      if (!habitsRes.ok) continue;
      const habits = (await habitsRes.json()) as any[];
      if (!habits || habits.length === 0) continue;

      const baseUTC = new Date(Date.UTC(2025, 9, 1));
      const activeHabits = habits.filter((h: any) => {
        const created = new Date(h.created_at);
        const createdUTC = new Date(Date.UTC(created.getUTCFullYear(), created.getUTCMonth(), created.getUTCDate()));
        const startIdx = Math.max(0, Math.floor((createdUTC.getTime() - baseUTC.getTime()) / (1000 * 60 * 60 * 24)));
        return dayIndex >= startIdx && dayIndex >= 0 && dayIndex < Number(h.total_days || 0);
      });
      if (activeHabits.length === 0) continue;

      const habitIds = activeHabits.map((h: any) => h.id);
      const progressQs =
        'select=' + encodeURIComponent('habit_id,completed') +
        '&day_index=eq.' + dayIndex +
        '&habit_id=in.(' + habitIds.join(',') + ')';
      const progressRes = await fetch(url + '/rest/v1/habit_progress?' + progressQs, { headers: hdrs });
      const progress = progressRes.ok ? ((await progressRes.json()) as any[]) : [];

      const doneSet = new Set((progress || []).filter((p: any) => p.completed).map((p: any) => p.habit_id));
      const remaining = activeHabits.filter((h: any) => !doneSet.has(h.id));

      const names = remaining.slice(0, 3).map((h: any) => h.name);
      const more = remaining.length - names.length;

      const payload = JSON.stringify({
        title: remaining.length > 0 ? `Vibes Arc — ${remaining.length} restantes` : 'Vibes Arc — Journée complète',
        body:
          remaining.length > 0
            ? `Restantes: ${names.join(', ')}${more > 0 ? ` (+${more})` : ''}`
            : 'Tout est coché pour aujourd’hui.',
        url: '/',
      });

      for (const s of userSubs) {
        try {
          await webpush.sendNotification(s.subscription as any, payload);
          sent += 1;
        } catch (err: any) {
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            const delQs =
              'user_id=eq.' + encodeURIComponent(userId) +
              '&endpoint=eq.' + encodeURIComponent(s.endpoint);
            await fetch(url + '/rest/v1/push_subscriptions?' + delQs, {
              method: 'DELETE',
              headers: { ...hdrs, Prefer: 'return=minimal' },
            });
          }
        }
      }
    }

    return res.status(200).json({ ok: true, sent });
  } catch (e: any) {
    return res.status(500).send(e?.message || 'Error');
  }
}
