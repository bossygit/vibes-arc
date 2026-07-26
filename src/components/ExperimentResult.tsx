import React from 'react';
import { motion } from 'framer-motion';
import { LifeExperiment, getMetricDef } from '@/types';
import { ExperimentStats } from '@/utils/experimentUtils';

interface Props {
    experiment: LifeExperiment;
    stats: ExperimentStats | null;
}

/**
 * ExperimentResult — Visualisation des résultats avant/après.
 * Comparaison des moyennes, tendances, et conclusion.
 */
const ExperimentResult: React.FC<Props> = ({ experiment, stats }) => {
    if (!stats || stats.totalDays === 0) {
        return (
            <div className="text-center py-8 text-slate-500">
                <p>Pas assez de données pour générer des résultats.</p>
            </div>
        );
    }

    const completedCount = stats.trackedDays;
    const hasGoodData = completedCount >= 3;

    return (
        <div className="rounded-xl bg-white/90 border border-slate-200 p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">📊</span>
                <h3 className="text-sm font-semibold text-slate-700">Résultats de l'expérience</h3>
            </div>

            {/* Score global */}
            {hasGoodData && (
                <div className="text-center mb-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200">
                        <span className="text-2xl font-bold text-indigo-700">{stats.score}%</span>
                        <span className="text-xs text-slate-500">tendance globale</span>
                    </div>
                </div>
            )}

            {/* Graphique des métriques */}
            <div className="space-y-3 mb-3">
                {Object.entries(stats.metricAverages).map(([key, m]) => {
                    const def = getMetricDef(key);
                    const improving = m.trend > 0;
                    const declin = m.trend < 0;

                    return (
                        <div key={key}>
                            <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-slate-600">{def.icon} {def.label}</span>
                                <span className="flex items-center gap-1">
                                    <span className="text-slate-400">{m.first3Avg}</span>
                                    <span className="text-slate-300">→</span>
                                    <span className="font-semibold text-slate-700">{m.last3Avg}</span>
                                    <span className={improving ? 'text-emerald-600' : declin ? 'text-red-400' : 'text-slate-400'}>
                                        {improving ? `↑+${m.trend}` : declin ? `↓${m.trend}` : '→0'}
                                    </span>
                                </span>
                            </div>
                            {/* Barre comparée avant/après */}
                            <div className="flex gap-1 items-center">
                                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden relative">
                                    <motion.div
                                        className="absolute left-0 top-0 h-full rounded-full bg-indigo-400"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(m.first3Avg / 10) * 100}%` }}
                                        transition={{ duration: 1, ease: 'easeOut' }}
                                    />
                                </div>
                                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden relative">
                                    <motion.div
                                        className="absolute left-0 top-0 h-full rounded-full bg-emerald-500"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(m.last3Avg / 10) * 100}%` }}
                                        transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
                                <span>Début (j1-3)</span>
                                <span>Fin (j5-7)</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Meilleur / pire jour */}
            <div className="grid grid-cols-2 gap-2 mb-3">
                {stats.bestDay && (
                    <div className="rounded-lg bg-emerald-50 p-2 text-center">
                        <span className="text-[10px] text-emerald-600">🌟 Meilleur jour</span>
                        <div className="text-xs font-semibold text-emerald-700">{stats.bestDay.slice(5)}</div>
                    </div>
                )}
                {stats.worstDay && (
                    <div className="rounded-lg bg-rose-50 p-2 text-center">
                        <span className="text-[10px] text-rose-600">🌧️ Jour difficile</span>
                        <div className="text-xs font-semibold text-rose-700">{stats.worstDay.slice(5)}</div>
                    </div>
                )}
            </div>

            {/* Conclusion */}
            {experiment.conclusion && (
                <div className="rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 p-3">
                    <p className="text-xs font-semibold text-violet-700 mb-1">📝 Conclusion</p>
                    <p className="text-sm text-violet-900/80 italic">"{experiment.conclusion}"</p>
                </div>
            )}
        </div>
    );
};

export default ExperimentResult;
