/**
 * Vérification du module Cohérence cardiaque : calcul spectral (coherence.ts) et
 * détecteur de battements PPG (ppgProcessor.ts), sur signaux SIMULÉS à graine fixe.
 * Exécution : npm run test:coherence   (ou node scripts/test-coherence.mjs)
 *
 * Limite assumée : ce sont des simulations (forme de pouls, bruit et gigue
 * supposés). Elles verrouillent la logique et les régressions ; elles ne
 * remplacent pas une mesure sur un vrai capteur.
 */

import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const outDir = mkdtempSync(path.join(tmpdir(), 'vibes-coherence-'));
const entryPath = path.join(outDir, 'entry.ts');
writeFileSync(
    entryPath,
    `
export * from '@/utils/hrv/coherence';
export { PpgBeatDetector } from '@/utils/hrv/ppgProcessor';
export { computeRmssd } from '@/utils/hrv/sessionStats';
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
const { coherenceFromRR, PpgBeatDetector, computeRmssd, COHERENCE_MIN_RR } = await import(
    pathToFileURL(path.join(outDir, 'bundle.mjs')).href
);

/* ────────────────────────── utilitaires ────────────────────────── */

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

function makeRng(seed) {
    let a = seed | 0;
    const rnd = () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const gauss = () => {
        let u = 0;
        let v = 0;
        while (u === 0) u = rnd();
        while (v === 0) v = rnd();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };
    return { rnd, gauss };
}
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const f1 = (x) => x.toFixed(1);
const f2 = (x) => x.toFixed(2);

/** Série RR synthétique : RSA sinusoïdale + bruit (ou RR uniformes) + dérive de FC éventuelle. */
function genRR(rng, { durS = 75, base = 1000, A = 0, f = 0.1, sigma = 0, uniform = 0, slope = 0 }) {
    const rr = [];
    const times = [];
    let t = 0;
    const phase = rng.rnd() * 2 * Math.PI;
    while (t < durS) {
        const r = uniform
            ? base + uniform * (rng.rnd() * 2 - 1)
            : base + slope * rr.length + A * Math.sin(2 * Math.PI * f * t + phase) + sigma * rng.gauss();
        t += r / 1000;
        rr.push(r);
        times.push(t);
    }
    return { rr, times };
}

function meanOver(runs, seed, genParams, fn) {
    const rng = makeRng(seed);
    const out = [];
    for (let k = 0; k < runs; k++) {
        const { rr, times } = genRR(rng, genParams);
        const v = fn(rr, times, rng);
        if (v !== null && v !== undefined) out.push(v);
    }
    return mean(out);
}

/* ────────────────── A. Calcul spectral (coherence.ts) ────────────────── */

console.log('\nA. Calcul spectral — coherenceFromRR');

{
    const score = (p) => meanOver(150, 11, p, (rr, t) => coherenceFromRR(rr, t)?.score ?? null);
    const strong = score({ A: 45, sigma: 10 });
    const mid = score({ A: 20, sigma: 12 });
    const weak = score({ A: 10, sigma: 20 });
    const random = score({ uniform: 150 });
    check('Cohérence forte → score ≥ 9', strong >= 9, f1(strong));
    check('Cohérence moyenne → score entre 5 et 7.5', mid >= 5 && mid <= 7.5, f1(mid));
    check('Cohérence faible → score < 2.5', weak < 2.5, f1(weak));
    check('RR aléatoires → score < 2', random < 2, f1(random));
    check('Ordre fort > moyen > faible', strong > mid && mid > weak);
}

{
    // Avant le zero-padding, la bande de ±0.015 Hz ne contenait qu'un bin : le ratio
    // doublait ou non selon la position du pic sur la grille (4.5 cpm ≠ 5 cpm).
    const ratios = [4.5, 5, 5.5, 6, 6.5, 7].map((cpm) =>
        meanOver(100, 21, { A: 40, sigma: 5, f: cpm / 60 }, (rr, t) => coherenceFromRR(rr, t)?.ratio ?? null)
    );
    const spread = (Math.max(...ratios) - Math.min(...ratios)) / mean(ratios);
    check('Ratio indépendant de la fréquence respiratoire (4.5 à 7 cpm)', spread < 0.1, `écart ${f2(100 * spread)} % — ${ratios.map(f2).join(' / ')}`);

    const mid = [4.5, 5, 5.5, 6, 6.5, 7].map((cpm) =>
        meanOver(120, 22, { A: 20, sigma: 10, f: cpm / 60 }, (rr, t) => coherenceFromRR(rr, t)?.ratio ?? null)
    );
    const spreadMid = (Math.max(...mid) - Math.min(...mid)) / mean(mid);
    check('… y compris à amplitude moyenne', spreadMid < 0.25, `écart ${f2(100 * spreadMid)} % — ${mid.map(f2).join(' / ')}`);
}

{
    // FC qui ralentit pendant la détente : le detrend par la moyenne seule faisait chuter le score.
    const ratioAt = (slope) =>
        meanOver(120, 31, { durS: 80, base: 850, A: 40, sigma: 5, slope }, (rr, t) => coherenceFromRR(rr, t)?.ratio ?? null);
    const r0 = ratioAt(0);
    const r2 = ratioAt(2);
    const r4 = ratioAt(4);
    check('Dérive de FC de 2 ms/battement sans effet notable', r2 > 0.8 * r0, `${f2(r2)} vs ${f2(r0)}`);
    check('Dérive de FC de 4 ms/battement sans effet notable', r4 > 0.7 * r0, `${f2(r4)} vs ${f2(r0)}`);
}

{
    // RR rejetés : les instants réels doivent être conservés (sinon l'axe du temps est écrasé).
    const dropRandom = (rr, times, n, rng) => {
        const idx = new Set();
        while (idx.size < n) idx.add(5 + Math.floor(rng.rnd() * (rr.length - 10)));
        return { rr: rr.filter((_, i) => !idx.has(i)), times: times.filter((_, i) => !idx.has(i)) };
    };
    const p = { durS: 80, A: 20, sigma: 10 };
    const whole = meanOver(150, 41, p, (rr, t) => coherenceFromRR(rr, t)?.ratio ?? null);
    const withTimes = meanOver(150, 41, p, (rr, t, rng) => {
        const d = dropRandom(rr, t, 8, rng);
        return coherenceFromRR(d.rr, d.times)?.ratio ?? null;
    });
    const cumsum = meanOver(150, 41, p, (rr, t, rng) => {
        const d = dropRandom(rr, t, 8, rng);
        return coherenceFromRR(d.rr)?.ratio ?? null; // ancien comportement : somme cumulée
    });
    check('8 RR rejetés sur ~75 : ratio conservé à ±25 % avec les instants réels', Math.abs(withTimes / whole - 1) < 0.25, `${f2(withTimes)} vs ${f2(whole)}`);
    check('… et meilleur que la somme cumulée (trous écrasés)', withTimes > cumsum * 1.1, `${f2(withTimes)} vs ${f2(cumsum)}`);
}

{
    const rng = makeRng(51);
    const { rr, times } = genRR(rng, { A: 30, sigma: 8 });
    const withTimes = coherenceFromRR(rr, times);
    const without = coherenceFromRR(rr);
    check('Sans instants : somme cumulée, même résultat qu\'avec instants contigus', withTimes && without && Math.abs(withTimes.ratio - without.ratio) < 1e-6);
    check('Instants de mauvaise longueur ignorés (repli sur la somme cumulée)', coherenceFromRR(rr, times.slice(1))?.ratio === without?.ratio);
    check('RR constants → pas de score (capteur figé)', coherenceFromRR(new Array(70).fill(1000)) === null);
    check('RR constants à 1 ms près → pas de score', coherenceFromRR(Array.from({ length: 70 }, (_, i) => 1000 + (i % 2) * 0.5)) === null);
    check(`Moins de ${COHERENCE_MIN_RR} battements → pas de score`, coherenceFromRR(rr.slice(0, COHERENCE_MIN_RR - 1)) === null);
    check('Moins de 30 s de signal → pas de score', coherenceFromRR(new Array(32).fill(500).map((v, i) => v + (i % 3) * 20)) === null);
    check('Valeurs non numériques → pas de plantage ni de score absurde', (() => {
        const r = coherenceFromRR(rr.map((v, i) => (i === 10 ? NaN : v)));
        return r === null || (Number.isFinite(r.score) && r.score >= 0 && r.score <= 10);
    })());
}

/* ────────────────── B. Détecteur de battements PPG ────────────────── */

console.log('\nB. Détecteur PPG — PpgBeatDetector sur signal caméra simulé');

/** Pouls PPG : montée systolique + onde dicrote. Sommet à ~120 ms. */
function pulse(tau, dic) {
    if (tau < 0 || tau > 1.5) return 0;
    const a = (tau / 0.12) * Math.exp(1 - tau / 0.12);
    const t2 = tau - 0.32;
    const b = t2 > 0 ? dic * (t2 / 0.15) * Math.exp(1 - t2 / 0.15) : 0;
    return a + b;
}

/**
 * Simule ~durS secondes de canal rouge à `fps` images/s.
 * Les VALEURS sont échantillonnées à l'instant vrai de l'image ; le détecteur reçoit
 * un instant bruité (tJitter) — comme un horodatage de navigateur imparfait.
 */
function simulatePpg(seed, p = {}) {
    const rng = makeRng(seed);
    const {
        durS = 120, fps = 30, tJitter = 0.003, base = 1000, A = 45, fResp = 0.1, sigmaRR = 10,
        m = 0.1, bAmp = 0.3, drift = 0.3, noise = 0.1, dic = 0.15, dropped = [], spikes = 0,
    } = p;
    const ph = [rng.rnd() * 6.28, rng.rnd() * 6.28, rng.rnd() * 6.28];

    const bt = [0.5];
    const rrTrue = [];
    while (bt[bt.length - 1] < durS + 3) {
        const t = bt[bt.length - 1];
        const r = base + A * Math.sin(2 * Math.PI * fResp * t + ph[0]) + sigmaRR * rng.gauss();
        bt.push(t + r / 1000);
        rrTrue.push(r);
    }
    const missed = new Set(dropped);
    const spikeAt = Array.from({ length: spikes }, () => 8 + rng.rnd() * (durS - 12));

    const sig = (t) => {
        let lo = 0;
        let hi = bt.length - 1;
        while (lo < hi) {
            const mid = (lo + hi + 1) >> 1;
            if (bt[mid] <= t) lo = mid;
            else hi = mid - 1;
        }
        let s = 0;
        for (let i = lo; i >= 0 && t - bt[i] < 1.5; i--) if (!missed.has(i)) s += pulse(t - bt[i], dic);
        s *= 1 + m * Math.sin(2 * Math.PI * fResp * t + ph[1]);
        for (const ts of spikeAt) s += 1.3 * Math.exp(-((t - ts) ** 2) / (2 * 0.05 ** 2));
        return 120 + s + bAmp * Math.sin(2 * Math.PI * fResp * t + ph[2]) + drift * Math.sin(2 * Math.PI * 0.03 * t);
    };

    const frames = [];
    for (let j = 0; j / fps < durS; j++) {
        const tTrue = j / fps;
        let v = 0;
        for (let q = 0; q < 4; q++) v += sig(tTrue - (0.5 / fps) * (q / 3)); // pose de ~½ période
        frames.push({ t: tTrue + tJitter * rng.gauss(), v: v / 4 + noise * rng.gauss() });
    }
    return { frames, bt, rrTrue };
}

function runDetector(frames, { duplicate = false, gapAt = null, gapS = 0 } = {}) {
    const beats = [];
    const det = new PpgBeatDetector({ onBeat: (rr, bpm, t) => beats.push({ rr, bpm, t }) });
    for (const f of frames) {
        const t = gapAt !== null && f.t >= gapAt ? f.t + gapS : f.t;
        det.push(t, f.v);
        if (duplicate) det.push(t + 0.0004, f.v); // même image relue (rAF 60 Hz sur caméra 30 fps)
    }
    return beats;
}

function evaluate(sim, beats, from = 12) {
    const trueIdx = sim.bt.map((t, i) => i).filter((i) => sim.bt[i] >= from && sim.bt[i] <= sim.frames[sim.frames.length - 1].t && i > 0);
    const rrTrue = trueIdx.map((i) => sim.rrTrue[i - 1]);
    const est = beats.filter((b) => b.t >= from);
    const rrEst = est.map((b) => b.rr);
    return {
        kept: (100 * rrEst.length) / rrTrue.length,
        rmssdTrue: computeRmssd(rrTrue),
        rmssdEst: computeRmssd(rrEst),
        meanTrue: mean(rrTrue),
        meanEst: mean(rrEst),
        rrEst,
        est,
    };
}

function sweep(label, params, seeds, thresholds) {
    const rows = seeds.map((s) => {
        const sim = simulatePpg(s, params);
        return evaluate(sim, runDetector(sim.frames));
    });
    const kept = mean(rows.map((r) => r.kept));
    const dRmssd = mean(rows.map((r) => Math.abs(r.rmssdEst - r.rmssdTrue)));
    const dMean = mean(rows.map((r) => Math.abs(r.meanEst - r.meanTrue)));
    const detail = `RR conservés ${f1(kept)} %, |ΔRMSSD| ${f1(dRmssd)} ms (vrai ${f1(mean(rows.map((r) => r.rmssdTrue)))}), |Δ RR moyen| ${f1(dMean)} ms`;
    check(label, kept >= thresholds.kept && dRmssd <= thresholds.dRmssd && dMean <= thresholds.dMean, detail);
    return rows;
}

const SEEDS = [101, 102, 103, 104, 105, 106];

sweep('Ligne de base propre', { m: 0, bAmp: 0, drift: 0 }, SEEDS, { kept: 95, dRmssd: 12, dMean: 3 });
sweep('Ligne de base modérée (dérive + respiration)', {}, SEEDS, { kept: 95, dRmssd: 12, dMean: 3 });
sweep('Ligne de base forte (dérive 1.5, respiration 1.0, modulation 20 %)', { m: 0.2, bAmp: 1, drift: 1.5 }, SEEDS, { kept: 95, dRmssd: 12, dMean: 3 });
// Limite connue : la détection au sommet du pouls (plat) transforme le bruit en gigue de
// timing, qui GONFLE le RMSSD (jamais sous-estimé). On ne vérifie donc ici que ce qui reste
// garanti (RR conservés, RR moyen) ; l'inflation est affichée dans le détail, pas masquée.
sweep('Signal bruité (bruit ×3) — RMSSD gonflé, limite connue', { noise: 0.3 }, SEEDS, { kept: 90, dRmssd: Infinity, dMean: 5 });
sweep('Onde dicrote marquée', { dic: 0.3 }, SEEDS, { kept: 95, dRmssd: 12, dMean: 3 });
sweep('FC élevée (RR 700 ms)', { base: 700, A: 35 }, SEEDS, { kept: 95, dRmssd: 12, dMean: 3 });
sweep('FC basse (RR 1250 ms)', { base: 1250, A: 55 }, SEEDS, { kept: 95, dRmssd: 14, dMean: 3 });
sweep('Caméra à 24 images/s', { fps: 24 }, SEEDS, { kept: 95, dRmssd: 14, dMean: 3 });
sweep('Caméra à 60 images/s', { fps: 60 }, SEEDS, { kept: 95, dRmssd: 12, dMean: 3 });
sweep('Gigue d\'horodatage de 8 ms', { tJitter: 0.008 }, SEEDS, { kept: 95, dRmssd: 20, dMean: 3 });

{
    // Images relues deux fois (repli rAF 60 Hz) : les doublons doivent être sans effet.
    const sim = simulatePpg(201);
    const a = evaluate(sim, runDetector(sim.frames));
    const b = evaluate(sim, runDetector(sim.frames, { duplicate: true }));
    check('Doublons d\'images ignorés', a.rrEst.length === b.rrEst.length && Math.abs(a.rmssdEst - b.rmssdEst) < 1e-6, `${a.rrEst.length} RR dans les deux cas`);
}

{
    // BPM affiché : doit rester proche de la vraie fréquence cardiaque.
    const sim = simulatePpg(202, { base: 1000, A: 30 });
    const beats = runDetector(sim.frames);
    const last = beats[beats.length - 1];
    check('BPM lissé proche du vrai (60 ± 3)', Math.abs(last.bpm - 60) <= 3, `${last.bpm} bpm`);
}

{
    // Battements manqués (pouls absent) : pas de RR double, pas de blocage.
    const sim = simulatePpg(203, { dropped: [30, 31, 55, 80, 81, 82] });
    const ev = evaluate(sim, runDetector(sim.frames));
    const bad = ev.rrEst.filter((r) => r < 600 || r > 1400).length;
    check('Battements manqués : aucun RR aberrant émis', bad === 0, `${bad} RR hors [600, 1400] ms`);
    check('… et le détecteur ne se bloque pas', ev.kept >= 85, `${f1(ev.kept)} % des RR conservés`);
}

{
    // Artefacts de mouvement (pics parasites plus hauts que le pouls).
    const sim = simulatePpg(204, { spikes: 8 });
    const ev = evaluate(sim, runDetector(sim.frames));
    const bad = ev.rrEst.filter((r) => r < 700 || r > 1300).length;
    check('Pics parasites : aucun RR aberrant émis', bad === 0, `${bad} RR hors [700, 1300] ms`);
    check('… et le détecteur se resynchronise', ev.kept >= 85, `${f1(ev.kept)} % des RR conservés`);
}

{
    // Trou de 2 s dans les images (onglet figé) : le détecteur repart proprement.
    const sim = simulatePpg(205, { durS: 100 });
    const beats = runDetector(sim.frames, { gapAt: 40, gapS: 2 });
    const after = beats.filter((b) => b.t > 42);
    const resume = after.length ? after[0].t - 42 : Infinity;
    const insane = beats.filter((b) => b.rr < 600 || b.rr > 1400).length;
    check('Trou de 2 s : reprise des battements en < 10 s', resume < 10, `${f1(resume)} s`);
    check('… sans RR absurde à cause du trou', insane === 0, `${insane} RR hors [600, 1400] ms`);
}

{
    // Fidélité de bout en bout : score de cohérence calculé sur les battements détectés.
    const runScore = (seed, params) => {
        const sim = simulatePpg(seed, { durS: 130, ...params });
        const beats = runDetector(sim.frames).filter((b) => b.t >= 12);
        const detected = coherenceFromRR(beats.map((b) => b.rr), beats.map((b) => b.t));
        const truthBeats = sim.bt.map((t, i) => ({ t, rr: sim.rrTrue[i - 1] })).filter((b, i) => i > 0 && b.t >= 12 && b.t <= 128);
        const truth = coherenceFromRR(truthBeats.map((b) => b.rr), truthBeats.map((b) => b.t));
        return { detected: detected?.score ?? NaN, truth: truth?.score ?? NaN };
    };
    const strong = [301, 302, 303, 304].map((s) => runScore(s, { A: 45, sigmaRR: 10 }));
    const none = [311, 312, 313, 314].map((s) => runScore(s, { A: 0, sigmaRR: 15 }));
    const strongGap = mean(strong.map((r) => Math.abs(r.detected - r.truth)));
    check('Cohérence forte : score détecté ≈ score réel (écart < 1)', strongGap < 1, `détecté ${f1(mean(strong.map((r) => r.detected)))} / réel ${f1(mean(strong.map((r) => r.truth)))}`);
    check('Aucune RSA : score détecté < 2.5 (pas de faux positif)', mean(none.map((r) => r.detected)) < 2.5, `détecté ${f1(mean(none.map((r) => r.detected)))} / réel ${f1(mean(none.map((r) => r.truth)))}`);
    check('Aucune RSA mais respiration qui module le signal : toujours < 2.5', (() => {
        const rows = [321, 322, 323, 324].map((s) => runScore(s, { A: 0, sigmaRR: 15, m: 0.3, bAmp: 1.5 }));
        return mean(rows.map((r) => r.detected)) < 2.5;
    })());

    // Sous bruit fort le score est tiré vers le bas (le bruit de timing étale la puissance
    // hors du pic), mais il doit rester discriminant : cohérence réelle ≫ pas de cohérence.
    const strongNoisy = [331, 332, 333, 334].map((s) => runScore(s, { A: 45, sigmaRR: 10, noise: 0.3 }));
    const noneNoisy = [341, 342, 343, 344].map((s) => runScore(s, { A: 0, sigmaRR: 15, noise: 0.3 }));
    const sN = mean(strongNoisy.map((r) => r.detected));
    const nN = mean(noneNoisy.map((r) => r.detected));
    check('Bruit ×3 : le score reste discriminant (cohérence ≫ aucune RSA)', sN - nN >= 2.5 && nN < 2.5, `cohérence ${f1(sN)} vs aucune RSA ${f1(nN)} (réel ${f1(mean(strongNoisy.map((r) => r.truth)))})`);
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
