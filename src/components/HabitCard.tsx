import React from 'react';
import { Habit, Identity, HabitStats } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import HabitCalendar from './HabitCalendar';

interface HabitCardProps {
    habit: Habit;
    identities: Identity[];
    stats: HabitStats;
}

const HabitCard: React.FC<HabitCardProps> = ({ habit, identities, stats }) => {
    const { toggleHabitDay } = useAppStore();

    return (
        <div className="card">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-800">{habit.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${habit.type === 'start'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                            {habit.type === 'start' ? '▲ Commencer' : '▼ Arrêter'}
                        </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span>🔥 Streak actuel: {stats.currentStreak} jours</span>
                        <span>🏆 Meilleur streak: {stats.longestStreak} jours</span>
                        <span>✓ {stats.completed}/{stats.totalDays} jours</span>
                        <span className="font-semibold text-indigo-600">{stats.percentage}%</span>
                    </div>
                </div>
            </div>

            {/* Streaks Summary */}
            {stats.streaks.length > 0 && (
                <div className="mb-4 p-4 bg-slate-50 rounded-lg">
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">
                        📊 Historique des streaks ({stats.streaks.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {stats.streaks.sort((a, b) => b.length - a.length).map((streak, idx) => (
                            <div
                                key={idx}
                                className="px-3 py-2 bg-white rounded-lg border border-slate-200 text-xs"
                            >
                                <span className="font-bold text-indigo-600">{streak.length} jours</span>
                                <span className="text-slate-500 ml-2">
                                    ({streak.startDate} → {streak.endDate})
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Calendar Grid */}
            <HabitCalendar habit={habit} onToggleDay={toggleHabitDay} />

            {/* Linked Identities */}
            <div className="flex flex-wrap gap-2 mt-4">
                {habit.linkedIdentities.map(identityId => {
                    const identity = identities.find(i => i.id === identityId);
                    return identity ? (
                        <span
                            key={identityId}
                            className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium"
                        >
                            {identity.name}
                        </span>
                    ) : null;
                })}
            </div>
        </div>
    );
};

export default HabitCard;
