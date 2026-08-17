// ===================================================================
// Focus 17/68 — Persistance locale de la « forme » (faces gravées,
// ressentis post-séance, sujets récents, interruptions).
// ===================================================================

import type { PolyhedronId } from '@/data/focusPolyhedra';

export type Feeling = 'better' | 'same' | 'worse';

export interface FeelingEntry {
    date: string; // ISO
    feeling: Feeling;
    shapeId: PolyhedronId;
}

export interface FocusShapeData {
    /** shapeId -> indices des faces gravées (ordre de gravure) */
    shapes: Record<string, number[]>;
    /** shapeId -> date ISO de dernière complétion (null si jamais) */
    shapeCompletedAt: Record<string, string | null>;
    feelings: FeelingEntry[];
    subjects: string[];
    /** date YYYY-MM-DD -> nombre d'interruptions (reset) */
    resets: Record<string, number>;
    /** total de séances de 68s complétées */
    sessions: number;
}

const STORAGE_KEY = 'vibes-arc-focus-shapes-v1';

export function emptyFocusShapeData(): FocusShapeData {
    return {
        shapes: {},
        shapeCompletedAt: {},
        feelings: [],
        subjects: [],
        resets: {},
        sessions: 0,
    };
}

export function loadFocusShapeData(): FocusShapeData {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return emptyFocusShapeData();
        const parsed = JSON.parse(raw);
        return {
            shapes: parsed.shapes ?? {},
            shapeCompletedAt: parsed.shapeCompletedAt ?? {},
            feelings: Array.isArray(parsed.feelings) ? parsed.feelings : [],
            subjects: Array.isArray(parsed.subjects) ? parsed.subjects : [],
            resets: parsed.resets ?? {},
            sessions: typeof parsed.sessions === 'number' ? parsed.sessions : 0,
        };
    } catch {
        return emptyFocusShapeData();
    }
}

export function saveFocusShapeData(data: FocusShapeData): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
        // Stockage plein ou indisponible — silencieux
    }
}

export function todayKey(): string {
    return new Date().toISOString().slice(0, 10);
}

export function resetsToday(data: FocusShapeData): number {
    return data.resets[todayKey()] ?? 0;
}

/** Bilan 7 jours : séances complétées par ressenti. */
export function feelingsLast7Days(
    data: FocusShapeData
): { better: number; same: number; worse: number } {
    const since = Date.now() - 7 * 86400000;
    const out = { better: 0, same: 0, worse: 0 };
    for (const f of data.feelings) {
        if (new Date(f.date).getTime() >= since) out[f.feeling]++;
    }
    return out;
}
