import React from 'react';
import { ArrowLeft, TrendingUp, Target, Calendar, Trash2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { calculateHabitStats } from '@/utils/habitUtils';
import HabitCalendar from './HabitCalendar';
import { motion } from 'framer-motion';

const HabitDetailView: React.FC = () => {
    const { habits, identities, selectedHabitId, setView, toggleHabitDay, deleteHabit } = useAppStore();

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

    const stats = calculateHabitStats(habit);
    const linkedIdentityObjects = habit.linkedIdentities
        .map(id => identities.find(i => i.id === id))
        .filter(Boolean);

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
                <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                </button>
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
                <HabitCalendar habit={habit} onToggleDay={toggleHabitDay} />
            </motion.div>
        </div>
    );
};

export default HabitDetailView;
