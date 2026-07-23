import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import {
    Flame,
    Plus,
    Trash2,
    Save,
    AlertTriangle,
    Target,
    Anchor,
    Footprints,
    Users,
    Brain,
} from 'lucide-react';
import { Reason, MotivationData } from '@/types';

// ============================================================
// Helpers
// ============================================================

function generateId(): string {
    return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

function defaultMotivation(): MotivationData {
    return {
        reasons: [],
        futureSelf: '',
        whatAtStake: '',
        anchorTrigger: '',
        implementationIntention: '',
        whoIsItFor: '',
        firstStep: '',
    };
}

// ============================================================
// MotivationDisplay — lecture seule (dans la carte Désir)
// ============================================================

export const MotivationDisplay: React.FC<{ motivation?: MotivationData }> = ({ motivation }) => {
    if (!motivation) return null;
    const { reasons, futureSelf, whatAtStake, anchorTrigger, implementationIntention, whoIsItFor, firstStep } = motivation;

    const painReasons = reasons.filter((r) => r.category === 'pain');
    const pleasureReasons = reasons.filter((r) => r.category === 'pleasure');
    const topReasons = [...reasons].sort((a, b) => b.intensity - a.intensity).slice(0, 3);

    const hasContent = reasons.length > 0 || futureSelf || whatAtStake || implementationIntention;

    if (!hasContent) return null;

    return (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                Moteur de motivation
            </h4>

            {/* Top reasons */}
            {topReasons.length > 0 && (
                <div className="space-y-1.5">
                    {topReasons.map((r) => (
                        <div
                            key={r.id}
                            className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                                r.category === 'pain' ? 'bg-red-100 text-red-800' : 'bg-emerald-50 text-emerald-800'
                            }`}
                        >
                            <span className="text-lg flex-shrink-0">
                                {r.category === 'pain' ? '🚫' : '🎯'}
                            </span>
                            <span className="flex-1 truncate">{r.text}</span>
                            <span className="text-xs font-bold opacity-50">{r.intensity}/10</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Pain vs Pleasure summary */}
            {(painReasons.length > 0 || pleasureReasons.length > 0) && (
                <div className="flex gap-2 text-xs">
                    {painReasons.length > 0 && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                            {painReasons.length} douleur{painReasons.length > 1 ? 's' : ''} évitée{painReasons.length > 1 ? 's' : ''}
                        </span>
                    )}
                    {pleasureReasons.length > 0 && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                            {pleasureReasons.length} plaisir{pleasureReasons.length > 1 ? 's' : ''} recherché{pleasureReasons.length > 1 ? 's' : ''}
                        </span>
                    )}
                </div>
            )}

            {/* Future Self */}
            {futureSelf && (
                <div className="flex items-start gap-2 p-2 bg-white/60 rounded-lg">
                    <Brain className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <span className="text-xs font-semibold text-purple-700">Future Self (NLP)</span>
                        <p className="text-xs text-gray-600 italic mt-0.5">« {futureSelf} »</p>
                    </div>
                </div>
            )}

            {/* What's at stake */}
            {whatAtStake && (
                <div className="flex items-start gap-2 p-2 bg-white/60 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <span className="text-xs font-semibold text-amber-700">Enjeu (Loss Aversion)</span>
                        <p className="text-xs text-gray-600 mt-0.5">{whatAtStake}</p>
                    </div>
                </div>
            )}

            {/* Implementation Intention */}
            {implementationIntention && (
                <div className="flex items-start gap-2 p-2 bg-white/60 rounded-lg">
                    <Target className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <span className="text-xs font-semibold text-blue-700">Intention d'implémentation</span>
                        <p className="text-xs text-gray-600 mt-0.5">{implementationIntention}</p>
                    </div>
                </div>
            )}

            {/* Who is it for */}
            {whoIsItFor && (
                <div className="flex items-start gap-2 p-2 bg-white/60 rounded-lg">
                    <Users className="w-4 h-4 text-pink-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <span className="text-xs font-semibold text-pink-700">Pour qui ?</span>
                        <p className="text-xs text-gray-600 mt-0.5">{whoIsItFor}</p>
                    </div>
                </div>
            )}

            {/* First step */}
            {firstStep && (
                <div className="flex items-start gap-2 p-2 bg-white/60 rounded-lg">
                    <Footprints className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <span className="text-xs font-semibold text-green-700">Premier pas (Zeigarnik)</span>
                        <p className="text-xs text-gray-600 mt-0.5">{firstStep}</p>
                    </div>
                </div>
            )}

            {/* Anchor */}
            {anchorTrigger && (
                <div className="flex items-start gap-2 p-2 bg-white/60 rounded-lg">
                    <Anchor className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <span className="text-xs font-semibold text-indigo-700">Ancre NLP</span>
                        <p className="text-xs text-gray-600 mt-0.5">{anchorTrigger}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

// ============================================================
// MotivationEditor — formulaire d'édition
// ============================================================

export const MotivationEditor: React.FC<{
    desireId: number;
    motivation?: MotivationData;
    onSave: () => void;
}> = ({ desireId, motivation, onSave }) => {
    const { saveMotivation } = useAppStore();
    const [data, setData] = useState<MotivationData>(motivation || defaultMotivation());
    const [newReasonText, setNewReasonText] = useState('');
    const [newReasonCategory, setNewReasonCategory] = useState<'pain' | 'pleasure'>('pleasure');
    const [newReasonIntensity, setNewReasonIntensity] = useState(7);
    const [saving, setSaving] = useState(false);

    const addReason = () => {
        if (!newReasonText.trim()) return;
        const reason: Reason = {
            id: generateId(),
            text: newReasonText.trim(),
            category: newReasonCategory,
            intensity: newReasonIntensity,
        };
        setData((prev) => ({ ...prev, reasons: [...prev.reasons, reason] }));
        setNewReasonText('');
    };

    const removeReason = (id: string) => {
        setData((prev) => ({
            ...prev,
            reasons: prev.reasons.filter((r) => r.id !== id),
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        await saveMotivation(desireId, data);
        setSaving(false);
        onSave();
    };

    const painReasons = data.reasons.filter((r) => r.category === 'pain');
    const pleasureReasons = data.reasons.filter((r) => r.category === 'pleasure');

    return (
        <div className="space-y-4">
            {/* Raisons */}
            <div>
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                    <Flame className="w-4 h-4 text-orange-500" />
                    Raisons profondes
                </label>
                <p className="text-xs text-gray-400 mb-3">
                    Liste tout ce qui te pousse vers ce désir. Plus c'est viscéral, plus ça motive.
                </p>

                {/* Raisons existantes */}
                {data.reasons.length > 0 && (
                    <div className="space-y-1.5 mb-3">
                        {data.reasons.map((r) => (
                            <div
                                key={r.id}
                                className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                                    r.category === 'pain' ? 'bg-red-50' : 'bg-emerald-50'
                                }`}
                            >
                                <span className="text-lg flex-shrink-0">
                                    {r.category === 'pain' ? '🚫' : '🎯'}
                                </span>
                                <span className="flex-1 truncate text-gray-700">{r.text}</span>
                                <span className="text-xs font-bold text-gray-400">{r.intensity}/10</span>
                                <button
                                    onClick={() => removeReason(r.id)}
                                    className="p-0.5 text-gray-400 hover:text-red-500"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Compteurs */}
                {(painReasons.length > 0 || pleasureReasons.length > 0) && (
                    <div className="flex gap-2 mb-3 text-xs">
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                            🚫 {painReasons.length} douleur{painReasons.length > 1 ? 's' : ''}
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                            🎯 {pleasureReasons.length} plaisir{pleasureReasons.length > 1 ? 's' : ''}
                        </span>
                    </div>
                )}

                {/* Ajouter une raison */}
                <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                    <input
                        type="text"
                        value={newReasonText}
                        onChange={(e) => setNewReasonText(e.target.value)}
                        placeholder="Pourquoi ce désir est-il vital pour toi ?"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && addReason()}
                    />
                    <div className="flex gap-2 items-center">
                        <select
                            value={newReasonCategory}
                            onChange={(e) => setNewReasonCategory(e.target.value as 'pain' | 'pleasure')}
                            className="px-2 py-1.5 rounded-lg border border-gray-200 text-xs bg-white"
                        >
                            <option value="pleasure">🎯 Plaisir à gagner</option>
                            <option value="pain">🚫 Douleur à éviter</option>
                        </select>
                        <select
                            value={newReasonIntensity}
                            onChange={(e) => setNewReasonIntensity(Number(e.target.value))}
                            className="px-2 py-1.5 rounded-lg border border-gray-200 text-xs bg-white"
                        >
                            {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => (
                                <option key={n} value={n}>
                                    Intensité {n}/10
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={addReason}
                            disabled={!newReasonText.trim()}
                            className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-medium hover:bg-orange-700 disabled:opacity-50"
                        >
                            <Plus className="w-3.5 h-3.5 inline mr-1" />
                            Ajouter
                        </button>
                    </div>
                </div>
            </div>

            {/* Future Self */}
            <div>
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-1">
                    <Brain className="w-4 h-4 text-purple-500" />
                    Future Self (NLP Future Pacing)
                </label>
                <p className="text-xs text-gray-400 mb-2">
                    Décris-toi après avoir réalisé ce désir. Comment te sens-tu ? Que fais-tu ? Qui es-tu devenu ?
                </p>
                <textarea
                    value={data.futureSelf}
                    onChange={(e) => setData((prev) => ({ ...prev, futureSelf: e.target.value }))}
                    placeholder="Je me vois debout, souriant, dans mon bureau, entouré de mon équipe..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                />
            </div>

            {/* What's at stake */}
            <div>
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Qu'est-ce qui est en jeu ? (Loss Aversion)
                </label>
                <p className="text-xs text-gray-400 mb-2">
                    Si tu n'agis pas, qu'est-ce que tu perds ? Dans 1 an ? Dans 5 ans ?
                </p>
                <textarea
                    value={data.whatAtStake}
                    onChange={(e) => setData((prev) => ({ ...prev, whatAtStake: e.target.value }))}
                    placeholder="Si je ne lance pas ce business, dans 5 ans je serai encore coincé dans un job que je déteste..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none resize-none"
                />
            </div>

            {/* Implementation Intention */}
            <div>
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-1">
                    <Target className="w-4 h-4 text-blue-500" />
                    Intention d'implémentation (Gollwitzer)
                </label>
                <p className="text-xs text-gray-400 mb-2">
                    Format : « Quand [situation], je ferai [action spécifique] »
                </p>
                <input
                    type="text"
                    value={data.implementationIntention}
                    onChange={(e) => setData((prev) => ({ ...prev, implementationIntention: e.target.value }))}
                    placeholder="Quand je me réveille à 6h, je travaille 2h sur mon business avant d'ouvrir mes mails."
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
            </div>

            {/* Who is it for */}
            <div>
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-pink-500" />
                    Pour qui tu fais ça ? (Amplification)
                </label>
                <p className="text-xs text-gray-400 mb-2">
                    Penser à ceux qui comptent amplifie la motivation plus que penser à soi seul.
                </p>
                <input
                    type="text"
                    value={data.whoIsItFor}
                    onChange={(e) => setData((prev) => ({ ...prev, whoIsItFor: e.target.value }))}
                    placeholder="Mes enfants, mon père, ma communauté, moi-même..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                />
            </div>

            {/* First step */}
            <div>
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-1">
                    <Footprints className="w-4 h-4 text-green-500" />
                    Premier pas concret (Zeigarnik)
                </label>
                <p className="text-xs text-gray-400 mb-2">
                    Quelle est la plus petite action que tu peux faire maintenant pour avancer ?
                </p>
                <input
                    type="text"
                    value={data.firstStep}
                    onChange={(e) => setData((prev) => ({ ...prev, firstStep: e.target.value }))}
                    placeholder="Créer le compte bancaire business cet après-midi."
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
            </div>

            {/* Anchor */}
            <div>
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-1">
                    <Anchor className="w-4 h-4 text-indigo-500" />
                    Ancre NLP
                </label>
                <p className="text-xs text-gray-400 mb-2">
                    Associe un geste, un mot ou une respiration à ton état de motivation maximale.
                </p>
                <input
                    type="text"
                    value={data.anchorTrigger}
                    onChange={(e) => setData((prev) => ({ ...prev, anchorTrigger: e.target.value }))}
                    placeholder="Je respire profondément et je serre mon poing droit."
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
            </div>

            <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-semibold hover:from-orange-700 hover:to-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {saving ? (
                    'Sauvegarde...'
                ) : (
                    <>
                        <Save className="w-4 h-4" />
                        Enregistrer la motivation
                    </>
                )}
            </button>
        </div>
    );
};
