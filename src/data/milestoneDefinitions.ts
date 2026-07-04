import type { MilestoneDefinition } from '@/types';

const ROUTINE_STREAK_THRESHOLDS = [7, 21, 45, 60, 90] as const;
const PORNO_THRESHOLDS = [7, 21, 45, 90] as const;
const MANIFEST_KIA_THRESHOLDS = [10, 15, 30, 45, 60] as const;

function routineStreakMilestones(): MilestoneDefinition[] {
    return ROUTINE_STREAK_THRESHOLDS.map((n) => ({
        id: `routine_streak_${n}`,
        title: `Routine ${n} jours`,
        description: `${n} jours consécutifs de méditation (pilier de ta routine matinale)`,
        domain: 'routine' as const,
        identityNameMatch: ['routine', 'matin', 'dispenza', 'méditat'],
        type: 'streak' as const,
        threshold: n,
        habitKeys: ['meditation'],
        emoji: n >= 90 ? '🌅' : n >= 45 ? '☀️' : '🔥',
        celebrationMessage: `${n} jours de routine. Tu ne deviens pas quelqu'un qui médite — tu le deviens.`,
        telegramMessage: `🏆 Milestone : Routine ${n} jours\n${n} jours consécutifs. La discipline est le pont. Ne lâche pas maintenant.`,
    }));
}

function routineComboMilestones(): MilestoneDefinition[] {
    return [7, 14, 21].map((n) => ({
        id: `routine_combo_morning_${n}`,
        title: `Combo matin ${n}j`,
        description: `Méditation + Wim Hof + Journaling le même jour, ${n} jours d'affilée`,
        domain: 'routine' as const,
        identityNameMatch: ['routine', 'matin'],
        type: 'same_day_combo' as const,
        threshold: n,
        habitKeys: ['meditation', 'wim_hof', 'journaling'],
        emoji: '🧘',
        celebrationMessage: `${n} jours de combo matin complet. Corps, souffle, intention — alignés.`,
        telegramMessage: `🏆 Milestone : Combo matin ${n} jours\nMéditation + Wim Hof + Journaling. Tu programmes ta journée avant qu'elle ne te programme.`,
    }));
}

function healthMilestones(): MilestoneDefinition[] {
    const porno = PORNO_THRESHOLDS.map((n) => ({
        id: `health_porno_${n}`,
        title: `Sobriété ${n}j`,
        description: `${n} jours sans rechute — signal de régulation émotionnelle`,
        domain: 'health' as const,
        identityNameMatch: ['sobre', 'discipline', 'santé', 'sante', 'corps'],
        type: 'streak' as const,
        threshold: n,
        habitKeys: ['porno_stop'],
        emoji: n >= 90 ? '💎' : '🛡️',
        celebrationMessage: `${n} jours. Chaque jour sans rechute, tu reprends le volant.`,
        telegramMessage: `🏆 Milestone : Sobriété ${n} jours\n${n} jours. La rechute n'est pas un échec moral — mais l'inaction répétée a un coût. Continue.`,
    }));

    return [
        ...porno,
        {
            id: 'health_gym_4w',
            title: 'Gym 3x/sem × 4 sem',
            description: 'Au moins 3 séances de gym par semaine pendant 4 semaines consécutives',
            domain: 'health',
            identityNameMatch: ['athlète', 'athlete', 'corps', 'santé', 'sante', 'sport'],
            type: 'weekly_frequency',
            threshold: 4,
            habitKeys: ['gym'],
            weeklyMinPerWeek: 3,
            weeklyWeeks: 4,
            emoji: '💪',
            celebrationMessage: '4 semaines à 3+ séances. Le corps suit l\'identité.',
            telegramMessage: '🏆 Milestone : Gym 3x/semaine × 4 semaines\nTu incarnes quelqu\'un qui prend soin de son corps. Pas la performance — l\'identité.',
        },
        {
            id: 'health_env_14',
            title: 'Environnement 14j',
            description: '14 jours consécutifs de design d\'environnement (espace + digital)',
            domain: 'health',
            type: 'streak',
            threshold: 14,
            habitKeys: ['environment'],
            emoji: '🏠',
            celebrationMessage: '14 jours. Ton espace programme ton comportement.',
            telegramMessage: '🏆 Milestone : Environnement 14 jours\nUn espace ordonné = un signal au cerveau : ici, on produit.',
        },
        {
            id: 'health_gratitude_9',
            title: 'Gratitude 9j',
            description: '9 jours consécutifs de pratique de gratitude',
            domain: 'health',
            type: 'streak',
            threshold: 9,
            habitKeys: ['gratitude'],
            emoji: '💛',
            celebrationMessage: '9 jours de gratitude. L\'attention suit ce que tu nourris.',
            telegramMessage: '🏆 Milestone : Gratitude 9 jours\n9 jours. Tu recalibres ton attention vers ce qui fonctionne déjà.',
        },
        {
            id: 'health_identity_70',
            title: 'Identité santé 70%',
            description: 'Score d\'intégration identité santé/corps ≥ 70%',
            domain: 'health',
            identityNameMatch: ['santé', 'sante', 'corps', 'athlète', 'athlete', 'sport'],
            type: 'identity_score',
            threshold: 70,
            habitKeys: [],
            emoji: '🌿',
            celebrationMessage: '70% d\'intégration identité santé. Tu deviens cette version.',
            telegramMessage: '🏆 Milestone : Identité santé 70%\n70% d\'intégration. L\'identité précède le comportement — et tu le prouves.',
        },
        {
            id: 'health_identity_90',
            title: 'Identité santé 90%',
            description: 'Score d\'intégration identité santé/corps ≥ 90%',
            domain: 'health',
            identityNameMatch: ['santé', 'sante', 'corps', 'athlète', 'athlete', 'sport'],
            type: 'identity_score',
            threshold: 90,
            habitKeys: [],
            emoji: '🌟',
            celebrationMessage: '90% d\'intégration identité santé. Presque entièrement incarné.',
            telegramMessage: '🏆 Milestone : Identité santé 90%\n90% d\'intégration. Tu n\'es plus en train d\'essayer — tu es en train d\'être.',
        },
        {
            id: 'health_composite_discipline',
            title: 'Triple discipline',
            description: 'Porno ≥ 21j + Gym ≥ 14j + Environnement ≥ 7j simultanément',
            domain: 'health',
            identityNameMatch: ['discipline', 'sobre', 'athlète', 'athlete'],
            type: 'identity_composite',
            threshold: 1,
            habitKeys: ['porno_stop', 'gym', 'environment'],
            parallelRules: [
                { habitKey: 'porno_stop', minStreak: 21 },
                { habitKey: 'gym', minStreak: 14 },
                { habitKey: 'environment', minStreak: 7 },
            ],
            emoji: '⚔️',
            celebrationMessage: 'Triple discipline active. Sobriété + corps + environnement — alignés.',
            telegramMessage: '🏆 Milestone : Triple discipline\nPorno 21j + Gym 14j + Environnement 7j. Tu ne cèdes plus par défaut.',
        },
    ];
}

function manifestationMilestones(): MilestoneDefinition[] {
    const kiaStreaks = MANIFEST_KIA_THRESHOLDS.filter((n) => n !== 10).map((n) => ({
        id: `manifest_kia_${n}`,
        title: `Programme KIA ${n}j`,
        description: `${n} jours du programme manifestation KIA`,
        domain: 'manifestation' as const,
        identityNameMatch: ['manifest', 'abondance', 'align'],
        type: 'streak' as const,
        threshold: n,
        habitKeys: ['manifestation'],
        emoji: n >= 60 ? '🚗' : '✨',
        celebrationMessage: `${n} jours de manifestation. Le signal d'intention est constant.`,
        telegramMessage: `🏆 Milestone : Programme KIA ${n} jours\n${n} jours. Tu n'as pas besoin de savoir COMMENT — seulement d'être en match vibratoire.`,
    }));

    return [
        ...kiaStreaks,
        {
            id: 'manifest_daily_10',
            title: 'Manifestation 10j',
            description: '10 jours consécutifs de pratique de manifestation',
            domain: 'manifestation',
            type: 'streak',
            threshold: 10,
            habitKeys: ['manifestation'],
            emoji: '🌟',
            celebrationMessage: '10 jours de manifestation. Le désir est ancré.',
            telegramMessage: '🏆 Milestone : Manifestation 10 jours\n10 jours consécutifs. La constance envoie le signal.',
        },
        {
            id: 'manifest_wallet_7',
            title: 'Abondance 7j',
            description: '7 jours consécutifs de pratique Wallet / Chèque virtuel',
            domain: 'manifestation',
            type: 'streak',
            threshold: 7,
            habitKeys: ['abundance'],
            emoji: '💰',
            celebrationMessage: '7 jours d\'abondance. Tu ressens l\'argent, pas seulement l\'imagines.',
            telegramMessage: '🏆 Milestone : Abondance 7 jours\n7 jours. Reprogrammer la relation à l\'argent — un jour à la fois.',
        },
        {
            id: 'manifest_wallet_21',
            title: 'Abondance 21j',
            description: '21 jours consécutifs de pratique Wallet / Chèque virtuel',
            domain: 'manifestation',
            type: 'streak',
            threshold: 21,
            habitKeys: ['abundance'],
            emoji: '💎',
            celebrationMessage: '21 jours d\'abondance. Le corps apprend que c\'est normal.',
            telegramMessage: '🏆 Milestone : Abondance 21 jours\n21 jours. L\'abondance devient ton état par défaut.',
        },
        {
            id: 'manifest_abundance_combo_7',
            title: 'Combo abondance 7j',
            description: 'Abondance + Gratitude le même jour, 7 jours d\'affilée',
            domain: 'manifestation',
            type: 'same_day_combo',
            threshold: 7,
            habitKeys: ['abundance', 'gratitude'],
            emoji: '🌊',
            celebrationMessage: '7 jours combo abondance. Flux et gratitude — même fréquence.',
            telegramMessage: '🏆 Milestone : Combo abondance 7 jours\nAbondance + Gratitude le même jour. Signal vibratoire aligné.',
        },
        {
            id: 'manifest_alignment_combo',
            title: 'Alignement vibratoire',
            description: 'Porno ≥ 21j + Gratitude ≥ 9j + Manifestation ≥ 10j simultanément',
            domain: 'manifestation',
            identityNameMatch: ['manifest', 'align', 'abondance'],
            type: 'parallel_combo',
            threshold: 1,
            habitKeys: ['porno_stop', 'gratitude', 'manifestation'],
            parallelRules: [
                { habitKey: 'porno_stop', minStreak: 21 },
                { habitKey: 'gratitude', minStreak: 9 },
                { habitKey: 'manifestation', minStreak: 10 },
            ],
            emoji: '🎯',
            celebrationMessage: 'Alignement vibratoire atteint. Sobriété + gratitude + manifestation — en parallèle.',
            telegramMessage: '🏆 Milestone : Alignement vibratoire\nPorno 21j + Gratitude 9j + Manifestation 10j simultanément. Tu es en match.',
        },
    ];
}

function identityRoutineMilestones(): MilestoneDefinition[] {
    return [
        {
            id: 'identity_routine_21',
            title: 'Identité routine 21%',
            description: 'Score d\'intégration identité routine/matin ≥ 21%',
            domain: 'routine',
            identityNameMatch: ['routine', 'matin', 'dispenza', 'méditat'],
            type: 'identity_score',
            threshold: 21,
            habitKeys: [],
            emoji: '🌄',
            celebrationMessage: '21% d\'intégration routine. La fondation se pose.',
            telegramMessage: '🏆 Milestone : Identité routine 21%\nTu poses les fondations. Continue avant que l\'ancien schéma reprenne le volant.',
        },
        {
            id: 'identity_routine_composite',
            title: 'Routine incarnée',
            description: 'Méditation ≥ 21j + Wim Hof ≥ 14j + Journaling ≥ 7j simultanément',
            domain: 'routine',
            identityNameMatch: ['routine', 'matin'],
            type: 'identity_composite',
            threshold: 1,
            habitKeys: ['meditation', 'wim_hof', 'journaling'],
            parallelRules: [
                { habitKey: 'meditation', minStreak: 21 },
                { habitKey: 'wim_hof', minStreak: 14 },
                { habitKey: 'journaling', minStreak: 7 },
            ],
            emoji: '👑',
            celebrationMessage: 'Routine incarnée. Les trois piliers tiennent ensemble.',
            telegramMessage: '🏆 Milestone : Routine incarnée\nMéditation 21j + Wim Hof 14j + Journaling 7j. Tu programmes ta vie avant 8h.',
        },
    ];
}

export const MILESTONE_DEFINITIONS: MilestoneDefinition[] = [
    ...routineStreakMilestones(),
    ...routineComboMilestones(),
    ...identityRoutineMilestones(),
    ...healthMilestones(),
    ...manifestationMilestones(),
];

export const MILESTONE_DOMAINS: { id: MilestoneDefinition['domain']; label: string; emoji: string }[] = [
    { id: 'routine', label: 'Routine', emoji: '🌅' },
    { id: 'health', label: 'Santé', emoji: '💪' },
    { id: 'manifestation', label: 'Manifestation', emoji: '✨' },
];
