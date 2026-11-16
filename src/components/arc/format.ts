import { EMOTIONAL_LABELS, EmotionalFrequency } from '@/types';

/** Libellé court d'un score moyen sur l'échelle 22 niveaux (1 = Joie … 22 = Peur). */
export function moodLabel(avg: number): string {
    const level = Math.min(22, Math.max(1, Math.round(avg))) as EmotionalFrequency;
    return EMOTIONAL_LABELS[level].split(' / ')[0];
}

/** « 2026-08-20 » → « 20 août » */
export function formatShortDate(iso: string): string {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}
