/**
 * Service Segment Intending — appelle /api/chat (mode 'segment-intending') sur Vercel.
 * Le modèle par défaut est gemma4 via Ollama Cloud (OLLAMA_MODEL dans api/chat.ts).
 * Envoie l'historique des entrées récentes pour que le modèle affine ses propositions.
 */

import { useAppStore } from '@/store/useAppStore';
import type { SegmentIntendingDraft, SegmentIntendingEntry } from '@/types';

export interface ProposeIntentionsResult {
    intentions: string[];
    rawReply: string;
}

function buildHistory(entries: SegmentIntendingEntry[]) {
    return entries.slice(0, 10).map((e) => ({
        date: e.date,
        segmentLabel: e.segmentLabel,
        context: e.context,
        chosenIntention: e.chosenIntention,
        outcome: e.outcome,
    }));
}

/**
 * Demande 3 intentions pré-pavées pour un segment donné.
 * L'historique (30 dernières entrées) est passé au modèle pour personnaliser.
 */
export async function proposeSegmentIntentions(
    draft: SegmentIntendingDraft
): Promise<ProposeIntentionsResult> {
    const entries = useAppStore.getState().segmentIntendingEntries;

    const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            mode: 'segment-intending',
            segment: {
                segmentKey: draft.segmentKey,
                segmentLabel: draft.segmentLabel,
                context: draft.context,
                emotionalSetpoint: draft.emotionalSetpoint,
                history: buildHistory(entries),
            },
        }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erreur API', details: `HTTP ${res.status}` }));
        throw new Error(err.details || err.error || `Erreur du Guide Segment Intending (${res.status})`);
    }

    const data = await res.json();
    const intentions: string[] = Array.isArray(data.intentions) && data.intentions.length > 0
        ? data.intentions
        : [data.reply ?? 'Aucune intention générée'];

    return { intentions, rawReply: data.reply ?? '' };
}
