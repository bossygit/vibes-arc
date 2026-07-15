import type { Habit } from '@/types';
import { isHabitActiveOnDay } from '@/utils/habitUtils';

const NBTC_THRESHOLD = 0.5; // 50%
const CONSECUTIVE_DAYS_THRESHOLD = 3;

/**
 * Calcule le % de complétion pour un jour donné.
 * Retourne null si aucune habitude n'est active ce jour.
 */
export function getDayCompletionPercent(habits: Habit[], dayIndex: number): number | null {
  if (dayIndex < 0) return null;
  const active = habits.filter((h) => isHabitActiveOnDay(h, dayIndex));
  if (active.length === 0) return null;
  const done = active.filter((h) => !!h.progress[dayIndex]).length;
  return Math.round((done / active.length) * 100);
}

/**
 * Vérifie si un jour est "qualifié" pour Never Break the Chain (≥50%).
 */
export function isDayAboveThreshold(habits: Habit[], dayIndex: number): boolean {
  const pct = getDayCompletionPercent(habits, dayIndex);
  if (pct === null) return false;
  return pct >= NBTC_THRESHOLD * 100;
}

export interface MomentumBreakResult {
  /** True si on a détecté 3+ jours consécutifs < 50% */
  isBroken: boolean;
  /** Nombre de jours consécutifs sous le seuil (en partant d'aujourd'hui) */
  consecutiveDaysBelow: number;
  /** Pourcentage moyen sur la période de rupture */
  averagePercent: number;
  /** Dates des jours sous le seuil */
  daysBelow: string[];
  /** Date du dernier jour au-dessus du seuil */
  lastGoodDate: string | null;
}

/**
 * Détecte si on est dans une "rupture de momentum" :
 * 3+ jours consécutifs où le % journalier est < 50%.
 * On regarde en arrière depuis todayIdx, et on compte combien de jours
 * consécutifs sont sous le seuil, en partant d'aujourd'hui.
 */
export function detectMomentumBreak(
  habits: Habit[],
  todayIdx: number
): MomentumBreakResult {
  if (habits.length === 0) {
    return {
      isBroken: false,
      consecutiveDaysBelow: 0,
      averagePercent: 0,
      daysBelow: [],
      lastGoodDate: null,
    };
  }

  let consecutiveBelow = 0;
  let sumPct = 0;
  const daysBelow: string[] = [];
  let idx = todayIdx;
  let lastGoodDate: string | null = null;

  // On remonte depuis aujourd'hui
  while (idx >= 0) {
    const pct = getDayCompletionPercent(habits, idx);
    if (pct === null) {
      // Pas d'habitudes actives ce jour → on l'ignore et on continue
      idx--;
      continue;
    }
    const above = pct >= NBTC_THRESHOLD * 100;

    if (!above) {
      consecutiveBelow++;
      sumPct += pct;
      // Format date pour le jour
      const d = new Date();
      d.setDate(d.getDate() - (todayIdx - idx));
      daysBelow.push(d.toISOString().slice(0, 10));
    } else {
      lastGoodDate = (() => {
        const d = new Date();
        d.setDate(d.getDate() - (todayIdx - idx));
        return d.toISOString().slice(0, 10);
      })();
      break;
    }
    idx--;
  }

  const isBroken = consecutiveBelow >= CONSECUTIVE_DAYS_THRESHOLD;
  const averagePercent = consecutiveBelow > 0
    ? Math.round(sumPct / consecutiveBelow)
    : 0;

  return {
    isBroken,
    consecutiveDaysBelow: consecutiveBelow,
    averagePercent,
    daysBelow,
    lastGoodDate,
  };
}
