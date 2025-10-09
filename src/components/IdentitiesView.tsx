import React, { useState } from 'react';
import { Plus, X, CheckCircle2, Edit2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { calculateIdentityScore } from '@/utils/habitUtils';
import EditIdentityModal from './EditIdentityModal';
import { Identity } from '@/types';

const IdentitiesView: React.FC = () => {
    const { identities, habits, addIdentity, updateIdentity, deleteIdentity } = useAppStore();
    const [newIdentity, setNewIdentity] = useState({ name: '', description: '' });
    const [editingIdentity, setEditingIdentity] = useState<Identity | null>(null);

    const handleAddIdentity = () => {
        if (newIdentity.name.trim()) {
            addIdentity(newIdentity);
            setNewIdentity({ name: '', description: '' });
        }
    };

    const handleUpdateIdentity = (id: number, name: string, description?: string) => {
        updateIdentity(id, name, description);
        setEditingIdentity(null);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Gérer mes Identités</h2>

            {/* Add Identity Form */}
            <div className="card">
                <h3 className="font-semibold text-slate-800 mb-4">Ajouter une identité</h3>
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
                    <button
                        onClick={handleAddIdentity}
                        className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Ajouter l'identité
                    </button>
                </div>
            </div>

            {/* Identities List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {identities.map(identity => (
                    <div key={identity.id} className="card">
                        <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-slate-800 flex-1">{identity.name}</h3>
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
