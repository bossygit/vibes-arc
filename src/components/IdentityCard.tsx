import React from 'react';
import { Identity, Habit } from '@/types';
import { getIdentityColorStyle } from '@/utils/identityColors';

interface IdentityCardProps {
    identity: Identity;
    score: number;
    habits?: Habit[];
}

const IdentityCard: React.FC<IdentityCardProps> = ({ identity, score, habits = [] }) => {
    const linkedHabits = habits.filter(h => h.linkedIdentities.includes(identity.id));
    const totalCompletedDays = linkedHabits.reduce((sum, h) => sum + h.progress.filter(Boolean).length, 0);
    const totalDays = linkedHabits.reduce((sum, h) => sum + h.totalDays, 0);
    const colors = getIdentityColorStyle(identity.color);

    return (
        <div className={`card hover:shadow-md transition-shadow duration-200 border ${colors.border} ${colors.bg}`}>
            <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wide text-slate-500 mb-0.5">Je deviens</p>
                    <h3 className={`font-semibold text-lg ${colors.text}`}>{identity.name}</h3>
                </div>
                <span className="text-2xl font-bold text-indigo-600">{score}%</span>
            </div>
            
            {identity.description && (
                <p className="text-sm text-slate-600 mb-3">{identity.description}</p>
            )}
            
            <div className="mb-3">
                <div className="h-3 bg-white/80 rounded-full overflow-hidden">
                    <div
                        className={`h-full bg-gradient-to-r ${colors.progress} transition-all duration-300`}
                        style={{ width: `${score}%` }}
                    />
                </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{linkedHabits.length} signal{linkedHabits.length > 1 ? 's' : ''}</span>
                {totalDays > 0 && (
                    <span>{totalCompletedDays}/{totalDays} signaux émis</span>
                )}
            </div>
        </div>
    );
};

export default IdentityCard;
