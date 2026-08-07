import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { getCurrentDayIndex } from '@/utils/habitUtils';
import { totalDays } from '@/utils/dateUtils';
import type { ViewType } from '@/types';

type GameViewKey = 'magicGratitude' | 'moneyMindset' | 'focusWheel' | 'manifestation' | 'segmentIntending';

const GAME_HABIT_KEYS: GameViewKey[] = ['magicGratitude', 'moneyMindset', 'focusWheel', 'manifestation', 'segmentIntending'];

const GAME_HABITS: Record<GameViewKey, { name: string; type: 'start'; milestoneKey?: string; autoCheck?: boolean }> = {
  magicGratitude: { name: 'Gratitude (The Magic)', type: 'start', milestoneKey: 'gratitude', autoCheck: true },
  moneyMindset: { name: 'Abondance', type: 'start', milestoneKey: 'abundance', autoCheck: true },
  focusWheel: { name: 'Focus Wheel', type: 'start', milestoneKey: 'pivots', autoCheck: true },
  manifestation: { name: 'Manifestation KIA', type: 'start', milestoneKey: 'manifestation', autoCheck: true },
  // Segment Intending : pas de milestone, coche UNIQUEMENT à l'enregistrement d'une intention (autoCheck: false)
  segmentIntending: { name: 'Segment Intending', type: 'start', autoCheck: false },
};

/**
 * Lorsque la vue courante est un des jeux (Gratitude, Abondance, Focus Wheel, Manifestation, Segment Intending),
 * assure qu'une habitude dédiée existe. Pour les jeux avec autoCheck (défaut), coche le jour courant
 * dans le calendrier si pas déjà coché. Pour Segment Intending (autoCheck: false), la coche est déclenchée
 * par le composant au moment où une intention est réellement enregistrée.
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
            milestoneKey: config.milestoneKey,
          });
        }
        if (config.autoCheck !== false && habit && !habit.progress[todayIdx]) {
          await toggleHabitDay(habit.id, todayIdx);
        }
      } catch {
        // Utilisateur non connecté ou erreur réseau : ne pas casser l'UI
      }
    };

    run();
  }, [view]);
}
