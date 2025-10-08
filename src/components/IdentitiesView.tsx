import React, { useState } from 'react';
import { Plus, X, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { calculateIdentityScore } from '@/utils/habitUtils';

const IdentitiesView: React.FC = () => {
    const { identities, habits, addIdentity, deleteIdentity } = useAppStore();
    const [newIdentity, setNewIdentity] = useState({ name: '', description: '' });

    const handleAddIdentity = () => {
        if (newIdentity.name.trim()) {
            addIdentity(newIdentity);
            setNewIdentity({ name: '', description: '' });
        }
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
                            <button
                                onClick={() => deleteIdentity(identity.id)}
                                className="text-slate-400 hover:text-red-500 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
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
        </div>
    );
};

export default IdentitiesView;
