/**
 * Never Break the Chain : un jour « compte » si ≥ 50 % des habitudes éligibles
 * ce jour-là sont complétées (aligné sur le filtre habitudes restantes du summary).
 */
import { dateToDayIndex } from './_dayIndex';

export const CHAIN_DAY_MIN_COMPLETION_RATIO = 0.5;

export interface HabitForChain {
  id: number;
  created_at?: string | null;
  total_days?: number | null;
}

export function habitEligibleOnSummaryDay(habit: HabitForChain, dayIdx: number): boolean {
  let habitStartIdx = 0;
  if (habit.created_at) {
    habitStartIdx = Math.max(0, dateToDayIndex(new Date(habit.created_at)));
  }
  if (dayIdx < habitStartIdx) return false;
  const td = habit.total_days;
  if (td != null && Number.isFinite(Number(td)) && dayIdx >= Number(td)) return false;
  return true;
}

export function dayQualifiesForChain(completedEligible: number, eligibleCount: number): boolean {
  if (eligibleCount <= 0) return false;
  return completedEligible / eligibleCount >= CHAIN_DAY_MIN_COMPLETION_RATIO;
}

export function dayQualifiesForNeverBreak(
  habits: HabitForChain[],
  dayIdx: number,
  progressRows: { habit_id: number; day_index: number }[],
): boolean {
  const completedHids = new Set(
    progressRows.filter((r) => r.day_index === dayIdx).map((r) => r.habit_id),
  );
  let eligible = 0;
  let done = 0;
  for (const h of habits) {
    if (!habitEligibleOnSummaryDay(h, dayIdx)) continue;
    eligible++;
    if (completedHids.has(h.id)) done++;
  }
  return dayQualifiesForChain(done, eligible);
}
