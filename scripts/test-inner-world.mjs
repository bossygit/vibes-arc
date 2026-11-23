/**
 * Vérification du module Monde intérieur (Image Streaming × rêves) :
 * lecture tolérante du frontmatter Obsidian, correspondance des symboles par mot
 * entier, échos rêve ↔ séance et chronologie — sur des notes FICTIVES.
 * Exécution : npm run test:inner-world   (ou node scripts/test-inner-world.mjs)
 */

import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const outDir = mkdtempSync(path.join(tmpdir(), 'vibes-inner-world-'));
const entryPath = path.join(outDir, 'entry.ts');
writeFileSync(
    entryPath,
    `
export * from '@/utils/innerWorld/frontmatter';
export * from '@/utils/innerWorld/analysis';
export { parseRareParallels, parsePracticeItems } from ${JSON.stringify(path.join(ROOT, 'server', 'innerWorldVault.ts'))};
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
const {
    parseFrontmatter, fmString, fmList, extractSection, excerpt, buildMatcher, symbolTerms, normalizeText, analyzeInnerWorld,
    parseRareParallels, parsePracticeItems,
} = await import(pathToFileURL(path.join(outDir, 'bundle.mjs')).href);

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

/* ────────────────────────── frontmatter ────────────────────────── */

console.log('\nFrontmatter Obsidian (notes de rêve)');
{
    const note = [
        '---',
        'base: "[[2023.base]]"',
        'Lucid?:',
        '  - V.3',
        "Details: Je marche avec Alex, il m'a dit: BONJOUR",
        '"Dream # of Night": 2',
        'Dream Linked to...: []',
        'Wake Time: ""',
        'Date: 2026-07-01',
        'Motif: Confusion',
        'People in the Dream:',
        '  - Alex',
        '  - "[[Tante Rose]]"',
        'Places in the Dream:',
        'Time in the Dream:',
        '---',
        'Here is where you write as much detail about the dream as possible.',
    ].join('\n');
    const { data, body, hasFrontmatter } = parseFrontmatter(note);
    check('bloc détecté', hasFrontmatter);
    check('valeur avec « : » conservée en entier', fmString(data, 'Details') === "Je marche avec Alex, il m'a dit: BONJOUR", fmString(data, 'Details'));
    check('clé entre guillemets', fmString(data, '"Dream # of Night"') === undefined && fmString(data, 'Dream # of Night') === '2');
    check('liste YAML', fmList(data, 'Lucid?').join(',') === 'V.3');
    check('tableau vide en ligne', Array.isArray(data['Dream Linked to...']) && data['Dream Linked to...'].length === 0);
    check('chaîne vide → absente', fmString(data, 'Wake Time') === undefined);
    check('liste vide → []', fmList(data, 'Places in the Dream').length === 0);
    check('date', fmString(data, 'Date') === '2026-07-01');
    check('éléments entre guillemets', fmList(data, 'People in the Dream')[1] === '[[Tante Rose]]');
    check('corps après le bloc', body.startsWith('Here is where'));

    const block = parseFrontmatter('---\nDetails: |-\n  Ligne un\n  - pas une liste\nDate: 2026-07-02\n---\n');
    check('bloc littéral YAML lu comme texte', fmString(block.data, 'Details') === 'Ligne un - pas une liste', fmString(block.data, 'Details'));
    check('clé suivante après un bloc littéral', fmString(block.data, 'Date') === '2026-07-02');

    check('note sans frontmatter', parseFrontmatter('# Symboles Croisés\ntexte').hasFrontmatter === false);
    check('BOM et fins de ligne Windows', fmString(parseFrontmatter('﻿---\r\ndate: 2026-08-20\r\n---\r\n').data, 'date') === '2026-08-20');

    const session = '## 📝 Transcription\n\nTout est noir.\n\n## ❓ Questions\n1. ...';
    check('section « Transcription » (émoji ignoré)', extractSection(session, 'transcription') === 'Tout est noir.');
    check('extrait coupé sur un mot', excerpt('un deux trois quatre cinq', 12) === 'un deux…', excerpt('un deux trois quatre cinq', 12));
}

/* ────────────────────────── correspondance ────────────────────────── */

console.log('\nCorrespondance des symboles (mot entier, accents ignorés)');
{
    const eau = buildMatcher(symbolTerms({ name: 'Eau', aliases: ['eau', 'rivière', 'mer', "cours d'eau"] }));
    const t = (s) => normalizeText(s);
    check('« beaucoup » ne contient pas « eau »', eau(t('Il y a beaucoup de bruit')) === null);
    check('« merci » ne contient pas « mer »', eau(t('Je dis merci')) === null);
    check('« l’eau » (apostrophe typographique)', eau(t('Je bois l’eau froide')) === 'eau');
    check('pluriel « eaux »', eau(t('Les eaux montent')) === 'eau');
    check('accents ignorés : « riviere »', eau(t('Une riviere calme')) === 'riviere');
    check('alias de plusieurs mots', eau(t("au bord d'un cours d'eau")) === "cours d'eau");

    const maison = buildMatcher(symbolTerms({ name: 'Architecture / Maison', aliases: ['maison', 'cour'] }));
    check('« cour » ✓', maison(t('le serpent dans la cour')) === 'cour');
    check('« cours » (faux ami) ✗', maison(t('au cours de la journée')) === null);

    const porte = buildMatcher(symbolTerms({ name: 'Porte / Seuil', aliases: ['porte', 'seuil'] }));
    check('« la porte » ✓', porte(t('la porte s’ouvre')) === 'porte');
    check('« il porte » (verbe) ✗', porte(t('il porte un manteau blanc')) === null);
    check('verbe puis vraie porte plus loin ✓', porte(t('il porte un sac vers la porte')) === 'porte');

    check('mot-outil exclu (« Son / Auditif »)', !symbolTerms({ name: 'Son / Auditif', aliases: [] }).includes('son'));
    check('nom composé découpé sur « / »', symbolTerms({ name: 'Métal / Rouille', aliases: [] }).join('|') === 'metal|rouille');
}

/* ────────────────────────── analyse croisée ────────────────────────── */

console.log('\nAnalyse croisée rêves ↔ séances');
{
    const sessions = Array.from({ length: 8 }, (_, i) => ({
        number: i + 1,
        date: `2026-07-${String(10 + i).padStart(2, '0')}`,
        excerpt: `séance ${i + 1}`,
        file: `s${i + 1}.md`,
    }));
    const snapshot = {
        version: 1,
        generatedAt: '2026-07-20T00:00:00Z',
        sessions,
        symbols: [
            // présent dans 8/8 séances → omniprésent, ignoré pour les échos
            { name: 'Noir / Ombre', count: 8, sessions: [1, 2, 3, 4, 5, 6, 7, 8], aliases: ['noir'], associations: [] },
            // séances #1 (10/07, −5 j : hors fenêtre), #4 (13/07, −2 j) et #8 (17/07, +2 j)
            { name: 'Serpent', count: 3, sessions: [1, 4, 8], lastSession: 8, evolution: 'De menace à gardien', aliases: ['serpent'], associations: ['peur'] },
            { name: 'Pont', count: 3, sessions: [1, 2, 3], aliases: ['pont'], associations: [] },
            { name: 'Fumée blanche', count: 1, sessions: [8], lastSession: 8, aliases: [], associations: [] },
        ],
        dreams: [
            { id: 'a.md', title: 'Le serpent', date: '2026-07-15', people: [], places: ['Vieux port'], details: 'Un grand serpent noir sous l’eau.' },
            { id: 'b.md', title: 'Vieux rêve', date: '2023-05-01', people: ['Sam'], places: [], details: 'Je traverse un pont.' },
            { id: 'c.md', title: 'Sans date', date: null, people: ['Sam'], places: [], details: 'Une pièce noire.' },
        ],
    };
    const a = analyzeInnerWorld(snapshot, { echoWindowDays: 3, today: '2026-07-26' });

    const names = a.bridges.map((b) => b.symbol.name);
    check('symboles partagés', names.includes('Serpent') && names.includes('Pont') && names.includes('Noir / Ombre'), names.join(', '));
    check('symbole omniprésent marqué', a.bridges.find((b) => b.symbol.name === 'Noir / Ombre').pervasive === true);
    check('symbole récurrent absent des rêves → « seulement IS »', a.isOnly.length === 0, a.isOnly.map((s) => s.name).join(', '));

    const snake = a.echoes.find((e) => e.dream.id === 'a.md');
    check('écho du serpent trouvé', !!snake);
    const linkNumbers = snake ? snake.links.map((l) => l.session.number).sort() : [];
    check('seules les séances à ±3 j qui partagent un symbole précis', linkNumbers.join(',') === '4,8', `séances ${linkNumbers.join(',')}`);
    check('l’omniprésent ne crée pas d’écho', snake ? snake.links.every((l) => !l.symbols.includes('Noir / Ombre')) : false);
    const deltas = snake ? snake.links.map((l) => l.deltaDays).sort((x, y) => x - y).join(',') : '';
    check('écart en jours (avant / après le rêve)', deltas === '-2,2', deltas);
    check('rêve hors période sans écho', !a.echoes.some((e) => e.dream.id === 'b.md'));

    check('personnages comptés', a.people[0]?.name === 'Sam' && a.people[0]?.count === 2);
    check('lieu sans symbole IS : non rattaché', a.places.find((p) => p.name === 'Vieux port')?.alsoInIS === null);
    const withPort = analyzeInnerWorld({ ...snapshot, symbols: [...snapshot.symbols, { name: 'Port de nuit', count: 2, sessions: [1, 2], aliases: ['port'], associations: [] }] });
    check('lieu « Vieux port » rattaché au symbole « Port de nuit »', withPort.places.find((p) => p.name === 'Vieux port')?.alsoInIS === 'Port de nuit');
    check('dernière séance', a.latestSession?.number === 8);
    check('évolutions de la dernière séance', a.latestEvolutions.map((s) => s.name).join(',') === 'Serpent');
    check('semaines lundi → lundi', a.weeks[0]?.weekStart === '2026-07-06' && a.weeks.at(-1)?.weekStart === '2026-07-20', `${a.weeks[0]?.weekStart} → ${a.weeks.at(-1)?.weekStart}`);
    check('comptes hebdomadaires', a.weeks.reduce((s, w) => s + w.sessions, 0) === 8 && a.weeks.reduce((s, w) => s + w.dreams, 0) === 1);
}

console.log('\nFichiers écrits par le bot Image Streaming (dream_parallels.json, practice_reminders.json)');
{
    // Format exact écrit par dream_parallels.py
    const parallels = parseRareParallels({
        generated_at: '2026-11-23T14:00:00+00:00',
        parallels: [
            {
                session: 'Image Streaming - 2026-07-11 0917', session_date: '2026-07-11', dream: 'Olive oil', dream_date: '2026-07-12',
                gap_days: -1, direction: 'session → rêve', words: ['étagère'], session_excerpt: '…une étagère en bois…', dream_excerpt: '…l’étagère est en bois peint en vert…',
            },
            { session: 'X', session_date: 'pas une date', dream: 'Y', dream_date: '2026-07-12', words: ['mot'] },
            { session: 'X', session_date: '2026-07-11', dream: 'Y', dream_date: '2026-07-12', words: [] },
        ],
    });
    check('parallèle valide lu (dates, mots, sens, écart en valeur absolue)', parallels.length === 1 && parallels[0].words[0] === 'étagère' && parallels[0].gapDays === 1 && parallels[0].direction === 'session → rêve');
    check('parallèles invalides ignorés (date illisible, aucun mot)', parallels.length === 1);
    check('fichier absent ou mal formé → aucun parallèle', parseRareParallels(null).length === 0 && parseRareParallels({ parallels: 'x' }).length === 0);

    // Format exact écrit par reminders.py (export_practice)
    const practice = parsePracticeItems({
        updated_at: '2026-11-23T15:00:00+01:00',
        items: [
            { id: 'd2ff004f', session_number: 44, type: 'exercice', title: 'Entrer par le son quand le sol se dérobe', criterion: 'Au moins un moment…', status: 'active', created_at: '2026-11-23T14:30:00+01:00', done_at: null, done_via: null },
            { id: 'a1', session_number: 43, type: 'attention', title: 'Fait', criterion: '', status: 'done', created_at: 'x', done_at: '2026-11-22T08:00:00+01:00', done_via: 'ios' },
            { id: 'bad', session_number: 1, title: 'Statut inconnu', status: 'paused' },
        ],
    });
    check('exercices lus avec leur statut', practice.length === 2 && practice[0].status === 'active' && practice[1].doneVia === 'ios');
    check('statut inconnu ignoré', !practice.some((p) => p.id === 'bad'));
    check('fichier absent → aucun exercice', parsePracticeItems(undefined).length === 0);
}

/* ────────────────────────── bilan ────────────────────────── */

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
