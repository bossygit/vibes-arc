/**
 * Vérification du moteur nutritionnel et des adaptateurs de données.
 * Exécution : node scripts/test-nutrition.mjs
 *
 * Les valeurs attendues sont calculées à la main (formules Mifflin-St Jeor,
 * DRI, conversions d'unités) et comparées à la sortie des modules.
 */

import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const outDir = mkdtempSync(path.join(tmpdir(), 'vibes-nutrition-'));

const entry = `
export * from '@/services/nutrition/nutritionGoals';
export * from '@/services/nutrition/nutritionMath';
export * from '@/services/nutrition/openFoodFacts';
export { getCalorieStatus, CALORIE_STATUS_LABELS } from '@/types/nutrition';
`;

const entryPath = path.join(outDir, 'entry.ts');
const { writeFileSync } = await import('node:fs');
writeFileSync(entryPath, entry);

await build({
    entryPoints: [entryPath],
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile: path.join(outDir, 'bundle.mjs'),
    alias: { '@': path.join(ROOT, 'src') },
    logLevel: 'silent',
});

const mod = await import(pathToFileURL(path.join(outDir, 'bundle.mjs')).href);

// ---------------------------------------------------------------
// Mini harnais d'assertions
// ---------------------------------------------------------------
let passed = 0;
const failures = [];

function check(label, actual, expected, tolerance = 0) {
    const ok = typeof expected === 'number'
        ? Math.abs(actual - expected) <= tolerance
        : JSON.stringify(actual) === JSON.stringify(expected);
    if (ok) {
        passed += 1;
        console.log(`  ✓ ${label}`);
    } else {
        failures.push(`${label}\n      attendu : ${JSON.stringify(expected)}\n      obtenu  : ${JSON.stringify(actual)}`);
        console.log(`  ✗ ${label}  (attendu ${JSON.stringify(expected)}, obtenu ${JSON.stringify(actual)})`);
    }
}

function section(title) {
    console.log(`\n${title}`);
}

// ---------------------------------------------------------------
section('1. Métabolisme de base — Mifflin-St Jeor');
// Homme 30 ans, 175 cm, 75 kg → 10*75 + 6.25*175 - 5*30 + 5 = 750 + 1093.75 - 150 + 5 = 1698.75
const homme = {
    sex: 'homme', age: 30, heightCm: 175, weightKg: 75,
    activity: 'modere', goalType: 'maintien', rateKgPerWeek: 0.5,
    macroSplit: { protein: 25, carbs: 45, fat: 30 }, bmrFormula: 'mifflin',
    updatedAt: new Date().toISOString(),
};
check('BMR homme 30a/175cm/75kg', mod.computeBmr(homme), 1699);

// Femme 30 ans, 165 cm, 60 kg → 600 + 1031.25 - 150 - 161 = 1320.25
const femme = { ...homme, sex: 'femme', heightCm: 165, weightKg: 60 };
check('BMR femme 30a/165cm/60kg', mod.computeBmr(femme), 1320);

// Katch-McArdle : 370 + 21.6 * masse maigre. 75 kg à 20 % de gras → 60 kg masse maigre
check('BMR Katch-McArdle (20 % MG)', mod.computeBmr({ ...homme, bmrFormula: 'katch', bodyFatPercent: 20 }), Math.round(370 + 21.6 * 60));

section('2. Dépense totale et cible calorique');
check('TDEE modéré (×1,55)', mod.computeTdee(1699, 'modere'), Math.round(1699 * 1.55));

const maintien = mod.computeCalorieTarget(homme);
check('Maintien : cible = TDEE', maintien.calories, mod.computeTdee(1699, 'modere'));

// Perte 0,5 kg/semaine → 0,5 * 7700 / 7 = 550 kcal de déficit
const perte = mod.computeCalorieTarget({ ...homme, goalType: 'perte', rateKgPerWeek: 0.5 });
check('Perte 0,5 kg/sem : déficit 550 kcal', mod.computeTdee(1699, 'modere') - perte.calories, 550);

const prise = mod.computeCalorieTarget({ ...homme, goalType: 'prise', rateKgPerWeek: 0.5 });
check('Prise 0,5 kg/sem : surplus 550 kcal', prise.calories - mod.computeTdee(1699, 'modere'), 550);

// Plancher de sécurité : femme sédentaire cherchant à perdre 1 kg/semaine
const dangereux = mod.computeCalorieTarget({
    ...femme, activity: 'sedentaire', goalType: 'perte', rateKgPerWeek: 1,
});
check('Plancher de sécurité femme = 1200 kcal', dangereux.calories, 1200);
check('Avertissement de sécurité émis', typeof dangereux.safetyWarning === 'string' && dangereux.safetyWarning.length > 0, true);

section('3. Répartition des macronutriments');
const macros = mod.computeMacroGrams(
    { ...homme, weightKg: 75, macroSplit: { protein: 25, carbs: 45, fat: 30 } },
    2000,
);
// 25 % de 2000 = 500 kcal / 4 = 125 g de protéines (plancher 1,2 g/kg = 90 g, non atteint)
check('Protéines 25 % de 2000 kcal', macros.protein, 125);
check('Glucides 45 % de 2000 kcal', macros.carbs, 225);
check('Lipides 30 % de 2000 kcal', macros.fat, 67, 1);
check('Plancher protéique non déclenché', macros.proteinFloorApplied, false);

// Objectif perte → plancher 1,6 g/kg. 1500 kcal avec 10 % de protéines = 37,5 g << 120 g
const macrosPlancher = mod.computeMacroGrams(
    { ...homme, weightKg: 75, goalType: 'perte', macroSplit: { protein: 10, carbs: 60, fat: 30 } },
    1500,
);
check('Plancher protéique déclenché (1,6 g/kg)', macrosPlancher.proteinFloorApplied, true);
check('Protéines remontées à 120 g', macrosPlancher.protein, 120);

section('4. Apports de référence (DRI)');
const ciblesFemme = mod.computeMicronutrientTargets({ ...femme, age: 30 }, 2000);
check('Fer femme 30 ans = 18 mg', ciblesFemme.iron, 18);
check('Calcium femme 30 ans = 1000 mg', ciblesFemme.calcium, 1000);
check('Vitamine C femme = 75 mg', ciblesFemme.vitaminC, 75);
check('Folates = 400 µg', ciblesFemme.folate, 400);
check('Fibres à 2000 kcal = 28 g', ciblesFemme.fiber, 28);

const ciblesHomme = mod.computeMicronutrientTargets({ ...homme, age: 30 }, 2500);
check('Fer homme 30 ans = 8 mg', ciblesHomme.iron, 8);
check('Zinc homme = 11 mg', ciblesHomme.zinc, 11);
check('Sodium (plafond) = 2300 mg', ciblesHomme.sodium, 2300);
check('Sucres ajoutés < 10 % énergie (2500 kcal) = 63 g', ciblesHomme.addedSugars, 63);
check('AG saturés < 10 % énergie (2500 kcal) = 28 g', ciblesHomme.saturatedFat, 28);

const ciblesAgees = mod.computeMicronutrientTargets({ ...femme, age: 60 }, 1800);
check('Calcium femme 60 ans = 1200 mg', ciblesAgees.calcium, 1200);
check('Fer femme 60 ans = 8 mg', ciblesAgees.iron, 8);

section('5. Mise à l\'échelle et agrégation');
const riz = { energy: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, calcium: 10, iron: 0.2 };
const portion = mod.scaleNutrients(riz, 250);
check('250 g de riz → énergie', portion.energy, 325, 1e-9);
check('250 g de riz → protéines', portion.protein, 6.75, 1e-9);
check('250 g de riz → calcium', portion.calcium, 25, 1e-9);

const total = mod.sumNutrients(mod.scaleNutrients(riz, 100), mod.scaleNutrients(riz, 50));
check('100 g + 50 g → énergie', total.energy, 195, 1e-9);

check('Quantité nulle → vecteur vide', JSON.stringify(mod.scaleNutrients(riz, 0)), '{}');

section('6. Progression et statuts');
const progress = mod.computeProgress(
    { energy: 1450, protein: 96, carbs: 180, fat: 62, sodium: 2900 },
    { energy: 2200, protein: 140, carbs: 250, fat: 73, sodium: 2300 },
);
const byKey = Object.fromEntries(progress.map((p) => [p.key, p]));
check('Calories 1450/2200 = 66 %', byKey.energy.percent, 66);
check('Protéines 96/140 = 69 %', byKey.protein.percent, 69);
check('Sodium : plafond dépassé', byKey.sodium.exceeded, true);
check('Calcium non renseigné', byKey.calcium.unknown, true);
check('Calcium sans pourcentage', byKey.calcium.percent, undefined);
check('Vitamine D absente des totaux → unknown', byKey.vitaminD.unknown, true);

check('Statut 1450/2200 (66 %) = sous', mod.getCalorieStatus(1450, 2200), 'sous');
check('Statut 2000/2200 (91 %) = atteint', mod.getCalorieStatus(2000, 2200), 'atteint');
check('Statut 1700/2200 (77 %) = proche', mod.getCalorieStatus(1700, 2200), 'proche');
check('Statut 2500/2200 (114 %) = depasse', mod.getCalorieStatus(2500, 2200), 'depasse');

const statuses = [
    mod.formatNutrient(1450, 'energy'),
    mod.formatNutrient(96.4, 'protein'),
    mod.formatNutrient(2900, 'sodium'),
];
check('Formatage kcal', statuses[0], '1 450 kcal');
check('Formatage protéines', statuses[1], '96,4 g');
check('Formatage sodium', statuses[2], '2 900 mg');

section('7. Conversion des nutriments Open Food Facts');
// OFF exprime TOUT en grammes pour 100 g (calcium de l'emmental : 0.97 → 970 mg)
const off = mod.mapOffNutriments({
    'energy-kcal_100g': 369,
    proteins_100g: 27,
    carbohydrates_100g: 0.5,
    fat_100g: 29,
    calcium_100g: 0.97,
    iron_100g: 0.0021,
    selenium_100g: 0.0000145,
    'vitamin-d_100g': 0.0000005,
    'vitamin-c_100g': 0,
    salt_100g: 0.5,
    sodium_100g: 0.2,
});
check('Calories OFF inchangées', off.energy, 369);
check('Calcium 0,97 g → 970 mg', off.calcium, 970, 1e-6);
check('Fer 0,0021 g → 2,1 mg', off.iron, 2.1, 1e-9);
check('Sélénium → µg', off.selenium, 14.5, 1e-6);
check('Vitamine D → µg', off.vitaminD, 0.5, 1e-9);
check('Sodium 0,2 g → 200 mg', off.sodium, 200, 1e-6);

// Repli sel → sodium (sel / 2,5)
const offSel = mod.mapOffNutriments({ salt_100g: 2.5 });
check('Repli sel 2,5 g → sodium 1000 mg', offSel.sodium, 1000, 1e-6);

// Repli kJ → kcal
const offKj = mod.mapOffNutriments({ energy_100g: 418.4 });
check('Repli kJ → kcal (418,4 kJ = 100 kcal)', offKj.energy, 100, 1e-6);

// Repli Atwater quand l'énergie manque : 10x4 + 20x4 + 5x9 = 165 kcal
const offAtwater = mod.mapOffNutriments({ proteins_100g: 10, carbohydrates_100g: 20, fat_100g: 5 });
check('Repli Atwater 10/20/5 → 165 kcal', offAtwater.energy, 165, 1e-6);

section('8. Open Food Facts — données réelles (réseau)');
// Le client passe par le proxy applicatif (/api/nutrition/off-search), qui
// n'existe pas dans ce contexte Node : on interroge donc OFF directement
// puis on applique le MÊME mapper que celui utilisé en production.
try {
    const fields = 'code,product_name,brands,nutriments,serving_size,serving_quantity,image_url,nutriscore_grade,nova_group,categories_tags';
    const url = `https://search.openfoodfacts.org/search?q=emmental&page_size=5&fields=${encodeURIComponent(fields)}`;
    const response = await fetch(url, { headers: { 'User-Agent': 'VibesArc-test/1.0' } });
    const payload = await response.json();
    const hits = Array.isArray(payload?.hits) ? payload.hits : [];

    check('OFF renvoie des résultats pour « emmental »', hits.length > 0, true);

    const mapped = hits.map(mod.mapOffProduct).filter(Boolean);
    check('Tous les résultats exploitables sont normalisés', mapped.length > 0, true);

    const first = mapped[0];
    check('Identifiant préfixé par la source', first.id.startsWith('off:'), true);
    check('Champ source = off', first.source, 'off');
    check('Nom renseigné', typeof first.name === 'string' && first.name.length > 0, true);
    check('Calories renseignées', typeof first.per100g.energy === 'number', true);
    check('Protéines renseignées', typeof first.per100g.protein === 'number', true);
    check('Portions proposées', first.servingSizes.length > 0, true);
    check('Marque extraite du tableau OFF', typeof first.brand === 'string' && first.brand.length > 0, true);

    // Une fiche sans nom ni nutriments doit être écartée, pas renvoyée cassée.
    check('Fiche vide rejetée', mod.mapOffProduct({ code: '1', product_name: '' }), null);
    check('Fiche sans nutriments rejetée', mod.mapOffProduct({ code: '1', product_name: 'X', nutriments: {} }), null);
} catch (error) {
    failures.push(`Données OFF réelles : ${error.message}`);
    console.log(`  ✗ Appel OFF échoué : ${error.message}`);
}

// ---------------------------------------------------------------
rmSync(outDir, { recursive: true, force: true });

console.log(`\n${'─'.repeat(60)}`);
if (failures.length === 0) {
    console.log(`✅ ${passed} vérifications réussies`);
    process.exit(0);
} else {
    console.log(`❌ ${failures.length} échec(s) sur ${passed + failures.length} vérifications :\n`);
    failures.forEach((f) => console.log(`  • ${f}`));
    process.exit(1);
}
