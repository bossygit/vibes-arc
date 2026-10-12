/**
 * Cohérence cardiaque — analyse spectrale de la VRC (variabilité du rythme cardiaque).
 *
 * Implémentation du calcul « style HeartMath » :
 *   1. Fenêtre glissante sur les 64 dernières SECONDES de battements (instants
 *      réels fournis par la source ; à défaut, somme cumulée des RR).
 *   2. Rééchantillonnage linéaire à 4 Hz sur une grille régulière. Les trous
 *      laissés par des RR rejetés sont interpolés sur l'axe du temps réel — ils
 *      ne sont pas « recollés » comme le ferait une somme cumulée.
 *   3. Detrending LINÉAIRE (moindres carrés : une FC qui ralentit pendant la
 *      détente ne doit pas fabriquer de puissance basse fréquence) + fenêtre
 *      de Hann.
 *   4. PSD (périodogramme) évaluée sur une grille fine (zero-padding à 2048
 *      points, soit 0.002 Hz de pas) sur les bandes VRC : 0.0033 → 0.40 Hz.
 *      Sans zero-padding, le pas n'est que de ~0.017 Hz : la bande de ±0.015 Hz
 *      autour du pic ne contenait qu'UN bin, et le score dépendait de la
 *      position du pic par rapport à la grille (5 cpm ≠ 4.5 cpm).
 *   5. Pic dominant en zone LF (0.04–0.15 Hz) puis puissance dans ±0.015 Hz.
 *      Ratio de cohérence = P_peak / (P_total − P_peak).
 *   6. Score 0-10 = 10 · tanh(ratio / SCORE_K), niveau Faible / Moyen / Élevé.
 *      Pas de score si la variabilité est quasi nulle (capteur figé, RR constants).
 *
 * Calibration (scénarios synthétiques, 75 s, RR moyen 1000 ms, respiration 0.1 Hz,
 * 400 tirages par scénario ; SCORE_K choisi pour retrouver l'ancienne table) :
 *   sinus 45 ms + bruit 10 ms  → ratio ≈ 5.6  → score ≈ 9.7  (Élevé)
 *   sinus 20 ms + bruit 12 ms  → ratio ≈ 1.9  → score ≈ 6.3  (Moyen)
 *   sinus 10 ms + bruit 20 ms  → ratio ≈ 0.4  → score ≈ 1.5  (Faible)
 *   RR aléatoires ±150 ms      → ratio ≈ 0.27 → score ≈ 1.1  (Faible)
 * Le haut de l'échelle est volontairement serré : une VRC très ample et très
 * régulière sature vers 10. Si la sensibilité doit évoluer, ajuster SCORE_K.
 * Les seuils Faible / Moyen / Élevé (4 et 7) sont propres à Vibes Arc : ils ne
 * sont pas comparables aux scores d'appareils du commerce (emWave, Inner Balance…).
 */

export type CoherenceLevel = 'faible' | 'moyen' | 'eleve';

export interface CoherenceResult {
    /** Score de cohérence 0-10 (1 décimale). */
    score: number;
    /** Niveau associé : Faible (<4), Moyen (4-7), Élevé (≥7). */
    level: CoherenceLevel;
    /** Ratio brut peak / (total − peak) — utile pour debug/calibration. */
    ratio: number;
    /** Fréquence (Hz) du pic dominant en zone LF. 0.1 Hz = 6 cycles/min. */
    peakFreq: number;
}

/** Fenêtre d'affichage des statistiques vivantes (RMSSD, SDNN…) : les 60 derniers RR. */
export const COHERENCE_WINDOW_RR = 60;
/** Nombre minimum d'intervalles pour produire un score. */
export const COHERENCE_MIN_RR = 30;
/** Fenêtre d'analyse spectrale (secondes) : ≈ 6 cycles de respiration à 0.1 Hz. */
export const COHERENCE_WINDOW_S = 64;
/** Durée minimale couverte par les battements pour produire un score (secondes). */
export const COHERENCE_MIN_SPAN_S = 30;
/** Fréquence de rééchantillonnage du signal RR (Hz). */
export const RESAMPLE_FS = 4;
/** Longueur de la grille de fréquences (zero-padding) : pas = RESAMPLE_FS / ZERO_PAD_N ≈ 0.002 Hz. */
export const ZERO_PAD_N = 2048;
/** Zone de recherche du pic : LF (0.04–0.15 Hz). */
export const LF_BAND: readonly [number, number] = [0.04, 0.15];
/** Bande totale analysée : 0.0033–0.40 Hz (VLF + LF + HF). */
export const TOTAL_BAND: readonly [number, number] = [0.0033, 0.4];
/** Demi-largeur de la bande autour du pic (±0.015 Hz). */
export const PEAK_BAND_HZ = 0.015;
/** Constante du mapping ratio → score (10 · tanh(ratio / K)). */
export const SCORE_K = 2.5;
/** Écart-type minimal (ms) du signal RR détrendé ; en dessous, la mesure n'a pas de sens. */
export const MIN_VARIABILITY_MS = 1.5;

export const LEVEL_LABELS: Record<CoherenceLevel, string> = {
    faible: 'Faible',
    moyen: 'Moyen',
    eleve: 'Élevé',
};

/** Fenêtre de Hann : w(i) = 0.5 · (1 − cos(2πi / (N−1))). */
function hann(i: number, n: number): number {
    if (n <= 1) return 1;
    return 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)));
}

export function levelFromScore(score: number): CoherenceLevel {
    if (score >= 7) return 'eleve';
    if (score >= 4) return 'moyen';
    return 'faible';
}

/** Tables cos/sin de la grille de zero-padding, calculées une seule fois. */
let cosTable: Float64Array | null = null;
let sinTable: Float64Array | null = null;
function twiddles(): [Float64Array, Float64Array] {
    if (!cosTable || !sinTable) {
        cosTable = new Float64Array(ZERO_PAD_N);
        sinTable = new Float64Array(ZERO_PAD_N);
        for (let i = 0; i < ZERO_PAD_N; i++) {
            cosTable[i] = Math.cos((2 * Math.PI * i) / ZERO_PAD_N);
            sinTable[i] = Math.sin((2 * Math.PI * i) / ZERO_PAD_N);
        }
    }
    return [cosTable, sinTable];
}

/**
 * Calcule le score de cohérence à partir de la série d'intervalles RR (ms).
 *
 * beatTimesSec (optionnel, même longueur que rrMs) : instant réel de chaque
 * battement. À fournir dès que la source peut rejeter des battements : sans
 * lui, les RR sont supposés contigus (somme cumulée), ce qui est exact pour une
 * ceinture BLE ou la démo, mais écrase les trous d'une source caméra.
 *
 * Retourne null tant que la fenêtre n'est pas exploitable (< 30 battements,
 * < 30 s couvertes) ou que la variabilité est quasi nulle.
 */
export function coherenceFromRR(rrMs: number[], beatTimesSec?: number[]): CoherenceResult | null {
    const total = rrMs.length;
    if (total < COHERENCE_MIN_RR) return null;

    // 1) Instants des battements (s) : fournis par la source, sinon somme cumulée
    let times: ArrayLike<number>;
    if (beatTimesSec && beatTimesSec.length === total) {
        times = beatTimesSec;
    } else {
        const cumulative = new Float64Array(total);
        let acc = 0;
        for (let i = 0; i < total; i++) {
            acc += rrMs[i] / 1000;
            cumulative[i] = acc;
        }
        times = cumulative;
    }

    // 2) Fenêtre : battements des COHERENCE_WINDOW_S dernières secondes
    const tEnd = times[total - 1];
    if (!Number.isFinite(tEnd)) return null;
    let first = total - 1;
    while (first > 0 && times[first - 1] >= tEnd - COHERENCE_WINDOW_S) first--;
    const n = total - first;
    const t0 = times[first];
    if (n < COHERENCE_MIN_RR || tEnd - t0 < COHERENCE_MIN_SPAN_S) return null;

    // 3) Rééchantillonnage linéaire à 4 Hz sur l'axe du temps réel (les trous sont interpolés)
    const num = Math.floor((tEnd - t0) * RESAMPLE_FS) + 1;
    if (num < 32 || num > ZERO_PAD_N) return null;
    const x = new Float64Array(num);
    let j = first;
    for (let i = 0; i < num; i++) {
        const ct = t0 + i / RESAMPLE_FS;
        while (j < total - 2 && times[j + 1] < ct) j++;
        const ta = times[j];
        const tb = times[j + 1];
        const ya = rrMs[j];
        const yb = rrMs[j + 1];
        const u = tb > ta ? (ct - ta) / (tb - ta) : 0;
        x[i] = ya + (yb - ya) * Math.min(1, Math.max(0, u));
    }

    // 4) Detrending linéaire (moindres carrés) + fenêtrage de Hann
    let sx = 0;
    let sy = 0;
    let sxx = 0;
    let sxy = 0;
    for (let i = 0; i < num; i++) {
        sx += i;
        sy += x[i];
        sxx += i * i;
        sxy += i * x[i];
    }
    const slope = (num * sxy - sx * sy) / (num * sxx - sx * sx);
    const intercept = (sy - slope * sx) / num;
    const xw = new Float64Array(num);
    let sumSq = 0;
    for (let i = 0; i < num; i++) {
        const r = x[i] - (intercept + slope * i);
        sumSq += r * r;
        xw[i] = r * hann(i, num);
    }
    // Aucune variabilité (capteur figé, RR constants) : un score serait un artefact de calcul
    if (!Number.isFinite(sumSq) || Math.sqrt(sumSq / num) < MIN_VARIABILITY_MS) return null;

    // 5) PSD (périodogramme) sur la grille fine zero-paddée, bande VRC uniquement
    const [cosT, sinT] = twiddles();
    const df = RESAMPLE_FS / ZERO_PAD_N;
    const kMin = Math.max(1, Math.ceil(TOTAL_BAND[0] / df));
    const kMax = Math.floor(TOTAL_BAND[1] / df);
    const freqs: number[] = [];
    const powers: number[] = [];
    for (let k = kMin; k <= kMax; k++) {
        let re = 0;
        let im = 0;
        for (let i = 0; i < num; i++) {
            const idx = (k * i) % ZERO_PAD_N;
            re += xw[i] * cosT[idx];
            im -= xw[i] * sinT[idx];
        }
        freqs.push(k * df);
        powers.push((re * re + im * im) / num);
    }
    if (powers.length === 0) return null;

    // 6) Pic dominant en zone LF (0.04–0.15 Hz) + puissance dans ±0.015 Hz
    let totalPower = 0;
    let bestLf = -1;
    let peakFreq = 0.1;
    for (let i = 0; i < freqs.length; i++) {
        totalPower += powers[i];
        const f = freqs[i];
        if (f >= LF_BAND[0] && f <= LF_BAND[1] && powers[i] > bestLf) {
            bestLf = powers[i];
            peakFreq = f;
        }
    }
    if (!(totalPower > 0)) return null;
    let peakPower = 0;
    for (let i = 0; i < freqs.length; i++) {
        if (Math.abs(freqs[i] - peakFreq) <= PEAK_BAND_HZ) peakPower += powers[i];
    }
    const rest = totalPower - peakPower;
    const ratio = rest > totalPower * 1e-6 ? peakPower / rest : 20;

    // 7) Score 0-10
    const score = Math.round(10 * Math.tanh(Math.min(ratio, 20) / SCORE_K) * 10) / 10;
    return { score, level: levelFromScore(score), ratio, peakFreq };
}

/** Lissage exponentiel du score glissant (évite les sauts d'affichage). */
export function emaScore(previous: number | null, next: number, alpha = 0.25): number {
    if (previous === null) return next;
    return Math.round((previous + alpha * (next - previous)) * 100) / 100;
}
