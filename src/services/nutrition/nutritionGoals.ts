// ============================================================
// Moteur d'objectifs nutritionnels
//
// Calcule, à partir du profil, les cibles en calories, macros et
// micronutriments — sur le modèle de ce que fait Cronometer :
//   1. Métabolisme de base (Mifflin-St Jeor, ou Katch-McArdle si % de graisse)
//   2. Dépense énergétique totale (facteur d'activité)
//   3. Ajustement selon l'objectif (perte / maintien / prise)
//   4. Répartition macro + apports de référence en micronutriments (DRI)
//
// Les valeurs de référence en micronutriments proviennent des DRI
// (Institute of Medicine / ANSES) pour adultes.
// ============================================================

import {
    ActivityLevel,
    ACTIVITY_LEVELS,
    BmrFormula,
    ComputedTargets,
    GoalType,
    NutrientKey,
    NutritionProfile,
    Sex,
} from '@/types/nutrition';

/** Énergie contenue dans 1 kg de masse corporelle (approximation communément admise). */
export const KCAL_PER_KG = 7700;

export const KCAL_PER_G = { protein: 4, carbs: 4, fat: 9 } as const;

export function getActivityFactor(level: ActivityLevel): number {
    return ACTIVITY_LEVELS.find((a) => a.key === level)?.factor ?? 1.375;
}

export const DEFAULT_MACRO_SPLIT: Record<GoalType, { protein: number; carbs: number; fat: number }> = {
    perte: { protein: 30, carbs: 40, fat: 30 },
    maintien: { protein: 25, carbs: 45, fat: 30 },
    prise: { protein: 25, carbs: 50, fat: 25 },
};

/** Apport protéique minimal conseillé, en g par kg de poids de corps. */
const PROTEIN_FLOOR_G_PER_KG: Record<GoalType, number> = {
    perte: 1.6,
    maintien: 1.2,
    prise: 1.6,
};

/** Seuil de sécurité : en dessous, un avis médical est nécessaire. */
function safetyFloor(sex: Sex): number {
    return sex === 'femme' ? 1200 : 1500;
}

// ------------------------------------------------------------
// 1. Métabolisme de base
// ------------------------------------------------------------

export function computeBmr(profile: NutritionProfile): number {
    const { sex, age, heightCm, weightKg, bmrFormula, bodyFatPercent } = profile;

    // Katch-McArdle : plus fiable quand le % de masse grasse est connu.
    if (bmrFormula === 'katch' && bodyFatPercent && bodyFatPercent > 0 && bodyFatPercent < 70) {
        const leanMass = weightKg * (1 - bodyFatPercent / 100);
        return Math.round(370 + 21.6 * leanMass);
    }

    // Mifflin-St Jeor (formule de référence par défaut).
    const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
    return Math.round(sex === 'homme' ? base + 5 : base - 161);
}

export function computeTdee(bmr: number, activity: ActivityLevel): number {
    return Math.round(bmr * getActivityFactor(activity));
}

// ------------------------------------------------------------
// 2. Ajustement selon l'objectif
// ------------------------------------------------------------

export function computeCalorieTarget(profile: NutritionProfile): { calories: number; tdee: number; bmr: number; safetyWarning?: string } {
    const bmr = computeBmr(profile);
    const tdee = computeTdee(bmr, profile.activity);

    let calories = tdee;
    if (profile.goalType !== 'maintien') {
        const dailyDelta = Math.round((profile.rateKgPerWeek * KCAL_PER_KG) / 7);
        calories = profile.goalType === 'perte' ? tdee - dailyDelta : tdee + dailyDelta;
    }

    let safetyWarning: string | undefined;
    const floor = safetyFloor(profile.sex);
    if (calories < floor) {
        calories = floor;
        safetyWarning =
            `Ta cible a été remontée à ${floor} kcal, le seuil minimal de sécurité. ` +
            `Un déficit plus agressif doit être encadré médicalement.`;
    }
    if (profile.goalType === 'perte' && profile.rateKgPerWeek > 1) {
        safetyWarning =
            safetyWarning ??
            'Une perte de plus de 1 kg/semaine est difficile à tenir et risque de faire perdre du muscle.';
    }

    return { calories: Math.round(calories), tdee, bmr, safetyWarning };
}

// ------------------------------------------------------------
// 3. Répartition des macronutriments
// ------------------------------------------------------------

export interface MacroGrams {
    protein: number;
    carbs: number;
    fat: number;
    /** Vrai si le minimum protéique a relevé la cible au-dessus de la répartition choisie */
    proteinFloorApplied: boolean;
}

export function computeMacroGrams(profile: NutritionProfile, calories: number): MacroGrams {
    const split = profile.macroSplit;
    const total = split.protein + split.carbs + split.fat;
    const safeTotal = total > 0 ? total : 100;

    let protein = (calories * (split.protein / safeTotal)) / KCAL_PER_G.protein;
    let fat = (calories * (split.fat / safeTotal)) / KCAL_PER_G.fat;

    // Les glucides absorbent ce qui reste : c'est le macro le plus flexible.
    let carbs = Math.max(0, (calories - protein * KCAL_PER_G.protein - fat * KCAL_PER_G.fat) / KCAL_PER_G.carbs);

    // Plancher protéique (préserve la masse musculaire, surtout en déficit).
    const floor = PROTEIN_FLOOR_G_PER_KG[profile.goalType] * profile.weightKg;
    let proteinFloorApplied = false;
    if (protein < floor) {
        const deficitKcal = (floor - protein) * KCAL_PER_G.protein;
        protein = floor;
        proteinFloorApplied = true;

        // On retire d'abord des glucides, puis des lipides s'il n'y en a pas assez.
        const carbsKcal = carbs * KCAL_PER_G.carbs;
        if (carbsKcal >= deficitKcal) {
            carbs -= deficitKcal / KCAL_PER_G.carbs;
        } else {
            carbs = 0;
            const remaining = deficitKcal - carbsKcal;
            // On garde au minimum 15 % des calories en lipides (acides gras essentiels).
            const minFat = (calories * 0.15) / KCAL_PER_G.fat;
            fat = Math.max(minFat, fat - remaining / KCAL_PER_G.fat);
        }
    }

    return {
        protein: Math.round(protein),
        carbs: Math.round(carbs),
        fat: Math.round(fat),
        proteinFloorApplied,
    };
}

// ------------------------------------------------------------
// 4. Apports de référence en micronutriments (DRI adultes)
// ------------------------------------------------------------

interface DriRow {
    /** Bornes d'âge [min, max) auxquelles la ligne s'applique */
    age: [number, number];
    value: number;
}

type DriNutrient = Partial<Record<NutrientKey, { homme: DriRow[]; femme: DriRow[] }>>;

/**
 * Apports nutritionnels de référence (DRI) pour adultes.
 * Sources : Institute of Medicine (États-Unis) — valeurs largement reprises
 * par l'ANSES. Les valeurs limites (sodium, sucres, AG saturés) sont des
 * plafonds, marqués `isLimit` dans NUTRIENT_DEFS.
 */
const DRI: DriNutrient = {
    vitaminA: {
        homme: [{ age: [19, 100], value: 900 }],
        femme: [{ age: [19, 100], value: 700 }],
    },
    vitaminC: {
        homme: [{ age: [19, 100], value: 90 }],
        femme: [{ age: [19, 100], value: 75 }],
    },
    vitaminD: {
        homme: [{ age: [19, 70], value: 15 }, { age: [70, 200], value: 20 }],
        femme: [{ age: [19, 70], value: 15 }, { age: [70, 200], value: 20 }],
    },
    vitaminE: {
        homme: [{ age: [19, 100], value: 15 }],
        femme: [{ age: [19, 100], value: 15 }],
    },
    vitaminK: {
        homme: [{ age: [19, 100], value: 120 }],
        femme: [{ age: [19, 100], value: 90 }],
    },
    thiamin: {
        homme: [{ age: [19, 100], value: 1.2 }],
        femme: [{ age: [19, 100], value: 1.1 }],
    },
    riboflavin: {
        homme: [{ age: [19, 100], value: 1.3 }],
        femme: [{ age: [19, 100], value: 1.1 }],
    },
    niacin: {
        homme: [{ age: [19, 100], value: 16 }],
        femme: [{ age: [19, 100], value: 14 }],
    },
    pantothenicAcid: {
        homme: [{ age: [19, 100], value: 5 }],
        femme: [{ age: [19, 100], value: 5 }],
    },
    vitaminB6: {
        homme: [{ age: [19, 51], value: 1.3 }, { age: [51, 200], value: 1.7 }],
        femme: [{ age: [19, 51], value: 1.3 }, { age: [51, 200], value: 1.5 }],
    },
    biotin: {
        homme: [{ age: [19, 100], value: 30 }],
        femme: [{ age: [19, 100], value: 30 }],
    },
    folate: {
        homme: [{ age: [19, 100], value: 400 }],
        femme: [{ age: [19, 100], value: 400 }],
    },
    vitaminB12: {
        homme: [{ age: [19, 100], value: 2.4 }],
        femme: [{ age: [19, 100], value: 2.4 }],
    },
    choline: {
        homme: [{ age: [19, 100], value: 550 }],
        femme: [{ age: [19, 100], value: 425 }],
    },
    calcium: {
        homme: [{ age: [19, 71], value: 1000 }, { age: [71, 200], value: 1200 }],
        femme: [{ age: [19, 51], value: 1000 }, { age: [51, 200], value: 1200 }],
    },
    iron: {
        homme: [{ age: [19, 100], value: 8 }],
        femme: [{ age: [19, 51], value: 18 }, { age: [51, 200], value: 8 }],
    },
    magnesium: {
        homme: [{ age: [19, 31], value: 400 }, { age: [31, 200], value: 420 }],
        femme: [{ age: [19, 31], value: 310 }, { age: [31, 200], value: 320 }],
    },
    phosphorus: {
        homme: [{ age: [19, 100], value: 700 }],
        femme: [{ age: [19, 100], value: 700 }],
    },
    zinc: {
        homme: [{ age: [19, 100], value: 11 }],
        femme: [{ age: [19, 100], value: 8 }],
    },
    copper: {
        homme: [{ age: [19, 100], value: 0.9 }],
        femme: [{ age: [19, 100], value: 0.9 }],
    },
    manganese: {
        homme: [{ age: [19, 100], value: 2.3 }],
        femme: [{ age: [19, 100], value: 1.8 }],
    },
    selenium: {
        homme: [{ age: [19, 100], value: 55 }],
        femme: [{ age: [19, 100], value: 55 }],
    },
    iodine: {
        homme: [{ age: [19, 100], value: 150 }],
        femme: [{ age: [19, 100], value: 150 }],
    },
    potassium: {
        homme: [{ age: [19, 100], value: 3400 }],
        femme: [{ age: [19, 100], value: 2600 }],
    },
    sodium: {
        // Plafond, pas un objectif à atteindre.
        homme: [{ age: [19, 100], value: 2300 }],
        femme: [{ age: [19, 100], value: 2300 }],
    },
    cholesterol: {
        homme: [{ age: [19, 100], value: 300 }],
        femme: [{ age: [19, 100], value: 300 }],
    },
    omega3: {
        homme: [{ age: [19, 100], value: 1.6 }],
        femme: [{ age: [19, 100], value: 1.1 }],
    },
    omega6: {
        homme: [{ age: [19, 100], value: 17 }],
        femme: [{ age: [19, 100], value: 12 }],
    },
};

function lookupDri(rows: DriRow[], age: number): number | undefined {
    return rows.find((r) => age >= r.age[0] && age < r.age[1])?.value;
}

function getDri(key: NutrientKey, sex: Sex, age: number): number | undefined {
    const entry = DRI[key];
    if (!entry) return undefined;
    const rows = sex === 'homme' ? entry.homme : entry.femme;
    return lookupDri(rows, age);
}

/** Apports de référence en micronutriments pour ce profil. */
export function computeMicronutrientTargets(profile: NutritionProfile, calories: number): Partial<Record<NutrientKey, number>> {
    const { sex, age } = profile;
    const targets: Partial<Record<NutrientKey, number>> = {};

    (Object.keys(DRI) as NutrientKey[]).forEach((key) => {
        const value = getDri(key, sex, age);
        if (value !== undefined) targets[key] = value;
    });

    // Fibres : 14 g pour 1 000 kcal (recommandation IOM).
    targets.fiber = Math.round((14 * calories) / 1000);

    // Plafonds exprimés en % de l'apport énergétique.
    targets.addedSugars = Math.round((calories * 0.10) / KCAL_PER_G.carbs);   // < 10 % de l'énergie
    targets.saturatedFat = Math.round((calories * 0.10) / KCAL_PER_G.fat);    // < 10 % de l'énergie

    // Eau : 35 ml par kg de poids de corps.
    targets.water = Math.round(profile.weightKg * 35);

    return targets;
}

// ------------------------------------------------------------
// 5. Assemblage
// ------------------------------------------------------------

/**
 * Calcule l'ensemble des cibles du jour.
 * `overrides` (saisie manuelle) écrasent toujours le calcul.
 */
export function computeTargets(
    profile: NutritionProfile | null,
    overrides: Partial<Record<NutrientKey, number>> = {},
): ComputedTargets {
    if (!profile || !profile.weightKg || !profile.heightCm || !profile.age) {
        return { bmr: 0, tdee: 0, calories: 0, targets: { ...overrides } };
    }

    const { calories, tdee, bmr, safetyWarning } = computeCalorieTarget(profile);
    const macro = computeMacroGrams(profile, calories);
    const micro = computeMicronutrientTargets(profile, calories);

    const targets: Partial<Record<NutrientKey, number>> = {
        ...micro,
        energy: calories,
        protein: macro.protein,
        carbs: macro.carbs,
        fat: macro.fat,
    };

    // Les surcharges manuelles gagnent sur le calcul.
    (Object.keys(overrides) as NutrientKey[]).forEach((key) => {
        const value = overrides[key];
        if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
            targets[key] = value;
        }
    });

    return { bmr, tdee, calories, safetyWarning, targets };
}

/** Répartition macro par défaut conseillée pour un objectif donné. */
export function defaultMacroSplit(goal: GoalType) {
    return { ...DEFAULT_MACRO_SPLIT[goal] };
}

/** Profil vierge, utilisé au premier lancement. */
export function createDefaultProfile(): NutritionProfile {
    return {
        sex: 'homme',
        age: 30,
        heightCm: 175,
        weightKg: 75,
        activity: 'modere',
        goalType: 'maintien',
        rateKgPerWeek: 0.5,
        macroSplit: defaultMacroSplit('maintien'),
        bmrFormula: 'mifflin',
        updatedAt: new Date().toISOString(),
    };
}

/** Vrai si le profil contient assez d'information pour calculer des cibles. */
export function isProfileComplete(profile: NutritionProfile | null): boolean {
    if (!profile) return false;
    return profile.weightKg > 0 && profile.heightCm > 0 && profile.age > 0;
}

export function formatBmrFormula(formula: BmrFormula): string {
    return formula === 'katch' ? 'Katch-McArdle (masse maigre)' : 'Mifflin-St Jeor';
}
