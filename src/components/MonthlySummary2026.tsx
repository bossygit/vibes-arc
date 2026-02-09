import React, { useMemo } from 'react';
import { CalendarDays, TrendingUp, Trophy, Star, ChevronRight } from 'lucide-react';
import { Habit } from '@/types';
import { startDate } from '@/utils/dateUtils';
import { isHabitActiveOnDay, getHabitStartDayIndex } from '@/utils/habitUtils';
import { motion } from 'framer-motion';

interface MonthlySummary2026Props {
    habits: Habit[];
}

interface MonthData {
    month: number; // 0-11
    label: string;
    totalActive: number;
    totalCompleted: number;
    successRate: number;
    perfectDays: number;
    totalDaysWithHabits: number;
    bestDay: number; // best day completion %
    worstDay: number; // worst day completion %
    isFuture: boolean;
    isCurrentMonth: boolean;
}

const MONTH_LABELS = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const MonthlySummary2026: React.FC<MonthlySummary2026Props> = ({ habits }) => {
    const monthsData = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const base = new Date(startDate);
        base.setHours(0, 0, 0, 0);
        const todayIdx = Math.floor((today.getTime() - base.getTime()) / (1000 * 60 * 60 * 24));

        const year = 2026;
        const results: MonthData[] = [];

        for (let month = 0; month < 12; month++) {
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const monthStart = new Date(year, month, 1);
            monthStart.setHours(0, 0, 0, 0);

            const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
            const isFuture = monthStart > today;

            let totalActive = 0;
            let totalCompleted = 0;
            let perfectDays = 0;
            let totalDaysWithHabits = 0;
            let bestDay = 0;
            let worstDay = 100;

            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month, day);
                date.setHours(0, 0, 0, 0);
                const dayIndex = Math.floor((date.getTime() - base.getTime()) / (1000 * 60 * 60 * 24));

                // Ne pas compter les jours futurs
                if (dayIndex > todayIdx) break;

                const activeHabits = habits.filter(h => isHabitActiveOnDay(h, dayIndex));
                if (activeHabits.length === 0) continue;

                totalDaysWithHabits++;
                const completedCount = activeHabits.filter(h => h.progress[dayIndex]).length;
                totalActive += activeHabits.length;
                totalCompleted += completedCount;

                const dayPct = Math.round((completedCount / activeHabits.length) * 100);
                if (dayPct === 100) perfectDays++;
                if (dayPct > bestDay) bestDay = dayPct;
                if (dayPct < worstDay) worstDay = dayPct;
            }

            if (totalDaysWithHabits === 0) {
                worstDay = 0;
                bestDay = 0;
            }

            const successRate = totalActive > 0 ? Math.round((totalCompleted / totalActive) * 100) : 0;

            results.push({
                month,
                label: MONTH_LABELS[month],
                totalActive,
                totalCompleted,
                successRate,
                perfectDays,
                totalDaysWithHabits,
                bestDay,
                worstDay,
                isFuture,
                isCurrentMonth,
            });
        }

        return results;
    }, [habits]);

    // Calculer le résumé global pour les mois écoulés
    const globalStats = useMemo(() => {
        const pastMonths = monthsData.filter(m => !m.isFuture && m.totalDaysWithHabits > 0);
        if (pastMonths.length === 0) return null;

        const totalActive = pastMonths.reduce((s, m) => s + m.totalActive, 0);
        const totalCompleted = pastMonths.reduce((s, m) => s + m.totalCompleted, 0);
        const overallRate = totalActive > 0 ? Math.round((totalCompleted / totalActive) * 100) : 0;
        const totalPerfectDays = pastMonths.reduce((s, m) => s + m.perfectDays, 0);
        const bestMonth = pastMonths.reduce((best, m) => m.successRate > best.successRate ? m : best, pastMonths[0]);

        return { overallRate, totalPerfectDays, bestMonth, monthsWithData: pastMonths.length };
    }, [monthsData]);

    const getBarColor = (rate: number): string => {
        if (rate >= 80) return 'bg-gradient-to-r from-emerald-400 to-emerald-500';
        if (rate >= 60) return 'bg-gradient-to-r from-green-400 to-green-500';
        if (rate >= 40) return 'bg-gradient-to-r from-amber-400 to-amber-500';
        if (rate >= 20) return 'bg-gradient-to-r from-orange-400 to-orange-500';
        return 'bg-gradient-to-r from-red-400 to-red-500';
    };

    const getTextColor = (rate: number): string => {
        if (rate >= 80) return 'text-emerald-600';
        if (rate >= 60) return 'text-green-600';
        if (rate >= 40) return 'text-amber-600';
        if (rate >= 20) return 'text-orange-600';
        return 'text-red-600';
    };

    const getEmoji = (rate: number): string => {
        if (rate >= 90) return '🏆';
        if (rate >= 80) return '🔥';
        if (rate >= 60) return '💪';
        if (rate >= 40) return '📈';
        if (rate >= 20) return '🌱';
        return '💤';
    };

    const getBadgeLabel = (rate: number): string => {
        if (rate >= 90) return 'Exceptionnel';
        if (rate >= 80) return 'Excellent';
        if (rate >= 60) return 'Bien';
        if (rate >= 40) return 'Moyen';
        if (rate >= 20) return 'À améliorer';
        return 'Faible';
    };

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                    <CalendarDays className="w-7 h-7 text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Résumé Mensuel 2026</h2>
                    <p className="text-sm text-slate-500">Taux de réussite mois par mois</p>
                </div>
            </div>

            {/* Stats globales */}
            {globalStats && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-4 gap-4"
                >
                    <div className="card bg-gradient-to-br from-indigo-50 to-white border border-indigo-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Taux global 2026</p>
                                <p className="text-2xl font-bold text-indigo-600">{globalStats.overallRate}%</p>
                            </div>
                        </div>
                    </div>
                    <div className="card bg-gradient-to-br from-amber-50 to-white border border-amber-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <Star className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Jours parfaits</p>
                                <p className="text-2xl font-bold text-amber-600">{globalStats.totalPerfectDays}</p>
                            </div>
                        </div>
                    </div>
                    <div className="card bg-gradient-to-br from-emerald-50 to-white border border-emerald-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 rounded-lg">
                                <Trophy className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Meilleur mois</p>
                                <p className="text-lg font-bold text-emerald-600">
                                    {globalStats.bestMonth.label}
                                </p>
                                <p className="text-xs text-emerald-500">{globalStats.bestMonth.successRate}%</p>
                            </div>
                        </div>
                    </div>
                    <div className="card bg-gradient-to-br from-purple-50 to-white border border-purple-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <CalendarDays className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Mois suivis</p>
                                <p className="text-2xl font-bold text-purple-600">{globalStats.monthsWithData}/12</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Grille des mois */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {monthsData.map((data, index) => (
                    <motion.div
                        key={data.month}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`card relative overflow-hidden transition-all
                            ${data.isCurrentMonth ? 'ring-2 ring-indigo-400 ring-offset-2' : ''}
                            ${data.isFuture ? 'opacity-40' : ''}
                        `}
                    >
                        {/* Badge mois courant */}
                        {data.isCurrentMonth && (
                            <div className="absolute top-2 right-2">
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-700 rounded-full uppercase tracking-wider">
                                    En cours
                                </span>
                            </div>
                        )}

                        {/* En-tête du mois */}
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">{data.isFuture ? '🔮' : getEmoji(data.successRate)}</span>
                                <h3 className="font-bold text-slate-800">{data.label}</h3>
                            </div>
                            {!data.isFuture && data.totalDaysWithHabits > 0 && (
                                <span className={`text-2xl font-bold ${getTextColor(data.successRate)}`}>
                                    {data.successRate}%
                                </span>
                            )}
                        </div>

                        {data.isFuture ? (
                            <p className="text-sm text-slate-400 italic">Mois à venir</p>
                        ) : data.totalDaysWithHabits === 0 ? (
                            <p className="text-sm text-slate-400 italic">Aucune donnée</p>
                        ) : (
                            <>
                                {/* Barre de progression */}
                                <div className="w-full bg-slate-100 rounded-full h-3 mb-3 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${data.successRate}%` }}
                                        transition={{ duration: 0.8, delay: index * 0.05 }}
                                        className={`h-full rounded-full ${getBarColor(data.successRate)}`}
                                    />
                                </div>

                                {/* Badge de performance */}
                                <div className="flex items-center justify-between mb-3">
                                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                                        data.successRate >= 80 ? 'bg-emerald-100 text-emerald-700' :
                                        data.successRate >= 60 ? 'bg-green-100 text-green-700' :
                                        data.successRate >= 40 ? 'bg-amber-100 text-amber-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                        {getBadgeLabel(data.successRate)}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                        {data.totalCompleted}/{data.totalActive} actions
                                    </span>
                                </div>

                                {/* Détails */}
                                <div className="space-y-1.5 text-sm">
                                    <div className="flex items-center justify-between text-slate-600">
                                        <span>Jours suivis</span>
                                        <span className="font-semibold text-slate-800">{data.totalDaysWithHabits}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-slate-600">
                                        <span className="flex items-center gap-1">
                                            <Star className="w-3.5 h-3.5 text-amber-500" />
                                            Jours parfaits
                                        </span>
                                        <span className="font-semibold text-amber-600">{data.perfectDays}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-slate-600">
                                        <span>Meilleur jour</span>
                                        <span className="font-semibold text-emerald-600">{data.bestDay}%</span>
                                    </div>
                                    <div className="flex items-center justify-between text-slate-600">
                                        <span>Pire jour</span>
                                        <span className="font-semibold text-red-500">{data.worstDay}%</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Graphique en barres récapitulatif */}
            {globalStats && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="card"
                >
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-indigo-600" />
                        Évolution mensuelle
                    </h3>
                    <div className="flex items-end gap-2 h-48">
                        {monthsData.map((data, index) => {
                            const height = data.isFuture || data.totalDaysWithHabits === 0
                                ? 0
                                : Math.max(4, (data.successRate / 100) * 100);
                            return (
                                <div key={data.month} className="flex-1 flex flex-col items-center gap-1">
                                    <span className={`text-xs font-bold ${
                                        data.isFuture ? 'text-slate-300' : getTextColor(data.successRate)
                                    }`}>
                                        {!data.isFuture && data.totalDaysWithHabits > 0 ? `${data.successRate}%` : ''}
                                    </span>
                                    <div className="w-full relative" style={{ height: '100%' }}>
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${height}%` }}
                                            transition={{ duration: 0.8, delay: index * 0.05 }}
                                            className={`absolute bottom-0 w-full rounded-t-md ${
                                                data.isFuture || data.totalDaysWithHabits === 0
                                                    ? 'bg-slate-100'
                                                    : getBarColor(data.successRate)
                                            } ${data.isCurrentMonth ? 'ring-2 ring-indigo-400' : ''}`}
                                        />
                                    </div>
                                    <span className={`text-[10px] font-medium ${
                                        data.isCurrentMonth ? 'text-indigo-600 font-bold' : 'text-slate-500'
                                    }`}>
                                        {data.label.slice(0, 3)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Ligne objectif 80% */}
                    <div className="relative mt-2">
                        <div className="absolute -top-[calc(48*0.8+0.5rem)] left-0 right-0 border-t-2 border-dashed border-emerald-300 opacity-50" />
                        <p className="text-xs text-slate-400 text-center mt-2">
                            Objectif recommandé : 80% de taux de réussite
                        </p>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default MonthlySummary2026;
