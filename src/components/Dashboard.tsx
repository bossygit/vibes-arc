import React from 'react';
import { Target, TrendingUp, Calendar, BarChart3, Flame } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { calculateIdentityScore, calculateHabitStats } from '@/utils/habitUtils';
import IdentityCard from './IdentityCard';
import HabitCard from './HabitCard';
import DataManager from './DataManager';
import IdentitiesProgressChart from './IdentitiesProgressChart';
import TodayStatus from './TodayStatus';
import OverallCalendar from './OverallCalendar';
import { motion } from 'framer-motion';
import { getCurrentDayIndex } from '@/utils/habitUtils';

const Dashboard: React.FC = () => {
    const { identities, habits, setView, gamification, addPoints, createReward, claimReward } = useAppStore() as any;

    const handleDataChange = () => {
        // Recharger les données depuis le store
        window.location.reload();
    };

    // Calculer les statistiques globales
    const totalHabits = habits.length;
    const totalDays = habits.reduce((sum: number, h: any) => sum + h.totalDays, 0);
    const completedDays = habits.reduce((sum: number, h: any) => sum + h.progress.filter(Boolean).length, 0);
    const overallProgress = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
    const currentStreaks = habits.map((h: any) => calculateHabitStats(h).currentStreak);
    const longestCurrentStreak = currentStreaks.length > 0 ? Math.max(...currentStreaks) : 0;

    // Tendance hebdo globale: sur l'ensemble des habitudes actives par jour
    const { last7Pct, prev7Pct, deltaPct } = (() => {
        const todayIdx = getCurrentDayIndex();
        const end = todayIdx;
        const start = Math.max(0, end - 6);
        const prevEnd = start - 1;
        const prevStart = Math.max(0, prevEnd - 6);

        const dayPct = (idx: number): number | null => {
            const active = habits.filter(h => idx >= 0 && idx < h.progress.length);
            if (active.length === 0) return null;
            const done = active.filter(h => h.progress[idx]).length;
            return Math.round((done / active.length) * 100);
        };

        const rangePct = (s: number, e: number) => {
            let sum = 0;
            let count = 0;
            for (let i = s; i <= e; i++) {
                const p = dayPct(i);
                if (p !== null) {
                    sum += p;
                    count += 1;
                }
            }
            return count > 0 ? Math.round(sum / count) : 0;
        };

        const last7 = rangePct(start, end);
        const prev7 = rangePct(prevStart, prevEnd);
        return { last7Pct: last7, prev7Pct: prev7, deltaPct: last7 - prev7 };
    })();

    return (
        <div className="space-y-8">
            {/* Today Status */}
            {habits.length > 0 && (
                <section>
                    <TodayStatus habits={habits} />
                </section>
            )}

            {/* Overall Calendar */}
            {habits.length > 0 && (
                <section>
                    <OverallCalendar habits={habits} />
                </section>
            )}

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
                    {/* Tendance hebdo globale */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                            className="card"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-indigo-100 rounded-lg">
                                    <TrendingUp className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600">7 derniers jours</p>
                                    <p className="text-2xl font-bold text-indigo-600">{last7Pct}%</p>
                                </div>
                                <div className="ml-auto">
                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${deltaPct >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {deltaPct >= 0 ? '+' : ''}{deltaPct}%
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="card"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-slate-100 rounded-lg">
                                    <Calendar className="w-6 h-6 text-slate-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600">7 jours précédents</p>
                                    <p className="text-xl font-semibold text-slate-700">{prev7Pct}%</p>
                                </div>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.45 }}
                            className="card"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-amber-100 rounded-lg">
                                    <Flame className="w-6 h-6 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600">Plus long streak actuel</p>
                                    <p className="text-2xl font-bold text-amber-600">{longestCurrentStreak}</p>
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
                        {identities.map((identity: any) => (
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
                        {habits.map((habit: any) => (
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

            {/* Challenge hebdo simple */}
            {habits.length > 0 && (
                <section>
                    <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Flame className="w-5 h-5 text-amber-600" />
                        Défi hebdo
                    </h2>
                    <div className="card">
                        <p className="text-slate-700 mb-2">Objectif: 5 jours complétés cette semaine</p>
                        <p className="text-sm text-slate-500 mb-3">Gagne 100 pts si tu atteins l'objectif</p>
                        <button
                            onClick={() => {
                                // calculer complétions sur les 7 derniers jours
                                const todayIdx = getCurrentDayIndex();
                                const start = Math.max(0, todayIdx - 6);
                                const daysCompleted = Array.from({ length: todayIdx - start + 1 }).reduce((sum, _, offset) => {
                                    const idx = start + offset;
                                    const active = habits.filter(h => idx >= 0 && idx < h.progress.length);
                                    if (active.length === 0) return sum;
                                    const completed = active.some(h => h.progress[idx]);
                                    return sum + (completed ? 1 : 0);
                                }, 0);
                                if (daysCompleted >= 5) {
                                    addPoints(100);
                                    alert('Défi réussi ! +100 pts');
                                } else {
                                    alert(`Tu es à ${daysCompleted}/5 jours cette semaine`);
                                }
                            }}
                            className="btn-primary"
                        >
                            Vérifier mon défi
                        </button>
                    </div>
                </section>
            )}

            {/* Data Manager */}
            <section>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                    <div className="card">
                        <h3 className="font-semibold text-slate-800 mb-2">Points</h3>
                        <div className="text-3xl font-bold text-amber-600">{gamification.points}</div>
                        <div className="mt-3 flex gap-2">
                            <button onClick={() => addPoints(50)} className="px-3 py-1 rounded bg-amber-100 text-amber-700">+50 test</button>
                        </div>
                    </div>
                    <div className="card">
                        <h3 className="font-semibold text-slate-800 mb-2">Récompenses</h3>
                        <div className="flex gap-2 mb-2">
                            <button onClick={() => createReward('Café premium', 100)} className="px-3 py-1 rounded border">Ajouter récompense</button>
                        </div>
                        <div className="space-y-2">
                            {gamification.rewards.length === 0 ? (
                                <p className="text-sm text-slate-500">Aucune récompense</p>
                            ) : (
                                gamification.rewards.map((r: any) => (
                                    <div key={r.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded border">
                                        <span className="font-medium">{r.title}</span>
                                        <span className="text-xs text-slate-500">{r.cost} pts</span>
                                        <button
                                            onClick={() => claimReward(r.id)}
                                            className="ml-auto px-2 py-1 rounded bg-indigo-600 text-white text-xs disabled:opacity-50"
                                            disabled={!!r.claimedAt || gamification.points < r.cost}
                                        >
                                            {r.claimedAt ? 'Réclamée' : 'Réclamer'}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
                <DataManager onDataChange={handleDataChange} />
            </section>
        </div>
    );
};

export default Dashboard;
