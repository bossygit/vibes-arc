/**
 * Source BLE — ceintures/capteurs de fréquence cardiaque (service Heart Rate 0x180D).
 *
 * Web Bluetooth n'est pas typé dans lib.dom : on décrit localement le strict
 * minimum utilisé (device / GATT), et tout passe par des gardes défensives.
 * Support : Chrome/Edge (desktop & Android). PAS Safari/iOS → proposer la
 * caméra PPG ou le Mode Démo sur iPhone.
 *
 * Caractéristique Heart Rate Measurement (0x2A37), flags :
 *   bit 0 : format du BPM (0 = uint8, 1 = uint16)
 *   bit 3 : energy expended présent (uint16 à sauter)
 *   bit 4 : intervalles RR présents (uint16, unité 1/1024 s)
 */

import type { RrSource, RrSourceOptions } from './sources';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface BluetoothLike {
    requestDevice(options: {
        filters: Array<{ services: string[] }>;
        optionalServices?: string[];
    }): Promise<any>;
}

const HEART_RATE_SERVICE = 'heart_rate'; // 0x180D
const HEART_RATE_MEASUREMENT = 'heart_rate_measurement'; // 0x2A37

export class BleHeartRateSource implements RrSource {
    private readonly opts: RrSourceOptions;
    private device: any = null;
    private characteristic: any = null;
    private handler: ((event: Event) => void) | null = null;
    private disconnectHandler: (() => void) | null = null;

    constructor(opts: RrSourceOptions) {
        this.opts = opts;
    }

    /** Web Bluetooth disponible ? */
    static get supported(): boolean {
        return typeof navigator !== 'undefined' && !!(navigator as any).bluetooth;
    }

    async start(): Promise<void> {
        const bluetooth = (navigator as any).bluetooth as BluetoothLike | undefined;
        if (!bluetooth) {
            throw new Error(
                'Web Bluetooth n’est pas supporté sur ce navigateur. Sur iPhone, utilise la Caméra (PPG) ou le Mode Démo — sur ordinateur/Android, Chrome ou Edge.'
            );
        }

        this.opts.onStatus?.('Recherche d’un capteur cardiaque BLE…');
        const device = await bluetooth.requestDevice({
            filters: [{ services: [HEART_RATE_SERVICE] }],
            optionalServices: [HEART_RATE_SERVICE],
        });
        this.device = device;

        this.disconnectHandler = () => {
            this.opts.onStatus?.('Capteur déconnecté.');
        };
        device.addEventListener?.('gattserverdisconnected', this.disconnectHandler);

        this.opts.onStatus?.('Connexion au capteur…');
        const server = await device.gatt.connect();
        const service = await server.getPrimaryService(HEART_RATE_SERVICE);
        const characteristic = await service.getCharacteristic(HEART_RATE_MEASUREMENT);
        this.characteristic = characteristic;

        this.handler = (event: Event) => {
            const target = event.target as any;
            const value: DataView | undefined = target?.value;
            if (value) this.handleMeasurement(value);
        };
        characteristic.addEventListener('characteristicvaluechanged', this.handler);
        await characteristic.startNotifications();

        this.opts.onStatus?.(`Capteur connecté : ${device.name || 'sans nom'} — mesure en cours.`);
    }

    stop(): void {
        try {
            if (this.characteristic && this.handler) {
                this.characteristic.removeEventListener('characteristicvaluechanged', this.handler);
                this.characteristic.stopNotifications().catch(() => undefined);
            }
        } catch {
            // silencieux : on coupe au mieux
        }
        try {
            if (this.device?.gatt?.connected) {
                this.device.removeEventListener?.('gattserverdisconnected', this.disconnectHandler);
                this.device.gatt.disconnect();
            }
        } catch {
            // silencieux
        }
        this.characteristic = null;
        this.device = null;
        this.handler = null;
        this.disconnectHandler = null;
    }

    /** Parse une notification Heart Rate Measurement → BPM + intervalles RR. */
    private handleMeasurement(data: DataView): void {
        const flags = data.getUint8(0);
        let offset = 1;

        const bpmIs16Bits = (flags & 0x01) !== 0;
        let heartRate = 0;
        if (bpmIs16Bits) {
            heartRate = data.getUint16(offset, true);
            offset += 2;
        } else {
            heartRate = data.getUint8(offset);
            offset += 1;
        }

        if (flags & 0x08) offset += 2; // energy expended (uint16, ignoré)

        const rrPresent = (flags & 0x10) !== 0;
        if (!rrPresent) {
            this.opts.onStatus?.(
                'Ce capteur n’expose pas les intervalles RR (IBI) — le score de cohérence ne peut pas être calculé avec lui.'
            );
            return;
        }

        while (offset + 1 < data.byteLength) {
            const raw = data.getUint16(offset, true); // unité 1/1024 s
            offset += 2;
            const rrMs = (raw * 1000) / 1024;
            if (rrMs >= 250 && rrMs <= 2500) {
                this.opts.onRr(rrMs, heartRate > 0 ? heartRate : Math.round(60000 / rrMs));
            }
        }
    }
}
