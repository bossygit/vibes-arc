export type SeedDomain =
    | 'abondance'
    | 'relations'
    | 'sante'
    | 'sagesse'
    | 'leadership'
    | 'spiritualite';

export type InnerQuality =
    | 'generosite'
    | 'discipline'
    | 'patience'
    | 'courage'
    | 'compassion'
    | 'clarte'
    | 'integrite'
    | 'joie';

export interface InnerQualities {
    generosite: number;
    discipline: number;
    patience: number;
    courage: number;
    compassion: number;
    clarte: number;
    integrite: number;
    joie: number;
}

export interface KarmicMorningSession {
    date: string;
    goal: string;
    partnerName: string;
    partnerGoal?: string;
    helpPlan: string;
    domain: SeedDomain;
    actionLog: string;
    actionDoneToday: boolean;
    meditationCompleted: boolean;
    karmaEarned: number;
    completedAt: string;
}

export interface KarmicFreeSeed {
    id: string;
    actionId: string;
    label: string;
    domain: SeedDomain;
    partnerName?: string;
    note?: string;
    karmaEarned: number;
    plantedAt: string;
}

export interface KarmicGardenState {
    version: 1;
    karmaTotal: number;
    qualities: InnerQualities;
    plotProgress: Record<SeedDomain, number>;
    morningSessions: KarmicMorningSession[];
    freeSeeds: KarmicFreeSeed[];
    lastLegendaryDate?: string;
    freeSeedKarmaToday?: { date: string; amount: number };
}

export interface FreeSeedAction {
    id: string;
    label: string;
    domain: SeedDomain;
    difficulty: 1 | 2 | 3;
    karmaReward: number;
    qualityGain: number;
    isLegendary?: boolean;
    requiresPartner?: boolean;
}

export interface DomainMeta {
    id: SeedDomain;
    label: string;
    emoji: string;
    colorClass: string;
    bgClass: string;
    borderClass: string;
    primaryQualities: InnerQuality[];
    secondaryQualities?: InnerQuality[];
}

export interface MorningDraft {
    goal: string;
    partnerName: string;
    partnerGoal: string;
    helpPlan: string;
    domain: SeedDomain;
    actionLog: string;
    actionDoneToday: boolean;
}
