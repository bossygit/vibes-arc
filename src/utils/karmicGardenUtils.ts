import { DOMAIN_META } from '@/data/karmicSeedCatalog';
import { KARMIC_LEVELS } from '@/data/karmicGardenLevels';
import type {
    FreeSeedAction,
    InnerQualities,
    KarmicGardenState,
    KarmicMorningSession,
    MorningDraft,
    SeedDomain,
} from '@/types/karmicGarden';

export const STORAGE_KEY = 'vibes-arc-karmic-garden';
export const KARMIC_HABIT_NAME = 'Jardin Karmique';
export const KARMIC_MILESTONE_KEY = 'karmic_management';

export function getTodayDateString(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

export function createEmptyQualities(): InnerQualities {
    return {
        generosite: 0,
        discipline: 0,
        patience: 0,
        courage: 0,
        compassion: 0,
        clarte: 0,
        integrite: 0,
        joie: 0,
    };
}

export function createInitialPlotProgress(): Record<SeedDomain, number> {
    return {
        abondance: 0,
        relations: 0,
        sante: 0,
        sagesse: 0,
        leadership: 0,
        spiritualite: 0,
    };
}

export function createInitialState(): KarmicGardenState {
    return {
        version: 1,
        karmaTotal: 0,
        qualities: createEmptyQualities(),
        plotProgress: createInitialPlotProgress(),
        morningSessions: [],
        freeSeeds: [],
    };
}

export function loadKarmicGardenState(): KarmicGardenState {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return createInitialState();
        const parsed = JSON.parse(raw) as KarmicGardenState;
        if (parsed.version !== 1) return createInitialState();
        return {
            ...createInitialState(),
            ...parsed,
            qualities: { ...createEmptyQualities(), ...parsed.qualities },
            plotProgress: { ...createInitialPlotProgress(), ...parsed.plotProgress },
        };
    } catch {
        return createInitialState();
    }
}

export function saveKarmicGardenState(state: KarmicGardenState): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getMorningSessionForDate(state: KarmicGardenState, date: string): KarmicMorningSession | undefined {
    return state.morningSessions.find((s) => s.date === date);
}

export function getPlotStage(seedCount: number): number {
    if (seedCount >= 100) return 5;
    if (seedCount >= 40) return 4;
    if (seedCount >= 15) return 3;
    if (seedCount >= 5) return 2;
    if (seedCount >= 1) return 1;
    return 0;
}

export function getKarmicLevel(karmaTotal: number): (typeof KARMIC_LEVELS)[number] {
    let level: (typeof KARMIC_LEVELS)[number] = KARMIC_LEVELS[0];
    for (const l of KARMIC_LEVELS) {
        if (karmaTotal >= l.threshold) level = l;
    }
    return level;
}

export function clampQuality(value: number): number {
    return Math.min(100, Math.max(0, value));
}

export function applyQualityGain(
    qualities: InnerQualities,
    domain: SeedDomain,
    amount: number
): InnerQualities {
    const meta = DOMAIN_META[domain];
    const next = { ...qualities };
    for (const q of meta.primaryQualities) {
        next[q] = clampQuality(next[q] + amount);
    }
    if (meta.secondaryQualities) {
        for (const q of meta.secondaryQualities) {
            next[q] = clampQuality(next[q] + Math.round(amount * 0.5));
        }
    }
    return next;
}

export function computeMorningKarma(draft: Pick<MorningDraft, 'actionDoneToday'>, meditationComplete: boolean): number {
    let karma = 15;
    if (draft.actionDoneToday) karma += 5;
    else karma = Math.round(karma * 0.5);
    if (meditationComplete) karma += 5;
    return karma;
}

export function computeFreeSeedKarma(
    state: KarmicGardenState,
    action: FreeSeedAction,
    today: string
): { karma: number; capped: boolean } {
    if (action.isLegendary && state.lastLegendaryDate === today) {
        return { karma: 0, capped: true };
    }

    const dayTracker = state.freeSeedKarmaToday?.date === today
        ? state.freeSeedKarmaToday.amount
        : 0;

    const remaining = Math.max(0, 30 - dayTracker);
    const karma = Math.min(action.karmaReward, remaining);
    return { karma, capped: karma < action.karmaReward };
}

export function completeMorningSession(
    state: KarmicGardenState,
    draft: MorningDraft,
    meditationCompleted: boolean
): KarmicGardenState {
    const today = getTodayDateString();
    if (getMorningSessionForDate(state, today)) return state;

    const karmaEarned = computeMorningKarma(draft, meditationCompleted);
    const session: KarmicMorningSession = {
        date: today,
        goal: draft.goal.trim(),
        partnerName: draft.partnerName.trim(),
        partnerGoal: draft.partnerGoal.trim() || undefined,
        helpPlan: draft.helpPlan.trim(),
        domain: draft.domain,
        actionLog: draft.actionLog.trim(),
        actionDoneToday: draft.actionDoneToday,
        meditationCompleted,
        karmaEarned,
        completedAt: new Date().toISOString(),
    };

    return {
        ...state,
        karmaTotal: state.karmaTotal + karmaEarned,
        qualities: applyQualityGain(state.qualities, draft.domain, 5),
        plotProgress: {
            ...state.plotProgress,
            [draft.domain]: state.plotProgress[draft.domain] + 1,
        },
        morningSessions: [...state.morningSessions, session],
    };
}

export function plantFreeSeed(
    state: KarmicGardenState,
    action: FreeSeedAction,
    partnerName?: string,
    note?: string,
    customLabel?: string
): { state: KarmicGardenState; karmaEarned: number } {
    const today = getTodayDateString();

    if (action.isLegendary && state.lastLegendaryDate === today) {
        return { state, karmaEarned: 0 };
    }

    const { karma: karmaEarned } = computeFreeSeedKarma(state, action, today);
    const qualityGain = karmaEarned > 0 ? action.qualityGain : action.qualityGain;

    const prevDayKarma =
        state.freeSeedKarmaToday?.date === today ? state.freeSeedKarmaToday.amount : 0;

    const seed = {
        id: `${Date.now()}-${action.id}`,
        actionId: action.id,
        label: customLabel || action.label,
        domain: action.domain,
        partnerName: partnerName?.trim() || undefined,
        note: note?.trim() || undefined,
        karmaEarned,
        plantedAt: new Date().toISOString(),
    };

    const next: KarmicGardenState = {
        ...state,
        karmaTotal: state.karmaTotal + karmaEarned,
        qualities: applyQualityGain(state.qualities, action.domain, qualityGain),
        plotProgress: {
            ...state.plotProgress,
            [action.domain]: state.plotProgress[action.domain] + 1,
        },
        freeSeeds: [...state.freeSeeds, seed],
        freeSeedKarmaToday: {
            date: today,
            amount: prevDayKarma + karmaEarned,
        },
        lastLegendaryDate: action.isLegendary ? today : state.lastLegendaryDate,
    };

    return { state: next, karmaEarned };
}

export function createCustomFreeSeedAction(label: string, domain: SeedDomain): FreeSeedAction {
    return {
        id: `custom-${Date.now()}`,
        label,
        domain,
        difficulty: 2,
        karmaReward: 8,
        qualityGain: 3,
        requiresPartner: true,
    };
}
