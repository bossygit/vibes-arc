import { create } from 'zustand';
import { Identity, Habit, ViewType, SkipsByHabit, GamificationState, Reward, UserPrefs, NotificationChannel, PrimingSession, EnvironmentMap, MilestoneAchievement, PendingMilestoneCelebration, Desire, DailyMood, Accuser, EmotionalFrequency, LifeExperiment, ExperimentDayEntry, ExperimentStatus, SegmentIntendingEntry, SegmentIntendingDraft, JournalEntry } from '@/types';
import { ComputedTargets, FoodEntry, FoodEntryDraft, MealType, NutrientKey, NutritionProfile } from '@/types/nutrition';
import SupabaseDatabaseClient from '@/database/supabase-client';
import { computeTargets } from '@/services/nutrition/nutritionGoals';
import {
    createLocalEntry,
    isLocalEntryId,
    readLocalEntries,
    readLocalOverrides,
    readLocalProfile,
    readLocalSelectedDate,
    writeLocalEntries,
    writeLocalOverrides,
    writeLocalProfile,
    writeLocalSelectedDate,
} from '@/services/nutrition/nutritionLocalStore';
import { todayLocalISO } from '@/utils/dateUtils';
import { computePointsForAction, calculateHabitStats, isHabitActiveOnDay } from '@/utils/habitUtils';
import { evaluateMilestones, detectNewAchievements } from '@/utils/milestoneUtils';
import { suggestMilestoneKeyForName } from '@/data/habitKeyAliases';

interface AppState {
    // State
    identities: Identity[];
    habits: Habit[];
    view: ViewType;
    selectedHabitId: number | null;
    skipsByHabit: SkipsByHabit;
    gamification: GamificationState;
    userPrefs: UserPrefs;
    primingSessions: PrimingSession[];
    environments: EnvironmentMap[];
    milestoneAchievements: MilestoneAchievement[];
    pendingMilestoneCelebration: PendingMilestoneCelebration | null;
    // v2 — Tribunal de la Vie
    desires: Desire[];
    dailyMoods: DailyMood[];
    todayMood: DailyMood | null;
    accusers: Accuser[];
    // D17 — Life Experiment Engine
    experiments: LifeExperiment[];
    // Segment Intending (Process #11)
    segmentIntendingEntries: SegmentIntendingEntry[];
    // Journal de ressenti quotidien
    journalEntries: JournalEntry[];
    // Module Nutrition
    nutritionProfile: NutritionProfile | null;
    /** Cibles calculées depuis le profil + surcharges manuelles */
    nutritionGoals: ComputedTargets;
    /** Surcharges manuelles des cibles, par nutriment */
    nutritionOverrides: Partial<Record<NutrientKey, number>>;
    /** Journal alimentaire (toutes dates confondues, fenêtre glissante) */
    foodEntries: FoodEntry[];
    /** Date affichée dans le journal (YYYY-MM-DD) */
    nutritionDate: string;
    /** 'cloud' = Supabase, 'local' = repli hors-ligne, 'loading' = en cours */
    nutritionSyncMode: 'loading' | 'cloud' | 'local';

    // Actions
    setView: (view: ViewType) => void;
    setSelectedHabit: (habitId: number | null) => void;
    addIdentity: (identity: Omit<Identity, 'id' | 'createdAt'>) => Promise<Identity>;
    updateIdentity: (
        id: number,
        name: string,
        description?: string,
        fields?: {
            coreBeliefs?: string[];
            dailyPractices?: string[];
            habits?: string[];
            quotes?: string[];
            behavioralSignals?: string[];
        }
    ) => void;
    deleteIdentity: (id: number) => void;
    addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'progress'>) => Promise<Habit>;
    deleteHabit: (id: number) => void;
    toggleHabitDay: (habitId: number, dayIndex: number) => void;
    updateHabit: (id: number, updates: Partial<Habit>) => void;
    linkHabitToIdentity: (habitId: number, identityId: number) => Promise<void>;
    unlinkHabitFromIdentity: (habitId: number, identityId: number) => Promise<void>;
    toggleSkipDay: (habitId: number, dayIndex: number) => void;
    addPoints: (amount: number) => void;
    createReward: (title: string, cost: number) => void;
    claimReward: (rewardId: number) => void;
    refreshUserPrefs: () => Promise<void>;
    setNotifEnabled: (enabled: boolean) => void;
    setNotifHour: (hour: number) => void;
    setNotifTimezone: (timezone: string) => void;
    setNotifChannel: (channel: NotificationChannel) => void;
    setTelegramContact: (chatId: string, username?: string) => void;
    setWhatsappNumber: (phone: string) => void;
    setWeeklyEmailEnabled: (enabled: boolean) => void;
    setWeeklyEmailDay: (day: number) => void;
    setWeeklyEmailHour: (hour: number) => void;
    addPrimingSession: (session: PrimingSession) => void;
    clearPrimingSessions: () => void;
    addEnvironment: (env: Omit<EnvironmentMap, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateEnvironment: (id: string, updates: Partial<Omit<EnvironmentMap, 'id' | 'createdAt'>>) => void;
    deleteEnvironment: (id: string) => void;
    clearMilestoneCelebration: () => void;
    // v2 — Tribunal de la Vie
    addDesire: (desire: Omit<Desire, 'id' | 'createdAt'>) => Promise<Desire>;
    updateDesire: (id: number, updates: Partial<Desire>) => void;
    closeDesire: (id: number) => Promise<void>;
    reopenDesire: (id: number) => Promise<void>;
    deleteDesire: (id: number) => void;
    saveMood: (score: EmotionalFrequency, dominantEmotion?: string, notes?: string, causes?: string) => Promise<void>;
    loadTodayMood: () => Promise<void>;
    loadMoods: (daysBack?: number) => Promise<void>;
    addAccuser: (accuser: Omit<Accuser, 'id' | 'createdAt' | 'progress' | 'startDayIndex'>) => Promise<Accuser>;
    toggleAccuserDay: (accuserId: number, dayIndex: number) => void;
    deleteAccuser: (id: number) => void;
    saveMotivation: (desireId: number, motivation: import('@/types').MotivationData) => Promise<boolean>;
    // D17 — Life Experiment Engine
    loadExperiments: () => Promise<void>;
    createExperiment: (data: Omit<LifeExperiment, 'id' | 'createdAt' | 'updatedAt' | 'entries' | 'status'>) => Promise<LifeExperiment>;
    updateExperiment: (id: number, updates: Partial<LifeExperiment>) => Promise<void>;
    deleteExperiment: (id: number) => Promise<void>;
    recordExperimentDay: (experimentId: number, entry: ExperimentDayEntry) => Promise<void>;
    completeExperiment: (id: number, conclusion: string) => Promise<void>;
    // Segment Intending (Process #11)
    loadSegmentIntendingEntries: () => Promise<void>;
    addSegmentIntendingEntry: (draft: SegmentIntendingDraft, intentions: string[], chosenIntention?: string) => Promise<SegmentIntendingEntry | null>;
    setSegmentOutcome: (id: number, outcome: string) => Promise<void>;
    // Journal de ressenti quotidien
    loadJournalEntries: () => Promise<void>;
    addJournalEntry: (content: string, prompt?: string) => Promise<JournalEntry | null>;
    editJournalEntry: (id: number, content: string) => Promise<void>;
    removeJournalEntry: (id: number) => Promise<void>;
    // Module Nutrition
    loadNutritionData: () => Promise<void>;
    saveNutritionProfile: (profile: NutritionProfile) => Promise<void>;
    setNutritionOverride: (key: NutrientKey, value: number | null) => Promise<void>;
    resetNutritionOverrides: () => Promise<void>;
    setNutritionDate: (date: string) => void;
    addFoodEntry: (draft: FoodEntryDraft) => Promise<FoodEntry | null>;
    changeFoodEntry: (id: number, grams: number, meal?: MealType) => Promise<void>;
    removeFoodEntry: (id: number) => Promise<void>;
}

export const useAppStore = create<AppState>((set) => {
    const db = SupabaseDatabaseClient.getInstance();
    const defaultUserPrefs: UserPrefs = {
        notifEnabled: false,
        notifHour: 20,
        notifTimezone: 'Europe/Paris',
        notifChannel: 'none',
        weeklyEmailEnabled: false,
        weeklyEmailDay: 6,
        weeklyEmailHour: 9,
    };

    const persistUserPrefs = (updater: (prev: UserPrefs) => UserPrefs) => {
        set((state) => {
            const nextPrefs = updater(state.userPrefs);
            console.log('💾 Sauvegarde des préférences:', nextPrefs);
            localStorage.setItem('vibes-arc-prefs', JSON.stringify(nextPrefs));
            db.saveUserPrefs(nextPrefs)
                .then((success) => {
                    if (success) {
                        console.log('✅ Préférences sauvegardées dans Supabase');
                    }
                })
                .catch((error) => {
                    console.error('❌ Erreur lors de la sauvegarde des préférences:', error);
                });
            return { userPrefs: nextPrefs };
        });
    };

    const PRIMING_KEY = 'vibes-arc-priming-sessions';
    const loadPrimingSessions = (): PrimingSession[] => {
        try {
            const raw = localStorage.getItem(PRIMING_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    };

    const persistPrimingSessions = (sessions: PrimingSession[]) => {
        localStorage.setItem(PRIMING_KEY, JSON.stringify(sessions));
    };

    const ENV_KEY = 'vibes-arc-environments';
    const loadEnvironments = (): EnvironmentMap[] => {
        try {
            const raw = localStorage.getItem(ENV_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    };

    const persistEnvironments = (envs: EnvironmentMap[]) => {
        localStorage.setItem(ENV_KEY, JSON.stringify(envs));
    };

    const processNewMilestones = async (
        before: ReturnType<typeof evaluateMilestones>,
        state: { habits: Habit[]; identities: Identity[]; skipsByHabit: SkipsByHabit; milestoneAchievements: MilestoneAchievement[] }
    ) => {
        const after = evaluateMilestones(
            state.habits,
            state.identities,
            state.milestoneAchievements,
            state.skipsByHabit
        );
        const newlyAchieved = detectNewAchievements(before, after);
        if (newlyAchieved.length === 0) return;

        const first = newlyAchieved[0];
        const def = first.definition;

        await db.saveMilestoneAchievement(def.id);

        const telegramMsg = def.telegramMessage ?? `🏆 Milestone : ${def.title}\n${def.celebrationMessage ?? def.description}`;
        db.sendMilestoneTelegramNotification(telegramMsg)
            .then((res) => {
                if (res.status === 'sent') {
                    db.markMilestoneNotified(def.id);
                }
            })
            .catch(() => {});

        set((s) => {
            const achievement: MilestoneAchievement = {
                milestoneId: def.id,
                achievedAt: new Date().toISOString(),
            };
            const already = s.milestoneAchievements.some((a) => a.milestoneId === def.id);
            return {
                milestoneAchievements: already ? s.milestoneAchievements : [achievement, ...s.milestoneAchievements],
                pendingMilestoneCelebration: {
                    title: `${def.emoji} ${def.title}`,
                    message: def.celebrationMessage ?? def.description,
                    emoji: def.emoji,
                    milestoneId: def.id,
                },
            };
        });
    };

    // Charger les données initiales
    const loadInitialData = async () => {
        try {
            const identities = await db.getIdentities();
            const habits = await db.getHabits();
            // Charger skips et gamification depuis localStorage
            const storedSkips = localStorage.getItem('vibes-arc-skips');
            const skipsByHabit: SkipsByHabit = storedSkips ? JSON.parse(storedSkips) : {};
            const storedGam = localStorage.getItem('vibes-arc-gamification');
            const gamification: GamificationState = storedGam ? JSON.parse(storedGam) : { points: 0, rewards: [], challenges: [] };
            // Charger les préférences : priorité au serveur, fallback sur localStorage
            let userPrefs: UserPrefs = { ...defaultUserPrefs };
            try {
                const serverPrefs = await db.getUserPrefs();
                console.log('📥 Préférences chargées depuis Supabase:', serverPrefs);
                userPrefs = { ...defaultUserPrefs, ...serverPrefs };
                // Sauvegarder dans localStorage pour la prochaine fois
                localStorage.setItem('vibes-arc-prefs', JSON.stringify(userPrefs));
            } catch (error) {
                console.warn('⚠️ Préférences serveur indisponibles, utilisation du localStorage:', error);
                // Fallback sur localStorage si le serveur est inaccessible
                const storedPrefs = localStorage.getItem('vibes-arc-prefs');
                if (storedPrefs) {
                    userPrefs = { ...defaultUserPrefs, ...JSON.parse(storedPrefs) };
                }
            }
            const primingSessions = loadPrimingSessions();
            const environments = loadEnvironments();
            let milestoneAchievements: MilestoneAchievement[] = [];
            try {
                milestoneAchievements = await db.getMilestoneAchievements();
            } catch {
                milestoneAchievements = [];
            }

            // v2 — Charger les Désirs, Moods, et Accusateurs
            let desires: Desire[] = [];
            let dailyMoods: DailyMood[] = [];
            let accusers: Accuser[] = [];
            let todayMood: DailyMood | null = null;
            try {
                desires = await db.getDesires();
            } catch { /* silencieux : les tables n'existent peut-être pas encore */ }
            try {
                dailyMoods = await db.getDailyMoods(90);
            } catch { }
            try {
                todayMood = await db.getTodayMood();
            } catch { }
            try {
                accusers = await db.getAccusers();
            } catch { }

            // D17 — Charger les expériences
            let experiments: LifeExperiment[] = [];
            try {
                experiments = await db.getExperiments();
            } catch { }

            // Segment Intending — charger l'historique (30 dernières entrées)
            let segmentIntendingEntries: SegmentIntendingEntry[] = [];
            try {
                segmentIntendingEntries = await db.getSegmentIntendingEntries(30);
            } catch { }

            // Journal — charger les entrées (200 dernières)
            let journalEntries: JournalEntry[] = [];
            try {
                journalEntries = await db.getJournalEntries(200);
            } catch { }

            // Module Nutrition — profil, cibles et journal alimentaire.
            // Le cache local sert de point de départ : il rend le module
            // utilisable même si Supabase est injoignable.
            let nutritionProfile: NutritionProfile | null = readLocalProfile();
            let nutritionOverrides: Partial<Record<NutrientKey, number>> = readLocalOverrides();
            let foodEntries: FoodEntry[] = readLocalEntries();
            let nutritionSyncMode: 'cloud' | 'local' = 'local';

            try {
                const remoteProfile = await db.getNutritionProfile();
                if (remoteProfile) {
                    nutritionProfile = remoteProfile.profile;
                    nutritionOverrides = remoteProfile.overrides;
                    writeLocalProfile(remoteProfile.profile);
                    writeLocalOverrides(remoteProfile.overrides);
                }
            } catch { }

            try {
                const since = new Date();
                since.setDate(since.getDate() - 90);
                const remoteEntries = await db.getFoodEntries(since.toISOString().slice(0, 10));

                // Les entrées créées hors-ligne (id négatif) n'existent pas
                // encore côté serveur : on les conserve pour ne pas perdre
                // ce que l'utilisateur a saisi sans réseau.
                const offlineOnly = foodEntries.filter(
                    (e) => isLocalEntryId(e.id) && !remoteEntries.some((r) => r.id === e.id),
                );
                foodEntries = [...remoteEntries, ...offlineOnly];
                writeLocalEntries(foodEntries);
                nutritionSyncMode = 'cloud';
            } catch { }

            const nutritionGoals = computeTargets(nutritionProfile, nutritionOverrides);

            const initialProgress = evaluateMilestones(habits, identities, milestoneAchievements);
            const retroactive = initialProgress.filter(
                (p) =>
                    p.status === 'achieved' &&
                    !milestoneAchievements.some((a) => a.milestoneId === p.definition.id)
            );
            for (const p of retroactive) {
                const saved = await db.saveMilestoneAchievement(p.definition.id);
                if (saved) milestoneAchievements = [saved, ...milestoneAchievements];
            }

            set({ identities, habits, skipsByHabit, gamification, userPrefs, primingSessions, environments, milestoneAchievements, desires, dailyMoods, todayMood, accusers, experiments, segmentIntendingEntries, journalEntries, nutritionProfile, nutritionOverrides, foodEntries, nutritionGoals, nutritionSyncMode });
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            // En cas d'erreur, initialiser avec des tableaux vides
            set({ 
                identities: [], 
                habits: [], 
                skipsByHabit: {}, 
                gamification: { points: 0, rewards: [], challenges: [] }, 
                userPrefs: { ...defaultUserPrefs },
                primingSessions: loadPrimingSessions(),
                environments: loadEnvironments(),
                milestoneAchievements: [],
                desires: [],
                dailyMoods: [],
                todayMood: null,
                accusers: [],
                experiments: [],
                segmentIntendingEntries: [],
                journalEntries: [],
                // Nutrition : le cache local reste exploitable même si le
                // chargement distant a échoué.
                nutritionProfile: readLocalProfile(),
                nutritionOverrides: readLocalOverrides(),
                foodEntries: readLocalEntries(),
                nutritionGoals: computeTargets(readLocalProfile(), readLocalOverrides()),
                nutritionSyncMode: 'local',
            });
        }
    };

    // Charger les données au démarrage
    loadInitialData();

    // Amorçage nutrition depuis le cache local, avant la réponse Supabase.
    const initialNutritionProfile = readLocalProfile();
    const initialNutritionOverrides = readLocalOverrides();

    return {
        // Initial state
        identities: [],
        habits: [],
        view: 'dashboard',
        selectedHabitId: null,
        skipsByHabit: {},
        gamification: { points: 0, rewards: [], challenges: [] },
        userPrefs: { ...defaultUserPrefs },
        primingSessions: loadPrimingSessions(),
        environments: loadEnvironments(),
        milestoneAchievements: [],
        pendingMilestoneCelebration: null,
        // v2
        desires: [],
        dailyMoods: [],
        todayMood: null,
        accusers: [],
        // D17
        experiments: [],
        // Segment Intending
        segmentIntendingEntries: [],
        // Journal
        journalEntries: [],
        // Nutrition
        nutritionProfile: initialNutritionProfile,
        nutritionOverrides: initialNutritionOverrides,
        foodEntries: readLocalEntries(),
        nutritionGoals: computeTargets(initialNutritionProfile, initialNutritionOverrides),
        nutritionDate: readLocalSelectedDate() ?? todayLocalISO(),
        nutritionSyncMode: 'loading',

        // Actions
        setView: (view) => set({ view }),
        setSelectedHabit: (habitId) => set({ selectedHabitId: habitId }),

        addIdentity: async (identityData) => {
            try {
                const newIdentity = await db.createIdentity(
                    identityData.name,
                    identityData.description,
                    identityData.color,
                    {
                        coreBeliefs: identityData.coreBeliefs,
                        dailyPractices: identityData.dailyPractices,
                        habits: identityData.habits,
                        quotes: identityData.quotes,
                        behavioralSignals: identityData.behavioralSignals,
                    }
                );
                set((state) => ({
                    identities: [...state.identities, newIdentity],
                }));
                return newIdentity;
            } catch (error) {
                console.error('Erreur lors de la création de l\'identité:', error);
                throw error;
            }
        },
        updateIdentity: async (id, name, description, fields) => {
            try {
                const success = await db.updateIdentity(id, name, description, {
                    coreBeliefs: fields?.coreBeliefs,
                    dailyPractices: fields?.dailyPractices,
                    habits: fields?.habits,
                    quotes: fields?.quotes,
                    behavioralSignals: fields?.behavioralSignals,
                });
                if (success) {
                    set((state) => ({
                        identities: state.identities.map(i =>
                            i.id === id ? { ...i, name, description, ...fields } : i
                        ),
                    }));
                }
            } catch (error) {
                console.error('Erreur lors de la mise à jour de l\'identité:', error);
            }
        },

        deleteIdentity: async (id) => {
            try {
                const success = await db.deleteIdentity(id);
                if (success) {
                    set((state) => ({
                        identities: state.identities.filter(i => i.id !== id),
                        habits: state.habits.map(h => ({
                            ...h,
                            linkedIdentities: h.linkedIdentities.filter(iId => iId !== id)
                        }))
                    }));
                }
            } catch (error) {
                console.error('Erreur lors de la suppression de l\'identité:', error);
            }
        },

        addHabit: async (habitData) => {
            try {
                const milestoneKey = habitData.milestoneKey ?? suggestMilestoneKeyForName(habitData.name);
                const newHabit = await db.createHabit(
                    habitData.name,
                    habitData.type,
                    habitData.totalDays,
                    habitData.linkedIdentities,
                    milestoneKey
                );
                set((state) => ({
                    habits: [...state.habits, { ...newHabit, milestoneKey }],
                }));
                return { ...newHabit, milestoneKey };
            } catch (error) {
                console.error('Erreur lors de la création de l\'habitude:', error);
                throw error; // Propagate error or return null, but for now throwing is fine if caught
            }
        },

        deleteHabit: async (id) => {
            try {
                const success = await db.deleteHabit(id);
                if (success) {
                    set((state) => ({
                        habits: state.habits.filter(h => h.id !== id),
                    }));
                }
            } catch (error) {
                console.error('Erreur lors de la suppression de l\'habitude:', error);
            }
        },

        toggleHabitDay: async (habitId, dayIndex) => {
            try {
                // Étendre l'habitude côté client + DB si nécessaire (ex: passer à 2026)
                const currentHabit = useAppStore.getState().habits.find(h => h.id === habitId);
                if (currentHabit && dayIndex >= currentHabit.progress.length) {
                    const newLen = dayIndex + 1;
                    const newProgress = [...currentHabit.progress, ...new Array(newLen - currentHabit.progress.length).fill(false)];
                    // Best-effort: mettre à jour la durée côté DB pour que le calendrier survive aux reloads
                    try {
                        await db.updateHabit(habitId, { totalDays: newLen });
                    } catch { }
                    set((state) => ({
                        habits: state.habits.map(h => h.id === habitId ? { ...h, totalDays: newLen, progress: newProgress } : h)
                    }));
                }

                const success = await db.toggleHabitDay(habitId, dayIndex);
                if (success) {
                    const stateBefore = useAppStore.getState();
                    const milestonesBefore = evaluateMilestones(
                        stateBefore.habits,
                        stateBefore.identities,
                        stateBefore.milestoneAchievements,
                        stateBefore.skipsByHabit
                    );

                    set((state) => {
                        // Mettre à jour la progression
                        const updatedHabits = state.habits.map(h => {
                            if (h.id === habitId) {
                                const newProgress = [...h.progress];

                                newProgress[dayIndex] = !newProgress[dayIndex];
                                return { ...h, progress: newProgress };
                            }
                            return h;
                        });

                        // Accorder des points avancés si cochée
                        const habit = updatedHabits.find(h => h.id === habitId)!;
                        const justChecked = habit.progress[dayIndex] === true;
                        let newGam = state.gamification;
                        if (justChecked) {
                            const stats = calculateHabitStats(habit, state.skipsByHabit[habitId] || []);
                            // "Premier check du jour" = avant cette action, aucune habitude active ce jour n'était cochée
                            const activeHabitsToday = updatedHabits.filter(h => isHabitActiveOnDay(h, dayIndex));
                            const wasAnyCheckedBefore = activeHabitsToday.some(h => h.id !== habitId && !!h.progress[dayIndex]);
                            const isFirstCheckOfDay = !wasAnyCheckedBefore;
                            const gain = computePointsForAction({
                                isFirstCheckOfDay,
                                currentStreak: stats.currentStreak,
                                longestStreak: stats.longestStreak,
                                habitType: habit.type,
                            });
                            newGam = { ...state.gamification, points: state.gamification.points + gain };
                        }

                        localStorage.setItem('vibes-arc-gamification', JSON.stringify(newGam));
                        return { habits: updatedHabits, gamification: newGam };
                    });

                    const stateAfter = useAppStore.getState();
                    if (stateAfter.habits.find((h) => h.id === habitId)?.progress[dayIndex]) {
                        processNewMilestones(milestonesBefore, stateAfter);
                    }
                }
            } catch (error) {
                console.error('Erreur lors de la mise à jour de la progression:', error);
            }
        },

        toggleSkipDay: (habitId, dayIndex) => {
            set((state) => {
                const current = state.skipsByHabit[habitId] || [];
                const exists = current.includes(dayIndex);
                const next = exists ? current.filter(d => d !== dayIndex) : [...current, dayIndex];
                const skipsByHabit = { ...state.skipsByHabit, [habitId]: next };
                localStorage.setItem('vibes-arc-skips', JSON.stringify(skipsByHabit));
                // Sync to Supabase best-effort
                try { db.toggleSkipDay(habitId, dayIndex); } catch { }
                return { skipsByHabit };
            });
        },

        updateHabit: async (id, updates) => {
            try {
                const success = await db.updateHabit(id, updates);
                if (success) {
                    set((state) => ({
                        habits: state.habits.map(h =>
                            h.id === id ? { ...h, ...updates } : h
                        ),
                    }));
                }
            } catch (error) {
                console.error('Erreur lors de la mise à jour de l\'habitude:', error);
            }
        },

        linkHabitToIdentity: async (habitId, identityId) => {
            const habit = useAppStore.getState().habits.find((h) => h.id === habitId);
            if (!habit || habit.linkedIdentities.includes(identityId)) return;
            const linkedIdentities = [...habit.linkedIdentities, identityId];
            await useAppStore.getState().updateHabit(habitId, { linkedIdentities });
        },

        unlinkHabitFromIdentity: async (habitId, identityId) => {
            const habit = useAppStore.getState().habits.find((h) => h.id === habitId);
            if (!habit || !habit.linkedIdentities.includes(identityId)) return;
            const linkedIdentities = habit.linkedIdentities.filter((id) => id !== identityId);
            await useAppStore.getState().updateHabit(habitId, { linkedIdentities });
        },



        addPoints: (amount) => {
            set((state) => {
                const gamification = { ...state.gamification, points: state.gamification.points + amount };
                localStorage.setItem('vibes-arc-gamification', JSON.stringify(gamification));
                return { gamification };
            });
        },

        createReward: (title, cost) => {
            set((state) => {
                const newReward: Reward = { id: Date.now(), title, cost, createdAt: new Date().toISOString() };
                const gamification = { ...state.gamification, rewards: [...state.gamification.rewards, newReward] };
                localStorage.setItem('vibes-arc-gamification', JSON.stringify(gamification));
                return { gamification };
            });
        },

        claimReward: (rewardId) => {
            set((state) => {
                const reward = state.gamification.rewards.find(r => r.id === rewardId);
                if (!reward) return {} as any;
                if (state.gamification.points < reward.cost) return {} as any;
                const updatedRewards = state.gamification.rewards.map(r => r.id === rewardId ? { ...r, claimedAt: new Date().toISOString() } : r);
                const gamification = { ...state.gamification, points: state.gamification.points - reward.cost, rewards: updatedRewards };
                localStorage.setItem('vibes-arc-gamification', JSON.stringify(gamification));
                return { gamification };
            });
        },

        refreshUserPrefs: async () => {
            try {
                const prefs = await db.getUserPrefs();
                set(() => {
                    const merged = { ...defaultUserPrefs, ...prefs };
                    localStorage.setItem('vibes-arc-prefs', JSON.stringify(merged));
                    return { userPrefs: merged };
                });
            } catch (error) {
                console.error('Impossible de rafraîchir les préférences:', error);
            }
        },

        setNotifEnabled: (enabled) => {
            persistUserPrefs((prev) => ({ ...prev, notifEnabled: enabled }));
        },

        setNotifHour: (hour) => {
            const value = Math.max(0, Math.min(23, Math.floor(hour)));
            persistUserPrefs((prev) => ({ ...prev, notifHour: value }));
        },

        setNotifTimezone: (timezone) => {
            persistUserPrefs((prev) => ({ ...prev, notifTimezone: timezone || prev.notifTimezone }));
        },

        setNotifChannel: (channel) => {
            persistUserPrefs((prev) => ({ ...prev, notifChannel: channel }));
        },

        setTelegramContact: (chatId, username) => {
            persistUserPrefs((prev) => ({ ...prev, telegramChatId: chatId, telegramUsername: username || prev.telegramUsername }));
        },

        setWhatsappNumber: (phone) => {
            persistUserPrefs((prev) => ({ ...prev, whatsappNumber: phone }));
        },

        setWeeklyEmailEnabled: (enabled) => {
            persistUserPrefs((prev) => ({ ...prev, weeklyEmailEnabled: enabled }));
        },

        setWeeklyEmailDay: (day) => {
            const value = Math.max(0, Math.min(6, Math.floor(day)));
            persistUserPrefs((prev) => ({ ...prev, weeklyEmailDay: value }));
        },

        setWeeklyEmailHour: (hour) => {
            const value = Math.max(0, Math.min(23, Math.floor(hour)));
            persistUserPrefs((prev) => ({ ...prev, weeklyEmailHour: value }));
        },

        addPrimingSession: (session) => {
            set((state) => {
                const next = [session, ...state.primingSessions].slice(0, 200);
                persistPrimingSessions(next);
                return { primingSessions: next };
            });
        },

        clearPrimingSessions: () => {
            set(() => {
                persistPrimingSessions([]);
                return { primingSessions: [] };
            });
        },

        addEnvironment: (env) => {
            set((state) => {
                const now = new Date().toISOString();
                const nextEnv: EnvironmentMap = {
                    id: `env_${Date.now()}_${Math.random().toString(16).slice(2)}`,
                    createdAt: now,
                    updatedAt: now,
                    name: env.name,
                    room: env.room,
                    riskLevel: env.riskLevel,
                    desiredBehaviors: env.desiredBehaviors || [],
                    avoidBehaviors: env.avoidBehaviors || [],
                    transitionRituals: env.transitionRituals || [],
                    notes: env.notes,
                };
                const next = [nextEnv, ...state.environments];
                persistEnvironments(next);
                return { environments: next };
            });
        },

        updateEnvironment: (id, updates) => {
            set((state) => {
                const next = state.environments.map((e) =>
                    e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
                );
                persistEnvironments(next);
                return { environments: next };
            });
        },

        deleteEnvironment: (id) => {
            set((state) => {
                const next = state.environments.filter((e) => e.id !== id);
                persistEnvironments(next);
                return { environments: next };
            });
        },

        clearMilestoneCelebration: () => set({ pendingMilestoneCelebration: null }),

        // ============================================================
        // VIBES ARC v2 — Tribunal de la Vie
        // ============================================================

        addDesire: async (desireData) => {
            try {
                const newDesire = await db.createDesire(
                    desireData.title,
                    desireData.type,
                    desireData.linkedIdentityIds,
                    desireData.description,
                    desireData.target,
                    desireData.motivation,
                    desireData.requiredHabitIds
                );
                set((state) => ({
                    desires: [...state.desires, newDesire],
                }));
                return newDesire;
            } catch (error) {
                console.error('Erreur lors de la création du désir:', error);
                throw error;
            }
        },

        updateDesire: async (id, updates) => {
            try {
                const success = await db.updateDesire(id, updates);
                if (success) {
                    set((state) => ({
                        desires: state.desires.map(d =>
                            d.id === id ? { ...d, ...updates } : d
                        ),
                    }));
                }
            } catch (error) {
                console.error('Erreur lors de la mise à jour du désir:', error);
            }
        },

        closeDesire: async (id) => {
            try {
                const success = await db.updateDesire(id, { status: 'closed' });
                if (success) {
                    set((state) => ({
                        desires: state.desires.map(d =>
                            d.id === id ? { ...d, status: 'closed' } : d
                        ),
                    }));
                }
            } catch (error) {
                console.error('Erreur lors de la clôture du désir:', error);
            }
        },

        reopenDesire: async (id) => {
            try {
                const success = await db.updateDesire(id, { status: 'active' });
                if (success) {
                    set((state) => ({
                        desires: state.desires.map(d =>
                            d.id === id ? { ...d, status: 'active' } : d
                        ),
                    }));
                }
            } catch (error) {
                console.error('Erreur lors de la réouverture du désir:', error);
            }
        },

        deleteDesire: async (id) => {
            try {
                const success = await db.deleteDesire(id);
                if (success) {
                    set((state) => ({
                        desires: state.desires.filter(d => d.id !== id),
                    }));
                }
            } catch (error) {
                console.error('Erreur lors de la suppression du désir:', error);
            }
        },

        saveMood: async (score, dominantEmotion, notes, causes) => {
            try {
                const today = new Date().toISOString().slice(0, 10);
                const mood = await db.saveDailyMood(today, score, dominantEmotion, notes, causes);
                set((state) => {
                    const existingIdx = state.dailyMoods.findIndex(m => m.date === today);
                    const dailyMoods = existingIdx >= 0
                        ? state.dailyMoods.map((m, i) => i === existingIdx ? mood : m)
                        : [mood, ...state.dailyMoods];
                    return { dailyMoods, todayMood: mood };
                });
            } catch (error) {
                console.error('Erreur lors de la sauvegarde du mood:', error);
            }
        },

        loadTodayMood: async () => {
            try {
                const mood = await db.getTodayMood();
                set({ todayMood: mood });
            } catch {
                // silencieux
            }
        },

        loadMoods: async (daysBack = 90) => {
            try {
                const moods = await db.getDailyMoods(daysBack);
                set({ dailyMoods: moods });
            } catch {
                // silencieux
            }
        },

        addAccuser: async (accuserData) => {
            try {
                const newAccuser = await db.createAccuser(
                    accuserData.name,
                    accuserData.linkedDesireId,
                    accuserData.totalDays
                );
                set((state) => ({
                    accusers: [...state.accusers, newAccuser],
                }));
                return newAccuser;
            } catch (error) {
                console.error('Erreur lors de la création de l\'accusateur:', error);
                throw error;
            }
        },

        toggleAccuserDay: async (accuserId, dayIndex) => {
            try {
                const success = await db.toggleAccuserDay(accuserId, dayIndex);
                if (success) {
                    set((state) => ({
                        accusers: state.accusers.map(a => {
                            if (a.id === accuserId) {
                                const newProgress = [...a.progress];
                                if (dayIndex >= newProgress.length) {
                                    const extended = [...newProgress, ...new Array(dayIndex - newProgress.length + 1).fill(false)];
                                    extended[dayIndex] = !extended[dayIndex];
                                    return { ...a, progress: extended, totalDays: extended.length };
                                }
                                newProgress[dayIndex] = !newProgress[dayIndex];
                                return { ...a, progress: newProgress };
                            }
                            return a;
                        }),
                    }));
                }
            } catch (error) {
                console.error('Erreur toggleAccuserDay:', error);
            }
        },

        deleteAccuser: async (id) => {
            try {
                const success = await db.deleteAccuser(id);
                if (success) {
                    set((state) => ({
                        accusers: state.accusers.filter(a => a.id !== id),
                    }));
                }
            } catch (error) {
                console.error('Erreur suppression accusateur:', error);
            }
        },

        saveMotivation: async (desireId, motivation) => {
            try {
                const success = await db.saveMotivation(desireId, motivation);
                if (success) {
                    set((state) => ({
                        desires: state.desires.map(d =>
                            d.id === desireId ? { ...d, motivation } : d
                        ),
                    }));
                }
                return success;
            } catch (error) {
                console.error('Erreur sauvegarde motivation:', error);
                return false;
            }
        },

        // ===== D17 — Life Experiment Engine =====

        loadExperiments: async () => {
            try {
                const experiments = await db.getExperiments();
                set({ experiments });
            } catch {
                // silencieux
            }
        },

        createExperiment: async (data: Omit<LifeExperiment, 'id' | 'createdAt' | 'updatedAt' | 'entries' | 'status'>) => {
            try {
                const experiment = await db.createExperiment(data);
                set((state) => ({
                    experiments: [...state.experiments, experiment],
                }));
                return experiment;
            } catch (error) {
                console.error('Erreur création expérience:', error);
                throw error;
            }
        },

        updateExperiment: async (id: number, updates: Partial<LifeExperiment>) => {
            try {
                const success = await db.updateExperiment(id, updates);
                if (success) {
                    set((state) => ({
                        experiments: state.experiments.map(e =>
                            e.id === id ? { ...e, ...updates } : e
                        ),
                    }));
                }
            } catch (error) {
                console.error('Erreur mise à jour expérience:', error);
            }
        },

        deleteExperiment: async (id: number) => {
            try {
                const success = await db.deleteExperiment(id);
                if (success) {
                    set((state) => ({
                        experiments: state.experiments.filter(e => e.id !== id),
                    }));
                }
            } catch (error) {
                console.error('Erreur suppression expérience:', error);
            }
        },

        recordExperimentDay: async (experimentId: number, entry: ExperimentDayEntry) => {
            try {
                const success = await db.recordExperimentDay(experimentId, entry);
                if (success) {
                    set((state) => ({
                        experiments: state.experiments.map(e => {
                            if (e.id !== experimentId) return e;
                            const existing = (e.entries ?? []).filter(ee => ee.date !== entry.date);
                            return { ...e, entries: [...existing, entry] };
                        }),
                    }));
                }
            } catch (error) {
                console.error('Erreur enregistrement jour expérience:', error);
            }
        },

        completeExperiment: async (id: number, conclusion: string) => {
            try {
                const success = await db.updateExperiment(id, {
                    status: 'completed',
                    conclusion,
                } as any);
                if (success) {
                    set((state) => ({
                        experiments: state.experiments.map(e =>
                            e.id === id ? { ...e, status: 'completed' as ExperimentStatus, conclusion } : e
                        ),
                    }));
                }
            } catch (error) {
                console.error('Erreur complétion expérience:', error);
            }
        },

        // ===== Segment Intending (Process #11) =====

        loadSegmentIntendingEntries: async () => {
            try {
                const segmentIntendingEntries = await db.getSegmentIntendingEntries(30);
                set({ segmentIntendingEntries });
            } catch {
                // silencieux : table pas encore migrée ou non authentifié
            }
        },

        addSegmentIntendingEntry: async (draft, intentions, chosenIntention) => {
            try {
                const id = await db.saveSegmentIntendingEntry({
                    ...draft,
                    intentions,
                    chosenIntention,
                });
                if (id === null) return null;
                const entry: SegmentIntendingEntry = {
                    id,
                    date: new Date().toISOString().slice(0, 10),
                    segmentKey: draft.segmentKey,
                    segmentLabel: draft.segmentLabel,
                    context: draft.context,
                    intentions,
                    chosenIntention,
                    emotionalSetpoint: draft.emotionalSetpoint,
                    createdAt: new Date().toISOString(),
                };
                set((state) => ({
                    segmentIntendingEntries: [entry, ...state.segmentIntendingEntries].slice(0, 50),
                }));
                return entry;
            } catch (error) {
                console.error('Erreur enregistrement segment intending:', error);
                return null;
            }
        },

        setSegmentOutcome: async (id: number, outcome: string) => {
            try {
                const success = await db.updateSegmentOutcome(id, outcome);
                if (success) {
                    set((state) => ({
                        segmentIntendingEntries: state.segmentIntendingEntries.map(e =>
                            e.id === id ? { ...e, outcome } : e
                        ),
                    }));
                }
            } catch (error) {
                console.error('Erreur mise à jour outcome segment:', error);
            }
        },

        // ===== Journal de ressenti quotidien =====

        loadJournalEntries: async () => {
            try {
                const journalEntries = await db.getJournalEntries(200);
                set({ journalEntries });
            } catch {
                // silencieux : table pas encore migrée ou non authentifié
            }
        },

        addJournalEntry: async (content, prompt) => {
            try {
                const entry = await db.createJournalEntry(content, prompt);
                if (!entry) return null;
                set((state) => ({
                    journalEntries: [entry, ...state.journalEntries],
                }));
                return entry;
            } catch (error) {
                console.error('Erreur ajout entrée journal:', error);
                return null;
            }
        },

        editJournalEntry: async (id, content) => {
            try {
                const success = await db.updateJournalEntry(id, content);
                if (success) {
                    set((state) => ({
                        journalEntries: state.journalEntries.map(e =>
                            e.id === id ? { ...e, content, updatedAt: new Date().toISOString() } : e
                        ),
                    }));
                }
            } catch (error) {
                console.error('Erreur mise à jour entrée journal:', error);
            }
        },

        removeJournalEntry: async (id) => {
            try {
                const success = await db.deleteJournalEntry(id);
                if (success) {
                    set((state) => ({
                        journalEntries: state.journalEntries.filter(e => e.id !== id),
                    }));
                }
            } catch (error) {
                console.error('Erreur suppression entrée journal:', error);
            }
        },

        // ===== Module Nutrition =====
        //
        // Principe : on écrit toujours d'abord en local (l'interface reste
        // instantanée et fonctionne hors-ligne), puis on tente Supabase.
        // `nutritionSyncMode` reflète l'état réel de la synchronisation.

        loadNutritionData: async () => {
            try {
                const remoteProfile = await db.getNutritionProfile();
                if (remoteProfile) {
                    writeLocalProfile(remoteProfile.profile);
                    writeLocalOverrides(remoteProfile.overrides);
                    set({
                        nutritionProfile: remoteProfile.profile,
                        nutritionOverrides: remoteProfile.overrides,
                        nutritionGoals: computeTargets(remoteProfile.profile, remoteProfile.overrides),
                    });
                }

                const since = new Date();
                since.setDate(since.getDate() - 90);
                const remoteEntries = await db.getFoodEntries(since.toISOString().slice(0, 10));

                set((state) => {
                    const offlineOnly = state.foodEntries.filter(
                        (e) => isLocalEntryId(e.id) && !remoteEntries.some((r) => r.id === e.id),
                    );
                    const foodEntries = [...remoteEntries, ...offlineOnly];
                    writeLocalEntries(foodEntries);
                    return { foodEntries, nutritionSyncMode: 'cloud' };
                });
            } catch {
                // Table absente ou hors-ligne : le cache local prend le relais.
                set({ nutritionSyncMode: 'local' });
            }
        },

        saveNutritionProfile: async (profile) => {
            const nextProfile: NutritionProfile = { ...profile, updatedAt: new Date().toISOString() };
            const overrides = useAppStore.getState().nutritionOverrides;

            writeLocalProfile(nextProfile);
            set({
                nutritionProfile: nextProfile,
                nutritionGoals: computeTargets(nextProfile, overrides),
            });

            try {
                const saved = await db.saveNutritionProfile(nextProfile, overrides);
                set({ nutritionSyncMode: saved ? 'cloud' : 'local' });
            } catch (error) {
                console.warn('Profil nutrition conservé en local (Supabase indisponible) :', error);
                set({ nutritionSyncMode: 'local' });
            }
        },

        setNutritionOverride: async (key, value) => {
            const { nutritionProfile, nutritionOverrides } = useAppStore.getState();
            const nextOverrides = { ...nutritionOverrides };

            if (value === null || !Number.isFinite(value) || value <= 0) {
                delete nextOverrides[key];
            } else {
                nextOverrides[key] = value;
            }

            writeLocalOverrides(nextOverrides);
            set({
                nutritionOverrides: nextOverrides,
                nutritionGoals: computeTargets(nutritionProfile, nextOverrides),
            });

            // Les surcharges n'ont de sens qu'adossées à un profil existant.
            if (!nutritionProfile) return;
            try {
                const saved = await db.saveNutritionProfile(nutritionProfile, nextOverrides);
                set({ nutritionSyncMode: saved ? 'cloud' : 'local' });
            } catch {
                set({ nutritionSyncMode: 'local' });
            }
        },

        resetNutritionOverrides: async () => {
            const { nutritionProfile } = useAppStore.getState();
            writeLocalOverrides({});
            set({
                nutritionOverrides: {},
                nutritionGoals: computeTargets(nutritionProfile, {}),
            });

            if (!nutritionProfile) return;
            try {
                await db.saveNutritionProfile(nutritionProfile, {});
            } catch {
                set({ nutritionSyncMode: 'local' });
            }
        },

        setNutritionDate: (date) => {
            writeLocalSelectedDate(date);
            set({ nutritionDate: date });
        },

        addFoodEntry: async (draft) => {
            try {
                const entry = await db.createFoodEntry(draft);
                if (!entry) throw new Error('Insertion refusée par Supabase');

                set((state) => {
                    const foodEntries = [...state.foodEntries, entry];
                    writeLocalEntries(foodEntries);
                    return { foodEntries, nutritionSyncMode: 'cloud' as const };
                });
                return entry;
            } catch {
                // Repli hors-ligne : l'entrée vit en local et sera conservée.
                const entry = createLocalEntry(draft);
                set((state) => {
                    const foodEntries = [...state.foodEntries, entry];
                    writeLocalEntries(foodEntries);
                    return { foodEntries, nutritionSyncMode: 'local' as const };
                });
                return entry;
            }
        },

        changeFoodEntry: async (id, grams, meal) => {
            const safeGrams = Math.max(1, Math.round(grams));

            set((state) => {
                const foodEntries = state.foodEntries.map((e) =>
                    e.id === id ? { ...e, grams: safeGrams, meal: meal ?? e.meal } : e,
                );
                writeLocalEntries(foodEntries);
                return { foodEntries };
            });

            if (isLocalEntryId(id)) return; // Jamais envoyée au serveur
            try {
                const saved = await db.updateFoodEntry(id, safeGrams, meal);
                if (!saved) set({ nutritionSyncMode: 'local' });
            } catch {
                set({ nutritionSyncMode: 'local' });
            }
        },

        removeFoodEntry: async (id) => {
            set((state) => {
                const foodEntries = state.foodEntries.filter((e) => e.id !== id);
                writeLocalEntries(foodEntries);
                return { foodEntries };
            });

            if (isLocalEntryId(id)) return;
            try {
                const saved = await db.deleteFoodEntry(id);
                if (!saved) set({ nutritionSyncMode: 'local' });
            } catch {
                set({ nutritionSyncMode: 'local' });
            }
        },
    };
});
