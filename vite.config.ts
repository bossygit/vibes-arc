import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { handleOffSearch, handleOffProduct } from './api/nutrition/_off'
import { getUsdaApiKey, searchUsdaFoods } from './api/nutrition/_usda'

/**
 * Émule les fonctions serverless du module Nutrition pendant `vite dev`.
 *
 * Sans ce middleware, `npm run dev` renverrait 404 sur /api/nutrition/* et
 * l'application perdrait Open Food Facts et USDA — c'est-à-dire l'essentiel
 * de sa valeur. Les helpers api/nutrition/_off.ts et _usda.ts sont utilisés par
 * ce middleware ET par la fonction de production api/nutrition.ts — laquelle
 * les INLINE (contrainte Vercel Hobby : les imports relatifs `_*.ts` ne sont
 * pas embarqués dans les fonctions). Toute modification métier des helpers
 * doit donc être répercutée dans api/nutrition.ts (copie inlinée).
 */
function nutritionApiPlugin(mode: string): Plugin {
  // Charge aussi les variables non préfixées VITE_ (clé USDA, côté serveur).
  const env = loadEnv(mode, process.cwd(), '')
  if (env.USDA_API_KEY && !process.env.USDA_API_KEY) {
    process.env.USDA_API_KEY = env.USDA_API_KEY
  }

  return {
    name: 'vibes-arc:nutrition-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        if (url.pathname !== '/api/nutrition' && !url.pathname.startsWith('/api/nutrition/')) return next()

        // Nouveau format : /api/nutrition?op=… — l'ancien /api/nutrition/<op> reste accepté.
        const op = url.pathname === '/api/nutrition'
          ? (url.searchParams.get('op') ?? 'status')
          : url.pathname.replace('/api/nutrition/', '')

        const send = (status: number, body: unknown) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(body))
        }

        try {
          switch (op) {
            case 'off-search': {
              const { status, body } = await handleOffSearch(
                url.searchParams.get('q') ?? '',
                Number(url.searchParams.get('limit') ?? 12),
              )
              send(status, body)
              return
            }

            case 'off-product': {
              const { status, body } = await handleOffProduct(url.searchParams.get('code') ?? '')
              send(status, body)
              return
            }

            case 'search': {
              // USDA : mêmes règles qu'en production, la clé reste côté serveur.
              const usdaConfigured = !!getUsdaApiKey()
              const query = (url.searchParams.get('q') ?? '').trim()
              if (!usdaConfigured) {
                send(200, {
                  foods: [],
                  usdaConfigured: false,
                  error: 'USDA_API_KEY non configurée sur le serveur',
                })
                return
              }
              if (query.length < 2) {
                send(200, { foods: [], usdaConfigured: true })
                return
              }
              try {
                const foods = await searchUsdaFoods(query, Number(url.searchParams.get('limit') ?? 10))
                send(200, { foods, usdaConfigured: true })
              } catch (error) {
                send(200, {
                  foods: [],
                  usdaConfigured: true,
                  error: error instanceof Error ? error.message : 'Erreur USDA inconnue',
                })
              }
              return
            }

            case 'status': {
              send(200, { openFoodFacts: true, usda: !!getUsdaApiKey() })
              return
            }

            default:
              // Comme en production : op inconnue → 400 (sinon Vite servirait le fichier source).
              send(400, { error: `op inconnue: ${op}` })
              return
          }
        } catch (error) {
          send(502, { error: error instanceof Error ? error.message : 'Erreur inconnue' })
        }
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), nutritionApiPlugin(mode)],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Désactivé pour la production
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['lucide-react'],
          utils: ['date-fns', 'clsx', 'tailwind-merge']
        }
      }
    }
  },
  define: {
    // Variables d'environnement pour le build
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
}))
