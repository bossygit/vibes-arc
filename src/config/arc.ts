/**
 * L'Arc — colonne vertébrale de Vibes Arc.
 *
 * L'application n'est pas une collection d'outils : c'est un cycle en quatre
 * étapes que l'on parcourt chaque jour et chaque semaine.
 *
 *   1. Vision     — qui veux-je devenir ?
 *   2. Identité   — quelles croyances et quels comportements définissent cette personne ?
 *   3. Action     — quelles preuves concrètes puis-je produire chaque jour ?
 *   4. Évolution  — que m'apprennent mes résultats sur moi-même ?
 *
 * Chaque module existant est rattaché à UNE étape (celle à laquelle il répond).
 * Ce fichier est la source unique utilisée par la navigation, les pages d'étape
 * et le fil d'Ariane : pour déplacer un module, on change sa ligne ici.
 */
import type { LucideIcon } from 'lucide-react';
import { Compass, Fingerprint, Footprints, Sprout } from 'lucide-react';
import type { ViewType } from '@/types';

export type ArcStageKey = 'vision' | 'identity' | 'action' | 'evolution';

export interface ArcStageTheme {
    /** Dégradé du bandeau d'étape (texte blanc par-dessus) */
    gradient: string;
    /** Fond doux (cartes, pastilles) */
    soft: string;
    /** Bordure assortie */
    border: string;
    /** Texte accentué sur fond clair */
    text: string;
    /** Fond plein (bouton actif, texte blanc) */
    strong: string;
    /** Pastille / point */
    dot: string;
    /** Survol d'un élément neutre */
    hover: string;
    /** Bordure au survol d'une carte (classe littérale pour que Tailwind la génère) */
    hoverBorder: string;
}

export interface ArcStage {
    key: ArcStageKey;
    step: 1 | 2 | 3 | 4;
    label: string;
    question: string;
    /** Ce que l'étape apporte, en une phrase */
    promise: string;
    hub: ViewType;
    icon: LucideIcon;
    theme: ArcStageTheme;
}

export const ARC_STAGES: ArcStage[] = [
    {
        key: 'vision',
        step: 1,
        label: 'Vision',
        question: 'Qui veux-je devenir ?',
        promise: 'Nommer la personne que tu deviens et ce que tu veux vivre — le cap de tout le reste.',
        hub: 'hubVision',
        icon: Compass,
        theme: {
            gradient: 'from-violet-600 to-purple-700',
            soft: 'bg-violet-50',
            border: 'border-violet-200',
            text: 'text-violet-700',
            strong: 'bg-violet-600',
            dot: 'bg-violet-500',
            hover: 'hover:bg-violet-50',
            hoverBorder: 'hover:border-violet-300',
        },
    },
    {
        key: 'identity',
        step: 2,
        label: 'Identité',
        question: 'Quelles croyances et quels comportements définissent cette personne ?',
        promise: 'Traduire la vision en identités : ce que cette personne croit, et ce qu’elle fait.',
        hub: 'hubIdentity',
        icon: Fingerprint,
        theme: {
            gradient: 'from-sky-600 to-blue-700',
            soft: 'bg-sky-50',
            border: 'border-sky-200',
            text: 'text-sky-700',
            strong: 'bg-sky-700',
            dot: 'bg-sky-500',
            hover: 'hover:bg-sky-50',
            hoverBorder: 'hover:border-sky-300',
        },
    },
    {
        key: 'action',
        step: 3,
        label: 'Action',
        question: 'Quelles preuves concrètes puis-je produire aujourd’hui ?',
        promise: 'Chaque signal émis est une preuve que tu es déjà cette personne.',
        hub: 'hubAction',
        icon: Footprints,
        theme: {
            gradient: 'from-emerald-600 to-teal-700',
            soft: 'bg-emerald-50',
            border: 'border-emerald-200',
            text: 'text-emerald-700',
            strong: 'bg-emerald-700',
            dot: 'bg-emerald-500',
            hover: 'hover:bg-emerald-50',
            hoverBorder: 'hover:border-emerald-300',
        },
    },
    {
        key: 'evolution',
        step: 4,
        label: 'Évolution',
        question: 'Que m’apprennent mes résultats sur moi-même ?',
        promise: 'Relire tes preuves, tes états et ton monde intérieur pour ajuster le cap.',
        hub: 'hubEvolution',
        icon: Sprout,
        theme: {
            gradient: 'from-amber-600 to-orange-700',
            soft: 'bg-amber-50',
            border: 'border-amber-200',
            text: 'text-amber-800',
            strong: 'bg-amber-700',
            dot: 'bg-amber-500',
            hover: 'hover:bg-amber-50',
            hoverBorder: 'hover:border-amber-300',
        },
    },
];

export interface ArcModule {
    view: ViewType;
    stage: ArcStageKey;
    /** Sous-partie de l'étape (affichée comme intertitre sur la page d'étape) */
    group: string;
    label: string;
    emoji: string;
    /** Pourquoi ce module sert l'étape — une phrase */
    purpose: string;
    /** Non listé dans les menus (vue de détail) */
    hidden?: boolean;
    isNew?: boolean;
}

/**
 * Registre des modules. L'ordre des groupes et des modules est celui de l'affichage.
 */
export const ARC_MODULES: ArcModule[] = [
    // ── 1. VISION ────────────────────────────────────────────────────────────
    {
        view: 'tribunal', stage: 'vision', group: 'Déclarer', emoji: '⚖️',
        label: 'Tribunal de la Vie',
        purpose: 'Déclarer tes désirs (avoir / être), la personne que tu deviens et ce qui est en jeu.',
    },
    {
        view: 'manifestation', stage: 'vision', group: 'Rendre la vision vivante', emoji: '✨',
        label: 'Manifestation consciente',
        purpose: 'Programme guidé pour vivre un désir précis comme déjà acquis.',
    },
    {
        view: 'visualizations', stage: 'vision', group: 'Rendre la vision vivante', emoji: '🌌',
        label: 'Vibes World',
        purpose: 'Voir l’univers de tes désirs, de tes identités et de leurs preuves.',
    },

    // ── 2. IDENTITÉ ──────────────────────────────────────────────────────────
    {
        view: 'identities', stage: 'identity', group: 'Définir', emoji: '🧬',
        label: 'Identités',
        purpose: 'Les identités que tu incarnes : croyances, pratiques et signaux observables.',
    },
    {
        view: 'templates', stage: 'identity', group: 'Définir', emoji: '📚',
        label: 'Bibliothèque',
        purpose: 'Identités et signaux inspirés de livres, prêts à adopter.',
    },
    {
        view: 'addHabit', stage: 'identity', group: 'Définir', emoji: '➕',
        label: 'Créer un signal',
        purpose: 'Traduire une identité en comportement concret à émettre chaque jour.',
    },
    {
        view: 'focusWheel', stage: 'identity', group: 'Installer les croyances', emoji: '🎡',
        label: 'Focus Wheel',
        purpose: 'Process #17 : passer d’une croyance qui résiste à une croyance qui porte.',
    },
    {
        view: 'pivotCoach', stage: 'identity', group: 'Installer les croyances', emoji: '🔄',
        label: 'Pivot',
        purpose: 'Transformer une pensée qui te tire vers le bas en pensée alignée.',
    },
    {
        view: 'moneyMindset', stage: 'identity', group: 'Installer les croyances', emoji: '💸',
        label: 'Abondance',
        purpose: 'Réécrire ta relation à l’argent avec les chèques d’abondance.',
    },
    {
        view: 'environment', stage: 'identity', group: 'Façonner le terrain', emoji: '🏠',
        label: 'Environnement',
        purpose: 'Organiser tes espaces pour que l’identité devienne le chemin le plus facile.',
    },

    // ── 3. ACTION ────────────────────────────────────────────────────────────
    {
        view: 'dailyAlignment', stage: 'action', group: 'Le fil du jour', emoji: '☀️',
        label: 'Alignement du jour',
        purpose: 'Une intention le matin, une preuve le soir.',
    },
    {
        view: 'dashboard', stage: 'action', group: 'Le fil du jour', emoji: '📊',
        label: 'Tableau des signaux',
        purpose: 'Tous tes signaux, leurs séries, jalons et calendrier de preuves.',
    },
    {
        view: 'segmentIntending', stage: 'action', group: 'Le fil du jour', emoji: '🧭',
        label: 'Segment Intending',
        purpose: 'Pré-paver chaque segment de la journée avec une intention claire.',
    },
    {
        view: 'priming', stage: 'action', group: 'Pratiques', emoji: '⚡',
        label: 'Priming',
        purpose: 'Préparer ton système nerveux, puis poser la prochaine action.',
    },
    {
        view: 'coherence', stage: 'action', group: 'Pratiques', emoji: '❤️',
        label: 'Cohérence cardiaque',
        purpose: 'Biofeedback VRC : une preuve mesurée de ta régulation.',
    },
    {
        view: 'focusHold', stage: 'action', group: 'Pratiques', emoji: '🎯',
        label: 'Focus 17/68',
        purpose: 'Tenir une pensée 17 puis 68 secondes pour lui donner de l’élan.',
    },
    {
        view: 'karmicGarden', stage: 'action', group: 'Pratiques', emoji: '🌱',
        label: 'Jardin karmique',
        purpose: 'Planter chaque matin une graine en aidant quelqu’un.',
    },
    {
        view: 'magicGratitude', stage: 'action', group: 'Pratiques', emoji: '🙏',
        label: 'Campagne d’appréciation',
        purpose: '28 jours d’appréciation, une preuve par jour.',
    },
    {
        view: 'voieControle', stage: 'action', group: 'Pratiques', emoji: '🧘',
        label: 'La Voie du Contrôle',
        purpose: 'Programme de maîtrise corporelle, séance après séance.',
    },
    {
        view: 'nutrition', stage: 'action', group: 'Pratiques', emoji: '🥗',
        label: 'Nutrition',
        purpose: 'Ce que tu manges, mesuré contre les besoins de ton corps.',
    },
    {
        view: 'rewards', stage: 'action', group: 'Renforcer', emoji: '🏆',
        label: 'Ancrages',
        purpose: 'Récompenses et défis qui ancrent les preuves accumulées.',
    },
    {
        view: 'habitDetail', stage: 'action', group: 'Le fil du jour', emoji: '🔎',
        label: 'Détail du signal', purpose: 'Historique d’un signal.', hidden: true,
    },

    // ── 4. ÉVOLUTION ─────────────────────────────────────────────────────────
    {
        view: 'moodCheckin', stage: 'evolution', group: 'S’observer', emoji: '🎚️',
        label: 'Fréquence',
        purpose: 'Situer ton état sur l’échelle émotionnelle en 22 niveaux.',
    },
    {
        view: 'journal', stage: 'evolution', group: 'S’observer', emoji: '📖',
        label: 'Journal',
        purpose: 'Écrire ce que tu ressens, au fil de la journée.',
    },
    {
        view: 'innerChild', stage: 'evolution', group: 'S’observer', emoji: '🫀',
        label: 'Inner Child',
        purpose: 'Reconnaître l’état de l’enfant intérieur et d’où il vient.',
    },
    {
        view: 'innerWorld', stage: 'evolution', group: 'Comprendre', emoji: '🌙',
        label: 'Monde intérieur',
        purpose: 'Image Streaming × rêves : les symboles qui reviennent, leurs échos et leur évolution.',
        isNew: true,
    },
    {
        view: 'vibesInsights', stage: 'evolution', group: 'Comprendre', emoji: '🧠',
        label: 'Vibes AI',
        purpose: 'Corrélations et tendances détectées dans toutes tes données.',
    },
    {
        view: 'lifeExperiments', stage: 'evolution', group: 'Comprendre', emoji: '🔬',
        label: 'Labo d’expériences',
        purpose: 'Tester une hypothèse sur toi pendant 7 jours, puis conclure.',
    },
    {
        view: 'coachChat', stage: 'evolution', group: 'Dialoguer', emoji: '💬',
        label: 'Coach Vibes',
        purpose: 'Un coach qui lit ton arc et t’aide à en tirer les leçons.',
    },
];

// ── Accès ─────────────────────────────────────────────────────────────────────

const STAGE_BY_KEY = new Map(ARC_STAGES.map((s) => [s.key, s]));
const STAGE_BY_HUB = new Map(ARC_STAGES.map((s) => [s.hub, s]));
const MODULE_BY_VIEW = new Map(ARC_MODULES.map((m) => [m.view, m]));

export function getStage(key: ArcStageKey): ArcStage {
    return STAGE_BY_KEY.get(key)!;
}

export function getModule(view: ViewType): ArcModule | undefined {
    return MODULE_BY_VIEW.get(view);
}

/** Étape à laquelle appartient une vue (page d'étape ou module). `null` pour l'accueil et les paramètres. */
export function getStageForView(view: ViewType): ArcStage | null {
    const hub = STAGE_BY_HUB.get(view);
    if (hub) return hub;
    const mod = MODULE_BY_VIEW.get(view);
    return mod ? getStage(mod.stage) : null;
}

export function isHubView(view: ViewType): boolean {
    return STAGE_BY_HUB.has(view);
}

/** Modules visibles d'une étape, regroupés dans l'ordre du registre. */
export function getStageGroups(stage: ArcStageKey): { group: string; modules: ArcModule[] }[] {
    const groups: { group: string; modules: ArcModule[] }[] = [];
    for (const mod of ARC_MODULES) {
        if (mod.stage !== stage || mod.hidden) continue;
        let bucket = groups.find((g) => g.group === mod.group);
        if (!bucket) {
            bucket = { group: mod.group, modules: [] };
            groups.push(bucket);
        }
        bucket.modules.push(mod);
    }
    return groups;
}

/** Étape suivante dans le cycle (après Évolution, on revient à la Vision). */
export function getNextStage(key: ArcStageKey): ArcStage {
    const idx = ARC_STAGES.findIndex((s) => s.key === key);
    return ARC_STAGES[(idx + 1) % ARC_STAGES.length];
}

export function getPreviousStage(key: ArcStageKey): ArcStage {
    const idx = ARC_STAGES.findIndex((s) => s.key === key);
    return ARC_STAGES[(idx + ARC_STAGES.length - 1) % ARC_STAGES.length];
}
