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

/**
 * Returns true if at least one habit active on that day has completed it.
 */
function isDayCompleted(habits: Habit[], dayIndex: number): boolean {
  if (dayIndex < 0) return false;
  return habits.some(
    (habit) => isHabitActiveOnDay(habit, dayIndex) && !!habit.progress[dayIndex]
  );
}

/**
 * Never Break the Chain: same logic as widgets API.
 * Computes calendar (last 14 days), chain length, status, and pressure from habits + todayIdx.
 */
export function computeChain(habits: Habit[], todayIdx: number): ChainData {
  const calendar: { date: string; completed: boolean }[] = [];
  for (let i = 0; i < CHAIN_WINDOW_DAYS; i++) {
    const idx = todayIdx - (CHAIN_WINDOW_DAYS - 1) + i;
    const date = getDateForDay(idx).toISOString().slice(0, 10);
    const completed = isDayCompleted(habits, idx);
    calendar.push({ date, completed });
  }

  let length = 0;
  for (let i = 0; i < CHAIN_WINDOW_DAYS; i++) {
    const idx = todayIdx - i;
    if (idx < 0) break;
    if (!isDayCompleted(habits, idx)) break;
    length++;
  }

  const todayCompleted = isDayCompleted(habits, todayIdx);
  const pressure = length >= 3 && !todayCompleted;

  return {
    calendar,
    length,
    status: getChainStatus(length),
    pressure,
  };
}
