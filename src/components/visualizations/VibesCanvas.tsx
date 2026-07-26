import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useVibesData } from './useVibesData';
import UniverseMode from './UniverseMode';
import TribunalMode from './TribunalMode';
import WeatherMode from './WeatherMode';
import MomentumMode from './MomentumMode';
import FutureSelfMode from './FutureSelfMode';
import IdentityDNAMode from './IdentityDNAMode';

type VizMode = 'universe' | 'tribunal' | 'weather' | 'momentum' | 'futureSelf' | 'identityDNA';

const MODE_CONFIG: { key: VizMode; emoji: string; label: string; description: string }[] = [
  { key: 'universe', emoji: '🌌', label: 'Constellation', description: 'Désir → Identités → Signaux → Preuves' },
  { key: 'tribunal', emoji: '⚖️', label: 'Tribunal', description: 'Témoins vs Accusateurs → Crédibilité' },
  { key: 'weather', emoji: '🌦️', label: 'Météo', description: 'État émotionnel et tendance vibratoire' },
  { key: 'momentum', emoji: '🌊', label: 'Momentum', description: 'Élan comportemental et streaks' },
  { key: 'futureSelf', emoji: '👤', label: 'Future Self', description: 'Distance actuel → identité désirée' },
  { key: 'identityDNA', emoji: '🧬', label: 'ADN', description: 'Composition du génome identitaire' },
];

/**
 * VibesCanvas — Hub central de Vibes World.
 * Affiche 6 perspectives visuelles des mêmes données.
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
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌌</span>
            <h2 className="text-2xl font-bold text-gradient">Vibes World</h2>
          </div>
          <p className="text-sm text-slate-500 mt-1">Visualise les preuves que tu construis vers la personne que tu veux devenir.</p>
        </div>
      </div>

      {/* Sélecteur de désir + mode combiné en barre scrollable */}
      <div className="flex flex-col gap-2 mb-4">
        {/* Sélecteur de désir */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {data.desires.map((desire) => {
            const isActive = desire.id === selectedDesire?.id;
            return (
              <button
                key={desire.id}
                onClick={() => setSelectedDesireId(desire.id)}
                className={`shrink-0 px-3 py-2 rounded-xl text-sm transition border ${isActive ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-200'}`}
              >
                <span className="font-medium">{desire.title}</span>
                <span className="ml-2 text-[10px] opacity-60">{desire.evidenceCount} preuves</span>
              </button>
            );
          })}
        </div>

        {/* Sélecteur de mode — badges cliquables */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {MODE_CONFIG.map((cfg) => (
            <button
              key={cfg.key}
              onClick={() => setMode(cfg.key)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition border ${mode === cfg.key
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white/70 text-slate-500 border-slate-200 hover:border-indigo-200 hover:text-slate-700'
              }`}
              title={cfg.description}
            >
              <span className="mr-1">{cfg.emoji}</span>
              {cfg.label}
            </button>
          ))}
        </div>
      </div>

      {/* Panneau de visualisation */}
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
              {mode === 'universe' && <UniverseMode desire={selectedDesire} />}
              {mode === 'tribunal' && <TribunalMode desire={selectedDesire} />}
              {mode === 'weather' && <WeatherMode desire={selectedDesire} />}
              {mode === 'momentum' && <MomentumMode desire={selectedDesire} />}
              {mode === 'futureSelf' && <FutureSelfMode desire={selectedDesire} />}
              {mode === 'identityDNA' && <IdentityDNAMode desire={selectedDesire} />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Légende de mode */}
      <p className="text-[11px] text-slate-400 mt-3 text-center">
        {MODE_CONFIG.find((c) => c.key === mode)?.description ?? ''}
      </p>
    </div>
  );
};

export default VibesCanvas;
