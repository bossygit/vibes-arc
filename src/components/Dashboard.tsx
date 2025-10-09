import React from 'react';
import { Target, TrendingUp, Calendar, BarChart3, Flame } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { calculateIdentityScore, calculateHabitStats } from '@/utils/habitUtils';
import IdentityCard from './IdentityCard';
import HabitCard from './HabitCard';
import DataManager from './DataManager';
import IdentitiesProgressChart from './IdentitiesProgressChart';
import { motion } from 'framer-motion';

const Dashboard: React.FC = () => {
    const { identities, habits, setView } = useAppStore();

    const handleDataChange = () => {
        // Recharger les données depuis le store
        window.location.reload();
    };

    // Calculer les statistiques globales
    const totalHabits = habits.length;
    const totalDays = habits.reduce((sum, h) => sum + h.totalDays, 0);
    const completedDays = habits.reduce((sum, h) => sum + h.progress.filter(Boolean).length, 0);
    const overallProgress = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
    const currentStreaks = habits.map(h => calculateHabitStats(h).currentStreak);
    const longestCurrentStreak = currentStreaks.length > 0 ? Math.max(...currentStreaks) : 0;

    return (
        <div className="space-y-8">
            {/* Global Stats */}
            {habits.length > 0 && (
                <section>
                    <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-indigo-600" />
                        Vue d'ensemble
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="card bg-gradient-to-br from-indigo-50 to-white"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-indigo-100 rounded-lg">
                                    <TrendingUp className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600">Progression globale</p>
                                    <p className="text-2xl font-bold text-indigo-600">{overallProgress}%</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="card bg-gradient-to-br from-green-50 to-white"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-green-100 rounded-lg">
                                    <Calendar className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600">Jours complétés</p>
                                    <p className="text-2xl font-bold text-green-600">{completedDays}/{totalDays}</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="card bg-gradient-to-br from-amber-50 to-white"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-amber-100 rounded-lg">
                                    <Flame className="w-6 h-6 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600">Plus long streak</p>
                                    <p className="text-2xl font-bold text-amber-600">{longestCurrentStreak}</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="card bg-gradient-to-br from-blue-50 to-white"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-100 rounded-lg">
                                    <Target className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600">Habitudes actives</p>
                                    <p className="text-2xl font-bold text-blue-600">{totalHabits}</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>
            )}

            {/* Identities Progress Chart */}
            {identities.length > 0 && (
                <section>
                    <IdentitiesProgressChart identities={identities} habits={habits} />
                </section>
            )}

            {/* Identity Scores */}
            {identities.length > 0 && (
                <section>
                    <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Target className="w-5 h-5 text-indigo-600" />
                        Mes Identités
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {identities.map(identity => (
                            <IdentityCard
                                key={identity.id}
                                identity={identity}
                                score={calculateIdentityScore(identity.id, habits)}
                                habits={habits}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Habits List */}
            <section>
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                    Mes Habitudes
                </h2>
                {habits.length === 0 ? (
                    <div className="card p-12 text-center">
                        <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-600 mb-4">Aucune habitude pour le moment</p>
                        <button
                            onClick={() => setView('addHabit')}
                            className="btn-primary"
                        >
                            Créer ma première habitude
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {habits.map(habit => (
                            <HabitCard
                                key={habit.id}
                                habit={habit}
                                identities={identities}
                                stats={calculateHabitStats(habit)}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Data Manager */}
            <section>
                <DataManager onDataChange={handleDataChange} />
            </section>
        </div>
    );
};

export default Dashboard;
