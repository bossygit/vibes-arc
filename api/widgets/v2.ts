/**
 * /api/widgets/v2 — endpoint auto-contenu, zéro import runtime.
 * Même structure JSON que /api/widgets/summary.
 * Pattern identique à api/health.ts et api/chat.ts (import type uniquement).
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ─── Supabase REST helpers ──────────────────────────────────────────────────

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
    },
  };
}

/**
 * Construit une query PostgREST sans URLSearchParams sur les valeurs de filtre :
 * les opérateurs `in.(...)` doivent garder parenthèses / virgules non encodées.
 */
function buildPostgrestQueryString(params: Record<string, string>): string {
  const parts: string[] = [];
  for (const [key, rawValue] of Object.entries(params)) {
    const encKey = encodeURIComponent(key);
    if (key === 'select') {
      parts.push(`${encKey}=${encodeURIComponent(rawValue)}`);
    } else {
      parts.push(`${encKey}=${rawValue}`);
    }
  }
  return parts.join('&');
}

async function sbGet<T = Record<string, unknown>[]>(
  table: string,
  params: Record<string, string>
): Promise<{ data: T | null; error: string | null }> {
  try {
    const { url, headers } = sbHeaders();
    const qs = buildPostgrestQueryString(params);
    const r = await fetch(`${url}/rest/v1/${table}?${qs}`, { headers });
    if (!r.ok) return { data: null, error: await r.text() };
    return { data: (await r.json()) as T, error: null };
  } catch (e) {
    return { data: null, error: String(e) };
  }
}

async function sbPost(
  table: string,
  body: unknown,
  prefer = 'return=minimal'
): Promise<{ error: string | null }> {
  try {
    const { url, headers } = sbHeaders();
    const r = await fetch(`${url}/rest/v1/${table}`, {
      method: 'POST',
      headers: { ...headers, Prefer: prefer },
      body: JSON.stringify(body),
    });
    if (!r.ok) return { error: await r.text() };
    return { error: null };
  } catch (e) {
    return { error: String(e) };
  }
}

// ─── Date utilities ─────────────────────────────────────────────────────────

const START_DATE = new Date(2025, 9, 1); // 1er octobre 2025

function todayDayIndex(): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const base = new Date(START_DATE);
  base.setHours(0, 0, 0, 0);
  return Math.floor((now.getTime() - base.getTime()) / 86_400_000);
}

function dayIndexToDate(idx: number): Date {
  const d = new Date(START_DATE);
  d.setDate(d.getDate() + idx);
  return d;
}

function dateToISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function monthStartIdx(today: Date): number {
  const m = new Date(today.getFullYear(), today.getMonth(), 1);
  return Math.max(0, Math.floor((m.getTime() - START_DATE.getTime()) / 86_400_000));
}

function weekStartIdx(today: Date): number {
  const d = new Date(today);
  const dow = d.getDay();
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  d.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((d.getTime() - START_DATE.getTime()) / 86_400_000));
}

// ─── Streak computation ──────────────────────────────────────────────────────

function computeStreaks(
  completedDayIndices: number[],
  todayIdx: number,
  windowSize = 60
): { current: number; longest: number } {
  const set = new Set(completedDayIndices);
  let current = 0;
  for (let i = todayIdx; i > todayIdx - windowSize && i >= 0; i--) {
    if (set.has(i)) current++;
    else break;
  }
  const sorted = completedDayIndices
    .filter((d) => d >= todayIdx - windowSize && d <= todayIdx)
    .sort((a, b) => a - b);
  let longest = 0, temp = 0;
  let prev: number | null = null;
  for (const d of sorted) {
    if (prev === null || d === prev + 1) temp++;
    else { if (temp > longest) longest = temp; temp = 1; }
    prev = d;
  }
  if (temp > longest) longest = temp;
  return { current, longest };
}

// ─── Trigger generation (inline, pain-avoidance / coût de l’inaction) ─────────
// Titre court pour le header widget ; message = 1–2 phrases (affiché sous le titre côté iOS).

function makeTrigger(chainLen: number, todayDone: number, todayTotal: number) {
  const allDone = todayDone >= todayTotal && todayTotal > 0;
  if (allDone && chainLen >= 7) {
    return {
      title: 'Légendaire',
      message: 'Vision : tu accumules des preuves que tu te tiens. Demain, même ligne.',
      emoji: '🏆',
      strength: 'strong',
    };
  }
  if (allDone) {
    return { title: 'Journée complète', message: 'Respire, tu as tenu. Pas de pression, juste de la clarté.', emoji: '✅', strength: 'medium' };
  }
  if (chainLen >= 3 && todayDone < todayTotal) {
    return {
      title: 'Casser coûte plus cher',
      message: `Ta chaîne de ${chainLen} jours : rater aujourd’hui, c’est repartir de zéro émotionnellement. Deux minutes d’action pèsent moins qu’un soir de regret.`,
      emoji: '🔥',
      strength: 'strong',
    };
  }
  if (chainLen === 0) {
    return {
      title: 'L’inaction a un prix',
      message:
        'Rester figé, c’est t’entraîner à ne pas te faire confiance. Un passage ridiculement petit aujourd’hui coûte moins qu’un jour de plus sur la pente facile (distraction, report).',
      emoji: '⚡',
      strength: 'light',
    };
  }
  return {
    title: `Jour ${chainLen + 1} : ne pas rater le fil`,
    message:
      'L’inaction d’hier s’appelle moins « repos » que « dérive ». Un tout petit geste maintenant vaut mieux qu’une spirale d’impuissance ce soir.',
    emoji: '💪',
    strength: 'medium',
  };
}

function makeReward(chainLen: number, currentStreak: number, longestStreak: number) {
  if (chainLen >= 100) return { rewardType: 'streak_milestone', rewardLevel: 'epic', title: 'Centenaire', message: '100 jours!', emoji: '🌟' };
  if (chainLen >= 30) return { rewardType: 'streak_milestone', rewardLevel: 'high', title: 'Un mois', message: '30 jours consécutifs!', emoji: '🎯' };
  if (currentStreak > longestStreak && longestStreak > 0) {
    return { rewardType: 'new_record', rewardLevel: 'high', title: 'Nouveau record!', message: `${currentStreak} jours, ton meilleur.`, emoji: '🏅' };
  }
  if (chainLen >= 7) return { rewardType: 'streak_milestone', rewardLevel: 'medium', title: 'Une semaine', message: '7 jours sans pause.', emoji: '🔥' };
  return null;
}

// ─── Empty summary ───────────────────────────────────────────────────────────

function emptySummary(todayISO: string) {
  return {
    today: todayISO,
    streaks: { longest: 0, current: 0, byHabit: [] },
    todayRemaining: { count: 0, habits: [] },
    monthlyScore: { month: todayISO.slice(0, 7), score: 0, completedDays: 0, totalDaysWithHabits: 0 },
    weeklyStats: { weekStart: todayISO, completionRate: 0, days: [] },
    insight: {
      title: 'Pas de données',
      message: 'Tant que ce n’est pas lié, ton cerveau choisit la facilité ailleurs. Branche l’app pour verrouiller l’intention.',
    },
    chain: { length: 0, status: 'broken', pressure: false, calendar: [] },
    trigger: {
      title: 'Lier, sinon ça s’érode',
      message: 'Sans lien, pas de miroir : facile d’oublier le coût d’inaction. Ouvre Vibes Arc et connecte l’appareil.',
      emoji: '📱',
      strength: 'light',
    },
    reward: null,
  };
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const deviceId = (req.query.deviceId as string | undefined)?.trim();
  if (!deviceId) return res.status(400).json({ error: 'Missing deviceId' });

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(503).json({ error: 'Supabase env vars not configured' });
  }

  try {
    const today = new Date();
    const todayIdx = todayDayIndex();
    const todayISO = dateToISO(today);

    if (todayIdx < 0) return res.status(200).json(emptySummary(todayISO));

    // 1) Résoudre device → user
    const { data: devRows, error: devErr } = await sbGet<Record<string, unknown>[]>(
      'device_widgets',
      { select: 'user_id', device_id: `eq.${deviceId}` }
    );
    if (devErr) return res.status(500).json({ error: 'device lookup failed', detail: devErr });

    const userId = devRows && devRows.length > 0
      ? (devRows[0].user_id as string | null)
      : null;

    if (!devRows || devRows.length === 0) {
      await sbPost(
        'device_widgets',
        { device_id: deviceId },
        'return=minimal,resolution=ignore-duplicates'
      );
    }

    if (!userId) return res.status(200).json(emptySummary(todayISO));

    // 2) Habitudes
    const { data: habits, error: hErr } = await sbGet<Record<string, unknown>[]>(
      'habits',
      { select: 'id,name,type,total_days', user_id: `eq.${userId}` }
    );
    if (hErr) return res.status(500).json({ error: 'habits failed', detail: hErr });
    if (!habits || habits.length === 0) return res.status(200).json(emptySummary(todayISO));

    const habitIds = habits.map((h) => h.id as number);
    const histStart = Math.max(0, todayIdx - 60);

    // 3) Progression
    const { data: progress, error: pErr } = await sbGet<Record<string, unknown>[]>(
      'habit_progress',
      {
        select: 'habit_id,day_index',
        'habit_id': `in.(${habitIds.join(',')})`,
        'day_index': `gte.${histStart}`,
        'completed': `eq.true`,
      }
    );
    if (pErr) return res.status(500).json({ error: 'progress failed', detail: pErr });

    const progressRows = progress || [];

    // 4) Calcul par habitude
    const progressByHabit: Record<number, number[]> = {};
    for (const id of habitIds) progressByHabit[id] = [];
    for (const row of progressRows) {
      const hid = row.habit_id as number;
      const di = row.day_index as number;
      if (progressByHabit[hid]) progressByHabit[hid].push(di);
    }

    let overallCurrent = 0, overallLongest = 0;
    const byHabit: { habitId: number; name: string; current: number; longest: number }[] = [];

    for (const h of habits) {
      const hid = h.id as number;
      const { current, longest } = computeStreaks(progressByHabit[hid] || [], todayIdx);
      if (current > overallCurrent) overallCurrent = current;
      if (longest > overallLongest) overallLongest = longest;
      byHabit.push({ habitId: hid, name: h.name as string, current, longest });
    }

    // 5) Habitudes restantes aujourd'hui
    const completedTodayIds = new Set(
      progressRows.filter((r) => r.day_index === todayIdx).map((r) => r.habit_id as number)
    );
    const remainingHabits = habits
      .filter((h) => !completedTodayIds.has(h.id as number))
      .map((h) => ({ habitId: h.id as number, name: h.name as string, type: h.type as string }));

    // 6) Chaîne globale (tous les jours où ≥1 habitude complétée)
    const completedDaySet = new Set(progressRows.map((r) => r.day_index as number));
    const completedDays = Array.from(completedDaySet).sort((a, b) => a - b);
    const { current: chainLen } = computeStreaks(completedDays, todayIdx);
    const chainStatus = chainLen === 0 ? 'broken' : chainLen <= 3 ? 'fragile' : chainLen <= 10 ? 'stable' : 'strong';

    // Calendrier sur 14 jours
    const calWindow = 14;
    const calendar: { date: string; completed: boolean }[] = [];
    for (let i = calWindow - 1; i >= 0; i--) {
      const idx = todayIdx - i;
      if (idx >= 0) calendar.push({ date: dateToISO(dayIndexToDate(idx)), completed: completedDaySet.has(idx) });
    }

    // 7) Score mensuel
    const mStart = monthStartIdx(today);
    const mEnd = todayIdx;
    let mCompleted = 0;
    for (let i = mStart; i <= mEnd; i++) {
      if (completedDaySet.has(i)) mCompleted++;
    }
    const mTotal = mEnd - mStart + 1;
    const mScore = mTotal > 0 ? Math.round((mCompleted / mTotal) * 100) : 0;

    // 8) Score hebdomadaire
    const wStart = weekStartIdx(today);
    const wEnd = Math.min(todayIdx, wStart + 6);
    const wDays: { date: string; rate: number }[] = [];
    let wCompletedCount = 0;
    for (let i = wStart; i <= wEnd; i++) {
      const done = completedDaySet.has(i) ? 1 : 0;
      wCompletedCount += done;
      wDays.push({ date: dateToISO(dayIndexToDate(i)), rate: done });
    }
    const wRate = wDays.length > 0 ? wCompletedCount / wDays.length : 0;

    // 9) Trigger & reward
    const todayDone = completedTodayIds.size;
    const todayTotal = habits.length;
    const trigger = makeTrigger(chainLen, todayDone, todayTotal);
    const reward = makeReward(chainLen, overallCurrent, overallLongest);

    return res.status(200).json({
      today: todayISO,
      streaks: { longest: overallLongest, current: overallCurrent, byHabit },
      todayRemaining: { count: remainingHabits.length, habits: remainingHabits },
      monthlyScore: {
        month: todayISO.slice(0, 7),
        score: mScore,
        completedDays: mCompleted,
        totalDaysWithHabits: mTotal,
      },
      weeklyStats: {
        weekStart: dateToISO(dayIndexToDate(wStart)),
        completionRate: wRate,
        days: wDays,
      },
      insight: { title: trigger.title, message: trigger.message },
      chain: { length: chainLen, status: chainStatus, pressure: chainLen >= 3 && remainingHabits.length > 0, calendar },
      trigger,
      reward,
    });
  } catch (e) {
    return res.status(500).json({ error: 'Internal error', detail: String(e) });
  }
}
