// ============================================================
// Module Nutrition — modèle de données
//
// Objectif : suivre calories + nutriments (macros et micros) contre
// des objectifs personnalisés, alimenté par des bases externes
// (Open Food Facts, USDA FoodData Central) + une base locale.
//
// Convention de stockage : tout nutriment est stocké dans son unité
// canonique (voir NUTRIENT_DEFS) et **pour 100 g** (ou 100 ml pour
// les boissons). Les conversions se font à l'ingestion (adaptateurs).
// ============================================================

export type NutrientKey =
    // Énergie
    | 'energy'
    // Macros
    | 'protein' | 'carbs' | 'fat' | 'fiber' | 'sugars' | 'addedSugars'
    // Lipides détaillés
    | 'saturatedFat' | 'monounsaturatedFat' | 'polyunsaturatedFat' | 'transFat'
    | 'omega3' | 'omega6' | 'cholesterol'
    // Minéraux
    | 'sodium' | 'potassium' | 'calcium' | 'iron' | 'magnesium' | 'phosphorus'
    | 'zinc' | 'copper' | 'manganese' | 'selenium' | 'iodine'
    // Vitamines
    | 'vitaminA' | 'vitaminC' | 'vitaminD' | 'vitaminE' | 'vitaminK'
    | 'thiamin' | 'riboflavin' | 'niacin' | 'pantothenicAcid' | 'vitaminB6'
    | 'biotin' | 'folate' | 'vitaminB12' | 'choline'
    // Divers
    | 'water' | 'caffeine' | 'alcohol';

export type NutrientUnit = 'kcal' | 'g' | 'mg' | 'ug';

/**
 * Familles d'affichage. `energy` et `macro` sont mis en avant,
 * `lipid`/`mineral`/`vitamin` alimentent le rapport détaillé.
 */
export type NutrientGroup = 'energy' | 'macro' | 'lipid' | 'mineral' | 'vitamin' | 'other';

export interface NutrientDef {
    key: NutrientKey;
    /** Libellé français affiché dans l'interface */
    label: string;
    /** Unité canonique de stockage */
    unit: NutrientUnit;
    group: NutrientGroup;
    /** Vrai si la cible est un plafond à ne pas dépasser (sodium, sucres…) */
    isLimit?: boolean;
    /** Nombre de décimales conseillé pour l'affichage */
    decimals?: number;
    /** Nutriments affichés dans le résumé compact */
    highlight?: boolean;
}

/** Définition canonique de tous les nutriments suivis, dans l'ordre d'affichage. */
export const NUTRIENT_DEFS: NutrientDef[] = [
    { key: 'energy', label: 'Calories', unit: 'kcal', group: 'energy', decimals: 0, highlight: true },

    { key: 'protein', label: 'Protéines', unit: 'g', group: 'macro', decimals: 1, highlight: true },
    { key: 'carbs', label: 'Glucides', unit: 'g', group: 'macro', decimals: 1, highlight: true },
    { key: 'fat', label: 'Lipides', unit: 'g', group: 'macro', decimals: 1, highlight: true },
    { key: 'fiber', label: 'Fibres', unit: 'g', group: 'macro', decimals: 1, highlight: true },
    { key: 'sugars', label: 'Sucres', unit: 'g', group: 'macro', decimals: 1, isLimit: true },
    { key: 'addedSugars', label: 'Sucres ajoutés', unit: 'g', group: 'macro', decimals: 1, isLimit: true },

    { key: 'saturatedFat', label: 'Acides gras saturés', unit: 'g', group: 'lipid', decimals: 1, isLimit: true },
    { key: 'monounsaturatedFat', label: 'AG mono-insaturés', unit: 'g', group: 'lipid', decimals: 1 },
    { key: 'polyunsaturatedFat', label: 'AG poly-insaturés', unit: 'g', group: 'lipid', decimals: 1 },
    { key: 'transFat', label: 'AG trans', unit: 'g', group: 'lipid', decimals: 1, isLimit: true },
    { key: 'omega3', label: 'Oméga-3', unit: 'g', group: 'lipid', decimals: 2 },
    { key: 'omega6', label: 'Oméga-6', unit: 'g', group: 'lipid', decimals: 2 },
    { key: 'cholesterol', label: 'Cholestérol', unit: 'mg', group: 'lipid', decimals: 0, isLimit: true },

    { key: 'sodium', label: 'Sodium', unit: 'mg', group: 'mineral', decimals: 0, isLimit: true, highlight: true },
    { key: 'potassium', label: 'Potassium', unit: 'mg', group: 'mineral', decimals: 0 },
    { key: 'calcium', label: 'Calcium', unit: 'mg', group: 'mineral', decimals: 0, highlight: true },
    { key: 'iron', label: 'Fer', unit: 'mg', group: 'mineral', decimals: 1, highlight: true },
    { key: 'magnesium', label: 'Magnésium', unit: 'mg', group: 'mineral', decimals: 0 },
    { key: 'phosphorus', label: 'Phosphore', unit: 'mg', group: 'mineral', decimals: 0 },
    { key: 'zinc', label: 'Zinc', unit: 'mg', group: 'mineral', decimals: 1 },
    { key: 'copper', label: 'Cuivre', unit: 'mg', group: 'mineral', decimals: 2 },
    { key: 'manganese', label: 'Manganèse', unit: 'mg', group: 'mineral', decimals: 2 },
    { key: 'selenium', label: 'Sélénium', unit: 'ug', group: 'mineral', decimals: 0 },
    { key: 'iodine', label: 'Iode', unit: 'ug', group: 'mineral', decimals: 0 },

    { key: 'vitaminA', label: 'Vitamine A', unit: 'ug', group: 'vitamin', decimals: 0 },
    { key: 'vitaminC', label: 'Vitamine C', unit: 'mg', group: 'vitamin', decimals: 0, highlight: true },
    { key: 'vitaminD', label: 'Vitamine D', unit: 'ug', group: 'vitamin', decimals: 1 },
    { key: 'vitaminE', label: 'Vitamine E', unit: 'mg', group: 'vitamin', decimals: 1 },
    { key: 'vitaminK', label: 'Vitamine K', unit: 'ug', group: 'vitamin', decimals: 0 },
    { key: 'thiamin', label: 'Vitamine B1', unit: 'mg', group: 'vitamin', decimals: 2 },
    { key: 'riboflavin', label: 'Vitamine B2', unit: 'mg', group: 'vitamin', decimals: 2 },
    { key: 'niacin', label: 'Vitamine B3', unit: 'mg', group: 'vitamin', decimals: 1 },
    { key: 'pantothenicAcid', label: 'Vitamine B5', unit: 'mg', group: 'vitamin', decimals: 2 },
    { key: 'vitaminB6', label: 'Vitamine B6', unit: 'mg', group: 'vitamin', decimals: 2 },
    { key: 'biotin', label: 'Vitamine B7', unit: 'ug', group: 'vitamin', decimals: 1 },
    { key: 'folate', label: 'Vitamine B9', unit: 'ug', group: 'vitamin', decimals: 0 },
    { key: 'vitaminB12', label: 'Vitamine B12', unit: 'ug', group: 'vitamin', decimals: 2 },
    { key: 'choline', label: 'Choline', unit: 'mg', group: 'vitamin', decimals: 0 },

    { key: 'water', label: 'Eau', unit: 'g', group: 'other', decimals: 0 },
    { key: 'caffeine', label: 'Caféine', unit: 'mg', group: 'other', decimals: 0 },
    { key: 'alcohol', label: 'Alcool', unit: 'g', group: 'other', decimals: 1, isLimit: true },
];

export const NUTRIENT_BY_KEY: Record<NutrientKey, NutrientDef> = NUTRIENT_DEFS.reduce(
    (acc, def) => { acc[def.key] = def; return acc; },
    {} as Record<NutrientKey, NutrientDef>,
);

export const NUTRIENT_GROUPS: { key: NutrientGroup; label: string }[] = [
    { key: 'energy', label: 'Énergie' },
    { key: 'macro', label: 'Macronutriments' },
    { key: 'lipid', label: 'Lipides détaillés' },
    { key: 'mineral', label: 'Minéraux' },
    { key: 'vitamin', label: 'Vitamines' },
    { key: 'other', label: 'Autres' },
];

/** Vecteur de nutriments, pour 100 g. Un nutriment absent = donnée non disponible. */
export type NutrientVector = Partial<Record<NutrientKey, number>>;

/** Somme de nutriments consommés (mêmes unités canoniques, total du jour). */
export type NutrientTotals = Partial<Record<NutrientKey, number>>;

// ------------------------------------------------------------
// Aliments
// ------------------------------------------------------------

export type FoodSource = 'local' | 'off' | 'usda' | 'custom';

export const FOOD_SOURCE_LABELS: Record<FoodSource, string> = {
    local: 'Base vibes-arc',
    off: 'Open Food Facts',
    usda: 'USDA FoodData',
    custom: 'Mes aliments',
};

/** Une portion nommée ramenée à un poids en grammes. */
export interface ServingSize {
    label: string;
    grams: number;
}

export interface FoodItem {
    /** Identifiant global : `local:riz-cuit`, `off:3017620422003`, `usda:173944` */
    id: string;
    source: FoodSource;
    /** Identifiant dans la source d'origine (slug, code-barres, fdcId) */
    sourceId: string;
    name: string;
    brand?: string;
    barcode?: string;
    /** Nutriments pour 100 g (ou 100 ml si `basis === 'ml'`) */
    per100g: NutrientVector;
    /** Base de mesure : les liquides sont saisis au volume */
    basis: 'g' | 'ml';
    servingSizes: ServingSize[];
    imageUrl?: string;
    categories?: string[];
    /** Nutri-Score (a–e) quand Open Food Facts le fournit */
    nutriscore?: string;
    /** Groupe NOVA 1–4 (degré de transformation) */
    novaGroup?: number;
}

// ------------------------------------------------------------
// Journal alimentaire
// ------------------------------------------------------------

export type MealType = 'petitDejeuner' | 'dejeuner' | 'diner' | 'collation';

export const MEAL_DEFS: { key: MealType; label: string; emoji: string }[] = [
    { key: 'petitDejeuner', label: 'Petit-déjeuner', emoji: '🌅' },
    { key: 'dejeuner', label: 'Déjeuner', emoji: '🍽️' },
    { key: 'diner', label: 'Dîner', emoji: '🌙' },
    { key: 'collation', label: 'Collations', emoji: '🍎' },
];

export const MEAL_LABELS: Record<MealType, string> = MEAL_DEFS.reduce(
    (acc, m) => { acc[m.key] = m.label; return acc; },
    {} as Record<MealType, string>,
);

/**
 * Une ligne du journal. Les nutriments sont **figés** (`per100g`) au moment
 * de la saisie : si la base externe corrige la fiche plus tard, l'historique
 * de l'utilisateur ne change pas.
 */
export interface FoodEntry {
    id: number;
    /** Date locale YYYY-MM-DD */
    date: string;
    meal: MealType;
    source: FoodSource;
    sourceId: string;
    name: string;
    brand?: string;
    /** Quantité consommée, en grammes (ou ml pour les liquides) */
    grams: number;
    basis: 'g' | 'ml';
    /** Snapshot nutritionnel pour 100 g au moment de la saisie */
    per100g: NutrientVector;
    /** Portion utilisée, pour réaffichage (« 1 bol (250 g) ») */
    servingLabel?: string;
    createdAt: string;
}

/** Entrée du journal avant persistance (id/createdAt attribués par la couche données). */
export type FoodEntryDraft = Omit<FoodEntry, 'id' | 'createdAt'>;

// ------------------------------------------------------------
// Profil & objectifs
// ------------------------------------------------------------

export type Sex = 'homme' | 'femme';

export type ActivityLevel = 'sedentaire' | 'leger' | 'modere' | 'actif' | 'tres_actif';

export const ACTIVITY_LEVELS: { key: ActivityLevel; label: string; factor: number; description: string }[] = [
    { key: 'sedentaire', label: 'Sédentaire', factor: 1.2, description: 'Travail de bureau, peu ou pas d’exercice' },
    { key: 'leger', label: 'Léger', factor: 1.375, description: 'Exercice léger 1–3 jours/semaine' },
    { key: 'modere', label: 'Modéré', factor: 1.55, description: 'Exercice modéré 3–5 jours/semaine' },
    { key: 'actif', label: 'Actif', factor: 1.725, description: 'Exercice intense 6–7 jours/semaine' },
    { key: 'tres_actif', label: 'Très actif', factor: 1.9, description: 'Travail physique + entraînement quotidien' },
];

export type GoalType = 'perte' | 'maintien' | 'prise';

export const GOAL_TYPES: { key: GoalType; label: string; description: string }[] = [
    { key: 'perte', label: 'Perdre du poids', description: 'Déficit calorique progressif' },
    { key: 'maintien', label: 'Maintenir', description: 'Rester au poids de forme' },
    { key: 'prise', label: 'Prendre de la masse', description: 'Surplus calorique contrôlé' },
];

export type BmrFormula = 'mifflin' | 'katch';

export interface MacroSplit {
    /** Part des calories apportée par chaque macro, en % (somme ≈ 100) */
    protein: number;
    carbs: number;
    fat: number;
}

export interface NutritionProfile {
    sex: Sex;
    age: number;
    heightCm: number;
    weightKg: number;
    activity: ActivityLevel;
    goalType: GoalType;
    /** Rythme visé en kg/semaine (ex. 0.5) — ignoré en maintien */
    rateKgPerWeek: number;
    macroSplit: MacroSplit;
    bmrFormula: BmrFormula;
    /** Masse grasse en % — requis pour la formule de Katch-McArdle */
    bodyFatPercent?: number;
    updatedAt: string;
}

/**
 * Objectifs du jour. `targets` contient la valeur calculée pour chaque
 * nutriment (profil → formule), éventuellement remplacée par `overrides`.
 */
export interface NutritionGoals {
    /** Cibles finales, dans l'unité canonique de chaque nutriment */
    targets: Partial<Record<NutrientKey, number>>;
    /** Valeurs saisies manuellement par l'utilisateur (prioritaires) */
    overrides: Partial<Record<NutrientKey, number>>;
    /** Métabolisme de base calculé (kcal) */
    bmr: number;
    /** Dépense énergétique totale estimée (kcal) */
    tdee: number;
    /** Avertissement affiché si la cible est sous le seuil de sécurité */
    safetyWarning?: string;
    updatedAt: string;
}

/** Résultat du calcul : cibles + explication, pour l'affichage. */
export interface ComputedTargets {
    bmr: number;
    tdee: number;
    calories: number;
    safetyWarning?: string;
    targets: Partial<Record<NutrientKey, number>>;
}

// ------------------------------------------------------------
// Agrégats du jour
// ------------------------------------------------------------

export interface NutrientProgress {
    key: NutrientKey;
    def: NutrientDef;
    /** Total consommé (unité canonique) */
    value: number;
    /** Cible, si définie */
    target?: number;
    /** % de la cible (peut dépasser 100) */
    percent?: number;
    /** Pour un nutriment plafond : la cible est dépassée */
    exceeded: boolean;
    /** Donnée absente de tous les aliments saisis */
    unknown: boolean;
}

export interface DailyNutrition {
    date: string;
    totals: NutrientTotals;
    /** Totaux par repas */
    byMeal: Record<MealType, NutrientTotals>;
    entries: FoodEntry[];
    /** Progression par nutriment, dans l'ordre de NUTRIENT_DEFS */
    progress: NutrientProgress[];
    /** Nombre de nutriments non renseignés par les aliments saisis */
    missingNutrientCount: number;
}

/** Statut d'une journée vis-à-vis de la cible calorique. */
export type CalorieStatus = 'sous' | 'proche' | 'atteint' | 'depasse';

export function getCalorieStatus(consumed: number, target: number): CalorieStatus {
    if (target <= 0) return 'sous';
    const ratio = consumed / target;
    if (ratio > 1.1) return 'depasse';
    if (ratio >= 0.9) return 'atteint';
    if (ratio >= 0.7) return 'proche';
    return 'sous';
}

export const CALORIE_STATUS_LABELS: Record<CalorieStatus, string> = {
    sous: 'Bien en dessous de la cible',
    proche: 'Proche de la cible',
    atteint: 'Cible atteinte',
    depasse: 'Cible dépassée',
};
