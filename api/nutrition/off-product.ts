/**
 * GET /api/nutrition/off-product?code=...
 *
 * Relaie la fiche produit Open Food Facts par code-barres.
 * Passe par le serveur pour appliquer le User-Agent demandé par les
 * conditions d'usage d'OFF et pour rester sur un seul chemin de données.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleOffProduct } from './_off';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Méthode non autorisée' });
    return;
  }

  const code = typeof req.query.code === 'string' ? req.query.code : '';

  // Une fiche produit change rarement : cache long.
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');

  try {
    const { status, body } = await handleOffProduct(code);
    res.status(status).json(body);
  } catch (error) {
    res.status(502).json({
      error: error instanceof Error ? error.message : 'Open Food Facts injoignable',
    });
  }
}
