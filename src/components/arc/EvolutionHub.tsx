/**
 * Étape 4 · Évolution — « Que m'apprennent mes résultats sur moi-même ? »
 * Cœur : la semaine en chiffres, le verdict de chaque dossier, les leçons
 * détectées, le monde intérieur (Image Streaming × rêves) — puis le retour à la vision.
 */
import React, { useEffect, useMemo } from 'react';
import { ArrowRight, MoonStar, RotateCcw } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useArcStore } from '@/store/useArcStore';
import { VERDICT_LABELS } from '@/types';
import { generateInsights } from '@/utils/insightEngine';
import { analyzeInnerWorld } from '@/utils/innerWorld/analysis';
import { todayLocalISO } from '@/utils/dateUtils';
import StageHub from './StageHub';
import { useArcStatus } from './useArcStatus';
import { formatShortDate, moodLabel } from './format';

const SEVERITY_STYLE = {
    critical: 'border-rose-200 bg-rose-50',
    alert: 'border-amber-200 bg-amber-50',
    info: 'border-slate-200 bg-white',
    win: 'border-emerald-200 bg-emerald-50',
} as const;

const SEVERITY_RANK = { critical: 0, alert: 1, win: 2, info: 3 } as const;

const VERDICT_BAR = {
    favorable: 'bg-emerald-500',
    mitigé: 'bg-amber-500',
    défavorable: 'bg-rose-500',
} as const;

const Stat: React.FC<{ label: string; value: React.ReactNode; hint?: React.ReactNode }> = ({ label, value, hint }) => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-soft p-4">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
        {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
    </div>
);

const InnerWorldSummary: React.FC = () => {
    const setView = useAppStore((s) => s.setView);
    const innerWorld = useArcStore((s) => s.innerWorld);
    const status = useArcStore((s) => s.innerWorldStatus);
    const loadInnerWorld = useArcStore((s) => s.loadInnerWorld);

    useEffect(() => {
        loadInnerWorld();
    }, [loadInnerWorld]);

    const analysis = useMemo(
        () => (innerWorld?.snapshot ? analyzeInnerWorld(innerWorld.snapshot, { today: todayLocalISO() }) : null),
        [innerWorld?.snapshot],
    );
    // Les symboles omniprésents (> 75 % des séances) bougent à chaque fois : on montre ceux qui disent quelque chose.
    const moved = analysis
        ? analysis.latestEvolutions.filter((s) => s.count / Math.max(1, analysis.stats.sessions) <= 0.75).slice(0, 2)
        : [];

    return (
        <section aria-labelledby="monde-interieur" className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 text-white p-5 md:p-6">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                    <MoonStar className="w-5 h-5 text-violet-300" aria-hidden />
                    <h2 id="monde-interieur" className="text-lg font-bold">Monde intérieur</h2>
                </div>
                <span className="text-[11px] text-white/60">Image Streaming × rêves</span>
            </div>

            {!analysis ? (
                <p className="text-sm text-white/70 mt-3">
                    {status === 'loading'
                        ? 'Lecture de ton coffre Obsidian…'
                        : 'Tes séances d’Image Streaming et tes rêves ne sont pas encore connectés. Ouvre le module pour voir comment les relier.'}
                </p>
            ) : (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-violet-300">Dernière séance</p>
                        {analysis.latestSession ? (
                            <>
                                <p className="text-sm font-semibold mt-1">#{analysis.latestSession.number} · {formatShortDate(analysis.latestSession.date)}</p>
                                <p className="text-xs text-white/70 mt-1 line-clamp-3">{analysis.latestSession.excerpt}</p>
                            </>
                        ) : <p className="text-sm text-white/60 mt-1">—</p>}
                    </div>
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-violet-300">Ce qui a bougé</p>
                        {moved.map((s) => (
                            <p key={s.name} className="text-xs text-white/80 mt-1 line-clamp-3">
                                <span className="font-semibold text-white">{s.name}</span> — {s.evolution ?? s.emotionArc}
                            </p>
                        ))}
                        {moved.length === 0 && <p className="text-sm text-white/60 mt-1">—</p>}
                    </div>
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-violet-300">Rêves ↔ séances</p>
                        <p className="text-sm mt-1">
                            <strong>{analysis.stats.sharedSymbols}</strong> symboles partagés · <strong>{analysis.echoes.length}</strong> rêve{analysis.echoes.length > 1 ? 's' : ''} en écho
                        </p>
                        {analysis.latestDream && (
                            <p className="text-xs text-white/70 mt-1">Dernier rêve : {analysis.latestDream.title} ({formatShortDate(analysis.latestDream.date!)})</p>
                        )}
                    </div>
                </div>
            )}

            <button onClick={() => setView('innerWorld')} className="mt-5 flex items-center gap-1.5 text-sm font-medium text-violet-200 hover:text-white transition">
                Explorer le monde intérieur
                <ArrowRight className="w-4 h-4" />
            </button>
        </section>
    );
};

const EvolutionHub: React.FC = () => {
    const status = useArcStatus();
    const { identities, habits, desires, dailyMoods, accusers, experiments, skipsByHabit, setView } = useAppStore();
    const statement = useArcStore((s) => s.vision.statement);
    const { evolution, threads } = status;

    const insights = useMemo(
        () => generateInsights({ identities, habits, desires, dailyMoods, accusers, experiments, skipsByHabit })
            .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])
            .slice(0, 3),
        [identities, habits, desires, dailyMoods, accusers, experiments, skipsByHabit],
    );

    const sign = evolution.delta > 0 ? '+' : '';

    return (
        <StageHub stageKey="evolution">
            <section aria-labelledby="ma-semaine" className="space-y-3">
                <h2 id="ma-semaine" className="text-lg font-bold text-slate-800">Ma semaine en résultats</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Stat
                        label="Signaux émis sur 7 jours"
                        value={`${evolution.last7} %`}
                        hint={<span className={evolution.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{sign}{evolution.delta} pts vs semaine précédente</span>}
                    />
                    <Stat
                        label="Fréquence moyenne"
                        value={evolution.moodAvg7 !== null ? moodLabel(evolution.moodAvg7) : '—'}
                        hint={`${evolution.moodDays7} jour${evolution.moodDays7 > 1 ? 's' : ''} noté${evolution.moodDays7 > 1 ? 's' : ''} sur 7`}
                    />
                    <Stat
                        label="Journal"
                        value={evolution.journalWeek}
                        hint={`entrée${evolution.journalWeek > 1 ? 's' : ''} cette semaine`}
                    />
                </div>
            </section>

            {threads.length > 0 && (
                <section aria-labelledby="verdicts" className="card">
                    <h2 id="verdicts" className="text-lg font-bold text-slate-800">Le verdict de chaque dossier</h2>
                    <p className="text-sm text-slate-500 mb-4">Sur 30 jours : tes actions, ton alignement et tes accusateurs, désir par désir.</p>
                    <ul className="space-y-3">
                        {threads.map(({ desire, credibility }) => (
                            <li key={desire.id}>
                                <button onClick={() => setView('tribunal')} className="w-full text-left">
                                    <div className="flex items-baseline justify-between gap-3">
                                        <span className="text-sm font-semibold text-slate-800 truncate">{desire.title}</span>
                                        <span className="text-sm font-bold text-slate-800 flex-shrink-0">{credibility.total}<span className="text-xs font-normal text-slate-500">/100 · {credibility.verdict}</span></span>
                                    </div>
                                    <div className="h-2 rounded-full bg-slate-100 mt-1.5 overflow-hidden">
                                        <div className={`h-full ${VERDICT_BAR[credibility.verdict]}`} style={{ width: `${credibility.total}%` }} />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Actions {credibility.actionScore} % · Alignement {credibility.alignmentScore} % · Accusateurs {credibility.accuserPenalty} % — {VERDICT_LABELS[credibility.verdict]}
                                    </p>
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {insights.length > 0 && (
                <section aria-labelledby="lecons" className="space-y-3">
                    <div>
                        <h2 id="lecons" className="text-lg font-bold text-slate-800">Ce que tes données disent de toi</h2>
                        <p className="text-sm text-slate-500">Les trois signaux les plus importants détectés par Vibes AI.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {insights.map((insight) => (
                            <article key={insight.id} className={`rounded-xl border p-4 ${SEVERITY_STYLE[insight.severity]}`}>
                                <p className="text-sm font-semibold text-slate-800"><span aria-hidden>{insight.emoji} </span>{insight.title}</p>
                                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{insight.description}</p>
                                {insight.actionView && insight.actionLabel && (
                                    <button onClick={() => setView(insight.actionView!)} className="mt-2 text-xs font-medium text-amber-800 hover:underline">
                                        {insight.actionLabel} →
                                    </button>
                                )}
                            </article>
                        ))}
                    </div>
                    <button onClick={() => setView('vibesInsights')} className="flex items-center gap-1.5 text-sm font-medium text-amber-800 hover:underline">
                        Toutes les analyses
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </section>
            )}

            <InnerWorldSummary />

            <section aria-labelledby="boucler" className="rounded-2xl border-2 border-dashed border-violet-300 bg-violet-50/60 p-5 md:p-6">
                <div className="flex items-center gap-2">
                    <RotateCcw className="w-5 h-5 text-violet-600" aria-hidden />
                    <h2 id="boucler" className="text-lg font-bold text-slate-800">Boucler l’arc</h2>
                </div>
                <p className="text-sm text-slate-600 mt-2">
                    Après cette relecture, ta boussole dit-elle toujours vrai ? Garde-la, précise-la ou change de cap.
                </p>
                {statement && <blockquote className="mt-3 text-slate-800 font-medium italic border-l-4 border-violet-400 pl-3">« {statement} »</blockquote>}
                <button onClick={() => setView('hubVision')} className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition">
                    Revenir à la vision
                    <ArrowRight className="w-4 h-4" />
                </button>
            </section>
        </StageHub>
    );
};

export default EvolutionHub;
