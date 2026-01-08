export interface Identity {
    id: number;
    name: string;
    description?: string;
    color: string;
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
    view: 'dashboard' | 'identities' | 'addHabit' | 'habitDetail' | 'rewards' | 'templates' | 'magicGratitude' | 'moneyMindset' | 'focusWheel' | 'priming' | 'environment';
    selectedHabitId: number | null;
}

export type ViewType = 'dashboard' | 'identities' | 'addHabit' | 'habitDetail' | 'rewards' | 'templates' | 'magicGratitude' | 'moneyMindset' | 'focusWheel' | 'priming' | 'environment';

// ===== Priming My Brain (système nerveux) =====

export type NervousSystemState = 'calme' | 'tension' | 'agitation' | 'shutdown';

export interface PrimingTemplate {
    id: string;
    title: string;
    durationMin: number; // 3..10
    intent: 'sécurité' | 'focus' | 'discipline' | 'sobriété' | 'abondance';
    steps: string[];
    safetyNote?: string;
}

export interface PrimingSession {
    id: string;
    createdAt: string; // ISO
    templateId: string;
    templateTitle: string;
    durationMin: number;
    goal?: string; // ex: 5 000 000 FCFA
    identityId?: number;
    identityName?: string;
    preState: NervousSystemState;
    preIntensity: number; // 0..4
    postState: NervousSystemState;
    postIntensity: number; // 0..4
    nextAction?: string; // prochaine action business (2 minutes)
    notes?: string;
}

// ===== Design de l'environnement =====

export type EnvironmentRiskLevel = 0 | 1 | 2 | 3 | 4; // 0 = neutre, 4 = très risqué (déclencheurs)

export interface EnvironmentMap {
    id: string;
    name: string; // ex: Lit, Bureau, Téléphone
    room?: string; // ex: Chambre, Salon
    riskLevel: EnvironmentRiskLevel;
    createdAt: string; // ISO
    updatedAt: string; // ISO
    desiredBehaviors: string[]; // comportements souhaités
    avoidBehaviors: string[]; // comportements à éviter
    transitionRituals: string[]; // rituels courts (30-120s)
    notes?: string;
}

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

export type NotificationChannel = 'none' | 'telegram' | 'whatsapp';

export interface UserPrefs {
    notifEnabled: boolean;
    notifHour: number; // 0..23
    notifTimezone: string;
    notifChannel: NotificationChannel;
    telegramChatId?: string;
    telegramUsername?: string;
    whatsappNumber?: string;
    weeklyEmailEnabled: boolean;
    weeklyEmailDay: number; // 0 = dimanche, 1 = lundi, ..., 6 = samedi
    weeklyEmailHour: number; // heure d'envoi (0-23)
    lastNotifSentAt?: string;
}

export interface HabitTemplate {
    id: string;
    name: string;
    type: 'start' | 'stop';
    category: 'screens' | 'substances' | 'movement' | 'connection' | 'routine';
    description: string;
    suggestedDuration: number[];
    advice: string[];
    difficulty: 'easy' | 'medium' | 'hard';
    icon: string;
}

export interface IdentityTemplate {
    id: string;
    name: string;
    author: string;
    book?: string;
    description: string;
    coreBeliefs: string[];
    dailyPractices: string[];
    habits: string[];
    quotes: string[];
    color: string;
    icon: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
}

