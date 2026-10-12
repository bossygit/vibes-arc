/**
 * Détecteur de battements PPG — pur (aucun accès DOM), donc testable en Node.
 *
 * Entrée : des échantillons (instant en secondes, intensité moyenne du canal
 * rouge) fournis par ppgCamera.ts, UN par image vidéo réelle, avec l'instant de
 * capture de l'image (pas l'instant du tick d'affichage).
 *
 * Chaîne de traitement :
 *   1. Passe-bande 0.7–3.5 Hz : deux biquads Butterworth (passe-haut puis
 *      passe-bas). Le passe-haut retire la dérive de ligne de base ET la
 *      respiration (0.1 Hz) qui s'infiltre dans le signal ; le passe-bas coupe
 *      le bruit de capteur. Les coefficients suivent la cadence mesurée.
 *   2. Candidats = maxima locaux de l'enveloppe, au-dessus de 35 % de
 *      l'amplitude max des 3 dernières secondes ; instant du sommet affiné par
 *      interpolation parabolique (précision bien inférieure à la période
 *      d'image de ~33 ms).
 *   3. Période réfractaire adaptative (≈ 0.45 × RR médian, bornée à 0.30–0.50 s) :
 *      dans cette fenêtre on garde le sommet le plus haut — l'onde dicrote,
 *      plus basse que le pic systolique, ne compte donc pas comme un battement.
 *   4. Validation de l'RR : écart ≤ 25 % de la médiane des 8 derniers RR
 *      acceptés. Un pic rejeté comme trop court (parasite) ne déplace PAS le
 *      dernier battement de référence ; un pic rejeté comme trop long (battement
 *      manqué) resynchronise la référence sans émettre d'RR ; après 4 rejets
 *      consécutifs l'historique est réinitialisé.
 *   5. Émission de (RR ms, BPM lissé sur 5 battements, instant du battement en s).
 */

export interface PpgDetectorOptions {
    /** Appelé pour chaque battement validé. timeSec = instant du sommet (même base que push). */
    onBeat: (rrMs: number, bpm: number, timeSec: number) => void;
}

interface Peak {
    t: number;
    y: number;
}

const HP_HZ = 0.7;
const LP_HZ = 3.5;
const NOMINAL_FS = 30;
const WARMUP_S = 4;
const ENV_WINDOW_S = 3;
const PEAK_REL_THRESHOLD = 0.35;
/**
 * Échantillons plus proches que ça = même image vidéo reçue deux fois : ignorés.
 * 5 ms (= 200 images/s) : assez bas pour ne jamais écarter une vraie image d'une
 * caméra 60 images/s dont l'horodatage a de la gigue (à 12 ms, ~13 % étaient perdues).
 */
const MIN_DT_S = 0.005;
/** Trou plus long (onglet en arrière-plan, gel) : le signal est discontinu, on repart à zéro. */
const MAX_GAP_S = 0.25;
const RR_MIN_MS = 330; // 180 bpm
const RR_MAX_MS = 2000; // 30 bpm
const RR_TOLERANCE = 0.25;
const HISTORY_SIZE = 8;
const MIN_HISTORY_FOR_REJECTION = 5;
const MAX_CONSECUTIVE_REJECTS = 4;
const BPM_AVG_BEATS = 5;

/** Filtre biquad du 2ᵉ ordre (forme directe I), coefficients de l'« Audio EQ Cookbook ». */
class Biquad {
    private b0 = 1;
    private b1 = 0;
    private b2 = 0;
    private a1 = 0;
    private a2 = 0;
    private x1 = 0;
    private x2 = 0;
    private y1 = 0;
    private y2 = 0;

    /** Recalcule les coefficients SANS toucher à l'état interne (pas de saut de sortie). */
    design(kind: 'hp' | 'lp', fc: number, fs: number): void {
        const q = Math.SQRT1_2; // Butterworth
        const w0 = (2 * Math.PI * fc) / fs;
        const c = Math.cos(w0);
        const alpha = Math.sin(w0) / (2 * q);
        const a0 = 1 + alpha;
        if (kind === 'lp') {
            this.b0 = (1 - c) / 2 / a0;
            this.b1 = (1 - c) / a0;
            this.b2 = (1 - c) / 2 / a0;
        } else {
            this.b0 = (1 + c) / 2 / a0;
            this.b1 = -(1 + c) / a0;
            this.b2 = (1 + c) / 2 / a0;
        }
        this.a1 = (-2 * c) / a0;
        this.a2 = (1 - alpha) / a0;
    }

    process(x: number): number {
        const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
        this.x2 = this.x1;
        this.x1 = x;
        this.y2 = this.y1;
        this.y1 = y;
        return y;
    }

    reset(): void {
        this.x1 = 0;
        this.x2 = 0;
        this.y1 = 0;
        this.y2 = 0;
    }
}

function median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
}

export class PpgBeatDetector {
    private readonly onBeat: PpgDetectorOptions['onBeat'];
    private readonly hp = new Biquad();
    private readonly lp = new Biquad();

    private lastT: number | null = null;
    private startT = 0;
    private v0 = 0;
    private dtEma = 1 / NOMINAL_FS;
    private designFs = NOMINAL_FS;

    private s0: Peak | null = null;
    private s1: Peak | null = null;
    private s2: Peak | null = null;
    private env: Peak[] = [];

    private pending: Peak | null = null;
    private lastBeat: Peak | null = null;
    private history: number[] = [];
    private consecutiveRejects = 0;

    constructor(opts: PpgDetectorOptions) {
        this.onBeat = opts.onBeat;
        this.designFilters(NOMINAL_FS);
    }

    /** Repart de zéro (début de session ou signal discontinu). La cadence estimée est conservée. */
    reset(): void {
        this.lastT = null;
        this.hp.reset();
        this.lp.reset();
        this.s0 = null;
        this.s1 = null;
        this.s2 = null;
        this.env = [];
        this.pending = null;
        this.lastBeat = null;
        this.history = [];
        this.consecutiveRejects = 0;
    }

    /** Un échantillon par image vidéo : instant de capture (s) + intensité moyenne du canal rouge. */
    push(tSec: number, value: number): void {
        if (!Number.isFinite(tSec) || !Number.isFinite(value)) return;

        if (this.lastT !== null) {
            const dt = tSec - this.lastT;
            if (dt < MIN_DT_S) return;
            if (dt > MAX_GAP_S) this.reset();
            else this.updateSampleRate(dt);
        }
        if (this.lastT === null) {
            this.startT = tSec;
            this.v0 = value;
            this.designFilters(this.designFs);
        }
        this.lastT = tSec;

        // 1. Passe-bande (on retire d'abord le niveau initial pour éviter un gros transitoire)
        const y = this.lp.process(this.hp.process(value - this.v0));

        this.pushEnvelope(tSec, Math.abs(y));
        this.s0 = this.s1;
        this.s1 = this.s2;
        this.s2 = { t: tSec, y };
        if (tSec - this.startT < WARMUP_S) return;

        // 2-3. Candidat de pic, puis confirmation à la fin de la période réfractaire
        this.detectCandidate();
        if (this.pending && tSec - this.pending.t >= this.refractorySec()) {
            this.confirm(this.pending);
            this.pending = null;
        }
    }

    private designFilters(fs: number): void {
        const fsClamped = Math.min(120, Math.max(8, fs));
        this.hp.design('hp', HP_HZ, fsClamped);
        this.lp.design('lp', Math.min(LP_HZ, 0.4 * fsClamped), fsClamped);
        this.designFs = fsClamped;
    }

    private updateSampleRate(dt: number): void {
        this.dtEma = 0.97 * this.dtEma + 0.03 * dt;
        const fs = 1 / this.dtEma;
        if (Math.abs(fs - this.designFs) / this.designFs > 0.08) this.designFilters(fs);
    }

    private pushEnvelope(t: number, a: number): void {
        this.env.push({ t, y: a });
        while (this.env.length > 0 && this.env[0].t < t - ENV_WINDOW_S) this.env.shift();
    }

    private envelopeMax(): number {
        let max = 0;
        for (const e of this.env) if (e.y > max) max = e.y;
        return max;
    }

    private refractorySec(): number {
        if (this.history.length < 3) return 0.4;
        const r = (0.45 * median(this.history)) / 1000;
        return Math.min(0.5, Math.max(0.3, r));
    }

    private detectCandidate(): void {
        const { s0, s1, s2 } = this;
        if (!s0 || !s1 || !s2) return;
        if (!(s1.y > s0.y && s1.y >= s2.y && s1.y > 0)) return;
        if (s1.y < PEAK_REL_THRESHOLD * this.envelopeMax()) return;

        // Interpolation parabolique du sommet (s0, s1, s2)
        const den = s0.y - 2 * s1.y + s2.y;
        let d = den !== 0 ? (0.5 * (s0.y - s2.y)) / den : 0;
        d = Math.max(-1, Math.min(1, d));
        const candidate: Peak = { t: s1.t + d * 0.5 * (s2.t - s0.t), y: s1.y };

        if (this.pending) {
            if (candidate.t - this.pending.t < this.refractorySec()) {
                // Même battement (onde dicrote, bruit) : on garde le sommet le plus haut
                if (candidate.y > this.pending.y) this.pending = candidate;
                return;
            }
            this.confirm(this.pending);
        }
        this.pending = candidate;
    }

    private confirm(peak: Peak): void {
        if (this.lastBeat === null) {
            this.lastBeat = peak;
            return;
        }
        const rr = (peak.t - this.lastBeat.t) * 1000;
        const ref = this.history.length >= MIN_HISTORY_FOR_REJECTION ? median(this.history) : null;

        let valid = rr >= RR_MIN_MS && rr <= RR_MAX_MS;
        let tooLong = rr > RR_MAX_MS;
        if (valid && ref !== null && Math.abs(rr - ref) > RR_TOLERANCE * ref) {
            valid = false;
            tooLong = rr > ref;
        }

        if (valid) {
            this.history.push(rr);
            if (this.history.length > HISTORY_SIZE) this.history.shift();
            this.lastBeat = peak;
            this.consecutiveRejects = 0;
            const recent = this.history.slice(-BPM_AVG_BEATS);
            const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
            this.onBeat(Math.round(rr * 10) / 10, Math.round(60000 / avg), peak.t);
            return;
        }

        this.consecutiveRejects += 1;
        // Trop long = un battement a été manqué : l'intervalle est inexploitable, mais ce
        // pic est un vrai battement → on resynchronise la référence dessus (sans émettre).
        // Trop court = pic parasite : la référence reste le dernier battement accepté.
        if (tooLong) this.lastBeat = peak;
        if (this.consecutiveRejects >= MAX_CONSECUTIVE_REJECTS) {
            this.history = [];
            this.lastBeat = peak;
            this.consecutiveRejects = 0;
        }
    }
}
