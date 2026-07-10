import { useAppStore } from '@/store/useAppStore';
import { getCurrentDayIndex } from '@/utils/habitUtils';
import { totalDays } from '@/utils/dateUtils';
import { FOCUS_HABIT_NAME, FOCUS_MILESTONE_KEY } from '@/utils/focusStatsUtils';

/**
 * Coche l'habitude Focus 17/68 après chaque session de 17s ou plus (palier ≥ 1).
 * Crée l'habitude automatiquement si elle n'existe pas encore.
 */
export async function syncFocusHabitOnSession(): Promise<void> {
  const todayIdx = getCurrentDayIndex();
  if (todayIdx < 0 || todayIdx >= totalDays) return;

  const { habits, addHabit, toggleHabitDay } = useAppStore.getState();
  let habit = habits.find((h) => h.name === FOCUS_HABIT_NAME);

  try {
    if (!habit) {
      habit = await addHabit({
        name: FOCUS_HABIT_NAME,
        type: 'start',
        totalDays,
        linkedIdentities: [],
        milestoneKey: FOCUS_MILESTONE_KEY,
      });
    }
    if (habit && !habit.progress[todayIdx]) {
      await toggleHabitDay(habit.id, todayIdx);
    }
  } catch {
    // Déconnecté ou erreur réseau — l'habitude sera créée au prochain succès
  }
}
