import React, { useState } from 'react';
import { Plus, X, CheckCircle2, Edit2, Info } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { calculateIdentityScore } from '@/utils/habitUtils';
import EditIdentityModal from './EditIdentityModal';
import { Identity } from '@/types';

const IdentitiesView: React.FC = () => {
    const { identities, habits, addIdentity, updateIdentity, deleteIdentity, gamification, createReward, claimReward } = useAppStore();
    const [newIdentity, setNewIdentity] = useState({ name: '', description: '', color: 'blue' });
    const [editingIdentity, setEditingIdentity] = useState<Identity | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleAddIdentity = async () => {
        if (!newIdentity.name.trim()) {
            setError('Le nom de l\'identité est requis');
            return;
        }

        setError(null);
        setIsLoading(true);

        try {
            await addIdentity(newIdentity);
            setNewIdentity({ name: '', description: '', color: 'blue' });
        } catch (err) {
            console.error('Erreur lors de l\'ajout:', err);
            setError(`Erreur lors de l'ajout: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateIdentity = (id: number, name: string, description?: string) => {
        updateIdentity(id, name, description);
        setEditingIdentity(null);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Gérer mes Identités</h2>

            {/* Presentation Text */}
            <div className="card bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-100 rounded-lg flex-shrink-0">
                        <Info className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-indigo-900 mb-2">Qu'est-ce qu'une identité ?</h3>
                        <p className="text-slate-700 leading-relaxed">
                            L'identité est la couche la plus profonde du changement de comportement. Il explique que le véritable changement durable ne se base pas uniquement sur les résultats ou les objectifs à atteindre, mais sur la transformation de l'identité personnelle, c'est-à-dire la perception que l'on a de soi-même.
                        </p>
                    </div>
                </div>
            </div>

            {/* Add Identity Form */}
            <div className="card">
                <h3 className="font-semibold text-slate-800 mb-4">Ajouter une identité</h3>
                
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                )}
                
                <div className="space-y-4">
                    <input
                        type="text"
                        placeholder="Nom de l'identité (ex: homme discipliné)"
                        value={newIdentity.name}
                        onChange={(e) => setNewIdentity({ ...newIdentity, name: e.target.value })}
                        className="input-field"
                    />
                    <textarea
                        placeholder="Description (optionnel)"
                        value={newIdentity.description}
                        onChange={(e) => setNewIdentity({ ...newIdentity, description: e.target.value })}
                        className="input-field"
                        rows={3}
                    />
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Couleur</label>
                        <div className="flex gap-2">
                            {['blue', 'green', 'purple', 'red', 'yellow', 'pink', 'indigo', 'teal'].map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setNewIdentity({ ...newIdentity, color })}
                                    className={`w-8 h-8 rounded-full border-2 ${newIdentity.color === color
                                            ? 'border-slate-800'
                                            : 'border-slate-300'
                                        } bg-${color}-500 hover:opacity-80 transition`}
                                />
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={handleAddIdentity}
                        disabled={isLoading}
                        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Ajout en cours...
                            </>
                        ) : (
                            <>
                                <Plus className="w-5 h-5" />
                                Ajouter l'identité
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Identities List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {identities.map((identity) => (
                    <div key={identity.id} className="card">
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3 flex-1">
                                <div className={`w-4 h-4 rounded-full bg-${identity.color}-500 flex-shrink-0`}></div>
                                <h3 className="font-semibold text-slate-800">{identity.name}</h3>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setEditingIdentity(identity)}
                                    className="text-slate-400 hover:text-indigo-500 transition"
                                >
                                    <Edit2 className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => deleteIdentity(identity.id)}
                                    className="text-slate-400 hover:text-red-500 transition"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        {identity.description && (
                            <p className="text-sm text-slate-600 mb-3">{identity.description}</p>
                        )}
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{calculateIdentityScore(identity.id, habits)}% d'intégration</span>
                        </div>
                        <div className="mt-3 pt-3 border-t">
                            <div className="flex items-center gap-2">
                                <button onClick={() => createReward(`Rituel ${identity.name}`, 150)} className="px-3 py-1 rounded border text-xs">Ajouter récompense liée</button>
                                {gamification.rewards.filter((r: any) => r.title.includes(identity.name)).map((r: any) => (
                                    <button
                                        key={r.id}
                                        onClick={() => claimReward(r.id)}
                                        className="ml-auto px-2 py-1 rounded bg-indigo-600 text-white text-xs disabled:opacity-50"
                                        disabled={!!r.claimedAt || gamification.points < r.cost}
                                    >{r.claimedAt ? 'Réclamée' : `Réclamer (${r.cost})`}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit Identity Modal */}
            {editingIdentity && (
                <EditIdentityModal
                    identity={editingIdentity}
                    isOpen={!!editingIdentity}
                    onClose={() => setEditingIdentity(null)}
                    onSave={handleUpdateIdentity}
                />
            )}
        </div>
    );
};

export default IdentitiesView;
