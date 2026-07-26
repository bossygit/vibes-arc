import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Desire } from '@/types';
import { generateDefaultIntention, getSuggestedSignals } from '@/utils/dailyAlignment';
import { getCurrentDayIndex } from '@/utils/habitUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Target, Sparkles, Check } from 'lucide-react';

interface Props {
    onSave: (desireId: number, desireTitle: string, intention: string, signalIds: number[]) => void;
}

const MorningIntentionComponent: React.FC<Props> = ({ onSave }) => {
    const { desires, habits } = useAppStore();
    const todayIdx = getCurrentDayIndex();

    const [step, setStep] = useState<'desire' | 'intention' | 'signals' | 'confirm'>('desire');
    const [selectedDesireId, setSelectedDesireId] = useState<number | null>(null);
    const [intention, setIntention] = useState('');
    const [selectedSignalIds, setSelectedSignalIds] = useState<number[]>([]);

    const selectedDesire = useMemo(
        () => desires.find((d) => d.id === selectedDesireId) ?? null,
        [desires, selectedDesireId]
    );

    const availableSignals = useMemo(() => {
        if (!selectedDesire) return [];
        const ids = getSuggestedSignals(
            selectedDesire.linkedIdentityIds,
            habits,
            todayIdx
        );
        return habits.filter((h) => ids.includes(h.id));
    }, [selectedDesire, habits, todayIdx]);

    const handleSelectDesire = (desire: Desire) => {
        setSelectedDesireId(desire.id);
        setIntention(generateDefaultIntention(desire.title));
        setSelectedSignalIds([]);
        setStep('intention');
    };

    const handleToggleSignal = (signalId: number) => {
        setSelectedSignalIds((prev) =>
            prev.includes(signalId)
                ? prev.filter((id) => id !== signalId)
                : [...prev, signalId]
        );
    };

    const handleConfirm = () => {
        if (!selectedDesireId || !selectedDesire) return;
        onSave(selectedDesireId, selectedDesire.title, intention, selectedSignalIds);
        setStep('confirm');
    };

    const allSignalsCompleted = availableSignals.length === 0;

    return (
        <div className="max-w-lg mx-auto">
            <AnimatePresence mode="wait">
                {step === 'desire' && (
                    <motion.div
                        key="desire"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <div className="text-center mb-8">
                            <span className="inline-block text-4xl mb-3">🌅</span>
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">
                                Qui veux-tu être aujourd'hui ?
                            </h2>
                            <p className="text-slate-500 text-sm">
                                Choisis le désir que tu veux honorer, et je t'aiderai à envoyer les bons signaux.
                            </p>
                        </div>

                        {desires.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                                <Target className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-600 mb-3">Tu n'as pas encore défini de désirs.</p>
                                <p className="text-slate-400 text-sm">
                                    Crée un désir d'abord dans le Tribunal, puis reviens ici pour aligner ta journée.
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {desires.map((desire) => (
                                    <button
                                        key={desire.id}
                                        onClick={() => handleSelectDesire(desire)}
                                        className="w-full text-left p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-slate-800 group-hover:text-indigo-700">
                                                    {desire.title}
                                                </p>
                                                <p className="text-xs text-slate-400 mt-0.5 capitalize">
                                                    Désir : {desire.type === 'être' ? 'Être' : 'Avoir'}
                                                </p>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {step === 'intention' && selectedDesire && (
                    <motion.div
                        key="intention"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <div className="flex items-center gap-2 mb-6">
                            <button
                                onClick={() => setStep('desire')}
                                className="text-slate-400 hover:text-slate-600 text-sm flex items-center gap-1"
                            >
                                ← Retour
                            </button>
                            <span className="text-slate-300">|</span>
                            <span className="text-sm text-slate-500">{selectedDesire.title}</span>
                        </div>

                        <h3 className="text-lg font-semibold text-slate-800 mb-2">
                            Ton intention pour aujourd'hui
                        </h3>
                        <p className="text-slate-500 text-sm mb-5">
                            Une phrase claire, au présent. C'est ta déclaration pour le Tribunal de la Vie.
                        </p>

                        <textarea
                            value={intention}
                            onChange={(e) => setIntention(e.target.value)}
                            className="w-full p-4 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none resize-none"
                            rows={3}
                            placeholder="Ex: Aujourd'hui, je suis la personne disciplinée qui honore ses signaux..."
                        />

                        <button
                            onClick={() => setStep('signals')}
                            disabled={!intention.trim()}
                            className="mt-4 w-full py-3 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                        >
                            <Sparkles className="w-4 h-4" />
                            Continuer vers les signaux
                        </button>
                    </motion.div>
                )}

                {step === 'signals' && selectedDesire && (
                    <motion.div
                        key="signals"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <div className="flex items-center gap-2 mb-6">
                            <button
                                onClick={() => setStep('intention')}
                                className="text-slate-400 hover:text-slate-600 text-sm flex items-center gap-1"
                            >
                                ← Retour
                            </button>
                        </div>

                        <h3 className="text-lg font-semibold text-slate-800 mb-2">
                            Choisis tes signaux du jour
                        </h3>
                        <p className="text-slate-500 text-sm mb-5">
                            Ce sont les habitudes que tu t'engages à honorer aujourd'hui. Chaque signal coché = une preuve pour ton dossier.
                        </p>

                        {allSignalsCompleted ? (
                            <div className="text-center py-8 bg-emerald-50 border border-emerald-200 rounded-xl">
                                <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                                <p className="text-emerald-700 font-medium">
                                    Tous tes signaux sont déjà cochés pour aujourd'hui ! 🎉
                                </p>
                                <p className="text-emerald-600 text-sm mt-1">
                                    Prends un moment pour savourer cette victoire. Continue.
                                </p>
                                <button
                                    onClick={handleConfirm}
                                    className="mt-4 px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition"
                                >
                                    Valider mon alignement
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="flex flex-col gap-2 mb-6">
                                    {availableSignals.map((habit) => (
                                        <button
                                            key={habit.id}
                                            onClick={() => handleToggleSignal(habit.id)}
                                            className={`w-full text-left p-4 rounded-xl border transition-all ${
                                                selectedSignalIds.includes(habit.id)
                                                    ? 'border-indigo-400 bg-indigo-50'
                                                    : 'border-slate-200 bg-white hover:border-indigo-200'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                                        selectedSignalIds.includes(habit.id)
                                                            ? 'bg-indigo-600 border-indigo-600'
                                                            : 'border-slate-300'
                                                    }`}
                                                >
                                                    {selectedSignalIds.includes(habit.id) && (
                                                        <Check className="w-3 h-3 text-white" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-800 text-sm">{habit.name}</p>
                                                    <p className="text-xs text-slate-400">
                                                        {habit.type === 'start' ? 'À faire' : 'À éviter'}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={handleConfirm}
                                    className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    Valider mon engagement ({selectedSignalIds.length} signal{selectedSignalIds.length > 1 ? 'x' : ''})
                                </button>
                            </>
                        )}
                    </motion.div>
                )}

                {step === 'confirm' && (
                    <motion.div
                        key="confirm"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div className="text-center py-8 bg-indigo-50 border border-indigo-200 rounded-xl">
                            <span className="text-5xl block mb-4">⚡</span>
                            <h3 className="text-xl font-bold text-indigo-800 mb-2">
                                Alignement du jour activé !
                            </h3>
                            <p className="text-indigo-600 text-sm">
                                Le Tribunal de la Vie observe.
                            </p>
                            <p className="text-indigo-500 text-xs mt-3">
                                Reviens ce soir pour faire le point sur tes preuves.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MorningIntentionComponent;