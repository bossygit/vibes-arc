import React, { useEffect, useState } from 'react';
import { Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Habit } from '@/types';
import { getCurrentDayIndex, isHabitActiveOnDay } from '@/utils/habitUtils';
import { formatDateFull } from '@/utils/dateUtils';
import { useAppStore } from '@/store/useAppStore';
import { motion } from 'framer-motion';
import Celebration from './Celebration';

interface TodayStatusProps {
    habits: Habit[];
}

const TodayStatus: React.FC<TodayStatusProps> = ({ habits }) => {
    const { setView, setSelectedHabit } = useAppStore();
    const today = new Date();
    const currentDayIndex = getCurrentDayIndex();
    const [showCelebration, setShowCelebration] = useState(false);

    const handleHabitClick = (habitId: number) => {
        setSelectedHabit(habitId);
        setView('habitDetail');
    };

    // Filtrer les habitudes qui sont dans la plage valide (currentDayIndex existe dans leur progress)
    const activeHabitsToday = habits.filter(habit =>
        isHabitActiveOnDay(habit, currentDayIndex)
    );

    // Calculer les signaux qui n'ont pas encore été émis aujourd'hui.
    const unemittedSignals = activeHabitsToday.filter(habit =>
        !habit.progress[currentDayIndex]
    );

    // Calculer le niveau d'alignement du jour.
    const totalHabitsToday = activeHabitsToday.length;
    const emittedSignals = totalHabitsToday - unemittedSignals.length;
    const completionPercentage = totalHabitsToday > 0
        ? Math.round((emittedSignals / totalHabitsToday) * 100)
        : 100;

    const hasResistance = completionPercentage < 60;

    // Déclencher une célébration quand on atteint 100%
    useEffect(() => {
        if (totalHabitsToday > 0 && completionPercentage === 100) {
            setShowCelebration(true);
            const t = setTimeout(() => setShowCelebration(false), 1700);
            return () => clearTimeout(t);
        }
    }, [completionPercentage, totalHabitsToday]);

    if (totalHabitsToday === 0) {
        return null; // Ne rien afficher si pas d'habitudes actives aujourd'hui
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`card ${hasResistance
                ? 'bg-gradient-to-br from-orange-50 to-rose-50 border-2 border-orange-200'
                : 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200'
                }`}
        >
            <Celebration visible={showCelebration} message="Alignement complet du jour" onClose={() => setShowCelebration(false)} />
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${hasResistance ? 'bg-orange-100' : 'bg-green-100'}`}>
                        <Calendar className={`w-6 h-6 ${hasResistance ? 'text-orange-600' : 'text-green-600'}`} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Fréquence du jour</h2>
                        <p className="text-sm text-slate-600">{formatDateFull(today)} · signaux vibratoires actifs</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className={`text-3xl font-bold ${hasResistance ? 'text-orange-600' : 'text-green-600'}`}>
                        {completionPercentage}%
                    </div>
                    <p className="text-xs text-slate-600">
                        {emittedSignals}/{totalHabitsToday} signal{emittedSignals > 1 ? 's' : ''} émis
                    </p>
                </div>
            </div>

            {/* Message de recalibrage */}
            {hasResistance && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-3 p-4 bg-orange-100 rounded-lg mb-4 border border-orange-200"
                >
                    <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0" />
                    <p className="text-orange-900 font-semibold text-lg">
                        De la résistance est présente. Choisis un micro-signal de 2 minutes pour pivoter doucement.
                    </p>
                </motion.div>
            )}

            {completionPercentage === 100 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-3 p-4 bg-green-100 rounded-lg mb-4 border border-green-200"
                >
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                    <p className="text-green-800 font-semibold text-lg">
                        Tu as émis tous tes signaux du jour. Note le ressenti pour ancrer cette fréquence.
                    </p>
                </motion.div>
            )}

            {/* Liste des signaux non émis */}
            {unemittedSignals.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        Signaux à émettre ({unemittedSignals.length})
                    </h3>
                    <div className="space-y-2">
                        {unemittedSignals.map(habit => (
                            <motion.div
                                key={habit.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                onClick={() => handleHabitClick(habit.id)}
                                className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group"
                            >
                                <div className="w-4 h-4 rounded border-2 border-slate-300 group-hover:border-indigo-400 transition-colors"></div>
                                <span className="text-slate-700 font-medium group-hover:text-indigo-600 transition-colors">{habit.name}</span>
                                <span className={`ml-auto px-2 py-1 rounded-full text-xs font-medium ${habit.type === 'start'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                    }`}>
                                    {habit.type === 'start' ? 'Émettre' : 'Libérer'}
                                </span>
                                <span className="text-xs text-slate-400 group-hover:text-indigo-500 transition-colors">→</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default TodayStatus;

