/**
 * Conversion séance de cohérence ↔ ligne Supabase (`coherence_sessions`).
 * Pur (aucun accès réseau ni DOM) : testé dans scripts/test-coherence.mjs.
 */
import { sessionAlgoVersion, type CoherenceSessionRecord } from './sessionStats';

const clampInt = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(value)));
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const toNumber = (value: unknown): number | null => {
    const n = typeof value === 'string' ? Number(value) : value;
    return finite(n) ? n : null;
};

/** Séance → ligne Supabase (valeurs bornées comme le schéma) ; null si la séance est invalide. */
export function recordToRow(record: CoherenceSessionRecord): Record<string, unknown> | null {
    if (!record.id || record.id.length > 64) return null;
    if (record.mode !== 'guide' && record.mode !== 'libre') return null;
    if (record.source !== 'camera' && record.source !== 'ble') return null;
    if (Number.isNaN(Date.parse(record.endedAt))) return null;
    return {
        id: record.id,
        ended_at: record.endedAt,
        mode: record.mode,
        source: record.source,
        duration_ms: finite(record.durationMs) ? clampInt(record.durationMs, 0, 2_000_000_000) : 0,
        beats: finite(record.beats) ? clampInt(record.beats, 0, 2_000_000_000) : 0,
        avg_score: finite(record.avgScore) ? Math.round(Math.min(10, Math.max(0, record.avgScore)) * 10) / 10 : null,
        high_pct: finite(record.highPct) ? clampInt(record.highPct, 0, 100) : 0,
        avg_bpm: finite(record.avgBpm) ? clampInt(record.avgBpm, 0, 400) : null,
        rmssd: finite(record.rmssd) ? clampInt(record.rmssd, 0, 32_767) : null,
        sdnn: finite(record.sdnn) ? clampInt(record.sdnn, 0, 32_767) : null,
        algo_version: sessionAlgoVersion(record),
    };
}

/** Ligne Supabase → séance ; null si la ligne est inexploitable. */
export function rowToRecord(row: Record<string, unknown>): CoherenceSessionRecord | null {
    const mode = row.mode;
    const source = row.source;
    if (typeof row.id !== 'string' || typeof row.ended_at !== 'string') return null;
    if (Number.isNaN(Date.parse(row.ended_at))) return null;
    if (mode !== 'guide' && mode !== 'libre') return null;
    if (source !== 'camera' && source !== 'ble') return null;
    return {
        id: row.id,
        // Postgres renvoie « 2026-11-23T15:03:00+00:00 » : on normalise en ISO « …Z »
        endedAt: new Date(row.ended_at).toISOString(),
        mode,
        source,
        durationMs: toNumber(row.duration_ms) ?? 0,
        beats: toNumber(row.beats) ?? 0,
        avgScore: toNumber(row.avg_score),
        highPct: toNumber(row.high_pct) ?? 0,
        avgBpm: toNumber(row.avg_bpm),
        rmssd: toNumber(row.rmssd),
        sdnn: toNumber(row.sdnn),
        algoVersion: toNumber(row.algo_version) ?? 1,
    };
}
