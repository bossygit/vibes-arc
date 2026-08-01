import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Identity } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface EditIdentityModalProps {
    identity: Identity;
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: number, name: string, description?: string, fields?: {
        coreBeliefs?: string[];
        dailyPractices?: string[];
        habits?: string[];
        quotes?: string[];
        behavioralSignals?: string[];
    }) => void;
}

interface StringListFieldProps {
    label: string;
    placeholder: string;
    values: string[];
    onChange: (values: string[]) => void;
}

const StringListField: React.FC<StringListFieldProps> = ({ label, placeholder, values, onChange }) => {
    const [input, setInput] = useState('');

    const handleAdd = () => {
        if (input.trim() && !values.includes(input.trim())) {
            onChange([...values, input.trim()]);
            setInput('');
        }
    };

    const handleRemove = (idx: number) => {
        onChange(values.filter((_, i) => i !== idx));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
        }
    };

    return (
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
            <div className="flex gap-2 mb-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder={placeholder}
                />
                <button
                    type="button"
                    onClick={handleAdd}
                    className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition"
                >
                    +
                </button>
            </div>
            {values.length > 0 ? (
                <div className="space-y-1">
                    {values.map((v, i) => (
                        <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                            <span className="text-sm text-slate-700 flex-1">{v}</span>
                            <button
                                type="button"
                                onClick={() => handleRemove(i)}
                                className="text-slate-400 hover:text-red-500 transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-xs text-slate-500">Clique sur + pour ajouter un élément</p>
            )}
        </div>
    );
};

const EditIdentityModal: React.FC<EditIdentityModalProps> = ({
    identity,
    isOpen,
    onClose,
    onSave,
}) => {
    const [name, setName] = useState(identity.name);
    const [description, setDescription] = useState(identity.description || '');
    const [coreBeliefs, setCoreBeliefs] = useState<string[]>(identity.coreBeliefs ?? []);
    const [dailyPractices, setDailyPractices] = useState<string[]>(identity.dailyPractices ?? []);
    const [habits, setHabits] = useState<string[]>(identity.habits ?? []);
    const [quotes, setQuotes] = useState<string[]>(identity.quotes ?? []);
    const [behavioralSignals, setBehavioralSignals] = useState<string[]>(identity.behavioralSignals ?? []);

    useEffect(() => {
        setName(identity.name);
        setDescription(identity.description || '');
        setCoreBeliefs(identity.coreBeliefs ?? []);
        setDailyPractices(identity.dailyPractices ?? []);
        setHabits(identity.habits ?? []);
        setQuotes(identity.quotes ?? []);
        setBehavioralSignals(identity.behavioralSignals ?? []);
    }, [identity]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (name.trim()) {
            onSave(identity.id, name.trim(), description.trim() || undefined, {
                coreBeliefs,
                dailyPractices,
                habits,
                quotes,
                behavioralSignals,
            });
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

                        {/* Identity Rich Fields */}
                        <div className="border-t border-slate-200 pt-4">
                            <h3 className="text-sm font-semibold text-slate-800 mb-3">Enrichir l'identité (optionnel)</h3>
                            <p className="text-xs text-slate-500 mb-4">
                                Ces champs décrivent la personne que tu incarnes. Ils alimentent le pipeline
                                Désir→Identité→Traits→Signaux du Tribunal de la Vie.
                            </p>

                            <div className="space-y-5">
                                <StringListField
                                    label="Croyances fondamentales"
                                    placeholder="Ex: Je suis un créateur, Je mérite le succès..."
                                    values={coreBeliefs}
                                    onChange={setCoreBeliefs}
                                />
                                <StringListField
                                    label="Pratiques quotidiennes"
                                    placeholder="Ex: Méditation, Journaling, Lecture..."
                                    values={dailyPractices}
                                    onChange={setDailyPractices}
                                />
                                <StringListField
                                    label="Habitudes associées"
                                    placeholder="Ex: Lever à 6h, Révision hebdo, Feedback quotidien..."
                                    values={habits}
                                    onChange={setHabits}
                                />
                                <StringListField
                                    label="Citations inspirantes"
                                    placeholder="Ex: La simplicité est la sophistication suprême..."
                                    values={quotes}
                                    onChange={setQuotes}
                                />
                                <StringListField
                                    label="Signaux comportementaux observables"
                                    placeholder="Ex: Parle avec calme, Décide vite, Prend des risques..."
                                    values={behavioralSignals}
                                    onChange={setBehavioralSignals}
                                />
                            </div>
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
