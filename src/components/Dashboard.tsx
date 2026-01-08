import React from 'react';
import { Target, TrendingUp, Calendar, BarChart3, Flame, Trophy, Award, Brain, Copy, CheckCircle2, Home } from 'lucide-react';
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
    const { identities, habits, setView, gamification, addPoints, createReward, claimReward, primingSessions } = useAppStore();

    const handleDataChange = () => {
        // Recharger les données depuis le store
        window.location.reload();
    };

    const lastNextActionSession = primingSessions.find(s => !!s.nextAction && s.nextAction.trim().length > 0);
    const nextAction = lastNextActionSession?.nextAction?.trim() ?? '';

    // Calculer les statistiques globales
    const totalHabits = habits.length;
    const totalDays = habits.reduce<number>((sum, h) => sum + h.totalDays, 0);
    const completedDays = habits.reduce<number>((sum, h) => sum + h.progress.filter(Boolean).length, 0);
    const overallProgress = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
    const currentStreaks = habits.map(h => calculateHabitStats(h).currentStreak);
    const longestCurrentStreak = currentStreaks.length > 0 ? Math.max(...currentStreaks) : 0;

    // Filtrer les habitudes avec un streak d'au moins 21 jours
    const milestone21Habits = habits
        .map(habit => ({
            habit,
            stats: calculateHabitStats(habit)
        }))
        .filter(({ stats }) => stats.longestStreak >= 21)
        .sort((a, b) => b.stats.longestStreak - a.stats.longestStreak);

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
            {/* Priming CTA */}
            <section>
                <div className="card bg-gradient-to-br from-indigo-50 to-white border border-indigo-100">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Brain className="w-5 h-5 text-indigo-600" />
                                Priming My Brain
                            </h2>
                            <p className="text-sm text-slate-600 mt-1">
                                3–10 min pour calmer le système nerveux avant l’action (sécurité → clarté → exécution).
                            </p>
                        </div>
                        <button onClick={() => setView('priming')} className="btn-primary">
                            Démarrer
                        </button>
                    </div>
                </div>
            </section>

            {/* Environnement CTA */}
            <section>
                <div className="card bg-gradient-to-br from-slate-50 to-white border border-slate-200">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Home className="w-5 h-5 text-slate-700" />
                                Design de l’environnement
                            </h2>
                            <p className="text-sm text-slate-600 mt-1">
                                Mappe tes espaces (lit, téléphone, bureau) pour rendre le bon comportement facile et le mauvais coûteux.
                            </p>
                        </div>
                        <button onClick={() => setView('environment')} className="btn-secondary">
                            Ouvrir
                        </button>
                    </div>
                </div>
            </section>

            {/* Next action (2 min) */}
            {nextAction && (
                <section>
                    <div className="card bg-white border border-slate-200">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                    Next action (2 min)
                                </h2>
                                <p className="text-xs text-slate-500 mt-1">
                                    Dernier priming: {lastNextActionSession ? new Date(lastNextActionSession.createdAt).toLocaleString('fr-FR') : ''}
                                    {lastNextActionSession?.identityName ? ` • ${lastNextActionSession.identityName}` : ''}
                                    {lastNextActionSession?.goal ? ` • ${lastNextActionSession.goal}` : ''}
                                </p>

                                <div className="mt-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                                    <div className="text-sm text-emerald-900 font-semibold">Action</div>
                                    <div className="text-lg font-bold text-slate-900 mt-1">{nextAction}</div>
                                    <div className="text-xs text-emerald-800 mt-2">
                                        Règle: une action de 2 minutes doit être “bête et faisable maintenant”.
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <button
                                    className="btn-secondary flex items-center justify-center gap-2"
                                    onClick={async () => {
                                        try {
                                            await navigator.clipboard.writeText(nextAction);
                                        } catch {
                                            // fallback silencieux
                                        }
                                    }}
                                    title="Copier l’action"
                                >
                                    <Copy className="w-4 h-4" />
                                    Copier
                                </button>
                                <button className="btn-primary" onClick={() => setView('priming')}>
                                    Nouveau priming
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            )}

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

            {/* Habitudes avec 21+ jours de streak */}
            {milestone21Habits.length > 0 && (
                <section>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-100 rounded-2xl blur-sm opacity-50"></div>
                        <div className="relative card bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-50 border-2 border-amber-200">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl shadow-lg">
                                    <Trophy className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-amber-900">
                                        🎉 Objectif 21 Jours Atteint !
                                    </h2>
                                    <p className="text-sm text-amber-700">
                                        Félicitations ! {milestone21Habits.length} habitude{milestone21Habits.length > 1 ? 's' : ''} avec un streak de 21+ jours
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {milestone21Habits.map(({ habit, stats }, index) => (
                                    <motion.div
                                        key={habit.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="bg-white rounded-xl p-4 shadow-md border-2 border-amber-300 hover:shadow-xl transition-all cursor-pointer"
                                        onClick={() => {
                                            useAppStore.getState().setSelectedHabit(habit.id);
                                            useAppStore.getState().setView('habitDetail');
                                        }}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Award className="w-5 h-5 text-amber-500" />
                                                    <h3 className="font-bold text-slate-800 text-lg">{habit.name}</h3>
                                                </div>
                                                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${habit.type === 'start'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {habit.type === 'start' ? '▲ Commencer' : '▼ Arrêter'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-slate-600">Plus long streak</span>
                                                <div className="flex items-center gap-1">
                                                    <Flame className="w-4 h-4 text-orange-500" />
                                                    <span className="font-bold text-orange-600">{stats.longestStreak} jours</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-slate-600">Streak actuel</span>
                                                <div className="flex items-center gap-1">
                                                    <Flame className="w-4 h-4 text-amber-500" />
                                                    <span className="font-bold text-amber-600">{stats.currentStreak} jours</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-slate-600">Progression</span>
                                                <span className="font-bold text-indigo-600">{stats.percentage}%</span>
                                            </div>

                                            <div className="mt-3 pt-3 border-t border-amber-200">
                                                <div className="flex items-center justify-center gap-2 text-amber-700">
                                                    <Trophy className="w-4 h-4" />
                                                    <span className="text-xs font-semibold">Objectif 21 jours ✓</span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Message motivant */}
                            <div className="mt-6 p-4 bg-white/70 rounded-lg border border-amber-200">
                                <p className="text-sm text-center text-amber-900 font-medium">
                                    💪 Il faut 21 jours pour former une habitude. Tu l'as fait ! Continue comme ça !
                                </p>
                            </div>
                        </div>
                    </motion.div>
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
                        {identities.map((identity) => (
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
                        {habits.map((habit) => (
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
                                const daysCompleted: number = Array.from({ length: todayIdx - start + 1 }).reduce<number>((sum, _, offset) => {
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
