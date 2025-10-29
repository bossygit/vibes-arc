import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { generateWeeklyReport } from '@/utils/weeklyReportUtils';
import { Calendar, Target, Users, Trophy, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

const WeeklyReportPreview: React.FC = () => {
    const { identities, habits, skipsByHabit, gamification } = useAppStore();
    
    // Générer le rapport pour la semaine actuelle
    const report = generateWeeklyReport(identities, habits, skipsByHabit, gamification);

    return (
        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
            <div className="flex items-start gap-4">
                <div className="p-3 bg-green-100 rounded-lg flex-shrink-0">
                    <Calendar className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Aperçu de votre résumé hebdomadaire
                    </h3>
                    <p className="text-slate-700 text-sm mb-4">
                        Voici un aperçu de ce que contiendra votre email hebdomadaire :
                    </p>

                    <div className="space-y-4">
                        {/* Statistiques des habitudes */}
                        <div className="bg-white rounded-lg p-4 border border-green-200">
                            <h4 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                                <Target className="w-4 h-4" />
                                Habitudes ({report.weekStart.toLocaleDateString('fr-FR')} - {report.weekEnd.toLocaleDateString('fr-FR')})
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <div className="text-2xl font-bold text-green-600">{report.habits.completionRate.toFixed(0)}%</div>
                                    <div className="text-slate-600">Taux de réussite</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-blue-600">{report.habits.completed}/{report.habits.total}</div>
                                    <div className="text-slate-600">Habitudes actives</div>
                                </div>
                            </div>
                        </div>

                        {/* Top habitudes */}
                        {report.habits.topPerforming.length > 0 && (
                            <div className="bg-white rounded-lg p-4 border border-green-200">
                                <h4 className="font-medium text-slate-800 mb-2 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    Meilleures performances
                                </h4>
                                <div className="space-y-1">
                                    {report.habits.topPerforming.map(habit => (
                                        <div key={habit.id} className="text-sm text-slate-600">
                                            • {habit.name}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Habitudes en difficulté */}
                        {report.habits.struggling.length > 0 && (
                            <div className="bg-white rounded-lg p-4 border border-green-200">
                                <h4 className="font-medium text-slate-800 mb-2 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-orange-600" />
                                    À améliorer
                                </h4>
                                <div className="space-y-1">
                                    {report.habits.struggling.map(habit => (
                                        <div key={habit.id} className="text-sm text-slate-600">
                                            • {habit.name}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Statistiques des identités */}
                        <div className="bg-white rounded-lg p-4 border border-green-200">
                            <h4 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Identités
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <div className="text-2xl font-bold text-purple-600">{report.identities.active}</div>
                                    <div className="text-slate-600">Identités actives</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-indigo-600">{report.identities.total}</div>
                                    <div className="text-slate-600">Total identités</div>
                                </div>
                            </div>
                        </div>

                        {/* Gamification */}
                        <div className="bg-white rounded-lg p-4 border border-green-200">
                            <h4 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                                <Trophy className="w-4 h-4" />
                                Gamification
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <div className="text-2xl font-bold text-amber-600">{report.gamification.currentPoints}</div>
                                    <div className="text-slate-600">Points totaux</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-emerald-600">{report.gamification.rewardsClaimed}</div>
                                    <div className="text-slate-600">Récompenses</div>
                                </div>
                            </div>
                        </div>

                        {/* Insights */}
                        {report.insights.length > 0 && (
                            <div className="bg-white rounded-lg p-4 border border-green-200">
                                <h4 className="font-medium text-slate-800 mb-2">💡 Insights de la semaine</h4>
                                <div className="space-y-1">
                                    {report.insights.map((insight, index) => (
                                        <div key={index} className="text-sm text-slate-600">
                                            {insight}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Objectifs */}
                        {report.nextWeekGoals.length > 0 && (
                            <div className="bg-white rounded-lg p-4 border border-green-200">
                                <h4 className="font-medium text-slate-800 mb-2">🎯 Objectifs pour la semaine prochaine</h4>
                                <div className="space-y-1">
                                    {report.nextWeekGoals.map((goal, index) => (
                                        <div key={index} className="text-sm text-slate-600">
                                            • {goal}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WeeklyReportPreview;
