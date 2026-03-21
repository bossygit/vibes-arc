import React from 'react';
import { Target, TrendingUp, Calendar, BarChart3, Flame, Trophy, Award, Copy, CheckCircle2, Heart } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { calculateIdentityScore, calculateHabitStats, getHabitStartDayIndex } from '@/utils/habitUtils';
import IdentityCard from './IdentityCard';
import HabitCard from './HabitCard';
import DataManager from './DataManager';
import IdentitiesProgressChart from './IdentitiesProgressChart';
import TodayStatus from './TodayStatus';
import ChainSection from './ChainSection';
import FutureSelfSection from './FutureSelfSection';
import RewardSection from './RewardSection';
import OverallCalendar from './OverallCalendar';
import MonthlySummary2026 from './MonthlySummary2026';
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

    // Calculer les statistiques globales (sans rétro‑impacter le passé)
    // Règle: une habitude n'est comptée qu'à partir de sa date de création.
    const totalHabits = habits.length;
    const todayIdxForStats = getCurrentDayIndex();
    const { totalActiveDays, totalCompletedDays } = habits.reduce(
        (acc, h) => {
            const startIdx = getHabitStartDayIndex(h);
            const endIdx = Math.min(todayIdxForStats, h.progress.length - 1);
            if (endIdx < startIdx) return acc;
            const activeDays = endIdx - startIdx + 1;
            let completed = 0;
            for (let i = startIdx; i <= endIdx; i++) {
                if (h.progress[i]) completed += 1;
            }
            return {
                totalActiveDays: acc.totalActiveDays + activeDays,
                totalCompletedDays: acc.totalCompletedDays + completed,
            };
        },
        { totalActiveDays: 0, totalCompletedDays: 0 }
    );
    const overallProgress = totalActiveDays > 0 ? Math.round((totalCompletedDays / totalActiveDays) * 100) : 0;
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
            const active = habits.filter(h => idx >= getHabitStartDayIndex(h) && idx >= 0 && idx < h.progress.length);
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
            {/* Inner Child Check-in — bloquant doux si non fait aujourd'hui */}
            <InnerChildGate onStart={() => setView('innerChild')} />

            {/* Today Status — premier bloc */}
            {habits.length > 0 && (
                <section>
                    <TodayStatus habits={habits} />
                </section>
            )}

            {/* Next action (2 min) */}            {/* Next action (2 min) */}
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

            {/* Never Break the Chain */}
            {habits.length > 0 && (
                <section>
                    <ChainSection habits={habits} />
                </section>
            )}

            {/* Future Self */}
            {habits.length > 0 && (
                <section>
                    <FutureSelfSection habits={habits} />
                </section>
            )}

            {/* Reward (Dopamine Loop) */}
            {habits.length > 0 && (
                <section>
                    <RewardSection habits={habits} />
                </section>
            )}

            {/* Overall Calendar */}
            {habits.length > 0 && (
                <section>
                    <OverallCalendar habits={habits} />
                </section>
            )}

            {/* Résumé mensuel 2026 */}
            {habits.length > 0 && (
                <section>
                    <MonthlySummary2026 habits={habits} />
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
                                    <p className="text-2xl font-bold text-green-600">{totalCompletedDays}/{totalActiveDays}</p>
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
                                    const active = habits.filter(h => idx >= getHabitStartDayIndex(h) && idx >= 0 && idx < h.progress.length);
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

// ─── Données émotionnelles ────────────────────────────────────────────────────

const EMOTIONS_MAP: Record<string, { emoji: string; label: string; color: string; bg: string }> = {
    honte:     { emoji: '😶', label: 'Honte / Indignité',   color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
    peur:      { emoji: '😰', label: 'Peur / Anxiété',      color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200' },
    colere:    { emoji: '😤', label: 'Colère / Frustration', color: 'text-red-700',    bg: 'bg-red-50 border-red-200' },
    tristesse: { emoji: '😢', label: 'Tristesse / Abandon', color: 'text-slate-700',  bg: 'bg-slate-50 border-slate-200' },
    vide:      { emoji: '😑', label: 'Vide / Déconnexion',  color: 'text-gray-700',   bg: 'bg-gray-50 border-gray-200' },
    calme:     { emoji: '😌', label: 'Calme / Neutre',      color: 'text-green-700',  bg: 'bg-green-50 border-green-200' },
    joie:      { emoji: '😊', label: 'Joie / Légèreté',     color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
    confiance: { emoji: '💪', label: 'Confiance / Force',   color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
};

// Messages d'encouragement selon l'heure
function getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour Bienvenu';
    if (h < 18) return 'Bon après-midi Bienvenu';
    return 'Bonsoir Bienvenu';
}

// ─── InnerChildGate — bloquant doux ──────────────────────────────────────────
//
// Si le check-in n'a PAS été fait aujourd'hui :
//   → Affiche une carte d'invitation plein-cadre AVANT tout le reste.
//   → Bouton principal "Commencer le check-in" (→ vue innerChild).
//   → Lien discret "Passer pour aujourd'hui →" qui dismiss jusqu'au lendemain.
//
// Si le check-in a ÉTÉ fait :
//   → Affiche un petit badge de confirmation compact (non bloquant).

const DISMISSED_KEY = 'vibes-arc-checkin-dismissed';

const InnerChildGate: React.FC<{ onStart: () => void }> = ({ onStart }) => {
    const [dismissed, setDismissed] = React.useState<boolean>(() => {
        try {
            return localStorage.getItem(DISMISSED_KEY) === new Date().toISOString().slice(0, 10);
        } catch { return false; }
    });

    const todayStr = new Date().toISOString().slice(0, 10);
    let todayEntry: any = null;
    try {
        const raw = localStorage.getItem('vibes-arc-inner-child');
        if (raw) {
            const ic = JSON.parse(raw);
            todayEntry = (ic.entries || []).find((e: any) => e.date === todayStr);
        }
    } catch { /* ignore */ }

    const handleDismiss = () => {
        try { localStorage.setItem(DISMISSED_KEY, todayStr); } catch { /* ignore */ }
        setDismissed(true);
    };

    // ── Check-in déjà fait → badge compact ──
    if (todayEntry) {
        const ed = EMOTIONS_MAP[todayEntry.emotion];
        return (
            <section>
                <div className={`rounded-2xl border p-4 flex items-center gap-3 ${ed?.bg ?? 'bg-rose-50 border-rose-200'}`}>
                    <span className="text-2xl">{ed?.emoji ?? '🫀'}</span>
                    <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${ed?.color ?? 'text-rose-700'}`}>
                            Check-in du jour fait ✓ — {ed?.label}
                        </p>
                        <p className="text-xs text-slate-500 truncate mt-0.5 italic">
                            "{todayEntry.selfCompassionMessage?.slice(0, 70)}…"
                        </p>
                    </div>
                    <button
                        onClick={onStart}
                        className="text-xs text-slate-400 hover:text-slate-600 whitespace-nowrap transition"
                    >
                        Revoir →
                    </button>
                </div>
            </section>
        );
    }

    // ── Déjà passé aujourd'hui → petit rappel discret ──
    if (dismissed) {
        return (
            <section>
                <button
                    onClick={onStart}
                    className="w-full text-left rounded-2xl border border-dashed border-rose-200 bg-white px-4 py-3 flex items-center gap-3 hover:bg-rose-50/40 transition group"
                >
                    <Heart className="w-4 h-4 text-rose-300 group-hover:text-rose-400 transition flex-shrink-0" />
                    <p className="text-xs text-slate-400 group-hover:text-slate-500 transition">
                        Inner Child Check-in non fait · Cliquer pour commencer
                    </p>
                    <span className="ml-auto text-xs text-rose-300 group-hover:text-rose-400 transition">→</span>
                </button>
            </section>
        );
    }

    // ── Non fait, non passé → CARTE PLEIN CADRE bloquante douce ──
    return (
        <section>
            <div className="rounded-2xl border-2 border-rose-200 bg-gradient-to-br from-rose-50 via-white to-pink-50 overflow-hidden">
                {/* En-tête */}
                <div className="px-6 pt-6 pb-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                            <Heart className="w-6 h-6 text-rose-500" />
                        </div>
                        <div>
                            <p className="text-xs text-rose-400 font-medium uppercase tracking-wider">Avant de commencer</p>
                            <h2 className="text-lg font-bold text-slate-800">{getGreeting()}</h2>
                        </div>
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed">
                        Les habitudes ne tombent pas par manque de volonté — elles tombent quand
                        l'état intérieur n'est pas aligné. <span className="font-medium text-slate-700">2 minutes</span> pour
                        reconnaître ce que tu ressens vraiment.
                    </p>
                </div>

                {/* Sélection rapide d'émotion — 4 émotions les plus courantes */}
                <div className="px-6 pb-4">
                    <p className="text-xs text-slate-400 mb-2 uppercase tracking-wide">Comment tu te sens là, maintenant ?</p>
                    <div className="grid grid-cols-4 gap-2">
                        {(['calme', 'peur', 'honte', 'confiance'] as const).map(key => {
                            const ed = EMOTIONS_MAP[key];
                            return (
                                <button
                                    key={key}
                                    onClick={onStart}
                                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition hover:scale-105 active:scale-95 ${ed.bg}`}
                                >
                                    <span className="text-xl">{ed.emoji}</span>
                                    <span className={`text-[10px] font-medium text-center leading-tight ${ed.color}`}>
                                        {ed.label.split(' / ')[0]}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Actions */}
                <div className="px-6 pb-5 flex flex-col sm:flex-row items-center gap-3">
                    <button
                        onClick={onStart}
                        className="w-full sm:flex-1 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white font-semibold text-sm transition flex items-center justify-center gap-2"
                    >
                        <Heart className="w-4 h-4" />
                        Commencer le check-in · 2 min
                    </button>
                    <button
                        onClick={handleDismiss}
                        className="text-xs text-slate-400 hover:text-slate-500 transition py-2 px-3 rounded-lg hover:bg-slate-100"
                    >
                        Passer pour aujourd'hui →
                    </button>
                </div>

                {/* Citation d'ancrage */}
                <div className="border-t border-rose-100 px-6 py-3 bg-rose-50/60">
                    <p className="text-xs text-slate-400 italic text-center">
                        "Tu n'es pas seul. Je suis là maintenant."
                    </p>
                </div>
            </div>
        </section>
    );
};
