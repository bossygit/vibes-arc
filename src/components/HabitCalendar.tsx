import React, { useMemo } from 'react';
import { Habit } from '@/types';
import { endDate, formatDateFull, getDateForDay, isToday, isFuture, startDate, totalDays } from '@/utils/dateUtils';
import { useAppStore } from '@/store/useAppStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface HabitCalendarProps {
    habit: Habit;
    onToggleDay: (habitId: number, dayIndex: number) => void;
}

const HabitCalendar: React.FC<HabitCalendarProps> = ({ habit, onToggleDay }) => {
    const { skipsByHabit } = useAppStore();
    const skips = skipsByHabit[habit.id] || [];
    const months = useMemo(() => {
        const res: Array<{ name: string; startDay: number; days: number; emptyCells: number }> = [];

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(0, 0, 0, 0);

        let y = start.getFullYear();
        let m = start.getMonth();
        const endY = end.getFullYear();
        const endM = end.getMonth();

        while (y < endY || (y === endY && m <= endM)) {
            const monthStart = new Date(y, m, 1);
            monthStart.setHours(0, 0, 0, 0);
            const monthEnd = new Date(y, m + 1, 0);
            monthEnd.setHours(0, 0, 0, 0);

            const diffTime = monthStart.getTime() - start.getTime();
            const startDay = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            const days = monthEnd.getDate();
            const firstDay = monthStart.getDay(); // 0=dimanche
            const emptyCells = (firstDay + 6) % 7; // aligner lundi=0

            res.push({
                name: format(monthStart, 'MMMM yyyy', { locale: fr }),
                startDay,
                days,
                emptyCells,
            });

            m += 1;
            if (m > 11) {
                m = 0;
                y += 1;
            }
        }

        return res;
    }, []);

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
                Du {formatDateFull(startDate)} au {formatDateFull(endDate)} • {totalDays} jours
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
