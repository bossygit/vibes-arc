import React, { useState } from 'react';
import { Edit2, Plus, Sparkles, Trophy, X } from 'lucide-react';
import { Habit, Identity, MilestoneProgress } from '@/types';
import { calculateIdentityScore } from '@/utils/habitUtils';
import { getIdentityColorStyle } from '@/utils/identityColors';
import { HABIT_DRAG_MIME } from './HabitDragChip';

interface IdentityBoardCardProps {
    identity: Identity;
    habits: Habit[];
    milestoneItems: MilestoneProgress[];
    selectedHabitId: number | null;
    onEdit: () => void;
    onDelete: () => void;
    onLinkHabit: (habitId: number) => void;
    onUnlinkHabit: (habitId: number) => void;
    onAddSelectedHabit: () => void;
}

const IdentityBoardCard: React.FC<IdentityBoardCardProps> = ({
    identity,
    habits,
    milestoneItems,
    selectedHabitId,
    onEdit,
    onDelete,
    onLinkHabit,
    onUnlinkHabit,
    onAddSelectedHabit,
}) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const colors = getIdentityColorStyle(identity.color);
    const linkedHabits = habits.filter((h) => h.linkedIdentities.includes(identity.id));
    const score = calculateIdentityScore(identity.id, habits);
    const achievedMilestones = milestoneItems.filter((m) => m.status === 'achieved').length;

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        setIsDragOver(true);
    };

    const handleDragLeave = () => setIsDragOver(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const raw = e.dataTransfer.getData(HABIT_DRAG_MIME);
        const habitId = Number(raw);
        if (Number.isFinite(habitId) && habitId > 0) {
            onLinkHabit(habitId);
        }
    };

    return (
        <article
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
                rounded-2xl border-2 p-5 transition-all min-h-[280px] flex flex-col
                ${colors.bg} ${colors.border}
                ${isDragOver ? `ring-2 ${colors.ring} scale-[1.01] shadow-md` : 'shadow-sm'}
            `}
        >
            <header className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${colors.dot}`} />
                    <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-0.5">
                            Je deviens
                        </p>
                        <h3 className={`font-bold text-lg leading-tight ${colors.text}`}>
                            {identity.name}
                        </h3>
                    </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                    <button
                        type="button"
                        onClick={onEdit}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white/70 transition"
                        aria-label="Modifier l'identité"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={onDelete}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-white/70 transition"
                        aria-label="Supprimer l'identité"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </header>

            {identity.description && (
                <p className="text-sm text-slate-600 mb-3 leading-relaxed">{identity.description}</p>
            )}

            <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                    <span className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        Intégration
                    </span>
                    <span className="font-semibold">{score}%</span>
                </div>
                <div className="h-2 bg-white/80 rounded-full overflow-hidden">
                    <div
                        className={`h-full bg-gradient-to-r ${colors.progress} transition-all duration-500`}
                        style={{ width: `${score}%` }}
                    />
                </div>
            </div>

            <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        Signaux ({linkedHabits.length})
                    </p>
                    {selectedHabitId !== null && (
                        <button
                            type="button"
                            onClick={onAddSelectedHabit}
                            className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Ajouter la sélection
                        </button>
                    )}
                </div>

                <div
                    className={`
                        rounded-xl border border-dashed min-h-[100px] p-2 space-y-2
                        ${isDragOver ? 'border-indigo-400 bg-white/60' : 'border-slate-300/80 bg-white/40'}
                    `}
                >
                    {linkedHabits.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-6 px-2">
                            Glisse un signal ici pour nourrir cette identité
                        </p>
                    ) : (
                        linkedHabits.map((habit) => (
                            <div
                                key={habit.id}
                                className="flex items-center justify-between gap-2 rounded-lg bg-white border border-slate-200 px-3 py-2 text-sm"
                            >
                                <span className="font-medium text-slate-800 truncate">{habit.name}</span>
                                <button
                                    type="button"
                                    onClick={() => onUnlinkHabit(habit.id)}
                                    className="text-slate-400 hover:text-red-500 flex-shrink-0"
                                    aria-label={`Retirer ${habit.name} de cette identité`}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {milestoneItems.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-indigo-700 mt-3 pt-3 border-t border-white/60">
                    <Trophy className="w-3.5 h-3.5" />
                    <span>
                        {achievedMilestones}/{milestoneItems.length} milestones
                    </span>
                </div>
            )}
        </article>
    );
};

export default IdentityBoardCard;
