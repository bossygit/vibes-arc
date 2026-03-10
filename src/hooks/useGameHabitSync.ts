import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { getCurrentDayIndex } from '@/utils/habitUtils';
import { totalDays } from '@/utils/dateUtils';
import type { ViewType } from '@/types';

type GameViewKey = 'magicGratitude' | 'moneyMindset' | 'focusWheel' | 'manifestation';

const GAME_HABIT_KEYS: GameViewKey[] = ['magicGratitude', 'moneyMindset', 'focusWheel', 'manifestation'];

const GAME_HABITS: Record<GameViewKey, { name: string; type: 'start' }> = {
  magicGratitude: { name: 'Gratitude (The Magic)', type: 'start' },
  moneyMindset: { name: 'Abondance', type: 'start' },
  focusWheel: { name: 'Focus Wheel', type: 'start' },
  manifestation: { name: 'Manifestation KIA', type: 'start' },
};

/**
 * Lorsque la vue courante est un des 4 jeux (Gratitude, Abondance, Focus Wheel, Manifestation),
 * assure qu'une habitude dédiée existe et coche le jour courant dans le calendrier si pas déjà coché.
 */
export function useGameHabitSync(view: ViewType): void {
  useEffect(() => {
    if (!GAME_HABIT_KEYS.includes(view as GameViewKey)) return;

    const config = GAME_HABITS[view as GameViewKey];
    if (!config) return;

    const todayIdx = getCurrentDayIndex();
    if (todayIdx < 0 || todayIdx >= totalDays) return;

    const { habits, addHabit, toggleHabitDay } = useAppStore.getState();
    let habit = habits.find((h) => h.name === config.name);

    const run = async () => {
      try {
        if (!habit) {
          habit = await addHabit({
            name: config.name,
            type: config.type,
            totalDays,
            linkedIdentities: [],
          });
        }
        if (habit && !habit.progress[todayIdx]) {
          await toggleHabitDay(habit.id, todayIdx);
        }
      } catch {
        // Utilisateur non connecté ou erreur réseau : ne pas casser l'UI
      }
    };

    run();
  }, [view]);
}
