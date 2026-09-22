/**
 * Contrôle qualité de la base locale d'aliments.
 * Exécution : node scripts/verify-food-db.mjs
 *
 * Vérifie ce qu'un relecteur humain ne peut pas contrôler sur 1 500 lignes :
 *   - cohérence énergétique (facteurs d'Atwater 4/4/9)
 *   - vraisemblance des ordres de grandeur (détection d'erreurs d'unité g/mg/µg)
 *   - intégrité structurelle (slugs uniques, catégories valides, macros présentes)
 *
 * Une erreur d'unité (calcium saisi en grammes plutôt qu'en milligrammes)
 * est le défaut le plus fréquent et le plus silencieux : il fausse tous les
 * totaux sans jamais planter. C'est ce que ce script traque en priorité.
 */

import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const outDir = mkdtempSync(path.join(tmpdir(), 'vibes-fooddb-'));
const entryPath = path.join(outDir, 'entry.ts');
writeFileSync(entryPath, `export * from '@/data/localFoodSeeds';`);

await build({
    entryPoints: [entryPath],
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile: path.join(outDir, 'bundle.mjs'),
    alias: { '@': path.join(ROOT, 'src') },
    logLevel: 'silent',
});

const { LOCAL_FOOD_SEEDS } = await import(pathToFileURL(path.join(outDir, 'bundle.mjs')).href);
rmSync(outDir, { recursive: true, force: true });

const CATEGORIES = new Set([
    'cereales', 'tubercules', 'legumineuses', 'legumes', 'fruits',
    'viandes', 'poissons', 'oeufs', 'laitiers', 'matieres-grasses',
    'oleagineux', 'boissons', 'condiments', 'plats-prepares',
]);

/**
 * Bornes de vraisemblance par 100 g. Dépasser une borne trahit presque
 * toujours une erreur d'unité (×1000) plutôt qu'un aliment exceptionnel.
 */
const RANGES = {
    energy: [0, 950],
    protein: [0, 100],
    carbs: [0, 100],
    fat: [0, 100],
    fiber: [0, 100],
    sugars: [0, 100],
    saturatedFat: [0, 100],
    cholesterol: [0, 4000],      // mg — le jaune d'œuf est à ~1080
    sodium: [0, 40000],          // mg — le sel est à ~39000
    potassium: [0, 4000],        // mg
    calcium: [0, 1500],          // mg — au-delà, très probable erreur g→mg
    iron: [0, 100],              // mg
    magnesium: [0, 600],         // mg
    phosphorus: [0, 1000],       // mg
    zinc: [0, 100],              // mg
    vitaminC: [0, 2000],         // mg — le baobab séché peut être élevé
    copper: [0, 20],             // mg — le foie de bœuf culmine à ~14,3 mg
    vitaminA: [0, 12000],        // µg — le foie de bœuf culmine à 9 442 µg (USDA 13364)
    vitaminD: [0, 100],          // µg
    folate: [0, 1000],           // µg
    vitaminB12: [0, 100],        // µg
    selenium: [0, 500],          // µg
    water: [0, 100],
};

const errors = [];
const warnings = [];

// ---------- 1. Intégrité structurelle ----------
const slugs = new Map();
LOCAL_FOOD_SEEDS.forEach((seed, index) => {
    const where = `#${index} ${seed.slug ?? '(sans slug)'}`;

    if (!seed.slug || !/^[a-z0-9-]+$/.test(seed.slug)) {
        errors.push(`${where} : slug invalide`);
    }
    if (slugs.has(seed.slug)) {
        errors.push(`${where} : slug dupliqué (déjà vu à l'index ${slugs.get(seed.slug)})`);
    } else {
        slugs.set(seed.slug, index);
    }
    if (!CATEGORIES.has(seed.category)) {
        errors.push(`${where} : catégorie inconnue « ${seed.category} »`);
    }
    if (!seed.name || typeof seed.name !== 'string') {
        errors.push(`${where} : nom manquant`);
    }
    ['energy', 'protein', 'carbs', 'fat'].forEach((key) => {
        if (typeof seed.n?.[key] !== 'number') {
            errors.push(`${where} : « ${key} » manquant ou non numérique`);
        }
    });
});

// ---------- 2. Bornes de vraisemblance ----------
let rangeViolations = 0;
LOCAL_FOOD_SEEDS.forEach((seed) => {
    Object.entries(seed.n ?? {}).forEach(([key, value]) => {
        const range = RANGES[key];
        if (!range) return;
        if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
            errors.push(`${seed.slug} : ${key} = ${value} (valeur non finie ou négative)`);
            return;
        }
        if (value > range[1]) {
            errors.push(`${seed.slug} : ${key} = ${value} dépasse la borne ${range[1]} — erreur d'unité probable`);
            rangeViolations += 1;
        }
    });
});

// ---------- 3. Cohérence d'Atwater ----------
//
// Deux conventions de glucides coexistent dans les tables de composition :
//   A. USDA   — « carbs » inclut les fibres  → énergie = 4P + 4(carbs-fibres) + 2fibres + 9L
//   B. CIQUAL — « carbs » exclut les fibres  → énergie = 4P + 4carbs + 2fibres + 9L
// Un aliment est cohérent s'il satisfait l'une OU l'autre. On ne signale que
// ceux qui échouent aux deux, ce qui écarte les faux positifs sur les
// légumes-feuilles très riches en fibres.
const ATWATER_EXCEPTIONS = {
    // Le citron est un cas réel et documenté : l'essentiel de ses glucides est
    // de l'acide citrique et de la fibre, qui libèrent moins de 4 kcal/g.
    // USDA donne 29 kcal pour 100 g — valeur conservée telle quelle.
    citron: 'acides organiques — 29 kcal est la valeur USDA de référence',
};

const atwaterOutliers = [];
LOCAL_FOOD_SEEDS.forEach((seed) => {
    const { energy, protein, carbs, fat, fiber, alcohol } = seed.n ?? {};
    if ([energy, protein, carbs, fat].some((v) => typeof v !== 'number')) return;

    const fib = fiber ?? 0;
    const alc = (alcohol ?? 0) * 7;
    const conventionA = protein * 4 + Math.max(0, carbs - fib) * 4 + fib * 2 + fat * 9 + alc;
    const conventionB = protein * 4 + carbs * 4 + fib * 2 + fat * 9 + alc;

    const best = Math.min(
        Math.abs(energy - conventionA) / Math.max(conventionA, 1),
        Math.abs(energy - conventionB) / Math.max(conventionB, 1),
    );
    if (Math.max(conventionA, conventionB) < 20) return; // Trop peu d'énergie pour juger.
    if (best <= 0.25) return;
    if (ATWATER_EXCEPTIONS[seed.slug]) return;

    atwaterOutliers.push({
        slug: seed.slug,
        declared: energy,
        computedA: Math.round(conventionA),
        computedB: Math.round(conventionB),
        deviation: Math.round(best * 100),
    });
});

// ---------- 4. Cohérence des macros ----------
LOCAL_FOOD_SEEDS.forEach((seed) => {
    const { protein, carbs, fat, fiber, sugars } = seed.n ?? {};
    const sum = (protein ?? 0) + (carbs ?? 0) + (fat ?? 0) + (seed.n?.water ?? 0);
    if (sum > 105) {
        errors.push(`${seed.slug} : protéines+glucides+lipides+eau = ${Math.round(sum)} g pour 100 g — incohérent`);
    }
    if (typeof sugars === 'number' && typeof carbs === 'number' && sugars > carbs + 1) {
        errors.push(`${seed.slug} : sucres (${sugars} g) supérieurs aux glucides totaux (${carbs} g)`);
    }
    if (typeof fiber === 'number' && typeof carbs === 'number' && fiber > carbs + 1) {
        errors.push(`${seed.slug} : fibres (${fiber} g) supérieures aux glucides totaux (${carbs} g)`);
    }
});

// ---------- 5. Rapport de couverture ----------
const byCategory = {};
LOCAL_FOOD_SEEDS.forEach((seed) => {
    byCategory[seed.category] = (byCategory[seed.category] ?? 0) + 1;
});

const keyNutrients = ['fiber', 'sodium', 'potassium', 'calcium', 'iron', 'vitaminC', 'vitaminA', 'folate'];
const coverage = keyNutrients.map((key) => ({
    key,
    count: LOCAL_FOOD_SEEDS.filter((s) => typeof s.n?.[key] === 'number').length,
    percent: Math.round((LOCAL_FOOD_SEEDS.filter((s) => typeof s.n?.[key] === 'number').length / LOCAL_FOOD_SEEDS.length) * 100),
}));

console.log(`\nBase locale : ${LOCAL_FOOD_SEEDS.length} aliments\n`);
console.log('Répartition par catégorie :');
Object.entries(byCategory).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
    console.log(`  ${cat.padEnd(18)} ${String(count).padStart(3)}`);
});

console.log('\nCouverture des nutriments clés :');
coverage.forEach(({ key, count, percent }) => {
    const bar = '█'.repeat(Math.round(percent / 5)).padEnd(20, '·');
    console.log(`  ${key.padEnd(12)} ${bar} ${String(percent).padStart(3)} % (${count})`);
});

const avgNutrients = (LOCAL_FOOD_SEEDS.reduce((acc, s) => acc + Object.keys(s.n ?? {}).length, 0) / LOCAL_FOOD_SEEDS.length).toFixed(1);
console.log(`\nNutriments renseignés en moyenne : ${avgNutrients} par aliment`);

console.log('\nÉcarts énergétiques > 25 % vs Atwater (deux conventions de glucides testées) :');
if (atwaterOutliers.length === 0) {
    console.log('  aucun');
} else {
    atwaterOutliers
        .sort((a, b) => b.deviation - a.deviation)
        .forEach((o) => console.log(`  ${o.slug.padEnd(28)} déclaré ${String(o.declared).padStart(4)} kcal, Atwater ${String(o.computedA).padStart(4)}/${String(o.computedB).padStart(4)} kcal (${o.deviation} %)`));
}
Object.entries(ATWATER_EXCEPTIONS).forEach(([slug, reason]) => {
    console.log(`  exception documentée — ${slug} : ${reason}`);
});

console.log(`\n${'─'.repeat(64)}`);
if (errors.length > 0) {
    console.log(`❌ ${errors.length} erreur(s) :`);
    errors.forEach((e) => console.log(`  • ${e}`));
} else {
    console.log('✅ Aucune erreur structurelle ni dépassement de borne');
}
if (warnings.length > 0) {
    console.log(`\n⚠️  ${warnings.length} avertissement(s) :`);
    warnings.forEach((w) => console.log(`  • ${w}`));
}
console.log(`\n${atwaterOutliers.length} aliment(s) à vérifier manuellement sur l'énergie.`);

process.exit(errors.length > 0 ? 1 : 0);
