import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { getEveningSignalSummary, generateEveningStatement } from '@/utils/dailyAlignment';
import { getCurrentDayIndex } from '@/utils/habitUtils';
import { motion } from 'framer-motion';
import { Moon, Check, Star, ArrowRight } from 'lucide-react';

interface Props {
    morningIntention: {
        desireId: number;
        desireTitle: string;
        intention: string;
        signalIds: number[];
    };
    onSave: (evidence: {
        signalsCompleted: number;
        signalsTotal: number;
        moodScore: number;
        moodNote: string;
        evidenceStatement: string;
    }) => void;
    done: boolean;
}

const MOOD_OPTIONS = [
    { score: 3, emoji: '😞', label: 'Lourd', color: 'text-red-500' },
    { score: 5, emoji: '😐', label: 'Neutre', color: 'text-amber-500' },
    { score: 7, emoji: '🙂', label: 'Plutôt bien', color: 'text-emerald-500' },
    { score: 9, emoji: '😊', label: 'Aligné', color: 'text-indigo-500' },
    { score: 10, emoji: '✨', label: 'Vibrant', color: 'text-purple-500' },
];

const EveningEvidenceComponent: React.FC<Props> = ({ morningIntention, onSave, done }) => {
    const { habits } = useAppStore();
    const todayIdx = getCurrentDayIndex();

    const [step, setStep] = useState<'review' | 'mood' | 'statement' | 'confirm'>('review');
    const [moodScore, setMoodScore] = useState(7);
    const [moodNote, setMoodNote] = useState('');

    const signalSummary = useMemo(
        () => getEveningSignalSummary(morningIntention.signalIds, habits, todayIdx),
        [morningIntention.signalIds, habits, todayIdx]
    );

    const evidenceStatement = useMemo(
        () =>
            generateEveningStatement(
                signalSummary.completed,
                signalSummary.total,
                signalSummary.completedNames,
                morningIntention.desireTitle
            ),
        [signalSummary, morningIntention.desireTitle]
    );

    const handleSave = () => {
        onSave({
            signalsCompleted: signalSummary.completed,
            signalsTotal: signalSummary.total,
            moodScore,
            moodNote,
            evidenceStatement,
        });
        setStep('confirm');
    };

    if (done) {
        return (
            <div className="max-w-lg mx-auto text-center py-10">
                <span className="text-5xl block mb-4">🌙</span>
                <h3 className="text-xl font-bold text-indigo-800 mb-2">
                    Audience close pour aujourd'hui
                </h3>
                <p className="text-slate-500 text-sm">
                    Le Tribunal a enregistré tes preuves. Demain est une nouvelle journée d'alignement.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-lg mx-auto">
            {/* Morning intention recap */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6">
                <p className="text-xs text-indigo-400 uppercase tracking-wide mb-1">Intention du matin</p>
                <p className="text-sm text-indigo-800 font-medium italic">
                    "{morningIntention.intention}"
                </p>
            </div>

            {step === 'review' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="text-center mb-6">
                        <span className="inline-block text-4xl mb-3">🌙</span>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">
                            Qu'as-tu prouvé aujourd'hui ?
                        </h2>
                        <p className="text-slate-500 text-sm">
                            Voici tes {morningIntention.signalIds.length} signaux engagés ce matin.
                        </p>
                    </div>

                    {/* Signal status */}
                    <div className="mb-6">
                        {morningIntention.signalIds.map((signalId) => {
                            const habit = habits.find((h) => h.id === signalId);
                            const isCompleted = signalSummary.completedNames.includes(habit?.name ?? '');

                            return (
                                <div
                                    key={signalId}
                                    className={`flex items-center gap-3 p-3 rounded-lg mb-1 ${
                                        isCompleted
                                            ? 'bg-emerald-50 border border-emerald-200'
                                            : 'bg-slate-50 border border-slate-200'
                                    }`}
                                >
                                    <div
                                        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                                            isCompleted
                                                ? 'bg-emerald-200 text-emerald-700'
                                                : 'bg-slate-200 text-slate-500'
                                        }`}
                                    >
                                        {isCompleted ? (
                                            <Check className="w-3.5 h-3.5" />
                                        ) : (
                                            <span className="text-xs font-medium">—</span>
                                        )}
                                    </div>
                                    <span
                                        className={`text-sm ${
                                            isCompleted
                                                ? 'text-emerald-800 font-medium'
                                                : 'text-slate-500'
                                        }`}
                                    >
                                        {habit?.name ?? 'Signal supprimé'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Summary */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
                        <p className="text-sm text-slate-600 mb-1">
                            <span className="font-semibold">
                                {signalSummary.completed}/{signalSummary.total}
                            </span>{' '}
                            signaux honorés aujourd'hui
                            {signalSummary.completed === signalSummary.total && (
                                <span className="ml-2">🔥</span>
                            )}
                        </p>
                        {signalSummary.missedNames.length > 0 && (
                            <p className="text-xs text-slate-400">
                                Non honorés : {signalSummary.missedNames.join(', ')}
                            </p>
                        )}
                    </div>

                    <button
                        onClick={() => setStep('mood')}
                        className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                    >
                        <ArrowRight className="w-4 h-4" />
                        Continuer — Comment te sens-tu ?
                    </button>
                </motion.div>
            )}

            {step === 'mood' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex items-center gap-2 mb-6">
                        <button
                            onClick={() => setStep('review')}
                            className="text-slate-400 hover:text-slate-600 text-sm flex items-center gap-1"
                        >
                            ← Retour
                        </button>
                    </div>

                    <h3 className="text-lg font-semibold text-slate-800 mb-2">
                        Comment te sens-tu ce soir ?
                    </h3>
                    <p className="text-slate-500 text-sm mb-5">
                        C'est l'état vibratoire avec lequel tu fermes ta journée.
                    </p>

                    <div className="grid grid-cols-5 gap-2 mb-6">
                        {MOOD_OPTIONS.map((option) => (
                            <button
                                key={option.score}
                                onClick={() => setMoodScore(option.score)}
                                className={`p-3 rounded-xl border transition-all text-center ${
                                    moodScore === option.score
                                        ? 'border-indigo-400 bg-indigo-50 scale-105'
                                        : 'border-slate-200 bg-white hover:border-indigo-200'
                                }`}
                            >
                                <span className="text-2xl block mb-1">{option.emoji}</span>
                                <span className="text-xs font-medium text-slate-500">{option.label}</span>
                            </button>
                        ))}
                    </div>

                    <textarea
                        value={moodNote}
                        onChange={(e) => setMoodNote(e.target.value)}
                        className="w-full p-4 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none resize-none"
                        rows={2}
                        placeholder="Qu'est-ce qui a influencé ton état aujourd'hui ? (optionnel)"
                    />

                    <button
                        onClick={() => setStep('statement')}
                        className="mt-4 w-full py-3 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                    >
                        <ArrowRight className="w-4 h-4" />
                        Voir le résumé
                    </button>
                </motion.div>
            )}

            {step === 'statement' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="text-center mb-6">
                        <Star className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">
                            Ta preuve du jour
                        </h3>
                    </div>

                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 mb-6">
                        <p className="text-sm text-indigo-800 leading-relaxed italic">
                            "{evidenceStatement}"
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
                            <p className="text-2xl font-bold text-slate-800">{signalSummary.completed}/{signalSummary.total}</p>
                            <p className="text-xs text-slate-400">Signaux</p>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
                            <p className="text-2xl font-bold text-slate-800">
                                {MOOD_OPTIONS.find((m) => m.score === moodScore)?.emoji}
                            </p>
                            <p className="text-xs text-slate-400">Mood {moodScore}/10</p>
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                    >
                        <Star className="w-4 h-4" />
                        Envoyer au Tribunal
                    </button>
                </motion.div>
            )}

            {step === 'confirm' && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <div className="text-center py-8 bg-indigo-50 border border-indigo-200 rounded-xl">
                        <Moon className="w-10 h-10 text-indigo-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-indigo-800 mb-2">
                            Journal complété !
                        </h3>
                        <p className="text-indigo-600 text-sm">
                            Tes preuves sont enregistrées. Le Tribunal a reçu ton dossier du jour.
                        </p>
                        <p className="text-indigo-500 text-xs mt-3">
                            Reviens demain matin pour ta prochaine intention.
                        </p>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default EveningEvidenceComponent;