/**
 * GET /api/nutrition/status
 *
 * Indique quelles sources de données sont actives, pour l'afficher dans
 * les réglages du module Nutrition. Aucune clé n'est renvoyée — seulement
 * un booléen de disponibilité.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUsdaApiKey } from './_usda';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    openFoodFacts: true,
    usda: !!getUsdaApiKey(),
  });
}
