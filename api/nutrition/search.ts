/**
 * GET /api/nutrition/search?q=...&limit=...
 *
 * Recherche dans USDA FoodData Central. Passe par le serveur pour que la
 * clé API ne soit jamais exposée au navigateur.
 *
 * Open Food Facts n'est PAS proxifié ici : son API est ouverte (CORS `*`)
 * et le navigateur l'interroge directement, ce qui permet à la recherche
 * de fonctionner même sans déploiement serverless.
 *
 * Réponse : { foods: FoodItem[], usdaConfigured: boolean, error?: string }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUsdaApiKey, searchUsdaFoods } from './_usda';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Réponse toujours explorable côté client, y compris en cas d'échec.
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  const usdaConfigured = !!getUsdaApiKey();

  if (req.method !== 'GET') {
    res.status(405).json({ foods: [], usdaConfigured, error: 'Méthode non autorisée' });
    return;
  }

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
}
