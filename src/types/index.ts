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
    view: 'dashboard' | 'identities' | 'addHabit' | 'habitDetail';
    selectedHabitId: number | null;
}

export type ViewType = 'dashboard' | 'identities' | 'addHabit' | 'habitDetail';
