import { create } from 'zustand';
import { Identity, Habit, ViewType, SkipsByHabit, GamificationState, Reward, UserPrefs } from '@/types';
import SupabaseDatabaseClient from '@/database/supabase-client';
import { computePointsForAction, calculateHabitStats } from '@/utils/habitUtils';

interface AppState {
    // State
    identities: Identity[];
    habits: Habit[];
    view: ViewType;
    selectedHabitId: number | null;
    skipsByHabit: SkipsByHabit;
    gamification: GamificationState;
    userPrefs: UserPrefs;

    // Actions
    setView: (view: ViewType) => void;
    setSelectedHabit: (habitId: number | null) => void;
    addIdentity: (identity: Omit<Identity, 'id' | 'createdAt'>) => Promise<void>;
    updateIdentity: (id: number, name: string, description?: string) => void;
    deleteIdentity: (id: number) => void;
    addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'progress'>) => void;
    deleteHabit: (id: number) => void;
    toggleHabitDay: (habitId: number, dayIndex: number) => void;
    updateHabit: (id: number, updates: Partial<Habit>) => void;
    toggleSkipDay: (habitId: number, dayIndex: number) => void;
    addPoints: (amount: number) => void;
    createReward: (title: string, cost: number) => void;
    claimReward: (rewardId: number) => void;
    setNotifHour: (hour: number) => void;
    setWeeklyEmailEnabled: (enabled: boolean) => void;
    setWeeklyEmailDay: (day: number) => void;
    setWeeklyEmailHour: (hour: number) => void;
}

export const useAppStore = create<AppState>((set, get) => {
    const db = SupabaseDatabaseClient.getInstance();

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
            const storedPrefs = localStorage.getItem('vibes-arc-prefs');
            const userPrefs: UserPrefs = storedPrefs ? JSON.parse(storedPrefs) : { 
                notifHour: 20, 
                weeklyEmailEnabled: false, 
                weeklyEmailDay: 6, // samedi par défaut
                weeklyEmailHour: 9 // 9h par défaut
            };
            set({ identities, habits, skipsByHabit, gamification, userPrefs });
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            // En cas d'erreur, initialiser avec des tableaux vides
            set({ 
                identities: [], 
                habits: [], 
                skipsByHabit: {}, 
                gamification: { points: 0, rewards: [], challenges: [] }, 
                userPrefs: { 
                    notifHour: 20, 
                    weeklyEmailEnabled: false, 
                    weeklyEmailDay: 6, 
                    weeklyEmailHour: 9 
                } 
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
        userPrefs: { notifHour: 20 },

        // Actions
        setView: (view) => set({ view }),
        setSelectedHabit: (habitId) => set({ selectedHabitId: habitId }),

        addIdentity: async (identityData) => {
            try {
                const newIdentity = await db.createIdentity(identityData.name, identityData.description, identityData.color);
                set((state) => ({
                    identities: [...state.identities, newIdentity],
                }));
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
            } catch (error) {
                console.error('Erreur lors de la création de l\'habitude:', error);
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
                            const isFirstCheckOfDay = updatedHabits.every(h => h.progress[dayIndex] === false) ? true : false;
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

        setNotifHour: (hour) => {
            set((state) => {
                const userPrefs = { ...state.userPrefs, notifHour: Math.max(0, Math.min(23, Math.floor(hour))) };
                localStorage.setItem('vibes-arc-prefs', JSON.stringify(userPrefs));
                return { userPrefs };
            });
        },

        setWeeklyEmailEnabled: (enabled) => {
            set((state) => {
                const userPrefs = { ...state.userPrefs, weeklyEmailEnabled: enabled };
                localStorage.setItem('vibes-arc-prefs', JSON.stringify(userPrefs));
                return { userPrefs };
            });
        },

        setWeeklyEmailDay: (day) => {
            set((state) => {
                const userPrefs = { ...state.userPrefs, weeklyEmailDay: Math.max(0, Math.min(6, Math.floor(day))) };
                localStorage.setItem('vibes-arc-prefs', JSON.stringify(userPrefs));
                return { userPrefs };
            });
        },

        setWeeklyEmailHour: (hour) => {
            set((state) => {
                const userPrefs = { ...state.userPrefs, weeklyEmailHour: Math.max(0, Math.min(23, Math.floor(hour))) };
                localStorage.setItem('vibes-arc-prefs', JSON.stringify(userPrefs));
                return { userPrefs };
            });
        },
    };
});
