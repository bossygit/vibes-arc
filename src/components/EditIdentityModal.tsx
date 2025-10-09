import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Identity } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface EditIdentityModalProps {
    identity: Identity;
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: number, name: string, description?: string) => void;
}

const EditIdentityModal: React.FC<EditIdentityModalProps> = ({
    identity,
    isOpen,
    onClose,
    onSave,
}) => {
    const [name, setName] = useState(identity.name);
    const [description, setDescription] = useState(identity.description || '');

    useEffect(() => {
        setName(identity.name);
        setDescription(identity.description || '');
    }, [identity]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (name.trim()) {
            onSave(identity.id, name.trim(), description.trim() || undefined);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl shadow-xl max-w-lg w-full"
                >
                    {/* Header */}
                    <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-slate-900">Modifier l'identité</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Identity Name */}
                        <div>
                            <label htmlFor="identityName" className="block text-sm font-medium text-slate-700 mb-2">
                                Nom de l'identité *
                            </label>
                            <input
                                id="identityName"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Ex: Athlète"
                                required
                            />
                        </div>

                        {/* Identity Description */}
                        <div>
                            <label htmlFor="identityDescription" className="block text-sm font-medium text-slate-700 mb-2">
                                Description (optionnel)
                            </label>
                            <textarea
                                id="identityDescription"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                placeholder="Décrivez cette identité..."
                                rows={4}
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                Enregistrer
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default EditIdentityModal;
