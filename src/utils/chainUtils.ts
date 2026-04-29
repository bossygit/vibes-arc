import type { Habit } from '@/types';
import { isHabitActiveOnDay } from '@/utils/habitUtils';
import { getDateForDay } from '@/utils/dateUtils';

const CHAIN_WINDOW_DAYS = 14;

export type ChainStatus = 'broken' | 'fragile' | 'stable' | 'strong';

export interface ChainData {
  calendar: { date: string; completed: boolean }[];
  length: number;
  status: ChainStatus;
  pressure: boolean;
}

function getChainStatus(length: number): ChainStatus {
  if (length === 0) return 'broken';
  if (length <= 3) return 'fragile';
  if (length <= 10) return 'stable';
  return 'strong';
}

const CHAIN_MIN_DAY_RATIO = 0.5;

/**
 * Jour qui compte pour Never Break the Chain : au moins 50 % des habitudes
 * actives ce jour ont une complétion (aligné widgets v2 / summary).
 */
export function isDayEligibleForNeverBreakChain(habits: Habit[], dayIndex: number): boolean {
  if (dayIndex < 0) return false;
  const active = habits.filter((h) => isHabitActiveOnDay(h, dayIndex));
  if (active.length === 0) return false;
  const done = active.filter((h) => !!h.progress[dayIndex]).length;
  return done / active.length >= CHAIN_MIN_DAY_RATIO;
}
const DEFAULT_LONGEST_STREAK_WINDOW = 60;

/**
 * Longest consecutive NBTC-qualifying days (≥50 % habits actives faites ce jour) in the window.
 * O(windowDays × habits). Aligné widgets API summary / v2.
 */
export function getGlobalLongestStreak(
  habits: Habit[],
  todayIdx: number,
  windowDays: number = DEFAULT_LONGEST_STREAK_WINDOW
): number {
  const start = Math.max(0, todayIdx - windowDays + 1);
  let maxLen = 0;
  let current = 0;
  for (let idx = todayIdx; idx >= start; idx--) {
    if (isDayEligibleForNeverBreakChain(habits, idx)) {
      current++;
      maxLen = Math.max(maxLen, current);
    } else {
      current = 0;
    }
  }
  return maxLen;
}

/**
 * Never Break the Chain — même seuil ≥ 50 % que les widgets (/api/widgets/v2, summary).
 */
export function computeChain(habits: Habit[], todayIdx: number): ChainData {
  const calendar: { date: string; completed: boolean }[] = [];
  for (let i = 0; i < CHAIN_WINDOW_DAYS; i++) {
    const idx = todayIdx - (CHAIN_WINDOW_DAYS - 1) + i;
    const date = getDateForDay(idx).toISOString().slice(0, 10);
    const completed = isDayEligibleForNeverBreakChain(habits, idx);
    calendar.push({ date, completed });
  }

  let length = 0;
  for (let i = 0; i < CHAIN_WINDOW_DAYS; i++) {
    const idx = todayIdx - i;
    if (idx < 0) break;
    if (!isDayEligibleForNeverBreakChain(habits, idx)) break;
    length++;
  }

  const todayEligible = isDayEligibleForNeverBreakChain(habits, todayIdx);
  const pressure = length >= 3 && !todayEligible;

  return {
    calendar,
    length,
    status: getChainStatus(length),
    pressure,
  };
}
