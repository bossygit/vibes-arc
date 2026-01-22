import { create } from 'zustand';
import { Identity, Habit, ViewType, SkipsByHabit, GamificationState, Reward, UserPrefs, NotificationChannel, PrimingSession, EnvironmentMap } from '@/types';
import SupabaseDatabaseClient from '@/database/supabase-client';
import { computePointsForAction, calculateHabitStats, isHabitActiveOnDay } from '@/utils/habitUtils';

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

    // Actions
    setView: (view: ViewType) => void;
    setSelectedHabit: (habitId: number | null) => void;
    addIdentity: (identity: Omit<Identity, 'id' | 'createdAt'>) => Promise<Identity>;
    updateIdentity: (id: number, name: string, description?: string) => void;
    deleteIdentity: (id: number) => void;
    addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'progress'>) => Promise<Habit>;
    deleteHabit: (id: number) => void;
    toggleHabitDay: (habitId: number, dayIndex: number) => void;
    updateHabit: (id: number, updates: Partial<Habit>) => void;
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
            set({ identities, habits, skipsByHabit, gamification, userPrefs, primingSessions, environments });
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
            });
        }
    };

    // Charger les données au démarrage
    loadInitialData();

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

        // Actions
        setView: (view) => set({ view }),
        setSelectedHabit: (habitId) => set({ selectedHabitId: habitId }),

        addIdentity: async (identityData) => {
            try {
                const newIdentity = await db.createIdentity(identityData.name, identityData.description, identityData.color);
                set((state) => ({
                    identities: [...state.identities, newIdentity],
                }));
                return newIdentity;
            } catch (error) {
                console.error('Erreur lors de la création de l\'identité:', error);
                throw error;
            }
        },

        updateIdentity: async (id, name, description) => {
            try {
                const success = await db.updateIdentity(id, name, description);
                if (success) {
                    set((state) => ({
                        identities: state.identities.map(i =>
                            i.id === id ? { ...i, name, description } : i
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
                const newHabit = await db.createHabit(
                    habitData.name,
                    habitData.type,
                    habitData.totalDays,
                    habitData.linkedIdentities
                );
                set((state) => ({
                    habits: [...state.habits, newHabit],
                }));
                return newHabit;
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
    };
});
