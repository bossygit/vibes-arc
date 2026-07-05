/**
 * Mapping noms d'habitudes → clés logiques pour le système de milestones.
 * Utilisé en fallback si `habit.milestoneKey` n'est pas défini.
 */
export const HABIT_KEY_ALIASES: Record<string, string[]> = {
    meditation: [
        'méditation',
        'meditation',
        'méditation quotidienne',
        'meditation quotidienne',
        'joe dispenza',
        'tuning into',
    ],
    wim_hof: [
        'wim hof',
        'breathwork',
        'respiration wim',
        'exposition au froid',
        'douche froide',
    ],
    journaling: [
        'journaling',
        'journal',
        'journée',
        'écriture',
        'ecriture',
    ],
    porno_stop: [
        'porno',
        'arrêt du porno',
        'arret du porno',
        'sevrage',
        'sobriété',
        'sobriete',
    ],
    gym: [
        'gym',
        'exercice',
        'musculation',
        'sport',
        'exercice physique',
    ],
    environment: [
        'environnement',
        'design de l\'environnement',
        'design environnement',
        'rangement',
    ],
    gratitude: [
        'gratitude',
        'gratitude (the magic)',
        'the magic',
        'pratique de la gratitude',
    ],
    manifestation: [
        'manifestation',
        'manifestation kia',
        'kia',
        'programme 60 jours',
    ],
    abundance: [
        'abondance',
        'wallet',
        'chèque virtuel',
        'cheque virtuel',
        'money mindset',
        'pratiques d\'abondance',
    ],
    pivots: [
        'pivot',
        'pivots',
        '3 pivots',
        'abraham-hicks pivot',
    ],
    karmic_management: [
        'jardin karmique',
        'karmic management',
        'karmic garden',
        'graine karmique',
    ],
    neo: [
        'neo',
        'orgasme non éjaculatoire',
        'neo practice',
        'voie du contrôle',
        'la voie du contrôle',
    ],
};

/** Clés connues des jeux / modules auto-créés */
export const GAME_HABIT_MILESTONE_KEYS: Record<string, string> = {
    'Gratitude (The Magic)': 'gratitude',
    'Abondance': 'abundance',
    'Focus Wheel': 'pivots',
    'Manifestation KIA': 'manifestation',
    'Jardin Karmique': 'karmic_management',
    'Neo': 'neo',
};

export function resolveHabitKey(habit: { name: string; milestoneKey?: string }): string | null {
    if (habit.milestoneKey) return habit.milestoneKey;

    const gameKey = GAME_HABIT_MILESTONE_KEYS[habit.name];
    if (gameKey) return gameKey;

    const normalized = habit.name.toLowerCase().trim();
    for (const [key, patterns] of Object.entries(HABIT_KEY_ALIASES)) {
        if (patterns.some((p) => normalized.includes(p))) {
            return key;
        }
    }
    return null;
}

export function suggestMilestoneKeyForName(name: string): string | undefined {
    const fake = { name, milestoneKey: undefined };
    const key = resolveHabitKey(fake);
    return key ?? undefined;
}
