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

const ACTION_PROMPTS = [
  "2 minutes pour une habitude.",
  "Une petite action maintenant.",
  "Fais une habitude maintenant.",
  "Protège ta streak aujourd'hui.",
  "Commence par un pas.",
];

const ACTION_TITLES = ["Action maintenant", "Petit pas", "Une habitude"];

function getStrength(input: LockScreenTriggerInput): TriggerStrength {
  if (input.chainPressure) return 'strong';
  if (input.todayRemaining > 2) return 'medium';
  return 'light';
}

export function generateLockScreenTrigger(input: LockScreenTriggerInput): LockScreenTriggerResult {
  const { todayRemaining, chainLength, chainPressure, currentStreak = 0 } = input;
  const strength = getStrength(input);

  // 1. todayRemaining === 0 : trigger doux
  if (todayRemaining === 0) {
    return {
      title: "Bien joué",
      message: "À demain pour la suite.",
      emoji: "✅",
      strength: 'light',
    };
  }

  // 2. chainPressure === true : trigger fort
  if (chainPressure) {
    return {
      title: "Ne la casse pas",
      message: `Ta chaîne de ${chainLength} jours a besoin d'aujourd'hui.`,
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
    title: "Bienvenue",
    message: "Crée une habitude pour commencer.",
    emoji: "🌱",
    strength: 'light',
  };
}
