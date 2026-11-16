/**
 * Mon Arc — l'accueil de Vibes Arc.
 *
 * Une seule question par étape, l'état réel de chacune, et la prochaine étape à
 * faire. Le « fil d'or » montre, pour chaque désir, la chaîne complète :
 * Vision (désir) → Identité (qui le reçoit) → Action (preuves du jour) → Évolution (verdict).
 */
import React, { useEffect } from 'react';
import { ArrowRight, Check, Circle, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { useArcStore } from '@/store/useArcStore';
import { ARC_STAGES, ArcStage, getStage } from '@/config/arc';
import { getAlignmentZone, VERDICT_LABELS } from '@/types';
import { formatShortDate, moodLabel } from './format';
import { getIdentityColorStyle } from '@/utils/identityColors';
import type { ImageStreamingSession } from '@/types/innerWorld';
import { MomentumBreakGate } from '@/components/MomentumBreakDialog';
import VisionCompass from './VisionCompass';
import { StageNumber } from './StageHub';
import { ArcStatus, useArcStatus } from './useArcStatus';

const VERDICT_STYLE = {
    favorable: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    mitigé: 'bg-amber-50 text-amber-800 border-amber-200',
    défavorable: 'bg-rose-50 text-rose-700 border-rose-200',
} as const;

const Line: React.FC<{ ok?: boolean; children: React.ReactNode }> = ({ ok, children }) => (
    <li className="flex items-start gap-2 text-sm text-slate-600">
        {ok === undefined ? (
            <span className="w-4 h-4 mt-0.5 flex-shrink-0 flex items-center justify-center"><span className="w-1.5 h-1.5 rounded-full bg-slate-300" /></span>
        ) : ok ? (
            <Check className="w-4 h-4 mt-0.5 text-emerald-600 flex-shrink-0" aria-label="fait" />
        ) : (
            <Circle className="w-4 h-4 mt-0.5 text-slate-300 flex-shrink-0" aria-label="à faire" />
        )}
        <span className="min-w-0">{children}</span>
    </li>
);

const StageCard: React.FC<{ stage: ArcStage; status: ArcStatus; isNext: boolean; latestInner: string | null }> = ({
    stage,
    status,
    isNext,
    latestInner,
}) => {
    const setView = useAppStore((s) => s.setView);
    const { vision, identity, action, evolution } = status;

    let lines: React.ReactNode;
    if (stage.key === 'vision') {
        lines = (
            <>
                <Line ok={!!vision.statement}>{vision.statement ? 'Boussole écrite' : 'Boussole à écrire'}</Line>
                <Line ok={vision.activeDesires.length > 0}>
                    {vision.activeDesires.length} désir{vision.activeDesires.length > 1 ? 's' : ''} actif{vision.activeDesires.length > 1 ? 's' : ''}
                </Line>
                {vision.activeDesires.length > 0 && (
                    <Line ok={vision.withFutureSelf === vision.activeDesires.length}>
                        Futur soi décrit pour {vision.withFutureSelf}/{vision.activeDesires.length}
                    </Line>
                )}
            </>
        );
    } else if (stage.key === 'identity') {
        lines = (
            <>
                <Line ok={identity.identities.length > 0}>
                    {identity.identities.length} identité{identity.identities.length > 1 ? 's' : ''} · {identity.beliefs} croyance{identity.beliefs > 1 ? 's' : ''}
                </Line>
                <Line ok={identity.signals > 0}>{identity.signals} {identity.signals > 1 ? 'signaux reliés' : 'signal relié'} à une identité</Line>
                {identity.gaps.length > 0 ? (
                    <Line ok={false}>{identity.gaps.length} identité{identity.gaps.length > 1 ? 's' : ''} à compléter</Line>
                ) : identity.top ? (
                    <Line>La plus intégrée : {identity.top.identity.name} ({identity.top.score} %)</Line>
                ) : null}
            </>
        );
    } else if (stage.key === 'action') {
        const total = action.activeToday.length;
        const pct = total > 0 ? Math.round((action.done / total) * 100) : 0;
        lines = (
            <>
                <li>
                    <div className="flex items-baseline justify-between text-sm">
                        <span className="text-slate-600">Preuves du jour</span>
                        <span className="font-bold text-slate-800">{action.done}/{total}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 mt-1 overflow-hidden">
                        <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                </li>
                <Line ok={action.morningDone}>Intention du matin</Line>
                <Line ok={action.eveningDone}>Preuve du soir</Line>
            </>
        );
    } else {
        const sign = evolution.delta > 0 ? '+' : '';
        lines = (
            <>
                <Line>
                    Signaux sur 7 j : <strong className="text-slate-800">{evolution.last7} %</strong>{' '}
                    <span className={evolution.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}>({sign}{evolution.delta} pts)</span>
                </Line>
                <Line ok={!!evolution.todayMood}>
                    {evolution.moodAvg7 !== null ? `Fréquence moyenne : ${moodLabel(evolution.moodAvg7)}` : 'Fréquence non notée cette semaine'}
                </Line>
                {latestInner && <Line>{latestInner}</Line>}
            </>
        );
    }

    return (
        <div className={`relative bg-white rounded-2xl border p-5 flex flex-col h-full transition ${isNext ? `${stage.theme.border} ring-2 ring-offset-2 ring-slate-200 shadow-medium` : 'border-slate-200 shadow-soft'}`}>
            {isNext && (
                <span className={`absolute -top-2.5 left-5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white ${stage.theme.strong}`}>
                    Maintenant
                </span>
            )}
            <div className="flex items-center gap-2">
                <StageNumber stage={stage} />
                <h3 className={`font-bold ${stage.theme.text}`}>{stage.label}</h3>
            </div>
            <p className="text-sm text-slate-800 font-medium mt-2 leading-snug">{stage.question}</p>
            <ul className="space-y-1.5 mt-3 flex-1">{lines}</ul>
            <button
                onClick={() => setView(stage.hub)}
                className={`mt-4 flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-lg text-sm font-medium ${stage.theme.soft} ${stage.theme.text} hover:opacity-80 transition`}
            >
                Ouvrir l’étape
                <ArrowRight className="w-4 h-4" />
            </button>
        </div>
    );
};

const GoldenThread: React.FC<{ status: ArcStatus }> = ({ status }) => {
    const setView = useAppStore((s) => s.setView);
    if (status.threads.length === 0) return null;
    const [vision, identity, action, evolution] = ARC_STAGES;

    return (
        <section aria-labelledby="fil-dor" className="card">
            <h2 id="fil-dor" className="text-lg font-bold text-slate-800">Le fil d’or</h2>
            <p className="text-sm text-slate-500 mb-4">
                Pour chaque désir, la chaîne complète : ce que tu veux → qui doit le recevoir → ce que tu as prouvé aujourd’hui → ce que le Tribunal en conclut.
            </p>
            <div className="hidden md:grid grid-cols-[1.4fr_1.2fr_0.8fr_1fr] gap-3 px-3 pb-2 text-[11px] font-bold uppercase tracking-wider">
                <span className={vision.theme.text}>1 · {vision.label}</span>
                <span className={identity.theme.text}>2 · {identity.label}</span>
                <span className={action.theme.text}>3 · Aujourd’hui</span>
                <span className={evolution.theme.text}>4 · Verdict 30 j</span>
            </div>
            <ul className="space-y-2">
                {status.threads.map(({ desire, identities, todayDone, todayTotal, credibility }) => (
                    <li key={desire.id}>
                        <button
                            onClick={() => setView('tribunal')}
                            className="w-full text-left grid grid-cols-1 md:grid-cols-[1.4fr_1.2fr_0.8fr_1fr] gap-2 md:gap-3 items-center rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 px-3 py-3 transition"
                        >
                            <span className="min-w-0">
                                <span className="block font-semibold text-slate-800 truncate">{desire.title}</span>
                                <span className="text-xs text-slate-500">{desire.type === 'être' ? 'Être' : 'Avoir'}{desire.target ? ` · ${desire.target}` : ''}</span>
                            </span>
                            <span className="flex flex-wrap gap-1">
                                {identities.length === 0 ? (
                                    <span className="text-xs text-rose-600">Aucune identité reliée</span>
                                ) : identities.map((i) => (
                                    <span key={i.id} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${getIdentityColorStyle(i.color).bg} ${getIdentityColorStyle(i.color).border}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${getIdentityColorStyle(i.color).dot}`} />
                                        {i.name}
                                    </span>
                                ))}
                            </span>
                            <span className="text-sm text-slate-700">
                                {todayTotal === 0 ? (
                                    <span className="text-xs text-slate-400">aucun signal aujourd’hui</span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className="font-bold">{todayDone}/{todayTotal}</span>
                                        <span className="flex gap-0.5" aria-hidden>
                                            {Array.from({ length: Math.min(todayTotal, 8) }, (_, k) => (
                                                <span key={k} className={`w-1.5 h-3 rounded-sm ${k < todayDone ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                                            ))}
                                        </span>
                                    </span>
                                )}
                            </span>
                            <span className={`justify-self-start inline-flex items-center gap-2 text-xs font-medium px-2 py-1 rounded-lg border ${VERDICT_STYLE[credibility.verdict]}`} title={VERDICT_LABELS[credibility.verdict]}>
                                <strong className="text-sm">{credibility.total}</strong>
                                {credibility.verdict}
                            </span>
                        </button>
                    </li>
                ))}
            </ul>
        </section>
    );
};

const ArcHome: React.FC = () => {
    const habits = useAppStore((s) => s.habits);
    const setView = useAppStore((s) => s.setView);
    const status = useArcStatus();
    const innerWorld = useArcStore((s) => s.innerWorld);
    const loadInnerWorld = useArcStore((s) => s.loadInnerWorld);

    useEffect(() => {
        loadInnerWorld();
    }, [loadInnerWorld]);

    const next = status.nextStep;
    const nextStage = getStage(next.stage);

    const sessions: ImageStreamingSession[] = innerWorld?.snapshot?.sessions ?? [];
    const lastSession = sessions.reduce<ImageStreamingSession | null>(
        (best, s) => (!best || s.number > best.number ? s : best),
        null,
    );
    const latestInner = lastSession ? `Image Streaming : séance #${lastSession.number} du ${formatShortDate(lastSession.date)}` : null;

    const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    const moodZone = status.evolution.todayMood ? getAlignmentZone(status.evolution.todayMood.score) : null;

    return (
        <div className="space-y-8">
            <MomentumBreakGate habits={habits} todayIdx={status.action.todayIdx} />

            <section className="rounded-2xl bg-gradient-to-br from-indigo-700 via-violet-700 to-purple-800 text-white p-6 md:p-8 shadow-medium">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <p className="text-xs font-semibold uppercase tracking-widest text-white/70">Mon arc · {today}</p>
                    {moodZone && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/15">
                            Fréquence du jour : {moodLabel(status.evolution.todayMood!.score)}
                        </span>
                    )}
                </div>
                <h1 className="text-sm text-white/80 mt-3 mb-2">Qui je deviens</h1>
                <VisionCompass variant="hero" />
            </section>

            <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl border-2 ${nextStage.theme.border} ${nextStage.theme.soft} p-5 flex flex-col sm:flex-row sm:items-center gap-4`}
                aria-labelledby="prochaine-etape"
            >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    <StageNumber stage={nextStage} size="lg" />
                    <div className="min-w-0">
                        <p className={`text-xs font-bold uppercase tracking-wider ${nextStage.theme.text}`}>
                            Prochaine étape · {nextStage.label}
                        </p>
                        <h2 id="prochaine-etape" className="text-lg font-bold text-slate-800 leading-snug">{next.title}</h2>
                        <p className="text-sm text-slate-600">{next.detail}</p>
                    </div>
                </div>
                <button
                    onClick={() => setView(next.view)}
                    className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white font-medium ${nextStage.theme.strong} hover:opacity-90 transition whitespace-nowrap`}
                >
                    {next.cta}
                    <ArrowRight className="w-4 h-4" />
                </button>
            </motion.section>

            <section aria-labelledby="le-cycle">
                <div className="flex items-end justify-between gap-3 mb-3">
                    <div>
                        <h2 id="le-cycle" className="text-lg font-bold text-slate-800">Le cycle</h2>
                        <p className="text-sm text-slate-500">Quatre questions, dans l’ordre — puis l’évolution réajuste la vision.</p>
                    </div>
                </div>
                <ol className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {ARC_STAGES.map((stage) => (
                        <li key={stage.key} className="h-full">
                            <StageCard
                                stage={stage}
                                status={status}
                                isNext={stage.key === next.stage}
                                latestInner={stage.key === 'evolution' ? latestInner : null}
                            />
                        </li>
                    ))}
                </ol>
                <button
                    onClick={() => setView('hubVision')}
                    className="mt-3 w-full flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-slate-700 py-2"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Ce que l’évolution t’apprend nourrit la vision suivante
                </button>
            </section>

            <GoldenThread status={status} />
        </div>
    );
};

export default ArcHome;
