/**
 * Proxy Open Food Facts — logique partagée.
 *
 * POURQUOI UN PROXY
 * 1. `search.openfoodfacts.org` (Search-a-licious) ne renvoie AUCUN en-tête
 *    CORS : le navigateur ne peut pas l'appeler directement.
 * 2. Les conditions d'usage d'OFF demandent un User-Agent identifiant
 *    l'application — impossible à définir depuis un navigateur.
 * 3. Le proxy permet de mettre la réponse en cache côté CDN, ce qui réduit
 *    la charge sur une infrastructure associative gratuite.
 *
 * Le proxy ne fait AUCUNE transformation : il relaie le JSON brut d'OFF,
 * que le client normalise lui-même. La logique métier reste donc à un seul
 * endroit.
 *
 * Ce module n'a aucune dépendance : il est utilisé à la fois par les
 * fonctions serverless Vercel et par le middleware du serveur de dev Vite.
 */

/** En-tête demandé par les conditions d'usage d'Open Food Facts. */
export const OFF_USER_AGENT = 'VibesArc/1.0 (suivi nutritionnel personnel)';

const OFF_SEARCH_URL = 'https://search.openfoodfacts.org/search';
const OFF_PRODUCT_URL = 'https://world.openfoodfacts.org/api/v2/product';

/** Champs demandés — limite le poids des réponses. */
export const OFF_FIELDS = [
  'code', 'product_name', 'brands', 'nutriments', 'quantity',
  'serving_size', 'serving_quantity', 'image_url', 'nutriscore_grade',
  'nova_group', 'categories_tags',
].join(',');

export interface ProxyResult {
  status: number;
  body: unknown;
}

export function buildOffSearchUrl(query: string, limit: number): string {
  const clamped = Math.min(Math.max(Math.trunc(limit) || 12, 1), 25);
  const params = new URLSearchParams({
    q: query,
    page_size: String(clamped),
    fields: OFF_FIELDS,
  });
  return `${OFF_SEARCH_URL}?${params.toString()}`;
}

export function buildOffProductUrl(code: string): string {
  return `${OFF_PRODUCT_URL}/${code}.json?fields=${OFF_FIELDS}`;
}

/** Relaie une requête vers OFF en appliquant l'en-tête applicatif. */
async function proxy(url: string): Promise<ProxyResult> {
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
export async function handleOffSearch(query: string, limit: number): Promise<ProxyResult> {
  const trimmed = (query ?? '').trim();
  if (trimmed.length < 2) {
    return { status: 200, body: { hits: [], count: 0 } };
  }
  return proxy(buildOffSearchUrl(trimmed, limit));
}

/** Fiche produit par code-barres. Renvoie le JSON brut de l'API v2. */
export async function handleOffProduct(code: string): Promise<ProxyResult> {
  const digits = (code ?? '').replace(/\D/g, '');
  if (digits.length < 6 || digits.length > 14) {
    return { status: 400, body: { error: 'Code-barres invalide' } };
  }
  return proxy(buildOffProductUrl(digits));
}
