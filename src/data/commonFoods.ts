// ============================================================
// Base locale d'aliments courants
//
// Les données brutes vivent dans `localFoodSeeds.ts` (valeurs de
// référence pour 100 g). Ce module les valide et les convertit en
// `FoodItem` exploitables par le reste de l'application.
//
// Pourquoi une base locale alors qu'Open Food Facts existe ?
//   1. Elle répond instantanément, sans réseau ni clé API.
//   2. Les aliments bruts et les plats d'Afrique de l'Ouest y sont
//      représentés, ce qu'OFF couvre mal.
//   3. Elle sert de repli hors-ligne.
// ============================================================

import { FoodItem, NutrientKey, NUTRIENT_BY_KEY, NutrientVector } from '@/types/nutrition';
import { LOCAL_FOOD_SEEDS, LocalFoodCategory, LocalFoodSeed } from './localFoodSeeds';

export const LOCAL_CATEGORY_LABELS: Record<LocalFoodCategory, string> = {
    cereales: 'Céréales',
    tubercules: 'Tubercules',
    legumineuses: 'Légumineuses',
    legumes: 'Légumes',
    fruits: 'Fruits',
    viandes: 'Viandes',
    poissons: 'Poissons',
    oeufs: 'Œufs',
    laitiers: 'Produits laitiers',
    'matieres-grasses': 'Matières grasses',
    oleagineux: 'Oléagineux',
    boissons: 'Boissons',
    condiments: 'Condiments',
    'plats-prepares': 'Plats préparés',
};

/** Portions par défaut quand la graine n'en déclare pas. */
function defaultServings(basis: 'g' | 'ml'): { label: string; grams: number }[] {
    if (basis === 'ml') {
        return [
            { label: '1 verre (200 ml)', grams: 200 },
            { label: '1 tasse (250 ml)', grams: 250 },
        ];
    }
    return [
        { label: '1 portion (100 g)', grams: 100 },
        { label: '1 bol (250 g)', grams: 250 },
    ];
}

/**
 * Ne conserve que les clés de nutriments connues et les valeurs finies
 * positives : une clé mal orthographiée dans les données est ignorée
 * plutôt que de corrompre silencieusement les totaux.
 */
function toNutrientVector(raw: Record<string, number>): NutrientVector {
    const out: NutrientVector = {};
    Object.entries(raw ?? {}).forEach(([key, value]) => {
        if (!(key in NUTRIENT_BY_KEY)) return;
        if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return;
        out[key as NutrientKey] = value;
    });
    return out;
}

function toFoodItem(seed: LocalFoodSeed): FoodItem | null {
    const per100g = toNutrientVector(seed.n);
    // Sans calories ni macro principale, l'aliment n'est pas exploitable.
    if (per100g.energy === undefined && per100g.protein === undefined) return null;

    const basis = seed.basis ?? 'g';
    const servings = seed.servings?.filter((s) => s.grams > 0) ?? [];

    return {
        id: `local:${seed.slug}`,
        source: 'local',
        sourceId: seed.slug,
        name: seed.name,
        per100g,
        basis,
        servingSizes: servings.length > 0 ? servings : defaultServings(basis),
        categories: [LOCAL_CATEGORY_LABELS[seed.category] ?? seed.category],
    };
}

/** Catalogue local, prêt à l'emploi (construit une seule fois au chargement). */
export const COMMON_FOODS: FoodItem[] = LOCAL_FOOD_SEEDS
    .map(toFoodItem)
    .filter((item): item is FoodItem => item !== null);

/** Index par identifiant, pour retrouver un aliment sans parcourir la liste. */
export const COMMON_FOODS_BY_ID: Record<string, FoodItem> = COMMON_FOODS.reduce(
    (acc, food) => { acc[food.id] = food; return acc; },
    {} as Record<string, FoodItem>,
);

/** Catégories réellement présentes dans la base locale. */
export const AVAILABLE_LOCAL_CATEGORIES: { key: LocalFoodCategory; label: string; count: number }[] =
    (Object.keys(LOCAL_CATEGORY_LABELS) as LocalFoodCategory[])
        .map((key) => ({
            key,
            label: LOCAL_CATEGORY_LABELS[key],
            count: LOCAL_FOOD_SEEDS.filter((s) => s.category === key).length,
        }))
        .filter((c) => c.count > 0);
