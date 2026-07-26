import { LifeExperiment } from '@/types';

/**
 * Calcule les statistiques d'une expérience : moyennes avant/après, tendances.
 */
export interface ExperimentStats {
    totalDays: number;
    trackedDays: number;
    completionRate: number;
    metricAverages: Record<string, { first3Avg: number; last3Avg: number; trend: number; overallAvg: number }>;
    bestDay: string | null;
    worstDay: string | null;
    isComplete: boolean;
    score: number; // score global 0-100
}

export function computeExperimentStats(experiment: LifeExperiment): ExperimentStats {
    const entries = experiment.entries ?? [];
    const totalDays = entries.length;
    const trackedDays = entries.filter((e) => Object.keys(e.values).length > 0).length;

    if (totalDays === 0) {
        return {
            totalDays: 0, trackedDays: 0, completionRate: 0,
            metricAverages: {}, bestDay: null, worstDay: null,
            isComplete: false, score: 0,
        };
    }

    // Moyennes par métrique
    const metricAverages: Record<string, { first3Avg: number; last3Avg: number; trend: number; overallAvg: number }> = {};

    for (const metric of experiment.metrics) {
        const values = entries.map((e) => e.values[metric]).filter((v): v is number => v !== undefined);
        if (values.length === 0) continue;

        const overallAvg = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;

        // Premiers 3 jours vs derniers 3 jours
        const first3 = values.slice(0, 3);
        const last3 = values.slice(-3);
        const first3Avg = first3.length > 0 ? first3.reduce((a, b) => a + b, 0) / first3.length : 0;
        const last3Avg = last3.length > 0 ? last3.reduce((a, b) => a + b, 0) / last3.length : 0;
        const trend = Math.round((last3Avg - first3Avg) * 10) / 10;

        metricAverages[metric] = {
            first3Avg: Math.round(first3Avg * 10) / 10,
            last3Avg: Math.round(last3Avg * 10) / 10,
            trend,
            overallAvg,
        };
    }

    // Meilleur et pire jour (moyenne des métriques)
    let bestDay: string | null = null;
    let worstDay: string | null = null;
    let bestAvg = 0;
    let worstAvg = 11;

    for (const entry of entries) {
        const vals = Object.values(entry.values);
        if (vals.length === 0) continue;
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        if (avg > bestAvg) { bestAvg = avg; bestDay = entry.date; }
        if (avg < worstAvg) { worstAvg = avg; worstDay = entry.date; }
    }

    // Score global (moyenne des tendances, normalisée 0-100)
    const trends = Object.values(metricAverages).map((m) => m.trend);
    const avgTrend = trends.length > 0 ? trends.reduce((a, b) => a + b, 0) / trends.length : 0;
    // trend va de -9 à +9, on normalise en 0-100
    const score = Math.max(0, Math.min(100, Math.round((avgTrend + 9) / 18 * 100)));

    return {
        totalDays,
        trackedDays,
        completionRate: totalDays > 0 ? Math.round((trackedDays / totalDays) * 100) : 0,
        metricAverages,
        bestDay,
        worstDay,
        isComplete: experiment.status === 'completed',
        score,
    };
}

/**
 * Détermine la phase actuelle d'une expérience.
 */
export function getExperimentPhase(experiment: LifeExperiment): 'pre' | 'during' | 'post' {
    const today = new Date().toISOString().slice(0, 10);
    if (experiment.status === 'completed' || experiment.status === 'archived') return 'post';
    if (today < experiment.startDate) return 'pre';
    if (today > experiment.endDate) return 'post';
    return 'during';
}

/**
 * Calcule le jour de l'expérience (1-indexé).
 */
export function getExperimentDay(experiment: LifeExperiment): number {
    const today = new Date().toISOString().slice(0, 10);
    const start = new Date(experiment.startDate);
    const now = new Date(today);
    const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, Math.min(7, diff + 1));
}

/**
 * Vérifie si l'utilisateur a déjà fait son check-in hoy.
 */
export function hasCheckedInToday(experiment: LifeExperiment): boolean {
    const today = new Date().toISOString().slice(0, 10);
    return (experiment.entries ?? []).some((e) => e.date === today);
}

/**
 * Génère une conclusion automatique basée sur les stats.
 */
export function autoConclusion(stats: ExperimentStats): string {
    if (!stats.isComplete || stats.totalDays < 3) return '';

    const trends = Object.values(stats.metricAverages);
    const improving = trends.filter((t) => t.trend > 0.5).length;
    const declining = trends.filter((t) => t.trend < -0.5).length;
    const total = trends.length;

    if (improving >= total * 0.6) {
        return `L'expérience montre une amélioration dans ${improving}/${total} métriques. L'hypothèse semble validée — les changements ont un impact positif mesurable.`;
    }
    if (declining >= total * 0.6) {
        return `${declining}/${total} métriques ont décliné. L'hypothèse n'est pas confirmée par les données. Peut-être ajuster la durée ou les conditions.`;
    }
    return `Résultats mitigés : ${improving} métrique(s) en hausse, ${declining} en baisse. L'effet n'est pas concluant — à reproduire avec des ajustements.`;
}
