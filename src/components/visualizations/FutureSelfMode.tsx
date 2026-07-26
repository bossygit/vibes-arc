import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { VizDesireNode, Desire } from '@/types';

interface IdentityDimension {
  label: string;
  current: number;  // 0-100
  target: number;   // 0-100
  color: string;
}

/**
 * FutureSelfMode — Distance entre l'état actuel et l'identité désirée.
 * Utilise les données de motivation (reasons, futureSelf, whatAtStake)
 * et les statistiques de complétion pour jauger l'écart.
 */
const FutureSelfMode: React.FC<{ desire: VizDesireNode }> = ({ desire }) => {
  const desiresList = useAppStore((s) => s.desires);
  const fullDesire: Desire | undefined = useMemo(
    () => desiresList.find((d) => d.id === desire.id),
    [desiresList, desire.id]
  );

  const identityNames = desire.identityNodes.map((n) => n.name);

  // Dimensions de progression
  const dimensions: IdentityDimension[] = useMemo(() => {
    const dims: IdentityDimension[] = [];

    // Pour chaque identité, on a une dimension
    desire.identityNodes.forEach((node) => {
      dims.push({
        label: node.name,
        current: node.consistency,
        target: 80, // objectif : 80% de complétion
        color: node.color,
      });
    });

    // Preuves accumulées (evidence count vs cible)
    const totalHabits = desire.identityNodes.reduce((s, n) => s + n.totalSignals, 0);
    const evidenceScore = totalHabits > 0
      ? Math.min(100, Math.round((desire.evidenceCount / (totalHabits * 30)) * 100))
      : 0;

    dims.push({
      label: 'Preuves accumulées',
      current: evidenceScore,
      target: 70,
      color: '#6366f1',
    });

    // Si le désir a une description ou un target, on peut estimer
    if (fullDesire?.target) {
      dims.push({
        label: fullDesire.type === 'avoir' ? 'Progression cible' : 'Transformation',
        current: evidenceScore,
        target: 80,
        color: '#8b5cf6',
      });
    }

    return dims;
  }, [desire, fullDesire]);

  // Score global de transformation
  const overallScore = useMemo(() => {
    if (dimensions.length === 0) return 0;
    const avg = dimensions.reduce((s, d) => s + Math.min(100, d.current / Math.max(1, d.target) * 100), 0) / dimensions.length;
    return Math.round(avg);
  }, [dimensions]);

  const futureSelfText = fullDesire?.motivation?.futureSelf ?? '';

  return (
    <div className="flex flex-col items-center">
      <div className="w-full flex items-start justify-between gap-4 mb-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Future Self</h3>
          <p className="text-xs text-slate-500 mt-1">La distance entre qui tu es et qui tu deviens.</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg font-bold text-indigo-600">{overallScore}%</div>
          <div className="text-[10px] text-slate-400">transformation</div>
        </div>
      </div>

      {/* Jauge globale */}
      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-4 relative">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-violet-400 via-indigo-500 to-purple-600"
          initial={{ width: 0 }}
          animate={{ width: `${overallScore}%` }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white drop-shadow-sm">
          {overallScore}% vers la personne que tu veux devenir
        </div>
      </div>

      {/* Dimensions de transformation */}
      <div className="w-full space-y-3 mb-3">
        {dimensions.map((dim, i) => {
          const gap = Math.max(0, dim.target - dim.current);
          return (
            <motion.div
              key={dim.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
              className="rounded-xl bg-white/60 border border-slate-200 p-3"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-slate-700">{dim.label}</span>
                <span className="text-xs text-slate-400">
                  <span className="font-semibold" style={{ color: dim.color }}>{dim.current}%</span>
                  {' / '}{dim.target}% objectif
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden relative">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: dim.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${dim.current}%` }}
                  transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }}
                />
                {/* Marqueur de la cible */}
                <div
                  className="absolute top-0 w-0.5 h-full bg-slate-800/40"
                  style={{ left: `${dim.target}%` }}
                />
              </div>
              {gap > 0 && (
                <div className="text-[10px] text-slate-400 mt-1">
                  Il reste {gap}% pour atteindre la cible
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Future Self Statement */}
      {futureSelfText && (
        <div className="w-full rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 p-4">
          <div className="text-xs font-semibold text-violet-700 mb-1">🧿 La personne que tu deviens</div>
          <p className="text-sm text-violet-900/80 italic">"{futureSelfText}"</p>
        </div>
      )}

      {!futureSelfText && identityNames.length > 0 && (
        <div className="w-full rounded-xl bg-white/60 border border-slate-200 p-3 text-center text-xs text-slate-500">
          <span className="block text-base mb-1">👤</span>
          Tu deviens : <strong>{identityNames.join(', ')}</strong>
          <span className="block text-[10px] text-slate-400 mt-1">
            Ajoute une vision Future Self dans le moteur de motivation pour enrichir cette vue.
          </span>
        </div>
      )}
    </div>
  );
};

export default FutureSelfMode;
