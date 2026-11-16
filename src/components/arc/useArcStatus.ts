/**
 * État de l'arc — une lecture transversale des données existantes, étape par étape,
 * et la « prochaine étape » à proposer. Aucune donnée nouvelle : on relie ce que
 * les modules produisent déjà (désirs, identités, signaux, alignement, fréquence).
 */
import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useArcStore } from '@/store/useArcStore';
import SupabaseDatabaseClient from '@/database/supabase-client';
import { useToolEvidence } from '@/components/ComplementaryEvidence';
import {
    CredibilityScore,
    DailyAlignmentEntry,
    DailyMood,
    Desire,
    EmotionalFrequency,
    Habit,
    Identity,
    ViewType,
    getAlignmentPhase,
} from '@/types';
import { calculateIdentityScore, getCurrentDayIndex, getHabitStartDayIndex, isHabitActiveOnDay } from '@/utils/habitUtils';
import { buildDailyEvidence, computeCredibilityScore } from '@/utils/credibilityScore';
import { hasEveningAlignmentToday, hasMorningAlignmentToday } from '@/utils/dailyAlignment';
import { todayLocalISO } from '@/utils/dateUtils';
import type { ArcStageKey } from '@/config/arc';

export interface NextStep {
    stage: ArcStageKey;
    title: string;
    detail: string;
    view: ViewType;
    cta: string;
}

export interface IdentityGap {
    identity: Identity;
    missingBeliefs: boolean;
    missingSignals: boolean;
}

export interface DesireThread {
    desire: Desire;
    identities: Identity[];
    todayDone: number;
    todayTotal: number;
    credibility: CredibilityScore;
}

export interface ArcStatus {
    vision: {
        statement: string;
        activeDesires: Desire[];
        withFutureSelf: number;
    };
    identity: {
        identities: Identity[];
        beliefs: number;
        behaviors: number;
        signals: number;
        gaps: IdentityGap[];
        top: { identity: Identity; score: number } | null;
    };
    action: {
        todayIdx: number;
        activeToday: Habit[];
        done: number;
        alignment: DailyAlignmentEntry | null;
        alignmentLoaded: boolean;
        morningDone: boolean;
        eveningDone: boolean;
    };
    evolution: {
        last7: number;
        prev7: number;
        delta: number;
        moodAvg7: number | null;
        moodDays7: number;
        todayMood: DailyMood | null;
        journalWeek: number;
    };
    threads: DesireThread[];
    nextStep: NextStep;
}

/** Taux moyen de signaux émis entre deux index de jour (jours sans signal actif ignorés). */
export function completionBetween(habits: Habit[], start: number, end: number): number {
    let sum = 0;
    let count = 0;
    for (let i = Math.max(0, start); i <= end; i++) {
        const active = habits.filter((h) => i >= getHabitStartDayIndex(h) && i < h.progress.length);
        if (active.length === 0) continue;
        sum += active.filter((h) => !!h.progress[i]).length / active.length;
        count += 1;
    }
    return count > 0 ? Math.round((sum / count) * 100) : 0;
}

function shiftIso(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return todayLocalISO(d);
}

function computeNextStep(s: Omit<ArcStatus, 'nextStep'>): NextStep {
    const phase = getAlignmentPhase();
    const remaining = s.action.activeToday.length - s.action.done;

    if (!s.vision.statement && s.vision.activeDesires.length === 0) {
        return {
            stage: 'vision', view: 'hubVision', cta: 'Écrire ma boussole',
            title: 'Nomme la personne que tu deviens',
            detail: 'Tout l’arc part de là : une phrase qui dit qui tu deviens.',
        };
    }
    if (s.vision.activeDesires.length === 0) {
        return {
            stage: 'vision', view: 'tribunal', cta: 'Déclarer un désir',
            title: 'Déclare ce que tu veux vivre',
            detail: 'Un désir (avoir ou être) donne une direction concrète à ta boussole.',
        };
    }
    if (s.identity.identities.length === 0) {
        return {
            stage: 'identity', view: 'identities', cta: 'Définir une identité',
            title: 'Qui dois-tu devenir pour le recevoir ?',
            detail: 'Une identité regroupe les croyances et les comportements de cette personne.',
        };
    }
    if (phase === 'morning' && s.action.alignmentLoaded && !s.action.morningDone) {
        return {
            stage: 'action', view: 'dailyAlignment', cta: 'Poser mon intention',
            title: 'Pose ton intention du jour',
            detail: 'Choisis le désir que tu sers aujourd’hui et les signaux qui le prouvent.',
        };
    }
    if (remaining > 0) {
        return {
            stage: 'action', view: 'hubAction', cta: 'Voir mes preuves',
            title: `${remaining} preuve${remaining > 1 ? 's' : ''} à produire aujourd’hui`,
            detail: `${s.action.done}/${s.action.activeToday.length} signaux émis — chacun prouve une identité.`,
        };
    }
    if (phase === 'evening' && s.action.alignmentLoaded && !s.action.eveningDone) {
        return {
            stage: 'action', view: 'dailyAlignment', cta: 'Consigner ma preuve',
            title: 'Consigne ta preuve du soir',
            detail: 'Une phrase : « Aujourd’hui, j’ai prouvé que… »',
        };
    }
    if (!s.evolution.todayMood) {
        return {
            stage: 'evolution', view: 'moodCheckin', cta: 'Noter ma fréquence',
            title: 'Note ta fréquence du jour',
            detail: 'Ton état du jour rend tes résultats lisibles.',
        };
    }
    const gap = s.identity.gaps.find((g) => g.missingSignals) ?? s.identity.gaps[0];
    if (gap) {
        return {
            stage: 'identity',
            view: gap.missingSignals ? 'addHabit' : 'identities',
            cta: gap.missingSignals ? 'Créer un signal' : 'Compléter l’identité',
            title: gap.missingSignals
                ? `« ${gap.identity.name} » n’a encore aucun comportement`
                : `Quelles croyances porte « ${gap.identity.name} » ?`,
            detail: gap.missingSignals
                ? 'Sans signal, cette identité ne peut produire aucune preuve.'
                : 'Une identité sans croyance reste une étiquette.',
        };
    }
    return {
        stage: 'evolution', view: 'hubEvolution', cta: 'Relire ma semaine',
        title: 'Journée bouclée — que t’apprend ta semaine ?',
        detail: 'Relis tes preuves, ta fréquence et ton monde intérieur, puis ajuste le cap.',
    };
}

export function useArcStatus(): ArcStatus {
    const { identities, habits, desires, dailyMoods, todayMood, accusers, journalEntries } = useAppStore();
    const statement = useArcStore((s) => s.vision.statement);
    const loadVision = useArcStore((s) => s.loadVision);
    const visionLoaded = useArcStore((s) => s.visionLoaded);
    const { activeToolCount } = useToolEvidence();

    const [alignment, setAlignment] = useState<DailyAlignmentEntry | null>(null);
    const [alignmentLoaded, setAlignmentLoaded] = useState(false);

    useEffect(() => {
        if (!visionLoaded) loadVision();
    }, [visionLoaded, loadVision]);

    useEffect(() => {
        let cancelled = false;
        SupabaseDatabaseClient.getInstance()
            .getTodayAlignment()
            .then((entry) => { if (!cancelled) setAlignment(entry); })
            .catch(() => { if (!cancelled) setAlignment(null); })
            .finally(() => { if (!cancelled) setAlignmentLoaded(true); });
        return () => { cancelled = true; };
    }, []);

    return useMemo(() => {
        const todayIdx = getCurrentDayIndex();
        const activeDesires = desires.filter((d) => d.status !== 'closed');

        // ── Identité ──
        const linkedHabitCount = (identityId: number) => habits.filter((h) => h.linkedIdentities.includes(identityId)).length;
        const gaps: IdentityGap[] = identities
            .map((identity) => ({
                identity,
                missingBeliefs: (identity.coreBeliefs ?? []).length === 0,
                missingSignals: linkedHabitCount(identity.id) === 0,
            }))
            .filter((g) => g.missingBeliefs || g.missingSignals);
        const scored = identities
            .map((identity) => ({ identity, score: calculateIdentityScore(identity.id, habits) }))
            .sort((a, b) => b.score - a.score);

        // ── Action ──
        const activeToday = habits.filter((h) => isHabitActiveOnDay(h, todayIdx));
        const done = activeToday.filter((h) => !!h.progress[todayIdx]).length;

        // ── Évolution ──
        const last7 = completionBetween(habits, todayIdx - 6, todayIdx);
        const prev7 = completionBetween(habits, todayIdx - 13, todayIdx - 7);
        const since7 = shiftIso(-6);
        const recentMoods = dailyMoods.filter((m) => m.date >= since7);
        const moodAvg7 = recentMoods.length > 0
            ? recentMoods.reduce((sum, m) => sum + m.score, 0) / recentMoods.length
            : null;
        const journalWeek = journalEntries.filter((e) => e.date >= since7).length;

        // ── Fil d'or : désir → identités → preuves du jour → verdict ──
        const moodMap = new Map<string, EmotionalFrequency>(dailyMoods.map((m) => [m.date, m.score]));
        const threads: DesireThread[] = activeDesires.map((desire) => {
            const ids = desire.linkedIdentityIds;
            const desireHabits = activeToday.filter((h) => h.linkedIdentities.some((id) => ids.includes(id)));
            const evidence = buildDailyEvidence(
                habits,
                ids,
                moodMap,
                accusers.filter((a) => a.linkedDesireId === desire.id),
                30,
            ).map((e) => ({ ...e, desireId: desire.id }));
            return {
                desire,
                identities: identities.filter((i) => ids.includes(i.id)),
                todayDone: desireHabits.filter((h) => !!h.progress[todayIdx]).length,
                todayTotal: desireHabits.length,
                credibility: computeCredibilityScore(desire.id, evidence, activeToolCount * 3),
            };
        });

        const base: Omit<ArcStatus, 'nextStep'> = {
            vision: {
                statement,
                activeDesires,
                withFutureSelf: activeDesires.filter((d) => !!d.motivation?.futureSelf?.trim()).length,
            },
            identity: {
                identities,
                beliefs: identities.reduce((n, i) => n + (i.coreBeliefs?.length ?? 0), 0),
                behaviors: identities.reduce((n, i) => n + (i.behavioralSignals?.length ?? 0), 0),
                signals: habits.filter((h) => h.linkedIdentities.length > 0).length,
                gaps,
                top: scored[0] ?? null,
            },
            action: {
                todayIdx,
                activeToday,
                done,
                alignment,
                alignmentLoaded,
                morningDone: hasMorningAlignmentToday(alignment),
                eveningDone: hasEveningAlignmentToday(alignment),
            },
            evolution: {
                last7,
                prev7,
                delta: last7 - prev7,
                moodAvg7,
                moodDays7: recentMoods.length,
                todayMood,
                journalWeek,
            },
            threads,
        };
        return { ...base, nextStep: computeNextStep(base) };
    }, [identities, habits, desires, dailyMoods, todayMood, accusers, journalEntries, statement, alignment, alignmentLoaded, activeToolCount]);
}
