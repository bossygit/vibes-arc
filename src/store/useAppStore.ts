import { create } from 'zustand';
import { Identity, Habit, ViewType } from '@/types';
import BrowserDatabaseClient from '@/database/browser-client';

interface AppState {
    // State
    identities: Identity[];
    habits: Habit[];
    view: ViewType;

    // Actions
    setView: (view: ViewType) => void;
    addIdentity: (identity: Omit<Identity, 'id' | 'createdAt'>) => void;
    deleteIdentity: (id: number) => void;
    addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'progress'>) => void;
    deleteHabit: (id: number) => void;
    toggleHabitDay: (habitId: number, dayIndex: number) => void;
    updateHabit: (id: number, updates: Partial<Habit>) => void;
}

export const useAppStore = create<AppState>()((set) => {
    const db = BrowserDatabaseClient.getInstance();

    // Charger les données initiales
    const loadInitialData = () => {
        const identities = db.getIdentities();
        const habits = db.getHabits();
        set({ identities, habits });
    };

    // Charger les données au démarrage
    loadInitialData();

    return {
        // Initial state
        identities: [],
        habits: [],
        view: 'dashboard',

        // Actions
        setView: (view) => set({ view }),

        addIdentity: (identityData) => {
            const newIdentity = db.createIdentity(identityData.name, identityData.description);
            set((state) => ({
                identities: [...state.identities, newIdentity],
            }));
        },

        deleteIdentity: (id) => {
            const success = db.deleteIdentity(id);
            if (success) {
                set((state) => ({
                    identities: state.identities.filter(i => i.id !== id),
                    habits: state.habits.map(h => ({
                        ...h,
                        linkedIdentities: h.linkedIdentities.filter(iId => iId !== id)
                    }))
                }));
            }
        },

        addHabit: (habitData) => {
            const newHabit = db.createHabit(
                habitData.name,
                habitData.type,
                habitData.totalDays,
                habitData.linkedIdentities
            );
            set((state) => ({
                habits: [...state.habits, newHabit],
            }));
        },

        deleteHabit: (id) => {
            const success = db.deleteHabit(id);
            if (success) {
                set((state) => ({
                    habits: state.habits.filter(h => h.id !== id),
                }));
            }
        },

        toggleHabitDay: (habitId, dayIndex) => {
            const success = db.toggleHabitDay(habitId, dayIndex);
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
        },

        updateHabit: (id, updates) => {
            const success = db.updateHabit(id, updates);
            if (success) {
                set((state) => ({
                    habits: state.habits.map(h =>
                        h.id === id ? { ...h, ...updates } : h
                    ),
                }));
            }
        },
    };
});
