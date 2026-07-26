import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { LifeExperiment, DEFAULT_EXPERIMENT_METRICS, getMetricDef } from '@/types';
import { getExperimentDay } from '@/utils/experimentUtils';

interface Props {
    experiment: LifeExperiment;
    checkedIn: boolean;
}

/**
 * ExperimentTracker — Check-in quotidien pendant une expérience active.
 * L'utilisateur note chaque métrique de 1 à 10.
 */
const ExperimentTracker: React.FC<Props> = ({ experiment, checkedIn }) => {
    const recordExperimentDay = useAppStore((s) => s.recordExperimentDay);
    const completeExperiment = useAppStore((s) => s.completeExperiment);

    const day = getExperimentDay(experiment);
    const [values, setValues] = useState<Record<string, number>>({});
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [done, setDone] = useState(checkedIn);
    const [showConclusion, setShowConclusion] = useState(false);
    const [conclusion, setConclusion] = useState('');

    // Initialiser les valeurs par défaut (5 = milieu)
    const metrics = experiment.metrics ?? DEFAULT_EXPERIMENT_METRICS.map((m) => m.key);
    if (Object.keys(values).length === 0 && !done) {
        const defaults: Record<string, number> = {};
        metrics.forEach((m) => { defaults[m] = 5; });
        if (Object.keys(values).length === 0) {
            // On utilise un state local pour éviter de réinitialiser
        }
    }

    const handleSubmit = async () => {
        if (done) return;
        setSaving(true);
        try {
            const today = new Date().toISOString().slice(0, 10);
            await recordExperimentDay(experiment.id, {
                date: today,
                values,
                notes: notes.trim() || undefined,
            });

            // Si c'était le dernier jour, proposer la conclusion
            if (day >= 7) {
                setShowConclusion(true);
            } else {
                setDone(true);
            }
        } catch (err) {
            console.error('Erreur enregistrement:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleComplete = async () => {
        setSaving(true);
        try {
            await completeExperiment(experiment.id, conclusion.trim());
            setDone(true);
        } catch (err) {
            console.error('Erreur complétion:', err);
        } finally {
            setSaving(false);
        }
    };

    if (done && !showConclusion) {
        return (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-center"
            >
                <p className="text-sm font-semibold text-emerald-700">✅ Check-in enregistré pour aujourd'hui</p>
                <p className="text-xs text-emerald-600 mt-1">Reviens demain pour le jour {day + 1}/7.</p>
            </motion.div>
        );
    }

    if (showConclusion) {
        return (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-violet-50 border border-violet-200 p-3"
            >
                <p className="text-sm font-semibold text-violet-700 mb-2">🎉 Expérience terminée !</p>
                <p className="text-xs text-violet-600 mb-3">Qu'as-tu appris ? Quelle est ta conclusion ?</p>
                <textarea
                    value={conclusion}
                    onChange={(e) => setConclusion(e.target.value)}
                    placeholder="Ex: L'hypothèse est validée — méditer 10min augmente mon énergie de 2 points..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-violet-200 text-sm focus:ring-2 focus:ring-violet-200 outline-none resize-none"
                />
                <div className="flex gap-2 mt-2">
                    <button
                        onClick={handleComplete}
                        disabled={saving}
                        className="flex-1 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition disabled:opacity-50"
                    >
                        {saving ? 'Enregistrement...' : '✅ Terminer l\'expérience'}
                    </button>
                    <button
                        onClick={() => setDone(true)}
                        className="px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-white transition"
                    >
                        Plus tard
                    </button>
                </div>
            </motion.div>
        );
    }

    const initValues: Record<string, number> = {};
    metrics.forEach((m) => { initValues[m] = 5; });
    const currentValues = Object.keys(values).length > 0 ? values : initValues;

    return (
        <div className="rounded-xl bg-white/90 border border-slate-200 p-3">
            <p className="text-sm font-semibold text-slate-700 mb-3">📊 Jour {day} — Comment ça va ?</p>

            <div className="space-y-3">
                {metrics.map((metricKey) => {
                    const def = getMetricDef(metricKey);
                    const val = currentValues[metricKey] ?? 5;
                    const colors = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-lime-500', 'bg-green-500', 'bg-emerald-500'];
                    const colorIdx = Math.min(colors.length - 1, Math.floor((val - 1) / 2));
                    return (
                        <div key={metricKey}>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-slate-600">
                                    {def.icon} {def.label}
                                </span>
                                <span className="text-xs font-semibold" style={{ color: val >= 7 ? '#10b981' : val >= 4 ? '#f59e0b' : '#ef4444' }}>
                                    {val}/10
                                </span>
                            </div>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                                    <button
                                        key={n}
                                        type="button"
                                        onClick={() => setValues((prev) => ({ ...prev, [metricKey]: n }))}
                                        className={`flex-1 h-6 rounded text-[9px] font-bold transition ${val === n
                                            ? `${colors[colorIdx]} text-white shadow-sm scale-110`
                                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                        }`}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes du jour (optionnel) — qu'est-ce qui a influencé ta journée ?"
                rows={2}
                className="w-full mt-3 px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-200 outline-none resize-none"
            />

            <button
                onClick={handleSubmit}
                disabled={saving}
                className="w-full mt-3 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold hover:from-indigo-600 hover:to-purple-700 transition disabled:opacity-50"
            >
                {saving ? 'Enregistrement...' : day >= 7 ? '📦 Dernier jour ! Enregistrer' : '✅ Enregistrer aujourd\'hui'}
            </button>
        </div>
    );
};

export default ExperimentTracker;
