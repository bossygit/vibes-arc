import { Habit, Identity } from '@/types';
import { getDateForDay, formatDateFull } from '@/utils/dateUtils';
import { getHabitStartDayIndex, isHabitActiveOnDay } from '@/utils/habitUtils';

type IdentityStatus = 'incarnée' | 'idéalisée' | 'fantasmée' | 'déclarée';

export interface EngagementReport {
  meta: {
    generatedAt: string;
    period: {
      label: string;
      startISO: string;
      endISO: string;
      totalDays: number;
    };
    version: string;
  };
  kpis: {
    engagementDaysPct: number; // jours où au moins 1 habitude est cochée
    habitCompletionPct: number; // moyenne pondérée sur toutes les habitudes
    identityIntegrityScore: number; // moyenne des identités ayant des habitudes liées
    recoverySpeedDays: number | null; // moyenne des jours pour revenir après une rupture (global)
  };
  executiveSummary: {
    truths: string[];
    gaps: string[];
    strongestLevers: string[];
  };
  tables: {
    daily: Array<{
      dayIndex: number;
      dateISO: string;
      dateLabel: string;
      weekday: string;
      activeHabits: number;
      completedHabits: number;
      engaged: boolean;
    }>;
    habits: Array<{
      habitId: number;
      name: string;
      type: 'start' | 'stop';
      activeDays: number;
      completedDays: number;
      completionPct: number;
      longestStreak: number;
      breaks: number;
      avgRecoveryDays: number | null;
      linkedIdentities: string[];
      flags: string[];
    }>;
    identities: Array<{
      identityId: number;
      name: string;
      linkedHabits: number;
      completionPct: number | null;
      status: IdentityStatus;
      evidence: string[];
    }>;
  };
  questionsDeVerite: string[];
}

const WEEKDAYS_FR = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

function pct(n: number): number {
  return Math.round(n * 100);
}

function safeDiv(n: number, d: number): number {
  return d === 0 ? 0 : n / d;
}

function csvEscape(value: unknown): string {
  const s = String(value ?? '');
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCSV(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.map(csvEscape).join(','),
    ...rows.map((r) => headers.map((h) => csvEscape((r as any)[h])).join(',')),
  ];
  return lines.join('\n');
}

function computeStreakAndBreaks(progress: boolean[]) {
  let longest = 0;
  let current = 0;
  let breaks = 0;
  let lastWasTrue = false;

  const completionDays: number[] = [];

  for (let i = 0; i < progress.length; i++) {
    const v = progress[i];
    if (v) {
      current += 1;
      longest = Math.max(longest, current);
      completionDays.push(i);
      lastWasTrue = true;
    } else {
      if (lastWasTrue) breaks += 1;
      current = 0;
      lastWasTrue = false;
    }
  }

  // Recovery: après un break (true -> false), combien de jours jusqu’au prochain true
  const recoveryGaps: number[] = [];
  for (let i = 1; i < completionDays.length; i++) {
    const gap = completionDays[i] - completionDays[i - 1] - 1;
    if (gap > 0) recoveryGaps.push(gap);
  }
  const avgRecoveryDays =
    recoveryGaps.length > 0 ? Math.round(recoveryGaps.reduce((a, b) => a + b, 0) / recoveryGaps.length) : null;

  return { longestStreak: longest, breaks, avgRecoveryDays };
}

function detectNear21(progress: boolean[]) {
  // “quasi 21”: au moins une séquence 18-20 mais jamais 21+
  const { longestStreak } = computeStreakAndBreaks(progress);
  if (longestStreak >= 21) return false;
  let cur = 0;
  let hasNear = false;
  for (let i = 0; i < progress.length; i++) {
    if (progress[i]) {
      cur++;
      if (cur >= 18) hasNear = true;
    } else {
      cur = 0;
    }
  }
  return hasNear;
}

function computeGlobalRecoverySpeed(dailyEngaged: boolean[]) {
  // gaps de non-engagement entre deux jours engagés
  const engagedIdx: number[] = [];
  for (let i = 0; i < dailyEngaged.length; i++) if (dailyEngaged[i]) engagedIdx.push(i);
  if (engagedIdx.length < 2) return null;

  const gaps: number[] = [];
  for (let i = 1; i < engagedIdx.length; i++) {
    const gap = engagedIdx[i] - engagedIdx[i - 1] - 1;
    if (gap > 0) gaps.push(gap);
  }
  if (gaps.length === 0) return 0;
  return Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
}

export function generateEngagementReport(input: {
  identities: Identity[];
  habits: Habit[];
  periodLabel?: string;
  totalDays?: number;
}): EngagementReport {
  const totalDays = input.totalDays ?? 92; // T4 2025
  const start = getDateForDay(0);
  const end = getDateForDay(totalDays - 1);

  const daily = Array.from({ length: totalDays }, (_, dayIndex) => {
    const date = getDateForDay(dayIndex);
    const activeHabits = input.habits.filter((h) => isHabitActiveOnDay(h, dayIndex));
    const completedHabits = activeHabits.filter((h) => !!h.progress[dayIndex]).length;
    return {
      dayIndex,
      dateISO: date.toISOString(),
      dateLabel: formatDateFull(date),
      weekday: WEEKDAYS_FR[date.getDay()],
      activeHabits: activeHabits.length,
      completedHabits,
      engaged: completedHabits > 0,
    };
  });

  const engagedDays = daily.filter((d) => d.engaged).length;
  const engagementDaysPct = pct(safeDiv(engagedDays, totalDays));

  const habitRows = input.habits.map((h) => {
    const startIdx = getHabitStartDayIndex(h);
    const slice = h.progress.slice(0, totalDays);
    const activeDays = Math.max(0, Math.min(slice.length, totalDays) - Math.min(startIdx, totalDays));
    const completedDays = slice.reduce((s, v, idx) => s + (idx >= startIdx && idx < totalDays && v ? 1 : 0), 0);
    const completionPct = pct(safeDiv(completedDays, activeDays));
    const { longestStreak, breaks, avgRecoveryDays } = computeStreakAndBreaks(slice.slice(startIdx));

    const linkedIdentityNames = h.linkedIdentities
      .map((id) => input.identities.find((i) => i.id === id)?.name)
      .filter(Boolean) as string[];

    const flags: string[] = [];
    if (detectNear21(slice.slice(startIdx))) flags.push('quasi-21 (18–20 jours sans franchir 21)');
    if (breaks >= 6) flags.push('rythme instable (ruptures fréquentes)');
    if (completionPct <= 15) flags.push('évitée (faible exécution)');

    return {
      habitId: h.id,
      name: h.name,
      type: h.type,
      activeDays,
      completedDays,
      completionPct,
      longestStreak,
      breaks,
      avgRecoveryDays,
      linkedIdentities: linkedIdentityNames,
      flags,
    };
  });

  const totalActiveDaysAll = habitRows.reduce((s, r) => s + r.activeDays, 0);
  const totalCompletedDaysAll = habitRows.reduce((s, r) => s + r.completedDays, 0);
  const habitCompletionPct = pct(safeDiv(totalCompletedDaysAll, totalActiveDaysAll));

  const identitiesRows = input.identities.map((identity) => {
    const linkedHabits = habitRows.filter((h) => input.habits.find((hh) => hh.id === h.habitId)?.linkedIdentities.includes(identity.id));
    if (linkedHabits.length === 0) {
      return {
        identityId: identity.id,
        name: identity.name,
        linkedHabits: 0,
        completionPct: null,
        status: 'déclarée' as const,
        evidence: ['Aucune habitude liée → identité non mesurable par l’action.'],
      };
    }

    const weightedCompleted = linkedHabits.reduce((s, h) => s + h.completedDays, 0);
    const weightedActive = linkedHabits.reduce((s, h) => s + h.activeDays, 0);
    const completion = safeDiv(weightedCompleted, weightedActive);
    const completionPct2 = pct(completion);

    let status: IdentityStatus = 'fantasmée';
    if (completion >= 0.6) status = 'incarnée';
    else if (completion >= 0.3) status = 'idéalisée';
    else status = 'fantasmée';

    const topHabit = [...linkedHabits].sort((a, b) => b.completionPct - a.completionPct)[0];
    const weakHabit = [...linkedHabits].sort((a, b) => a.completionPct - b.completionPct)[0];

    const evidence: string[] = [
      `Exécution (habitudes liées) : ${completionPct2}%`,
      `Meilleure preuve : "${topHabit.name}" (${topHabit.completionPct}%)`,
      `Point fragile : "${weakHabit.name}" (${weakHabit.completionPct}%)`,
    ];

    return {
      identityId: identity.id,
      name: identity.name,
      linkedHabits: linkedHabits.length,
      completionPct: completionPct2,
      status,
      evidence,
    };
  });

  const measurableIdentities = identitiesRows.filter((r) => r.completionPct !== null);
  const identityIntegrityScore = pct(
    safeDiv(
      measurableIdentities.reduce((s, r) => s + (r.completionPct ?? 0), 0),
      measurableIdentities.length * 100
    )
  );

  const recoverySpeedDays = computeGlobalRecoverySpeed(daily.map((d) => d.engaged));

  const bestHabits = [...habitRows].sort((a, b) => b.completionPct - a.completionPct).slice(0, 3);
  const worstHabits = [...habitRows].sort((a, b) => a.completionPct - b.completionPct).slice(0, 3);

  const byType = (type: 'start' | 'stop') => {
    const rows = habitRows.filter((h) => h.type === type);
    const d = rows.reduce((s, r) => s + r.activeDays, 0);
    const n = rows.reduce((s, r) => s + r.completedDays, 0);
    return pct(safeDiv(n, d));
  };

  const startPct = byType('start');
  const stopPct = byType('stop');

  const truths: string[] = [];
  truths.push(`Engagement global (au moins 1 action/jour) : ${engagementDaysPct}% sur ${totalDays} jours.`);
  truths.push(`Exécution moyenne (toutes habitudes) : ${habitCompletionPct}%.`);
  if (input.habits.length > 0) truths.push(`Différence construction vs éviction : start=${startPct}%, stop=${stopPct}%.`);

  const gaps: string[] = [];
  if (worstHabits[0]) gaps.push(`Habitudes les plus évitées : ${worstHabits.map((h) => `"${h.name}" (${h.completionPct}%)`).join(', ')}.`);
  if (recoverySpeedDays !== null) gaps.push(`Vitesse de retour après rupture (global) : ${recoverySpeedDays} jour(s) en moyenne.`);

  const strongestLevers: string[] = [];
  if (bestHabits[0]) strongestLevers.push(`Ce qui marche déjà : ${bestHabits.map((h) => `"${h.name}" (${h.completionPct}%)`).join(', ')}.`);
  const quasi21 = habitRows.filter((h) => h.flags.some((f) => f.startsWith('quasi-21'))).slice(0, 3);
  if (quasi21.length > 0) strongestLevers.push(`Signal “quasi-21” (friction au seuil de constance) : ${quasi21.map((h) => `"${h.name}"`).join(', ')}.`);

  const questionsDeVerite: string[] = [
    'Quelles identités sont “déclarées” sans habitudes liées (donc sans preuve actionnable) ?',
    'Sur quelles habitudes l’exécution chute précisément quand une constance apparaît (ex: quasi-21) ?',
    'Qu’est-ce qui change les jours de rupture (charge, environnement, sommeil, social, imprévus) ?',
    'Les habitudes “stop” sont-elles évitées parce que le déclencheur est flou ou parce que le coût émotionnel est élevé ?',
    'Quelles 1–2 habitudes suffiraient à porter 80% de l’intégrité identitaire ?',
  ];

  return {
    meta: {
      generatedAt: new Date().toISOString(),
      period: {
        label: input.periodLabel ?? 'T4 2025 (01/10 → 31/12)',
        startISO: start.toISOString(),
        endISO: end.toISOString(),
        totalDays,
      },
      version: '1.0.0',
    },
    kpis: {
      engagementDaysPct,
      habitCompletionPct,
      identityIntegrityScore,
      recoverySpeedDays,
    },
    executiveSummary: {
      truths,
      gaps,
      strongestLevers,
    },
    tables: {
      daily,
      habits: habitRows.map((h) => ({
        ...h,
        linkedIdentities: h.linkedIdentities,
        flags: h.flags,
      })),
      identities: identitiesRows,
    },
    questionsDeVerite,
  };
}



