/**
 * Fil d'Ariane affiché au-dessus de chaque module : rappelle à quelle étape de
 * l'arc l'outil répond, et propose de revenir à l'étape ou de passer à la suivante.
 * C'est ce qui transforme « un outil parmi d'autres » en « un moment du cycle ».
 */
import React from 'react';
import { ArrowLeft, ArrowRight, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { getModule, getNextStage, getStageForView } from '@/config/arc';
import type { ViewType } from '@/types';
import { StageNumber } from './StageHub';

const StageContextBar: React.FC<{ view: ViewType }> = ({ view }) => {
    const setView = useAppStore((s) => s.setView);
    const stage = getStageForView(view);
    const module = getModule(view);
    if (!stage || !module) return null;
    const next = getNextStage(stage.key);
    // Le détail d'un signal se rattache au tableau des signaux, pas directement à l'étape
    const parent = view === 'habitDetail' ? getModule('dashboard') : null;

    return (
        <div className={`mb-5 rounded-xl border ${stage.theme.border} ${stage.theme.soft} px-3 py-2.5 sm:px-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4`}>
            <div className="flex items-center gap-2 min-w-0 flex-1">
                <button
                    onClick={() => setView(parent?.view ?? stage.hub)}
                    className={`p-1.5 rounded-lg ${stage.theme.text} hover:bg-white/70 transition flex-shrink-0`}
                    aria-label={`Retour à ${parent?.label ?? `l’étape ${stage.label}`}`}
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 text-sm min-w-0">
                    <button onClick={() => setView(stage.hub)} className={`flex items-center gap-1.5 font-semibold ${stage.theme.text} hover:underline flex-shrink-0`}>
                        <StageNumber stage={stage} size="sm" />
                        {stage.label}
                    </button>
                    {parent && (
                        <>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" aria-hidden />
                            <button onClick={() => setView(parent.view)} className="text-slate-600 hover:underline flex-shrink-0">
                                {parent.label}
                            </button>
                        </>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" aria-hidden />
                    <span className="text-slate-700 font-medium truncate" aria-current="page">{module.label}</span>
                </nav>
                <span className="hidden lg:inline text-xs text-slate-500 italic truncate">— {stage.question}</span>
            </div>
            {view !== 'habitDetail' && (
                <button
                    onClick={() => setView(next.hub)}
                    className="self-start sm:self-auto flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition whitespace-nowrap"
                >
                    {stage.key === 'evolution' ? 'Boucler l’arc :' : 'Étape suivante :'} {next.label}
                    <ArrowRight className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
};

export default StageContextBar;
