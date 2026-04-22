/**
 * Lock Screen Trigger Engine — pure, deterministic, no I/O.
 * Generates action trigger (title, message, emoji, strength) for lock screen widget.
 */

export type TriggerStrength = 'light' | 'medium' | 'strong';

export interface LockScreenTriggerInput {
  todayRemaining: number;
  chainLength: number;
  chainPressure: boolean;
  currentStreak?: number;
}

export interface LockScreenTriggerResult {
  title: string;
  message: string;
  emoji: string;
  strength: TriggerStrength;
}

/** Pain-first : coût de l’inaction + micro-action (aligné api/widgets/v2 makeTrigger). */
const ACTION_PROMPTS = [
  "Ruminer coûte plus cher qu’agir 2 minutes. Fais une habitude.",
  "Un jour de plus sans = un jour de plus à te décevoir. Coupe court : un pas maintenant.",
  "L’écran te soulage 10 secondes ; ne pas tenir ta parole te suit toute la soirée.",
  "Petit pas ou spirale : à toi de choisir laquelle te pèse demain.",
  "L’effort minuscule bat l’angoisse prolongée. Une habitude, tout de suite.",
];

const ACTION_TITLES = [
  "Le prix de la pause",
  "Inaction ou preuve",
  "Coût du report",
];

function getStrength(input: LockScreenTriggerInput): TriggerStrength {
  if (input.chainPressure) return 'strong';
  if (input.todayRemaining > 2) return 'medium';
  return 'light';
}

export function generateLockScreenTrigger(input: LockScreenTriggerInput): LockScreenTriggerResult {
  const { todayRemaining, chainLength, chainPressure, currentStreak = 0 } = input;
  const strength = getStrength(input);

  // 1. todayRemaining === 0 : validation (pas de pain inutile après victoire)
  if (todayRemaining === 0) {
    return {
      title: "Bien joué",
      message: "Journée bouclée — la vision tire, la preuve reste.",
      emoji: "✅",
      strength: 'light',
    };
  }

  // 2. chainPressure === true : coût de rompre la chaîne
  if (chainPressure) {
    return {
      title: "Casser coûte plus cher",
      message: `Ta chaîne de ${chainLength} jours : rater aujourd’hui, c’est repartir de zéro émotionnellement. Deux minutes d’action pèsent moins qu’un soir de regret.`,
      emoji: "🔥",
      strength: 'strong',
    };
  }

  // 3. todayRemaining > 0 (sans chain pressure) : micro action, rotation déterministe
  const seed = currentStreak + todayRemaining + chainLength;
  const msgIdx = Math.abs(seed) % ACTION_PROMPTS.length;
  const titleIdx = Math.abs(seed) % ACTION_TITLES.length;
  return {
    title: ACTION_TITLES[titleIdx],
    message: ACTION_PROMPTS[msgIdx],
    emoji: "⚡",
    strength,
  };
}

export function getDefaultTrigger(): LockScreenTriggerResult {
  return {
    title: "Lier, sinon ça s’érode",
    message: "Sans habitude suivie, ton cerveau va chercher la facilité ailleurs. Commence par une seule.",
    emoji: "🌱",
    strength: 'light',
  };
}
