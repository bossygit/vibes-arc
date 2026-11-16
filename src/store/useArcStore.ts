/**
 * État propre à l'Arc, partagé entre l'accueil, les pages d'étape et les modules :
 *   - la boussole de vision (« Je deviens… ») — Supabase `arc_vision` + repli localStorage ;
 *   - le monde intérieur (Image Streaming × rêves) — chargé une fois, réutilisé partout.
 */
import { create } from 'zustand';
import SupabaseDatabaseClient from '@/database/supabase-client';
import {
    InnerWorldState,
    isMissingTable,
    loadInnerWorld,
    publishInnerWorld,
    readCachedInnerWorld,
    snapshotFingerprint,
} from '@/services/innerWorldService';

const VISION_KEY = 'vibes-arc-vision-statement';

export interface ArcVision {
    statement: string;
    updatedAt: string | null;
    /** 'cloud' = enregistrée dans Supabase, 'local' = seulement dans ce navigateur */
    storage: 'cloud' | 'local';
}

function readLocalVision(): ArcVision {
    try {
        const raw = localStorage.getItem(VISION_KEY);
        if (raw) {
            const parsed = JSON.parse(raw) as { statement?: string; updatedAt?: string | null };
            return { statement: parsed.statement ?? '', updatedAt: parsed.updatedAt ?? null, storage: 'local' };
        }
    } catch { /* ignore */ }
    return { statement: '', updatedAt: null, storage: 'local' };
}

function writeLocalVision(statement: string, updatedAt: string): void {
    try {
        localStorage.setItem(VISION_KEY, JSON.stringify({ statement, updatedAt }));
    } catch { /* ignore */ }
}

function initialInnerWorld(): InnerWorldState | null {
    const cached = readCachedInnerWorld();
    if (!cached) return null;
    return {
        snapshot: cached.snapshot,
        source: 'cache',
        vaultAvailable: false,
        cloudSyncedAt: cached.cloudSyncedAt,
        cloudFingerprint: null,
        cloudUnavailable: false,
        error: null,
    };
}

interface ArcStore {
    vision: ArcVision;
    visionLoaded: boolean;
    loadVision: () => Promise<void>;
    saveVision: (statement: string) => Promise<ArcVision>;

    innerWorld: InnerWorldState | null;
    innerWorldStatus: 'idle' | 'loading' | 'ready';
    /** Charge une seule fois par session, sauf `force` */
    loadInnerWorld: (force?: boolean) => Promise<void>;
    publishInnerWorld: () => Promise<void>;
}

export const useArcStore = create<ArcStore>((set, get) => ({
    vision: readLocalVision(),
    visionLoaded: false,

    loadVision: async () => {
        const local = readLocalVision();
        try {
            const remote = await SupabaseDatabaseClient.getInstance().getArcVision();
            if (remote && (!local.updatedAt || remote.updatedAt >= local.updatedAt)) {
                writeLocalVision(remote.statement, remote.updatedAt);
                set({ vision: { ...remote, storage: 'cloud' }, visionLoaded: true });
                return;
            }
            if (local.statement && local.updatedAt) {
                // Boussole écrite hors-ligne (ou avant la migration) : on la remonte.
                await SupabaseDatabaseClient.getInstance().saveArcVision(local.statement);
                set({ vision: { ...local, storage: 'cloud' }, visionLoaded: true });
                return;
            }
            set({ vision: { ...local, storage: 'cloud' }, visionLoaded: true });
        } catch (error) {
            if (!isMissingTable(error)) console.warn('Boussole : lecture Supabase impossible', error);
            set({ vision: local, visionLoaded: true });
        }
    },

    saveVision: async (statement) => {
        const clean = statement.trim();
        const updatedAt = new Date().toISOString();
        writeLocalVision(clean, updatedAt);
        let storage: ArcVision['storage'] = 'local';
        try {
            await SupabaseDatabaseClient.getInstance().saveArcVision(clean);
            storage = 'cloud';
        } catch (error) {
            if (!isMissingTable(error)) console.warn('Boussole : enregistrement Supabase impossible', error);
        }
        const vision = { statement: clean, updatedAt, storage };
        set({ vision });
        return vision;
    },

    innerWorld: initialInnerWorld(),
    innerWorldStatus: 'idle',

    loadInnerWorld: async (force = false) => {
        const { innerWorldStatus } = get();
        if (innerWorldStatus === 'loading') return;
        if (innerWorldStatus === 'ready' && !force) return;
        set({ innerWorldStatus: 'loading' });
        try {
            // loadInnerWorld retombe déjà sur le cache local si coffre et cloud sont muets.
            set({ innerWorld: await loadInnerWorld(), innerWorldStatus: 'ready' });
        } catch (error) {
            console.warn('Monde intérieur : chargement impossible', error);
            set({ innerWorldStatus: 'ready' });
        }
    },

    publishInnerWorld: async () => {
        const current = get().innerWorld;
        if (!current?.snapshot) return;
        const syncedAt = await publishInnerWorld(current.snapshot);
        set({
            innerWorld: {
                ...current,
                cloudSyncedAt: syncedAt,
                cloudFingerprint: snapshotFingerprint(current.snapshot),
                cloudUnavailable: false,
            },
        });
    },
}));
