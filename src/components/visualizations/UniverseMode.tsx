import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { VizDesireNode, VizIdentityNode } from '@/types';

const CX = 200;
const CY = 200;
const IDENTITY_RADIUS = 132;
const SIGNAL_RADIUS = 38;

type EvidenceIdentity = VizIdentityNode & {
    evidenceCount?: number;
    consistency?: number;
};

/**
 * UniverseMode — first Vibes World visualization.
 * Desire = sun, identities = planets, signals = stars, evidence = moving light.
 */
const UniverseMode: React.FC<{ desire: VizDesireNode }> = ({ desire }) => {
    const [selectedIdentityId, setSelectedIdentityId] = useState<number | null>(null);
    const identities = desire.identityNodes as EvidenceIdentity[];
    const count = identities.length;
    const selectedIdentity = identities.find((identity) => identity.id === selectedIdentityId) ?? null;

    const totalSignals = identities.reduce((sum, identity) => sum + identity.totalSignals, 0);
    const completedSignals = identities.reduce((sum, identity) => sum + identity.completedSignals, 0);
    const evidenceCount = identities.reduce((sum, identity) => sum + (identity.evidenceCount ?? 0), 0);
    const completion = totalSignals ? Math.round((completedSignals / totalSignals) * 100) : 0;

    const particles = useMemo(() => {
        return identities.flatMap((identity, i) => {
            const angle = (2 * Math.PI * i) / Math.max(count, 1) - Math.PI / 2;
            const ix = CX + IDENTITY_RADIUS * Math.cos(angle);
            const iy = CY + IDENTITY_RADIUS * Math.sin(angle);
            const particleCount = Math.min(8, identity.evidenceCount ?? identity.completedSignals);

            return Array.from({ length: particleCount }).map((_, k) => ({
                id: `${identity.id}-evidence-${k}`,
                fromX: ix,
                fromY: iy,
                delay: (k * 0.42 + i * 0.27) % 4,
                duration: 2.4 + (k % 3) * 0.35,
                color: identity.color,
            }));
        });
    }, [identities, count]);

    if (count === 0) {
        return (
            <div className="text-center py-12 text-slate-500">
                <div className="text-4xl mb-3">🌌</div>
                <p>Aucune identité liée à ce désir.</p>
                <p className="text-xs mt-1">Ajoute une identité pour faire naître ta constellation.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center">
            <div className="w-full flex items-start justify-between gap-4 mb-2">
                <div>
                    <h3 className="text-lg font-semibold text-slate-800">Constellation du Désir</h3>
                    <p className="text-xs text-slate-500 mt-1">Tes preuves donnent progressivement de la lumière à ton désir.</p>
                </div>
                <div className="text-right shrink-0">
                    <div className="text-lg font-bold text-indigo-600">{completion}%</div>
                    <div className="text-[10px] text-slate-400">signaux activés</div>
                </div>
            </div>

            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-purple-500 to-fuchsia-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${completion}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                />
            </div>

            <svg viewBox="0 0 400 400" className="w-full max-w-lg select-none" role="img" aria-label={`Constellation du désir ${desire.title}`}>
                <defs>
                    <radialGradient id={`desireGlow-${desire.id}`} cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                        <stop offset="35%" stopColor="#c4b5fd" stopOpacity="0.95" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0.1" />
                    </radialGradient>
                    <filter id={`glow-${desire.id}`} x="-100%" y="-100%" width="300%" height="300%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>

                {/* orbital atmosphere */}
                <circle cx={CX} cy={CY} r={IDENTITY_RADIUS} fill="none" stroke="#c4b5fd" strokeOpacity={0.12} strokeDasharray="3 8" />
                <circle cx={CX} cy={CY} r={72} fill="none" stroke="#a5b4fc" strokeOpacity={0.08} />

                {/* desire */}
                <motion.circle
                    cx={CX}
                    cy={CY}
                    r={38}
                    fill={`url(#desireGlow-${desire.id})`}
                    filter={`url(#glow-${desire.id})`}
                    animate={{ r: [34, 40, 34], opacity: [0.82, 1, 0.82] }}
                    transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
                />
                <circle cx={CX} cy={CY} r={25} fill="#6366f1" opacity={0.9} />
                <text x={CX} y={CY - 2} textAnchor="middle" className="fill-white text-[9px] font-bold">DÉSIR</text>
                <text x={CX} y={CY + 12} textAnchor="middle" className="fill-white/80 text-[7px]">{evidenceCount} preuves</text>

                {identities.map((identity, i) => {
                    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
                    const ix = CX + IDENTITY_RADIUS * Math.cos(angle);
                    const iy = CY + IDENTITY_RADIUS * Math.sin(angle);
                    const isSelected = selectedIdentityId === identity.id;
                    const signals = Math.min(identity.totalSignals, 12);

                    return (
                        <g key={identity.id}>
                            <line x1={CX} y1={CY} x2={ix} y2={iy} stroke={identity.color} strokeOpacity={isSelected ? 0.6 : 0.2} strokeWidth={isSelected ? 2 : 1.2} />

                            {Array.from({ length: signals }).map((_, s) => {
                                const spread = 0.18;
                                const sa = angle + (s - (signals - 1) / 2) * spread;
                                const sx = ix + SIGNAL_RADIUS * Math.cos(sa);
                                const sy = iy + SIGNAL_RADIUS * Math.sin(sa);
                                const completed = s < identity.completedSignals;
                                return (
                                    <motion.circle
                                        key={s}
                                        cx={sx}
                                        cy={sy}
                                        r={completed ? 4 : 3}
                                        fill={completed ? '#fff' : identity.color}
                                        opacity={completed ? 1 : 0.25}
                                        animate={completed ? { opacity: [0.65, 1, 0.65] } : undefined}
                                        transition={{ duration: 2 + s * 0.08, repeat: Infinity, ease: 'easeInOut' }}
                                    />
                                );
                            })}

                            <motion.circle
                                cx={ix}
                                cy={iy}
                                r={isSelected ? 21 : 17}
                                fill={identity.color}
                                stroke="#fff"
                                strokeWidth={3}
                                className="cursor-pointer"
                                animate={{ scale: isSelected ? [1, 1.06, 1] : 1 }}
                                transition={{ duration: 2.5, repeat: Infinity }}
                                onClick={() => setSelectedIdentityId(isSelected ? null : identity.id)}
                            />
                            <text x={ix} y={iy + 4} textAnchor="middle" className="fill-white text-[8px] font-bold pointer-events-none">
                                {identity.completedSignals}/{identity.totalSignals}
                            </text>
                            <text x={ix} y={iy + 36} textAnchor="middle" className="fill-slate-600 text-[9px] font-medium">
                                {identity.name.length > 15 ? `${identity.name.slice(0, 14)}…` : identity.name}
                            </text>
                        </g>
                    );
                })}

                {/* evidence flows */}
                {particles.map((particle) => (
                    <motion.circle
                        key={particle.id}
                        r={2.8}
                        fill={particle.color}
                        filter={`url(#glow-${desire.id})`}
                        initial={{ cx: particle.fromX, cy: particle.fromY, opacity: 0 }}
                        animate={{ cx: [particle.fromX, CX], cy: [particle.fromY, CY], opacity: [0, 1, 1, 0] }}
                        transition={{ duration: particle.duration, repeat: Infinity, delay: particle.delay, ease: 'easeInOut' }}
                    />
                ))}
            </svg>

            <div className="w-full grid grid-cols-3 gap-2 text-center text-xs mt-1">
                <div className="rounded-xl bg-indigo-50 p-2"><strong className="block text-indigo-700">{identityNodesTotal(identities)}</strong><span className="text-slate-500">identités</span></div>
                <div className="rounded-xl bg-purple-50 p-2"><strong className="block text-purple-700">{totalSignals}</strong><span className="text-slate-500">signaux</span></div>
                <div className="rounded-xl bg-fuchsia-50 p-2"><strong className="block text-fuchsia-700">{evidenceCount}</strong><span className="text-slate-500">preuves</span></div>
            </div>

            {selectedIdentity && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full mt-3 rounded-xl border border-slate-200 bg-white/80 p-3"
                >
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <div className="font-semibold text-slate-800">{selectedIdentity.name}</div>
                            <div className="text-xs text-slate-500">Identité en construction</div>
                        </div>
                        <div className="text-right">
                            <div className="font-bold text-indigo-600">{selectedIdentity.consistency ?? 0}%</div>
                            <div className="text-[10px] text-slate-400">activation</div>
                        </div>
                    </div>
                    <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div className="h-full rounded-full" style={{ backgroundColor: selectedIdentity.color }} initial={{ width: 0 }} animate={{ width: `${selectedIdentity.consistency ?? 0}%` }} />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 mt-2">
                        <span>{selectedIdentity.completedSignals}/{selectedIdentity.totalSignals} signaux activés</span>
                        <span>{selectedIdentity.evidenceCount ?? 0} preuves accumulées</span>
                    </div>
                </motion.div>
            )}

            <p className="text-[11px] text-slate-400 mt-3 text-center">✦ Signaux activés · points estompés = signaux à incarner · chaque lumière en mouvement représente une preuve accumulée.</p>
        </div>
    );
};

function identityNodesTotal(identities: VizIdentityNode[]) {
    return identities.length;
}

export default UniverseMode;
