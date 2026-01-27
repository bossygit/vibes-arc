import type { VercelRequest, VercelResponse } from '@vercel/node';
import webpush from 'web-push';
import { getServiceSupabase } from './_supabase';

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
  // midnight in TZ → represent as UTC date for diff
  const todayUTC = new Date(Date.UTC(p.year, p.month - 1, p.day));
  const startUTC = new Date(Date.UTC(2025, 9, 1)); // startDate: 2025-10-01
  const diff = Math.floor((todayUTC.getTime() - startUTC.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Secure with a secret token (recommended)
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).send('Unauthorized');
  }
  try {
    configureWebPush();
    const supabase = getServiceSupabase();

    // Pull subscriptions + user prefs
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('user_id, endpoint, subscription, user_prefs(notif_enabled, notif_hour, notif_timezone)')
      .limit(5000);

    if (error) return res.status(500).send(error.message);
    if (!subs || subs.length === 0) return res.status(200).json({ ok: true, sent: 0 });

    let sent = 0;
    const now = new Date();

    // Group by user
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
      const hour = Number(prefs.notif_hour ?? 20);

      const localHour = Number(new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: '2-digit', hour12: false }).format(now));
      if (localHour !== hour) continue;

      const dayIndex = getDayIndexForTZ(tz);

      // Fetch habits for user
      const { data: habits, error: hErr } = await supabase
        .from('habits')
        .select('id, name, total_days, created_at')
        .eq('user_id', userId);
      if (hErr || !habits || habits.length === 0) continue;

      // Habit is active from created_at dayIndex
      const baseUTC = new Date(Date.UTC(2025, 9, 1));
      const activeHabits = habits.filter((h: any) => {
        const created = new Date(h.created_at);
        const createdUTC = new Date(Date.UTC(created.getUTCFullYear(), created.getUTCMonth(), created.getUTCDate()));
        const startIdx = Math.max(0, Math.floor((createdUTC.getTime() - baseUTC.getTime()) / (1000 * 60 * 60 * 24)));
        return dayIndex >= startIdx && dayIndex >= 0 && dayIndex < Number(h.total_days || 0);
      });
      if (activeHabits.length === 0) continue;

      const habitIds = activeHabits.map((h: any) => h.id);
      const { data: progress } = await supabase
        .from('habit_progress')
        .select('habit_id, completed')
        .eq('day_index', dayIndex)
        .in('habit_id', habitIds);

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
          // If gone, remove it
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            await supabase.from('push_subscriptions').delete().eq('user_id', userId).eq('endpoint', s.endpoint);
          }
        }
      }
    }

    return res.status(200).json({ ok: true, sent });
  } catch (e: any) {
    return res.status(500).send(e?.message || 'Error');
  }
}

