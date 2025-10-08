import React from 'react';
import { Target, TrendingUp, Calendar } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { calculateIdentityScore, calculateHabitStats } from '@/utils/habitUtils';
import IdentityCard from './IdentityCard';
import HabitCard from './HabitCard';
import DataManager from './DataManager';

const Dashboard: React.FC = () => {
    const { identities, habits, setView } = useAppStore();

    const handleDataChange = () => {
        // Recharger les données depuis le store
        window.location.reload();
    };

    return (
        <div className="space-y-8">
            {/* Identity Scores */}
            {identities.length > 0 && (
                <section>
                    <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Target className="w-5 h-5 text-indigo-600" />
                        Mes Identités
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {identities.map(identity => (
                            <IdentityCard
                                key={identity.id}
                                identity={identity}
                                score={calculateIdentityScore(identity.id, habits)}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Habits List */}
            <section>
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                    Mes Habitudes
                </h2>
                {habits.length === 0 ? (
                    <div className="card p-12 text-center">
                        <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-600 mb-4">Aucune habitude pour le moment</p>
                        <button
                            onClick={() => setView('addHabit')}
                            className="btn-primary"
                        >
                            Créer ma première habitude
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {habits.map(habit => (
                            <HabitCard
                                key={habit.id}
                                habit={habit}
                                identities={identities}
                                stats={calculateHabitStats(habit)}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Data Manager */}
            <section>
                <DataManager onDataChange={handleDataChange} />
            </section>
        </div>
    );
};

export default Dashboard;
