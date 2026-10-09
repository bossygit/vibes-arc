/**
 * Source Caméra — photopléthysmographie (PPG).
 *
 * Détection des micro-variations d'absorption de la lumière à la surface de la
 * peau : à chaque battement, le flux sanguin augmente dans les capillaires du
 * doigt, absorbant davantage de lumière — l'intensité du canal Rouge varie.
 *
 * Chaîne de traitement (nécessite un smartphone + HTTPS, torche activée) :
 *   1. Caméra arrière (facingMode environment) + torche si disponible.
 *   2. Moyenne du canal rouge sur un crop central 50×50, ~30 fps.
 *   3. Filtrage passe-haut (soustraction de la moyenne glissante).
 *   4. Détection de pics à seuil adaptatif (0.6 · écart-type) + période
 *      réfractaire de 400 ms (max ~150 BPM).
 *   5. Émission des intervalles RR (ms) et du BPM lissé.
 */

import type { RrSource, RrSourceOptions } from './sources';

/* eslint-disable @typescript-eslint/no-explicit-any */

const BUFFER_SIZE = 150; // ~5 s à 30 fps
const REFRACTORY_PERIOD = 400; // ms entre deux battements → 150 BPM max
const PROCESS_SIZE = 100; // canvas de traitement (crop centré 50×50)

export class CameraPpgSource implements RrSource {
    private readonly opts: RrSourceOptions;
    private readonly video: HTMLVideoElement;
    private readonly processCtx: CanvasRenderingContext2D | null;

    private stream: MediaStream | null = null;
    private running = false;
    private rafId = 0;
    private rawRedBuffer: number[] = [];
    private filteredBuffer: number[] = [];
    private rrIntervals: number[] = [];
    private lastPeakTime = 0;

    constructor(opts: RrSourceOptions, video: HTMLVideoElement, processCanvas: HTMLCanvasElement) {
        this.opts = opts;
        this.video = video;
        this.processCtx = processCanvas.getContext('2d', { willReadFrequently: true });
    }

    async start(): Promise<void> {
        if (!this.processCtx) throw new Error('Canvas de traitement indisponible.');

        this.opts.onStatus?.('Demande d’accès à la caméra… (sur smartphone : caméra arrière, torche conseillée)');
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment',
                width: { ideal: 320 },
                height: { ideal: 240 },
                frameRate: { ideal: 30 },
            },
        });
        this.stream = stream;
        this.video.srcObject = stream;
        await this.video.play();

        // Torche (flash) si le matériel l'expose — améliore nettement le signal.
        try {
            const track = stream.getVideoTracks()[0];
            const capabilities = track.getCapabilities ? (track.getCapabilities() as any) : {};
            if (capabilities?.torch) {
                await track.applyConstraints({ advanced: [{ torch: true }] as any });
            }
        } catch {
            // torche indisponible : on continue sans
        }

        // Réinitialiser l'état de session
        this.rawRedBuffer = [];
        this.filteredBuffer = [];
        this.rrIntervals = [];
        this.lastPeakTime = 0;
        this.running = true;

        this.opts.onStatus?.('Mesure PPG en cours — pose l’index sur la caméra arrière, bouge le moins possible.');
        this.loop();
    }

    stop(): void {
        this.running = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = 0;
        }
        if (this.stream) {
            this.stream.getTracks().forEach((track) => track.stop());
            this.stream = null;
        }
        if (this.video.srcObject) {
            this.video.srcObject = null;
        }
    }

    private loop = (): void => {
        if (!this.running) return;
        this.rafId = requestAnimationFrame(this.loop);
        if (this.video.paused || this.video.ended || !this.processCtx) return;

        // 1. Extraction du canal rouge moyen (crop central 50×50)
        const ctx = this.processCtx;
        ctx.drawImage(this.video, 0, 0, PROCESS_SIZE, PROCESS_SIZE);
        const frame = ctx.getImageData(25, 25, 50, 50).data;
        let redSum = 0;
        const pixelCount = frame.length / 4;
        for (let i = 0; i < frame.length; i += 4) redSum += frame[i];
        const avgRed = redSum / pixelCount;

        // 2. Tampon brut + filtrage passe-haut (moyenne glissante)
        this.rawRedBuffer.push(avgRed);
        if (this.rawRedBuffer.length > BUFFER_SIZE) this.rawRedBuffer.shift();

        if (this.rawRedBuffer.length >= 30) {
            let mean = 0;
            for (const v of this.rawRedBuffer) mean += v;
            mean /= this.rawRedBuffer.length;
            const filtered = avgRed - mean;

            this.filteredBuffer.push(filtered);
            if (this.filteredBuffer.length > 300) this.filteredBuffer.shift();

            // 3. Détection de pics (battements)
            this.detectPeak(filtered, performance.now());
        }
    };

    private detectPeak(currentValue: number, timestamp: number): void {
        const buf = this.filteredBuffer;
        if (buf.length < 30) return;

        // Seuil adaptatif : 0.6 · écart-type local
        let variance = 0;
        for (const v of buf) variance += v * v;
        variance /= buf.length;
        const threshold = Math.sqrt(variance) * 0.6;

        const timeSinceLastPeak = timestamp - this.lastPeakTime;
        const prevValue = buf[buf.length - 2] ?? 0;

        // Pic détecté : au-dessus du seuil, au sommet local, hors période réfractaire
        if (currentValue > threshold && currentValue < prevValue && timeSinceLastPeak > REFRACTORY_PERIOD) {
            if (this.lastPeakTime !== 0) {
                const rr = Math.round(timeSinceLastPeak);
                if (rr >= 250 && rr <= 2500) {
                    this.rrIntervals.push(rr);
                    if (this.rrIntervals.length > 10) this.rrIntervals.shift();

                    const window = this.rrIntervals.slice(-5);
                    const avgRR = window.reduce((a, b) => a + b, 0) / window.length;
                    const bpm = Math.round(60000 / avgRR);
                    this.opts.onRr(rr, bpm);
                }
            }
            this.lastPeakTime = timestamp;
        }
    }
}
