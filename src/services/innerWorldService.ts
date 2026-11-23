/**
 * Monde intérieur — chargement de l'instantané Image Streaming × rêves.
 *
 * Trois sources, par ordre de fraîcheur :
 *   1. le coffre Obsidian, lu en direct par le serveur de développement
 *      (`npm run dev` sur la machine qui héberge le coffre) ;
 *   2. la copie publiée dans Supabase (table `inner_world_snapshots`) — c'est
 *      ce que voient le téléphone et la version en ligne ;
 *   3. le dernier instantané mis en cache dans ce navigateur (hors-ligne).
 */
import SupabaseDatabaseClient from '@/database/supabase-client';
import type { InnerWorldSnapshot } from '@/types/innerWorld';

const CACHE_KEY = 'vibes-arc-inner-world-cache';

export type InnerWorldSource = 'vault' | 'cloud' | 'cache';

export interface InnerWorldState {
    snapshot: InnerWorldSnapshot | null;
    source: InnerWorldSource | null;
    /** Le coffre est lisible en direct (serveur de développement local) */
    vaultAvailable: boolean;
    /** Date de la copie publiée dans Supabase */
    cloudSyncedAt: string | null;
    /** Empreinte de la copie cloud — pour savoir si elle est à jour */
    cloudFingerprint: string | null;
    /** La table Supabase n'existe pas (migration non appliquée) */
    cloudUnavailable: boolean;
    error: string | null;
}

interface CacheRecord {
    snapshot: InnerWorldSnapshot;
    cloudSyncedAt: string | null;
}

export function isInnerWorldSnapshot(value: unknown): value is InnerWorldSnapshot {
    const v = value as InnerWorldSnapshot | null;
    return !!v && v.version === 1 && Array.isArray(v.sessions) && Array.isArray(v.symbols) && Array.isArray(v.dreams);
}

/**
 * Résumé stable du contenu : change dès qu'une séance, un rêve ou un symbole est
 * ajouté, qu'un parallèle rare apparaît ou qu'un exercice change d'état.
 */
export function snapshotFingerprint(s: InnerWorldSnapshot): string {
    const lastSession = s.sessions.reduce((max, x) => (x.date > max ? x.date : max), '');
    const lastDream = s.dreams.reduce((max, x) => ((x.date ?? '') > max ? x.date ?? '' : max), '');
    const practice = (s.practice ?? []).map((p) => `${p.id}:${p.status}`).join(',');
    return [
        s.sessions.length, lastSession, s.dreams.length, lastDream, s.symbols.length, s.sourceUpdatedAt ?? '',
        s.parallels?.length ?? 0, practice,
    ].join('|');
}

export function readCachedInnerWorld(): CacheRecord | null {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as CacheRecord;
        return isInnerWorldSnapshot(parsed?.snapshot) ? parsed : null;
    } catch {
        return null;
    }
}

function writeCache(record: CacheRecord): void {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(record));
    } catch {
        // Quota dépassé : le module reste utilisable, simplement sans cache.
    }
}

function isMissingTable(error: unknown): boolean {
    const e = error as { code?: string; message?: string } | null;
    if (!e) return false;
    return e.code === '42P01' || e.code === 'PGRST205' || /does not exist|schema cache/i.test(e.message ?? '');
}

async function fetchFromVault(): Promise<InnerWorldSnapshot | null> {
    // En production, /api/inner-world n'existe pas (le coffre est sur ta machine).
    if (!import.meta.env.DEV) return null;
    try {
        const res = await fetch('/api/inner-world', { headers: { Accept: 'application/json' } });
        if (!res.ok || !(res.headers.get('content-type') ?? '').includes('application/json')) return null;
        const body: unknown = await res.json();
        return isInnerWorldSnapshot(body) ? body : null;
    } catch {
        return null;
    }
}

export async function loadInnerWorld(): Promise<InnerWorldState> {
    const cached = readCachedInnerWorld();
    const db = SupabaseDatabaseClient.getInstance();

    const [vaultSnapshot, cloudResult] = await Promise.all([
        fetchFromVault(),
        db.getInnerWorldSnapshot()
            .then((row) => ({ row, unavailable: false, error: null as string | null }))
            .catch((error: unknown) => ({
                row: null,
                unavailable: isMissingTable(error),
                error: isMissingTable(error) ? null : (error as Error)?.message ?? 'Erreur Supabase',
            })),
    ]);

    const cloudSyncedAt = cloudResult.row?.syncedAt ?? cached?.cloudSyncedAt ?? null;
    const cloudFingerprint = cloudResult.row ? snapshotFingerprint(cloudResult.row.snapshot) : null;

    let snapshot: InnerWorldSnapshot | null = null;
    let source: InnerWorldSource | null = null;
    if (vaultSnapshot) {
        snapshot = vaultSnapshot;
        source = 'vault';
    } else if (cloudResult.row) {
        snapshot = cloudResult.row.snapshot;
        source = 'cloud';
    } else if (cached) {
        snapshot = cached.snapshot;
        source = 'cache';
    }

    if (snapshot && source !== 'cache') writeCache({ snapshot, cloudSyncedAt });

    return {
        snapshot,
        source,
        vaultAvailable: !!vaultSnapshot,
        cloudSyncedAt,
        cloudFingerprint,
        cloudUnavailable: cloudResult.unavailable,
        error: cloudResult.error,
    };
}

/** Publie l'instantané dans Supabase pour le rendre lisible sur tes autres appareils. */
export async function publishInnerWorld(snapshot: InnerWorldSnapshot): Promise<string> {
    const syncedAt = await SupabaseDatabaseClient.getInstance().saveInnerWorldSnapshot(snapshot);
    writeCache({ snapshot, cloudSyncedAt: syncedAt });
    return syncedAt;
}

export { isMissingTable };
