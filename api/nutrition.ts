/**
 * GET /api/nutrition?op=status|search|off-search|off-product
 *
 * ⚠️ FONCTION AUTO-CONTENUE — ne JAMAIS importer de fichier relatif `_*.ts`
 * depuis ici : sur Vercel Hobby ces fichiers ne sont pas embarqués dans la
 * fonction → FUNCTION_INVOCATION_FAILED au runtime. Vécu le 2026-10-09 avec
 * les helpers api/nutrition/_off.ts et _usda.ts, désormais inlinés ci-dessous.
 * Même pattern que api/chat.ts et api/widgets/v2.ts (tout inliner).
 *
 * Route unique consolidée : la limite Vercel Hobby (12 Serverless Functions
 * max par déploiement) ne permet pas 4 routes séparées. Opérations :
 *   - status      : sources configurées (aucune clé exposée)
 *   - search      : recherche USDA FoodData Central (clé côté serveur)
 *   - off-search  : recherche plein texte Open Food Facts (proxy CORS + UA)
 *   - off-product : fiche produit OFF par code-barres
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// ─── Open Food Facts (inliné depuis l'ancien _off.ts) ───────────────────────

/** En-tête demandé par les conditions d'usage d'Open Food Facts. */
const OFF_USER_AGENT = 'VibesArc/1.0 (suivi nutritionnel personnel)';
const OFF_SEARCH_URL = 'https://search.openfoodfacts.org/search';
const OFF_PRODUCT_URL = 'https://world.openfoodfacts.org/api/v2/product';

/** Champs demandés — limite le poids des réponses. */
const OFF_FIELDS = [
    'code', 'product_name', 'brands', 'nutriments', 'quantity',
    'serving_size', 'serving_quantity', 'image_url', 'nutriscore_grade',
    'nova_group', 'categories_tags',
].join(',');

interface ProxyResult {
    status: number;
    body: unknown;
}

function buildOffSearchUrl(query: string, limit: number): string {
    const clamped = Math.min(Math.max(Math.trunc(limit) || 12, 1), 25);
    const params = new URLSearchParams({
        q: query,
        page_size: String(clamped),
        fields: OFF_FIELDS,
    });
    return `${OFF_SEARCH_URL}?${params.toString()}`;
}

function buildOffProductUrl(code: string): string {
    return `${OFF_PRODUCT_URL}/${code}.json?fields=${OFF_FIELDS}`;
}

/** Relaie une requête vers OFF en appliquant l'en-tête applicatif. */
async function proxyOff(url: string): Promise<ProxyResult> {
    const response = await fetch(url, {
        headers: {
            'User-Agent': OFF_USER_AGENT,
            Accept: 'application/json',
        },
    });

    if (!response.ok) {
        return {
            status: response.status === 404 ? 404 : 502,
            body: { error: `Open Food Facts a répondu ${response.status}` },
        };
    }

    return { status: 200, body: await response.json() };
}

/** Recherche plein texte. Renvoie le JSON brut de Search-a-licious. */
async function handleOffSearch(query: string, limit: number): Promise<ProxyResult> {
    const trimmed = (query ?? '').trim();
    if (trimmed.length < 2) {
        return { status: 200, body: { hits: [], count: 0 } };
    }
    return proxyOff(buildOffSearchUrl(trimmed, limit));
}

/** Fiche produit par code-barres. Renvoie le JSON brut de l'API v2. */
async function handleOffProduct(code: string): Promise<ProxyResult> {
    const digits = (code ?? '').replace(/\D/g, '');
    if (digits.length < 6 || digits.length > 14) {
        return { status: 400, body: { error: 'Code-barres invalide' } };
    }
    return proxyOff(buildOffProductUrl(digits));
}

// ─── USDA FoodData Central (inliné depuis l'ancien _usda.ts) ────────────────

const FDC_BASE = 'https://api.nal.usda.gov/fdc/v1';

/** Types de données privilégiés : aliments génériques, pas de marques. */
const DEFAULT_DATA_TYPES = 'Foundation,SR Legacy';

interface UsdaNutrient {
    nutrient?: { number?: string; name?: string; unitName?: string };
    nutrientNumber?: string;
    nutrientName?: string;
    unitName?: string;
    amount?: number;
    value?: number;
}

interface UsdaFood {
    fdcId: number;
    description?: string;
    dataType?: string;
    brandOwner?: string;
    brandName?: string;
    gtinUpc?: string;
    foodCategory?: string;
    foodNutrients?: UsdaNutrient[];
    foodPortions?: { measureUnit?: { name?: string }; modifier?: string; gramWeight?: number }[];
}

/** Nutriment canonique visé + unité canonique associée. */
interface CanonicalTarget {
    key: string;
    unit: 'kcal' | 'g' | 'mg' | 'ug';
}

/** Numéro de nutriment USDA → clé canonique de l'application. */
const USDA_NUTRIENT_MAP: Record<string, CanonicalTarget> = {
    '208': { key: 'energy', unit: 'kcal' },
    '203': { key: 'protein', unit: 'g' },
    '205': { key: 'carbs', unit: 'g' },
    '204': { key: 'fat', unit: 'g' },
    '291': { key: 'fiber', unit: 'g' },
    '269': { key: 'sugars', unit: 'g' },
    '539': { key: 'sugars', unit: 'g' },
    '606': { key: 'saturatedFat', unit: 'g' },
    '645': { key: 'monounsaturatedFat', unit: 'g' },
    '646': { key: 'polyunsaturatedFat', unit: 'g' },
    '605': { key: 'transFat', unit: 'g' },
    '601': { key: 'cholesterol', unit: 'mg' },
    '307': { key: 'sodium', unit: 'mg' },
    '306': { key: 'potassium', unit: 'mg' },
    '301': { key: 'calcium', unit: 'mg' },
    '303': { key: 'iron', unit: 'mg' },
    '304': { key: 'magnesium', unit: 'mg' },
    '305': { key: 'phosphorus', unit: 'mg' },
    '309': { key: 'zinc', unit: 'mg' },
    '312': { key: 'copper', unit: 'mg' },
    '315': { key: 'manganese', unit: 'mg' },
    '317': { key: 'selenium', unit: 'ug' },
    '320': { key: 'vitaminA', unit: 'ug' },
    '401': { key: 'vitaminC', unit: 'mg' },
    '328': { key: 'vitaminD', unit: 'ug' },
    '323': { key: 'vitaminE', unit: 'mg' },
    '430': { key: 'vitaminK', unit: 'ug' },
    '404': { key: 'thiamin', unit: 'mg' },
    '405': { key: 'riboflavin', unit: 'mg' },
    '406': { key: 'niacin', unit: 'mg' },
    '410': { key: 'pantothenicAcid', unit: 'mg' },
    '415': { key: 'vitaminB6', unit: 'mg' },
    '417': { key: 'folate', unit: 'ug' },
    '418': { key: 'vitaminB12', unit: 'ug' },
    '421': { key: 'choline', unit: 'mg' },
    '255': { key: 'water', unit: 'g' },
    '262': { key: 'caffeine', unit: 'mg' },
    '221': { key: 'alcohol', unit: 'g' },
};

/** Facteur de conversion vers l'unité canonique, en passant par les grammes. */
const MASS_TO_GRAMS: Record<string, number> = { G: 1, MG: 1e-3, UG: 1e-6 };
const GRAMS_TO_TARGET: Record<CanonicalTarget['unit'], number> = { g: 1, mg: 1e3, ug: 1e6, kcal: 1 };

/**
 * Convertit une valeur USDA vers l'unité canonique de l'application.
 * On passe systématiquement par les grammes, ce qui évite les erreurs
 * classiques (USDA exprime le calcium en mg et le sélénium en µg).
 */
function convert(value: number, fromUnit: string | undefined, toUnit: CanonicalTarget['unit']): number | undefined {
    if (!Number.isFinite(value)) return undefined;

    if (toUnit === 'kcal') {
        const unit = (fromUnit ?? '').toUpperCase();
        if (unit === 'KJ') return value / 4.184;
        return value; // KCAL
    }

    const unit = (fromUnit ?? '').toUpperCase();
    const toGrams = MASS_TO_GRAMS[unit];
    if (toGrams === undefined) return undefined;
    return value * toGrams * GRAMS_TO_TARGET[toUnit];
}

/** Normalise la liste de nutriments USDA (deux formes possibles selon l'endpoint). */
function mapUsdaNutrients(foodNutrients: UsdaNutrient[] | undefined): Record<string, number> {
    const out: Record<string, number> = {};
    if (!Array.isArray(foodNutrients)) return out;

    foodNutrients.forEach((entry) => {
        const number = entry.nutrient?.number ?? entry.nutrientNumber;
        if (!number) return;
        const target = USDA_NUTRIENT_MAP[String(number)];
        if (!target) return;

        const raw = entry.amount ?? entry.value;
        if (typeof raw !== 'number') return;

        const unit = entry.nutrient?.unitName ?? entry.unitName;
        const converted = convert(raw, unit, target.unit);
        if (converted === undefined) return;

        // Un nutriment peut apparaître plusieurs fois (formes 269/539) :
        // on privilégie la première valeur non nulle.
        if (out[target.key] === undefined || (out[target.key] === 0 && converted !== 0)) {
            out[target.key] = converted;
        }
    });

    return out;
}

/** Formate « bananas, raw » → « Bananas, raw » (on garde la casse USDA, plus lisible en liste). */
function cleanDescription(raw: string | undefined): string {
    if (!raw) return 'Aliment USDA';
    const trimmed = raw.trim();
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

interface NormalizedFood {
    id: string;
    source: 'usda';
    sourceId: string;
    name: string;
    brand?: string;
    barcode?: string;
    per100g: Record<string, number>;
    basis: 'g';
    servingSizes: { label: string; grams: number }[];
    categories?: string[];
    dataType?: string;
}

/** Transforme un aliment USDA en `FoodItem` normalisé. */
function mapUsdaFood(food: UsdaFood): NormalizedFood | null {
    if (!food || !food.fdcId) return null;

    const per100g = mapUsdaNutrients(food.foodNutrients);
    if (per100g.energy === undefined && per100g.protein === undefined) return null;

    const servings: { label: string; grams: number }[] = [];
    (food.foodPortions ?? []).slice(0, 4).forEach((portion) => {
        const grams = portion.gramWeight;
        if (typeof grams === 'number' && grams >= 1 && grams <= 2000) {
            const unit = portion.measureUnit?.name;
            const modifier = portion.modifier;
            const label = [modifier, unit].filter(Boolean).join(' ') || '1 portion';
            if (!servings.some((s) => s.grams === Math.round(grams))) {
                servings.push({ label: label.charAt(0).toUpperCase() + label.slice(1), grams: Math.round(grams) });
            }
        }
    });
    servings.push({ label: '1 portion (100 g)', grams: 100 });

    return {
        id: `usda:${food.fdcId}`,
        source: 'usda',
        sourceId: String(food.fdcId),
        name: cleanDescription(food.description),
        brand: food.brandName ?? food.brandOwner,
        barcode: food.gtinUpc,
        per100g,
        basis: 'g',
        servingSizes: servings,
        categories: food.foodCategory ? [food.foodCategory] : undefined,
        dataType: food.dataType,
    };
}

function getUsdaApiKey(): string | undefined {
    const key = process.env.USDA_API_KEY ?? process.env.FDC_API_KEY;
    return key && key.trim() ? key.trim() : undefined;
}

/**
 * Recherche dans FoodData Central.
 * Lève une erreur explicite si la clé est absente, pour que l'appelant
 * puisse dégrader proprement (OFF reste disponible).
 */
async function searchUsdaFoods(query: string, limit = 10): Promise<NormalizedFood[]> {
    const apiKey = getUsdaApiKey();
    if (!apiKey) throw new Error('USDA_API_KEY non configurée');

    const params = new URLSearchParams({
        api_key: apiKey,
        query,
        pageSize: String(Math.min(Math.max(limit, 1), 25)),
        dataType: DEFAULT_DATA_TYPES,
    });

    const response = await fetch(`${FDC_BASE}/foods/search?${params.toString()}`, {
        headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
        throw new Error(`USDA FoodData Central a répondu ${response.status}`);
    }

    const data = (await response.json()) as { foods?: UsdaFood[] };
    return (data.foods ?? [])
        .map(mapUsdaFood)
        .filter((item): item is NormalizedFood => item !== null);
}

// ─── Handler ────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const op = typeof req.query.op === 'string' ? req.query.op : 'status';

    try {
        if (req.method !== 'GET') {
            res.status(405).json({ error: 'Méthode non autorisée' });
            return;
        }

        if (op === 'status') {
            // Aucune clé n'est renvoyée — seulement un booléen de disponibilité.
            res.setHeader('Cache-Control', 'no-store');
            res.status(200).json({
                openFoodFacts: true,
                usda: !!getUsdaApiKey(),
            });
            return;
        }

        if (op === 'search') {
            // Réponse toujours explorable côté client, y compris en cas d'échec.
            res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

            const usdaConfigured = !!getUsdaApiKey();
            const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
            const limitRaw = typeof req.query.limit === 'string' ? Number.parseInt(req.query.limit, 10) : 10;
            const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 25) : 10;

            if (query.length < 2) {
                res.status(200).json({ foods: [], usdaConfigured });
                return;
            }

            if (!usdaConfigured) {
                // Pas d'erreur : l'application continue avec Open Food Facts + base locale.
                res.status(200).json({
                    foods: [],
                    usdaConfigured: false,
                    error: 'USDA_API_KEY non configurée sur le serveur',
                });
                return;
            }

            try {
                const foods = await searchUsdaFoods(query, limit);
                res.status(200).json({ foods, usdaConfigured: true });
            } catch (error) {
                res.status(200).json({
                    foods: [],
                    usdaConfigured: true,
                    error: error instanceof Error ? error.message : 'Erreur USDA inconnue',
                });
            }
            return;
        }

        if (op === 'off-search') {
            // Les recherches identiques sont fréquentes : on laisse le CDN répondre.
            res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1800');

            const query = typeof req.query.q === 'string' ? req.query.q : '';
            const limitRaw = typeof req.query.limit === 'string' ? Number.parseInt(req.query.limit, 10) : 12;

            try {
                const { status, body } = await handleOffSearch(query, limitRaw);
                res.status(status).json(body);
            } catch (error) {
                res.status(502).json({
                    error: error instanceof Error ? error.message : 'Open Food Facts injoignable',
                });
            }
            return;
        }

        if (op === 'off-product') {
            // Une fiche produit change rarement : cache long.
            res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');

            const code = typeof req.query.code === 'string' ? req.query.code : '';

            try {
                const { status, body } = await handleOffProduct(code);
                res.status(status).json(body);
            } catch (error) {
                res.status(502).json({
                    error: error instanceof Error ? error.message : 'Open Food Facts injoignable',
                });
            }
            return;
        }

        res.status(400).json({ error: `op inconnue: ${op}` });
    } catch (error) {
        // Garde-fou : sans accès aux logs Vercel, renvoyer l'erreur en clair.
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Erreur serveur inconnue',
            op,
        });
    }
}
