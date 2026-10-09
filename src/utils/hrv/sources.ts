/**
 * Sources d'intervalles RR (IBI) pour le module Cohérence cardiaque.
 *
 * Interface commune : une source émet à chaque battement l'intervalle RR (ms)
 * et le BPM instantané correspondant. Trois implémentations :
 *   - DemoRrSource    : onde VRC sinusoïdale simulée (Mode Démo, sans capteur)
 *   - BleHeartRateSource : ceintures/capteurs BLE (service Heart Rate 0x180D)
 *   - CameraPpgSource : photopléthysmographie par caméra (canal rouge)
 */

export interface RrSourceOptions {
    /** Appelé à chaque battement : RR en ms + BPM instantané (60000/RR). */
    onRr: (ibiMs: number, bpm: number) => void;
    /** Message d'état lisible (connexion, erreur…). */
    onStatus?: (status: string) => void;
}

export interface RrSource {
    start(): Promise<void>;
    stop(): void;
}

/** Générateur de gaussienne (Box-Muller) pour un bruit réaliste. */
export function gaussian(mean = 0, stdDev = 1): number {
    let u = 0;
    let v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return mean + stdDev * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/**
 * Mode Démo : simule une VRC sinusoïdale réaliste calée sur la fréquence
 * respiratoire choisie (cpm), avec bruit gaussien et dérive lente — comme un
 * capteur sur une personne qui respire bien.
 */
export class DemoRrSource implements RrSource {
    private timer: number | null = null;
    private stopped = true;
    private t = 0; // temps simulé en secondes
    private readonly opts: RrSourceOptions;
    private readonly getCpm: () => number;

    constructor(opts: RrSourceOptions, getCpm: () => number) {
        this.opts = opts;
        this.getCpm = getCpm;
    }

    start(): Promise<void> {
        this.stopped = false;
        this.t = 0;
        this.opts.onStatus?.('Mode Démo — signal VRC simulé (respiration guidée).');
        this.scheduleNext();
        return Promise.resolve();
    }

    stop(): void {
        this.stopped = true;
        if (this.timer !== null) {
            window.clearTimeout(this.timer);
            this.timer = null;
        }
    }

    private scheduleNext(): void {
        if (this.stopped) return;
        const cpm = this.getCpm();
        const breathHz = cpm / 60;

        // RR ≈ 1000 ms (60 bpm) modulé par la respiration + bruit + dérive lente.
        // Amplitude volontairement généreuse (~45 ms) pour une démo satisfaisante,
        // avec une légère respiration d'amplitude pour rester crédible.
        const amplitude = 38 + 10 * Math.sin(2 * Math.PI * 0.013 * this.t);
        const rr =
            1000 +
            amplitude * Math.sin(2 * Math.PI * breathHz * this.t) +
            7 * Math.sin(2 * Math.PI * 0.01 * this.t) + // dérive thermique lente
            gaussian(0, 13);
        const clamped = Math.max(500, rr);

        this.t += clamped / 1000;
        this.opts.onRr(clamped, Math.round(60000 / clamped));

        this.timer = window.setTimeout(() => this.scheduleNext(), clamped);
    }
}
