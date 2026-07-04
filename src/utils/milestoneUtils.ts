import type { Habit, Identity, MilestoneAchievement, MilestoneDefinition, MilestoneProgress } from '@/types';
import { resolveHabitKey } from '@/data/habitKeyAliases';
import { MILESTONE_DEFINITIONS } from '@/data/milestoneDefinitions';
import { calculateHabitStats, calculateIdentityScore, getHabitStartDayIndex, getCurrentDayIndex } from '@/utils/habitUtils';
import { getDateForDay } from '@/utils/dateUtils';
import { startOfWeek, getWeek } from 'date-fns';

type HabitByKey = Map<string, Habit>;

function buildHabitByKey(habits: Habit[]): HabitByKey {
    const map = new Map<string, Habit>();
    for (const habit of habits) {
        const key = resolveHabitKey(habit);
        if (key && !map.has(key)) {
            map.set(key, habit);
        }
    }
    return map;
}

function findIdentityByNameMatch(identities: Identity[], patterns?: string[]): Identity | undefined {
    if (!patterns?.length) return undefined;
    return identities.find((id) => {
        const name = id.name.toLowerCase();
        return patterns.some((p) => name.includes(p.toLowerCase()));
    });
}

function achievementMap(achievements: MilestoneAchievement[]): Map<string, MilestoneAchievement> {
    return new Map(achievements.map((a) => [a.milestoneId, a]));
}

export function evaluateStreak(
    habitByKey: HabitByKey,
    habitKeys: string[],
    threshold: number,
    skipsByHabit: Record<number, number[]> = {}
): { current: number; target: number; achieved: boolean } {
    const habit = habitKeys.map((k) => habitByKey.get(k)).find(Boolean);
    if (!habit) return { current: 0, target: threshold, achieved: false };
    const stats = calculateHabitStats(habit, skipsByHabit[habit.id] || []);
    return {
        current: stats.currentStreak,
        target: threshold,
        achieved: stats.currentStreak >= threshold,
    };
}

export function evaluateSameDayCombo(
    habits: Habit[],
    habitByKey: HabitByKey,
    habitKeys: string[],
    threshold: number
): { current: number; target: number; achieved: boolean } {
    const comboHabits = habitKeys.map((k) => habitByKey.get(k)).filter((h): h is Habit => !!h);
    if (comboHabits.length < habitKeys.length) {
        return { current: 0, target: threshold, achieved: false };
    }

    const startIdx = Math.max(...comboHabits.map(getHabitStartDayIndex));
    const todayIdx = getCurrentDayIndex();
    let currentCombo = 0;

    for (let i = todayIdx; i >= startIdx; i--) {
        const allDone = comboHabits.every((h) => i < h.progress.length && h.progress[i]);
        if (allDone) currentCombo++;
        else break;
    }

    return {
        current: currentCombo,
        target: threshold,
        achieved: currentCombo >= threshold,
    };
}

export function evaluateParallelCombo(
    habitByKey: HabitByKey,
    rules: { habitKey: string; minStreak: number }[],
    skipsByHabit: Record<number, number[]> = {}
): { current: number; target: number; achieved: boolean; percent: number } {
    if (!rules.length) return { current: 0, target: 1, achieved: false, percent: 0 };

    const ratios: number[] = [];
    for (const rule of rules) {
        const habit = habitByKey.get(rule.habitKey);
        if (!habit) {
            ratios.push(0);
            continue;
        }
        const stats = calculateHabitStats(habit, skipsByHabit[habit.id] || []);
        ratios.push(Math.min(1, stats.currentStreak / rule.minStreak));
    }

    const minRatio = Math.min(...ratios);
    const achieved = ratios.every((r) => r >= 1);

    return {
        current: achieved ? 1 : 0,
        target: 1,
        achieved,
        percent: Math.round(minRatio * 100),
    };
}

export function evaluateIdentityScore(
    identities: Identity[],
    habits: Habit[],
    patterns: string[] | undefined,
    threshold: number
): { current: number; target: number; achieved: boolean; identityName?: string } {
    const identity = findIdentityByNameMatch(identities, patterns);
    if (!identity) return { current: 0, target: threshold, achieved: false };
    const score = calculateIdentityScore(identity.id, habits);
    return {
        current: score,
        target: threshold,
        achieved: score >= threshold,
        identityName: identity.name,
    };
}

export function evaluateWeeklyFrequency(
    habitByKey: HabitByKey,
    habitKey: string,
    minPerWeek: number,
    weeks: number
): { current: number; target: number; achieved: boolean } {
    const habit = habitByKey.get(habitKey);
    if (!habit) return { current: 0, target: weeks, achieved: false };

    const todayIdx = getCurrentDayIndex();
    const startIdx = getHabitStartDayIndex(habit);

    const weekCounts = new Map<string, number>();
    for (let i = startIdx; i <= todayIdx && i < habit.progress.length; i++) {
        if (!habit.progress[i]) continue;
        const date = getDateForDay(i);
        const weekKey = `${getWeek(date, { weekStartsOn: 1 })}-${date.getFullYear()}`;
        weekCounts.set(weekKey, (weekCounts.get(weekKey) ?? 0) + 1);
    }

    let consecutiveQualified = 0;
    const today = getDateForDay(todayIdx);
    for (let w = 0; w < 52; w++) {
        const d = startOfWeek(today, { weekStartsOn: 1 });
        d.setDate(d.getDate() - w * 7);
        const weekKey = `${getWeek(d, { weekStartsOn: 1 })}-${d.getFullYear()}`;
        const count = weekCounts.get(weekKey) ?? 0;
        if (count >= minPerWeek) consecutiveQualified++;
        else break;
    }

    return {
        current: consecutiveQualified,
        target: weeks,
        achieved: consecutiveQualified >= weeks,
    };
}

function resolveProgressStatus(
    achieved: boolean,
    current: number,
    alreadyAchieved: boolean
): MilestoneProgress['status'] {
    if (achieved || alreadyAchieved) return 'achieved';
    if (current > 0) return 'in_progress';
    return 'locked';
}

function evaluateDefinition(
    def: MilestoneDefinition,
    habits: Habit[],
    identities: Identity[],
    habitByKey: HabitByKey,
    achievements: Map<string, MilestoneAchievement>,
    skipsByHabit: Record<number, number[]> = {}
): MilestoneProgress {
    const existing = achievements.get(def.id);
    let current = 0;
    let target = def.threshold;
    let achieved = false;
    let percent = 0;
    let identityName: string | undefined;

    switch (def.type) {
        case 'streak': {
            const r = evaluateStreak(habitByKey, def.habitKeys, def.threshold, skipsByHabit);
            current = r.current;
            target = r.target;
            achieved = r.achieved;
            percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
            break;
        }
        case 'same_day_combo': {
            const r = evaluateSameDayCombo(habits, habitByKey, def.habitKeys, def.threshold);
            current = r.current;
            target = r.target;
            achieved = r.achieved;
            percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
            break;
        }
        case 'parallel_combo':
        case 'identity_composite': {
            const rules = def.parallelRules ?? def.habitKeys.map((k) => ({ habitKey: k, minStreak: def.threshold }));
            const r = evaluateParallelCombo(habitByKey, rules, skipsByHabit);
            current = r.current;
            target = r.target;
            achieved = r.achieved;
            percent = r.percent;
            break;
        }
        case 'identity_score': {
            const r = evaluateIdentityScore(identities, habits, def.identityNameMatch, def.threshold);
            current = r.current;
            target = r.target;
            achieved = r.achieved;
            identityName = r.identityName;
            percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
            break;
        }
        case 'weekly_frequency': {
            const key = def.habitKeys[0];
            const minPerWeek = def.weeklyMinPerWeek ?? 3;
            const weeks = def.weeklyWeeks ?? def.threshold;
            const r = evaluateWeeklyFrequency(habitByKey, key, minPerWeek, weeks);
            current = r.current;
            target = r.target;
            achieved = r.achieved;
            percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
            break;
        }
    }

    const wasAchieved = !!existing;
    const isNowAchieved = achieved && !wasAchieved ? true : wasAchieved || achieved;

    return {
        definition: def,
        current,
        target,
        percent: isNowAchieved ? 100 : percent,
        status: resolveProgressStatus(achieved, current, wasAchieved),
        achievedAt: existing?.achievedAt,
        identityName,
    };
}

export function evaluateMilestones(
    habits: Habit[],
    identities: Identity[],
    achievements: MilestoneAchievement[] = [],
    skipsByHabit: Record<number, number[]> = {}
): MilestoneProgress[] {
    const habitByKey = buildHabitByKey(habits);
    const achMap = achievementMap(achievements);
    return MILESTONE_DEFINITIONS.map((def) =>
        evaluateDefinition(def, habits, identities, habitByKey, achMap, skipsByHabit)
    );
}

export function detectNewAchievements(
    before: MilestoneProgress[],
    after: MilestoneProgress[]
): MilestoneProgress[] {
    const beforeIds = new Set(before.filter((p) => p.status === 'achieved').map((p) => p.definition.id));
    return after.filter((p) => p.status === 'achieved' && !beforeIds.has(p.definition.id));
}

export function getNextMilestoneInDomain(
    progress: MilestoneProgress[],
    domain: MilestoneDefinition['domain']
): MilestoneProgress | undefined {
    return progress
        .filter((p) => p.definition.domain === domain && p.status !== 'achieved')
        .sort((a, b) => b.percent - a.percent)[0];
}

export function getMilestonesForIdentity(
    progress: MilestoneProgress[],
    identity: Identity
): MilestoneProgress[] {
    const name = identity.name.toLowerCase();
    return progress.filter((p) => {
        const patterns = p.definition.identityNameMatch;
        if (!patterns?.length) return false;
        return patterns.some((pat) => name.includes(pat.toLowerCase()));
    });
}

export function getIdentityMilestoneSummary(
    identities: Identity[],
    progress: MilestoneProgress[]
): { identity: Identity; milestones: MilestoneProgress[]; achievedCount: number; totalCount: number }[] {
    return identities
        .map((identity) => {
            const milestones = getMilestonesForIdentity(progress, identity);
            if (milestones.length === 0) return null;
            return {
                identity,
                milestones,
                achievedCount: milestones.filter((m) => m.status === 'achieved').length,
                totalCount: milestones.length,
            };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null);
}
