export interface Identity {
    id: number;
    name: string;
    description?: string;
    createdAt: string;
}

export interface Habit {
    id: number;
    name: string;
    type: 'start' | 'stop';
    totalDays: number;
    linkedIdentities: number[];
    progress: boolean[];
    createdAt: string;
}

export interface HabitStats {
    completed: number;
    percentage: number;
    currentStreak: number;
    longestStreak: number;
    streaks: Streak[];
    totalDays: number;
}

export interface Streak {
    length: number;
    startDate: string;
    endDate: string;
}

export interface AppState {
    identities: Identity[];
    habits: Habit[];
    view: 'dashboard' | 'identities' | 'addHabit' | 'habitDetail' | 'rewards';
    selectedHabitId: number | null;
}

export type ViewType = 'dashboard' | 'identities' | 'addHabit' | 'habitDetail' | 'rewards';

// Extensions motivation/gamification
export interface Reward {
    id: number;
    title: string;
    cost: number; // points requis
    createdAt: string;
    claimedAt?: string;
}

export interface Challenge {
    id: number;
    title: string;
    targetDays: number; // objectif sur la semaine courante
    progressDays: number; // rempli dynamiquement
    weekStartISO: string; // ISO date du lundi de la semaine
    completedAt?: string;
}

export interface GamificationState {
    points: number;
    rewards: Reward[];
    challenges: Challenge[];
}

export type SkipsByHabit = Record<number, number[]>; // habitId -> liste d'index de jours sautés

export interface UserPrefs {
    notifHour: number; // 0..23
}

