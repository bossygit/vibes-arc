// ============================================================
// Recherche d'aliments — orchestration multi-sources
//
// Trois sources sont interrogées et fusionnées :
//   1. `local`  → base vibes-arc, instantanée, toujours disponible
//   2. `off`    → Open Food Facts, produits emballés et marques (CORS ouvert)
//   3. `usda`   → USDA FoodData Central via /api/nutrition/search (clé côté serveur)
//
// La recherche locale s'affiche immédiatement ; les sources distantes
// enrichissent ensuite la liste. Une source indisponible ne fait jamais
// échouer la recherche : elle produit un avertissement.
// ============================================================

import { FoodItem, FoodSource, NutrientKey } from '@/types/nutrition';
import { COMMON_FOODS } from '@/data/commonFoods';
import { searchOpenFoodFacts, getOpenFoodFactsProduct } from './openFoodFacts';

/** Retire les accents et la casse pour comparer « Crème » et « creme ». */
export function normalizeText(input: string): string {
    return input
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s'-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function tokens(input: string): string[] {
    return normalizeText(input).split(' ').filter((t) => t.length >= 2);
}

/**
 * Score de pertinence d'un aliment pour une requête.
 * Les correspondances en début de nom et les sources de référence
 * (base locale, USDA) sont privilégiées.
 */
export function relevanceScore(food: FoodItem, query: string): number {
    const q = normalizeText(query);
    if (!q) return 0;

    const name = normalizeText(food.name);
    const brand = normalizeText(food.brand ?? '');
    const haystack = `${name} ${brand}`;

    let score = 0;
    if (name === q) score += 200;
    if (name.startsWith(q)) score += 120;
    if (name.includes(q)) score += 60;
    if (brand.includes(q)) score += 30;

    const queryTokens = tokens(query);
    const matched = queryTokens.filter((t) => haystack.includes(t)).length;
    if (queryTokens.length > 0) {
        // Tous les mots doivent apparaître, sinon la correspondance est faible.
        score += (matched / queryTokens.length) * 50;
        if (matched < queryTokens.length) score -= 40;
    }

    // Qualité de la fiche : une fiche sans énergie n'aide pas l'utilisateur.
    if (food.per100g.energy !== undefined) score += 8;
    const microCount = (Object.keys(food.per100g) as NutrientKey[]).length;
    score += Math.min(microCount, 20) * 0.6;

    // Priors par source : données de référence > produit de marque.
    if (food.source === 'local') score += 14;
    else if (food.source === 'usda') score += 10;
    else if (food.source === 'custom') score += 6;

    // Un nom très long est souvent un libellé de fiche peu lisible.
    if (name.length > 70) score -= 15;

    return score;
}

/** Recherche instantanée dans la base locale. */
export function searchLocalFoods(query: string, limit = 8): FoodItem[] {
    const q = normalizeText(query);
    if (q.length < 2) return [];

    return COMMON_FOODS
        .map((food) => ({ food, score: relevanceScore(food, query) }))
        .filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((r) => r.food);
}

/** Aliments locaux d'une catégorie (navigation sans saisie). */
export function getLocalFoodsByCategory(categoryLabel: string): FoodItem[] {
    return COMMON_FOODS.filter((food) => food.categories?.includes(categoryLabel));
}

// ------------------------------------------------------------
// Cache mémoire
// ------------------------------------------------------------

interface CacheEntry {
    items: FoodItem[];
    storedAt: number;
}

const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX_ENTRIES = 60;
const searchCache = new Map<string, CacheEntry>();

function readCache(key: string): FoodItem[] | null {
    const entry = searchCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.storedAt > CACHE_TTL_MS) {
        searchCache.delete(key);
        return null;
    }
    return entry.items;
}

function writeCache(key: string, items: FoodItem[]): void {
    // Éviction FIFO simple : la Map conserve l'ordre d'insertion.
    if (searchCache.size >= CACHE_MAX_ENTRIES) {
        const oldest = searchCache.keys().next().value;
        if (oldest !== undefined) searchCache.delete(oldest);
    }
    searchCache.set(key, { items, storedAt: Date.now() });
}

/** Vide le cache — utilisé par les tests et le bouton « rafraîchir ». */
export function clearFoodSearchCache(): void {
    searchCache.clear();
}

// ------------------------------------------------------------
// Déduplication et fusion
// ------------------------------------------------------------

/** Clé d'unicité : le code-barres prime, sinon nom + marque normalisés. */
function dedupeKey(food: FoodItem): string {
    if (food.barcode) return `bc:${food.barcode}`;
    return `nm:${normalizeText(food.name)}|${normalizeText(food.brand ?? '')}`;
}

/**
 * Fusionne les listes en gardant, pour chaque aliment, la fiche la plus
 * complète. La base locale gagne les égalités (valeurs de référence).
 */
function mergeAndDedupe(groups: FoodItem[][]): FoodItem[] {
    const best = new Map<string, FoodItem>();

    groups.flat().forEach((food) => {
        const key = dedupeKey(food);
        const existing = best.get(key);
        if (!existing) {
            best.set(key, food);
            return;
        }
        const existingRichness = Object.keys(existing.per100g).length;
        const candidateRichness = Object.keys(food.per100g).length;
        const existingBonus = existing.source === 'local' ? 3 : 0;
        const candidateBonus = food.source === 'local' ? 3 : 0;
        if (candidateRichness + candidateBonus > existingRichness + existingBonus) {
            best.set(key, food);
        }
    });

    return Array.from(best.values());
}

// ------------------------------------------------------------
// USDA (via le proxy serverless)
// ------------------------------------------------------------

interface UsdaProxyResponse {
    foods?: FoodItem[];
    usdaConfigured?: boolean;
    error?: string;
}

/**
 * Interroge USDA via le proxy serveur.
 * En développement avec `vite dev` (sans fonctions serverless), l'appel
 * échoue en 404 : on renvoie alors une liste vide avec un avertissement,
 * sans interrompre la recherche.
 */
async function searchUsda(query: string, limit: number): Promise<{ items: FoodItem[]; warning?: string }> {
    const params = new URLSearchParams({ q: query, limit: String(limit) });
    try {
        const response = await fetch(`/api/nutrition/search?${params.toString()}`, {
            headers: { Accept: 'application/json' },
        });

        // Pas de backend serverless disponible (vite dev seul).
        if (response.status === 404) {
            return { items: [], warning: 'USDA indisponible : fonctions serverless non démarrées.' };
        }
        if (!response.ok) {
            return { items: [], warning: `USDA indisponible (HTTP ${response.status}).` };
        }

        const data = (await response.json()) as UsdaProxyResponse;
        if (data.usdaConfigured === false) {
            return { items: [], warning: 'USDA non configurée : ajoute USDA_API_KEY côté serveur.' };
        }
        if (data.error) return { items: [], warning: data.error };

        return { items: Array.isArray(data.foods) ? data.foods : [] };
    } catch {
        return { items: [], warning: 'USDA injoignable.' };
    }
}

// ------------------------------------------------------------
// Recherche agrégée
// ------------------------------------------------------------

export interface FoodSearchResult {
    items: FoodItem[];
    warnings: string[];
    sourcesUsed: FoodSource[];
    fromCache: boolean;
}

export interface FoodSearchOptions {
    /** Nombre de résultats renvoyés au total */
    limit?: number;
    /** Nombre de résultats demandés à chaque source distante */
    perSourceLimit?: number;
}

/**
 * Recherche un aliment dans toutes les sources disponibles.
 * Renvoie toujours un résultat exploitable, même hors-ligne.
 */
export async function searchFoods(query: string, options: FoodSearchOptions = {}): Promise<FoodSearchResult> {
    const trimmed = query.trim();
    const limit = options.limit ?? 15;
    const perSourceLimit = options.perSourceLimit ?? 12;

    if (normalizeText(trimmed).length < 2) {
        return { items: [], warnings: [], sourcesUsed: [], fromCache: false };
    }

    const cacheKey = `${normalizeText(trimmed)}|${limit}|${perSourceLimit}`;
    const cached = readCache(cacheKey);
    if (cached) {
        return { items: cached, warnings: [], sourcesUsed: [], fromCache: true };
    }

    const local = searchLocalFoods(trimmed, perSourceLimit);

    // Les sources distantes sont interrogées en parallèle : une lente
    // ne doit pas retarder les autres.
    const [offOutcome, usdaOutcome] = await Promise.all([
        searchOpenFoodFacts(trimmed, perSourceLimit)
            .then((items) => ({ items, warning: undefined as string | undefined }))
            .catch((error: unknown) => ({
                items: [] as FoodItem[],
                warning: error instanceof Error ? error.message : 'Open Food Facts injoignable.',
            })),
        searchUsda(trimmed, perSourceLimit),
    ]);

    const warnings: string[] = [];
    if (offOutcome.warning) warnings.push(offOutcome.warning);
    if (usdaOutcome.warning) warnings.push(usdaOutcome.warning);

    const items = mergeAndDedupe([local, usdaOutcome.items, offOutcome.items])
        .map((food) => ({ food, score: relevanceScore(food, trimmed) }))
        .filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((r) => r.food);

    writeCache(cacheKey, items);

    const sourcesUsed: FoodSource[] = [];
    if (items.some((i) => i.source === 'local')) sourcesUsed.push('local');
    if (items.some((i) => i.source === 'off')) sourcesUsed.push('off');
    if (items.some((i) => i.source === 'usda')) sourcesUsed.push('usda');

    return { items, warnings, sourcesUsed, fromCache: false };
}

/** Récupère un produit par code-barres (Open Food Facts). */
export async function lookupBarcode(barcode: string): Promise<FoodItem | null> {
    const code = barcode.replace(/\D/g, '');
    if (code.length < 6) return null;
    try {
        return await getOpenFoodFactsProduct(code);
    } catch {
        return null;
    }
}

/** Retrouve un aliment déjà journalisé par sa source et son identifiant. */
export function findFoodById(id: string): FoodItem | undefined {
    return COMMON_FOODS.find((food) => food.id === id);
}
