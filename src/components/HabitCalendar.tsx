import React from 'react';
import { Habit } from '@/types';
import { getDateForDay, isToday, isFuture } from '@/utils/dateUtils';
import { useAppStore } from '@/store/useAppStore';

interface HabitCalendarProps {
    habit: Habit;
    onToggleDay: (habitId: number, dayIndex: number) => void;
}

const HabitCalendar: React.FC<HabitCalendarProps> = ({ habit, onToggleDay }) => {
    const { skipsByHabit } = useAppStore();
    const skips = skipsByHabit[habit.id] || [];
    const months = [
        { name: 'Octobre 2025', startDay: 0, days: 31, emptyCells: 2 },
        { name: 'Novembre 2025', startDay: 31, days: 30, emptyCells: 5 },
        { name: 'Décembre 2025', startDay: 61, days: 31, emptyCells: 0 },
    ];

    const handleDayClick = (dayIndex: number) => {
        const date = getDateForDay(dayIndex);
        // Only allow toggling if it's today or in the past
        if (!isFuture(date)) {
            onToggleDay(habit.id, dayIndex);
        }
    };

    return (
        <div className="mb-4">
            <div className="text-xs font-medium text-slate-600 mb-3">
                Du 01/10/2025 au 31/12/2025
            </div>

            {months.map((month, monthIndex) => (
                <div key={monthIndex} className={monthIndex < months.length - 1 ? 'mb-6' : ''}>
                    <div className="text-sm font-semibold text-slate-700 mb-2">{month.name}</div>
                    <div className="habit-grid">
                        {/* Days of week header */}
                        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) => (
                            <div key={i} className="text-center text-xs font-medium text-slate-500 py-1">
                                {day}
                            </div>
                        ))}

                        {/* Empty cells before first day of month */}
                        {[...Array(month.emptyCells)].map((_, i) => (
                            <div key={`empty-${monthIndex}-${i}`} />
                        ))}

                        {/* Month days */}
                        {[...Array(month.days)].map((_, i) => {
                            const dayIndex = month.startDay + i;
                            const checked = habit.progress[dayIndex];
                            const date = getDateForDay(dayIndex);
                            const isTodayDate = isToday(date);
                            const isFutureDate = isFuture(date);
                            const isSkipped = skips.includes(dayIndex);
                            const outOfRange = dayIndex < 0 || dayIndex >= habit.progress.length;

                            return (
                                <button
                                    key={i}
                                    onClick={() => handleDayClick(dayIndex)}
                                    disabled={isFutureDate || outOfRange}
                                    className={`habit-day ${checked
                                        ? 'habit-day-completed'
                                        : isSkipped
                                            ? 'bg-slate-200 text-slate-400 line-through'
                                            : outOfRange
                                                ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                                                : isFutureDate
                                                ? 'bg-slate-50 text-slate-400 cursor-not-allowed'
                                                : 'habit-day-pending'
                                        } ${isTodayDate ? 'ring-2 ring-indigo-300' : ''}`}
                                    title={outOfRange ? 'Hors durée de l’habitude' : `${i + 1} ${month.name.toLowerCase()}`}
                                >
                                    {i + 1}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
            <div className="mt-3 text-xs text-slate-500">
                Astuce: clic pour cocher, Alt+clic pour "skip day".
            </div>
        </div>
    );
};

export default HabitCalendar;
