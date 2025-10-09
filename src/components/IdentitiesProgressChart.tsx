import React, { useState } from 'react';
import { Identity, Habit } from '@/types';
import { calculateIdentityScore } from '@/utils/habitUtils';
import { motion } from 'framer-motion';
import { TrendingUp, Target } from 'lucide-react';

interface IdentitiesProgressChartProps {
    identities: Identity[];
    habits: Habit[];
}

interface IdentityData {
    identity: Identity;
    score: number;
    habitCount: number;
    completedDays: number;
    totalDays: number;
}

const IdentitiesProgressChart: React.FC<IdentitiesProgressChartProps> = ({ identities, habits }) => {
    const [hoveredId, setHoveredId] = useState<number | null>(null);

    // Préparer les données
    const chartData: IdentityData[] = identities.map(identity => {
        const linkedHabits = habits.filter(h => h.linkedIdentities.includes(identity.id));
        const totalDays = linkedHabits.reduce((sum, h) => sum + h.totalDays, 0);
        const completedDays = linkedHabits.reduce((sum, h) => {
            return sum + h.progress.filter(Boolean).length;
        }, 0);

        return {
            identity,
            score: calculateIdentityScore(identity.id, habits),
            habitCount: linkedHabits.length,
            completedDays,
            totalDays,
        };
    }).sort((a, b) => b.score - a.score); // Trier par score décroissant

    // Couleurs dégradées en fonction du score
    const getColor = (score: number) => {
        if (score >= 80) return 'from-green-500 to-emerald-600';
        if (score >= 60) return 'from-blue-500 to-indigo-600';
        if (score >= 40) return 'from-amber-500 to-orange-600';
        if (score >= 20) return 'from-orange-500 to-red-600';
        return 'from-red-500 to-rose-600';
    };

    const getColorSolid = (score: number) => {
        if (score >= 80) return 'bg-green-500';
        if (score >= 60) return 'bg-blue-500';
        if (score >= 40) return 'bg-amber-500';
        if (score >= 20) return 'bg-orange-500';
        return 'bg-red-500';
    };

    if (identities.length === 0) {
        return (
            <div className="card text-center py-12">
                <Target className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 mb-2">Aucune identité à afficher</p>
                <p className="text-sm text-slate-500">Créez votre première identité pour voir votre progression</p>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                    Progression des Identités
                </h3>
                <div className="text-xs text-slate-500">
                    {identities.length} identité{identities.length > 1 ? 's' : ''}
                </div>
            </div>

            <div className="space-y-6">
                {chartData.map((data, index) => (
                    <motion.div
                        key={data.identity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onMouseEnter={() => setHoveredId(data.identity.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        className="group"
                    >
                        {/* Identity Header */}
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${getColorSolid(data.score)}`} />
                                <div>
                                    <h4 className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                                        {data.identity.name}
                                    </h4>
                                    <p className="text-xs text-slate-500">
                                        {data.habitCount} habitude{data.habitCount > 1 ? 's' : ''}
                                        {data.totalDays > 0 && ` · ${data.completedDays}/${data.totalDays} jours`}
                                    </p>
                                </div>
                            </div>
                            <motion.div
                                animate={{
                                    scale: hoveredId === data.identity.id ? 1.1 : 1,
                                }}
                                className="text-2xl font-bold text-slate-800"
                            >
                                {data.score}%
                            </motion.div>
                        </div>

                        {/* Progress Bar */}
                        <div className="relative">
                            {/* Background bar */}
                            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                {/* Animated progress bar */}
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${data.score}%` }}
                                    transition={{
                                        duration: 1,
                                        delay: index * 0.1,
                                        ease: 'easeOut',
                                    }}
                                    className={`h-full bg-gradient-to-r ${getColor(data.score)} relative`}
                                >
                                    {/* Shine effect */}
                                    <motion.div
                                        animate={{
                                            x: hoveredId === data.identity.id ? ['-100%', '200%'] : '-100%',
                                        }}
                                        transition={{
                                            duration: 0.8,
                                            ease: 'easeInOut',
                                        }}
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                    />
                                </motion.div>
                            </div>

                            {/* Tooltip on hover */}
                            {hoveredId === data.identity.id && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="absolute -top-16 left-1/2 transform -translate-x-1/2 z-10"
                                >
                                    <div className="bg-slate-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap">
                                        <div className="font-semibold mb-1">{data.identity.name}</div>
                                        <div className="text-xs opacity-90">
                                            {data.score}% de progression
                                        </div>
                                        {data.identity.description && (
                                            <div className="text-xs opacity-75 mt-1 max-w-xs">
                                                {data.identity.description}
                                            </div>
                                        )}
                                        {/* Arrow */}
                                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45" />
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Progress segments indicator */}
                        {data.score > 0 && (
                            <div className="flex justify-between mt-1 text-xs text-slate-400">
                                <span>0%</span>
                                <span className="text-slate-300">|</span>
                                <span>25%</span>
                                <span className="text-slate-300">|</span>
                                <span>50%</span>
                                <span className="text-slate-300">|</span>
                                <span>75%</span>
                                <span className="text-slate-300">|</span>
                                <span>100%</span>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-4 border-t border-slate-200">
                <div className="flex flex-wrap gap-4 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="text-slate-600">Excellent (80-100%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-slate-600">Bon (60-79%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <span className="text-slate-600">Moyen (40-59%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500" />
                        <span className="text-slate-600">Faible (20-39%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-slate-600">Débutant (0-19%)</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IdentitiesProgressChart;
