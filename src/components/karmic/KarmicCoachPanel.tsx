import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { fetchKarmicCoachAdvice } from '@/services/karmicCoachService';
import type { KarmicCoachStep } from '@/utils/karmicCoachPrompts';
import type { InnerQualities, MorningDraft, SeedDomain } from '@/types/karmicGarden';

interface KarmicCoachPanelProps {
    step: KarmicCoachStep;
    draft: Partial<MorningDraft>;
    qualities?: InnerQualities;
    plotProgress?: Record<SeedDomain, number>;
    onApplySuggestion?: (field: keyof MorningDraft, value: string) => void;
}

function renderLightMarkdown(text: string): React.ReactNode {
    const lines = text.split('\n');
    return lines.map((line, i) => {
        const bullet = line.match(/^[-•*]\s+(.+)/);
        if (bullet) {
            return (
                <li key={i} className="ml-4 list-disc text-sm text-slate-700">
                    {bullet[1]}
                </li>
            );
        }
        if (line.trim() === '') return <br key={i} />;
        return (
            <p key={i} className="text-sm text-slate-700 leading-relaxed mb-1">
                {line}
            </p>
        );
    });
}

const KarmicCoachPanel: React.FC<KarmicCoachPanelProps> = ({
    step,
    draft,
    qualities,
    plotProgress,
    onApplySuggestion,
}) => {
    const [reply, setReply] = useState('');
    const [partnerSuggestions, setPartnerSuggestions] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [fromFallback, setFromFallback] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const requestIdRef = useRef(0);

    const loadAdvice = useCallback(
        async (force = false) => {
            const id = ++requestIdRef.current;
            setLoading(true);
            try {
                const result = await fetchKarmicCoachAdvice({
                    step,
                    draft,
                    qualities,
                    plotProgress,
                    force,
                });
                if (id !== requestIdRef.current) return;
                setReply(result.reply);
                setPartnerSuggestions(result.partnerSuggestions ?? []);
                setFromFallback(!!result.fromFallback);
            } finally {
                if (id === requestIdRef.current) setLoading(false);
            }
        },
        [step, draft, qualities, plotProgress]
    );

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            loadAdvice(false);
        }, 600);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [loadAdvice]);

    const handleChipClick = (suggestion: string) => {
        onApplySuggestion?.('partnerName', suggestion);
        if (!draft.helpPlan?.trim()) {
            onApplySuggestion?.('helpPlan', `Aider ${suggestion} : `);
        }
    };

    return (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-indigo-800">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span className="text-sm font-semibold">Coach Karmique</span>
                    {fromFallback && !loading && (
                        <span className="text-xs text-indigo-500">(mode hors-ligne)</span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => loadAdvice(true)}
                    disabled={loading}
                    className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-40"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Actualiser
                </button>
            </div>

            {loading && !reply ? (
                <div className="flex items-center gap-2 text-sm text-indigo-600 py-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Le coach réfléchit…
                </div>
            ) : (
                <div className={loading ? 'opacity-60' : ''}>{renderLightMarkdown(reply)}</div>
            )}

            {step === 2 && partnerSuggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                    {partnerSuggestions.map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => handleChipClick(s)}
                            className="px-3 py-1.5 text-xs rounded-full bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default KarmicCoachPanel;
