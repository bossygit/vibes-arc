import { getFallbackAdvice } from '@/data/karmicManagementKnowledge';
import {
    buildCacheKey,
    type KarmicCoachRequestContext,
    type KarmicCoachStep,
} from '@/utils/karmicCoachPrompts';
import type { InnerQualities, MorningDraft, SeedDomain } from '@/types/karmicGarden';

export interface KarmicCoachAdvice {
    reply: string;
    partnerSuggestions?: string[];
    fromFallback?: boolean;
}

const cache = new Map<string, KarmicCoachAdvice>();

export interface FetchKarmicCoachParams {
    step: KarmicCoachStep;
    draft?: Partial<MorningDraft>;
    qualities?: InnerQualities;
    plotProgress?: Record<SeedDomain, number>;
    force?: boolean;
}

export async function fetchKarmicCoachAdvice(params: FetchKarmicCoachParams): Promise<KarmicCoachAdvice> {
    const ctx: KarmicCoachRequestContext = {
        step: params.step,
        draft: params.draft ?? {},
        qualities: params.qualities,
        plotProgress: params.plotProgress,
    };

    const cacheKey = buildCacheKey(ctx);
    if (!params.force && cache.has(cacheKey)) {
        return cache.get(cacheKey)!;
    }

    try {
        const res = await fetch('/api/karmic-coach', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                step: params.step,
                draft: params.draft ?? {},
                qualities: params.qualities,
                plotProgress: params.plotProgress,
            }),
        });

        if (!res.ok) {
            throw new Error(`API ${res.status}`);
        }

        const data = (await res.json()) as KarmicCoachAdvice;
        const result: KarmicCoachAdvice = {
            reply: data.reply,
            partnerSuggestions: data.partnerSuggestions,
            fromFallback: false,
        };
        cache.set(cacheKey, result);
        return result;
    } catch {
        const fallback: KarmicCoachAdvice = {
            reply: getFallbackAdvice(params.step),
            fromFallback: true,
        };
        cache.set(cacheKey, fallback);
        return fallback;
    }
}

export function clearKarmicCoachCache(): void {
    cache.clear();
}
