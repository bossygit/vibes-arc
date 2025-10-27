import React, { useMemo, useState } from 'react';
import { ArrowLeft, TrendingUp, Target, Calendar, Trash2, Edit2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { calculateHabitStats, getCurrentDayIndex } from '@/utils/habitUtils';
import HabitCalendar from './HabitCalendar';
import EditHabitModal from './EditHabitModal';
import { motion } from 'framer-motion';
import Celebration from './Celebration';

const HabitDetailView: React.FC = () => {
    const { habits, identities, selectedHabitId, setView, toggleHabitDay, deleteHabit, updateHabit, skipsByHabit, toggleSkipDay } = useAppStore();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);

    const habit = habits.find(h => h.id === selectedHabitId);

    if (!habit) {
        return (
            <div className="card text-center p-12">
                <p className="text-slate-600 mb-4">Habitude introuvable</p>
                <button
                    onClick={() => setView('dashboard')}
                    className="btn-primary"
                >
                    Retour au tableau de bord
                </button>
            </div>
        );
    }

    const stats = calculateHabitStats(habit, skipsByHabit[habit.id] || []);
    const linkedIdentityObjects = habit.linkedIdentities
        .map(id => identities.find(i => i.id === id))
        .filter(Boolean);

    const handleToggleDayWithCelebration = async (habitId: number, dayIndex: number) => {
        // Célébrer uniquement si on coche (passage de false -> true)
        const wasChecked = !!habit.progress[dayIndex];
        await toggleHabitDay(habitId, dayIndex);
        if (!wasChecked) {
            setShowCelebration(true);
        }
    };

    // Tendance hebdo (7 derniers jours vs 7 jours précédents)
    const { last7Pct, prev7Pct, deltaPct } = useMemo(() => {
        const todayIdx = getCurrentDayIndex();
        const end = Math.min(todayIdx, habit.progress.length - 1);
        const start = Math.max(0, end - 6);
        const prevEnd = start - 1;
        const prevStart = Math.max(0, prevEnd - 6);

        const sumRange = (s: number, e: number) => {
            if (e < s) return { sum: 0, count: 0 };
            let sum = 0;
            let count = 0;
            for (let i = s; i <= e; i++) {
                // Jour valide si dans la plage de l'habitude
                if (i >= 0 && i < habit.progress.length) {
                    sum += habit.progress[i] ? 1 : 0;
                    count += 1;
                }
            }
            return { sum, count };
        };

        const cur = sumRange(start, end);
        const prev = sumRange(prevStart, prevEnd);
        const last7Pct = cur.count > 0 ? Math.round((cur.sum / cur.count) * 100) : 0;
        const prev7Pct = prev.count > 0 ? Math.round((prev.sum / prev.count) * 100) : 0;
        const deltaPct = last7Pct - prev7Pct;
        return { last7Pct, prev7Pct, deltaPct };
    }, [habit.progress]);

    const handleDelete = async () => {
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'habitude "${habit.name}" ?`)) {
            await deleteHabit(habit.id);
            setView('dashboard');
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => setView('dashboard')}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Retour
                </button>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                        <Edit2 className="w-4 h-4" />
                        Modifier
                    </button>
                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Supprimer
                    </button>
                </div>
            </div>

            {/* Habit Title & Type */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
            >
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">{habit.name}</h1>
                        <span className={`inline-flex px-4 py-2 rounded-full text-sm font-medium ${habit.type === 'start'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                            }`}>
                            {habit.type === 'start' ? '▲ Habitude à commencer' : '▼ Habitude à arrêter'}
                        </span>
                    </div>
                </div>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="card bg-gradient-to-br from-indigo-50 to-white"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-100 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Progression</p>
                            <p className="text-2xl font-bold text-indigo-600">{stats.percentage}%</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="card bg-gradient-to-br from-green-50 to-white"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <span className="text-2xl">🔥</span>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Streak actuel</p>
                            <p className="text-2xl font-bold text-green-600">{stats.currentStreak}</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="card bg-gradient-to-br from-amber-50 to-white"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-amber-100 rounded-lg">
                            <span className="text-2xl">🏆</span>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Meilleur streak</p>
                            <p className="text-2xl font-bold text-amber-600">{stats.longestStreak}</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="card bg-gradient-to-br from-blue-50 to-white"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Calendar className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Jours complétés</p>
                            <p className="text-2xl font-bold text-blue-600">{stats.completed}/{stats.totalDays}</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Linked Identities */}
            {linkedIdentityObjects.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="card"
                >
                    <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                        <Target className="w-5 h-5 text-indigo-600" />
                        Identités liées
                    </h2>
                    <div className="flex flex-wrap gap-3">
                        {linkedIdentityObjects.map(identity => (
                            <div
                                key={identity!.id}
                                className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-medium"
                            >
                                {identity!.name}
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Streaks History */}
            {stats.streaks.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="card"
                >
                    <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        📊 Historique des streaks ({stats.streaks.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {stats.streaks.sort((a, b) => b.length - a.length).map((streak, idx) => (
                            <div
                                key={idx}
                                className="p-4 bg-slate-50 rounded-lg border border-slate-200"
                            >
                                <p className="text-2xl font-bold text-indigo-600 mb-1">
                                    {streak.length} jours
                                </p>
                                <p className="text-xs text-slate-500">
                                    {streak.startDate} → {streak.endDate}
                                </p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Calendar */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="card"
            >
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    Calendrier de progression
                </h2>
                <HabitCalendar habit={habit} onToggleDay={handleToggleDayWithCelebration} />
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                    <span>Gérer les jours sautés:</span>
                    <button
                        onClick={() => {
                            const todayIdx = getCurrentDayIndex();
                            if (todayIdx >= 0 && todayIdx < habit.progress.length) toggleSkipDay(habit.id, todayIdx);
                        }}
                        className="px-3 py-1 rounded border border-slate-300 hover:border-indigo-400"
                    >
                        Marquer aujourd'hui comme "skip"
                    </button>
                </div>
            </motion.div>

            {/* Edit Modal */}
            <EditHabitModal
                habit={habit}
                identities={identities}
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={(updates) => updateHabit(habit.id, updates)}
            />

            {/* Celebration overlay */}
            <Celebration
                visible={showCelebration}
                onClose={() => setShowCelebration(false)}
                message="Bien joué ! Jour validé ✨"
            />

            {/* Weekly trend */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.75 }}
                className="card"
            >
                <h2 className="text-lg font-semibold text-slate-800 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                    Tendance hebdo
                </h2>
                <div className="flex items-center gap-4">
                    <div>
                        <div className="text-sm text-slate-600">7 derniers jours</div>
                        <div className="text-2xl font-bold text-indigo-600">{last7Pct}%</div>
                    </div>
                    <div className="h-10 w-px bg-slate-200" />
                    <div>
                        <div className="text-sm text-slate-600">7 jours précédents</div>
                        <div className="text-xl font-semibold text-slate-700">{prev7Pct}%</div>
                    </div>
                    <div className={`ml-auto px-3 py-1 rounded-full text-sm font-semibold ${deltaPct >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {deltaPct >= 0 ? '+' : ''}{deltaPct}%
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default HabitDetailView;
