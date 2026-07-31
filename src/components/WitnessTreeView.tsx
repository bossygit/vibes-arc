import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Layers, Lock, Scale } from 'lucide-react';
import { Desire, Habit, WitnessLevel } from '@/types';
import { computeWitnessTree } from '@/utils/witnessTree';
import type { EvidenceEngineResult } from '@/utils/witnessTree';

// ============================================================
// Constants
// ============================================================

const DAY_NAMES = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];

const LEVEL_LABELS: Record<WitnessLevel, string> = {
    daily: 'Jours',
    weekly: 'Semaines',
    monthly: 'Mois',
    yearly: 'Années',
};

const VERDICT_LABELS: Record<'favorable' | 'mitigé' | 'défavorable', string> = {
    favorable: 'Dossier solide — le Tribunal penche en ta faveur',
    mitigé: 'Dossier incomplet — le Tribunal attend plus de preuves',
    défavorable: 'Dossier faible — les accusateurs dominent',
};

// ============================================================
// WitnessTreeView — Interface principale du Tribunal des Témoins
// ============================================================

interface WitnessTreeViewProps {
    desire: Desire;
    habits: Habit[];
    className?: string;
}

const WitnessTreeView: React.FC<WitnessTreeViewProps> = ({ desire, habits, className = '' }) => {
    const requiredIds: number[] = desire?.requiredHabitIds ?? [];
    const safeHabits: Habit[] = Array.isArray(habits) ? habits : [];

    const engine: EvidenceEngineResult = useMemo(() => {
        if (requiredIds.length === 0) {
            return {
                desireId: desire?.id ?? 0,
                witnesses: { daily: [], weekly: [], monthly: [], yearly: [] },
                accusers: { daily: [], weekly: [], monthly: [], yearly: [] },
                credibilityScore: 0,
                dominantSide: 'balanced' as const,
                verdict: 'défavorable' as const,
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
                witnesses: { daily: [], weekly: [], monthly: [], yearly: [] },
                accusers: { daily: [], weekly: [], monthly: [], yearly: [] },
                credibilityScore: 0,
                dominantSide: 'balanced' as const,
                verdict: 'défavorable' as const,
                highestWitnessLevel: null,
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        desire?.id,
        requiredIds.join(','),
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

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Compteur de preuves */}
            <EvidenceSummary engine={engine} />

            {/* Témoins et Accusateurs par niveau */}
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-5"
                >
                    {/* Niveau Jour */}
                    <EvidenceLevelRow
                        level="daily"
                        witnesses={engine.witnesses.daily}
                        accusers={engine.accusers.daily}
                        renderWitness={(w, i) => <DailyDot key={w.date} witness={w} index={i} />}
                        renderAccuser={(w, i) => <DailyDot key={`acc-${w.date}`} witness={w} index={i + 100} />}
                    />

                    {/* Niveau Semaine */}
                    <EvidenceLevelRow
                        level="weekly"
                        witnesses={engine.witnesses.weekly}
                        accusers={engine.accusers.weekly}
                        renderWitness={(w, i) => <WeekBlock key={w.weekStart} witness={w} index={i} />}
                        renderAccuser={(w, i) => <WeekBlock key={`acc-${w.weekStart}`} witness={w} index={i + 100} />}
                    />

                    {/* Niveau Mois */}
                    <EvidenceLevelRow
                        level="monthly"
                        witnesses={engine.witnesses.monthly}
                        accusers={engine.accusers.monthly}
                        renderWitness={(w, i) => <MonthBlock key={w.monthStart} witness={w} index={i} />}
                        renderAccuser={(w, i) => <MonthBlock key={`acc-${w.monthStart}`} witness={w} index={i + 100} />}
                    />

                    {/* Niveau Année (si présent) */}
                    {(engine.witnesses.yearly?.length || 0) > 0 || (engine.accusers.yearly?.length || 0) > 0 ? (
                        <EvidenceLevelRow
                            level="yearly"
                            witnesses={engine.witnesses.yearly ?? []}
                            accusers={engine.accusers.yearly ?? []}
                            renderWitness={(w, i) => <YearBlock key={w.yearStart} witness={w} index={i} />}
                            renderAccuser={(w, i) => <YearBlock key={`acc-${w.yearStart}`} witness={w} index={i + 100} />}
                        />
                    ) : null}
                </motion.div>
            </AnimatePresence>

            {/* Verdict */}
            <VerdictBanner engine={engine} />
        </div>
    );
};

// ============================================================
// EvidenceSummary — Compter et comparer témoins vs accusateurs
// ============================================================

const EvidenceSummary: React.FC<{ engine: EvidenceEngineResult }> = ({ engine }) => {
    const witnessCount =
        engine.witnesses.daily.length +
        engine.witnesses.weekly.length +
        engine.witnesses.monthly.length +
        (engine.witnesses.yearly?.length ?? 0);
    const accuserCount =
        engine.accusers.daily.length +
        engine.accusers.weekly.length +
        engine.accusers.monthly.length +
        (engine.accusers.yearly?.length ?? 0);

    return (
        <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 text-sm"
        >
            <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="font-semibold text-emerald-700">{witnessCount} témoins</span>
            </div>
            <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span className="font-semibold text-rose-700">{accuserCount} accusateurs</span>
            </div>
            <div className="flex-1 h-px bg-gray-200" />
            <div className="flex items-center gap-2 text-xs text-gray-500">
                <Scale className="w-3 h-3" />
                Crédibilité : <span className="font-bold text-gray-700">{engine.credibilityScore}%</span>
            </div>
        </motion.div>
    );
};

// ============================================================
// EvidenceLevelRow — Affiche témoins ET accusateurs côte à côte
// ============================================================

interface EvidenceLevelRowProps {
    level: WitnessLevel;
    witnesses: any[];
    accusers: any[];
    renderWitness: (item: any, index: number) => React.ReactNode;
    renderAccuser: (item: any, index: number) => React.ReactNode;
}

const EvidenceLevelRow: React.FC<EvidenceLevelRowProps> = ({
    level,
    witnesses,
    accusers,
    renderWitness,
    renderAccuser,
}) => {
    // N'affiche rien si les deux listes sont vides
    if (!witnesses.length && !accusers.length) return null;

    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3 h-3" />
                    {LEVEL_LABELS[level]}
                </span>
                <div className="flex items-center gap-3 text-xs">
                    <span className="text-emerald-600 font-medium">
                        {witnesses.length} témoin{witnesses.length > 1 ? 's' : ''}
                    </span>
                    <span className="text-rose-600 font-medium">
                        {accusers.length} accusateur{accusers.length > 1 ? 's' : ''}
                    </span>
                </div>
            </div>
            <div className="flex gap-1.5 flex-wrap">
                {/* Témoins d'abord */}
                {witnesses.map((w, i) => renderWitness(w, i))}
                {/* Accusateurs ensuite */}
                {accusers.map((a, i) => renderAccuser(a, i))}
            </div>
        </div>
    );
};

// ============================================================
// VerdictBanner — Le verdict textuel du Tribunal
// ============================================================

const VerdictBanner: React.FC<{ engine: EvidenceEngineResult }> = ({ engine }) => {
    const dominantLabel = engine.dominantSide === 'witness' 
        ? 'Les témoins dominent' 
        : engine.dominantSide === 'accuser' 
        ? 'Les accusateurs dominent' 
        : 'Le procès est encore partagé';

    return (
        <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100"
        >
            <div className="flex items-center gap-3 mb-2">
                <Scale className="w-5 h-5 text-indigo-600" />
                <h4 className="font-bold text-gray-800">Verdict du Tribunal</h4>
            </div>
            
            <div className="mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Crédibilité
                </span>
                <div className="text-2xl font-bold text-indigo-700 mt-0.5">
                    {engine.credibilityScore}%
                </div>
            </div>

            <div className="space-y-1.5 text-sm text-gray-700">
                <p className="font-medium">{VERDICT_LABELS[engine.verdict as keyof typeof VERDICT_LABELS]}</p>
                <p className="text-xs text-gray-500">{dominantLabel}</p>
            </div>
        </motion.div>
    );
};

// ============================================================
// DailyDot — Point du calendrier journalier
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
            transition={{ delay: (index % 100) * 0.03, type: 'spring', stiffness: 200 }}
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
// WeekBlock — Bloc de semaine
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
            transition={{ delay: (index % 100) * 0.05, type: 'spring', stiffness: 150 }}
            className={`flex-1 min-w-[60px] rounded-lg p-2 text-center border-2 transition-colors ${
                isComplete
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'bg-rose-50 border-rose-200 text-rose-500'
            }`}
            title={
                isComplete
                    ? `Semaine du ${weekStart} — Témoin ✨\n7/7 jours`
                    : `Semaine du ${weekStart} — Accusateur\n${dailyCount}/7 jours`
            }
        >
            <div className="text-lg mb-0.5">
                {isComplete ? <CheckCircle2 className="w-4 h-4 mx-auto" /> : <AlertTriangle className="w-3.5 h-3.5 mx-auto" />}
            </div>
            <div className="text-[9px] font-medium leading-tight truncate">
                {weekStart ? new Date(weekStart + 'T00:00:00').toLocaleDateString('fr', { day: 'numeric', month: 'short' }) : '?'}
            </div>
            <div className={`text-[10px] font-bold mt-0.5 ${isComplete ? 'text-emerald-600' : 'text-rose-400'}`}>
                {dailyCount}/7
            </div>
        </motion.div>
    );
};

// ============================================================
// MonthBlock — Bloc de mois
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
            transition={{ delay: (index % 100) * 0.08, type: 'spring', stiffness: 150 }}
            className={`flex-1 min-w-[60px] rounded-lg p-2.5 text-center border-2 transition-colors ${
                isComplete
                    ? 'bg-emerald-100 border-emerald-400 text-emerald-800 shadow-sm shadow-emerald-100'
                    : 'bg-rose-50 border-rose-200 text-rose-500'
            }`}
            title={
                isComplete
                    ? `${monthName} — Témoin ✨\n4/4 semaines`
                    : `${monthName} — Accusateur\n${weeklyCount}/4 semaines`
            }
        >
            <div className="text-sm font-bold mb-0.5">{monthName}</div>
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
// YearBlock — Bloc d'année
// ============================================================

const YearBlock: React.FC<{ witness: any; index: number }> = ({ witness, index }) => {
    if (!witness) return null;
    const isComplete = witness.isComplete;
    const monthlyCount = witness.monthlyCount ?? 0;
    const yearStart = witness.yearStart || '';
    const yearLabel = yearStart ? new Date(yearStart + 'T00:00:00').getFullYear() : '?';

    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: (index % 100) * 0.08, type: 'spring', stiffness: 150 }}
            className={`flex-1 min-w-[60px] rounded-lg p-2.5 text-center border-2 transition-colors ${
                isComplete
                    ? 'bg-indigo-100 border-indigo-400 text-indigo-800 shadow-sm shadow-indigo-100'
                    : 'bg-rose-50 border-rose-200 text-rose-500'
            }`}
            title={
                isComplete
                    ? `Année ${yearLabel} — Témoin ✨\n12/12 mois`
                    : `Année ${yearLabel} — Accusateur\n${monthlyCount}/12 mois`
            }
        >
            <div className="text-sm font-bold mb-0.5">20{yearLabel.toString().slice(-2)}</div>
            {isComplete ? (
                <CheckCircle2 className="w-4 h-4 mx-auto text-indigo-600" />
            ) : (
                <AlertTriangle className="w-3.5 h-3.5 mx-auto" />
            )}
            <div className={`text-[10px] font-bold mt-0.5 ${isComplete ? 'text-indigo-600' : 'text-rose-400'}`}>
                {monthlyCount}/12 mois
            </div>
        </motion.div>
    );
};

export default WitnessTreeView;
