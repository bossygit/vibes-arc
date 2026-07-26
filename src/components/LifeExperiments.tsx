import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { LifeExperiment, getMetricDef } from '@/types';
import { computeExperimentStats, getExperimentPhase, hasCheckedInToday } from '@/utils/experimentUtils';
import ExperimentForm from './ExperimentForm';
import ExperimentTracker from './ExperimentTracker';
import ExperimentResult from './ExperimentResult';

type Tab = 'active' | 'history' | 'create';

/**
 * LifeExperiments — Hub central du Life Experiment Engine.
 * Vue principale : expérience active, historique, création.
 */
const LifeExperiments: React.FC = () => {
    const experiments = useAppStore((s) => s.experiments);
    const [tab, setTab] = useState<Tab>('active');

    // Trouver l'expérience active (status='active' et phase 'during')
    const activeExperiment = experiments.find(
        (e) => e.status === 'active' && getExperimentPhase(e) === 'during'
    );

    // Expériences passées (complétées ou archivées)
    const history = experiments.filter(
        (e) => e.status === 'completed' || e.status === 'archived' || getExperimentPhase(e) === 'post'
    );

    // Brouillons
    const drafts = experiments.filter((e) => e.status === 'draft' && getExperimentPhase(e) === 'pre');

    const showTab = (t: Tab) => {
        if (t === 'active' && !activeExperiment && history.length > 0) return 'history';
        if (t === 'active' && !activeExperiment && history.length === 0) return 'create';
        return t;
    };

    const effectiveTab = showTab(tab);

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🔬</span>
                <h2 className="text-2xl font-bold text-gradient">Labo d'Expériences</h2>
            </div>
            <p className="text-sm text-slate-500 mb-4">
                Transforme une hypothèse en expérience de 7 jours. Mesure, observe, conclus.
            </p>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl bg-slate-100/80 border border-slate-200 w-fit mb-4">
                {[
                    ['active', '🧪 Active'] as const,
                    ['history', '📋 Historique'] as const,
                    ['create', '✨ Nouvelle'] as const,
                ].map(([value, label]) => {
                    const isDisabled = value === 'active' && !activeExperiment;
                    return (
                        <button
                            key={value}
                            onClick={() => setTab(value)}
                            disabled={isDisabled}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${effectiveTab === value
                                ? 'bg-white text-indigo-700 shadow-sm'
                                : isDisabled
                                    ? 'text-slate-300 cursor-not-allowed'
                                    : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>

            <AnimatePresence mode="wait">
                {effectiveTab === 'active' && activeExperiment && (
                    <motion.div key="active" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <ActiveExperimentCard experiment={activeExperiment} />
                    </motion.div>
                )}
                {effectiveTab === 'history' && (
                    <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        {drafts.length > 0 && (
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-slate-600 mb-2">📝 Brouillons</h3>
                                <div className="grid gap-2">
                                    {drafts.map((exp) => <ExperimentCard key={exp.id} experiment={exp} />)}
                                </div>
                            </div>
                        )}
                        <h3 className="text-sm font-semibold text-slate-600 mb-2">📋 Expériences terminées</h3>
                        {history.length === 0 && drafts.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <div className="text-4xl mb-3">🔬</div>
                                <p>Aucune expérience pour le moment.</p>
                                <p className="text-xs mt-1">Lance-toi ! Crée ta première expérience de 7 jours.</p>
                            </div>
                        ) : (
                            <div className="grid gap-2">
                                {history.map((exp) => <ExperimentCard key={exp.id} experiment={exp} />)}
                            </div>
                        )}
                    </motion.div>
                )}
                {effectiveTab === 'create' && (
                    <motion.div key="create" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <ExperimentForm onCreated={() => setTab('active')} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stats */}
            {experiments.length > 0 && (
                <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-xl bg-indigo-50 p-2">
                        <strong className="block text-indigo-700">{experiments.length}</strong>
                        <span className="text-slate-500">expériences</span>
                    </div>
                    <div className="rounded-xl bg-emerald-50 p-2">
                        <strong className="block text-emerald-700">{history.filter(e => e.status === 'completed').length}</strong>
                        <span className="text-slate-500">terminées</span>
                    </div>
                    <div className="rounded-xl bg-amber-50 p-2">
                        <strong className="block text-amber-700">{drafts.length}</strong>
                        <span className="text-slate-500">brouillons</span>
                    </div>
                </div>
            )}
        </div>
    );
};

/** Carte d'expérience active avec accès au tracker */
const ActiveExperimentCard: React.FC<{ experiment: LifeExperiment }> = ({ experiment }) => {
    const phase = getExperimentPhase(experiment);
    const day = phase === 'during' ? Math.min(7, Math.max(1,
        Math.floor((Date.now() - new Date(experiment.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
    )) : 7;
    const checkedIn = hasCheckedInToday(experiment);
    const stats = experiment.entries.length > 0 ? computeExperimentStats(experiment) : null;

    return (
        <div className="rounded-2xl border border-indigo-200 bg-gradient-to-b from-white to-indigo-50/30 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                    <h3 className="text-lg font-semibold text-slate-800">{experiment.title}</h3>
                    {experiment.hypothesis && (
                        <p className="text-xs text-slate-500 italic mt-0.5">"{experiment.hypothesis}"</p>
                    )}
                </div>
                <div className="shrink-0 px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
                    Jour {day}/7
                </div>
            </div>

            {/* Barre de progression */}
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-purple-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${(day / 7) * 100}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                />
            </div>

            {/* Zone de check-in */}
            {phase === 'during' && (
                <ExperimentTracker experiment={experiment} checkedIn={checkedIn} />
            )}
            {phase === 'post' && experiment.status !== 'completed' && (
                <ExperimentResult experiment={experiment} stats={stats} />
            )}

            {/* Résumé des entrées */}
            {experiment.entries.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                    {experiment.entries.map((entry) => {
                        const avg = Object.values(entry.values).length > 0
                            ? Math.round(Object.values(entry.values).reduce((a, b) => a + b, 0) / Object.values(entry.values).length)
                            : 0;
                        const colors = ['bg-red-100 text-red-700', 'bg-orange-100 text-orange-700', 'bg-amber-100 text-amber-700', 'bg-lime-100 text-lime-700', 'bg-green-100 text-green-700', 'bg-emerald-100 text-emerald-700'];
                        return (
                            <span key={entry.date} className={`px-2 py-0.5 rounded text-[10px] font-medium ${colors[Math.floor(avg / 2)] ?? 'bg-slate-100 text-slate-600'}`}>
                                {entry.date.slice(5)} · {avg}/10
                            </span>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

/** Carte d'expérience dans l'historique */
const ExperimentCard: React.FC<{ experiment: LifeExperiment }> = ({ experiment }) => {
    const stats = experiment.entries.length > 0 ? computeExperimentStats(experiment) : null;
    const daysTracked = experiment.entries.length;
    const isCompleted = experiment.status === 'completed';

    return (
        <div className="rounded-xl border border-slate-200 bg-white/80 p-3 hover:border-indigo-200 transition">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <div className="font-semibold text-slate-800 text-sm truncate">{experiment.title}</div>
                    {experiment.hypothesis && (
                        <p className="text-[11px] text-slate-500 italic truncate">"{experiment.hypothesis}"</p>
                    )}
                </div>
                <div className="shrink-0 flex gap-1.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {isCompleted ? '✅ Terminée' : experiment.status}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                        {daysTracked}/7 jours
                    </span>
                </div>
            </div>
            {stats && (
                <div className="mt-2 flex gap-2 text-[10px]">
                    {Object.entries(stats.metricAverages).slice(0, 3).map(([key, m]) => (
                        <span key={key} className="text-slate-500">
                            {getMetricDef(key).icon} {getMetricDef(key).label} : {m.overallAvg}
                            <span className={m.trend > 0 ? 'text-emerald-600' : m.trend < 0 ? 'text-red-400' : 'text-slate-400'}>
                                {m.trend > 0 ? ` ↑+${m.trend}` : m.trend < 0 ? ` ↓${m.trend}` : ' →0'}
                            </span>
                        </span>
                    ))}
                </div>
            )}
            {isCompleted && experiment.conclusion && (
                <p className="text-[10px] text-slate-400 mt-1 italic line-clamp-1">{experiment.conclusion}</p>
            )}
        </div>
    );
};

export default LifeExperiments;
