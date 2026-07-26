import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { VizDesireNode } from '@/types';

/**
 * IdentityDNAMode — Composition de l'identité comme un génome.
 * Chaque identité est un chromosome, chaque signal est un gène.
 * Montre la proportion de chaque identité dans le désir.
 */
const IdentityDNAMode: React.FC<{ desire: VizDesireNode }> = ({ desire }) => {
  const totalIdentitySignals = desire.identityNodes.reduce((s, n) => s + n.totalSignals, 0);
  const totalEvidence = desire.identityNodes.reduce((s, n) => s + n.evidenceCount, 0);

  // Distribution ADN
  const segments = useMemo(() => {
    return desire.identityNodes.map((node) => {
      const pct = totalIdentitySignals > 0 ? Math.round((node.totalSignals / totalIdentitySignals) * 100) : 0;
      const activation = node.totalSignals > 0 ? Math.round((node.completedSignals / node.totalSignals) * 100) : 0;
      return { ...node, pct, activation };
    });
  }, [desire, totalIdentitySignals]);

  // État global du génome
  const genomeCompletion = totalIdentitySignals > 0
    ? Math.round((totalEvidence / (totalIdentitySignals * 30)) * 100)
    : 0;

  const SEGMENT_W = 160;
  const SEGMENT_H = 180;
  const GENE_R = 4;

  if (segments.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <div className="text-4xl mb-3">🧬</div>
        <p>Aucune identité liée à ce désir.</p>
        <p className="text-xs mt-1">Ajoute des identités pour composer ton génome vibratoire.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="w-full flex items-start justify-between gap-4 mb-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">ADN Identitaire</h3>
          <p className="text-xs text-slate-500 mt-1">La composition génétique de la personne que tu deviens.</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg font-bold text-indigo-600">{genomeCompletion}%</div>
          <div className="text-[10px] text-slate-400">génome exprimé</div>
        </div>
      </div>

      {/* Barre de distribution des identités */}
      <div className="w-full h-5 rounded-full overflow-hidden flex mb-4">
        {segments.map((seg) => (
          <motion.div
            key={seg.id}
            className="h-full first:rounded-l-full last:rounded-r-full relative"
            style={{ backgroundColor: seg.color, width: `${seg.pct}%` }}
            initial={{ width: 0 }}
            animate={{ width: `${seg.pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white drop-shadow-sm overflow-hidden whitespace-nowrap">
              {seg.pct > 15 ? seg.name : ''}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Chromosomes SVG — un par identité */}
      <div className="w-full overflow-x-auto pb-2">
        <div className="flex gap-3" style={{ minWidth: segments.length * (SEGMENT_W + 12) }}>
          {segments.map((seg, i) => {
            const activatedCount = Math.min(seg.completedSignals, 8);
            const totalGenes = Math.min(seg.totalSignals, 8);
            const helixY = 40;
            const helixAmplitude = 12;

            return (
              <motion.div
                key={seg.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="rounded-xl bg-white/60 border border-slate-200 shrink-0"
                style={{ width: SEGMENT_W }}
              >
                {/* En-tête du chromosome */}
                <div className="p-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }} />
                    <span className="text-sm font-semibold text-slate-700 truncate">{seg.name}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>{seg.activation}% activation</span>
                    <span>{seg.pct}% de l'ADN</span>
                  </div>
                </div>

                {/* Hélice SVG (gènes actifs vs inactifs) */}
                <svg width={SEGMENT_W} height={SEGMENT_H} className="w-full">
                  {Array.from({ length: totalGenes }).map((_, g) => {
                    const t = (g / Math.max(totalGenes - 1, 1));
                    const x = 20 + t * (SEGMENT_W - 40);
                    const y1 = helixY + helixAmplitude * Math.sin(t * Math.PI * 4 + 0.3);
                    const y2 = helixY - helixAmplitude * Math.sin(t * Math.PI * 4 + 0.3);
                    const isActive = g < activatedCount;

                    // Connexion entre les deux brins
                    return (
                      <g key={g}>
                        <line
                          x1={x} y1={y1} x2={x} y2={y2}
                          stroke={seg.color}
                          strokeOpacity={isActive ? 0.5 : 0.12}
                          strokeWidth={1}
                        />
                        <motion.circle
                          cx={x} cy={y1} r={GENE_R}
                          fill={isActive ? seg.color : '#e2e8f0'}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: g * 0.05, duration: 0.3 }}
                        />
                        <motion.circle
                          cx={x} cy={y2} r={GENE_R}
                          fill={isActive ? seg.color : '#e2e8f0'}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: g * 0.05 + 0.1, duration: 0.3 }}
                        />
                      </g>
                    );
                  })}
                  {/* Légende */}
                  <text x={SEGMENT_W / 2} y={helixY + 50} textAnchor="middle" className="fill-slate-400 text-[8px]">
                    gènes
                  </text>
                </svg>

                {/* Stats au bas du chromosome */}
                <div className="p-3 border-t border-slate-100">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500">Gènes activés</span>
                    <span className="font-semibold text-slate-700">{seg.completedSignals}/{seg.totalSignals}</span>
                  </div>
                  <div className="flex justify-between text-[10px] mt-1">
                    <span className="text-slate-500">Preuves</span>
                    <span className="font-semibold text-slate-700">{seg.evidenceCount}</span>
                  </div>
                  {/* Mini barre d'activation */}
                  <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: seg.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${seg.activation}%` }}
                      transition={{ duration: 1, delay: i * 0.15, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Composition globale */}
      <div className="w-full grid grid-cols-3 gap-2 text-center text-xs mt-1">
        <div className="rounded-xl bg-indigo-50 p-2">
          <strong className="block text-indigo-700">{segments.length}</strong>
          <span className="text-slate-500">identités</span>
        </div>
        <div className="rounded-xl bg-purple-50 p-2">
          <strong className="block text-purple-700">{totalIdentitySignals}</strong>
          <span className="text-slate-500">signaux totaux</span>
        </div>
        <div className="rounded-xl bg-fuchsia-50 p-2">
          <strong className="block text-fuchsia-700">{totalEvidence}</strong>
          <span className="text-slate-500">preuves totales</span>
        </div>
      </div>
    </div>
  );
};

export default IdentityDNAMode;
