// ===================================================================
// Focus 17/68 — Constantes et utilitaires de stats
// ===================================================================

export const FOCUS_HABIT_NAME = 'Focus 17/68';
export const FOCUS_MILESTONE_KEY = 'focus_1768';

export const MILESTONES = [17, 34, 51, 68];

export interface FocusHoldRecord {
  id?: string;
  duration_seconds: number;
  intention_label: string | null;
  milestone_reached: number; // 0..4
  started_at: string; // ISO
}

export interface FocusDailyAggregate {
  date: string; // YYYY-MM-DD
  sessions: number;
  totalSeconds: number;
  avgSeconds: number;
  maxSeconds: number;
  maxTier: number;
  tiersHit: Record<number, number>; // tier -> count
}

export interface FocusStats {
  totalSessions: number;
  allTimeBest: number;
  allTimeBestDate: string | null;
  tierDistribution: Record<number, number>; // 0..4
  recentAverage: number; // last 7 days
  streak: number; // days in a row with >= 1 session
  weeklyTrend: FocusDailyAggregate[]; // last 7 days
  last30Days: { date: string; max: number }[];
}

function toDateStr(iso: string): string {
  return iso.slice(0, 10);
}

export function computeFocusStats(sessions: FocusHoldRecord[]): FocusStats {
  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      allTimeBest: 0,
      allTimeBestDate: null,
      tierDistribution: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 },
      recentAverage: 0,
      streak: 0,
      weeklyTrend: [],
      last30Days: [],
    };
  }

  const tierDist: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
  let best = 0;
  let bestDate: string | null = null;

  // Daily aggregates
  const byDay = new Map<string, FocusDailyAggregate>();
  for (const s of sessions) {
    const day = toDateStr(s.started_at);
    tierDist[s.milestone_reached] = (tierDist[s.milestone_reached] || 0) + 1;

    if (s.duration_seconds > best) {
      best = s.duration_seconds;
      bestDate = day;
    }

    let agg = byDay.get(day);
    if (!agg) {
      agg = {
        date: day,
        sessions: 0,
        totalSeconds: 0,
        avgSeconds: 0,
        maxSeconds: 0,
        maxTier: 0,
        tiersHit: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 },
      };
      byDay.set(day, agg);
    }
    agg.sessions++;
    agg.totalSeconds += s.duration_seconds;
    if (s.duration_seconds > agg.maxSeconds) agg.maxSeconds = s.duration_seconds;
    if (s.milestone_reached > agg.maxTier) agg.maxTier = s.milestone_reached;
    agg.tiersHit[s.milestone_reached] = (agg.tiersHit[s.milestone_reached] || 0) + 1;
  }

  // Calc averages
  for (const agg of byDay.values()) {
    agg.avgSeconds = agg.totalSeconds / agg.sessions;
  }

  // Weekly trend (last 7 distinct days)
  const sortedDays = [...byDay.keys()].sort().reverse();
  const weeklyTrend = sortedDays.slice(0, 7).map((d) => byDay.get(d)!);

  // Recent average
  const recentSessions = sessions
    .filter((s) => {
      const d = toDateStr(s.started_at);
      const daysAgo = (Date.now() - new Date(d).getTime()) / 86400000;
      return daysAgo <= 7;
    });
  const recentAverage = recentSessions.length > 0
    ? recentSessions.reduce((sum, s) => sum + s.duration_seconds, 0) / recentSessions.length
    : 0;

  // Streak (consecutive days back from today with >= 1 session)
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 100; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (byDay.has(key)) {
      streak++;
    } else {
      break;
    }
  }

  // Last 30 days max per day
  const last30Days = sortedDays.slice(0, 30).map((d) => ({
    date: d,
    max: byDay.get(d)!.maxSeconds,
  })).reverse();

  return {
    totalSessions: sessions.length,
    allTimeBest: best,
    allTimeBestDate: bestDate,
    tierDistribution: tierDist,
    recentAverage,
    streak,
    weeklyTrend,
    last30Days,
  };
}

/** Calcule le palier (0..4) pour une durée en secondes */
export function tierFor(durationSec: number): number {
  let tier = 0;
  for (let i = 0; i < MILESTONES.length; i++) {
    if (durationSec >= MILESTONES[i]) tier = i + 1;
  }
  return tier;
}

/** Message de feedback en français */
export function feedbackFor(durationSec: number, tier: number): string {
  const s = durationSec.toFixed(1);
  if (tier === 0) {
    const remaining = Math.max(0, 17 - durationSec).toFixed(0);
    return `${s}s tenues. Encore ${remaining}s pour le premier palier (17s).`;
  }
  if (tier === 4) return `${s}s — cycle complet des 4 paliers atteint (68s).`;
  return `${s}s — palier ${tier} atteint (${MILESTONES[tier - 1]}s).`;
}
