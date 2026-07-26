/**
 * Tribunal des Témoins — computeWitnessTree
 * 
 * Calcule l'arbre hiérarchique des témoins pour un Désir :
 *   DailyWitness (jour) → WeeklyWitness (7j consécutifs) → MonthlyWitness (4s consécutives)
 * 
 * Règles :
 *   - Un témoin journalier exige TOUTES les habitudes requises cochées le même jour
 *   - Un jour incomplet = accusateur à tous les niveaux
 *   - 7 DailyWitness consécutifs = 1 WeeklyWitness
 *   - 4 WeeklyWitness consécutifs = 1 MonthlyWitness
 *   - Par défaut, les accusateurs sont visibles à chaque niveau
 */

import {
    WitnessTree,
    DailyWitness,
    WeeklyWitness,
    MonthlyWitness,
    WitnessLevel,
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
    const diff = day === 0 ? -6 : 1 - day; // lundi = reculer de (day-1) jours
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

/**
 * Calcule l'arbre complet des témoins pour un Désir.
 */
export function computeWitnessTree(input: ComputeWitnessTreeInput): WitnessTree {
    const { desireId, requiredHabitIds, habits, daysBack = 90 } = input;

    // Si aucune habitude requise, pas de témoins possibles
    if (requiredHabitIds.length === 0) {
        return emptyTree(desireId);
    }

    // Filtrer les habitudes requises
    const requiredHabits = habits.filter(h => requiredHabitIds.includes(h.id));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ============================================================
    // 1. Calcul des DailyWitness (jours)
    // ============================================================

    const daily: DailyWitness[] = [];

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

        daily.push({
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

    for (const day of daily) {
        const d = new Date(day.date + 'T00:00:00');
        const monday = formatDate(getMonday(d));
        if (!weekMap.has(monday)) {
            weekMap.set(monday, []);
        }
        weekMap.get(monday)!.push(day);
    }

    const weekly: WeeklyWitness[] = [];

    // Trier les semaines par date de début (plus ancien → plus récent)
    const sortedWeeks = Array.from(weekMap.entries()).sort(([a], [b]) => a.localeCompare(b));

    for (const [weekStart, days] of sortedWeeks) {
        // Une semaine a 7 jours ; la dernière peut être partielle
        const completeDays = days.filter(d => d.isComplete).length;
        const totalDays = days.length;
        // Il faut 7 jours consécutifs ET tous complets
        const isComplete = totalDays === 7 && completeDays === 7;

        weekly.push({
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

    for (const week of weekly) {
        const d = new Date(week.weekStart + 'T00:00:00');
        const firstOfMonth = formatDate(getFirstOfMonth(d));
        if (!monthMap.has(firstOfMonth)) {
            monthMap.set(firstOfMonth, []);
        }
        monthMap.get(firstOfMonth)!.push(week);
    }

    const monthly: MonthlyWitness[] = [];

    const sortedMonths = Array.from(monthMap.entries()).sort(([a], [b]) => a.localeCompare(b));

    for (const [monthStart, weeks] of sortedMonths) {
        const completeWeeks = weeks.filter(w => w.isComplete).length;
        const totalWeeksInMonth = weeks.length;
        // Il faut 4 semaines consécutives ET toutes complètes
        const isComplete = totalWeeksInMonth >= 4 && completeWeeks >= 4;

        monthly.push({
            monthStart,
            desireId,
            isComplete,
            weeklyCount: completeWeeks,
            isAccuser: !isComplete,
        });
    }

    // ============================================================
    // 4. Déterminer le plus haut niveau de témoin
    // ============================================================

    let highestWitnessLevel: WitnessLevel | null = null;

    if (monthly.some(m => m.isComplete)) {
        highestWitnessLevel = 'monthly';
    } else if (weekly.some(w => w.isComplete)) {
        highestWitnessLevel = 'weekly';
    } else if (daily.some(d => d.isComplete)) {
        highestWitnessLevel = 'daily';
    }

    return {
        desireId,
        daily: daily.slice(-7),       // 7 derniers jours
        weekly: weekly.slice(-4),     // 4 dernières semaines
        monthly,                       // tous les mois dans la période
        highestWitnessLevel,
    };
}

function emptyTree(desireId: number): WitnessTree {
    return {
        desireId,
        daily: [],
        weekly: [],
        monthly: [],
        highestWitnessLevel: null,
    };
}
