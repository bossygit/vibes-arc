/**
 * Vérification du moteur de preuves (Tribunal) : les preuves d'un jour doivent être
 * lues à l'index GLOBAL du jour (0 = 1er oct. 2025, minuit local), comme les écrit
 * `toggleHabitDay` — y compris pour un signal créé bien après octobre 2025.
 * Exécution : npm run test:evidence   (le script se relance dans deux fuseaux horaires)
 */

import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

// Relance dans deux fuseaux : à l'est d'UTC (Lagos, UTC+1) et à l'ouest (New York)
if (!process.env.__EVIDENCE_TZ_RUN) {
    let failed = false;
    for (const tz of ['Africa/Lagos', 'America/New_York']) {
        console.log(`\n— Fuseau ${tz}`);
        const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], {
            env: { ...process.env, TZ: tz, __EVIDENCE_TZ_RUN: '1' },
            stdio: 'inherit',
        });
        if (r.status !== 0) failed = true;
    }
    process.exit(failed ? 1 : 0);
}

const ROOT = path.resolve(import.meta.dirname, '..');
const outDir = mkdtempSync(path.join(tmpdir(), 'vibes-evidence-'));
const entryPath = path.join(outDir, 'entry.ts');
writeFileSync(
    entryPath,
    `
export { buildDailyEvidence, computeCredibilityScore } from '@/utils/credibilityScore';
export { computeWitnessTree } from '@/utils/witnessTree';
export { dayIndexForDate, getCurrentDayIndex } from '@/utils/habitUtils';
export { todayLocalISO } from '@/utils/dateUtils';
`
);
await build({
    entryPoints: [entryPath],
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile: path.join(outDir, 'bundle.mjs'),
    alias: { '@': path.join(ROOT, 'src') },
    logLevel: 'silent',
});
const { buildDailyEvidence, computeCredibilityScore, computeWitnessTree, dayIndexForDate, getCurrentDayIndex, todayLocalISO } =
    await import(pathToFileURL(path.join(outDir, 'bundle.mjs')).href);

let passed = 0;
const failures = [];
function check(name, ok, detail = '') {
    if (ok) {
        passed += 1;
        console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ''}`);
    } else {
        failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
        console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
    }
}

const todayIdx = getCurrentDayIndex();
check('index du 1er octobre 2025 = 0', dayIndexForDate(new Date(2025, 9, 1, 15, 30)) === 0);
check('index d’aujourd’hui cohérent', dayIndexForDate(new Date()) === todayIdx, String(todayIdx));

// Signal créé il y a 20 jours, coché les 10 derniers jours (dont aujourd'hui) — à l'index global.
const start = todayIdx - 19;
const progress = new Array(todayIdx + 30).fill(false);
for (let i = todayIdx - 9; i <= todayIdx; i++) progress[i] = true;
const habit = { id: 1, linkedIdentities: [7], progress, startDayIndex: start };

const evidence = buildDailyEvidence([habit], [7], new Map(), [], 30);
const todayEv = evidence[evidence.length - 1];
check('aujourd’hui compte comme preuve', todayEv.signalsCompleted === 1 && todayEv.signalsTotal === 1, JSON.stringify(todayEv));
check('jour local comme clé', todayEv.date === todayLocalISO(), `${todayEv.date} vs ${todayLocalISO()}`);
const beforeStart = evidence[0]; // il y a 29 jours : le signal n'existait pas
check('avant sa création, le signal n’est pas observé', beforeStart.signalsTotal === 0);
const completedDays = evidence.filter((e) => e.signalsCompleted > 0).length;
check('10 jours de preuves sur 30', completedDays === 10, String(completedDays));

const score = computeCredibilityScore(1, evidence.map((e) => ({ ...e, desireId: 1 })), 0);
check('score d’action = 10 jours cochés / 20 jours observables', score.actionScore === 50, `${score.actionScore} %`);

// Fréquence notée aujourd'hui : retrouvée à la date locale
const moods = new Map([[todayLocalISO(), 3]]);
const withMood = buildDailyEvidence([habit], [7], moods, [], 3);
check('fréquence du jour retrouvée', withMood[withMood.length - 1].moodScore === 3 && withMood[withMood.length - 1].isAligned === true);

// Accusateur créé il y a 5 jours, actif aujourd'hui
const accProgress = new Array(todayIdx + 30).fill(false);
accProgress[todayIdx] = true;
const accEv = buildDailyEvidence([habit], [7], new Map(), [{ id: 9, progress: accProgress, startDayIndex: todayIdx - 4 }], 2);
check('accusateur actif aujourd’hui', accEv[1].accusatorsActive === 1 && accEv[0].accusatorsActive === 0);

// Arbre des témoins : un témoin journalier aujourd'hui, daté du jour local
const tree = computeWitnessTree({ desireId: 1, requiredHabitIds: [1], habits: [habit], daysBack: 14 });
const lastDay = tree.witnesses.daily.concat(tree.accusers.daily).sort((a, b) => a.date.localeCompare(b.date)).at(-1);
check('arbre : aujourd’hui est un témoin', !!lastDay && lastDay.isComplete === true, JSON.stringify(lastDay));
check('arbre : daté du jour local', lastDay?.date === todayLocalISO(), lastDay?.date);
// L'arbre n'affiche que les 7 derniers témoins journaliers : ici J-6 → J, tous cochés.
const sevenDays = Array.from({ length: 7 }, (_, k) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + k);
    return todayLocalISO(d);
}).join(',');
check('arbre : les 7 derniers jours sont des témoins', tree.witnesses.daily.map((w) => w.date).join(',') === sevenDays, tree.witnesses.daily.map((w) => w.date).join(','));
check('arbre : aucun accusateur sur les 10 jours cochés', tree.accusers.daily.every((a) => a.date < todayLocalISO(new Date(Date.now() - 9 * 86400000))));

rmSync(outDir, { recursive: true, force: true });

console.log(`${'─'.repeat(60)}`);
if (failures.length === 0) {
    console.log(`✅ ${passed} vérifications réussies`);
    process.exit(0);
} else {
    console.log(`❌ ${failures.length} échec(s) sur ${passed + failures.length} vérifications :\n`);
    failures.forEach((f) => console.log(`  • ${f}`));
    process.exit(1);
}
