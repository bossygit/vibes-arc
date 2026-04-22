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
        title: 'Casser coûte plus cher',
        message: `Ta chaîne de ${chainLength} jours : rater aujourd’hui, c’est repartir de zéro émotionnellement. Deux minutes d’action pèsent moins qu’un soir de regret.`,
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
        title: 'Rompant = douleur x2',
        message: `${currentStreak} jours d’affilée : aujourd’hui tu choisis entre un micro-effort et le twist au ventre de « j’ai encore lâché ».`,
        tone: 'protect_streak',
        emoji: '🔥',
      },
      streakPressure: true,
    };
  }

  // 2. Recovery: streak = 0 (pain-first seulement s’il reste du travail aujourd’hui)
  if (currentStreak === 0 && todayRemaining > 0) {
    return {
      level,
      insight: {
        title: 'L’inaction a un prix',
        message:
          'Rester figé, c’est t’entraîner à ne pas te faire confiance. Un passage ridiculement petit aujourd’hui coûte moins qu’un jour de plus sur la pente facile.',
        tone: 'restart_pain',
        emoji: '⚡',
      },
      streakPressure: false,
    };
  }
  if (currentStreak === 0) {
    return {
      level,
      insight: {
        title: 'Alignement',
        message: 'Aujourd’hui, ton futur s’appuie sur des preuves, pas des intentions.',
        tone: 'restart',
        emoji: '✨',
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
    if (todayRemaining > 0) {
      return {
        level,
        insight: {
          title: 'Identité en jeu',
          message:
            'Chaque report dit « je n’en suis pas le genre ». Un passage maintenant, c’est moins pénible que d’alimenter l’histoire du « pas encore ».',
          tone: 'identity_pain',
          emoji: '⭐',
        },
        streakPressure: false,
      };
    }
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
    if (todayRemaining > 0) {
      return {
        level,
        insight: {
          title: 'Ne pas gâcher l’élan',
          message: `${currentStreak} jours d’affilée : aujourd’hui c’est l’inaction, pas l’effort, qui fera le plus mal au réveil.`,
          tone: 'momentum_pain',
          emoji: '💪',
        },
        streakPressure: false,
      };
    }
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
    const msg =
      todayRemaining > 0
        ? `La semaine est bonne (${Math.round(completionRate)} %), mais ce qui compte, c’est le prochain choix. Ne paye pas le soir le confort d’alors.`
        : `Tu as complété ${Math.round(completionRate)}% de tes habitudes cette semaine.`;
    return {
      level,
      insight: {
        title: todayRemaining > 0 ? 'Bonne moyenne, risque aujourd’hui' : 'Bonne semaine',
        message: msg,
        tone: todayRemaining > 0 ? 'week_tension' : 'celebrate_progress',
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
      title: 'Payer maintenant ou plus tard',
      message:
        todayRemaining > 0
          ? 'L’inaction a un coût (tension, image de toi, report). Un pas minuscule maintenant pèse moins que l’inquiétude ce soir.'
          : 'Quand c’est coché, c’est moins le plaisir que le soulagement d’avoir tenu la barre.',
      tone: 'pain_default',
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
      title: 'Sans preuve, c’est l’inconfort',
      message: 'Sans habitude, ton cerveau fuit vers la facilité. La première preuve, même ridicule, vaut toutes les listes d’intentions.',
      tone: 'restart_pain',
      emoji: '⚡',
    },
    streakPressure: false,
  };
}
