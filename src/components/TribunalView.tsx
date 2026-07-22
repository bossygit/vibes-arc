import React, { useMemo, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import {
    Scale,
    Plus,
    Target,
    TrendingUp,
    Shield,
    ShieldAlert,
    CheckCircle2,
    XCircle,
    Gavel,
    ChevronDown,
    ChevronUp,
    Activity,
    Heart,
    Zap,
    Trash2,
    AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Desire,
    DesireType,
    DailyEvidence,
    CredibilityScore,
    EmotionalFrequency,
    VERDICT_LABELS,
    Verdict,
} from '@/types';
import {
    buildDailyEvidence,
    computeCredibilityScore,
    computeMoodCompletionCorrelation,
} from '@/utils/credibilityScore';
import { calculateHabitStats } from '@/utils/habitUtils';
import ComplementaryEvidence, { useToolEvidence } from './ComplementaryEvidence';

// ============================================================
// Helpers
// ============================================================

const DESIRE_TYPE_LABELS: Record<DesireType, string> = {
    avoir: 'Avoir',
    être: 'Être',
};

const DESIRE_TYPE_ICONS: Record<DesireType, React.ReactNode> = {
    avoir: <Target className="w-4 h-4" />,
    être: <Heart className="w-4 h-4" />,
};

const DESIRE_TYPE_COLORS: Record<DesireType, string> = {
    avoir: 'bg-amber-100 text-amber-800 border-amber-200',
    être: 'bg-purple-100 text-purple-800 border-purple-200',
};

const VERDICT_COLORS: Record<Verdict, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
    favorable: {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    },
    mitigé: {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        icon: <Activity className="w-5 h-5 text-amber-500" />,
    },
    défavorable: {
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
        icon: <XCircle className="w-5 h-5 text-rose-500" />,
    },
};

function ScoreGauge({ score, size = 80 }: { score: number; size?: number }) {
    const strokeWidth = 6;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    const color =
        score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg width={size} height={size} className="-rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth={strokeWidth}
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                />
            </svg>
            <span className="absolute text-lg font-bold" style={{ color }}>
                {score}
            </span>
        </div>
    );
}

function MiniBar({ value, color, label }: { value: number; color: string; label: string }) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-20 truncate">{label}</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, value)}%`, backgroundColor: color }}
                />
            </div>
            <span className="text-xs font-semibold w-8 text-right">{value}%</span>
        </div>
    );
}

// ============================================================
// Add Desire Modal
// ============================================================

const AddDesireModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { identities, addDesire } = useAppStore();
    const [title, setTitle] = useState('');
    const [type, setType] = useState<DesireType>('avoir');
    const [target, setTarget] = useState('');
    const [linkedIdentityId, setLinkedIdentityId] = useState<number>(identities[0]?.id ?? 0);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!title.trim()) {
            setError('Donne un nom à ton désir');
            return;
        }
        if (!linkedIdentityId) {
            setError('Sélectionne une identité');
            return;
        }
        setLoading(true);
        try {
            await addDesire({
                title: title.trim(),
                type,
                target: target.trim() || undefined,
                linkedIdentityId,
            });
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Scale className="w-5 h-5 text-indigo-600" />
                    Nouveau Désir
                </h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                            Qu'est-ce que tu veux recevoir ?
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Générer 10 000 000 FCFA..."
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                            Type de désir
                        </label>
                        <div className="flex gap-2">
                            {(['avoir', 'être'] as DesireType[]).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setType(t)}
                                    className={`flex-1 py-2.5 px-4 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                                        type === t
                                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                    }`}
                                >
                                    {DESIRE_TYPE_ICONS[t]}
                                    {DESIRE_TYPE_LABELS[t]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {type === 'avoir' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                Valeur cible (optionnel)
                            </label>
                            <input
                                type="text"
                                value={target}
                                onChange={(e) => setTarget(e.target.value)}
                                placeholder="10 000 000 FCFA"
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                            Identité requise
                        </label>
                        <select
                            value={linkedIdentityId}
                            onChange={(e) => setLinkedIdentityId(Number(e.target.value))}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
                        >
                            {identities.map((id) => (
                                <option key={id.id} value={id.id}>
                                    {id.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            'Création...'
                        ) : (
                            <>
                                <Gavel className="w-4 h-4" />
                                Ouvrir le dossier
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

// ============================================================
// Desire Card
// ============================================================

const DesireCard: React.FC<{
    desire: Desire;
    evidence: DailyEvidence[];
    score: CredibilityScore;
    expanded: boolean;
    onToggle: () => void;
}> = ({ desire, evidence, score, expanded, onToggle }) => {
    const { identities, habits, accusers, addAccuser, toggleAccuserDay, deleteAccuser } = useAppStore();
    const identity = identities.find((i) => i.id === desire.linkedIdentityId);
    const [newAccuserName, setNewAccuserName] = useState('');
    const [addingAccuser, setAddingAccuser] = useState(false);
    const [showAddAccuser, setShowAddAccuser] = useState(false);

    // Signaux liés à l'identité de ce désir
    const linkedHabits = useMemo(
        () => habits.filter((h) => h.linkedIdentities.includes(desire.linkedIdentityId)),
        [habits, desire.linkedIdentityId]
    );

    // Accusateurs liés à ce désir
    const linkedAccusers = useMemo(
        () => accusers.filter((a) => a.linkedDesireId === desire.id),
        [accusers, desire.id]
    );

    // Corrélation mood/complétion
    const correlation = useMemo(
        () => computeMoodCompletionCorrelation(evidence),
        [evidence]
    );

    const verdictStyle = VERDICT_COLORS[score.verdict];

    // Calculer le dayIndex d'aujourd'hui pour les accusateurs
    const todayDayIndex = useMemo(() => {
        const base = new Date(2025, 9, 1);
        base.setHours(0, 0, 0, 0);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return Math.max(0, Math.floor((now.getTime() - base.getTime()) / (1000 * 60 * 60 * 24)));
    }, []);

    const handleAddAccuser = async () => {
        if (!newAccuserName.trim()) return;
        setAddingAccuser(true);
        try {
            await addAccuser({
                name: newAccuserName.trim(),
                linkedDesireId: desire.id,
                totalDays: 92,
            });
            setNewAccuserName('');
            setShowAddAccuser(false);
        } catch (err) {
            console.error('Erreur ajout accusateur:', err);
        } finally {
            setAddingAccuser(false);
        }
    };

    const handleToggleAccuserToday = async (accuserId: number) => {
        try {
            await toggleAccuserDay(accuserId, todayDayIndex);
        } catch (err) {
            console.error('Erreur toggle accusateur:', err);
        }
    };

    const handleDeleteAccuser = async (accuserId: number) => {
        try {
            await deleteAccuser(accuserId);
        } catch (err) {
            console.error('Erreur suppression accusateur:', err);
        }
    };

    return (
        <motion.div
            layout
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        >
            {/* Header */}
            <div
                className="p-5 cursor-pointer hover:bg-gray-50/50 transition-colors"
                onClick={onToggle}
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                            <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${DESIRE_TYPE_COLORS[desire.type]}`}
                            >
                                {DESIRE_TYPE_ICONS[desire.type]}
                                {DESIRE_TYPE_LABELS[desire.type]}
                            </span>
                            {desire.target && (
                                <span className="text-sm font-semibold text-gray-500">
                                    {desire.target}
                                </span>
                            )}
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 truncate">{desire.title}</h3>
                        {identity && (
                            <p className="text-sm text-gray-400 mt-0.5 flex items-center gap-1">
                                <span
                                    className="inline-block w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: identity.color }}
                                />
                                Identité : {identity.name}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <ScoreGauge score={score.total} size={64} />
                        {expanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                    </div>
                </div>

                {/* Verdict banner (collapsed) */}
                <div
                    className={`mt-3 px-3 py-2 rounded-lg flex items-center gap-2 text-sm ${verdictStyle.bg} ${verdictStyle.text}`}
                >
                    {verdictStyle.icon}
                    <span className="font-medium">{VERDICT_LABELS[score.verdict]}</span>
                </div>
            </div>

            {/* Expanded details */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-5 space-y-5 border-t border-gray-100 pt-4">
                            {/* Score détaillé */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <Gavel className="w-4 h-4" />
                                    Détail du dossier ({score.periodDays} jours)
                                </h4>
                                <div className="space-y-2">
                                    <MiniBar
                                        value={score.actionScore}
                                        color="#6366f1"
                                        label="Action"
                                    />
                                    <MiniBar
                                        value={score.alignmentScore}
                                        color="#8b5cf6"
                                        label="Alignement"
                                    />
                                    <MiniBar
                                        value={score.accuserPenalty}
                                        color="#f43f5e"
                                        label="Accusations"
                                    />
                                </div>
                                <p className="text-xs text-gray-400 mt-2">
                                    Score = Action × 0.4 + Alignement × 0.4 − Accusations × 0.2
                                </p>
                            </div>

                            {/* Signaux */}
                            {linkedHabits.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-indigo-500" />
                                        Signaux ({linkedHabits.length})
                                    </h4>
                                    <div className="space-y-1.5">
                                        {linkedHabits.map((habit) => {
                                            const stats = calculateHabitStats(habit);
                                            return (
                                                <div
                                                    key={habit.id}
                                                    className="flex items-center justify-between text-sm py-1.5 px-3 bg-gray-50 rounded-lg"
                                                >
                                                    <span className="text-gray-700 truncate flex-1">
                                                        {habit.name}
                                                    </span>
                                                    <div className="flex items-center gap-3 text-xs flex-shrink-0">
                                                        <span className="text-gray-400">
                                                            {stats.currentStreak}j streak
                                                        </span>
                                                        <span
                                                            className={`font-semibold ${
                                                                stats.percentage >= 70
                                                                    ? 'text-emerald-600'
                                                                    : stats.percentage >= 40
                                                                    ? 'text-amber-600'
                                                                    : 'text-rose-600'
                                                            }`}
                                                        >
                                                            {stats.percentage}%
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Accusateurs */} 

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <ShieldAlert className="w-4 h-4 text-rose-500" />
                                        Accusateurs ({linkedAccusers.length})
                                    </h4>
                                    {!showAddAccuser && (
                                        <button
                                            onClick={() => setShowAddAccuser(true)}
                                            className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1"
                                        >
                                            <Plus className="w-3 h-3" />
                                            Ajouter
                                        </button>
                                    )}
                                </div>

                                {/* Inline add form */}
                                <AnimatePresence>
                                    {showAddAccuser && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden mb-2"
                                        >
                                            <div className="flex gap-2 p-2 bg-rose-50 rounded-lg">
                                                <input
                                                    type="text"
                                                    value={newAccuserName}
                                                    onChange={(e) => setNewAccuserName(e.target.value)}
                                                    placeholder="ex: Scrolling avant de dormir"
                                                    className="flex-1 px-3 py-1.5 rounded-lg border border-rose-200 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                                                    autoFocus
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleAddAccuser();
                                                        if (e.key === 'Escape') setShowAddAccuser(false);
                                                    }}
                                                />
                                                <button
                                                    onClick={handleAddAccuser}
                                                    disabled={addingAccuser || !newAccuserName.trim()}
                                                    className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 disabled:opacity-50 transition-colors"
                                                >
                                                    {addingAccuser ? '...' : 'Ajouter'}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setShowAddAccuser(false);
                                                        setNewAccuserName('');
                                                    }}
                                                    className="px-2 py-1.5 text-gray-400 hover:text-gray-600"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {linkedAccusers.length > 0 ? (
                                    <div className="space-y-1.5">
                                        {linkedAccusers.map((acc) => {
                                            const activeDays = acc.progress.filter(Boolean).length;
                                            const isActiveToday = acc.progress[todayDayIndex] === true;
                                            return (
                                                <div
                                                    key={acc.id}
                                                    className={`flex items-center justify-between text-sm py-1.5 px-3 rounded-lg group transition-colors ${
                                                        isActiveToday ? 'bg-red-100 border border-red-200' : 'bg-red-50'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        {isActiveToday && (
                                                            <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                                                        )}
                                                        <span className="text-gray-700 truncate">
                                                            {acc.name}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <span className="text-xs text-rose-600 font-medium">
                                                            {activeDays} accusations
                                                        </span>
                                                        {/* Toggle aujourd'hui */}
                                                        <button
                                                            onClick={() => handleToggleAccuserToday(acc.id)}
                                                            className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${
                                                                isActiveToday
                                                                    ? 'bg-red-500 text-white'
                                                                    : 'bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600'
                                                            }`}
                                                            title={
                                                                isActiveToday
                                                                    ? "Annuler l'accusation d'aujourd'hui"
                                                                    : "Signaler aujourd'hui"
                                                            }
                                                        >
                                                            {isActiveToday ? 'Aujourd\'hui ✓' : 'Aujourd\'hui'}
                                                        </button>
                                                        {/* Delete */}
                                                        <button
                                                            onClick={() => handleDeleteAccuser(acc.id)}
                                                            className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-500 transition-all"
                                                            title="Supprimer"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    !showAddAccuser && (
                                        <p className="text-xs text-gray-400 py-2 text-center">
                                            Aucun accusateur. Ajoute les comportements qui témoignent contre ce désir.
                                        </p>
                                    )
                                )}
                            </div>

                            {/* Corrélation mood */}
                            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-purple-500" />
                                    Corrélation vibratoire
                                </h4>
                                {evidence.length > 0 ? (
                                    <>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div className="bg-white rounded-lg p-3 text-center">
                                                <div className="text-2xl font-bold text-emerald-600">
                                                    {correlation.alignedCompletionRate}%
                                                </div>
                                                <div className="text-xs text-gray-400 mt-0.5">
                                                    Jours alignés (≥7)
                                                </div>
                                            </div>
                                            <div className="bg-white rounded-lg p-3 text-center">
                                                <div className="text-2xl font-bold text-rose-600">
                                                    {correlation.resistingCompletionRate}%
                                                </div>
                                                <div className="text-xs text-gray-400 mt-0.5">
                                                    Jours en résistance (≤3)
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2 text-center">
                                            Corrélation{' '}
                                            <span
                                                className={`font-semibold ${
                                                    correlation.correlationStrength === 'forte'
                                                        ? 'text-purple-700'
                                                        : correlation.correlationStrength === 'modérée'
                                                        ? 'text-purple-500'
                                                        : 'text-gray-400'
                                                }`}
                                            >
                                                {correlation.correlationStrength}
                                            </span>
                                            {' '}— ton état vibratoire{' '}
                                            {correlation.alignedCompletionRate >
                                            correlation.resistingCompletionRate
                                                ? 'amplifie tes résultats'
                                                : 'freine tes résultats'}
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-sm text-gray-400 text-center py-2">
                                        Pas encore assez de données. Fais ton check-in vibratoire quotidien.
                                    </p>
                                )}
                            </div>

                            {/* Preuves complémentaires (autres outils) */}
                            <ComplementaryEvidence />

                            {/* 7 derniers jours */}
                            {evidence.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4" />
                                        7 derniers jours
                                    </h4>
                                    <div className="flex gap-1.5">
                                        {evidence.slice(-7).map((day) => (
                                            <div
                                                key={day.date}
                                                className="flex-1 text-center"
                                                title={`${day.date}: ${day.signalsCompleted}/${day.signalsTotal} signaux, mood ${day.moodScore}/10`}
                                            >
                                                <div className="text-[10px] text-gray-400 mb-1">
                                                    {new Date(day.date).toLocaleDateString('fr', {
                                                        weekday: 'short',
                                                    })}
                                                </div>
                                                <div className="space-y-0.5">
                                                    {/* Action bar */}
                                                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-indigo-500 rounded-full"
                                                            style={{
                                                                width: `${
                                                                    day.signalsTotal > 0
                                                                        ? (day.signalsCompleted /
                                                                              day.signalsTotal) *
                                                                          100
                                                                        : 0
                                                                }%`,
                                                            }}
                                                        />
                                                    </div>
                                                    {/* Mood dot */}
                                                    <div
                                                        className={`w-1.5 h-1.5 rounded-full mx-auto ${
                                                            day.isAligned
                                                                ? 'bg-emerald-400'
                                                                : day.moodScore <= 3
                                                                ? 'bg-rose-400'
                                                                : 'bg-amber-400'
                                                        }`}
                                                    />
                                                    {/* Accuser dot */}
                                                    {day.accusatorsActive > 0 && (
                                                        <div className="w-1 h-1 rounded-full bg-red-500 mx-auto" />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between text-[10px] text-gray-400 mt-1 px-1">
                                        <span>↑ action</span>
                                        <span>• mood</span>
                                        <span>• accusations</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// ============================================================
// Empty State
// ============================================================

const EmptyState: React.FC<{ onAdd: () => void }> = ({ onAdd }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16 px-6"
    >
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-2xl mb-4">
            <Scale className="w-8 h-8 text-indigo-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">
            Le Tribunal est prêt
        </h3>
        <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
            Définis ce que tu veux recevoir de la vie. Vibes Arc t'aidera à construire
            les preuves — action et alignement — pour que le Tribunal penche en ta faveur.
        </p>
        <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
        >
            <Plus className="w-4 h-4" />
            Ouvrir mon premier dossier
        </button>
    </motion.div>
);

// ============================================================
// TribunalView
// ============================================================

const TribunalView: React.FC = () => {
    const { desires, habits, dailyMoods, accusers } = useAppStore();
    const [showAddModal, setShowAddModal] = useState(false);
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

    // Outils complémentaires → bonus d'alignement
    const { activeToolCount } = useToolEvidence();
    const complementaryBonus = activeToolCount * 3; // max 15 (5 outils × 3)

    // Index moods par date pour buildDailyEvidence
    const moodMap = useMemo(() => {
        const map = new Map<string, EmotionalFrequency>();
        dailyMoods.forEach((m) => map.set(m.date, m.score));
        return map;
    }, [dailyMoods]);

    const toggleExpanded = (id: number) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Compute evidence and scores per desire
    const desireData = useMemo(() => {
        return desires.map((desire) => {
            const desireAccusers = accusers.filter((a) => a.linkedDesireId === desire.id);
            const identityId = desire.linkedIdentityId;

            const evidence = buildDailyEvidence(
                habits,
                identityId,
                moodMap,
                desireAccusers,
                30
            );
            const scoredEvidence = evidence.map((e) => ({ ...e, desireId: desire.id }));
            const score = computeCredibilityScore(desire.id, scoredEvidence, complementaryBonus);

            return { desire, evidence: scoredEvidence, score };
        });
    }, [desires, habits, moodMap, accusers, complementaryBonus]);

    if (desires.length === 0) {
        return (
            <>
                <EmptyState onAdd={() => setShowAddModal(true)} />
                {showAddModal && <AddDesireModal onClose={() => setShowAddModal(false)} />}
            </>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <section className="rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 text-white p-6 md:p-8">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-white/15 rounded-xl flex-shrink-0">
                            <Scale className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Tribunal de la Vie</h1>
                            <p className="text-white/70 text-sm mt-1 max-w-md">
                                Chaque jour, tu construis les preuves de la personne que tu deviens.
                                Le Tribunal observe tes actions <strong>et</strong> ton alignement vibratoire.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Nouveau désir
                    </button>
                </div>
            </section>

            {/* Desire Cards */}
            {desireData.map(({ desire, evidence, score }) => (
                <DesireCard
                    key={desire.id}
                    desire={desire}
                    evidence={evidence}
                    score={score}
                    expanded={expandedIds.has(desire.id)}
                    onToggle={() => toggleExpanded(desire.id)}
                />
            ))}

            {showAddModal && <AddDesireModal onClose={() => setShowAddModal(false)} />}
        </div>
    );
};

export default TribunalView;
