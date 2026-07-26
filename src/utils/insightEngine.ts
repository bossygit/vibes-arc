/**
 * Moteur de détection de patterns — Vibes AI (D18).
 * Analyse toutes les données utilisateur et produit des insights
 * classifiés par type, catégorie et sévérité.
 *
 * Architecture : fonctions pures prenant les données du store,
 * appelées par le hook React useInsights().
 */

import { Identity, Habit, Desire, DailyMood, Accuser, LifeExperiment, ViewType, CredibilityScore } from '@/types';
import { getHabitStartDayIndex, getCurrentDayIndex, calculateHabitStats } from '@/utils/habitUtils';
import { buildDailyEvidence, computeMoodCompletionCorrelation, computeCredibilityScore } from '@/utils/credibilityScore';
import { computeExperimentStats } from '@/utils/experimentUtils';

// ============================================================
// Types d'insights
// ============================================================

export type InsightCategory = 'mood' | 'habits' | 'accusers' | 'momentum' | 'desires' | 'experiments' | 'general';

export type InsightSeverity = 'win' | 'info' | 'alert' | 'critical';

export type InsightType = 'correlation' | 'pattern' | 'trend' | 'recommendation' | 'milestone' | 'alert' | 'win' | 'info';

export interface Insight {
    id: string;
    type: InsightType;
    category: InsightCategory;
    title: string;
    description: string;
    severity: InsightSeverity;
    emoji: string;
    metric?: {
        label: string;
        value: number | string;
        trend?: 'up' | 'down' | 'stable';
    };
    actionLabel?: string;
    actionView?: ViewType;
    timestamp: string;
}

// ============================================================
// Agrégateur principal
// ============================================================

export interface InsightInput {
    identities: Identity[];
    habits: Habit[];
    desires: Desire[];
    dailyMoods: DailyMood[];
    accusers: Accuser[];
    experiments: LifeExperiment[];
    skipsByHabit: Record<number, number[]>;
}

/**
 * Génère tous les insights depuis les données brutes du store.
 * Les insights sont triés par sévérité (critical → win).
 */
export function generateInsights(input: InsightInput): Insight[] {
    const all: Insight[] = [];

    // Agrégateurs partagés
    const todayIdx = getCurrentDayIndex();
    const last30 = buildGlobalEvidence(input, 30);
    const last7 = buildGlobalEvidence(input, 7);
    const completionPerDay = computeCompletionPerDay(input.habits, todayIdx, 30);

    // === 1. MOOD × HABITS CORRELATION ===
    all.push(...detectMoodHabitCorrelations(last30, last7));

    // === 2. MOOD TRENDS ===
    all.push(...detectMoodTrends(input.dailyMoods));

    // === 3. MOMENTUM BREAK PATTERNS ===
    all.push(...detectMomentumPatterns(input.habits, input.skipsByHabit, todayIdx, completionPerDay));

    // === 4. HABIT CONSISTENCY ===
    all.push(...detectHabitPatterns(input.habits, todayIdx));

    // === 5. ACCUSER PATTERNS ===
    all.push(...detectAccuserPatterns(input.accusers, input.habits, todayIdx));

    // === 6. DESIRE PROGRESS ===
    all.push(...detectDesireTrends(input.desires, input.habits, input.dailyMoods, input.accusers));

    // === 7. EXPERIMENT LEARNINGS ===
    all.push(...detectExperimentInsights(input.experiments));

    // === 8. IDENTITY ALIGNMENT ===
    all.push(...detectIdentityAlignment(input.desires, input.identities, input.habits));

    // === 9. WEEKLY RHYTHMS ===
    all.push(...detectWeeklyRhythms(input.habits, todayIdx));

    // === 10. RECOVERY PATTERNS ===
    all.push(...detectRecoveryPatterns(input.habits, todayIdx, input.skipsByHabit));

    // Trier : d'abord les alertes/critical, puis wins, puis info
    const severityOrder: Record<InsightSeverity, number> = { critical: 0, alert: 1, info: 2, win: 3 };
    all.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    // Limiter à 20 insights max pour éviter la surcharge
    return all.slice(0, 20);
}

// ============================================================
// Analyseurs spécialisés
// ============================================================

/** Construit un DailyEvidence global (tous les habits, sans filtre désir) */
function buildGlobalEvidence(input: InsightInput, daysBack: number) {
    const moodsMap = new Map(input.dailyMoods.map((m) => [m.date, m.score]));
    return buildDailyEvidence(
        input.habits,
        input.identities.map((i) => i.id), // toutes les identités
        moodsMap,
        input.accusers,
        daysBack
    );
}

/** Taux de complétion par jour sur les 30 derniers jours */
function computeCompletionPerDay(habits: Habit[], todayIdx: number, daysBack: number): number[] {
    const rates: number[] = [];
    for (let d = todayIdx - daysBack + 1; d <= todayIdx; d++) {
        const active = habits.filter((h) => {
            const start = h.startDayIndex ?? getHabitStartDayIndex(h);
            return d >= start && d < start + h.progress.length;
        });
        if (active.length === 0) { rates.push(0); continue; }
        const completed = active.filter((h) => h.progress[d]).length;
        rates.push(completed / active.length);
    }
    return rates;
}

// ---- 1. MOOD × HABITS CORRELATION ----

function detectMoodHabitCorrelations(evidence30: ReturnType<typeof buildGlobalEvidence>, evidence7: ReturnType<typeof buildGlobalEvidence>): Insight[] {
    const insights: Insight[] = [];
    const now = new Date().toISOString();

    if (evidence30.length < 5) return [];

    // Corrélation 30 jours
    const corr30 = computeMoodCompletionCorrelation(evidence30);
    // Corrélation 7 jours
    const corr7 = evidence7.length >= 3 ? computeMoodCompletionCorrelation(evidence7) : null;
    const diff = corr30.alignedCompletionRate - corr30.resistingCompletionRate;

    if (corr30.correlationStrength === 'forte' && diff > 30) {
        insights.push({
            id: 'mood-correlation-strong',
            type: 'correlation',
            category: 'mood',
            title: 'Impact émotionnel fort sur tes actions',
            description: `Tu complètes ${corr30.alignedCompletionRate}% de tes signaux les jours alignés, contre seulement ${corr30.resistingCompletionRate}% les jours de résistance. Soit ${diff}% d'écart.`,
            severity: 'info',
            emoji: '📊',
            metric: { label: 'Écart aligné vs résistance', value: `${diff}%`, trend: 'up' },
            actionLabel: 'Voir la météo vibratoire',
            actionView: 'visualizations',
            timestamp: now,
        });
    } else if (corr30.correlationStrength === 'faible' && diff < 15) {
        insights.push({
            id: 'mood-correlation-weak',
            type: 'correlation',
            category: 'mood',
            title: 'Tu agis indépendamment de ton état',
            description: `L'écart entre tes jours alignés (${corr30.alignedCompletionRate}%) et en résistance (${corr30.resistingCompletionRate}%) est faible. Ta discipline ne dépend pas de ton humeur — c'est un signe de force.`,
            severity: 'win',
            emoji: '💪',
            metric: { label: 'Écart', value: `${diff}%`, trend: 'up' },
            timestamp: now,
        });
    }

    // Tendance 7 jours vs 30 jours
    if (corr7 && corr7.alignedCompletionRate > corr30.alignedCompletionRate + 10) {
        insights.push({
            id: 'mood-recent-improvement',
            type: 'trend',
            category: 'mood',
            title: 'Amélioration récente de l\'alignement',
            description: `Les 7 derniers jours : ${corr7.alignedCompletionRate}% d'alignement vs ${corr30.alignedCompletionRate}% sur 30 jours. Ta fréquence vibratoire s'élève.`,
            severity: 'win',
            emoji: '📈',
            metric: { label: 'Progression 7j', value: `+${corr7.alignedCompletionRate - corr30.alignedCompletionRate}%`, trend: 'up' },
            timestamp: now,
        });
    }

    return insights;
}

// ---- 2. MOOD TRENDS ----

function detectMoodTrends(moods: DailyMood[]): Insight[] {
    const insights: Insight[] = [];
    const now = new Date().toISOString();
    if (moods.length < 7) return [];

    const recent7 = moods.slice(-7);
    const prev7 = moods.slice(-14, -7);
    const recentAvg = recent7.reduce((s, m) => s + m.score, 0) / recent7.length;
    const prevAvg = prev7.length > 0 ? prev7.reduce((s, m) => s + m.score, 0) / prev7.length : 0;
    const diff = prevAvg - recentAvg; // négatif = amélioration (score plus bas = mieux)

    // Détection de tendance
    if (diff > 2) {
        insights.push({
            id: 'mood-improving',
            type: 'trend',
            category: 'mood',
            title: 'Ta fréquence vibratoire s\'élève',
            description: `Ta moyenne sur 7 jours (${Math.round(recentAvg)}) est meilleure que les 7 jours précédents (${Math.round(prevAvg)}). Tu montes dans l'échelle émotionnelle.`,
            severity: 'win',
            emoji: '☀️',
            metric: { label: 'Amélioration', value: `+${Math.round(diff)}`, trend: 'up' },
            timestamp: now,
        });
    } else if (diff < -2) {
        insights.push({
            id: 'mood-declining',
            type: 'alert',
            category: 'mood',
            title: 'Baisse vibratoire détectée',
            description: `Ta moyenne sur 7 jours (${Math.round(recentAvg)}) a baissé par rapport aux 7 jours précédents (${Math.round(prevAvg)}). Un signal à ne pas ignorer.`,
            severity: 'alert',
            emoji: '🌧️',
            metric: { label: 'Baisse', value: `${Math.round(Math.abs(diff))}`, trend: 'down' },
            actionLabel: 'Consulter la météo',
            actionView: 'visualizations',
            timestamp: now,
        });
    }

    // Causes les plus fréquentes
    const causeCount = new Map<string, number>();
    moods.forEach((m) => {
        if (m.causes) {
            const causes = m.causes.split(',').map((c) => c.trim().toLowerCase());
            causes.forEach((c) => causeCount.set(c, (causeCount.get(c) || 0) + 1));
        }
    });
    if (causeCount.size > 0) {
        const topCause = [...causeCount.entries()].sort((a, b) => b[1] - a[1])[0];
        if (topCause && topCause[1] >= 3) {
            insights.push({
                id: 'top-mood-cause',
                type: 'pattern',
                category: 'mood',
                title: `"${topCause[0]}" influence souvent ton état`,
                description: `Cette cause revient ${topCause[1]} fois dans tes check-ins émotionnels. C'est un levier important pour comprendre ta météo intérieure.`,
                severity: 'info',
                emoji: '🔍',
                metric: { label: 'Occurrences', value: `${topCause[1]}` },
                timestamp: now,
            });
        }
    }

    return insights;
}

// ---- 3. MOMENTUM BREAK PATTERNS ----

function detectMomentumPatterns(habits: Habit[], skipsByHabit: Record<number, number[]>, _todayIdx: number, completionRates: number[]): Insight[] {
    const insights: Insight[] = [];
    const now = new Date().toISOString();
    if (habits.length === 0) return [];

    // Détection de seuil bas
    const last14 = completionRates.slice(-14);
    if (last14.length >= 7) {
        const avg7 = last14.slice(-7).reduce((s, r) => s + r, 0) / 7;
        const avgPrev = last14.slice(0, 7).reduce((s, r) => s + r, 0) / 7;

        if (avg7 < 0.3 && avg7 < avgPrev * 0.7) {
            insights.push({
                id: 'momentum-break',
                type: 'alert',
                category: 'momentum',
                title: 'Momentum critique — rupture en cours',
                description: `Ta moyenne de complétion des 7 derniers jours est de ${Math.round(avg7 * 100)}%, en baisse significative. C'est le moment de restaurer ton élan.`,
                severity: 'critical',
                emoji: '🚨',
                metric: { label: 'Moyenne 7j', value: `${Math.round(avg7 * 100)}%`, trend: 'down' },
                actionLabel: 'Voir le momentum',
                actionView: 'visualizations',
                timestamp: now,
            });
        } else if (avg7 > 0.8 && avg7 > avgPrev * 1.2) {
            insights.push({
                id: 'momentum-high',
                type: 'milestone',
                category: 'momentum',
                title: 'Momentum en pleine force',
                description: `${Math.round(avg7 * 100)}% de complétion sur les 7 derniers jours — ton élan est à son maximum. C'est le moment d'augmenter l'intensité.`,
                severity: 'win',
                emoji: '🌊',
                metric: { label: 'Moyenne 7j', value: `${Math.round(avg7 * 100)}%`, trend: 'up' },
                timestamp: now,
            });
        }
    }

    // Patterns de skip
    const allSkips = Object.values(skipsByHabit).flat();
    if (allSkips.length > 0) {
        const skipHabits = new Set(Object.keys(skipsByHabit).map(Number));
        const habitNames = habits.filter((h) => skipHabits.has(h.id)).map((h) => h.name);
        insights.push({
            id: 'skip-pattern',
            type: 'pattern',
            category: 'momentum',
            title: `${allSkips.length} jour${allSkips.length > 1 ? 's' : ''} passé${allSkips.length > 1 ? 's' : ''} avec "Passer"`,
            description: `Tu as utilisé l'option "Passer" ${allSkips.length} fois. ${habitNames.length > 0 ? `Habitudes concernées : ${habitNames.slice(0, 3).join(', ')}.` : ''} Observer quand tu skippes t'aide à comprendre les déclencheurs.`,
            severity: 'info',
            emoji: '⏭️',
            metric: { label: 'Sauts', value: `${allSkips.length}` },
            timestamp: now,
        });
    }

    return insights;
}

// ---- 4. HABIT CONSISTENCY ----

function detectHabitPatterns(habits: Habit[], _todayIdx: number): Insight[] {
    const insights: Insight[] = [];
    const now = new Date().toISOString();
    if (habits.length < 3) return [];

    // Habitudes les plus et moins régulières
    const stats = habits.map((h) => ({ habit: h, stats: calculateHabitStats(h) }));
    const sorted = [...stats].sort((a, b) => a.stats.percentage - b.stats.percentage);
    const weakest = sorted[0];
    const strongest = sorted[sorted.length - 1];

    // Habitude la plus faible
    if (weakest && weakest.stats.percentage < 50 && weakest.stats.totalDays >= 7) {
        insights.push({
            id: `weakest-habit-${weakest.habit.id}`,
            type: 'alert',
            category: 'habits',
            title: `${weakest.habit.name} — signe à renforcer`,
            description: `Cette habitude n'est complétée qu'à ${weakest.stats.percentage}%. C'est ton signal le plus fragile. Un petit ajustement peut tout changer.`,
            severity: 'alert',
            emoji: '🎯',
            metric: { label: 'Taux complétion', value: `${weakest.stats.percentage}%`, trend: 'down' },
            actionLabel: 'Détail habitude',
            actionView: 'habitDetail',
            timestamp: now,
        });
    }

    // Habitude la plus forte
    if (strongest && strongest.stats.percentage >= 85 && strongest.stats.totalDays >= 7) {
        insights.push({
            id: `strongest-habit-${strongest.habit.id}`,
            type: 'win',
            category: 'habits',
            title: `${strongest.habit.name} — ancré dans ta routine`,
            description: `${strongest.stats.percentage}% de constance — cette habitude est devenue une extension naturelle de ton identité.`,
            severity: 'win',
            emoji: '🔥',
            metric: { label: 'Taux complétion', value: `${strongest.stats.percentage}%`, trend: 'up' },
            timestamp: now,
        });
    }

    // Streaks remarquables
    const bestStreak = stats.reduce((best, s) => s.stats.longestStreak > best.stats.longestStreak ? s : best, stats[0]);
    if (bestStreak && bestStreak.stats.longestStreak >= 14) {
        insights.push({
            id: `streak-${bestStreak.habit.id}`,
            type: 'milestone',
            category: 'habits',
            title: `${bestStreak.stats.longestStreak} jours de streak sur ${bestStreak.habit.name}`,
            description: `C'est ton plus long streak toutes habitudes confondues. ${bestStreak.stats.longestStreak >= 30 ? 'Un mois complet — impressionnant !' : 'Tu es en train de transformer cette action en identité.'}`,
            severity: 'win',
            emoji: '🏆',
            metric: { label: 'Streak record', value: `${bestStreak.stats.longestStreak} jours` },
            timestamp: now,
        });
    }

    return insights;
}

// ---- 5. ACCUSER PATTERNS ----

function detectAccuserPatterns(accusers: Accuser[], _habits: Habit[], _todayIdx: number): Insight[] {
    const insights: Insight[] = [];
    const now = new Date().toISOString();
    if (accusers.length === 0) return [];

    // Accusateur le plus actif
    const activeCounts = accusers.map((a) => ({
        name: a.name,
        activeDays: a.progress.filter(Boolean).length,
        totalDays: a.progress.length,
        rate: a.progress.length > 0 ? a.progress.filter(Boolean).length / a.progress.length : 0,
    }));
    const mostActive = activeCounts.sort((a, b) => b.rate - a.rate)[0];

    if (mostActive && mostActive.rate > 0.5 && mostActive.totalDays >= 7) {
        insights.push({
            id: `active-accuser-${mostActive.name}`,
            type: 'alert',
            category: 'accusers',
            title: `${mostActive.name} est actif ${Math.round(mostActive.rate * 100)}% du temps`,
            description: `C'est ton accusateur le plus fréquent. Il est présent plus d'un jour sur deux. Réduire sa fréquence pourrait avoir un impact majeur sur ton score de crédibilité.`,
            severity: 'alert',
            emoji: '⚖️',
            metric: { label: 'Fréquence', value: `${Math.round(mostActive.rate * 100)}%`, trend: 'down' },
            actionLabel: 'Voir le tribunal',
            actionView: 'tribunal',
            timestamp: now,
        });
    }

    // Accusateur en diminution (progrès)
    const improving = activeCounts.filter((a) => a.rate < 0.3 && a.totalDays >= 7);
    improving.slice(0, 2).forEach((a) => {
        insights.push({
            id: `improving-accuser-${a.name}`,
            type: 'win',
            category: 'accusers',
            title: `${a.name} — en bonne voie`,
            description: `Cet accusateur n'est actif que ${Math.round(a.rate * 100)}% du temps. Tu progresses dans la gestion de ce comportement.`,
            severity: 'win',
            emoji: '✅',
            metric: { label: 'Taux', value: `${Math.round(a.rate * 100)}%`, trend: 'up' },
            timestamp: now,
        });
    });

    return insights;
}

// ---- 6. DESIRE PROGRESS ----

function detectDesireTrends(
    desires: Desire[],
    habits: Habit[],
    moods: DailyMood[],
    accusers: Accuser[]
): Insight[] {
    const insights: Insight[] = [];
    const now = new Date().toISOString();
    if (desires.length === 0) return [];

    desires.forEach((desire) => {
        const identityIds = desire.linkedIdentityIds;
        const desireAccusers = accusers.filter((a) => a.linkedDesireId === desire.id);
        const moodsMap = new Map(moods.map((m) => [m.date, m.score]));
        const evidence = buildDailyEvidence(habits, identityIds, moodsMap, desireAccusers, 30);

        if (evidence.length < 7) return;

        const score: CredibilityScore = computeCredibilityScore(desire.id, evidence, 0);

        if (score.verdict === 'favorable' && score.total >= 80) {
            insights.push({
                id: `desire-strong-${desire.id}`,
                type: 'milestone',
                category: 'desires',
                title: `${desire.title} — dossier solide (${score.total}%)`,
                description: `Ton dossier pour ce désir est favorable. Les preuves s'accumulent en ta faveur. Tu deviens la personne qui peut recevoir cela.`,
                severity: 'win',
                emoji: '⚖️',
                metric: { label: 'Score crédibilité', value: `${score.total}%`, trend: 'up' },
                actionLabel: 'Voir le tribunal',
                actionView: 'tribunal',
                timestamp: now,
            });
        } else if (score.verdict === 'défavorable' && evidence.length >= 14) {
            insights.push({
                id: `desire-weak-${desire.id}`,
                type: 'alert',
                category: 'desires',
                title: `${desire.title} — dossier fragile (${score.total}%)`,
                description: `Malgré ${evidence.length} jours de données, ton score reste défavorable. Les accusateurs pèsent plus que les preuves. C'est un signal pour ajuster ta stratégie.`,
                severity: 'alert',
                emoji: '⚠️',
                metric: { label: 'Score crédibilité', value: `${score.total}%`, trend: 'down' },
                actionLabel: 'Analyser ce désir',
                actionView: 'tribunal',
                timestamp: now,
            });
        }
    });

    return insights;
}

// ---- 7. EXPERIMENT LEARNINGS ----

function detectExperimentInsights(experiments: LifeExperiment[]): Insight[] {
    const insights: Insight[] = [];
    const now = new Date().toISOString();

    const completed = experiments.filter((e) => e.status === 'completed' && e.entries.length >= 3);
    if (completed.length === 0) return [];

    // Dernière expérience terminée
    const latest = completed[completed.length - 1];
    const stats = computeExperimentStats(latest);

    if (stats.isComplete && stats.score > 60) {
        insights.push({
            id: `experiment-positive-${latest.id}`,
            type: 'recommendation',
            category: 'experiments',
            title: `${latest.title} : résultat encourageant`,
            description: `Cette expérience a montré une tendance positive (score ${stats.score}%). ${latest.conclusion ? `Ta conclusion : "${latest.conclusion}"` : 'Les données parlent d\'elles-mêmes.'}`,
            severity: 'win',
            emoji: '🔬',
            metric: { label: 'Score', value: `${stats.score}%`, trend: 'up' },
            actionLabel: 'Voir le labo',
            actionView: 'lifeExperiments',
            timestamp: now,
        });
    } else if (stats.isComplete && stats.score < 40) {
        insights.push({
            id: `experiment-negative-${latest.id}`,
            type: 'recommendation',
            category: 'experiments',
            title: `${latest.title} : résultats mitigés`,
            description: `L'expérience n'a pas produit l'effet escompté (score ${stats.score}%). ${latest.conclusion ? `Ta conclusion : "${latest.conclusion}"` : 'Peut-être essayer avec une durée ou des conditions différentes ?'}`,
            severity: 'info',
            emoji: '🔬',
            metric: { label: 'Score', value: `${stats.score}%`, trend: 'down' },
            timestamp: now,
        });
    }

    // Recommandation : lancer une expérience si pas fait depuis longtemps
    const lastExperimentDate = completed[completed.length - 1]?.endDate;
    if (lastExperimentDate) {
        const daysSince = Math.floor((Date.now() - new Date(lastExperimentDate).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSince > 21 && experiments.length < 5) {
            insights.push({
                id: 'suggest-experiment',
                type: 'recommendation',
                category: 'experiments',
                title: 'Ça fait un moment — nouvelle expérience ?',
                description: `Ta dernière expérience remonte à ${daysSince} jours. Lancer une nouvelle expérience de 7 jours pourrait t'apporter des données fraîches sur ce qui fonctionne.`,
                severity: 'info',
                emoji: '💡',
                metric: { label: 'Jours depuis', value: `${daysSince}` },
                actionLabel: 'Créer une expérience',
                actionView: 'lifeExperiments',
                timestamp: now,
            });
        }
    }

    return insights;
}

// ---- 8. IDENTITY ALIGNMENT ----

function detectIdentityAlignment(_desires: Desire[], identities: Identity[], habits: Habit[]): Insight[] {
    const insights: Insight[] = [];
    const now = new Date().toISOString();

    if (identities.length === 0) return [];

    // Vérifier si chaque identité a des habitudes liées
    const identitiesWithHabits = new Set<number>();
    habits.forEach((h) => (h.linkedIdentities || []).forEach((id) => identitiesWithHabits.add(id)));

    const orphans = identities.filter((i) => !identitiesWithHabits.has(i.id));
    if (orphans.length > 0) {
        insights.push({
            id: 'identity-orphans',
            type: 'recommendation',
            category: 'general',
            title: `${orphans.length} identité${orphans.length > 1 ? 's' : ''} sans signal`,
            description: `${orphans.map((i) => i.name).join(', ')} n'ont aucun signal (habitude) qui les active. Ajouter des habitudes à ces identités renforcerait ton dossier.`,
            severity: 'info',
            emoji: '🧬',
            metric: { label: 'Identités orphelines', value: `${orphans.length}` },
            actionLabel: 'Gérer les identités',
            actionView: 'identities',
            timestamp: now,
        });
    }

    // Identité la plus représentée
    const identityHabitCount = new Map<number, { name: string; count: number }>();
    identities.forEach((i) => identityHabitCount.set(i.id, { name: i.name, count: 0 }));
    habits.forEach((h) => (h.linkedIdentities || []).forEach((id) => {
        const entry = identityHabitCount.get(id);
        if (entry) entry.count++;
    }));
    const topIdentity = [...identityHabitCount.entries()].sort((a, b) => b[1].count - a[1].count)[0];
    if (topIdentity && topIdentity[1].count >= 3) {
        insights.push({
            id: 'top-identity',
            type: 'info',
            category: 'general',
            title: `${topIdentity[1].name} — ${topIdentity[1].count} signaux actifs`,
            description: `C'est l'identité avec le plus de signaux (habitudes) qui la soutiennent. Tu investis le plus dans cette version de toi-même.`,
            severity: 'info',
            emoji: '👤',
            metric: { label: 'Signaux', value: `${topIdentity[1].count}` },
            timestamp: now,
        });
    }

    return insights;
}

// ---- 9. WEEKLY RHYTHMS ----

function detectWeeklyRhythms(habits: Habit[], todayIdx: number): Insight[] {
    const insights: Insight[] = [];
    const now = new Date().toISOString();
    if (habits.length === 0) return [];

    // Analyser le jour de la semaine avec le meilleur/pire taux
    const dayTotals: { completed: number; total: number }[] = Array.from({ length: 7 }, () => ({ completed: 0, total: 0 }));
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

    for (let d = Math.max(0, todayIdx - 60); d <= todayIdx; d++) {
        const date = new Date();
        date.setDate(date.getDate() - (todayIdx - d));
        const dayOfWeek = date.getDay();
        const active = habits.filter((h) => {
            const start = h.startDayIndex ?? getHabitStartDayIndex(h);
            return d >= start && d < start + h.progress.length;
        });
        if (active.length === 0) continue;
        const completed = active.filter((h) => h.progress[d]).length;
        dayTotals[dayOfWeek].total++;
        dayTotals[dayOfWeek].completed += completed / active.length;
    }

    const dayAverages = dayTotals.map((d, i) => ({
        name: dayNames[i],
        avg: d.total > 0 ? d.completed / d.total : 0,
        total: d.total,
    }));

    const bestDay = dayAverages.reduce((best, d) => d.avg > best.avg ? d : best, dayAverages[0]);
    const worstDay = dayAverages.reduce((worst, d) => d.avg < worst.avg ? d : worst, dayAverages[0]);

    if (bestDay.total >= 4 && bestDay.avg > 0.7 && bestDay.avg - worstDay.avg > 0.2) {
        insights.push({
            id: 'weekly-rhythm',
            type: 'pattern',
            category: 'general',
            title: `Tes ${bestDay.name} sont plus productifs que tes ${worstDay.name}`,
            description: `Taux de complétion : ${Math.round(bestDay.avg * 100)}% le ${bestDay.name} vs ${Math.round(worstDay.avg * 100)}% le ${worstDay.name}. ${worstDay.avg < 0.4 ? `${worstDay.name} pourraient être un jour de récupération intentionnelle.` : 'Un rythme hebdomadaire se dessine.'}`,
            severity: 'info',
            emoji: '📅',
            metric: { label: 'Écart', value: `${Math.round((bestDay.avg - worstDay.avg) * 100)}%` },
            timestamp: now,
        });
    }

    // Weekend vs semaine
    const weekdays = dayAverages.slice(1, 6); // Lun-Ven
    const weekend = [dayAverages[0], dayAverages[6]]; // Dim, Sam
    const avgWeekday = weekdays.reduce((s, d) => s + d.avg, 0) / weekdays.length;
    const avgWeekend = weekend.reduce((s, d) => s + d.avg, 0) / weekend.length;
    if (weekdays[0]?.total >= 4 && weekend[0]?.total >= 2) {
        const diff = Math.round((avgWeekday - avgWeekend) * 100);
        if (Math.abs(diff) > 15) {
            insights.push({
                id: 'weekend-pattern',
                type: 'pattern',
                category: 'general',
                title: diff > 0
                    ? `Tes semaines sont ${diff}% plus productives que tes week-ends`
                    : `Tes week-ends sont ${Math.abs(diff)}% plus productifs que tes semaines`,
                description: diff > 0
                    ? 'Tu maintiens mieux tes habitudes en semaine. Le week-end, tu relâches — ce qui est humain. Un rituel minimal le samedi/dimanche pourrait lisser la courbe.'
                    : 'Tes week-ends sont plus forts. Peut-être as-tu plus de temps ou moins de stress. Transposer une partie de cette énergie en semaine pourrait t\'aider.',
                severity: 'info',
                emoji: '📆',
                metric: { label: 'Écart semaine/week-end', value: `${Math.abs(diff)}%` },
                timestamp: now,
            });
        }
    }

    return insights;
}

// ---- 10. RECOVERY PATTERNS ----

function detectRecoveryPatterns(habits: Habit[], todayIdx: number, skipsByHabit: Record<number, number[]>): Insight[] {
    const insights: Insight[] = [];
    const now = new Date().toISOString();

    // Détection : après une rupture, combien de temps pour revenir ?
    const recoveries: number[] = [];

    habits.forEach((h) => {
        const start = h.startDayIndex ?? getHabitStartDayIndex(h);
        let breakStart: number | null = null;
        for (let d = start; d < start + h.progress.length && d <= todayIdx; d++) {
            const isSkipped = skipsByHabit[h.id]?.includes(d) ?? false;
            const isDone = h.progress[d];
            if (!isDone && !isSkipped) {
                if (breakStart === null) breakStart = d;
            } else if (isDone && breakStart !== null) {
                recoveries.push(d - breakStart);
                breakStart = null;
            } else if (isSkipped) {
                breakStart = null; // skip "neutre" ne casse pas
            }
        }
    });

    if (recoveries.length >= 3) {
        const avgRecovery = Math.round(recoveries.reduce((s, r) => s + r, 0) / recoveries.length);
        if (avgRecovery <= 2) {
            insights.push({
                id: 'fast-recovery',
                type: 'win',
                category: 'momentum',
                title: `Tu récupères en ${avgRecovery} jour${avgRecovery > 1 ? 's' : ''} après une rupture`,
                description: 'Quand tu casses une habitude, tu reviens rapidement. Ta capacité de rebond est excellente — c\'est un signe de résilience.',
                severity: 'win',
                emoji: '🔄',
                metric: { label: 'Temps de récupération moyen', value: `${avgRecovery} jours` },
                timestamp: now,
            });
        } else if (avgRecovery >= 5) {
            insights.push({
                id: 'slow-recovery',
                type: 'alert',
                category: 'momentum',
                title: `Il te faut ${avgRecovery} jours pour revenir après une rupture`,
                description: 'Quand le momentum casse, tu mets du temps à redémarrer. Identifier ce qui déclenche la rupture pourrait réduire ce délai.',
                severity: 'alert',
                emoji: '🐢',
                metric: { label: 'Temps de récupération', value: `${avgRecovery} jours` },
                actionLabel: 'Voir les outils de récupération',
                actionView: 'dashboard',
                timestamp: now,
            });
        }
    } else if (recoveries.length === 0 && habits.some((h) => {
        const start = h.startDayIndex ?? getHabitStartDayIndex(h);
        return h.progress.slice(start).filter(Boolean).length > 10;
    })) {
        insights.push({
            id: 'no-breaks',
            type: 'win',
            category: 'momentum',
            title: 'Aucune rupture détectée récemment',
            description: 'Tes habitudes tiennent. La constance est ton plus grand allié dans la transformation.',
            severity: 'win',
            emoji: '🌟',
            timestamp: now,
        });
    }

    return insights;
}
