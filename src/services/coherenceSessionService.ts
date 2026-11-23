/**
 * Cohérence cardiaque — synchronisation des séances avec Supabase.
 *
 * La copie de référence est la table `coherence_sessions` (tous appareils, lue
 * aussi par coach-api). Le localStorage sert de cache hors-ligne :
 *   - au chargement, syncCoherenceSessions() fusionne local + cloud et envoie
 *     les séances qui n'existaient qu'ici (iPad, Mac… : chaque navigateur avait
 *     son propre historique avant la migration) ;
 *   - en fin de séance, pushCoherenceSession() l'envoie tout de suite ; en cas
 *     d'échec (hors-ligne), la prochaine synchro la rattrape (même id = même séance).
 * Sans la migration 20261123_coherence_sessions, tout reste local (cloud = 'local-only').
 */
import SupabaseDatabaseClient from '@/database/supabase-client';
import { isMissingTable } from '@/services/innerWorldService';
import { recordToRow, rowToRecord } from '@/utils/hrv/sessionRows';
import {
    clearSessions,
    loadSessions,
    mergeSessions,
    saveLocalSessions,
    type CoherenceSessionRecord,
} from '@/utils/hrv/sessionStats';

/** synced : historique partagé · local-only : table absente · error : réseau/serveur (réessayé plus tard) */
export type CoherenceCloudState = 'synced' | 'local-only' | 'error';

export interface CoherenceSyncResult {
    sessions: CoherenceSessionRecord[];
    cloud: CoherenceCloudState;
    error?: string;
}

function rowsFor(records: CoherenceSessionRecord[]): Record<string, unknown>[] {
    return records.map(recordToRow).filter((row): row is Record<string, unknown> => row !== null);
}

function failure(error: unknown): { cloud: CoherenceCloudState; error?: string } {
    if (isMissingTable(error)) return { cloud: 'local-only' };
    return { cloud: 'error', error: (error as Error)?.message ?? 'Erreur Supabase' };
}

/** Fusionne l'historique local et Supabase, et envoie les séances qui n'existaient qu'ici. */
export async function syncCoherenceSessions(): Promise<CoherenceSyncResult> {
    const local = loadSessions();
    try {
        const db = SupabaseDatabaseClient.getInstance();
        const remote = (await db.getCoherenceSessionRows())
            .map(rowToRecord)
            .filter((record): record is CoherenceSessionRecord => record !== null);
        const remoteIds = new Set(remote.map((record) => record.id));
        await db.upsertCoherenceSessionRows(rowsFor(local.filter((record) => !remoteIds.has(record.id))));
        return { sessions: saveLocalSessions(mergeSessions(local, remote)), cloud: 'synced' };
    } catch (error) {
        return { sessions: local, ...failure(error) };
    }
}

/** Envoie une séance qui vient de se terminer (déjà enregistrée en local). */
export async function pushCoherenceSession(record: CoherenceSessionRecord): Promise<CoherenceCloudState> {
    try {
        await SupabaseDatabaseClient.getInstance().upsertCoherenceSessionRows(rowsFor([record]));
        return 'synced';
    } catch (error) {
        return failure(error).cloud;
    }
}

/** Efface l'historique ici ET dans Supabase (donc sur tous les appareils). */
export async function clearAllCoherenceSessions(): Promise<CoherenceCloudState> {
    clearSessions();
    try {
        await SupabaseDatabaseClient.getInstance().deleteAllCoherenceSessions();
        return 'synced';
    } catch (error) {
        return failure(error).cloud;
    }
}
