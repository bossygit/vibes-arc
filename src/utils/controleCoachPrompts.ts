import type { ControleCoachContext } from '@/types/controleEjaculation';
import {
    PHASES,
    baselineLabel,
    anxietyLabel,
    findExercise,
    weeksElapsed,
} from '@/data/controleEjaculationProgram';

const STEP_MISSIONS: Record<ControleCoachContext['step'], string> = {
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

function formatProfile(ctx: ControleCoachContext): string {
    const p = ctx.profile;
    if (!p) return '(profil non disponible)';
    const goalLabels: Record<string, string> = {
        duree: 'Prolonger la durée',
        plaisir: 'Explorer le plaisir',
        anxiete: "Réduire l'anxiété",
        discipline: 'Discipline personnelle',
    };
    return [
        `Baseline: ${baselineLabel(p.baseline)}`,
        `Anxiété: ${anxietyLabel(p.anxiety)}`,
        `Fréquence pratique: ${p.frequency}×/semaine`,
        `Objectif: ${goalLabels[p.goal] ?? p.goal}`,
        `Expériences passées: ${p.experience.join(', ') || 'aucune'}`,
        `Date début: ${p.startDate}`,
    ].join('\n');
}

function formatProgress(ctx: ControleCoachContext): string {
    const pr = ctx.progress;
    if (!pr) return '';
    const phase = PHASES[pr.phase];
    const week = ctx.profile ? weeksElapsed(ctx.profile) : '?';
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

export function buildCacheKey(ctx: ControleCoachContext): string {
    return JSON.stringify({
        step: ctx.step,
        baseline: ctx.profile?.baseline,
        phase: ctx.progress?.phase,
        exerciseId: ctx.exerciseId,
        sessionLog: ctx.sessionLog,
        phaseIndex: ctx.phaseIndex,
    });
}
