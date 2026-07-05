import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildKarmicCoachSystemPrompt } from '../src/data/karmicManagementKnowledge';
import {
    buildStepUserPrompt,
    parsePartnerSuggestions,
    stripPartnerSuggestionsLine,
    type KarmicCoachRequestContext,
    type KarmicCoachStep,
} from '../src/utils/karmicCoachPrompts';

interface KarmicCoachRequestBody {
    step: KarmicCoachStep;
    draft?: KarmicCoachRequestContext['draft'];
    qualities?: KarmicCoachRequestContext['qualities'];
    plotProgress?: KarmicCoachRequestContext['plotProgress'];
}

async function callNvidia(userPrompt: string): Promise<string> {
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) throw new Error('NVIDIA_API_KEY non configurée');

    const model = process.env.NVIDIA_MODEL ?? 'meta/llama-3.3-70b-instruct';

    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: buildKarmicCoachSystemPrompt() },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.2,
            top_p: 0.7,
            max_tokens: 1024,
        }),
    });

    if (!res.ok) {
        const errorText = await res.text();
        console.error('NVIDIA NIM error:', res.status, errorText);
        throw new Error(`NVIDIA API error: ${res.status}`);
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error('Réponse NVIDIA vide');
    return text;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { step, draft = {}, qualities, plotProgress } = req.body as KarmicCoachRequestBody;

        const validSteps = [1, 2, 3, 4, 'afternoon'];
        if (!step || !validSteps.includes(step)) {
            return res.status(400).json({ error: 'step invalide (1-4 ou afternoon)' });
        }

        const ctx: KarmicCoachRequestContext = { step, draft, qualities, plotProgress };
        const userPrompt = buildStepUserPrompt(ctx);
        const rawReply = await callNvidia(userPrompt);

        const partnerSuggestions = step === 2 ? parsePartnerSuggestions(rawReply) : undefined;
        const reply = step === 2 ? stripPartnerSuggestionsLine(rawReply) : rawReply.trim();

        return res.status(200).json({
            reply,
            ...(partnerSuggestions?.length ? { partnerSuggestions } : {}),
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Erreur interne';
        console.error('Karmic coach API error:', error);
        return res.status(500).json({
            error: 'Erreur du coach karmique',
            details: message,
        });
    }
}
