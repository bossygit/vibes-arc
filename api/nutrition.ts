/**
 * GET /api/nutrition?op=status|search|off-search|off-product
 *
 * Route unique consolidée : la limite Vercel Hobby (12 Serverless Functions
 * par déploiement) était dépassée (16 fonctions) depuis l'ajout du module
 * nutrition (2026-09-22), ce qui faisait échouer TOUS les déploiements.
 * Les quatre routes d'origine sont fusionnées ici, sélectionnées par `op` :
 *   - status      : sources configurées (aucune clé exposée)
 *   - search      : recherche USDA FoodData Central (clé côté serveur)
 *   - off-search  : recherche plein texte Open Food Facts (proxy CORS)
 *   - off-product : fiche produit OFF par code-barres
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUsdaApiKey, searchUsdaFoods } from './nutrition/_usda';
import { handleOffSearch, handleOffProduct } from './nutrition/_off';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const op = typeof req.query.op === 'string' ? req.query.op : 'status';

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
}
