import type { VercelRequest, VercelResponse } from '@vercel/node';
import { addDays } from 'date-fns';
import { getServiceSupabase } from '../push/_supabase';
import { generatePsychologicalInsight, getDefaultPsychology } from './psychologyEngine';

// Duplicated from app dateUtils/habitUtils to avoid @/ resolution issues in Vercel serverless
const startDate = new Date(2025, 9, 1); // October 1, 2025
const getDateForDay = (dayIndex: number): Date => addDays(startDate, dayIndex);
const getCurrentDayIndex = (): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const diffTime = today.getTime() - start.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};
import { generateFutureSelf, getDefaultFutureSelf } from './futureSelfEngine';
import { generateDopamineReward, getDefaultReward } from './dopamineRewardEngine';
import { generateLockScreenTrigger, getDefaultTrigger } from './lockScreenTriggerEngine';

interface WidgetSummaryResponse {
  today: string;
  streaks: {
    longest: number;
    current: number;
    byHabit: { habitId: number; name: string; current: number; longest: number }[];
  };
  todayRemaining: {
    count: number;
    habits: { habitId: number; name: string; type: 'start' | 'stop' }[];
  };
  monthlyScore: {
    month: string;
    score: number;
    completedDays: number;
    totalDaysWithHabits: number;
  };
  weeklyStats: {
    weekStart: string;
    completionRate: number;
    days: { date: string; rate: number }[];
  };
  insight: {
    title: string;
    message: string;
  };
  psychology?: {
    level: { number: number; name: string };
    insight: { title: string; message: string; tone: string; emoji: string };
    streakPressure: boolean;
  };
  chain?: {
    length: number;
    status: 'broken' | 'fragile' | 'stable' | 'strong';
    pressure: boolean;
    calendar: { date: string; completed: boolean }[];
  };
  futureSelf?: {
    nextLevel: { name: string; daysRemaining: number };
    projectedStreak: { in7days: number; in30days: number };
    message: { title: string; message: string; emoji: string };
  };
  reward?: {
    rewardType: string;
    rewardLevel: 'low' | 'medium' | 'high' | 'epic';
    title: string;
    message: string;
    emoji: string;
  };
  trigger?: {
    title: string;
    message: string;
    emoji: string;
    strength: 'light' | 'medium' | 'strong';
  };
}

function dateToDayIndex(d: Date): number {
  const base = new Date(startDate);
  base.setHours(0, 0, 0, 0);
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return Math.floor((copy.getTime() - base.getTime()) / (1000 * 60 * 60 * 24));
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = dimanche, 1 = lundi
  const diff = (day === 0 ? -6 : 1 - day); // ramener au lundi
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

const CHAIN_WINDOW_DAYS = 14;

function getChainStatus(length: number): 'broken' | 'fragile' | 'stable' | 'strong' {
  if (length === 0) return 'broken';
  if (length <= 3) return 'fragile';
  if (length <= 10) return 'stable';
  return 'strong';
}

function buildEmptySummary(today: Date): WidgetSummaryResponse {
  const todayISO = today.toISOString().slice(0, 10);
  const monthKey = today.toISOString().slice(0, 7);
  const weekStart = getWeekStart(today).toISOString().slice(0, 10);
  const psychology = getDefaultPsychology();
  const futureSelf = getDefaultFutureSelf();
  const reward = getDefaultReward();
  const trigger = getDefaultTrigger();
  const todayIdx = dateToDayIndex(today);
  const emptyCalendar: { date: string; completed: boolean }[] = [];
  for (let i = 0; i < CHAIN_WINDOW_DAYS; i++) {
    const idx = todayIdx - (CHAIN_WINDOW_DAYS - 1) + i;
    const date = getDateForDay(idx).toISOString().slice(0, 10);
    emptyCalendar.push({ date, completed: false });
  }
  return {
    today: todayISO,
    streaks: { longest: 0, current: 0, byHabit: [] },
    todayRemaining: { count: 0, habits: [] },
    monthlyScore: { month: monthKey, score: 0, completedDays: 0, totalDaysWithHabits: 0 },
    weeklyStats: { weekStart, completionRate: 0, days: [] },
    insight: { title: psychology.insight.title, message: psychology.insight.message },
    psychology: {
      level: psychology.level,
      insight: psychology.insight,
      streakPressure: psychology.streakPressure,
    },
    chain: { length: 0, status: 'broken', pressure: false, calendar: emptyCalendar },
    futureSelf,
    reward,
    trigger,
  };
}

function computeStreaksForHabit(completedDays: number[], todayIdx: number, windowSize = 60) {
  if (completedDays.length === 0) return { current: 0, longest: 0 };
  const set = new Set(completedDays);

  // streak courant : remonter à partir d’aujourd’hui
  let current = 0;
  for (let i = todayIdx; i > todayIdx - windowSize && i >= 0; i--) {
    if (set.has(i)) {
      current++;
    } else {
      break;
    }
  }

  // plus long streak dans la fenêtre
  const filtered = completedDays.filter((d) => d >= todayIdx - windowSize && d <= todayIdx).sort((a, b) => a - b);
  let longest = 0;
  let temp = 0;
  let prev: number | null = null;
  for (const d of filtered) {
    if (prev === null || d === prev + 1) {
      temp++;
    } else {
      if (temp > longest) longest = temp;
      temp = 1;
    }
    prev = d;
  }
  if (temp > longest) longest = temp;

  return { current, longest };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const deviceId = (req.query.deviceId as string | undefined)?.trim();
  if (!deviceId) {
    return res.status(400).json({ error: 'Missing deviceId query parameter' });
  }

  const today = new Date();
  const todayIdx = getCurrentDayIndex();
  if (todayIdx < 0) {
    return res.status(200).json(buildEmptySummary(today));
  }

  let supabase;
  try {
    supabase = getServiceSupabase();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Supabase configuration error';
    return res.status(503).json({
      error: 'Service unavailable',
      detail: msg.includes('Missing') ? 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in Vercel environment.' : msg,
    });
  }

  // 1) Associer device -> user (ou créer entrée anonyme)
  const { data: existingDevice, error: deviceError } = await supabase
    .from('device_widgets')
    .select('user_id')
    .eq('device_id', deviceId)
    .maybeSingle();

  if (deviceError) {
    return res.status(500).json({ error: 'Failed to read device mapping' });
  }

  let userId = existingDevice?.user_id as string | null | undefined;

  if (!existingDevice) {
    const { error: insertError } = await supabase
      .from('device_widgets')
      .insert({ device_id: deviceId })
      .single();
    if (insertError) {
      return res.status(500).json({ error: 'Failed to register device' });
    }
  }

  if (!userId) {
    // Device encore non lié à un utilisateur → payload neutre
    return res.status(200).json(buildEmptySummary(today));
  }

  // 2) Charger les habitudes de l’utilisateur
  const { data: habits, error: habitsError } = await supabase
    .from('habits')
    .select('id, name, type, total_days, created_at')
    .eq('user_id', userId);

  if (habitsError) {
    return res.status(500).json({ error: 'Failed to load habits' });
  }

  if (!habits || habits.length === 0) {
    return res.status(200).json(buildEmptySummary(today));
  }

  const habitIds = habits.map((h) => h.id);

  // Fenêtres temporelles
  const monthStartDate = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEndDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const monthStartIdx = Math.max(0, dateToDayIndex(monthStartDate));
  const monthEndIdx = Math.max(monthStartIdx, dateToDayIndex(monthEndDate));

  const weekStartDate = getWeekStart(today);
  const weekStartIdx = Math.max(0, dateToDayIndex(weekStartDate));
  const weekEndIdx = Math.min(todayIdx, weekStartIdx + 6);

  const historyStartIdx = Math.max(0, Math.min(weekStartIdx, monthStartIdx, todayIdx - 60));
  const historyEndIdx = todayIdx;

  // 3) Charger la progression sur la fenêtre utile
  const { data: progressRows, error: progressError } = await supabase
    .from('habit_progress')
    .select('habit_id, day_index, completed')
    .in('habit_id', habitIds)
    .gte('day_index', historyStartIdx)
    .lte('day_index', historyEndIdx)
    .eq('completed', true);

  if (progressError) {
    return res.status(500).json({ error: 'Failed to load habit progress' });
  }

  const completedByHabit = new Map<number, number[]>();
  const completedByDay = new Map<number, number>();

  for (const row of progressRows || []) {
    const days = completedByHabit.get(row.habit_id) || [];
    days.push(row.day_index);
    completedByHabit.set(row.habit_id, days);

    completedByDay.set(row.day_index, (completedByDay.get(row.day_index) || 0) + 1);
  }

  // 4) Streaks par habitude
  let globalCurrent = 0;
  let globalLongest = 0;
  const byHabit: { habitId: number; name: string; current: number; longest: number }[] = [];

  for (const habit of habits) {
    const days = (completedByHabit.get(habit.id) || []).sort((a, b) => a - b);
    const { current, longest } = computeStreaksForHabit(days, todayIdx);
    if (current > 0 || longest > 0) {
      byHabit.push({ habitId: habit.id, name: habit.name, current, longest });
    }
    if (current > globalCurrent) globalCurrent = current;
    if (longest > globalLongest) globalLongest = longest;
  }

  byHabit.sort((a, b) => b.current - a.current || b.longest - a.longest);

  // 5) Habitudes restantes aujourd’hui
  const todayRemainingHabits: { habitId: number; name: string; type: 'start' | 'stop' }[] = [];
  const todayHasCompletion = new Set<number>();
  for (const row of progressRows || []) {
    if (row.day_index === todayIdx) {
      todayHasCompletion.add(row.habit_id);
    }
  }

  for (const habit of habits) {
    const createdAt = new Date(habit.created_at);
    const habitStartIdx = Math.max(0, dateToDayIndex(createdAt));
    if (todayIdx < habitStartIdx || todayIdx >= habit.total_days) continue;
    if (!todayHasCompletion.has(habit.id)) {
      todayRemainingHabits.push({ habitId: habit.id, name: habit.name, type: habit.type });
    }
  }

  // 6) Score mensuel
  let monthlyCompleted = 0;
  const monthlyDays = new Set<number>();
  for (const [dayIndex, count] of completedByDay.entries()) {
    if (dayIndex >= monthStartIdx && dayIndex <= monthEndIdx) {
      monthlyCompleted += count;
      monthlyDays.add(dayIndex);
    }
  }

  const daysUpToTodayInMonth = Math.max(
    0,
    Math.min(todayIdx, monthEndIdx) - monthStartIdx + 1,
  );

  const monthlyScore = {
    month: today.toISOString().slice(0, 7),
    score: monthlyCompleted,
    completedDays: monthlyDays.size,
    totalDaysWithHabits: habits.length > 0 ? daysUpToTodayInMonth : 0,
  };

  // 7) Stats hebdo
  const weekDays: { date: string; rate: number }[] = [];
  let sumRates = 0;
  let rateCount = 0;
  const habitCount = habits.length || 1;

  for (let idx = weekStartIdx; idx <= weekEndIdx; idx++) {
    const date = getDateForDay(idx);
    const completedCount = completedByDay.get(idx) || 0;
    const rate = Math.round((completedCount / habitCount) * 100);
    weekDays.push({ date: date.toISOString().slice(0, 10), rate });
    sumRates += rate;
    rateCount++;
  }

  const weeklyStats = {
    weekStart: getWeekStart(today).toISOString().slice(0, 10),
    completionRate: rateCount > 0 ? Math.round(sumRates / rateCount) : 0,
    days: weekDays,
  };

  // Never Break the Chain: last 14 days, O(CHAIN_WINDOW_DAYS)
  const chainCalendar: { date: string; completed: boolean }[] = [];
  for (let i = 0; i < CHAIN_WINDOW_DAYS; i++) {
    const idx = todayIdx - (CHAIN_WINDOW_DAYS - 1) + i;
    const date = getDateForDay(idx).toISOString().slice(0, 10);
    const completed = (completedByDay.get(idx) ?? 0) >= 1;
    chainCalendar.push({ date, completed });
  }
  let chainLength = 0;
  for (let i = 0; i < CHAIN_WINDOW_DAYS; i++) {
    const idx = todayIdx - i;
    if (idx < 0) break;
    if ((completedByDay.get(idx) ?? 0) < 1) break;
    chainLength++;
  }
  const todayCompleted = (completedByDay.get(todayIdx) ?? 0) >= 1;
  const chainPressure = chainLength >= 3 && !todayCompleted;
  const chain = {
    length: chainLength,
    status: getChainStatus(chainLength),
    pressure: chainPressure,
    calendar: chainCalendar,
  };

  const summary: WidgetSummaryResponse = {
    today: today.toISOString().slice(0, 10),
    streaks: {
      longest: globalLongest,
      current: globalCurrent,
      byHabit: byHabit.slice(0, 5),
    },
    todayRemaining: {
      count: todayRemainingHabits.length,
      habits: todayRemainingHabits.slice(0, 8),
    },
    monthlyScore,
    weeklyStats,
    insight: { title: '', message: '' },
    chain,
  };

  const psychology = generatePsychologicalInsight({
    currentStreak: summary.streaks.current,
    longestStreak: summary.streaks.longest,
    completionRate: summary.weeklyStats.completionRate,
    todayRemaining: summary.todayRemaining.count,
    monthlyScore: summary.monthlyScore.completedDays,
    chainPressure: chain.pressure,
    chainLength: chain.length,
  });
  summary.psychology = psychology;
  summary.insight = { title: psychology.insight.title, message: psychology.insight.message };

  const futureSelf = generateFutureSelf({
    currentStreak: summary.streaks.current,
    longestStreak: summary.streaks.longest,
    completionRate: summary.weeklyStats.completionRate,
  });
  summary.futureSelf = futureSelf;

  const allHabitsCompletedToday = todayCompleted && summary.todayRemaining.count === 0;
  const chainProtected = todayCompleted && chain.length >= 3;
  const reward = generateDopamineReward({
    habitCompletedToday: todayCompleted,
    allHabitsCompletedToday,
    currentStreak: summary.streaks.current,
    chainLength: chain.length,
    chainProtected,
    weeklyCompletionRate: summary.weeklyStats.completionRate,
    dayOfWeek: today.getDay(),
  });
  summary.reward = reward;

  const trigger = generateLockScreenTrigger({
    todayRemaining: summary.todayRemaining.count,
    chainLength: chain.length,
    chainPressure: chain.pressure,
    currentStreak: summary.streaks.current,
  });
  summary.trigger = trigger;

  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=60');
  return res.status(200).json(summary);
}

