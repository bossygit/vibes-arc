export type KarmicCoachStep = 1 | 2 | 3 | 4 | 'afternoon';

export interface KarmicCoachRequestContext {
    step: KarmicCoachStep;
    draft: Record<string, unknown>;
    qualities?: Record<string, number>;
    plotProgress?: Record<string, number>;
}

const DOMAIN_LABELS: Record<string, string> = {
    abondance: 'Abondance',
    relations: 'Relations',
    sante: 'Santé',
    sagesse: 'Sagesse',
    leadership: 'Leadership',
    spiritualite: 'Spiritualité',
};

const QUALITY_LABELS: Record<string, string> = {
    generosite: 'Générosité',
    discipline: 'Discipline',
    patience: 'Patience',
    courage: 'Courage',
    compassion: 'Compassion',
    clarte: 'Clarté',
    integrite: 'Intégrité',
    joie: 'Joie',
};

function formatDraft(draft: Record<string, unknown>): string {
    const lines: string[] = [];
    if (draft.goal) lines.push(`Intention (étape 1): ${draft.goal}`);
    if (draft.partnerName) lines.push(`Partenaire karmique: ${draft.partnerName}`);
    if (draft.partnerGoal) lines.push(`Objectif du partenaire: ${draft.partnerGoal}`);
    if (draft.helpPlan) lines.push(`Plan d'aide: ${draft.helpPlan}`);
    if (draft.domain) {
        const d = String(draft.domain);
        lines.push(`Domaine choisi: ${DOMAIN_LABELS[d] ?? d}`);
    }
    if (draft.actionLog) lines.push(`Action du jour: ${draft.actionLog}`);
    if (draft.actionDoneToday !== undefined) {
        lines.push(`Déjà agi aujourd'hui: ${draft.actionDoneToday ? 'oui' : 'non'}`);
    }
    return lines.length ? lines.join('\n') : '(aucun champ rempli encore)';
}

function formatProgress(
    qualities?: Record<string, number>,
    plotProgress?: Record<string, number>
): string {
    const parts: string[] = [];
    if (plotProgress) {
        const weak = Object.entries(plotProgress)
            .sort(([, a], [, b]) => a - b)
            .slice(0, 2)
            .map(([d, n]) => `${DOMAIN_LABELS[d] ?? d}: ${n} graines`);
        if (weak.length) parts.push(`Parcelles les plus faibles: ${weak.join(', ')}`);
    }
    if (qualities) {
        const low = Object.entries(qualities)
            .sort(([, a], [, b]) => a - b)
            .slice(0, 2)
            .map(([k, v]) => `${QUALITY_LABELS[k] ?? k}: ${v}%`);
        if (low.length) parts.push(`Qualités à renforcer: ${low.join(', ')}`);
    }
    return parts.join('\n');
}

const STEP_MISSIONS: Record<KarmicCoachStep, string> = {
    1: `L'utilisateur est à l'ÉTAPE 1 — Intention (une phrase).
Aide-le à affiner son objectif en une phrase claire, mesurable et « plantable » karmiquement.
Propose une reformulation si l'intention est vague. Explique brièvement pourquoi une phrase précise compte.`,
    2: `L'utilisateur est à l'ÉTAPE 2 — Choisir le sol (partenaire karmique).
Son intention est déjà définie. Propose 3 TYPES de partenaires karmiques adaptés à son objectif (pas des noms de personnes réelles).
Pour chaque type : qui c'est, pourquoi c'est un bon sol, et une idée de plan d'aide concret cette semaine.
Termine OBLIGATOIREMENT par une ligne exacte :
PARTNER_SUGGESTIONS: type1 | type2 | type3`,
    3: `L'utilisateur est à l'ÉTAPE 3 — Planter (action du jour).
Aide-le à choisir le bon domaine de graine et à formuler une action CONCRÈTE pour son partenaire aujourd'hui.
Si l'action est faible ou vague, propose une version plus spécifique.`,
    4: `L'utilisateur est à l'ÉTAPE 4 — Coffee Meditation (arrosage).
Rédige un script de méditation personnalisé (4-6 phrases) utilisant son intention, son partenaire et son action.
Invite à rejouir l'aide et à visualiser l'objectif accompli.`,
    afternoon: `L'utilisateur est en mode APRÈS-MIDI — graines libres.
Suggère 2 à 3 actions du catalogue mental (compliment, don, sport, gratitude, etc.) adaptées aux parcelles/qualités les plus faibles.
Reste concis et actionnable.`,
};

export function buildStepUserPrompt(ctx: KarmicCoachRequestContext): string {
    const { step, draft, qualities, plotProgress } = ctx;
    return [
        STEP_MISSIONS[step],
        '',
        '--- Contexte utilisateur ---',
        formatDraft(draft),
        formatProgress(qualities, plotProgress) || '',
    ].filter(Boolean).join('\n');
}

export function parsePartnerSuggestions(reply: string): string[] {
    const match = reply.match(/PARTNER_SUGGESTIONS:\s*(.+?)(?:\n|$)/i);
    if (!match) return [];
    return match[1]
        .split('|')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 3);
}

export function stripPartnerSuggestionsLine(reply: string): string {
    return reply.replace(/\n?PARTNER_SUGGESTIONS:.+$/im, '').trim();
}
