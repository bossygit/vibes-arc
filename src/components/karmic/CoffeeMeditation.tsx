import React, { useEffect, useState } from 'react';
import { Coffee } from 'lucide-react';

interface CoffeeMeditationProps {
    goal: string;
    partnerName: string;
    actionLog: string;
    durationSec?: number;
    onComplete: (meditationCompleted: boolean) => void;
    onBack: () => void;
}

const CoffeeMeditation: React.FC<CoffeeMeditationProps> = ({
    goal,
    partnerName,
    actionLog,
    durationSec = 180,
    onComplete,
    onBack,
}) => {
    const [remaining, setRemaining] = useState(durationSec);
    const [skipped, setSkipped] = useState(false);

    useEffect(() => {
        if (remaining <= 0) return;
        const t = setInterval(() => setRemaining((r) => r - 1), 1000);
        return () => clearInterval(t);
    }, [remaining]);

    const progress = 1 - remaining / durationSec;
    const canFinish = progress >= 0.8 || skipped || remaining <= 0;
    const mins = Math.floor(Math.max(0, remaining) / 60);
    const secs = Math.max(0, remaining) % 60;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 rounded-xl">
                    <Coffee className="w-6 h-6 text-amber-700" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800">Étape 4 — Arroser (Coffee Meditation)</h3>
                    <p className="text-sm text-slate-600">Rejouis-toi de l&apos;aide apportée. C&apos;est ce qui fait mûrir la graine.</p>
                </div>
            </div>

            <div className="card bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                <p className="text-sm text-slate-700 leading-relaxed space-y-3">
                    <span className="block">1. Respire calmement.</span>
                    <span className="block">2. Repense à ton aide pour <strong>{partnerName}</strong> : « {actionLog} »</span>
                    <span className="block">3. Rejouis-toi : <em>Si j&apos;aide, je reçois.</em></span>
                    <span className="block">4. Visualise ton intention déjà accomplie : « {goal} »</span>
                </p>
            </div>

            <div className="text-center">
                <div className="text-4xl font-mono font-bold text-amber-700 mb-2">
                    {mins}:{String(secs).padStart(2, '0')}
                </div>
                <div className="h-2 bg-amber-100 rounded-full overflow-hidden max-w-xs mx-auto">
                    <div
                        className="h-full bg-amber-500 transition-all duration-1000"
                        style={{ width: `${Math.min(100, progress * 100)}%` }}
                    />
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <button type="button" onClick={onBack} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700">
                    Retour
                </button>
                {!skipped && remaining > 0 && (
                    <button
                        type="button"
                        onClick={() => setSkipped(true)}
                        className="px-4 py-2 rounded-lg border border-amber-300 text-amber-800"
                    >
                        J&apos;ai déjà médité
                    </button>
                )}
                <button
                    type="button"
                    disabled={!canFinish}
                    onClick={() => onComplete(skipped || remaining <= 0)}
                    className="btn-primary flex-1 disabled:opacity-40"
                >
                    Terminer la session matinale
                </button>
            </div>
        </div>
    );
};

export default CoffeeMeditation;
