import React, { useCallback, useRef, useState } from 'react';
import { Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { fetchControleCoachAdvice } from '@/services/controleCoachService';
import type { ControleCoachContext } from '@/types/controleEjaculation';

interface ControleCoachPanelProps extends Omit<ControleCoachContext, 'step'> {
    step: ControleCoachContext['step'];
}

function renderText(text: string): React.ReactNode {
    return text.split('\n').map((line, i) => {
        const bullet = line.match(/^[-•*]\s+(.+)/);
        if (bullet) {
            return (
                <li key={i} style={{ marginLeft: 16, marginBottom: 4 }}>
                    {bullet[1]}
                </li>
            );
        }
        if (line.trim() === '') return <br key={i} />;
        return (
            <p key={i} style={{ marginBottom: 6 }}>
                {line}
            </p>
        );
    });
}

const ControleCoachPanel: React.FC<ControleCoachPanelProps> = ({
    step,
    profile,
    progress,
    exerciseId,
    sessionLog,
    phaseIndex,
}) => {
    const [reply, setReply] = useState('');
    const [loading, setLoading] = useState(false);
    const [fromFallback, setFromFallback] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const requestIdRef = useRef(0);

    const loadAdvice = useCallback(
        async (force = false) => {
            const id = ++requestIdRef.current;
            setLoading(true);
            try {
                const result = await fetchControleCoachAdvice({
                    step,
                    profile,
                    progress,
                    exerciseId,
                    sessionLog,
                    phaseIndex,
                    force,
                });
                if (id !== requestIdRef.current) return;
                setReply(result.reply);
                setFromFallback(!!result.fromFallback);
            } finally {
                if (id === requestIdRef.current) setLoading(false);
            }
        },
        [step, profile, progress, exerciseId, sessionLog, phaseIndex]
    );

    React.useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => loadAdvice(false), 600);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [loadAdvice]);

    return (
        <div className="controle-coach-panel">
            <div className="controle-coach-panel-header">
                <div className="controle-coach-panel-title">
                    <Sparkles size={16} />
                    <span>Coach Voie du Contrôle</span>
                    {fromFallback && !loading && (
                        <span className="controle-coach-offline">(mode hors-ligne)</span>
                    )}
                </div>
                <button
                    type="button"
                    className="controle-coach-refresh"
                    onClick={() => loadAdvice(true)}
                    disabled={loading}
                >
                    <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                    Actualiser
                </button>
            </div>

            <div className="controle-coach-panel-body">
                {loading && !reply ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Le coach réfléchit…</span>
                    </div>
                ) : (
                    <div style={{ opacity: loading ? 0.6 : 1 }}>{renderText(reply)}</div>
                )}
            </div>
        </div>
    );
};

export default ControleCoachPanel;
