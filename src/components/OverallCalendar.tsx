import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Habit } from '@/types';
import { getDaysInMonth, getFirstDayOfMonth, startDate } from '@/utils/dateUtils';
import { isHabitActiveOnDay } from '@/utils/habitUtils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface OverallCalendarProps {
    habits: Habit[];
}

const OverallCalendar: React.FC<OverallCalendarProps> = ({ habits }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDayOfMonth = getFirstDayOfMonth(currentMonth, currentYear);
    const monthName = format(new Date(currentYear, currentMonth), 'MMMM yyyy', { locale: fr });

    // Calculer le pourcentage d'habitudes complétées pour un jour donné
    const getDayCompletion = (day: number): number | null => {
        const currentDate = new Date(currentYear, currentMonth, day);
        currentDate.setHours(0, 0, 0, 0);
        
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        
        const diffTime = currentDate.getTime() - start.getTime();
        const dayIndex = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        // Filtrer les habitudes actives pour ce jour
        const activeHabits = habits.filter(habit =>
            isHabitActiveOnDay(habit, dayIndex)
        );

        if (activeHabits.length === 0) return null;

        const completedHabits = activeHabits.filter(habit => 
            habit.progress[dayIndex]
        ).length;

        return Math.round((completedHabits / activeHabits.length) * 100);
    };

    // Obtenir la couleur en fonction du pourcentage
    const getColorForPercentage = (percentage: number | null): string => {
        if (percentage === null) return 'bg-slate-100 text-slate-400';
        if (percentage === 100) return 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white font-bold shadow-lg'; // Doré
        if (percentage >= 70) return 'bg-green-500 text-white font-semibold'; // Vert
        if (percentage >= 50) return 'bg-orange-400 text-white font-semibold'; // Orange
        return 'bg-red-500 text-white font-semibold'; // Rouge
    };

    // Obtenir le label descriptif
    const getLabel = (percentage: number | null): string => {
        if (percentage === null) return 'Aucune habitude';
        if (percentage === 100) return 'Parfait !';
        if (percentage >= 70) return 'Bien';
        if (percentage >= 50) return 'Moyen';
        return 'Faible';
    };

    const handlePrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    const isToday = (day: number): boolean => {
        const today = new Date();
        return day === today.getDate() && 
               currentMonth === today.getMonth() && 
               currentYear === today.getFullYear();
    };

    const isFuture = (day: number): boolean => {
        const date = new Date(currentYear, currentMonth, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date > today;
    };

    return (
        <div className="card">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                        <CalendarIcon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 capitalize">{monthName}</h3>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handlePrevMonth}
                        className="p-2 hover:bg-slate-100 rounded-lg transition"
                    >
                        <ChevronLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <button
                        onClick={handleNextMonth}
                        className="p-2 hover:bg-slate-100 rounded-lg transition"
                    >
                        <ChevronRight className="w-5 h-5 text-slate-600" />
                    </button>
                </div>
            </div>

            {/* Légende */}
            <div className="flex flex-wrap gap-3 mb-4 text-xs">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-br from-yellow-400 to-amber-500"></div>
                    <span className="text-slate-600">100% (Parfait)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-500"></div>
                    <span className="text-slate-600">≥70% (Bien)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-orange-400"></div>
                    <span className="text-slate-600">50-69% (Moyen)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-red-500"></div>
                    <span className="text-slate-600">&lt;50% (Faible)</span>
                </div>
            </div>

            {/* Calendrier */}
            <div className="grid grid-cols-7 gap-2">
                {/* Jours de la semaine */}
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                    <div key={day} className="text-center text-xs font-semibold text-slate-500 py-2">
                        {day}
                    </div>
                ))}

                {/* Espaces vides avant le premier jour */}
                {Array.from({ length: (firstDayOfMonth + 6) % 7 }).map((_, i) => (
                    <div key={`empty-${i}`} />
                ))}

                {/* Jours du mois */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const percentage = getDayCompletion(day);
                    const colorClass = getColorForPercentage(percentage);
                    const label = getLabel(percentage);
                    const future = isFuture(day);
                    const today = isToday(day);

                    return (
                        <div
                            key={day}
                            className={`
                                aspect-square flex flex-col items-center justify-center rounded-lg
                                text-sm transition-all cursor-pointer group relative
                                ${future ? 'bg-slate-50 text-slate-300' : colorClass}
                                ${today ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}
                                hover:scale-105
                            `}
                            title={future ? 'Jour futur' : `${day} - ${percentage !== null ? percentage + '%' : 'N/A'} - ${label}`}
                        >
                            <span className={future ? 'text-slate-300' : ''}>{day}</span>
                            {!future && percentage !== null && (
                                <span className="text-[10px] opacity-90">{percentage}%</span>
                            )}
                            
                            {/* Tooltip au survol */}
                            {!future && (
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                    {percentage !== null ? `${percentage}% - ${label}` : 'Aucune habitude'}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default OverallCalendar;

