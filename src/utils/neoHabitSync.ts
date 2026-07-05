import { useAppStore } from '@/store/useAppStore';
import { getCurrentDayIndex } from '@/utils/habitUtils';
import { totalDays } from '@/utils/dateUtils';

export const NEO_HABIT_NAME = 'Neo';
export const NEO_MILESTONE_KEY = 'neo';

/** Coche l'habitude Neo après qu'au moins un exercice du jour est coché. */
export async function syncNeoHabitOnPractice(): Promise<void> {
    const todayIdx = getCurrentDayIndex();
    if (todayIdx < 0 || todayIdx >= totalDays) return;

    const { habits, addHabit, toggleHabitDay } = useAppStore.getState();
    let habit = habits.find((h) => h.name === NEO_HABIT_NAME);

    try {
        if (!habit) {
            habit = await addHabit({
                name: NEO_HABIT_NAME,
                type: 'start',
                totalDays,
                linkedIdentities: [],
                milestoneKey: NEO_MILESTONE_KEY,
            });
        }
        if (habit && !habit.progress[todayIdx]) {
            await toggleHabitDay(habit.id, todayIdx);
        }
    } catch {
        // non connecté ou erreur réseau
    }
}
