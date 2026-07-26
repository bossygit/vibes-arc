import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { generateInsights, InsightCategory, InsightSeverity } from '@/utils/insightEngine';
import { ViewType } from '@/types';

const CATEGORY_CONFIG: Record<InsightCategory, { emoji: string; label: string; color: string }> = {
    mood: { emoji: '😊', label: 'Émotions', color: 'from-emerald-400 to-teal-500' },
    habits: { emoji: '🎯', label: 'Habitudes', color: 'from-blue-400 to-indigo-500' },
    accusers: { emoji: '⚖️', label: 'Accusateurs', color: 'from-rose-400 to-pink-500' },
    momentum: { emoji: '🌊', label: 'Momentum', color: 'from-cyan-400 to-blue-500' },
    desires: { emoji: '✨', label: 'Désirs', color: 'from-violet-400 to-purple-500' },
    experiments: { emoji: '🔬', label: 'Expériences', color: 'from-amber-400 to-orange-500' },
    general: { emoji: '💡', label: 'Général', color: 'from-slate-400 to-slate-500' },
};

const SEVERITY_STYLES: Record<InsightSeverity, { bg: string; border: string; icon: string }> = {
    critical: { bg: 'bg-rose-50', border: 'border-rose-200', icon: '🚨' },
    alert: { bg: 'bg-amber-50', border: 'border-amber-200', icon: '⚠️' },
    info: { bg: 'bg-indigo-50', border: 'border-indigo-200', icon: '💡' },
    win: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: '🏆' },
};

/**
 * VibesInsights — Dashboard intelligent qui analyse toutes les données
 * et présente les patterns, corrélations et recommandations.
 */
const VibesInsights: React.FC = () => {
    const store = useAppStore();
    const [filterCategory, setFilterCategory] = useState<InsightCategory | 'all'>('all');
    const [filterSeverity, setFilterSeverity] = useState<InsightSeverity | 'all'>('all');

    const insights = useMemo(() => {
        return generateInsights({
            identities: store.identities,
            habits: store.habits,
            desires: store.desires,
            dailyMoods: store.dailyMoods,
            accusers: store.accusers,
            experiments: store.experiments,
            skipsByHabit: store.skipsByHabit,
        });
    }, [store.identities, store.habits, store.desires, store.dailyMoods, store.accusers, store.experiments, store.skipsByHabit]);

    const filtered = useMemo(() => {
        return insights.filter((i) => {
            if (filterCategory !== 'all' && i.category !== filterCategory) return false;
            if (filterSeverity !== 'all' && i.severity !== filterSeverity) return false;
            return true;
        });
    }, [insights, filterCategory, filterSeverity]);

    // Compter par catégorie et sévérité
    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        insights.forEach((i) => { counts[i.category] = (counts[i.category] || 0) + 1; });
        return counts;
    }, [insights]);

    const severityCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        insights.forEach((i) => { counts[i.severity] = (counts[i.severity] || 0) + 1; });
        return counts;
    }, [insights]);

    const handleAction = (view?: ViewType) => {
        if (view) store.setView(view);
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">✨</span>
                <h2 className="text-2xl font-bold text-gradient">Vibes AI</h2>
            </div>
            <p className="text-sm text-slate-500 mb-4">
                Analyse intelligente de tes données. Patterns, corrélations et recommandations que tu ne vois pas.
            </p>

            {/* Barre de statut */}
            <div className="flex flex-wrap gap-2 mb-4">
                <div className="px-3 py-1.5 rounded-xl bg-white/80 border border-slate-200 text-xs text-slate-600">
                    <strong className="text-slate-800">{insights.length}</strong> insights
                </div>
                {(['critical', 'alert', 'win', 'info'] as InsightSeverity[]).map((sev) => {
                    const count = severityCounts[sev] || 0;
                    if (count === 0) return null;
                    const style = SEVERITY_STYLES[sev];
                    return (
                        <button
                            key={sev}
                            onClick={() => setFilterSeverity(filterSeverity === sev ? 'all' : sev)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${filterSeverity === sev
                                ? `${style.bg} ${style.border.replace('border', 'border-2')}`
                                : 'bg-white/60 border-slate-200 text-slate-500 hover:bg-slate-50'
                            }`}
                        >
                            {style.icon} {count}
                        </button>
                    );
                })}
            </div>

            {/* Filtres par catégorie */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
                <button
                    onClick={() => setFilterCategory('all')}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${filterCategory === 'all'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white/60 border-slate-200 text-slate-500 hover:border-indigo-200'
                    }`}
                >
                    Tous ({insights.length})
                </button>
                {(Object.entries(CATEGORY_CONFIG) as [InsightCategory, typeof CATEGORY_CONFIG[InsightCategory]][]).map(([key, cfg]) => {
                    const count = categoryCounts[key] || 0;
                    if (count === 0) return null;
                    return (
                        <button
                            key={key}
                            onClick={() => setFilterCategory(filterCategory === key ? 'all' : key)}
                            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${filterCategory === key
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white/60 border-slate-200 text-slate-500 hover:border-indigo-200'
                            }`}
                        >
                            {cfg.emoji} {cfg.label} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Liste des insights */}
            {filtered.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                    <div className="text-5xl mb-3">🧠</div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-1">Pas encore assez de données</h3>
                    <p className="text-sm max-w-sm mx-auto">
                        Continue à tracker tes habitudes, moods et désirs. Plus tu accumules de données, plus les insights seront précis et nombreux.
                    </p>
                </div>
            ) : (
                <div className="grid gap-3">
                    <AnimatePresence>
                        {filtered.map((insight, i) => {
                            const sevStyle = SEVERITY_STYLES[insight.severity];
                            const catCfg = CATEGORY_CONFIG[insight.category];
                            return (
                                <motion.div
                                    key={insight.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    transition={{ delay: i * 0.04, duration: 0.25 }}
                                    className={`rounded-xl border ${sevStyle.border} ${sevStyle.bg} p-3 sm:p-4`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="text-xl shrink-0 mt-0.5">{insight.emoji}</div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="font-semibold text-slate-800 text-sm">{insight.title}</h3>
                                                <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-medium bg-white/70 text-slate-500`}>
                                                    {catCfg.emoji} {catCfg.label}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-600 mt-1">{insight.description}</p>

                                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                                                {insight.metric && (
                                                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/70 text-[11px]">
                                                        <span className="text-slate-400">{insight.metric.label}</span>
                                                        <span className={`font-semibold ${insight.metric.trend === 'up' ? 'text-emerald-600' : insight.metric.trend === 'down' ? 'text-rose-500' : 'text-slate-700'}`}>
                                                            {insight.metric.value}
                                                            {insight.metric.trend === 'up' && ' ↑'}
                                                            {insight.metric.trend === 'down' && ' ↓'}
                                                        </span>
                                                    </div>
                                                )}
                                                {insight.actionLabel && insight.actionView && (
                                                    <button
                                                        onClick={() => handleAction(insight.actionView)}
                                                        className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 hover:underline transition"
                                                    >
                                                        → {insight.actionLabel}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* Stats */}
            {insights.length > 0 && (
                <div className="mt-6 grid grid-cols-4 gap-2 text-center text-xs">
                    {(['critical', 'alert', 'info', 'win'] as InsightSeverity[]).map((sev) => {
                        const count = severityCounts[sev] || 0;
                        const style = SEVERITY_STYLES[sev];
                        return (
                            <div key={sev} className={`rounded-xl p-2 ${style.bg} ${style.border} border`}>
                                <strong className="block text-slate-700">{count}</strong>
                                <span className="text-slate-500 capitalize">{sev === 'win' ? 'victoires' : sev === 'alert' ? 'alertes' : sev === 'critical' ? 'critiques' : 'infos'}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default VibesInsights;
