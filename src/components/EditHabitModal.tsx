import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Habit, Identity } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface EditHabitModalProps {
    habit: Habit;
    identities: Identity[];
    isOpen: boolean;
    onClose: () => void;
    onSave: (updates: Partial<Habit>) => void;
}

const EditHabitModal: React.FC<EditHabitModalProps> = ({
    habit,
    identities,
    isOpen,
    onClose,
    onSave,
}) => {
    const [name, setName] = useState(habit.name);
    const [type, setType] = useState<'start' | 'stop'>(habit.type);
    const [selectedIdentities, setSelectedIdentities] = useState<number[]>(habit.linkedIdentities);

    useEffect(() => {
        setName(habit.name);
        setType(habit.type);
        setSelectedIdentities(habit.linkedIdentities);
    }, [habit]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (name.trim()) {
            onSave({
                name: name.trim(),
                type,
                linkedIdentities: selectedIdentities,
            });
            onClose();
        }
    };

    const toggleIdentity = (identityId: number) => {
        setSelectedIdentities(prev =>
            prev.includes(identityId)
                ? prev.filter(id => id !== identityId)
                : [...prev, identityId]
        );
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                >
                    {/* Header */}
                    <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-slate-900">Modifier l'habitude</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Habit Name */}
                        <div>
                            <label htmlFor="habitName" className="block text-sm font-medium text-slate-700 mb-2">
                                Nom de l'habitude *
                            </label>
                            <input
                                id="habitName"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Ex: Faire 30 min de sport"
                                required
                            />
                        </div>

                        {/* Habit Type */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-3">
                                Type d'habitude *
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setType('start')}
                                    className={`p-4 border-2 rounded-lg transition-all ${
                                        type === 'start'
                                            ? 'border-green-500 bg-green-50'
                                            : 'border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    <div className="text-2xl mb-2">▲</div>
                                    <div className="font-semibold">Commencer</div>
                                    <div className="text-xs text-slate-600">Une habitude à adopter</div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setType('stop')}
                                    className={`p-4 border-2 rounded-lg transition-all ${
                                        type === 'stop'
                                            ? 'border-red-500 bg-red-50'
                                            : 'border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    <div className="text-2xl mb-2">▼</div>
                                    <div className="font-semibold">Arrêter</div>
                                    <div className="text-xs text-slate-600">Une habitude à perdre</div>
                                </button>
                            </div>
                        </div>

                        {/* Linked Identities */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-3">
                                Identités liées (optionnel)
                            </label>
                            {identities.length === 0 ? (
                                <p className="text-sm text-slate-500">
                                    Aucune identité disponible. Créez-en une d'abord.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {identities.map((identity) => (
                                        <label
                                            key={identity.id}
                                            className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedIdentities.includes(identity.id)}
                                                onChange={() => toggleIdentity(identity.id)}
                                                className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium text-slate-900">{identity.name}</div>
                                                {identity.description && (
                                                    <div className="text-sm text-slate-600">{identity.description}</div>
                                                )}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Note */}
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <p className="text-sm text-amber-800">
                                <strong>Note :</strong> La durée totale et la progression ne peuvent pas être modifiées pour préserver l'historique.
                            </p>
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

export default EditHabitModal;
