import { DailyAlignmentEntry, getAlignmentPhase } from '@/types';
import { Habit } from '@/types';
import { isHabitActiveOnDay } from '@/utils/habitUtils';

/**
 * Génère une phrase d'intention par défaut basée sur le désir choisi.
 */
export function generateDefaultIntention(desireTitle: string): string {
    return `Aujourd'hui, je choisis d'incarner la personne qui ${desireTitle.toLowerCase()}.`;
}

/**
 * Détermine les signaux (habitudes) suggérés en fonction d'un désir.
 * Retourne les IDs des habitudes liées aux identités du désir
 * qui sont actives aujourd'hui et pas encore cochées.
 */
export function getSuggestedSignals(
    desireLinkedIdentityIds: number[],
    habits: Habit[],
    todayIdx: number
): number[] {
    return habits
        .filter((h) => {
            // L'habitude doit être liée à au moins une identité du désir
            const isLinkedToDesireIdentity = h.linkedIdentities.some((id) =>
                desireLinkedIdentityIds.includes(id)
            );
            if (!isLinkedToDesireIdentity) return false;

            // Active aujourd'hui
            if (!isHabitActiveOnDay(h, todayIdx)) return false;

            // Pas encore cochée
            if (h.progress[todayIdx]) return false;

            return true;
        })
        .map((h) => h.id);
}

/**
 * Construit le résumé du soir : quels signaux ont été complétés aujourd'hui.
 */
export function getEveningSignalSummary(
    morningSignalIds: number[],
    habits: Habit[],
    todayIdx: number
): { completed: number; total: number; completedNames: string[]; missedNames: string[] } {
    let completed = 0;
    const total = morningSignalIds.length;
    const completedNames: string[] = [];
    const missedNames: string[] = [];

    for (const signalId of morningSignalIds) {
        const habit = habits.find((h) => h.id === signalId);
        if (!habit) {
            // L'habitude a été supprimée entre-temps
            continue;
        }
        if (habit.progress[todayIdx]) {
            completed += 1;
            completedNames.push(habit.name);
        } else {
            missedNames.push(habit.name);
        }
    }

    return { completed, total, completedNames, missedNames };
}

/**
 * Génère un énoncé de preuve pour le soir.
 */
export function generateEveningStatement(
    completed: number,
    total: number,
    completedNames: string[],
    desireTitle: string
): string {
    if (total === 0) return "Aujourd'hui, je n'avais pas de signaux engagés, mais je reste aligné avec mon désir.";

    if (completed === total) {
        const list = completedNames.join(', ');
        return `J'ai honoré ${list} — autant de preuves que j'avance vers « ${desireTitle} ».`;
    }

    if (completed > 0) {
        const pct = Math.round((completed / total) * 100);
        const list = completedNames.join(', ');
        return `J'ai honoré ${completed}/${total} signaux (${list}) — ${pct}% de preuves produites pour « ${desireTitle} ».`;
    }

    return `Aujourd'hui, aucun signal honoré. Mon dossier pour « ${desireTitle} » est en pause, mais je reste aligné. Demain est une nouvelle audience.`;
}

/**
 * Vérifie si l'utilisateur a déjà fait son alignment du matin aujourd'hui.
 */
export function hasMorningAlignmentToday(entry: DailyAlignmentEntry | null): boolean {
    return entry !== null && entry.morning !== null;
}

/**
 * Vérifie si l'utilisateur a déjà fait son alignment du soir aujourd'hui.
 */
export function hasEveningAlignmentToday(entry: DailyAlignmentEntry | null): boolean {
    return entry !== null && entry.evening !== null;
}

/**
 * Détermine quelle phase afficher par défaut en fonction de l'heure
 * et de l'état de l'alignement du jour.
 */
export function getDefaultPhase(
    entry: DailyAlignmentEntry | null
): 'morning' | 'evening' {
    const phase = getAlignmentPhase();

    // Si c'est le soir et que le matin a déjà été fait (ou qu'on a pas d'entrée),
    // afficher le soir. Sinon, afficher le matin.
    if (phase === 'evening' && hasMorningAlignmentToday(entry)) {
        return 'evening';
    }

    return 'morning';
}