// ============================================================
// Calculs nutritionnels : mise à l'échelle, agrégation, progression
// ============================================================

import {
    DailyNutrition,
    FoodEntry,
    MealType,
    MEAL_DEFS,
    NutrientKey,
    NutrientProgress,
    NutrientTotals,
    NutrientVector,
    NUTRIENT_BY_KEY,
    NUTRIENT_DEFS,
} from '@/types/nutrition';

/**
 * Met un vecteur « pour 100 g » à l'échelle d'une quantité en grammes.
 * `grams` peut être nul : on renvoie alors un vecteur vide.
 */
export function scaleNutrients(per100g: NutrientVector, grams: number): NutrientTotals {
    const factor = grams / 100;
    const out: NutrientTotals = {};
    if (!Number.isFinite(factor) || factor <= 0) return out;

    (Object.keys(per100g) as NutrientKey[]).forEach((key) => {
        const value = per100g[key];
        if (typeof value === 'number' && Number.isFinite(value)) {
            out[key] = value * factor;
        }
    });
    return out;
}

/** Additionne deux vecteurs de nutriments (sans muter les entrées). */
export function sumNutrients(a: NutrientTotals, b: NutrientTotals): NutrientTotals {
    const out: NutrientTotals = { ...a };
    (Object.keys(b) as NutrientKey[]).forEach((key) => {
        const value = b[key];
        if (typeof value === 'number' && Number.isFinite(value)) {
            out[key] = (out[key] ?? 0) + value;
        }
    });
    return out;
}

/** Somme des nutriments apportés par une liste d'entrées du journal. */
export function sumEntries(entries: FoodEntry[]): NutrientTotals {
    return entries.reduce<NutrientTotals>(
        (acc, entry) => sumNutrients(acc, scaleNutrients(entry.per100g, entry.grams)),
        {},
    );
}

export function emptyMealTotals(): Record<MealType, NutrientTotals> {
    return MEAL_DEFS.reduce((acc, meal) => {
        acc[meal.key] = {};
        return acc;
    }, {} as Record<MealType, NutrientTotals>);
}

export function groupEntriesByMeal(entries: FoodEntry[]): Record<MealType, FoodEntry[]> {
    const out = MEAL_DEFS.reduce((acc, meal) => {
        acc[meal.key] = [] as FoodEntry[];
        return acc;
    }, {} as Record<MealType, FoodEntry[]>);

    entries.forEach((entry) => {
        if (out[entry.meal]) out[entry.meal].push(entry);
    });
    return out;
}

/**
 * Construit la progression nutriment par nutriment pour une journée.
 *
 * `unknown` signale un nutriment dont **aucun** aliment saisi ne porte
 * l'information : un « 0 % » serait trompeur, on l'affiche comme non renseigné.
 */
export function computeProgress(
    totals: NutrientTotals,
    targets: Partial<Record<NutrientKey, number>>,
): NutrientProgress[] {
    return NUTRIENT_DEFS.map((def) => {
        const raw = totals[def.key];
        const hasData = typeof raw === 'number' && Number.isFinite(raw);
        const value = hasData ? (raw as number) : 0;
        const target = targets[def.key];
        const hasTarget = typeof target === 'number' && target > 0;

        let percent: number | undefined;
        if (hasTarget) percent = Math.round((value / (target as number)) * 100);

        return {
            key: def.key,
            def,
            value,
            target: hasTarget ? target : undefined,
            percent: hasData ? percent : undefined,
            exceeded: Boolean(def.isLimit && hasTarget && value > (target as number)),
            unknown: !hasData,
        };
    });
}

/** Agrège une journée complète : totaux globaux, par repas, et progression. */
export function buildDailyNutrition(
    date: string,
    entries: FoodEntry[],
    targets: Partial<Record<NutrientKey, number>> = {},
): DailyNutrition {
    const byMealEntries = groupEntriesByMeal(entries);
    const byMeal = emptyMealTotals();
    MEAL_DEFS.forEach((meal) => {
        byMeal[meal.key] = sumEntries(byMealEntries[meal.key]);
    });

    const totals = sumEntries(entries);
    const progress = computeProgress(totals, targets);

    return {
        date,
        totals,
        byMeal,
        entries,
        progress,
        missingNutrientCount: progress.filter((p) => p.unknown).length,
    };
}

// ------------------------------------------------------------
// Affichage
// ------------------------------------------------------------

const UNIT_SUFFIX: Record<string, string> = { kcal: 'kcal', g: 'g', mg: 'mg', ug: 'µg' };

/** Formate une valeur de nutriment avec son unité (« 1 250 kcal », « 12,4 g »). */
export function formatNutrient(value: number, key: NutrientKey): string {
    const def = NUTRIENT_BY_KEY[key];
    if (!def) return String(Math.round(value));
    const decimals = def.decimals ?? (def.unit === 'kcal' ? 0 : 1);
    const rounded = value.toFixed(decimals);
    // Séparateur de milliers à la française.
    const [int, frac] = rounded.split('.');
    const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    const num = frac ? `${grouped},${frac}` : grouped;
    return `${num} ${UNIT_SUFFIX[def.unit] ?? def.unit}`;
}

/** Formate une quantité en grammes/ml de façon lisible. */
export function formatQuantity(grams: number, basis: 'g' | 'ml' = 'g'): string {
    const unit = basis === 'ml' ? 'ml' : 'g';
    if (grams >= 100) return `${Math.round(grams)} ${unit}`;
    if (grams >= 10) return `${grams.toFixed(0)} ${unit}`;
    return `${grams.toFixed(1).replace('.', ',')} ${unit}`;
}

/** Calories arrondies, utilisées partout dans l'interface. */
export function caloriesOf(totals: NutrientTotals): number {
    return Math.round(totals.energy ?? 0);
}

/** Part des calories apportée par chaque macro (pour le camembert / les barres). */
export function macroCalorieSplit(totals: NutrientTotals): { protein: number; carbs: number; fat: number } {
    const protein = (totals.protein ?? 0) * 4;
    const carbs = (totals.carbs ?? 0) * 4;
    const fat = (totals.fat ?? 0) * 9;
    const sum = protein + carbs + fat;
    if (sum <= 0) return { protein: 0, carbs: 0, fat: 0 };
    return {
        protein: Math.round((protein / sum) * 100),
        carbs: Math.round((carbs / sum) * 100),
        fat: Math.round((fat / sum) * 100),
    };
}

/** Nutriments les plus en retard sur leur cible (hors plafonds), pour les conseils. */
export function topDeficits(progress: NutrientProgress[], count = 5): NutrientProgress[] {
    return progress
        .filter((p) => !p.unknown && p.target !== undefined && !p.def.isLimit && p.value < (p.target as number))
        .sort((a, b) => (a.percent ?? 0) - (b.percent ?? 0))
        .slice(0, count);
}

/** Nutriments plafonds dépassés (sodium, sucres ajoutés, AG saturés…). */
export function exceededLimits(progress: NutrientProgress[]): NutrientProgress[] {
    return progress.filter((p) => p.exceeded);
}
