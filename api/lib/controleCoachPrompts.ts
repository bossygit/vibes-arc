import { PHASES } from './controleProgramData';

export type ControleCoachStep =
    | 'welcome'
    | 'wizard_result'
    | 'daily'
    | 'exercise'
    | 'breath'
    | 'session_log'
    | 'phase_advance';

export interface ControleCoachContext {
    step: ControleCoachStep;
    profile?: {
        baseline: string;
        anxiety: string;
        frequency: string;
        goal: string;
        experience: string[];
        startDate: string;
    };
    progress?: {
        phase: number;
        xp: number;
        streak: number;
    };
    exerciseId?: string;
    sessionLog?: { seconds: number; anxiety: number };
    phaseIndex?: number;
}

const BASELINE_LABELS: Record<string, string> = {
    '<1': "moins d'1 minute",
    '1-3': '1 à 3 minutes',
    '3-7': '3 à 7 minutes',
    '7+': 'plus de 7 minutes',
    unknown: 'indéterminé',
};

const ANXIETY_LABELS: Record<string, string> = {
    faible: 'Faible',
    moderee: 'Modérée',
    elevee: 'Élevée',
};

const GOAL_LABELS: Record<string, string> = {
    duree: 'Prolonger la durée',
    plaisir: 'Explorer le plaisir',
    anxiete: "Réduire l'anxiété",
    discipline: 'Discipline personnelle',
};

const STEP_MISSIONS: Record<ControleCoachStep, string> = {
    welcome: `L'utilisateur découvre le programme pour la première fois.
Présente brièvement les 3 traditions et invite à commencer le questionnaire d'évaluation.`,
    wizard_result: `L'utilisateur vient de terminer le wizard d'évaluation.
Interprète son profil et personnalise les conseils pour sa phase de départ.`,
    daily: `L'utilisateur est sur son dashboard quotidien.
Donne des conseils adaptés à sa phase et semaine actuelles.`,
    exercise: `L'utilisateur consulte un exercice spécifique.
Guide-le pas à pas pour cet exercice, en respectant son tier (clinique/traditionnel/psychologique).`,
    breath: `L'utilisateur s'apprête à pratiquer la respiration d'ancrage 4-7.
Rappelle la technique et son lien avec le système nerveux.`,
    session_log: `L'utilisateur vient d'enregistrer une observation de session (temps tenu + anxiété).
Commente sa progression par rapport à son profil initial.`,
    phase_advance: `L'utilisateur vient de passer à la phase suivante.
Félicite-le et présente brièvement les nouveaux outils de la phase.`,
};

function weeksElapsed(startDate: string): number {
    const days = Math.floor(
        (Date.now() - new Date(startDate).getTime()) / 86400000
    );
    return Math.max(1, Math.floor(days / 7) + 1);
}

function findExercise(exerciseId: string) {
    for (const phase of PHASES) {
        const ex = phase.exercises.find((e) => e.id === exerciseId);
        if (ex) return { phase, exercise: ex };
    }
    return null;
}

function formatProfile(ctx: ControleCoachContext): string {
    const p = ctx.profile;
    if (!p) return '(profil non disponible)';
    return [
        `Baseline: ${BASELINE_LABELS[p.baseline] ?? p.baseline}`,
        `Anxiété: ${ANXIETY_LABELS[p.anxiety] ?? p.anxiety}`,
        `Fréquence pratique: ${p.frequency}×/semaine`,
        `Objectif: ${GOAL_LABELS[p.goal] ?? p.goal}`,
        `Expériences passées: ${p.experience.join(', ') || 'aucune'}`,
        `Date début: ${p.startDate}`,
    ].join('\n');
}

function formatProgress(ctx: ControleCoachContext): string {
    const pr = ctx.progress;
    if (!pr) return '';
    const phase = PHASES[pr.phase];
    const week = ctx.profile ? weeksElapsed(ctx.profile.startDate) : '?';
    return [
        `Phase actuelle: ${pr.phase + 1} — ${phase?.name ?? '?'}`,
        `Semaine: ${week}`,
        `XP: ${pr.xp}`,
        `Streak: ${pr.streak} jours`,
    ].join('\n');
}

export function buildStepUserPrompt(ctx: ControleCoachContext): string {
    const parts: string[] = [STEP_MISSIONS[ctx.step], ''];

    parts.push('PROFIL UTILISATEUR:');
    parts.push(formatProfile(ctx));

    if (ctx.progress) {
        parts.push('');
        parts.push('PROGRESSION:');
        parts.push(formatProgress(ctx));
    }

    if (ctx.exerciseId) {
        const found = findExercise(ctx.exerciseId);
        if (found) {
            parts.push('');
            parts.push(`EXERCICE SÉLECTIONNÉ: ${found.exercise.title}`);
            parts.push(`Description: ${found.exercise.desc}`);
            parts.push(`Fréquence: ${found.exercise.freq}`);
            parts.push(`Tier: ${found.exercise.tier}`);
        }
    }

    if (ctx.sessionLog) {
        parts.push('');
        parts.push(`DERNIÈRE SESSION: ${ctx.sessionLog.seconds}s, anxiété ${ctx.sessionLog.anxiety}/10`);
    }

    if (ctx.phaseIndex !== undefined) {
        const ph = PHASES[ctx.phaseIndex];
        if (ph) {
            parts.push('');
            parts.push(`NOUVELLE PHASE: ${ph.name} — ${ph.objective}`);
        }
    }

    return parts.join('\n');
}
