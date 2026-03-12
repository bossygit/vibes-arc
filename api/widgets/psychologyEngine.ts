/**
 * Psychological Streak Engine — pure, deterministic, no I/O.
 * Drives widget copy: level, insight (title, message, tone, emoji), streakPressure.
 */

const DISCIPLINE_LEVELS = [
  { level: 1, name: 'Starter', minStreak: 0 },
  { level: 2, name: 'Builder', minStreak: 3 },
  { level: 3, name: 'Consistent', minStreak: 7 },
  { level: 4, name: 'Focused', minStreak: 14 },
  { level: 5, name: 'Disciplined', minStreak: 30 },
  { level: 6, name: 'Unstoppable', minStreak: 60 },
  { level: 7, name: 'Legend', minStreak: 100 },
] as const;

const MILESTONES = [3, 7, 14, 21, 30, 60, 100];

export interface PsychologyInput {
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  todayRemaining: number;
  monthlyScore: number;
  /** Never Break the Chain: at risk today (chain >= 3 and today not completed) */
  chainPressure?: boolean;
  chainLength?: number;
}

export interface PsychologyResult {
  level: { number: number; name: string };
  insight: { title: string; message: string; tone: string; emoji: string };
  streakPressure: boolean;
}

function getLevelFromLongestStreak(longestStreak: number): { number: number; name: string } {
  let chosen: { readonly level: number; readonly name: string; readonly minStreak: number } = DISCIPLINE_LEVELS[0];
  for (const lvl of DISCIPLINE_LEVELS) {
    if (longestStreak >= lvl.minStreak) chosen = lvl;
  }
  return { number: chosen.level, name: chosen.name };
}

export function generatePsychologicalInsight(input: PsychologyInput): PsychologyResult {
  const { currentStreak, longestStreak, completionRate, todayRemaining, chainPressure, chainLength } = input;
  const level = getLevelFromLongestStreak(longestStreak);

  // 0. Chain at risk (highest priority): Never Break the Chain — chain >= 3 and today not completed
  if (chainPressure && (chainLength ?? 0) >= 3) {
    return {
      level,
      insight: {
        title: 'Ne la casse pas',
        message: `Ta chaîne de ${chainLength} jours a besoin d’aujourd’hui.`,
        tone: 'protect_chain',
        emoji: '🔥',
      },
      streakPressure: false,
    };
  }

  // 1. Streak pressure: streak >= 3 and habits remaining today
  if (currentStreak >= 3 && todayRemaining > 0) {
    return {
      level,
      insight: {
        title: 'Protège ta streak',
        message: `${currentStreak} jours d’affilée. Ne la casse pas aujourd’hui.`,
        tone: 'protect_streak',
        emoji: '🔥',
      },
      streakPressure: true,
    };
  }

  // 2. Recovery: streak = 0
  if (currentStreak === 0) {
    return {
      level,
      insight: {
        title: 'Nouveau départ',
        message: 'Chaque bonne habitude commence par un premier jour.',
        tone: 'restart',
        emoji: '🌱',
      },
      streakPressure: false,
    };
  }

  // 3. Milestone: current streak is exactly a milestone
  if (MILESTONES.includes(currentStreak)) {
    const messages: Record<number, string> = {
      3: 'Trois jours de suite. Le début d’une routine.',
      7: 'Sept jours consécutifs. La discipline s’installe.',
      14: 'Quatorze jours d’affilée. C’est de la vraie discipline.',
      21: 'Vingt et un jours. Une habitude solide se construit.',
      30: 'Trente jours. Tu es en train de changer.',
      60: 'Soixante jours. Tu es inarrêtable.',
      100: 'Cent jours. Tu es une légende.',
    };
    return {
      level,
      insight: {
        title: 'Jalon de streak',
        message: messages[currentStreak] ?? `${currentStreak} jours d’affilée. Bravo.`,
        tone: 'celebrate_progress',
        emoji: '🏆',
      },
      streakPressure: false,
    };
  }

  // 4. Identity: streak >= 7 (not already milestone)
  if (currentStreak >= 7) {
    const identityMessages = [
      'Tu deviens quelqu’un qui tient ses promesses.',
      'Cette régularité change des vies.',
      'Tu construis une vraie discipline.',
    ];
    const idx = currentStreak % identityMessages.length;
    return {
      level,
      insight: {
        title: 'Identité en marche',
        message: identityMessages[idx],
        tone: 'identity',
        emoji: '⭐',
      },
      streakPressure: false,
    };
  }

  // 5. Momentum: streak 3–6
  if (currentStreak >= 3) {
    const title = currentStreak >= 5 ? 'Momentum puissant' : 'Momentum en cours';
    const msg =
      currentStreak === 5
        ? 'Cinq jours de suite. La discipline devient ton identité.'
        : `${currentStreak} jours d’affilée. Tu prends de bonnes habitudes.`;
    return {
      level,
      insight: {
        title,
        message: msg,
        tone: 'momentum',
        emoji: '💪',
      },
      streakPressure: false,
    };
  }

  // 6. Strong week
  if (completionRate >= 70) {
    return {
      level,
      insight: {
        title: 'Bonne semaine',
        message: `Tu as complété ${completionRate}% de tes habitudes cette semaine.`,
        tone: 'celebrate_progress',
        emoji: '📈',
      },
      streakPressure: false,
    };
  }

  // 7. Future self (deterministic: use streak + completionRate)
  if ((currentStreak + completionRate) % 3 === 0 && currentStreak >= 1) {
    const futureMessages = [
      'Ton toi futur sera fier de cette discipline.',
      'Ces petites victoires construisent une vie plus forte.',
    ];
    const idx = (currentStreak + completionRate) % futureMessages.length;
    return {
      level,
      insight: {
        title: 'Pour ton futur',
        message: futureMessages[idx],
        tone: 'identity',
        emoji: '✨',
      },
      streakPressure: false,
    };
  }

  // 8. Default
  return {
    level,
    insight: {
      title: 'Aujourd’hui compte',
      message: 'C’est le bon jour pour avancer. Une habitude suffit.',
      tone: 'momentum',
      emoji: '✨',
    },
    streakPressure: false,
  };
}

/** Default psychology for empty state (no user or no habits). */
export function getDefaultPsychology(): PsychologyResult {
  return {
    level: { number: 1, name: 'Starter' },
    insight: {
      title: 'Nouveau départ',
      message: 'Aujourd’hui est le bon jour pour commencer.',
      tone: 'restart',
      emoji: '🌱',
    },
    streakPressure: false,
  };
}
