import React, { useState } from 'react';
import { useVibesData } from './useVibesData';
import UniverseMode from './UniverseMode';
import TribunalMode from './TribunalMode';

type VizMode = 'universe' | 'tribunal';

/**
 * Conteneur central de la couche de visualisation immersive (Phase 1).
 * Reçoit les données agrégées du store et affiche un mode interchangeable.
 * Aucune nouvelle table, aucun nouveau store : lit useAppStore via useVibesData.
 */
const VibesCanvas: React.FC = () => {
    const data = useVibesData();
    const [mode, setMode] = useState<VizMode>('universe');
    const [selectedDesireId, setSelectedDesireId] = useState<number | null>(
        data.desires[0]?.id ?? null
    );

    const selectedDesire =
        data.desires.find((d) => d.id === selectedDesireId) ?? data.desires[0] ?? null;

    if (data.desires.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="text-5xl mb-3">🌌</div>
                <h2 className="text-xl font-semibold text-slate-800 mb-2">Vibes World</h2>
                <p className="text-slate-500 max-w-sm mx-auto">
                    Crée un Désir dans le Tribunal pour faire naître ta première constellation.
                    Chaque action construira visuellement la personne que tu deviens.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h2 className="text-xl font-bold text-gradient">Vibes World</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setMode('universe')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                            mode === 'universe' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                    >
                        🌌 Constellation
                    </button>
                    <button
                        onClick={() => setMode('tribunal')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                            mode === 'tribunal' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                    >
                        ⚖️ Tribunal
                    </button>
                </div>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
                {data.desires.map((d) => (
                    <button
                        key={d.id}
                        onClick={() => setSelectedDesireId(d.id)}
                        className={`px-3 py-1.5 rounded-full text-sm transition ${
                            d.id === selectedDesire?.id
                                ? 'bg-purple-100 border border-purple-300 text-purple-700 font-medium'
                                : 'bg-white border border-slate-200 text-slate-600'
                        }`}
                    >
                        {d.title}
                    </button>
                ))}
            </div>

            <div className="bg-white/70 backdrop-blur rounded-2xl border border-slate-200 p-5 shadow-sm">
                {selectedDesire &&
                    (mode === 'universe' ? (
                        <UniverseMode desire={selectedDesire} />
                    ) : (
                        <TribunalMode desire={selectedDesire} />
                    ))}
            </div>
        </div>
    );
};

export default VibesCanvas;
