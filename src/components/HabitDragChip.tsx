import React from 'react';
import { GripVertical } from 'lucide-react';
import { Habit } from '@/types';
import { calculateHabitStats } from '@/utils/habitUtils';

export const HABIT_DRAG_MIME = 'application/x-vibes-habit-id';

interface HabitDragChipProps {
    habit: Habit;
    selected?: boolean;
    onSelect?: () => void;
    compact?: boolean;
    onDragStart?: () => void;
    onDragEnd?: () => void;
}

const HabitDragChip: React.FC<HabitDragChipProps> = ({
    habit,
    selected = false,
    onSelect,
    compact = false,
    onDragStart,
    onDragEnd,
}) => {
    const stats = calculateHabitStats(habit);
    const typeLabel = habit.type === 'start' ? 'À faire' : 'À éviter';

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData(HABIT_DRAG_MIME, String(habit.id));
        e.dataTransfer.effectAllowed = 'copy';
        onDragStart?.();
    };

    const handleDragEnd = () => {
        onDragEnd?.();
    };

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onClick={onSelect}
            className={`
                flex items-center gap-2 rounded-lg border px-3 py-2 cursor-grab active:cursor-grabbing
                bg-white shadow-sm transition-all select-none
                ${selected ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-slate-200 hover:border-indigo-300 hover:shadow'}
                ${compact ? 'text-xs' : 'text-sm'}
            `}
            title="Glisser sur une identité pour l'y associer"
        >
            <GripVertical className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-800 truncate">{habit.name}</p>
                {!compact && (
                    <p className="text-xs text-slate-500">
                        {typeLabel} · {stats.percentage}%
                    </p>
                )}
            </div>
        </div>
    );
};

export default HabitDragChip;
