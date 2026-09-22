// ============================================================
// Cache local du module Nutrition
//
// Supabase reste la source de vérité, mais le journal alimentaire doit
// rester utilisable sans réseau (déplacement, avion, incident) : on
// écrit donc systématiquement une copie locale, et on s'en sert comme
// source de repli quand Supabase est injoignable ou que la migration
// n'a pas encore été appliquée.
//
// Les identifiants créés hors-ligne sont négatifs (`-timestamp`) pour ne
// jamais entrer en collision avec les SERIAL de Postgres.
// ============================================================

import { FoodEntry, FoodEntryDraft, NutrientKey, NutritionProfile } from '@/types/nutrition';

const PROFILE_KEY = 'vibes-arc-nutrition-profile';
const OVERRIDES_KEY = 'vibes-arc-nutrition-overrides';
const ENTRIES_KEY = 'vibes-arc-nutrition-entries';
const DATE_KEY = 'vibes-arc-nutrition-date';

/** Nombre maximum d'entrées conservées localement (fenêtre glissante). */
const MAX_LOCAL_ENTRIES = 2000;

function safeParse<T>(raw: string | null, fallback: T): T {
    if (!raw) return fallback;
    try {
        const parsed = JSON.parse(raw);
        return parsed ?? fallback;
    } catch {
        return fallback;
    }
}

export function readLocalProfile(): NutritionProfile | null {
    const value = safeParse<NutritionProfile | null>(localStorage.getItem(PROFILE_KEY), null);
    return value && typeof value === 'object' ? value : null;
}

export function writeLocalProfile(profile: NutritionProfile): void {
    try {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch {
        // Quota dépassé : le cache local est un confort, pas une nécessité.
    }
}

export function readLocalOverrides(): Partial<Record<NutrientKey, number>> {
    return safeParse<Partial<Record<NutrientKey, number>>>(localStorage.getItem(OVERRIDES_KEY), {});
}

export function writeLocalOverrides(overrides: Partial<Record<NutrientKey, number>>): void {
    try {
        localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
    } catch {
        // ignoré
    }
}

export function readLocalEntries(): FoodEntry[] {
    const entries = safeParse<FoodEntry[]>(localStorage.getItem(ENTRIES_KEY), []);
    return Array.isArray(entries) ? entries : [];
}

export function writeLocalEntries(entries: FoodEntry[]): void {
    try {
        // On garde les entrées les plus récentes en cas de dépassement.
        const trimmed = entries.length > MAX_LOCAL_ENTRIES
            ? [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, MAX_LOCAL_ENTRIES)
            : entries;
        localStorage.setItem(ENTRIES_KEY, JSON.stringify(trimmed));
    } catch {
        // ignoré
    }
}

/** Crée une entrée purement locale (hors-ligne). */
export function createLocalEntry(draft: FoodEntryDraft): FoodEntry {
    return {
        ...draft,
        id: -Date.now() - Math.floor(Math.random() * 1000),
        createdAt: new Date().toISOString(),
    };
}

export function isLocalEntryId(id: number): boolean {
    return id < 0;
}

export function readLocalSelectedDate(): string | null {
    return localStorage.getItem(DATE_KEY);
}

export function writeLocalSelectedDate(date: string): void {
    try {
        localStorage.setItem(DATE_KEY, date);
    } catch {
        // ignoré
    }
}
