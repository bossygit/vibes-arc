import React, { useState } from 'react';
import { Plus, CheckCircle2, Info, Sparkles } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { detoxTemplates } from '@/data/detoxTemplates';

const AddHabitView: React.FC = () => {
    const { identities, addHabit, setView } = useAppStore();
    const [newHabit, setNewHabit] = useState({
        name: '',
        type: 'start' as 'start' | 'stop',
        totalDays: 365,
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
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800">Créer un signal vibratoire</h2>
                <button
                    onClick={() => setView('templates')}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition"
                >
                    <Sparkles className="w-4 h-4" />
                    Signaux guidés
                </button>
            </div>

            {/* Presentation Text */}
            <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-green-100 rounded-lg flex-shrink-0">
                        <Info className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-green-900 mb-2">Qu'est-ce qu'un signal vibratoire ?</h3>
                        <p className="text-slate-700 leading-relaxed">
                            Un signal vibratoire est une action, une pensée ou un choix répété qui indique à ton système intérieur ce que tu es en train d'émettre. Ici, l'objectif n'est pas la performance : c'est d'observer l'énergie que tu nourris, le momentum qui se construit et la résistance qui demande de la douceur.
                        </p>
                    </div>
                </div>
            </div>

            {/* Templates suggérés */}
            <div className="card bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-purple-100 rounded-lg flex-shrink-0">
                        <Sparkles className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-purple-900 mb-2">Signaux guidés</h3>
                        <p className="text-slate-700 leading-relaxed mb-3">
                            Découvre des signaux déjà structurés pour libérer la résistance, calmer le système nerveux et soutenir une fréquence plus choisie.
                            Chaque signal inclut des conseils et des durées suggérées (21, 30, 66, 90 jours).
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {detoxTemplates.slice(0, 4).map(template => (
                                <span key={template.id} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                                    {template.icon} {template.name}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="card space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Nom du signal
                    </label>
                    <input
                        type="text"
                        placeholder="Ex: Émettre 10 minutes de calme chaque matin"
                        value={newHabit.name}
                        onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                        className="input-field"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Intention vibratoire
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setNewHabit({ ...newHabit, type: 'start' })}
                            className={`px-4 py-3 rounded-lg font-medium border-2 transition ${newHabit.type === 'start'
                                ? 'border-green-500 bg-green-50 text-green-700'
                                : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                }`}
                        >
                            Émettre
                        </button>
                        <button
                            onClick={() => setNewHabit({ ...newHabit, type: 'stop' })}
                            className={`px-4 py-3 rounded-lg font-medium border-2 transition ${newHabit.type === 'stop'
                                ? 'border-red-500 bg-red-50 text-red-700'
                                : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                }`}
                        >
                            Libérer
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Fenêtre de momentum (jours)
                    </label>
                    <input
                        type="number"
                        value={newHabit.totalDays}
                        onChange={(e) => setNewHabit({ ...newHabit, totalDays: Math.min(500, Math.max(1, parseInt(e.target.value) || 1)) })}
                        className="input-field"
                        min="1"
                        max="500"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                        Choisis 21, 30, 66, 90… ou 365 pour observer le momentum qui se construit.
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                        Identités vibratoires soutenues (optionnel)
                        {newHabit.linkedIdentities.length > 0 && ` (${newHabit.linkedIdentities.length})`}
                    </label>
                    <p className="text-xs text-slate-500 mb-3">
                        Tu peux aussi assigner les signaux plus tard par glisser-déposer dans Identités.
                    </p>
                    {identities.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <p className="mb-3">Aucune identité vibratoire créée</p>
                            <button
                                onClick={() => setView('identities')}
                                className="text-indigo-600 hover:text-indigo-700 font-medium"
                            >
                                Créer une identité vibratoire d'abord →
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
                    disabled={!newHabit.name.trim()}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Créer le signal
                </button>
            </div>
        </div>
    );
};

export default AddHabitView;
