/**
 * Dopamine Reward Loop Engine — pure, deterministic, no I/O.
 * Generates micro-rewards (title, message, emoji, level) from summary events.
 */

const MILESTONES = [3, 7, 14, 21, 30, 60, 100];

export type RewardLevel = 'low' | 'medium' | 'high' | 'epic';

export interface DopamineRewardInput {
  habitCompletedToday: boolean;
  allHabitsCompletedToday: boolean;
  currentStreak: number;
  chainLength: number;
  chainProtected: boolean;
  weeklyCompletionRate: number;
  dayOfWeek?: number;
}

export interface DopamineRewardResult {
  rewardType: string;
  rewardLevel: RewardLevel;
  title: string;
  message: string;
  emoji: string;
}

function seed(input: DopamineRewardInput): number {
  return (
    input.currentStreak +
    input.weeklyCompletionRate +
    input.chainLength +
    (input.dayOfWeek ?? 0)
  );
}

function isSurprise(input: DopamineRewardInput): boolean {
  const s = input.currentStreak + input.weeklyCompletionRate + input.chainLength;
  return s % 10 === 0;
}

const HABIT_COMPLETION_MESSAGES = [
  'Bien joué aujourd\'hui.',
  'Un pas de plus.',
  'La régularité paie.',
  'Tu tiens ta promesse.',
  'Le momentum continue.',
];

export function generateDopamineReward(input: DopamineRewardInput): DopamineRewardResult {
  const base = chooseReward(input);
  if (isSurprise(input)) {
    return {
      ...base,
      title: 'Bonus motivation',
      message: 'Ta discipline est impressionnante.',
      emoji: '✨',
    };
  }
  return base;
}

function chooseReward(input: DopamineRewardInput): DopamineRewardResult {
  const {
    habitCompletedToday,
    allHabitsCompletedToday,
    currentStreak,
    chainLength,
    chainProtected,
    weeklyCompletionRate,
  } = input;

  // 1. milestone_reached (epic)
  if (MILESTONES.includes(currentStreak)) {
    const messages: Record<number, string> = {
      3: 'Trois jours d\'affilée.',
      7: 'Sept jours d\'affilée.',
      14: 'Quatorze jours d\'affilée.',
      21: 'Vingt et un jours d\'affilée.',
      30: 'Trente jours d\'affilée.',
      60: 'Soixante jours d\'affilée.',
      100: 'Cent jours d\'affilée.',
    };
    return {
      rewardType: 'milestone_reached',
      rewardLevel: 'epic',
      title: 'Jalon atteint',
      message: messages[currentStreak] ?? `${currentStreak} jours d'affilée.`,
      emoji: '🏆',
    };
  }

  // 2. chain_protected (high)
  if (chainProtected) {
    return {
      rewardType: 'chain_protected',
      rewardLevel: 'high',
      title: 'Chaîne protégée',
      message: 'Tu as sauvegardé ta chaîne aujourd\'hui.',
      emoji: '🔥',
    };
  }

  // 3. daily_perfect (high)
  if (allHabitsCompletedToday) {
    return {
      rewardType: 'daily_perfect',
      rewardLevel: 'high',
      title: 'Journée parfaite',
      message: 'Toutes les habitudes complétées aujourd\'hui.',
      emoji: '⚡',
    };
  }

  // 4. streak_extended (medium)
  if (habitCompletedToday && currentStreak >= 1) {
    return {
      rewardType: 'streak_extended',
      rewardLevel: 'medium',
      title: 'Streak en cours',
      message: `${currentStreak} jours de discipline.`,
      emoji: '🔥',
    };
  }

  // 5. weekly_progress_high (high)
  if (weeklyCompletionRate >= 70) {
    return {
      rewardType: 'weekly_progress_high',
      rewardLevel: 'high',
      title: 'Bonne semaine',
      message: `${weeklyCompletionRate}% de complétion cette semaine.`,
      emoji: '📈',
    };
  }

  // 6. habit_completion (low)
  if (habitCompletedToday) {
    const idx = Math.abs(seed(input)) % HABIT_COMPLETION_MESSAGES.length;
    return {
      rewardType: 'habit_completion',
      rewardLevel: 'low',
      title: 'Bien joué',
      message: HABIT_COMPLETION_MESSAGES[idx],
      emoji: '🔥',
    };
  }

  // 7. anticipation (low)
  return {
    rewardType: 'anticipation',
    rewardLevel: 'low',
    title: 'Continue demain',
    message: 'Demain prolonge ta streak.',
    emoji: '🚀',
  };
}

export function getDefaultReward(): DopamineRewardResult {
  return {
    rewardType: 'anticipation',
    rewardLevel: 'low',
    title: 'Continue demain',
    message: 'Chaque jour compte.',
    emoji: '🚀',
  };
}
