import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { DEFAULT_EXPERIMENT_METRICS } from '@/types';

interface Props {
    onCreated: () => void;
}

/**
 * ExperimentForm — Création d'une nouvelle expérience.
 */
const ExperimentForm: React.FC<Props> = ({ onCreated }) => {
    const createExperiment = useAppStore((s) => s.createExperiment);
    const desires = useAppStore((s) => s.desires);

    const [title, setTitle] = useState('');
    const [hypothesis, setHypothesis] = useState('');
    const [desireId, setDesireId] = useState<number | ''>('');
    const [selectedMetrics, setSelectedMetrics] = useState<string[]>(
        DEFAULT_EXPERIMENT_METRICS.map((m) => m.key)
    );
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const toggleMetric = (key: string) => {
        setSelectedMetrics((prev) =>
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) { setError('Donne un nom à ton expérience'); return; }
        if (selectedMetrics.length === 0) { setError('Choisis au moins une métrique'); return; }
        if (selectedMetrics.length < 3) { setError('Choisis au moins 3 métriques pour des données significatives'); return; }

        setSubmitting(true);
        setError('');

        try {
            const today = new Date();
            const startDate = today.toISOString().slice(0, 10);
            const endDate = new Date(today);
            endDate.setDate(endDate.getDate() + 6);
            const endDateStr = endDate.toISOString().slice(0, 10);

            await createExperiment({
                title: title.trim(),
                hypothesis: hypothesis.trim(),
                desireId: desireId || undefined,
                metrics: selectedMetrics,
                startDate,
                endDate: endDateStr,
            });

            setTitle('');
            setHypothesis('');
            onCreated();
        } catch (err) {
            setError('Erreur lors de la création. Réessaie.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <h3 className="text-lg font-semibold text-slate-800 mb-1">Nouvelle expérience</h3>
            <p className="text-xs text-slate-500 mb-4">7 jours pour tester une hypothèse sur toi-même.</p>

            <div className="space-y-4">
                {/* Titre */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Titre de l'expérience</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ex: Méditation matinale 10min"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                    />
                </div>

                {/* Hypothèse */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Hypothèse</label>
                    <input
                        type="text"
                        value={hypothesis}
                        onChange={(e) => setHypothesis(e.target.value)}
                        placeholder="Si je fais X, alors Y va s'améliorer"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Optionnel mais recommandé — ça donne du sens à l'expérience.</p>
                </div>

                {/* Lien désir */}
                {desires.length > 0 && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Désir lié (optionnel)</label>
                        <select
                            value={desireId}
                            onChange={(e) => setDesireId(e.target.value ? Number(e.target.value) : '')}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none bg-white"
                        >
                            <option value="">— Aucun —</option>
                            {desires.map((d) => (
                                <option key={d.id} value={d.id}>{d.title}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Métriques */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Métriques à tracker</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {DEFAULT_EXPERIMENT_METRICS.map((m) => {
                            const isSelected = selectedMetrics.includes(m.key);
                            return (
                                <button
                                    key={m.key}
                                    type="button"
                                    onClick={() => toggleMetric(m.key)}
                                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition ${isSelected
                                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                                        : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-200'
                                    }`}
                                >
                                    <span>{m.icon}</span>
                                    <span className="font-medium">{m.label}</span>
                                </button>
                            );
                        })}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Chaque jour, tu noteras ces métriques de 1 à 10.</p>
                </div>

                {error && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-red-500">{error}</motion.p>
                )}

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm hover:from-indigo-600 hover:to-purple-700 transition disabled:opacity-50"
                >
                    {submitting ? 'Création...' : '🔬 Lancer l\'expérience'}
                </button>
            </div>
        </form>
    );
};

export default ExperimentForm;
