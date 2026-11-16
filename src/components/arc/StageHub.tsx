/**
 * Gabarit commun des quatre pages d'étape :
 *   bandeau (étape n/4, question, promesse) → cœur de l'étape (données vivantes)
 *   → outils de l'étape, regroupés → passage à l'étape précédente / suivante.
 */
import React from 'react';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import {
    ARC_STAGES,
    ArcModule,
    ArcStage,
    ArcStageKey,
    getNextStage,
    getPreviousStage,
    getStage,
    getStageGroups,
} from '@/config/arc';

export const StageNumber: React.FC<{ stage: ArcStage; size?: 'sm' | 'md' | 'lg'; inverted?: boolean }> = ({
    stage,
    size = 'md',
    inverted = false,
}) => {
    const dims = size === 'sm' ? 'w-5 h-5 text-[11px]' : size === 'lg' ? 'w-10 h-10 text-lg' : 'w-7 h-7 text-sm';
    const colors = inverted ? 'bg-white/20 text-white' : `${stage.theme.strong} text-white`;
    return (
        <span className={`${dims} ${colors} rounded-full inline-flex items-center justify-center font-bold flex-shrink-0`}>
            {stage.step}
        </span>
    );
};

/** Les 4 étapes en pastilles, l'étape courante en évidence. */
export const ArcProgress: React.FC<{ current: ArcStageKey; onLight?: boolean }> = ({ current, onLight = false }) => {
    const setView = useAppStore((s) => s.setView);
    return (
        <nav aria-label="Progression dans l'arc" className="flex items-center gap-1.5 flex-wrap">
            {ARC_STAGES.map((stage, i) => {
                const active = stage.key === current;
                const base = onLight
                    ? active ? `${stage.theme.strong} text-white` : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    : active ? 'bg-white text-slate-900' : 'bg-white/15 text-white/80 hover:bg-white/25';
                return (
                    <React.Fragment key={stage.key}>
                        <button
                            onClick={() => setView(stage.hub)}
                            aria-current={active ? 'step' : undefined}
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold transition ${base}`}
                        >
                            {stage.step} · {stage.label}
                        </button>
                        {i < ARC_STAGES.length - 1 && (
                            <ArrowRight className={`w-3 h-3 ${onLight ? 'text-slate-300' : 'text-white/50'}`} aria-hidden />
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
};

const ToolCard: React.FC<{ module: ArcModule; stage: ArcStage }> = ({ module, stage }) => {
    const setView = useAppStore((s) => s.setView);
    return (
        <button
            onClick={() => setView(module.view)}
            className={`group text-left bg-white rounded-xl border border-slate-200 p-4 hover:shadow-medium ${stage.theme.hoverBorder} transition flex items-start gap-3`}
        >
            <span className={`text-xl w-10 h-10 rounded-lg ${stage.theme.soft} flex items-center justify-center flex-shrink-0`} aria-hidden>
                {module.emoji}
            </span>
            <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 text-sm">{module.label}</span>
                    {module.isNew && (
                        <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${stage.theme.soft} ${stage.theme.text}`}>
                            Nouveau
                        </span>
                    )}
                </span>
                <span className="block text-xs text-slate-500 mt-0.5 leading-relaxed">{module.purpose}</span>
            </span>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 mt-1 flex-shrink-0 transition" aria-hidden />
        </button>
    );
};

export const StageTools: React.FC<{ stage: ArcStage }> = ({ stage }) => {
    const groups = getStageGroups(stage.key);
    return (
        <section aria-labelledby={`tools-${stage.key}`} className="space-y-5">
            <div>
                <h2 id={`tools-${stage.key}`} className="text-lg font-bold text-slate-800">
                    Les outils de l’étape {stage.label}
                </h2>
                <p className="text-sm text-slate-500">Chacun répond à la même question : {stage.question.toLowerCase()}</p>
            </div>
            {groups.map(({ group, modules }) => (
                <div key={group}>
                    <h3 className={`text-xs font-bold uppercase tracking-wider ${stage.theme.text} mb-2`}>{group}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {modules.map((m) => <ToolCard key={m.view} module={m} stage={stage} />)}
                    </div>
                </div>
            ))}
        </section>
    );
};

const StageFooter: React.FC<{ stage: ArcStage }> = ({ stage }) => {
    const setView = useAppStore((s) => s.setView);
    const prev = getPreviousStage(stage.key);
    const next = getNextStage(stage.key);
    const loops = stage.key === 'evolution';
    return (
        <div className="flex flex-col sm:flex-row gap-3 justify-between pt-2">
            <button
                onClick={() => setView(prev.hub)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-600 hover:bg-slate-50 transition"
            >
                <ArrowLeft className="w-4 h-4" />
                <span>
                    <span className="block text-[11px] text-slate-400 text-left">Étape {prev.step}</span>
                    {prev.label}
                </span>
            </button>
            <button
                onClick={() => setView(next.hub)}
                className={`flex items-center justify-between sm:justify-start gap-3 px-4 py-3 rounded-xl text-white text-sm ${next.theme.strong} hover:opacity-90 transition`}
            >
                <span className="text-left">
                    <span className="block text-[11px] text-white/70">
                        {loops ? 'Boucler l’arc — revenir à la' : `Étape ${next.step}`}
                    </span>
                    <span className="font-semibold">{next.label} · {next.question}</span>
                </span>
                {loops ? <RotateCcw className="w-4 h-4 flex-shrink-0" /> : <ArrowRight className="w-4 h-4 flex-shrink-0" />}
            </button>
        </div>
    );
};

interface StageHubProps {
    stageKey: ArcStageKey;
    children: React.ReactNode;
}

const StageHub: React.FC<StageHubProps> = ({ stageKey, children }) => {
    const stage = getStage(stageKey);
    const Icon = stage.icon;
    return (
        <div className="space-y-8">
            <section className={`rounded-2xl bg-gradient-to-br ${stage.theme.gradient} text-white p-6 md:p-8 shadow-medium`}>
                <ArcProgress current={stage.key} />
                <div className="flex items-start gap-4 mt-5">
                    <div className="p-3 bg-white/15 rounded-xl flex-shrink-0">
                        <Icon className="w-7 h-7" aria-hidden />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-widest text-white/70">
                            Étape {stage.step} sur 4 · {stage.label}
                        </p>
                        <h1 className="text-2xl md:text-3xl font-bold mt-1 leading-tight">{stage.question}</h1>
                        <p className="text-white/80 text-sm mt-2 max-w-2xl">{stage.promise}</p>
                    </div>
                </div>
            </section>

            {children}

            <StageTools stage={stage} />
            <StageFooter stage={stage} />
        </div>
    );
};

export default StageHub;
