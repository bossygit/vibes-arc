/**
 * Tribunal des Témoins — Evidence Engine
 *
 * Calcule l'arbre hiérarchique des témoins et des accusateurs pour un Désir :
 *   DailyWitness (jour) → WeeklyWitness (7j consécutifs) → MonthlyWitness (4s consécutives) → YearlyWitness (12 mois)
 *
 * Règles :
 *   - Un témoin journalier exige TOUTES les habitudes requises cochées le même jour
 *   - Un jour incomplet = accusateur à tous les niveaux
 *   - 7 DailyWitness consécutifs = 1 WeeklyWitness
 *   - 4 WeeklyWitness consécutifs = 1 MonthlyWitness
 *   - 12 MonthlyWitness consécutifs = 1 YearlyWitness
 *   - Le score de crédibilité est basé sur le rapport de force témoins vs accusateurs
 */

import {
    DailyWitness,
    WeeklyWitness,
    MonthlyWitness,
    YearlyWitness,
    WitnessLevel,
    Verdict,
    getVerdict,
} from '@/types';

/** Date de référence pour le calcul des dayIndex (identique à credibilityScore.ts) */
const REFERENCE_DATE = new Date('2025-10-01');

/**
 * Calcule le dayIndex pour une date donnée.
 * Cohérent avec le système existant des habitudes.
 */
function dateToDayIndex(date: Date): number {
    return Math.floor(
        (date.getTime() - REFERENCE_DATE.getTime()) / (1000 * 60 * 60 * 24)
    );
}

/**
 * Formate une date en YYYY-MM-DD.
 */
function formatDate(date: Date): string {
    return date.toISOString().slice(0, 10);
}

/**
 * Obtient le lundi de la semaine contenant la date donnée.
 */
function getMonday(date: Date): Date {
    const day = date.getDay(); // 0 = dimanche, 1 = lundi, ...
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(date);
    monday.setDate(monday.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
}

/**
 * Obtient le 1er du mois contenant la date donnée.
 */
function getFirstOfMonth(date: Date): Date {
    const first = new Date(date.getFullYear(), date.getMonth(), 1);
    first.setHours(0, 0, 0, 0);
    return first;
}

/**
 * Obtient le 1er janvier de l'année contenant la date donnée.
 */
function getFirstOfYear(date: Date): Date {
    const first = new Date(date.getFullYear(), 0, 1);
    first.setHours(0, 0, 0, 0);
    return first;
}

export interface ComputeWitnessTreeInput {
    desireId: number;
    /** IDs des habitudes qui doivent TOUTES être cochées pour produire un témoin */
    requiredHabitIds: number[];
    /** Toutes les habitudes avec leur progress[] */
    habits: {
        id: number;
        progress: boolean[];
        startDayIndex?: number;
    }[];
    /** Nombre de jours à analyser (défaut: 90 pour couvrir ~3 mois) */
    daysBack?: number;
}

export interface EvidenceEngineResult {
    desireId: number;
    /** Tous les témoins par niveau (jour, semaine, mois, année) */
    witnesses: {
        daily: DailyWitness[];
        weekly: WeeklyWitness[];
        monthly: MonthlyWitness[];
        yearly: YearlyWitness[];
    };
    /** Tous les accusateurs par niveau */
    accusers: {
        daily: DailyWitness[];
        weekly: WeeklyWitness[];
        monthly: MonthlyWitness[];
        yearly: YearlyWitness[];
    };
    /** Score de crédibilité (0-100) */
    credibilityScore: number;
    /** Qui domine : "witness", "accuser", ou "balanced" */
    dominantSide: 'witness' | 'accuser' | 'balanced';
    /** Verdict textuel */
    verdict: Verdict;
    /** Le plus haut niveau de témoin complet (null si aucun) */
    highestWitnessLevel: WitnessLevel | null;
}

/**
 * Calcule l'arbre complet des témoins et accusateurs pour un Désir.
 */
export function computeWitnessTree(input: ComputeWitnessTreeInput): EvidenceEngineResult {
    const { desireId, requiredHabitIds, habits, daysBack = 90 } = input;

    // Si aucune habitude requise, pas de témoins/accusateurs possibles
    if (requiredHabitIds.length === 0) {
        return emptyResult(desireId);
    }

    // Filtrer les habitudes requises (avec garde contre les données corrompues)
    const requiredHabits = habits.filter(h => 
        h && requiredHabitIds.includes(h.id) && Array.isArray(h.progress)
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ============================================================
    // 1. Calcul des DailyWitness (jours)
    // ============================================================
    const allDaily: DailyWitness[] = [];
    for (let i = daysBack - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dayIndex = dateToDayIndex(date);

        const completedHabitIds: number[] = [];
        const missingHabitIds: number[] = [];

        for (const habit of requiredHabits) {
            const startIdx = habit.startDayIndex ?? 0;
            const idx = dayIndex - startIdx;
            if (idx >= 0 && idx < habit.progress.length && habit.progress[idx]) {
                completedHabitIds.push(habit.id);
            } else {
                missingHabitIds.push(habit.id);
            }
        }

        const isComplete = missingHabitIds.length === 0;
        allDaily.push({
            date: formatDate(date),
            desireId,
            isComplete,
            completedHabitIds,
            missingHabitIds,
            isAccuser: !isComplete,
        });
    }

    // ============================================================
    // 2. Calcul des WeeklyWitness (semaines)
    // ============================================================

    // Regrouper les jours en semaines (lundi→dimanche)
    const weekMap = new Map<string, DailyWitness[]>();
    for (const day of allDaily) {
        const d = new Date(day.date + 'T00:00:00');
        const monday = formatDate(getMonday(d));
        if (!weekMap.has(monday)) {
            weekMap.set(monday, []);
        }
        weekMap.get(monday)!.push(day);
    }

    const allWeekly: WeeklyWitness[] = [];
    // Trier les semaines par date de début (plus ancien → plus récent)
    const sortedWeeks = Array.from(weekMap.entries()).sort(([a], [b]) => a.localeCompare(b));

    for (const [weekStart, days] of sortedWeeks) {
        const completeDays = days.filter(d => d.isComplete).length;
        const totalDays = days.length;
        // Il faut 7 jours consécutifs ET tous complets
        const isComplete = totalDays === 7 && completeDays === 7;

        allWeekly.push({
            weekStart,
            desireId,
            isComplete,
            dailyCount: completeDays,
            isAccuser: !isComplete,
        });
    }

    // ============================================================
    // 3. Calcul des MonthlyWitness (mois)
    // ============================================================

    // Regrouper les semaines en mois
    const monthMap = new Map<string, WeeklyWitness[]>();
    for (const week of allWeekly) {
        const d = new Date(week.weekStart + 'T00:00:00');
        const firstOfMonth = formatDate(getFirstOfMonth(d));
        if (!monthMap.has(firstOfMonth)) {
            monthMap.set(firstOfMonth, []);
        }
        monthMap.get(firstOfMonth)!.push(week);
    }

    const allMonthly: MonthlyWitness[] = [];
    const sortedMonths = Array.from(monthMap.entries()).sort(([a], [b]) => a.localeCompare(b));

    for (const [monthStart, weeks] of sortedMonths) {
        const completeWeeks = weeks.filter(w => w.isComplete).length;
        // Il faut 4 semaines complètes (minimum)
        const isComplete = completeWeeks >= 4;

        allMonthly.push({
            monthStart,
            desireId,
            isComplete,
            weeklyCount: completeWeeks,
            isAccuser: !isComplete,
        });
    }

    // ============================================================
    // 4. Calcul des YearlyWitness (années)
    // ============================================================

    // Regrouper les mois en années
    const yearMap = new Map<string, MonthlyWitness[]>();
    for (const month of allMonthly) {
        const d = new Date(month.monthStart + 'T00:00:00');
        const firstOfYear = formatDate(getFirstOfYear(d));
        if (!yearMap.has(firstOfYear)) {
            yearMap.set(firstOfYear, []);
        }
        yearMap.get(firstOfYear)!.push(month);
    }

    const allYearly: YearlyWitness[] = [];
    const sortedYears = Array.from(yearMap.entries()).sort(([a], [b]) => a.localeCompare(b));

    for (const [yearStart, months] of sortedYears) {
        const completeMonths = months.filter(m => m.isComplete).length;
        // Il faut 12 mois complets
        const isComplete = completeMonths >= 12;

        allYearly.push({
            yearStart,
            desireId,
            isComplete,
            monthlyCount: completeMonths,
            isAccuser: !isComplete,
        });
    }

    // ============================================================
    // 5. Séparer témoins et accusateurs par niveau
    // ============================================================

    const witnesses = {
        daily: allDaily.filter(d => d.isComplete).slice(-7),         // 7 derniers jours témoins
        weekly: allWeekly.filter(w => w.isComplete).slice(-4),       // 4 dernières semaines témoins
        monthly: allMonthly.filter(m => m.isComplete).slice(-6),     // 6 derniers mois témoins
        yearly: allYearly.filter(y => y.isComplete),                // années témoins
    };

    const accusers = {
        daily: allDaily.filter(d => d.isAccuser).slice(-7),
        weekly: allWeekly.filter(w => w.isAccuser).slice(-4),
        monthly: allMonthly.filter(m => m.isAccuser).slice(-6),
        yearly: allYearly.filter(y => y.isAccuser),
    };

    // ============================================================
    // 6. Calcul du score de crédibilité et verdict
    // ============================================================

    const credibilityScore = computeCredibilityScore(witnesses, accusers);
    const dominantSide = getDominantSide(witnesses, accusers);
    const verdict = getVerdict(credibilityScore);

    let highestWitnessLevel: WitnessLevel | null = null;
    if (witnesses.yearly.some(y => y.isComplete)) {
        highestWitnessLevel = 'yearly';
    } else if (witnesses.monthly.some(m => m.isComplete)) {
        highestWitnessLevel = 'monthly';
    } else if (witnesses.weekly.some(w => w.isComplete)) {
        highestWitnessLevel = 'weekly';
    } else if (witnesses.daily.some(d => d.isComplete)) {
        highestWitnessLevel = 'daily';
    }

    return {
        desireId,
        witnesses,
        accusers,
        credibilityScore,
        dominantSide,
        verdict,
        highestWitnessLevel,
    };
}

function computeCredibilityScore(witnesses: any, accusers: any): number {
    // Compter le nombre total de preuves (témoins + accusateurs)
    const witnessCount =
        witnesses.daily.length +
        witnesses.weekly.length +
        witnesses.monthly.length +
        witnesses.yearly.length;
    const accuserCount =
        accusers.daily.length +
        accusers.weekly.length +
        accusers.monthly.length +
        accusers.yearly.length;

    const total = witnessCount + accuserCount;
    if (total === 0) return 0;

    // Les témoins lourds (mensuels, annuels) comptent plus
    const weightedWitnesses =
        witnesses.daily.length * 1 +
        witnesses.weekly.length * 2 +
        witnesses.monthly.length * 4 +
        witnesses.yearly.length * 12;
    const weightedAccusers =
        accusers.daily.length * 1 +
        accusers.weekly.length * 2 +
        accusers.monthly.length * 4 +
        accusers.yearly.length * 12;

    const weightedTotal = weightedWitnesses + weightedAccusers;
    if (weightedTotal === 0) return 0;

    return Math.round((weightedWitnesses / weightedTotal) * 100);
}

function getDominantSide(witnesses: any, accusers: any): 'witness' | 'accuser' | 'balanced' {
    const witnessCount =
        witnesses.daily.length +
        witnesses.weekly.length +
        witnesses.monthly.length +
        witnesses.yearly.length;
    const accuserCount =
        accusers.daily.length +
        accusers.weekly.length +
        accusers.monthly.length +
        accusers.yearly.length;

    if (witnessCount === 0 && accuserCount === 0) return 'balanced';
    
    const ratio = Math.abs(witnessCount - accuserCount) / Math.max(witnessCount, accuserCount);
    
    if (ratio < 0.15) return 'balanced';
    return witnessCount > accuserCount ? 'witness' : 'accuser';
}

function emptyResult(desireId: number): EvidenceEngineResult {
    return {
        desireId,
        witnesses: { daily: [], weekly: [], monthly: [], yearly: [] },
        accusers: { daily: [], weekly: [], monthly: [], yearly: [] },
        credibilityScore: 0,
        dominantSide: 'balanced',
        verdict: 'défavorable',
        highestWitnessLevel: null,
    };
}