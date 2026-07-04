import React, { useMemo, useState } from 'react';
import { Trophy, ChevronDown, ChevronUp, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Habit, Identity, MilestoneAchievement, MilestoneDomain } from '@/types';
import { MILESTONE_DOMAINS } from '@/data/milestoneDefinitions';
import {
    evaluateMilestones,
    getNextMilestoneInDomain,
    getIdentityMilestoneSummary,
} from '@/utils/milestoneUtils';

interface MilestonesSectionProps {
    habits: Habit[];
    identities: Identity[];
    achievements: MilestoneAchievement[];
}

const STATUS_STYLES = {
    locked: 'bg-slate-100 text-slate-500 border-slate-200',
    in_progress: 'bg-amber-50 text-amber-800 border-amber-200',
    achieved: 'bg-emerald-50 text-emerald-800 border-emerald-200',
} as const;

const STATUS_LABELS = {
    locked: 'À débloquer',
    in_progress: 'En cours',
    achieved: 'Atteint',
} as const;

function formatProgress(milestone: ReturnType<typeof evaluateMilestones>[0]): string {
    const { definition, current, target, status } = milestone;
    if (status === 'achieved') return 'Complété';
    if (definition.type === 'parallel_combo' || definition.type === 'identity_composite') {
        return `${milestone.percent}%`;
    }
    if (definition.type === 'identity_score') {
        return `${current}% / ${target}%`;
    }
    if (definition.type === 'weekly_frequency') {
        return `${current} / ${target} sem.`;
    }
    return `${current} / ${target} j`;
}

const MilestonesSection: React.FC<MilestonesSectionProps> = ({ habits, identities, achievements }) => {
    const [activeDomain, setActiveDomain] = useState<MilestoneDomain>('routine');
    const [expanded, setExpanded] = useState(true);

    const progress = useMemo(
        () => evaluateMilestones(habits, identities, achievements),
        [habits, identities, achievements]
    );

    const identitySummary = useMemo(
        () => getIdentityMilestoneSummary(identities, progress),
        [identities, progress]
    );

    const domainProgress = progress.filter((p) => p.definition.domain === activeDomain);
    const nextInDomain = getNextMilestoneInDomain(progress, activeDomain);
    const achievedCount = progress.filter((p) => p.status === 'achieved').length;

    return (
        <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="card bg-gradient-to-br from-indigo-50/50 to-amber-50/30 border border-indigo-100"
        >
            <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="w-full flex items-center justify-between mb-2 text-left"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                        <Trophy className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Milestones</h2>
                        <p className="text-sm text-slate-600">
                            {achievedCount} / {progress.length} atteints — routine, santé, manifestation
                        </p>
                    </div>
                </div>
                {expanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
            </button>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        {nextInDomain && (
                            <div className="mb-4 p-3 rounded-lg bg-white/80 border border-indigo-100 flex items-start gap-3">
                                <Target className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
                                        Prochain — {MILESTONE_DOMAINS.find((d) => d.id === activeDomain)?.label}
                                    </p>
                                    <p className="text-sm font-medium text-slate-800">
                                        {nextInDomain.definition.emoji} {nextInDomain.definition.title}
                                    </p>
                                    <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-500 rounded-full transition-all"
                                            style={{ width: `${nextInDomain.percent}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">{formatProgress(nextInDomain)}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2 mb-4 flex-wrap">
                            {MILESTONE_DOMAINS.map((d) => {
                                const count = progress.filter(
                                    (p) => p.definition.domain === d.id && p.status === 'achieved'
                                ).length;
                                const total = progress.filter((p) => p.definition.domain === d.id).length;
                                return (
                                    <button
                                        key={d.id}
                                        type="button"
                                        onClick={() => setActiveDomain(d.id)}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                                            activeDomain === d.id
                                                ? 'bg-indigo-600 text-white border-indigo-600'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-200'
                                        }`}
                                    >
                                        {d.emoji} {d.label} ({count}/{total})
                                    </button>
                                );
                            })}
                        </div>

                        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                            {domainProgress.map((m) => (
                                <div
                                    key={m.definition.id}
                                    className={`p-3 rounded-lg border ${STATUS_STYLES[m.status]} transition-colors`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-lg shrink-0">{m.definition.emoji}</span>
                                            <div className="min-w-0">
                                                <p className="font-medium text-sm truncate">{m.definition.title}</p>
                                                <p className="text-xs opacity-75 truncate">{m.definition.description}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-semibold shrink-0 px-2 py-0.5 rounded-full bg-white/60">
                                            {STATUS_LABELS[m.status]}
                                        </span>
                                    </div>
                                    {m.status !== 'achieved' && (
                                        <div className="mt-2">
                                            <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-current opacity-40 rounded-full"
                                                    style={{ width: `${m.percent}%` }}
                                                />
                                            </div>
                                            <p className="text-xs mt-1 opacity-75">{formatProgress(m)}</p>
                                        </div>
                                    )}
                                    {m.identityName && (
                                        <p className="text-xs mt-1 opacity-60">Identité : {m.identityName}</p>
                                    )}
                                </div>
                            ))}
                        </div>

                        {identitySummary.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-indigo-100">
                                <h3 className="text-sm font-semibold text-slate-700 mb-2">Par identité</h3>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {identitySummary.map(({ identity, achievedCount: ac, totalCount: tc }) => (
                                        <div
                                            key={identity.id}
                                            className="flex items-center gap-2 p-2 rounded-lg bg-white/70 border border-slate-100"
                                        >
                                            <div className={`w-3 h-3 rounded-full bg-${identity.color}-500 shrink-0`} />
                                            <span className="text-sm text-slate-700 truncate flex-1">{identity.name}</span>
                                            <span className="text-xs font-medium text-indigo-600 shrink-0">
                                                {ac}/{tc}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default MilestonesSection;
