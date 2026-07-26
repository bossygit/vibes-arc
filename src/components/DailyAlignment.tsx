import React, { useState, useEffect, useCallback } from 'react';
import { DailyAlignmentEntry, AlignmentPhase } from '@/types';
import {
    hasMorningAlignmentToday,
    hasEveningAlignmentToday,
    getDefaultPhase,
} from '@/utils/dailyAlignment';
import MorningIntentionComponent from './MorningIntention';
import EveningEvidenceComponent from './EveningEvidence';
import SupabaseDatabaseClient from '@/database/supabase-client';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

const DailyAlignment: React.FC = () => {

    const [loading, setLoading] = useState(true);
    const [entry, setEntry] = useState<DailyAlignmentEntry | null>(null);
    const [phase, setPhase] = useState<AlignmentPhase>(getDefaultPhase(null));

    const db = SupabaseDatabaseClient.getInstance();

    // Charger l'entrée du jour
    const loadToday = useCallback(async () => {
        try {
            const todayEntry = await db.getTodayAlignment();
            setEntry(todayEntry);
            setPhase(getDefaultPhase(todayEntry));
        } catch {
            setEntry(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadToday();
    }, [loadToday]);

    // Handler matin
    const handleSaveMorning = async (
        desireId: number,
        desireTitle: string,
        intention: string,
        signalIds: number[]
    ) => {
        try {
            await db.saveMorningIntention({
                desireId,
                desireTitle,
                intention,
                signalIds,
                createdAt: new Date().toISOString(),
            });
            // Recharger pour avoir la dernière entrée
            await loadToday();
        } catch (e) {
            console.error('Erreur sauvegarde morning intention:', e);
        }
    };

    // Handler soir
    const handleSaveEvening = async (evidence: {
        signalsCompleted: number;
        signalsTotal: number;
        moodScore: number;
        moodNote: string;
        evidenceStatement: string;
    }) => {
        try {
            await db.saveEveningEvidence({
                ...evidence,
                createdAt: new Date().toISOString(),
            });
            await loadToday();
        } catch (e) {
            console.error('Erreur sauvegarde evening evidence:', e);
        }
    };

    if (loading) {
        return (
            <div className="max-w-lg mx-auto text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4" />
                <p className="text-slate-500 text-sm">Chargement de ton alignement du jour...</p>
            </div>
        );
    }

    const hasMorning = hasMorningAlignmentToday(entry);
    const hasEvening = hasEveningAlignmentToday(entry);

    // Si les deux sont faits, afficher le state complet
    if (hasMorning && hasEvening) {
        return (
            <div className="max-w-lg mx-auto">
                <div className="text-center py-10">
                    <span className="text-5xl block mb-4">✅</span>
                    <h2 className="text-2xl font-bold text-slate-800 mb-3">
                        Alignement du jour complet
                    </h2>
                    <p className="text-slate-500 text-sm mb-6">
                        Tu as défini ton intention ce matin et enregistré tes preuves ce soir.
                        Le Tribunal de la Vie a tout enregistré.
                    </p>

                    {/* Résumé */}
                    {entry!.morning && entry!.evening && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white border border-slate-200 rounded-xl p-5 text-left max-w-md mx-auto"
                        >
                            <div className="mb-4">
                                <p className="text-xs text-slate-400 uppercase tracking-wide">Intention</p>
                                <p className="text-sm text-slate-700 italic mt-1">"{entry!.morning.intention}"</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wide">Preuves</p>
                                <p className="text-sm text-slate-700 italic mt-1">"{entry!.evening.evidenceStatement}"</p>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-xs text-slate-400">
                                <span>Signaux: {entry!.evening.signalsCompleted}/{entry!.evening.signalsTotal}</span>
                                <span>Mood: {entry!.evening.moodScore}/10</span>
                            </div>
                        </motion.div>
                    )}

                    <p className="text-slate-400 text-xs mt-6">
                        Reviens demain matin pour une nouvelle intention.
                    </p>
                </div>
            </div>
        );
    }

    // Phase toggle : matin / soir
    return (
        <div className="max-w-lg mx-auto">
            {/* Phase selector */}
            <div className="flex rounded-xl overflow-hidden border border-slate-200 mb-8">
                <button
                    onClick={() => setPhase('morning')}
                    disabled={hasMorning && !hasEvening}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium transition ${
                        phase === 'morning'
                            ? 'bg-indigo-600 text-white'
                            : hasMorning && !hasEvening
                                ? 'bg-amber-50 text-amber-600'
                                : 'bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                >
                    <Sun className="w-4 h-4" />
                    <span className="hidden sm:inline">Morning</span> Intention
                    {hasMorning && <span className="text-xs ml-1">✓</span>}
                </button>
                <button
                    onClick={() => setPhase('evening')}
                    disabled={!hasMorning}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium transition ${
                        phase === 'evening'
                            ? 'bg-indigo-600 text-white'
                            : !hasMorning
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                >
                    <Moon className="w-4 h-4" />
                    <span className="hidden sm:inline">Evening</span> Preuves
                    {hasEvening && <span className="text-xs ml-1">✓</span>}
                </button>
            </div>

            {/* Morning */}
            {phase === 'morning' && !hasMorning && (
                <MorningIntentionComponent onSave={handleSaveMorning} />
            )}

            {phase === 'morning' && hasMorning && (
                <div className="text-center py-8 bg-amber-50 border border-amber-200 rounded-xl">
                    <Sun className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-amber-800 mb-2">
                        Ton intention est enregistrée
                    </h3>
                    <p className="text-amber-600 text-sm mb-2">
                        "{entry?.morning?.intention}"
                    </p>
                    <button
                        onClick={() => setPhase('evening')}
                        className="mt-4 px-5 py-2 rounded-xl bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition"
                    >
                        Aller aux preuves du jour
                    </button>
                </div>
            )}

            {/* Evening */}
            {phase === 'evening' && hasMorning && !hasEvening && (
                <EveningEvidenceComponent
                    morningIntention={entry!.morning!}
                    onSave={handleSaveEvening}
                    done={false}
                />
            )}

            {phase === 'evening' && hasEvening && (
                <EveningEvidenceComponent
                    morningIntention={entry!.morning!}
                    onSave={handleSaveEvening}
                    done={true}
                />
            )}

            {phase === 'evening' && !hasMorning && (
                <div className="text-center py-8 bg-slate-50 border border-slate-200 rounded-xl">
                    <Sun className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-600 text-sm mb-1">
                        Tu n'as pas encore défini ton intention aujourd'hui.
                    </p>
                    <button
                        onClick={() => setPhase('morning')}
                        className="mt-3 px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition"
                    >
                        Définir mon intention
                    </button>
                </div>
            )}
        </div>
    );
};

export default DailyAlignment;