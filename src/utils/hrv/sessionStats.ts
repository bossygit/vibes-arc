/**
 * Statistiques de session & historique local — module Cohérence cardiaque.
 *
 * Permet de comparer « Observation libre » (pas de guidage respiratoire) et
 * « Cohérence guidée » (respiration à 4.5-7 cpm) :
 *   - SDNN  : écart-type des intervalles RR (variabilité globale) — métrique de
 *     comparaison libre/guidée, indépendante du rythme respiratoire
 *   - RMSSD : variabilité battement-à-battement (tonus parasympathique) — dépend
 *     du rythme respiratoire, donc à ne PAS comparer entre libre et guidée
 *
 * Stockage : table Supabase `coherence_sessions` (tous appareils, lue aussi par
 * coach-api), avec ce module comme cache local hors-ligne — voir
 * services/coherenceSessionService.ts. Les fonctions ici restent pures ou
 * limitées au localStorage, donc testables en Node.
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
    /**
     * Version du calcul. Absent sur les séances enregistrées avant son introduction :
     * voir sessionAlgoVersion().
     */
    algoVersion?: number;
}

const STORAGE_KEY = 'vibes-arc-coherence-sessions';
/** Cache local (hors-ligne) : la copie de référence est dans Supabase. */
const MAX_SESSIONS = 500;

/**
 * Version du calcul actuel. 2 = corrections du 2026-11-23 (signal caméra
 * inversé, pas de score avant 60 s, pic cherché jusqu'à 0.26 Hz, score suspendu
 * si signal instable). Les séances v1 ne sont pas comparables aux v2.
 */
export const COHERENCE_ALGO_VERSION = 2;
/** Mise en ligne du calcul v2 : une séance sans algoVersion terminée après cette date est v2. */
export const COHERENCE_ALGO_FIX_AT = '2026-11-23T13:45:00Z';

export function sessionAlgoVersion(record: Pick<CoherenceSessionRecord, 'algoVersion' | 'endedAt'>): number {
    if (typeof record.algoVersion === 'number') return record.algoVersion;
    return record.endedAt >= COHERENCE_ALGO_FIX_AT ? 2 : 1;
}

/** Séance mesurée avec le calcul actuel — seules celles-ci entrent dans les comparaisons. */
export function isComparableSession(record: Pick<CoherenceSessionRecord, 'algoVersion' | 'endedAt'>): boolean {
    return sessionAlgoVersion(record) >= COHERENCE_ALGO_VERSION;
}

/**
 * Fusionne l'historique local et celui de Supabase (même id = même séance, la
 * copie cloud l'emporte). Trié par date de fin croissante.
 */
export function mergeSessions(
    local: CoherenceSessionRecord[],
    remote: CoherenceSessionRecord[]
): CoherenceSessionRecord[] {
    const byId = new Map<string, CoherenceSessionRecord>();
    for (const s of local) byId.set(s.id, s);
    for (const s of remote) byId.set(s.id, s);
    return [...byId.values()].sort((a, b) => a.endedAt.localeCompare(b.endedAt));
}

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

/**
 * Évalue la plausibilité PHYSIOLOGIQUE d'une fenêtre RR récente.
 *
 * Au repos, un RMSSD > 200 ms ou une amplitude > 700 ms sur ~60 battements
 * signalent presque toujours une extraction de pics erratique (mouvement du
 * doigt, fuite de lumière, pression) — pas une physiologie réelle. Dans ce
 * cas le score affiché ne mesure pas l'utilisateur et la session ne doit pas
 * être enregistrée dans la comparaison.
 */
export function assessSignalQuality(recentRrMs: number[]): 'ok' | 'unstable' {
    if (recentRrMs.length < 30) return 'ok';

    const rmssdValue = computeRmssd(recentRrMs);
    if (rmssdValue !== null && rmssdValue > 200) return 'unstable';

    let min = Infinity;
    let max = -Infinity;
    for (const v of recentRrMs) {
        if (v < min) min = v;
        if (v > max) max = v;
    }
    if (max - min > 700) return 'unstable';

    // Proportion d'intervalles hors plage plausible (40–150 bpm)
    let outliers = 0;
    for (const v of recentRrMs) {
        if (v < 400 || v > 1500) outliers++;
    }
    if (outliers / recentRrMs.length > 0.2) return 'unstable';

    return 'ok';
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

/** Remplace le cache local (après fusion avec Supabase). */
export function saveLocalSessions(sessions: CoherenceSessionRecord[]): CoherenceSessionRecord[] {
    const all = sessions.slice(-MAX_SESSIONS);
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch {
        // quota plein / mode privé : on n'empêche pas la session de se terminer
    }
    return all;
}

export function appendSession(record: CoherenceSessionRecord): CoherenceSessionRecord[] {
    return saveLocalSessions(mergeSessions(loadSessions(), [record]));
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
    /**
     * SDNN moyen : LA bonne métrique pour comparer libre et guidée. Le RMSSD dépend
     * du rythme respiratoire (à amplitude égale, il BAISSE quand on respire
     * lentement : ~24 ms à 6 cpm contre ~47 ms à 15 cpm), le SDNN non.
     */
    avgSdnn: number | null;
    totalMinutes: number;
}

const EMPTY_SUMMARY: ModeSummary = {
    count: 0,
    avgScore: null,
    avgHighPct: null,
    avgBpm: null,
    avgRmssd: null,
    avgSdnn: null,
    totalMinutes: 0,
};

/**
 * Agrège l'historique par mode (guide / libre) pour la comparaison.
 * Seules les séances mesurées avec le calcul actuel sont comptées (isComparableSession).
 */
export function summarizeByMode(sessions: CoherenceSessionRecord[]): Record<PracticeMode, ModeSummary> {
    const buckets: Record<PracticeMode, CoherenceSessionRecord[]> = { guide: [], libre: [] };
    for (const session of sessions) {
        if (!isComparableSession(session)) continue;
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
            avgSdnn: average(list.map((s) => s.sdnn)),
            totalMinutes: Math.round(list.reduce((sum, s) => sum + s.durationMs, 0) / 60000),
        };
    });

    return result;
}
