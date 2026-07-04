export const KARMIC_LEVELS = [
    { threshold: 0, title: 'Seed Planter', emoji: '🌱' },
    { threshold: 100, title: 'Gardener', emoji: '🌿' },
    { threshold: 350, title: 'Cultivator', emoji: '🌳' },
    { threshold: 800, title: 'Master Gardener', emoji: '🌲' },
    { threshold: 1500, title: 'Karmic Architect', emoji: '✨' },
    { threshold: 3000, title: 'Seed Master', emoji: '👑' },
] as const;

/** Graines cumulées par domaine → stade visuel 0–4 */
export const PLOT_STAGE_THRESHOLDS = [0, 5, 15, 40, 100] as const;

export const PLOT_STAGE_EMOJI = ['🟫', '🌱', '🌿', '🌳', '🌸', '🍎'] as const;

export const FREE_SEED_KARMA_DAILY_CAP = 30;
