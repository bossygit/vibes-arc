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
    /**
     * Index (par rapport à `startDate` dans `dateUtils`) à partir duquel l’habitude devient “active”.
     * Si absent (données historiques), on le déduit de `createdAt`.
     */
    startDayIndex?: number;
    /** Clé logique pour le système de milestones (ex: meditation, gratitude) */
    milestoneKey?: string;
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
    view: 'dashboard' | 'identities' | 'addHabit' | 'habitDetail' | 'rewards' | 'templates' | 'magicGratitude' | 'moneyMindset' | 'focusWheel' | 'priming' | 'environment' | 'manifestation' | 'coachChat' | 'accountSettings' | 'karmicGarden' | 'voieControle' | 'focusHold' | 'tribunal' | 'moodCheckin';
    selectedHabitId: number | null;
}

export type ViewType = 'dashboard' | 'identities' | 'addHabit' | 'habitDetail' | 'rewards' | 'templates' | 'magicGratitude' | 'moneyMindset' | 'focusWheel' | 'priming' | 'environment' | 'manifestation' | 'coachChat' | 'accountSettings' | 'innerChild' | 'karmicGarden' | 'voieControle' | 'focusHold' | 'tribunal' | 'moodCheckin';

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

// ===== Milestones =====

export type MilestoneDomain = 'routine' | 'health' | 'manifestation';

export type MilestoneType =
    | 'streak'
    | 'same_day_combo'
    | 'parallel_combo'
    | 'identity_score'
    | 'weekly_frequency'
    | 'identity_composite';

export interface ParallelComboRule {
    habitKey: string;
    minStreak: number;
}

export interface MilestoneDefinition {
    id: string;
    title: string;
    description: string;
    domain: MilestoneDomain;
    /** Patterns pour matcher une identité par nom (insensible à la casse) */
    identityNameMatch?: string[];
    type: MilestoneType;
    threshold: number;
    habitKeys: string[];
    parallelRules?: ParallelComboRule[];
    weeklyMinPerWeek?: number;
    weeklyWeeks?: number;
    emoji: string;
    celebrationMessage?: string;
    telegramMessage?: string;
}

export type MilestoneStatus = 'locked' | 'in_progress' | 'achieved';

export interface MilestoneAchievement {
    milestoneId: string;
    achievedAt: string;
    notifiedAt?: string;
}

export interface MilestoneProgress {
    definition: MilestoneDefinition;
    current: number;
    target: number;
    percent: number;
    status: MilestoneStatus;
    achievedAt?: string;
    identityName?: string;
}

export interface PendingMilestoneCelebration {
    title: string;
    message: string;
    emoji: string;
    milestoneId: string;
}

// ============================================================
// VIBES ARC v2 — Tribunal de la Vie + Nature Vibratoire
// Architecture : Désir → Identité → Signaux → Preuves → Score
// ============================================================

// ---- Désir ----

export type DesireType = 'avoir' | 'être';

export interface Desire {
    id: number;
    title: string;                    // "Générer 10 000 000 FCFA" | "Être en paix avec mon passé"
    type: DesireType;
    description?: string;
    target?: string;                  // Valeur mesurable (ex: "10 000 000 FCFA")
    linkedIdentityId: number;         // L'identité requise pour recevoir ce désir
    createdAt: string;
}

// ---- Fréquence vibratoire (Esther Hicks) ----

export type EmotionalFrequency = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
// 1-3 : Résistance (peur, colère, dépression, insécurité)
// 4-6 : Neutre (ennui, contentement tiède)
// 7-8 : Alignement (espoir, optimisme, croyance)
// 9-10: Plein alignement (joie, gratitude, appréciation, amour)

export const EMOTIONAL_LABELS: Record<EmotionalFrequency, string> = {
    1: 'Désespoir',
    2: 'Peur / Insécurité',
    3: 'Colère / Frustration',
    4: 'Découragement',
    5: 'Inquiétude',
    6: 'Contentement tiède',
    7: 'Espoir',
    8: 'Optimisme / Croyance',
    9: 'Joie / Passion',
    10: 'Gratitude / Amour',
};

export function isAligned(score: EmotionalFrequency): boolean {
    return score >= 7;
}

export function isResisting(score: EmotionalFrequency): boolean {
    return score <= 3;
}

// ---- Check-in vibratoire quotidien ----

export interface DailyMood {
    id: number;
    date: string;                    // ISO date (YYYY-MM-DD)
    score: EmotionalFrequency;       // 1-10
    dominantEmotion?: string;        // "anxiété", "gratitude", "frustration"...
    notes?: string;
    createdAt: string;
}

// ---- Accusateur (anti-habitude) ----

export interface Accuser {
    id: number;
    name: string;                    // "Scrolling avant de dormir", "Dépense impulsive"
    linkedDesireId: number;
    totalDays: number;
    progress: boolean[];             // true = l'accusation a eu lieu ce jour-là
    createdAt: string;
    startDayIndex?: number;
}

// ---- Preuves du jour (par Désir) ----

export interface DailyEvidence {
    date: string;                     // ISO date
    desireId: number;
    signalsCompleted: number;         // Nombre de signaux cochés
    signalsTotal: number;             // Nombre total de signaux
    moodScore: EmotionalFrequency;   // Fréquence vibratoire du jour
    accusatorsActive: number;         // Nombre d'accusateurs actifs
    isAligned: boolean;              // moodScore >= 7
}

// ---- Score de crédibilité (par Désir) ----

export type Verdict = 'favorable' | 'mitigé' | 'défavorable';

export interface CredibilityScore {
    desireId: number;
    actionScore: number;              // % de signaux complétés (0-100)
    alignmentScore: number;           // % de jours alignés (mood >= 7)
    accuserPenalty: number;           // % de jours avec accusateurs actifs (0-100)
    total: number;                    // Score composite (0-100)
    verdict: Verdict;                 // favorable: >=70 | mitigé: 40-69 | défavorable: <40
    periodDays: number;               // Nombre de jours analysés
}

export function getVerdict(total: number): Verdict {
    if (total >= 70) return 'favorable';
    if (total >= 40) return 'mitigé';
    return 'défavorable';
}

export const VERDICT_LABELS: Record<Verdict, string> = {
    favorable: 'Dossier solide — le Tribunal penche en ta faveur',
    mitigé: 'Dossier incomplet — le Tribunal attend plus de preuves',
    défavorable: 'Dossier faible — les accusateurs dominent',
};

// ---- Vue "Tribunal" (dashboard par Désir) ----

export interface DesireDashboard {
    desire: Desire;
    identityName: string;
    signals: { id: number; name: string; streak: number; completionRate: number }[];
    accusators: { id: number; name: string; activeDays: number }[];
    credibility: CredibilityScore;
    recentEvidence: DailyEvidence[];   // 7 derniers jours
}

