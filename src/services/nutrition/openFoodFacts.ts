// ============================================================
// Adaptateur Open Food Facts
//
// OFF est une base ouverte (ODbL) de plusieurs millions de produits
// emballés, avec codes-barres — l'équivalent le plus proche de la base
// de Cronometer pour les produits de marque.
//
// Les requêtes passent par le proxy de l'application
// (/api/nutrition/off-search et /api/nutrition/off-product) et non par
// les domaines d'OFF directement :
//   - `search.openfoodfacts.org` ne renvoie aucun en-tête CORS, un appel
//     depuis le navigateur est donc impossible ;
//   - les conditions d'usage d'OFF demandent un User-Agent identifiant
//     l'application, que seul le serveur peut définir ;
//   - le proxy met en cache les réponses, ce qui ménage une
//     infrastructure associative gratuite.
// Le proxy renvoie le JSON brut d'OFF : la normalisation reste ici.
//
// ⚠️ Convention de données OFF : les champs `X_100g` sont TOUJOURS
// exprimés en GRAMMES, quelle que soit la vitamine ou le minéral
// (le calcium de l'emmental vaut `0.97`, soit 970 mg). On convertit
// donc vers l'unité canonique de l'application à l'ingestion.
//
// Licence : les données OFF sont sous ODbL — attribution obligatoire,
// affichée dans l'interface (voir FOOD_SOURCE_LABELS).
// ============================================================

import { FoodItem, NutrientKey, NutrientVector, ServingSize } from '@/types/nutrition';

/** Points d'entrée du proxy applicatif. */
const OFF_SEARCH_ENDPOINT = '/api/nutrition/off-search';
const OFF_PRODUCT_ENDPOINT = '/api/nutrition/off-product';

const DEFAULT_TIMEOUT_MS = 15000;

/**
 * Correspondance nutriments OFF → clés canoniques.
 * `factor` convertit la valeur OFF (en grammes) vers l'unité canonique.
 */
const OFF_NUTRIENT_MAP: Record<string, { key: NutrientKey; factor: number }> = {
    // Énergie — seul champ déjà exprimé en kcal
    'energy-kcal': { key: 'energy', factor: 1 },

    // Macros (grammes)
    proteins: { key: 'protein', factor: 1 },
    carbohydrates: { key: 'carbs', factor: 1 },
    fat: { key: 'fat', factor: 1 },
    fiber: { key: 'fiber', factor: 1 },
    sugars: { key: 'sugars', factor: 1 },
    'added-sugars': { key: 'addedSugars', factor: 1 },

    // Lipides détaillés (grammes)
    'saturated-fat': { key: 'saturatedFat', factor: 1 },
    'monounsaturated-fat': { key: 'monounsaturatedFat', factor: 1 },
    'polyunsaturated-fat': { key: 'polyunsaturatedFat', factor: 1 },
    'trans-fat': { key: 'transFat', factor: 1 },
    'omega-3-fat': { key: 'omega3', factor: 1 },
    'omega-6-fat': { key: 'omega6', factor: 1 },
    cholesterol: { key: 'cholesterol', factor: 1000 },        // g → mg

    // Minéraux — grammes → mg
    sodium: { key: 'sodium', factor: 1000 },
    potassium: { key: 'potassium', factor: 1000 },
    calcium: { key: 'calcium', factor: 1000 },
    iron: { key: 'iron', factor: 1000 },
    magnesium: { key: 'magnesium', factor: 1000 },
    phosphorus: { key: 'phosphorus', factor: 1000 },
    zinc: { key: 'zinc', factor: 1000 },
    copper: { key: 'copper', factor: 1000 },
    manganese: { key: 'manganese', factor: 1000 },

    // Minéraux — grammes → µg
    selenium: { key: 'selenium', factor: 1_000_000 },
    iodine: { key: 'iodine', factor: 1_000_000 },

    // Vitamines — grammes → mg
    'vitamin-c': { key: 'vitaminC', factor: 1000 },
    'vitamin-e': { key: 'vitaminE', factor: 1000 },
    'vitamin-b1': { key: 'thiamin', factor: 1000 },
    'vitamin-b2': { key: 'riboflavin', factor: 1000 },
    'vitamin-pp': { key: 'niacin', factor: 1000 },
    'vitamin-b3': { key: 'niacin', factor: 1000 },            // alias selon les fiches
    'pantothenic-acid': { key: 'pantothenicAcid', factor: 1000 },
    'vitamin-b6': { key: 'vitaminB6', factor: 1000 },
    choline: { key: 'choline', factor: 1000 },

    // Vitamines — grammes → µg
    'vitamin-a': { key: 'vitaminA', factor: 1_000_000 },
    'vitamin-d': { key: 'vitaminD', factor: 1_000_000 },
    'vitamin-k': { key: 'vitaminK', factor: 1_000_000 },
    biotin: { key: 'biotin', factor: 1_000_000 },
    folate: { key: 'folate', factor: 1_000_000 },
    'vitamin-b9': { key: 'folate', factor: 1_000_000 },       // alias
    'vitamin-b12': { key: 'vitaminB12', factor: 1_000_000 },

    // Divers
    water: { key: 'water', factor: 1 },
    caffeine: { key: 'caffeine', factor: 1000 },
    alcohol: { key: 'alcohol', factor: 1 },
};

/** Convertit l'objet `nutriments` d'OFF en vecteur canonique pour 100 g. */
export function mapOffNutriments(nutriments: Record<string, any> | undefined): NutrientVector {
    const out: NutrientVector = {};
    if (!nutriments) return out;

    Object.entries(OFF_NUTRIENT_MAP).forEach(([offKey, { key, factor }]) => {
        const raw = nutriments[`${offKey}_100g`] ?? nutriments[offKey];
        const value = typeof raw === 'string' ? Number.parseFloat(raw) : raw;
        if (typeof value === 'number' && Number.isFinite(value)) {
            // Plusieurs clés OFF peuvent viser le même nutriment (alias B3/B9) :
            // on garde la première valeur rencontrée, non nulle.
            if (out[key] === undefined || (out[key] === 0 && value !== 0)) {
                out[key] = value * factor;
            }
        }
    });

    // Le sel est souvent renseigné quand le sodium manque (sodium = sel / 2,5).
    if (out.sodium === undefined) {
        const salt = nutriments.salt_100g ?? nutriments.salt;
        const saltValue = typeof salt === 'string' ? Number.parseFloat(salt) : salt;
        if (typeof saltValue === 'number' && Number.isFinite(saltValue) && saltValue > 0) {
            out.sodium = (saltValue / 2.5) * 1000;
        }
    }

    // Énergie : repli sur les kJ, puis calcul d'Atwater depuis les macros.
    if (out.energy === undefined) {
        const kj = nutriments['energy-kj_100g'] ?? nutriments.energy_100g ?? nutriments.energy;
        const kjValue = typeof kj === 'string' ? Number.parseFloat(kj) : kj;
        if (typeof kjValue === 'number' && Number.isFinite(kjValue) && kjValue > 0) {
            out.energy = kjValue / 4.184;
        } else if (out.protein !== undefined && out.carbs !== undefined && out.fat !== undefined) {
            // Facteurs d'Atwater généraux (4/4/9), + 7 kcal/g pour l'alcool.
            out.energy = out.protein * 4 + out.carbs * 4 + out.fat * 9 + (out.alcohol ?? 0) * 7;
        }
    }

    return out;
}

/** Extrait un poids en grammes depuis un libellé OFF libre (« 125 g », « 33 cl »). */
export function parseOffQuantity(raw: unknown): number | undefined {
    if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) return raw;
    if (typeof raw !== 'string') return undefined;
    const match = raw.replace(',', '.').match(/([\d.]+)\s*(kg|g|cl|ml|l)?/i);
    if (!match) return undefined;
    const value = Number.parseFloat(match[1]);
    if (!Number.isFinite(value) || value <= 0) return undefined;
    const unit = (match[2] ?? 'g').toLowerCase();
    if (unit === 'kg') return value * 1000;
    if (unit === 'l') return value * 1000;
    if (unit === 'cl') return value * 10;
    return value; // g et ml sont équivalents (densité 1 par convention)
}

function buildServings(servingQuantity: unknown, servingSize: unknown, basis: 'g' | 'ml'): ServingSize[] {
    const servings: ServingSize[] = [];
    const grams = parseOffQuantity(servingQuantity);
    if (grams && grams >= 1 && grams <= 2000) {
        const label = typeof servingSize === 'string' && servingSize.trim() ? servingSize.trim() : '1 portion';
        servings.push({ label, grams: Math.round(grams) });
    }
    // Portions génériques, toujours proposées en complément.
    if (basis === 'ml') {
        servings.push({ label: '1 verre (200 ml)', grams: 200 });
        servings.push({ label: '1 canette (330 ml)', grams: 330 });
    } else {
        servings.push({ label: '1 portion (100 g)', grams: 100 });
    }
    return servings;
}

function pickString(value: unknown): string | undefined {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (Array.isArray(value)) {
        const first = value.find((v) => typeof v === 'string' && v.trim());
        return typeof first === 'string' ? first.trim() : undefined;
    }
    return undefined;
}

interface OffSearchHit {
    code?: string;
    product_name?: string;
    brands?: unknown;
    nutriments?: Record<string, any>;
    quantity?: string;
    serving_size?: unknown;
    serving_quantity?: unknown;
    image_url?: string;
    nutriscore_grade?: string;
    nova_group?: number;
    categories_tags?: string[];
}

/** Transforme un résultat OFF en `FoodItem` normalisé. Renvoie null si inexploitable. */
export function mapOffProduct(hit: OffSearchHit): FoodItem | null {
    const code = pickString(hit.code);
    const name = pickString(hit.product_name);
    if (!code || !name) return null;

    const per100g = mapOffNutriments(hit.nutriments);
    // Sans calories ni macros, la fiche n'apporte rien au suivi.
    if (per100g.energy === undefined && per100g.protein === undefined) return null;

    const categoryLabel = hit.categories_tags?.[0]?.replace(/^[a-z]{2}:/, '').replace(/-/g, ' ');
    const servings = buildServings(hit.serving_quantity, hit.serving_size, 'g');

    return {
        id: `off:${code}`,
        source: 'off',
        sourceId: code,
        name,
        brand: pickString(hit.brands),
        barcode: code,
        per100g,
        basis: 'g',
        servingSizes: servings,
        imageUrl: pickString(hit.image_url),
        categories: categoryLabel ? [categoryLabel] : undefined,
        nutriscore: pickString(hit.nutriscore_grade)?.toLowerCase(),
        novaGroup: typeof hit.nova_group === 'number' ? hit.nova_group : undefined,
    };
}

async function fetchWithTimeout(url: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
        });
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Recherche plein texte dans Open Food Facts, via le proxy applicatif.
 * Limité volontairement (1 recherche = 1 action utilisateur) conformément
 * aux conditions d'usage d'OFF, qui interdisent le moissonnage.
 */
export async function searchOpenFoodFacts(query: string, limit = 12): Promise<FoodItem[]> {
    const trimmed = query.trim();
    if (trimmed.length < 2) return [];

    const params = new URLSearchParams({
        q: trimmed,
        limit: String(Math.min(Math.max(limit, 1), 25)),
    });

    const response = await fetchWithTimeout(`${OFF_SEARCH_ENDPOINT}?${params.toString()}`);
    if (!response.ok) throw new Error(`Open Food Facts a répondu ${response.status}`);

    const data = await response.json();
    // Search-a-licious renvoie ses résultats dans `hits`.
    const hits: OffSearchHit[] = Array.isArray(data?.hits) ? data.hits : [];

    return hits
        .map(mapOffProduct)
        .filter((item): item is FoodItem => item !== null);
}

/** Récupère une fiche produit par code-barres. Renvoie null si le produit est inconnu. */
export async function getOpenFoodFactsProduct(barcode: string): Promise<FoodItem | null> {
    const code = barcode.replace(/\D/g, '');
    if (code.length < 6) return null;

    const params = new URLSearchParams({ code });
    const response = await fetchWithTimeout(`${OFF_PRODUCT_ENDPOINT}?${params.toString()}`);

    // 404 = produit absent de la base, ce n'est pas une erreur technique.
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Open Food Facts a répondu ${response.status}`);

    const data = await response.json();
    if (!data || data.status === 0 || !data.product) return null;
    return mapOffProduct({ code, ...data.product });
}
