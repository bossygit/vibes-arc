/**
 * Statistiques de session & historique local — module Cohérence cardiaque.
 *
 * Permet de comparer « Observation libre » (pas de guidage respiratoire) et
 * « Cohérence guidée » (respiration à 4.5-7 cpm) :
 *   - RMSSD : variabilité battement-à-battement (tonus parasympathique)
 *   - SDNN  : écart-type des intervalles RR (variabilité globale)
 *
 * Stockage : localStorage (v1) — suffisant pour comparer sur le même appareil.
 * Étape suivante possible : table Supabase `coherence_sessions` pour croiser
 * ces données avec le coach (Telegram / in-app).
 */

export type PracticeMode = 'guide' | 'libre';

/** Source réelle uniquement — le Mode Démo n'est jamais enregistré. */
export type RealSourceKind = 'camera' | 'ble';

export interface CoherenceSessionRecord {
    id: string;
    /** Fin de session (ISO). */
    endedAt: string;
    mode: PracticeMode;
    source: RealSourceKind;
    durationMs: number;
    beats: number;
    avgScore: number | null;
    /** % du temps passé en cohérence élevée (score ≥ 7). */
    highPct: number;
    avgBpm: number | null;
    rmssd: number | null;
    sdnn: number | null;
}

const STORAGE_KEY = 'vibes-arc-coherence-sessions';
const MAX_SESSIONS = 120;

/** Écart-type des intervalles RR (ms) — variabilité globale. */
export function computeSdnn(rrMs: number[]): number | null {
    if (rrMs.length < 10) return null;
    const mean = rrMs.reduce((a, b) => a + b, 0) / rrMs.length;
    const variance = rrMs.reduce((sum, v) => sum + (v - mean) * (v - mean), 0) / rrMs.length;
    return Math.round(Math.sqrt(variance));
}

/** RMSSD (ms) — racine de la moyenne des carrés des différences successives. */
export function computeRmssd(rrMs: number[]): number | null {
    if (rrMs.length < 10) return null;
    let sum = 0;
    for (let i = 1; i < rrMs.length; i++) {
        const delta = rrMs[i] - rrMs[i - 1];
        sum += delta * delta;
    }
    return Math.round(Math.sqrt(sum / (rrMs.length - 1)));
}

export function loadSessions(): CoherenceSessionRecord[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as CoherenceSessionRecord[]) : [];
    } catch {
        return [];
    }
}

export function appendSession(record: CoherenceSessionRecord): CoherenceSessionRecord[] {
    const all = [...loadSessions(), record].slice(-MAX_SESSIONS);
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch {
        // quota plein / mode privé : on n'empêche pas la session de se terminer
    }
    return all;
}

export function clearSessions(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        // silencieux
    }
}

export function makeSessionId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface ModeSummary {
    count: number;
    avgScore: number | null;
    avgHighPct: number | null;
    avgBpm: number | null;
    avgRmssd: number | null;
    totalMinutes: number;
}

const EMPTY_SUMMARY: ModeSummary = {
    count: 0,
    avgScore: null,
    avgHighPct: null,
    avgBpm: null,
    avgRmssd: null,
    totalMinutes: 0,
};

/** Agrège l'historique par mode (guide / libre) pour la comparaison. */
export function summarizeByMode(sessions: CoherenceSessionRecord[]): Record<PracticeMode, ModeSummary> {
    const buckets: Record<PracticeMode, CoherenceSessionRecord[]> = { guide: [], libre: [] };
    for (const session of sessions) {
        if (session.mode === 'guide' || session.mode === 'libre') buckets[session.mode].push(session);
    }

    const average = (values: (number | null)[]): number | null => {
        const nums = values.filter((v): v is number => typeof v === 'number');
        if (nums.length === 0) return null;
        return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
    };

    const result: Record<PracticeMode, ModeSummary> = {
        guide: { ...EMPTY_SUMMARY },
        libre: { ...EMPTY_SUMMARY },
    };

    (['guide', 'libre'] as PracticeMode[]).forEach((mode) => {
        const list = buckets[mode];
        if (list.length === 0) return;
        result[mode] = {
            count: list.length,
            avgScore: average(list.map((s) => s.avgScore)),
            avgHighPct: average(list.map((s) => s.highPct)),
            avgBpm: average(list.map((s) => s.avgBpm)),
            avgRmssd: average(list.map((s) => s.rmssd)),
            totalMinutes: Math.round(list.reduce((sum, s) => sum + s.durationMs, 0) / 60000),
        };
    });

    return result;
}
