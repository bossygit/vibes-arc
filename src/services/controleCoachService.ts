import { getFallbackAdvice } from '@/data/controleEjaculationKnowledge';
import { buildCacheKey } from '@/utils/controleCoachPrompts';
import type { ControleCoachContext } from '@/types/controleEjaculation';

export interface ControleCoachAdvice {
    reply: string;
    fromFallback?: boolean;
}

const cache = new Map<string, ControleCoachAdvice>();

export interface FetchControleCoachParams extends ControleCoachContext {
    force?: boolean;
}

export async function fetchControleCoachAdvice(
    params: FetchControleCoachParams
): Promise<ControleCoachAdvice> {
    const { force, ...ctx } = params;
    const cacheKey = buildCacheKey(ctx);

    if (!force && cache.has(cacheKey)) {
        return cache.get(cacheKey)!;
    }

    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: 'controle', ...ctx }),
        });

        if (!res.ok) throw new Error(`API ${res.status}`);

        const data = (await res.json()) as ControleCoachAdvice;
        const result: ControleCoachAdvice = { reply: data.reply, fromFallback: false };
        cache.set(cacheKey, result);
        return result;
    } catch {
        const fallback: ControleCoachAdvice = {
            reply: getFallbackAdvice(ctx.step),
            fromFallback: true,
        };
        cache.set(cacheKey, fallback);
        return fallback;
    }
}

export function clearControleCoachCache(): void {
    cache.clear();
}
