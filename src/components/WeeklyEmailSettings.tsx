import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Mail, Clock, Calendar, CheckCircle } from 'lucide-react';
import WeeklyReportPreview from './WeeklyReportPreview';

const WeeklyEmailSettings: React.FC = () => {
    const { userPrefs, setWeeklyEmailEnabled, setWeeklyEmailDay, setWeeklyEmailHour } = useAppStore();

    const days = [
        { value: 0, label: 'Dimanche' },
        { value: 1, label: 'Lundi' },
        { value: 2, label: 'Mardi' },
        { value: 3, label: 'Mercredi' },
        { value: 4, label: 'Jeudi' },
        { value: 5, label: 'Vendredi' },
        { value: 6, label: 'Samedi' }
    ];

    const hours = Array.from({ length: 24 }, (_, i) => ({
        value: i,
        label: `${i.toString().padStart(2, '0')}:00`
    }));

    return (
        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
            <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0">
                    <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Résumé hebdomadaire par email
                    </h3>
                    <p className="text-slate-700 text-sm mb-4">
                        Recevez chaque semaine un résumé de vos progrès sur vos habitudes et identités directement dans votre boîte mail.
                    </p>

                    <div className="space-y-4">
                        {/* Activation */}
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="weeklyEmailEnabled"
                                checked={userPrefs.weeklyEmailEnabled}
                                onChange={(e) => setWeeklyEmailEnabled(e.target.checked)}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="weeklyEmailEnabled" className="text-sm font-medium text-slate-700">
                                Activer les emails hebdomadaires
                            </label>
                        </div>

                        {userPrefs.weeklyEmailEnabled && (
                            <div className="space-y-4 pl-7 border-l-2 border-blue-200">
                                {/* Jour de la semaine */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        Jour d'envoi
                                    </label>
                                    <select
                                        value={userPrefs.weeklyEmailDay}
                                        onChange={(e) => setWeeklyEmailDay(parseInt(e.target.value))}
                                        className="input-field text-sm"
                                    >
                                        {days.map(day => (
                                            <option key={day.value} value={day.value}>
                                                {day.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Heure d'envoi */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        Heure d'envoi
                                    </label>
                                    <select
                                        value={userPrefs.weeklyEmailHour}
                                        onChange={(e) => setWeeklyEmailHour(parseInt(e.target.value))}
                                        className="input-field text-sm"
                                    >
                                        {hours.map(hour => (
                                            <option key={hour.value} value={hour.value}>
                                                {hour.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Aperçu du contenu */}
                                <div className="bg-white rounded-lg p-4 border border-blue-200">
                                    <h4 className="font-medium text-slate-800 mb-2">Contenu du résumé :</h4>
                                    <ul className="text-sm text-slate-600 space-y-1">
                                        <li>• Progression de vos habitudes cette semaine</li>
                                        <li>• Statistiques de vos identités</li>
                                        <li>• Points et récompenses gagnés</li>
                                        <li>• Conseils personnalisés</li>
                                        <li>• Objectifs pour la semaine suivante</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Aperçu du résumé */}
                    <WeeklyReportPreview />
                </div>
            </div>
        </div>
    );
};

export default WeeklyEmailSettings;
