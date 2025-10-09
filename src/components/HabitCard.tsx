import React from 'react';
import { Habit, Identity, HabitStats } from '@/types';
import { useAppStore } from '@/store/useAppStore';

interface HabitCardProps {
    habit: Habit;
    identities: Identity[];
    stats: HabitStats;
}

const HabitCard: React.FC<HabitCardProps> = ({ habit, identities, stats }) => {
    const { setView, setSelectedHabit } = useAppStore();

    const handleClick = () => {
        setSelectedHabit(habit.id);
        setView('habitDetail');
    };

    return (
        <div 
            className="card cursor-pointer hover:shadow-lg transition-shadow duration-200"
            onClick={handleClick}
        >
            <div className="flex items-start justify-between">
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
                    <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                        <span>🔥 {stats.currentStreak} jours</span>
                        <span>🏆 {stats.longestStreak} jours</span>
                        <span>✓ {stats.completed}/{stats.totalDays} jours</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-300"
                                style={{ width: `${stats.percentage}%` }}
                            />
                        </div>
                        <span className="text-lg font-bold text-indigo-600 min-w-[50px] text-right">
                            {stats.percentage}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Linked Identities */}
            {habit.linkedIdentities.length > 0 && (
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
            )}

            {/* Click indicator */}
            <div className="mt-3 text-xs text-slate-400 text-right">
                Cliquez pour voir les détails →
            </div>
        </div>
    );
};

export default HabitCard;
