import React, { useState } from 'react';
import { Plus, CheckCircle2, Info } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

const AddHabitView: React.FC = () => {
    const { identities, addHabit, setView } = useAppStore();
    const [newHabit, setNewHabit] = useState({
        name: '',
        type: 'start' as 'start' | 'stop',
        totalDays: 92,
        linkedIdentities: [] as number[]
    });

    const handleAddHabit = () => {
        if (newHabit.name.trim() && newHabit.linkedIdentities.length > 0) {
            addHabit(newHabit);
            setView('dashboard');
        }
    };

    const toggleIdentitySelection = (identityId: number) => {
        const current = newHabit.linkedIdentities;
        if (current.includes(identityId)) {
            setNewHabit({
                ...newHabit,
                linkedIdentities: current.filter(id => id !== identityId)
            });
        } else {
            setNewHabit({
                ...newHabit,
                linkedIdentities: [...current, identityId]
            });
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Créer une nouvelle habitude</h2>

            {/* Presentation Text */}
            <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-green-100 rounded-lg flex-shrink-0">
                        <Info className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-green-900 mb-2">Qu'est-ce qu'une habitude ?</h3>
                        <p className="text-slate-700 leading-relaxed">
                            Une habitude est une routine ou un comportement régulier qui se manifeste automatiquement en réponse à un stimulus spécifique. Il décrit les habitudes comme les "atomes" de la vie, des petites actions qui paraissent insignifiantes à première vue, mais qui s'additionnent sur le temps pour produire des résultats significatifs et puissants. Ces habitudes sont donc des unités fondamentales contribuant à l'amélioration personnelle continue.
                        </p>
                    </div>
                </div>
            </div>

            <div className="card space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Nom de l'habitude
                    </label>
                    <input
                        type="text"
                        placeholder="Ex: Méditer 10 minutes chaque matin"
                        value={newHabit.name}
                        onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                        className="input-field"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Type d'habitude
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setNewHabit({ ...newHabit, type: 'start' })}
                            className={`px-4 py-3 rounded-lg font-medium border-2 transition ${newHabit.type === 'start'
                                ? 'border-green-500 bg-green-50 text-green-700'
                                : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                }`}
                        >
                            ▲ Commencer
                        </button>
                        <button
                            onClick={() => setNewHabit({ ...newHabit, type: 'stop' })}
                            className={`px-4 py-3 rounded-lg font-medium border-2 transition ${newHabit.type === 'stop'
                                ? 'border-red-500 bg-red-50 text-red-700'
                                : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                }`}
                        >
                            ▼ Arrêter
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Durée (jours)
                    </label>
                    <input
                        type="number"
                        value={newHabit.totalDays}
                        onChange={(e) => setNewHabit({ ...newHabit, totalDays: Math.min(365, Math.max(1, parseInt(e.target.value) || 1)) })}
                        className="input-field"
                        min="1"
                        max="365"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                        Choisis 21, 30, 66, 90… selon ton objectif
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                        Identités liées {newHabit.linkedIdentities.length > 0 && `(${newHabit.linkedIdentities.length})`}
                    </label>
                    {identities.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <p className="mb-3">Aucune identité créée</p>
                            <button
                                onClick={() => setView('identities')}
                                className="text-indigo-600 hover:text-indigo-700 font-medium"
                            >
                                Créer une identité d'abord →
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {identities.map(identity => (
                                <button
                                    key={identity.id}
                                    onClick={() => toggleIdentitySelection(identity.id)}
                                    className={`px-4 py-3 rounded-lg border-2 text-left transition ${newHabit.linkedIdentities.includes(identity.id)
                                        ? 'border-indigo-500 bg-indigo-50'
                                        : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${newHabit.linkedIdentities.includes(identity.id)
                                            ? 'border-indigo-500 bg-indigo-500'
                                            : 'border-slate-300'
                                            }`}>
                                            {newHabit.linkedIdentities.includes(identity.id) && (
                                                <CheckCircle2 className="w-4 h-4 text-white" />
                                            )}
                                        </div>
                                        <span className="font-medium text-slate-700">{identity.name}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <button
                    onClick={handleAddHabit}
                    disabled={!newHabit.name.trim() || newHabit.linkedIdentities.length === 0}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Créer l'habitude
                </button>
            </div>
        </div>
    );
};

export default AddHabitView;
