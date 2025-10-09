import { create } from 'zustand';
import { Identity, Habit, ViewType } from '@/types';
import SupabaseDatabaseClient from '@/database/supabase-client';

interface AppState {
    // State
    identities: Identity[];
    habits: Habit[];
    view: ViewType;
    selectedHabitId: number | null;

    // Actions
    setView: (view: ViewType) => void;
    setSelectedHabit: (habitId: number | null) => void;
    addIdentity: (identity: Omit<Identity, 'id' | 'createdAt'>) => void;
    updateIdentity: (id: number, name: string, description?: string) => void;
    deleteIdentity: (id: number) => void;
    addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'progress'>) => void;
    deleteHabit: (id: number) => void;
    toggleHabitDay: (habitId: number, dayIndex: number) => void;
    updateHabit: (id: number, updates: Partial<Habit>) => void;
}

export const useAppStore = create<AppState>()((set) => {
    const db = SupabaseDatabaseClient.getInstance();

    // Charger les données initiales
    const loadInitialData = async () => {
        try {
            const identities = await db.getIdentities();
            const habits = await db.getHabits();
            set({ identities, habits });
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            // En cas d'erreur, initialiser avec des tableaux vides
            set({ identities: [], habits: [] });
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

        // Actions
        setView: (view) => set({ view }),
        setSelectedHabit: (habitId) => set({ selectedHabitId: habitId }),

        addIdentity: async (identityData) => {
            try {
                const newIdentity = await db.createIdentity(identityData.name, identityData.description);
                set((state) => ({
                    identities: [...state.identities, newIdentity],
                }));
            } catch (error) {
                console.error('Erreur lors de la création de l\'identité:', error);
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
                    set((state) => ({
                        habits: state.habits.map(h => {
                            if (h.id === habitId) {
                                const newProgress = [...h.progress];
                                newProgress[dayIndex] = !newProgress[dayIndex];
                                return { ...h, progress: newProgress };
                            }
                            return h;
                        }),
                    }));
                }
            } catch (error) {
                console.error('Erreur lors de la mise à jour de la progression:', error);
            }
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
    };
});
