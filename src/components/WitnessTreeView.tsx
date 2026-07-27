import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, AlertTriangle, CheckCircle2, Layers, Lock } from 'lucide-react';
import { Desire, Habit, WitnessTree, WitnessLevel } from '@/types';
import { computeWitnessTree } from '@/utils/witnessTree';

// ============================================================
// Constants
// ============================================================

const DAY_NAMES = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];

const LEVEL_LABELS: Record<WitnessLevel, string> = {
    daily: 'Jours',
    weekly: 'Semaines',
    monthly: 'Mois',
};

const ACCUSER_MESSAGES: Record<WitnessLevel, string> = {
    daily: 'Ce jour n\'a pas vu toutes les habitudes requises.',
    weekly: '7 jours consécutifs non atteints. L\'accusateur parle.',
    monthly: '4 semaines consécutives non atteintes. L\'accusateur parle.',
};

const WITNESS_MESSAGES: Record<WitnessLevel, string> = {
    daily: 'Témoin journalier — toutes les habitudes requises accomplies.',
    weekly: 'Témoin-semaine — 7 jours consécutifs. Le Tribunal écoute.',
    monthly: 'Témoin-mois — 4 semaines consécutives. Dossier solide.',
};

// ============================================================
// WitnessTreeView
// ============================================================

interface WitnessTreeViewProps {
    desire: Desire;
    habits: Habit[];
    className?: string;
}

const WitnessTreeView: React.FC<WitnessTreeViewProps> = ({ desire, habits, className = '' }) => {
    const requiredIds: number[] = desire?.requiredHabitIds ?? [];
    const safeHabits: Habit[] = Array.isArray(habits) ? habits : [];

    const tree: WitnessTree = useMemo(() => {
        if (requiredIds.length === 0) {
            return {
                desireId: desire?.id ?? 0,
                daily: [],
                weekly: [],
                monthly: [],
                highestWitnessLevel: null,
            };
        }
        try {
            return computeWitnessTree({
                desireId: desire?.id ?? 0,
                requiredHabitIds: requiredIds,
                habits: safeHabits,
                daysBack: 90,
            });
        } catch (err) {
            console.error('WitnessTreeView: computeWitnessTree failed', err);
            return {
                desireId: desire?.id ?? 0,
                daily: [],
                weekly: [],
                monthly: [],
                highestWitnessLevel: null,
            };
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        desire?.id,
        // Recompute when requiredHabitIds content changes (not just length)
        requiredIds.join(','),
        // Recompute when ANY habit's progress changes
        safeHabits.map(h => `${h.id}:${h.progress?.length ?? 0}:${h.progress?.filter(Boolean).length ?? 0}`).join('|'),
    ]);

    // Pas encore configuré
    if (requiredIds.length === 0) {
        return (
            <div className={className}>
                <div className="text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <Lock className="w-5 h-5 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500 font-medium">
                        Témoins non configurés
                    </p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                        Sélectionne les habitudes qui, cochées ensemble, produiront un témoin journalier pour ce Désir.
                    </p>
                </div>
            </div>
        );
    }

    const { daily, weekly, monthly, highestWitnessLevel } = tree;

    return (
        <div className={`space-y-4 ${className}`}>
            <LevelRow
                level="daily"
                items={daily}
                highestWitnessLevel={highestWitnessLevel}
                renderItem={(w, i) => (
                    <DailyDot key={w.date} witness={w} index={i} />
                )}
            />

            <LevelRow
                level="weekly"
                items={weekly}
                highestWitnessLevel={highestWitnessLevel}
                renderItem={(w, i) => (
                    <WeekBlock key={w.weekStart} witness={w} index={i} />
                )}
            />

            {monthly.length > 0 && (
                <LevelRow
                    level="monthly"
                    items={monthly}
                    highestWitnessLevel={highestWitnessLevel}
                    renderItem={(w, i) => (
                        <MonthBlock key={w.monthStart} witness={w} index={i} />
                    )}
                />
            )}

            <VoiceBanner tree={tree} />
        </div>
    );
};

// ============================================================
// LevelRow
// ============================================================

interface LevelRowProps {
    level: WitnessLevel;
    items: any[];
    highestWitnessLevel: WitnessLevel | null;
    renderItem: (item: any, index: number) => React.ReactNode;
}

const LevelRow: React.FC<LevelRowProps> = ({ level, items, highestWitnessLevel, renderItem }) => {
    if (!items || items.length === 0) return null;

    const completeCount = items.filter((i: any) => i?.isComplete).length;
    const allAccusers = completeCount === 0;
    const isHighest = highestWitnessLevel === level;

    return (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3 h-3" />
                    {LEVEL_LABELS[level]}
                </span>
                <span className={`text-xs font-medium ${allAccusers ? 'text-rose-500' : 'text-emerald-600'}`}>
                    {completeCount}/{items.length}
                    {isHighest && ' ✨'}
                </span>
            </div>
            <div className="flex gap-1.5">
                {items.map((item, i) => renderItem(item, i))}
            </div>
        </div>
    );
};

// ============================================================
// DailyDot
// ============================================================

const DailyDot: React.FC<{ witness: any; index: number }> = ({ witness, index }) => {
    if (!witness) return null;
    const isComplete = witness.isComplete;
    const dateStr = witness.date || '';
    const date = new Date(dateStr + 'T00:00:00');
    const dayIndex = isNaN(date.getTime()) ? 0 : (date.getDay() === 0 ? 6 : date.getDay() - 1);

    return (
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.03, type: 'spring', stiffness: 200 }}
            className="flex flex-col items-center gap-0.5"
            title={
                isComplete
                    ? `${witness.date} — Témoin ✓\nHabitudes: ${(witness.completedHabitIds || []).join(', ')}`
                    : `${witness.date} — Accusateur\nManquantes: ${(witness.missingHabitIds || []).join(', ')}`
            }
        >
            <span className="text-[9px] text-gray-400 leading-none">
                {DAY_NAMES[dayIndex] || '?'}
            </span>
            <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    isComplete
                        ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300'
                        : 'bg-rose-50 text-rose-500 border-2 border-rose-200'
                }`}
            >
                {isComplete ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                    <AlertTriangle className="w-3 h-3" />
                )}
            </div>
        </motion.div>
    );
};

// ============================================================
// WeekBlock
// ============================================================

const WeekBlock: React.FC<{ witness: any; index: number }> = ({ witness, index }) => {
    if (!witness) return null;
    const isComplete = witness.isComplete;
    const dailyCount = witness.dailyCount ?? 0;
    const weekStart = witness.weekStart || '';

    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 + index * 0.05, type: 'spring', stiffness: 150 }}
            className={`flex-1 rounded-lg p-2 text-center border-2 transition-colors ${
                isComplete
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'bg-rose-50 border-rose-200 text-rose-500'
            }`}
            title={
                isComplete
                    ? `Semaine du ${weekStart} — Témoin-semaine ✨\n7/7 jours`
                    : `Semaine du ${weekStart} — Accusateur\n${dailyCount}/7 jours`
            }
        >
            <div className="text-lg mb-0.5">
                {isComplete ? <CheckCircle2 className="w-4 h-4 mx-auto" /> : <AlertTriangle className="w-3.5 h-3.5 mx-auto" />}
            </div>
            <div className="text-[9px] font-medium leading-tight">
                {weekStart ? new Date(weekStart + 'T00:00:00').toLocaleDateString('fr', { day: 'numeric', month: 'short' }) : '?'}
            </div>
            <div className={`text-[10px] font-bold mt-0.5 ${isComplete ? 'text-emerald-600' : 'text-rose-400'}`}>
                {dailyCount}/7
            </div>
        </motion.div>
    );
};

// ============================================================
// MonthBlock
// ============================================================

const MonthBlock: React.FC<{ witness: any; index: number }> = ({ witness, index }) => {
    if (!witness) return null;
    const isComplete = witness.isComplete;
    const weeklyCount = witness.weeklyCount ?? 0;
    const monthStart = witness.monthStart || '';
    const monthName = monthStart ? new Date(monthStart + 'T00:00:00').toLocaleDateString('fr', { month: 'short' }) : '?';

    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 + index * 0.08, type: 'spring', stiffness: 150 }}
            className={`flex-1 rounded-lg p-2.5 text-center border-2 transition-colors ${
                isComplete
                    ? 'bg-emerald-100 border-emerald-400 text-emerald-800 shadow-sm shadow-emerald-100'
                    : 'bg-rose-50 border-rose-200 text-rose-500'
            }`}
            title={
                isComplete
                    ? `${monthName} — Témoin-mois ✨\n4/4 semaines`
                    : `${monthName} — Accusateur\n${weeklyCount}/4 semaines`
            }
        >
            <div className="text-sm font-bold mb-0.5">
                {monthName}
            </div>
            {isComplete ? (
                <CheckCircle2 className="w-4 h-4 mx-auto text-emerald-600" />
            ) : (
                <AlertTriangle className="w-3.5 h-3.5 mx-auto" />
            )}
            <div className={`text-[10px] font-bold mt-0.5 ${isComplete ? 'text-emerald-600' : 'text-rose-400'}`}>
                {weeklyCount}/4 sem.
            </div>
        </motion.div>
    );
};

// ============================================================
// VoiceBanner — la voix du Tribunal
// ============================================================

const VoiceBanner: React.FC<{ tree: WitnessTree }> = ({ tree }) => {
    const { highestWitnessLevel, weekly, monthly } = tree;

    let voice: { level: WitnessLevel | null; message: string; isAccuser: boolean };

    if (highestWitnessLevel) {
        voice = {
            level: highestWitnessLevel,
            message: WITNESS_MESSAGES[highestWitnessLevel],
            isAccuser: false,
        };
    } else {
        const safeWeekly = Array.isArray(weekly) ? weekly : [];
        const safeMonthly = Array.isArray(monthly) ? monthly : [];
        const allWeeklyAccusers = safeWeekly.length > 0 && safeWeekly.every(w => w?.isAccuser);
        const allMonthlyAccusers = safeMonthly.length > 0 && safeMonthly.every(m => m?.isAccuser);

        if (allMonthlyAccusers || safeMonthly.length > 0) {
            voice = { level: 'monthly', message: ACCUSER_MESSAGES.monthly, isAccuser: true };
        } else if (allWeeklyAccusers || safeWeekly.length > 0) {
            voice = { level: 'weekly', message: ACCUSER_MESSAGES.weekly, isAccuser: true };
        } else {
            voice = { level: 'daily', message: ACCUSER_MESSAGES.daily, isAccuser: true };
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`rounded-xl p-3 text-sm flex items-start gap-2.5 ${
                voice.isAccuser
                    ? 'bg-rose-50 border border-rose-200 text-rose-700'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            }`}
        >
            {voice.isAccuser ? (
                <EyeOff className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-400" />
            ) : (
                <Eye className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-500" />
            )}
            <div>
                <p className="font-semibold text-xs uppercase tracking-wide opacity-70 mb-0.5">
                    {voice.isAccuser ? 'L\'Accusateur parle' : 'Le Témoin parle'}
                    {voice.level && ` — niveau ${LEVEL_LABELS[voice.level]}`}
                </p>
                <p className="text-sm leading-relaxed">{voice.message}</p>
            </div>
        </motion.div>
    );
};

export default WitnessTreeView;
