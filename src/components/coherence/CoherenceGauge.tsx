/**
 * Jauge de cohérence animée — arc 0-10 (SVG) avec transition douce.
 * Couleur par niveau : Faible (rose), Moyen (ambre), Élevé (émeraude).
 */

import React from 'react';
import { LEVEL_LABELS, type CoherenceLevel } from '@/utils/hrv/coherence';

interface CoherenceGaugeProps {
    score: number | null;
    level: CoherenceLevel | null;
    /** Fréquence du pic dominant (Hz) — affichée en sous-titre. */
    peakFreq?: number | null;
}

const LEVEL_COLORS: Record<CoherenceLevel, string> = {
    faible: '#fb7185',
    moyen: '#fbbf24',
    eleve: '#34d399',
};

const CoherenceGauge: React.FC<CoherenceGaugeProps> = ({ score, level, peakFreq }) => {
    const value = score ?? 0;
    const color = level ? LEVEL_COLORS[level] : '#475569';

    return (
        <div className="flex flex-col items-center">
            <svg viewBox="0 0 200 128" className="w-full max-w-[240px]">
                {/* Arc de fond */}
                <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke="rgba(51, 65, 85, 0.9)"
                    strokeWidth="10"
                    strokeLinecap="round"
                />
                {/* Arc de valeur */}
                <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke={color}
                    strokeWidth="10"
                    strokeLinecap="round"
                    pathLength={1}
                    strokeDasharray="1 1"
                    strokeDashoffset={1 - Math.min(value, 10) / 10}
                    style={{
                        transition: 'stroke-dashoffset 500ms ease, stroke 500ms ease',
                        filter: `drop-shadow(0 0 6px ${color})`,
                    }}
                />
                {/* Score */}
                <text x="100" y="82" textAnchor="middle" fontSize="34" fontWeight="700" fill="#e2e8f0">
                    {score === null ? '—' : score.toFixed(1)}
                </text>
                <text x="100" y="102" textAnchor="middle" fontSize="12" fill={color}>
                    {level ? LEVEL_LABELS[level] : 'collecte…'}
                </text>
                <text x="100" y="122" textAnchor="middle" fontSize="10" fill="#64748b">
                    {peakFreq ? `pic ${peakFreq.toFixed(3)} Hz` : 'cohérence 0-10'}
                </text>
            </svg>
        </div>
    );
};

export default CoherenceGauge;
