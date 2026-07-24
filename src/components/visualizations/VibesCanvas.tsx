import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useVibesData } from './useVibesData';
import UniverseMode from './UniverseMode';
import TribunalMode from './TribunalMode';

type VizMode = 'universe' | 'tribunal';

/**
 * Central shell for Vibes World.
 * The shell owns selection and mode; visual modes consume the same aggregated data.
 */
const VibesCanvas: React.FC = () => {
    const data = useVibesData();
    const [mode, setMode] = useState<VizMode>('universe');
    const [selectedDesireId, setSelectedDesireId] = useState<number | null>(data.desires[0]?.id ?? null);

    useEffect(() => {
        if (!data.desires.some((desire) => desire.id === selectedDesireId)) {
            setSelectedDesireId(data.desires[0]?.id ?? null);
        }
    }, [data.desires, selectedDesireId]);

    const selectedDesire = data.desires.find((desire) => desire.id === selectedDesireId) ?? data.desires[0] ?? null;

    if (data.desires.length === 0) {
        return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16 px-4">
                <motion.div className="text-5xl mb-3" animate={{ scale: [1, 1.08, 1], rotate: [0, 3, -3, 0] }} transition={{ duration: 4, repeat: Infinity }}>🌌</motion.div>
                <h2 className="text-xl font-semibold text-slate-800 mb-2">Vibes World</h2>
                <p className="text-slate-500 max-w-sm mx-auto">
                    Crée un Désir pour faire naître ta première constellation. Chaque action construira visuellement la personne que tu deviens.
                </p>
            </motion.div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-5">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🌌</span>
                        <h2 className="text-2xl font-bold text-gradient">Vibes World</h2>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">Visualise les preuves que tu construis vers la personne que tu veux devenir.</p>
                </div>

                <div className="flex gap-1 p-1 rounded-xl bg-slate-100/80 border border-slate-200 w-fit">
                    {([
                        ['universe', '🌌 Constellation'],
                        ['tribunal', '⚖️ Tribunal'],
                    ] as const).map(([value, label]) => (
                        <button
                            key={value}
                            onClick={() => setMode(value)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${mode === value ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
                {data.desires.map((desire) => {
                    const isActive = desire.id === selectedDesire?.id;
                    const evidence = (desire as typeof desire & { evidenceCount?: number }).evidenceCount ?? 0;
                    return (
                        <button
                            key={desire.id}
                            onClick={() => setSelectedDesireId(desire.id)}
                            className={`shrink-0 px-3 py-2 rounded-xl text-sm transition border ${isActive ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-200'}`}
                        >
                            <span className="font-medium">{desire.title}</span>
                            <span className="ml-2 text-[10px] opacity-60">{evidence} preuves</span>
                        </button>
                    );
                })}
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-b from-white via-indigo-50/20 to-purple-50/30 shadow-sm">
                <div className="absolute inset-0 pointer-events-none opacity-40" style={{ backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(99,102,241,.10), transparent 35%)' }} />
                <AnimatePresence mode="wait">
                    {selectedDesire && (
                        <motion.div
                            key={`${selectedDesire.id}-${mode}`}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                            className="relative p-4 sm:p-6"
                        >
                            {mode === 'universe' ? <UniverseMode desire={selectedDesire} /> : <TribunalMode desire={selectedDesire} />}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default VibesCanvas;
