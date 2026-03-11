/**
 * Future Self Engine — client-side, pure, no I/O.
 * Same logic as api/widgets/futureSelfEngine for dashboard display.
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

export interface FutureSelfInput {
  currentStreak: number;
  longestStreak: number;
  completionRate?: number;
}

export interface FutureSelfResult {
  nextLevel: { name: string; daysRemaining: number };
  projectedStreak: { in7days: number; in30days: number };
  message: { title: string; message: string; emoji: string };
}

function getNextLevel(currentStreak: number): { name: string; daysRemaining: number } {
  for (const lvl of DISCIPLINE_LEVELS) {
    if (currentStreak < lvl.minStreak) {
      return { name: lvl.name, daysRemaining: lvl.minStreak - currentStreak };
    }
  }
  return { name: 'Legend', daysRemaining: 0 };
}

export function computeFutureSelf(input: FutureSelfInput): FutureSelfResult {
  const { currentStreak, completionRate = 0 } = input;
  const nextLevel = getNextLevel(currentStreak);
  const projectedStreak = {
    in7days: currentStreak + 7,
    in30days: currentStreak + 30,
  };

  if (currentStreak === 0) {
    return {
      nextLevel: { name: 'Builder', daysRemaining: 3 },
      projectedStreak: { in7days: 7, in30days: 30 },
      message: {
        title: 'Nouveau départ',
        message: 'En continuant, tu atteindras le prochain niveau.',
        emoji: '🌱',
      },
    };
  }

  if (nextLevel.daysRemaining >= 1 && nextLevel.daysRemaining <= 5) {
    return {
      nextLevel,
      projectedStreak,
      message: {
        title: 'Futur toi',
        message: `${nextLevel.daysRemaining} jours pour atteindre ${nextLevel.name}.`,
        emoji: '🚀',
      },
    };
  }

  if (currentStreak >= 14) {
    const identityMessages = [
      { title: 'Ton futur toi', message: 'Tu deviens quelqu'un qui ne lâche pas.', emoji: '✨' },
      { title: 'Identité en marche', message: 'Cette régularité forge des gens solides.', emoji: '🏆' },
    ];
    const idx = (currentStreak + completionRate) % identityMessages.length;
    return { nextLevel, projectedStreak, message: identityMessages[idx] };
  }

  if (currentStreak >= 3 && nextLevel.daysRemaining > 5) {
    return {
      nextLevel,
      projectedStreak,
      message: {
        title: 'Ton prochain niveau',
        message: 'Chaque jour compte pour ton prochain niveau.',
        emoji: '✨',
      },
    };
  }

  if (currentStreak >= 3) {
    const target = currentStreak % 2 === 0 ? projectedStreak.in30days : projectedStreak.in7days;
    return {
      nextLevel,
      projectedStreak,
      message: {
        title: 'Ta streak demain',
        message: `Si tu continues, ta streak atteindra ${target} jours.`,
        emoji: '🔥',
      },
    };
  }

  const transformMessages = [
    { title: 'Chaque jour compte', message: 'Chaque jour tu deviens plus discipliné.', emoji: '💪' },
    { title: 'Ton futur', message: 'Ton futur se construit une habitude à la fois.', emoji: '✨' },
    { title: 'Aujourd'hui', message: 'Petites actions aujourd'hui, futur plus fort.', emoji: '🌱' },
  ];
  const idx = currentStreak % transformMessages.length;
  return {
    nextLevel,
    projectedStreak,
    message: transformMessages[idx],
  };
}
