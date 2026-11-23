/**
 * Source Caméra — photopléthysmographie (PPG).
 *
 * Détection des micro-variations d'absorption de la lumière à la surface de la
 * peau : à chaque battement, le flux sanguin augmente dans les capillaires du
 * doigt, absorbant davantage de lumière — l'intensité du canal Rouge varie.
 *
 * Chaîne de traitement (nécessite un smartphone + HTTPS, torche activée) :
 *   1. Caméra arrière (facingMode environment) + torche si disponible.
 *   2. Moyenne du canal rouge sur un crop central 50×50, UN échantillon par
 *      image vidéo réelle (~30 fps), horodaté avec l'instant de capture de
 *      l'image via requestVideoFrameCallback (et non le tick d'affichage à
 *      60 Hz, qui relit deux fois la même image et ajoute de la gigue).
 *   3. Inversion (cameraSampleToPulse) : le rouge BAISSE à chaque battement, le
 *      détecteur attend un signal qui MONTE. Puis détection des battements : voir
 *      ppgProcessor.ts (passe-bande 0.7–3.5 Hz, pics interpolés, rejet des RR aberrants).
 *   4. Émission de l'intervalle RR (ms), du BPM lissé et de l'instant du battement.
 *
 * Repli : si requestVideoFrameCallback est absent (iOS < 15.4…) ou ne livre
 * aucune image au bout de 2 s, on lit la caméra à chaque requestAnimationFrame
 * en ignorant les images identiques à la précédente (précision moindre).
 */

import type { RrSource, RrSourceOptions, TorchState } from './sources';
import { PpgBeatDetector, cameraSampleToPulse } from './ppgProcessor';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Déduit l'état réel de la torche. Pur (testable en Node).
 * Une contrainte `advanced` non satisfaite est IGNORÉE sans erreur par le
 * navigateur : seul getSettings().torch confirme que la torche est allumée.
 */
export function torchStateFrom(
    capabilityTorch: unknown,
    applied: boolean,
    settingTorch: unknown
): TorchState {
    if (!capabilityTorch) return 'unavailable';
    if (!applied) return 'off';
    if (settingTorch === true) return 'on';
    if (settingTorch === false) return 'off';
    return 'unknown';
}

const PROCESS_SIZE = 100; // canvas de traitement (crop centré 50×50)
const RVFC_WATCHDOG_MS = 2000;

/** Métadonnées de requestVideoFrameCallback (champs optionnels selon le navigateur). */
interface FrameMetadata {
    captureTime?: number;
    presentationTime?: number;
    expectedDisplayTime?: number;
}

/** Vue minimale de HTMLVideoElement pour requestVideoFrameCallback (absent de certains navigateurs). */
interface RvfcVideo {
    requestVideoFrameCallback?: (callback: (now: number, metadata: FrameMetadata) => void) => number;
    cancelVideoFrameCallback?: (handle: number) => void;
}

export class CameraPpgSource implements RrSource {
    private readonly opts: RrSourceOptions;
    private readonly video: HTMLVideoElement;
    private readonly processCtx: CanvasRenderingContext2D | null;

    private stream: MediaStream | null = null;
    private running = false;
    private detector: PpgBeatDetector | null = null;

    private rvfcHandle = 0;
    private rvfcFrames = 0;
    private watchdogTimer: number | null = null;
    private useRaf = false;
    private rafId = 0;
    private lastAvgRed = -1;

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
        // On continue sans si elle est absente, mais l'état réel est remonté à l'UI.
        this.opts.onTorch?.(await this.enableTorch(stream));

        // Réinitialiser l'état de session
        this.detector = new PpgBeatDetector({
            onBeat: (rrMs, bpm, timeSec) => this.opts.onRr(rrMs, bpm, timeSec),
        });
        this.rvfcFrames = 0;
        this.lastAvgRed = -1;
        this.useRaf = false;
        this.running = true;

        this.opts.onStatus?.('Mesure PPG en cours — pose l’index sur la caméra arrière, bouge le moins possible.');

        if (typeof (this.video as unknown as RvfcVideo).requestVideoFrameCallback === 'function') {
            this.scheduleVideoFrame();
            // Garde-fou : un navigateur qui expose l'API mais ne la déclenche pas
            this.watchdogTimer = window.setTimeout(() => {
                this.watchdogTimer = null;
                if (this.running && this.rvfcFrames === 0) this.startRafFallback();
            }, RVFC_WATCHDOG_MS);
        } else {
            this.startRafFallback();
        }
    }

    stop(): void {
        this.running = false;
        if (this.watchdogTimer !== null) {
            window.clearTimeout(this.watchdogTimer);
            this.watchdogTimer = null;
        }
        if (this.rvfcHandle) {
            (this.video as unknown as RvfcVideo).cancelVideoFrameCallback?.(this.rvfcHandle);
            this.rvfcHandle = 0;
        }
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
        this.detector = null;
    }

    /** Tente d'allumer la torche et renvoie son état réel (jamais d'exception). */
    private async enableTorch(stream: MediaStream): Promise<TorchState> {
        const track = stream.getVideoTracks()[0];
        if (!track) return 'unavailable';
        let capabilityTorch: unknown;
        try {
            capabilityTorch = track.getCapabilities ? (track.getCapabilities() as any)?.torch : undefined;
        } catch {
            capabilityTorch = undefined;
        }
        if (!capabilityTorch) return 'unavailable';
        let applied = false;
        try {
            await track.applyConstraints({ advanced: [{ torch: true }] as any });
            applied = true;
        } catch {
            applied = false;
        }
        let settingTorch: unknown;
        try {
            settingTorch = track.getSettings ? (track.getSettings() as any)?.torch : undefined;
        } catch {
            settingTorch = undefined;
        }
        return torchStateFrom(capabilityTorch, applied, settingTorch);
    }

    /** Moyenne du canal rouge sur le crop central 50×50 de l'image courante (null si indisponible). */
    private readAverageRed(): number | null {
        const ctx = this.processCtx;
        if (!ctx || this.video.paused || this.video.ended) return null;
        ctx.drawImage(this.video, 0, 0, PROCESS_SIZE, PROCESS_SIZE);
        const frame = ctx.getImageData(25, 25, 50, 50).data;
        let redSum = 0;
        for (let i = 0; i < frame.length; i += 4) redSum += frame[i];
        return redSum / (frame.length / 4);
    }

    // ── Voie principale : une image vidéo = un échantillon, horodaté à la capture ──

    private scheduleVideoFrame(): void {
        const video = this.video as unknown as RvfcVideo;
        this.rvfcHandle = video.requestVideoFrameCallback!((now, metadata) => this.onVideoFrame(now, metadata));
    }

    private onVideoFrame(now: number, metadata: FrameMetadata): void {
        if (!this.running || this.useRaf) return;
        this.rvfcFrames += 1;
        // Meilleure horloge disponible, toujours dans la base de performance.now()
        const tMs = metadata?.captureTime ?? metadata?.presentationTime ?? now;
        const avgRed = this.readAverageRed();
        if (avgRed !== null) this.detector?.push(tMs / 1000, cameraSampleToPulse(avgRed));
        this.scheduleVideoFrame();
    }

    // ── Repli : lecture à chaque requestAnimationFrame, images identiques ignorées ──

    private startRafFallback(): void {
        if (!this.running || this.useRaf) return;
        this.useRaf = true;
        if (this.rvfcHandle) {
            (this.video as unknown as RvfcVideo).cancelVideoFrameCallback?.(this.rvfcHandle);
            this.rvfcHandle = 0;
        }
        this.detector?.reset();
        this.rafLoop();
    }

    private rafLoop = (): void => {
        if (!this.running || !this.useRaf) return;
        this.rafId = requestAnimationFrame(this.rafLoop);
        const avgRed = this.readAverageRed();
        // Le tick (60 Hz) est plus rapide que la caméra (30 fps) : même image = même valeur exacte
        if (avgRed === null || avgRed === this.lastAvgRed) return;
        this.lastAvgRed = avgRed;
        this.detector?.push(performance.now() / 1000, cameraSampleToPulse(avgRed));
    };
}
