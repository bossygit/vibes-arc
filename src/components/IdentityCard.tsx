import React from 'react';
import { Identity, Habit } from '@/types';

interface IdentityCardProps {
    identity: Identity;
    score: number;
    habits?: Habit[];
}

const IdentityCard: React.FC<IdentityCardProps> = ({ identity, score, habits = [] }) => {
    const linkedHabits = habits.filter(h => h.linkedIdentities.includes(identity.id));
    const totalCompletedDays = linkedHabits.reduce((sum, h) => sum + h.progress.filter(Boolean).length, 0);
    const totalDays = linkedHabits.reduce((sum, h) => sum + h.totalDays, 0);

    return (
        <div className="card hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-slate-800 text-lg">{identity.name}</h3>
                <span className="text-2xl font-bold text-indigo-600">{score}%</span>
            </div>
            
            {identity.description && (
                <p className="text-sm text-slate-600 mb-3">{identity.description}</p>
            )}
            
            <div className="mb-3">
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-300"
                        style={{ width: `${score}%` }}
                    />
                </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{linkedHabits.length} habitude{linkedHabits.length > 1 ? 's' : ''}</span>
                {totalDays > 0 && (
                    <span>{totalCompletedDays}/{totalDays} jours complétés</span>
                )}
            </div>
        </div>
    );
};

export default IdentityCard;
