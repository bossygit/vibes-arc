/**
 * Calculateur de Score de Crédibilité (Tribunal de la Vie)
 * 
 * Formule :
 *   actionScore    = (signaux complétés / signaux totaux) × 100
 *   alignmentScore = (jours avec mood >= 7 / total jours) × 100
 *   accuserPenalty = (jours avec accusateurs actifs / total jours) × 100
 *   total          = actionScore × 0.40 + alignmentScore × 0.40 − accuserPenalty × 0.20
 * 
 * Le score total est clampé à [0, 100].
 */

import {
    EmotionalFrequency,
    CredibilityScore,
    getVerdict,
    DailyEvidence,
} from '@/types';
import { dayIndexForDate } from './habitUtils';
import { todayLocalISO } from './dateUtils';

/**
 * Calcule le score de crédibilité à partir des preuves journalières.
 *
 * @param complementaryBonus - Bonus d'alignement provenant des outils complémentaires (0-15)
 */
export function computeCredibilityScore(
    desireId: number,
    evidence: DailyEvidence[],
    complementaryBonus: number = 0
): CredibilityScore {
    const periodDays = evidence.length;

    if (periodDays === 0) {
        return {
            desireId,
            actionScore: 0,
            alignmentScore: 0,
            accuserPenalty: 0,
            total: 0,
            verdict: 'défavorable',
            periodDays: 0,
        };
    }

    // Action Score : moyenne du taux de complétion sur les jours où au moins un signal
    // était observable (un signal n'est observé qu'à partir de sa date de création).
    let totalCompletionRate = 0;
    let observableDays = 0;
    let alignedDays = 0;
    let accuserDays = 0;

    for (const day of evidence) {
        if (day.signalsTotal > 0) {
            totalCompletionRate += day.signalsCompleted / day.signalsTotal;
            observableDays++;
        }
        if (day.isAligned) alignedDays++;
        if (day.accusatorsActive > 0) accuserDays++;
    }

    const actionScore = observableDays > 0 ? Math.round((totalCompletionRate / observableDays) * 100) : 0;
    const rawAlignmentScore = Math.round((alignedDays / periodDays) * 100);
    const accuserPenalty = Math.round((accuserDays / periodDays) * 100);

    // Bonus complémentaire : jusqu'à +15 points d'alignement si d'autres outils sont actifs
    const cappedBonus = Math.min(15, complementaryBonus);
    const alignmentScore = Math.min(100, rawAlignmentScore + cappedBonus);

    // Formule composite : action 40% + alignement (avec bonus) 40% - accusations 20%
    const rawTotal = actionScore * 0.40 + alignmentScore * 0.40 - accuserPenalty * 0.20;
    const total = Math.max(0, Math.min(100, Math.round(rawTotal)));

    return {
        desireId,
        actionScore,
        alignmentScore,
        accuserPenalty,
        total,
        verdict: getVerdict(total),
        periodDays,
    };
}

/**
 * Construit les DailyEvidence à partir des données brutes.
 * 
 * @param habits - Toutes les habitudes, avec linkedIdentities
 * @param identityId - L'identité liée au désir
 * @param moods - Tous les check-ins mood (indexés par date)
 * @param accusers - Tous les accusateurs liés à ce désir
 * @param daysBack - Nombre de jours à analyser (défaut: 30)
 */
export function buildDailyEvidence(
    habits: { id: number; linkedIdentities: number[]; progress: boolean[]; startDayIndex?: number }[],
    identityIds: number[],
    moods: Map<string, EmotionalFrequency>,
    accusers: { id: number; progress: boolean[]; startDayIndex?: number }[],
    daysBack: number = 30
): DailyEvidence[] {
    const evidence: DailyEvidence[] = [];

    // Filtrer les signaux liés à l'une des identités
    const linkedHabits = habits.filter(h => h.linkedIdentities.some(id => identityIds.includes(id)));

    // Déterminer la plage de jours
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < daysBack; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        // Date locale : c'est le jour vécu (les check-ins sont datés du jour où on les fait)
        const dateKey = todayLocalISO(date);

        // Index global du jour — `progress[]` est indexé par jour global (0 = 1er oct. 2025),
        // pas par jour depuis la création du signal.
        const dayIndex = dayIndexForDate(date);

        // Signaux observables ce jour (créés à cette date) et complétés
        let signalsCompleted = 0;
        let signalsTotal = 0;

        for (const habit of linkedHabits) {
            const startIdx = habit.startDayIndex ?? 0;
            if (dayIndex < startIdx || dayIndex < 0 || dayIndex >= habit.progress.length) continue;
            signalsTotal++;
            if (habit.progress[dayIndex]) signalsCompleted++;
        }

        // Accusateurs actifs ce jour
        let accusatorsActive = 0;
        for (const accuser of accusers) {
            const startIdx = accuser.startDayIndex ?? 0;
            if (dayIndex < startIdx || dayIndex < 0 || dayIndex >= accuser.progress.length) continue;
            if (accuser.progress[dayIndex]) accusatorsActive++;
        }

        // Mood du jour
        const moodScore = moods.get(dateKey) ?? 5 as EmotionalFrequency;

        evidence.push({
            date: dateKey,
            desireId: 0, // sera rempli par l'appelant
            signalsCompleted,
            signalsTotal,
            moodScore,
            accusatorsActive,
            isAligned: moodScore <= 7,
        });
    }

    // Inverser pour avoir l'ordre chronologique (plus ancien → plus récent)
    return evidence.reverse();
}

/**
 * Calcule le taux de corrélation mood/complétion.
 * Retourne le % de complétion pour les jours alignés vs jours en résistance.
 */
export function computeMoodCompletionCorrelation(
    evidence: DailyEvidence[]
): { alignedCompletionRate: number; resistingCompletionRate: number; correlationStrength: 'forte' | 'modérée' | 'faible' } {
    let alignedTotal = 0;
    let alignedCount = 0;
    let resistingTotal = 0;
    let resistingCount = 0;

    for (const day of evidence) {
        if (day.signalsTotal === 0) continue;

        const rate = day.signalsCompleted / day.signalsTotal;

        if (day.isAligned) {
            alignedTotal += rate;
            alignedCount++;
        }

        if (day.moodScore >= 15) {
            resistingTotal += rate;
            resistingCount++;
        }
    }

    const alignedRate = alignedCount > 0 ? alignedTotal / alignedCount : 0;
    const resistingRate = resistingCount > 0 ? resistingTotal / resistingCount : 0;
    const diff = alignedRate - resistingRate;

    let correlationStrength: 'forte' | 'modérée' | 'faible';
    if (diff > 0.3) correlationStrength = 'forte';
    else if (diff > 0.1) correlationStrength = 'modérée';
    else correlationStrength = 'faible';

    return {
        alignedCompletionRate: Math.round(alignedRate * 100),
        resistingCompletionRate: Math.round(resistingRate * 100),
        correlationStrength,
    };
}
