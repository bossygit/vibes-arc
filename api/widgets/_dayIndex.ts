/** Même jour 0 que l’app web et que les widgets (1er octobre 2025). */

export const WIDGET_APP_START = new Date(2025, 9, 1);

export function dateToDayIndex(d: Date): number {
  const base = new Date(WIDGET_APP_START);
  base.setHours(0, 0, 0, 0);
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return Math.floor((copy.getTime() - base.getTime()) / 86_400_000);
}

export function todayDayIndex(): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const base = new Date(WIDGET_APP_START);
  base.setHours(0, 0, 0, 0);
  return Math.floor((now.getTime() - base.getTime()) / 86_400_000);
}

export function dayIndexToDate(idx: number): Date {
  const d = new Date(WIDGET_APP_START);
  d.setDate(d.getDate() + idx);
  return d;
}
