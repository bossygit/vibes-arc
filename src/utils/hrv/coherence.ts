/**
 * Cohérence cardiaque — analyse spectrale de la VRC (variabilité du rythme cardiaque).
 *
 * Implémentation du calcul « style HeartMath » :
 *   1. Fenêtre glissante sur les 60 derniers intervalles RR (IBI, en ms).
 *   2. Rééchantillonnage linéaire à 4 Hz sur une grille régulière.
 *   3. Detrending (soustraction de la moyenne) + fenêtre de Hann.
 *   4. PSD (périodogramme) sur les bandes VRC : VLF/LF/HF (0.0033 → 0.40 Hz).
 *   5. Pic dominant en zone LF (0.04–0.15 Hz) puis puissance dans ±0.015 Hz.
 *      Ratio de cohérence = P_peak / (P_total − P_peak).
 *   6. Score 0-10 = 10 · tanh(ratio / 1.35), niveau Faible / Moyen / Élevé.
 *
 * Calibration (scénarios synthétiques, fenêtre 60 RR) :
 *   sinus 45 ms + bruit 10 ms  → ratio ≈ 1.5–1.9 → score ≈ 8–9  (Élevé)
 *   sinus 20 ms + bruit 12 ms  → ratio ≈ 0.7–1.4 → score ≈ 6–7  (Moyen/Élevé)
 *   sinus 10 ms + bruit 20 ms  → ratio ≈ 0.2–0.3 → score ≈ 1.5–2 (Faible)
 *   RR aléatoires              → ratio ≈ 0.1–0.2 → score ≈ 0.5–1.5 (Faible)
 * La constante SCORE_K reste ajustable si la sensibilité doit évoluer.
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

/** Fenêtre d'analyse : les 60 derniers intervalles RR (spec). */
export const COHERENCE_WINDOW_RR = 60;
/** Nombre minimum d'intervalles pour produire un score. */
export const COHERENCE_MIN_RR = 30;
/** Fréquence de rééchantillonnage du signal RR (Hz). */
export const RESAMPLE_FS = 4;
/** Zone de recherche du pic : LF (0.04–0.15 Hz). */
export const LF_BAND: readonly [number, number] = [0.04, 0.15];
/** Bande totale analysée : 0.0033–0.40 Hz (VLF + LF + HF). */
export const TOTAL_BAND: readonly [number, number] = [0.0033, 0.4];
/** Demi-largeur de la bande autour du pic (±0.015 Hz). */
export const PEAK_BAND_HZ = 0.015;
/** Constante du mapping ratio → score (10 · tanh(ratio / K)). */
export const SCORE_K = 1.35;

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

/**
 * Calcule le score de cohérence à partir de la série d'intervalles RR (ms).
 * Retourne null tant que la fenêtre n'est pas exploitable (< 30 RR).
 */
export function coherenceFromRR(rrMs: number[]): CoherenceResult | null {
    const rr = rrMs.length > COHERENCE_WINDOW_RR ? rrMs.slice(-COHERENCE_WINDOW_RR) : rrMs.slice();
    const n = rr.length;
    if (n < COHERENCE_MIN_RR) return null;

    // 1) Timestamps cumulés des battements (secondes)
    const beats = new Float64Array(n);
    let acc = 0;
    for (let i = 0; i < n; i++) {
        acc += rr[i] / 1000;
        beats[i] = acc;
    }
    const num = Math.floor(acc * RESAMPLE_FS);
    if (num < 32) return null;

    // 2) Rééchantillonnage linéaire à 4 Hz sur grille régulière
    const x = new Float64Array(num);
    let j = 0;
    for (let i = 0; i < num; i++) {
        const ct = i / RESAMPLE_FS;
        if (ct <= beats[0]) {
            x[i] = rr[0];
            continue;
        }
        while (j < n - 2 && beats[j + 1] < ct) j++;
        const t0 = beats[j];
        const t1 = beats[j + 1];
        const y0 = rr[j];
        const y1 = rr[j + 1];
        x[i] = t1 > t0 ? y0 + (y1 - y0) * ((ct - t0) / (t1 - t0)) : y0;
    }

    // 3) Detrending + fenêtrage de Hann
    let mean = 0;
    for (let i = 0; i < num; i++) mean += x[i];
    mean /= num;
    const xw = new Float64Array(num);
    for (let i = 0; i < num; i++) xw[i] = (x[i] - mean) * hann(i, num);

    // 4) PSD (périodogramme) sur la bande VRC
    const df = RESAMPLE_FS / num;
    const freqs: number[] = [];
    const powers: number[] = [];
    for (let k = 1; k < num / 2; k++) {
        const f = k * df;
        if (f < TOTAL_BAND[0] || f > TOTAL_BAND[1]) continue;
        let re = 0;
        let im = 0;
        const w = (2 * Math.PI * k) / num;
        for (let i = 0; i < num; i++) {
            const a = w * i;
            re += xw[i] * Math.cos(a);
            im -= xw[i] * Math.sin(a);
        }
        freqs.push(f);
        powers.push((re * re + im * im) / num);
    }
    if (powers.length === 0) return null;

    // 5) Pic dominant en zone LF (0.04–0.15 Hz) + puissance dans ±0.015 Hz
    let total = 0;
    let bestLf = -1;
    let peakFreq = 0.1;
    for (let i = 0; i < freqs.length; i++) {
        total += powers[i];
        const f = freqs[i];
        if (f >= LF_BAND[0] && f <= LF_BAND[1] && powers[i] > bestLf) {
            bestLf = powers[i];
            peakFreq = f;
        }
    }
    let peakPower = 0;
    for (let i = 0; i < freqs.length; i++) {
        if (Math.abs(freqs[i] - peakFreq) <= PEAK_BAND_HZ) peakPower += powers[i];
    }
    const rest = total - peakPower;
    const ratio = rest > 1e-9 ? peakPower / rest : 20;

    // 6) Score 0-10
    const score = Math.round(10 * Math.tanh(Math.min(ratio, 20) / SCORE_K) * 10) / 10;
    return { score, level: levelFromScore(score), ratio, peakFreq };
}

/** Lissage exponentiel du score glissant (évite les sauts d'affichage). */
export function emaScore(previous: number | null, next: number, alpha = 0.25): number {
    if (previous === null) return next;
    return Math.round((previous + alpha * (next - previous)) * 100) / 100;
}
