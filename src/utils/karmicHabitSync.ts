import { useAppStore } from '@/store/useAppStore';
import { getCurrentDayIndex } from '@/utils/habitUtils';
import { totalDays } from '@/utils/dateUtils';
import { KARMIC_HABIT_NAME, KARMIC_MILESTONE_KEY } from '@/utils/karmicGardenUtils';

/** Coche l'habitude Jardin Karmique après session matinale complète. */
export async function syncKarmicHabitOnMorningComplete(): Promise<void> {
    const todayIdx = getCurrentDayIndex();
    if (todayIdx < 0 || todayIdx >= totalDays) return;

    const { habits, addHabit, toggleHabitDay } = useAppStore.getState();
    let habit = habits.find((h) => h.name === KARMIC_HABIT_NAME);

    try {
        if (!habit) {
            habit = await addHabit({
                name: KARMIC_HABIT_NAME,
                type: 'start',
                totalDays,
                linkedIdentities: [],
                milestoneKey: KARMIC_MILESTONE_KEY,
            });
        }
        if (habit && !habit.progress[todayIdx]) {
            await toggleHabitDay(habit.id, todayIdx);
        }
    } catch {
        // non connecté ou erreur réseau
    }
}
