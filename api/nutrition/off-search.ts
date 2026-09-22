/**
 * GET /api/nutrition/off-search?q=...&limit=...
 *
 * Relaie la recherche plein texte vers Open Food Facts.
 * Le navigateur ne peut pas appeler `search.openfoodfacts.org` directement
 * (aucun en-tête CORS) — voir api/nutrition/_off.ts.
 *
 * La réponse est le JSON brut d'OFF, mis en cache au niveau du CDN.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleOffSearch } from './_off';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Méthode non autorisée' });
    return;
  }

  const query = typeof req.query.q === 'string' ? req.query.q : '';
  const limitRaw = typeof req.query.limit === 'string' ? Number.parseInt(req.query.limit, 10) : 12;

  // Les recherches identiques sont fréquentes : on laisse le CDN répondre.
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1800');

  try {
    const { status, body } = await handleOffSearch(query, limitRaw);
    res.status(status).json(body);
  } catch (error) {
    res.status(502).json({
      error: error instanceof Error ? error.message : 'Open Food Facts injoignable',
    });
  }
}
