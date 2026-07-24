import React from 'react';
import { motion } from 'framer-motion';
import { VizDesireNode } from '@/types';

const CX = 200;
const CY = 200;
const IDENTITY_RADIUS = 135;
const SIGNAL_RADIUS = 34;

/**
 * CONCEPT 5 — Constellation du Désir.
 * Désir (centre) ← Identités (planètes) ← Signaux (étoiles).
 * Chaque preuve complétée émet une particule lumineuse qui voyage vers le désir.
 */
const UniverseMode: React.FC<{ desire: VizDesireNode }> = ({ desire }) => {
    const identities = desire.identityNodes;
    const count = identities.length;

    if (count === 0) {
        return (
            <div className="text-center py-12 text-slate-500">
                Aucune identité liée à ce désir. Ajoute des identités dans le Tribunal pour voir ta constellation.
            </div>
        );
    }

    const particles = identities.flatMap((idn, i) => {
        const angle = (2 * Math.PI * i) / count - Math.PI / 2;
        const ix = CX + IDENTITY_RADIUS * Math.cos(angle);
        const iy = CY + IDENTITY_RADIUS * Math.sin(angle);
        const emit = Math.min(3, idn.completedSignals);
        return Array.from({ length: emit }).map((_, k) => ({
            id: `${idn.id}-p${k}`,
            fromX: ix,
            fromY: iy,
            delay: (k * 0.7 + i * 0.35) % 3,
            color: idn.color,
        }));
    });

    return (
        <div className="flex flex-col items-center">
            <h3 className="text-lg font-semibold text-slate-800 mb-1">Constellation du Désir</h3>
            <p className="text-sm text-slate-500 mb-3 text-center max-w-md">
                Chaque particule lumineuse est une preuve qui voyage vers ton désir. Les identités sont les planètes, les signaux les étoiles.
            </p>
            <svg viewBox="0 0 400 400" className="w-full max-w-md">
                <defs>
                    <radialGradient id="desireGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#a78bfa" />
                        <stop offset="100%" stopColor="#6366f1" />
                    </radialGradient>
                </defs>

                {/* Désir au centre */}
                <motion.circle
                    cx={CX}
                    cy={CY}
                    r={28}
                    fill="url(#desireGlow)"
                    animate={{ r: [26, 30, 26] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                />
                <text x={CX} y={CY + 4} textAnchor="middle" className="fill-white text-[11px] font-semibold">
                    DÉSIR
                </text>

                {identities.map((idn, i) => {
                    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
                    const ix = CX + IDENTITY_RADIUS * Math.cos(angle);
                    const iy = CY + IDENTITY_RADIUS * Math.sin(angle);
                    return (
                        <g key={idn.id}>
                            <line x1={CX} y1={CY} x2={ix} y2={iy} stroke={idn.color} strokeOpacity={0.25} strokeWidth={1.5} />
                            <circle cx={ix} cy={iy} r={15} fill={idn.color} />
                            <text x={ix} y={iy + 34} textAnchor="middle" className="fill-slate-600 text-[9px]">
                                {idn.name.length > 14 ? `${idn.name.slice(0, 13)}…` : idn.name}
                            </text>
                            {Array.from({ length: idn.totalSignals }).map((_, s) => {
                                const spread = 0.2;
                                const sa = angle + (s - (idn.totalSignals - 1) / 2) * spread;
                                const sx = ix + SIGNAL_RADIUS * Math.cos(sa);
                                const sy = iy + SIGNAL_RADIUS * Math.sin(sa);
                                const completed = s < idn.completedSignals;
                                return (
                                    <circle
                                        key={s}
                                        cx={sx}
                                        cy={sy}
                                        r={3.5}
                                        fill={completed ? '#ffffff' : idn.color}
                                        opacity={completed ? 1 : 0.35}
                                    />
                                );
                            })}
                        </g>
                    );
                })}

                {particles.map((p) => (
                    <motion.circle
                        key={p.id}
                        r={3}
                        fill={p.color}
                        initial={{ cx: p.fromX, cy: p.fromY, opacity: 0 }}
                        animate={{ cx: [p.fromX, CX], cy: [p.fromY, CY], opacity: [0, 1, 1, 0] }}
                        transition={{ duration: 3, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
                    />
                ))}
            </svg>
            <p className="text-xs text-slate-400 mt-2">Les étoiles blanches = signaux accomplis · les estompées = à incarner.</p>
        </div>
    );
};

export default UniverseMode;
