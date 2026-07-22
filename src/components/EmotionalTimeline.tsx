import React, { useMemo, useState } from 'react';
import { DailyMood } from '@/types';

// Échelle 22 niveaux : 1=Joie (haut) → 22=Peur/Dépression (bas)
const EMOTIONAL_LABELS_MAP: Record<number, { label: string; color: string; emoji: string }> = {
    1:  { label: 'Joie/Liberté/Amour', color: '#fbbf24', emoji: '☀️' },
    2:  { label: 'Passion',            color: '#f59e0b', emoji: '🔥' },
    3:  { label: 'Enthousiasme',       color: '#f97316', emoji: '🎉' },
    4:  { label: 'Croyance',           color: '#84cc16', emoji: '✨' },
    5:  { label: 'Optimisme',          color: '#22c55e', emoji: '🌤️' },
    6:  { label: 'Espoir',             color: '#10b981', emoji: '🌱' },
    7:  { label: 'Contentement',       color: '#06b6d4', emoji: '😌' },
    8:  { label: 'Ennui',              color: '#64748b', emoji: '😐' },
    9:  { label: 'Pessimisme',         color: '#a1a1aa', emoji: '😕' },
    10: { label: 'Frustration',        color: '#eab308', emoji: '😤' },
    11: { label: 'Accablement',        color: '#f97316', emoji: '😫' },
    12: { label: 'Déception',          color: '#ef4444', emoji: '😞' },
    13: { label: 'Doute',              color: '#dc2626', emoji: '🤔' },
    14: { label: 'Inquiétude',         color: '#b91c1c', emoji: '😟' },
    15: { label: 'Blâme',              color: '#991b1b', emoji: '👿' },
    16: { label: 'Découragement',      color: '#7f1d1d', emoji: '😔' },
    17: { label: 'Colère',             color: '#dc2626', emoji: '😡' },
    18: { label: 'Vengeance',          color: '#b91c1c', emoji: '💢' },
    19: { label: 'Haine/Rage',         color: '#991b1b', emoji: '🤬' },
    20: { label: 'Jalousie',           color: '#7f1d1d', emoji: '🥀' },
    21: { label: 'Insécurité/Culpa.',  color: '#581c87', emoji: '😰' },
    22: { label: 'Peur/Dépression',    color: '#4a044e', emoji: '🕳️' },
};

// ============================================================
// SVG Helpers
// ============================================================

const CHART_WIDTH = 600;
const CHART_HEIGHT = 220;
const PADDING_LEFT = 40;
const PADDING_RIGHT = 10;
const PADDING_TOP = 10;
const PADDING_BOTTOM = 30;
const PLOT_WIDTH = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT;
const PLOT_HEIGHT = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

function xForIndex(index: number, total: number): number {
    if (total <= 1) return PADDING_LEFT + PLOT_WIDTH / 2;
    return PADDING_LEFT + (index / (total - 1)) * PLOT_WIDTH;
}

function yForScore(score: number): number {
    // score 1-22 mappé de haut en bas (1 = haut du graphe = meilleur, 22 = bas = pire)
    const ratio = (score - 1) / 21; // 0 (meilleur) à 1 (pire)
    return PADDING_TOP + ratio * PLOT_HEIGHT;
}

// ============================================================
// EmotionalTimeline
// ============================================================

interface Props {
    moods: DailyMood[];
    daysBack?: number; // défaut 30
}

const EmotionalTimeline: React.FC<Props> = ({ moods, daysBack = 30 }) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    // Filtrer les moods sur la période
    const periodMoods = useMemo(() => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - daysBack);
        cutoff.setHours(0, 0, 0, 0);

        return moods
            .filter((m) => {
                try {
                    return new Date(m.date) >= cutoff;
                } catch {
                    return false;
                }
            })
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [moods, daysBack]);

    // Calculer la tendance (moyenne mobile 7 jours)
    const trendLine = useMemo(() => {
        if (periodMoods.length < 3) return null;
        const points: { x: number; y: number }[] = [];
        for (let i = 0; i < periodMoods.length; i++) {
            const windowStart = Math.max(0, i - 3);
            const windowEnd = Math.min(periodMoods.length - 1, i + 3);
            let sum = 0;
            let count = 0;
            for (let j = windowStart; j <= windowEnd; j++) {
                sum += periodMoods[j].score;
                count++;
            }
            const avg = sum / count;
            points.push({
                x: xForIndex(i, periodMoods.length),
                y: yForScore(avg),
            });
        }
        return points;
    }, [periodMoods]);

    // Stats
    const stats = useMemo(() => {
        if (periodMoods.length === 0) return null;
        const scores = periodMoods.map((m) => m.score);
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        const min = Math.min(...scores);
        const max = Math.max(...scores);
        const highDays = scores.filter((s) => s <= 7).length;
        const lowDays = scores.filter((s) => s >= 15).length;
        const trend = scores.length >= 2 ? scores[scores.length - 1] - scores[0] : 0;
        return { avg, min, max, highDays, lowDays, trend, total: scores.length };
    }, [periodMoods]);

    if (periodMoods.length === 0) {
        return (
            <div className="text-center py-8 text-sm text-gray-400">
                Pas encore assez de check-ins. Reviens après quelques jours.
            </div>
        );
    }

    const hoveredMood = hoveredIndex !== null ? periodMoods[hoveredIndex] : null;
    const hoveredInfo = hoveredMood ? EMOTIONAL_LABELS_MAP[hoveredMood.score] : null;

    return (
        <div className="space-y-3">
            {/* Stats rapides */}
            {stats && (
                <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-gray-50 rounded-lg p-2">
                        <div className="text-lg font-bold text-gray-700">{stats.avg.toFixed(1)}</div>
                        <div className="text-[10px] text-gray-400">Moyenne</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                        <div className="text-lg font-bold text-emerald-600">{stats.highDays}</div>
                        <div className="text-[10px] text-gray-400">Jours alignés</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                        <div className="text-lg font-bold text-rose-600">{stats.lowDays}</div>
                        <div className="text-[10px] text-gray-400">Jours résistance</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                        <div
                            className={`text-lg font-bold ${
                                stats.trend > 0 ? 'text-emerald-600' : stats.trend < 0 ? 'text-rose-600' : 'text-gray-400'
                            }`}
                        >
                            {stats.trend > 0 ? '↑' : stats.trend < 0 ? '↓' : '→'}
                        </div>
                        <div className="text-[10px] text-gray-400">Tendance</div>
                    </div>
                </div>
            )}

            {/* Graphique SVG */}
            <div className="relative bg-white rounded-xl border border-gray-100 overflow-hidden">
                <svg
                    viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                    className="w-full h-auto"
                    preserveAspectRatio="xMidYMid meet"
                >
                    {/* Zones colorées de fond (échelle inversée) */}
                    {/* Zone alignement (1-7) — haut du graphe */}
                    <rect
                        x={PADDING_LEFT}
                        y={PADDING_TOP}
                        width={PLOT_WIDTH}
                        height={PLOT_HEIGHT * (7 / 21)}
                        fill="#f0fdf4"
                    />
                    {/* Zone neutre (8-14) — milieu */}
                    <rect
                        x={PADDING_LEFT}
                        y={PADDING_TOP + PLOT_HEIGHT * (7 / 21)}
                        width={PLOT_WIDTH}
                        height={PLOT_HEIGHT * (7 / 21)}
                        fill="#fffbeb"
                    />
                    {/* Zone résistance (15-22) — bas du graphe */}
                    <rect
                        x={PADDING_LEFT}
                        y={PADDING_TOP + PLOT_HEIGHT * (14 / 21)}
                        width={PLOT_WIDTH}
                        height={PLOT_HEIGHT * (7 / 21)}
                        fill="#fef2f2"
                    />

                    {/* Lignes horizontales de référence */}
                    {[7, 14].map((score) => (
                        <line
                            key={score}
                            x1={PADDING_LEFT}
                            y1={yForScore(score)}
                            x2={PADDING_LEFT + PLOT_WIDTH}
                            y2={yForScore(score)}
                            stroke={score === 6 ? '#d1d5db' : '#e5e7eb'}
                            strokeWidth={score === 6 ? 1 : 0.5}
                            strokeDasharray={score === 6 ? '4,4' : '2,4'}
                        />
                    ))}

                    {/* Labels Y — repères clés */}
                    {[1, 7, 14, 22].map((score) => (
                        <text
                            key={score}
                            x={PADDING_LEFT - 8}
                            y={yForScore(score) + 4}
                            textAnchor="end"
                            className="text-[8px] fill-gray-400"
                            fontSize="9"
                            fontFamily="system-ui"
                        >
                            {score}
                        </text>
                    ))}

                    {/* Ligne de tendance (courbe de Bézier lissée) */}
                    {trendLine && trendLine.length >= 2 && (
                        <polyline
                            points={trendLine.map((p) => `${p.x},${p.y}`).join(' ')}
                            fill="none"
                            stroke="#6366f1"
                            strokeWidth="2"
                            strokeOpacity="0.5"
                            strokeDasharray="6,3"
                        />
                    )}

                    {/* Ligne des données */}
                    {periodMoods.length >= 2 && (
                        <polyline
                            points={periodMoods
                                .map((m, i) => `${xForIndex(i, periodMoods.length)},${yForScore(m.score)}`)
                                .join(' ')}
                            fill="none"
                            stroke="#8b5cf6"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    )}

                    {/* Points de données */}
                    {periodMoods.map((m, i) => {
                        const x = xForIndex(i, periodMoods.length);
                        const y = yForScore(m.score);
                        const info = EMOTIONAL_LABELS_MAP[m.score];
                        const isHovered = hoveredIndex === i;
                        return (
                            <g key={m.date}>
                                {/* Zone de hit invisible pour hover */}
                                <circle
                                    cx={x}
                                    cy={y}
                                    r={12}
                                    fill="transparent"
                                    style={{ cursor: 'pointer' }}
                                    onMouseEnter={() => setHoveredIndex(i)}
                                    onMouseLeave={() => setHoveredIndex(null)}
                                />
                                {/* Point visible */}
                                <circle
                                    cx={x}
                                    cy={y}
                                    r={isHovered ? 6 : 4}
                                    fill={info.color}
                                    stroke="white"
                                    strokeWidth={isHovered ? 2 : 1}
                                    style={{ transition: 'r 0.2s' }}
                                />
                            </g>
                        );
                    })}

                    {/* Tooltip */}
                    {hoveredMood && hoveredInfo && (
                        <g>
                            <rect
                                x={Math.min(
                                    Math.max(PADDING_LEFT, xForIndex(hoveredIndex!, periodMoods.length) - 60),
                                    CHART_WIDTH - 130
                                )}
                                y={Math.max(PADDING_TOP, yForScore(hoveredMood.score) - 50)}
                                width={120}
                                height={40}
                                rx={6}
                                fill="white"
                                stroke="#e5e7eb"
                                strokeWidth={1}
                            />
                            <text
                                x={Math.min(
                                    Math.max(PADDING_LEFT, xForIndex(hoveredIndex!, periodMoods.length) - 54),
                                    CHART_WIDTH - 124
                                ) + 6}
                                y={Math.max(PADDING_TOP, yForScore(hoveredMood.score) - 35)}
                                fontSize="11"
                                fontFamily="system-ui"
                                fill="#374151"
                                fontWeight="600"
                            >
                                {new Date(hoveredMood.date).toLocaleDateString('fr', {
                                    day: 'numeric',
                                    month: 'short',
                                })}
                            </text>
                            <text
                                x={Math.min(
                                    Math.max(PADDING_LEFT, xForIndex(hoveredIndex!, periodMoods.length) - 54),
                                    CHART_WIDTH - 124
                                ) + 6}
                                y={Math.max(PADDING_TOP, yForScore(hoveredMood.score) - 20)}
                                fontSize="11"
                                fontFamily="system-ui"
                                fill={hoveredInfo.color}
                            >
                                {hoveredInfo.emoji} {hoveredInfo.label} ({hoveredMood.score}/10)
                            </text>
                        </g>
                    )}
                </svg>

                {/* Légende */}
                <div className="flex justify-center gap-4 py-2 text-[10px] text-gray-400 border-t border-gray-100">
                    <span>─── données</span>
                    <span>- - - tendance</span>
                </div>
            </div>

            {/* Insights */}
            {stats && (
                <div className="text-xs text-gray-500 text-center space-y-1">
                    {stats.trend < 0 && (
                        <p className="text-emerald-600">
                            ↑ Tendance positive — tu t'élèves (baisse de {Math.abs(stats.trend).toFixed(1)} pts sur l'échelle)
                        </p>
                    )}
                    {stats.trend > 0 && (
                        <p className="text-rose-600">
                            ↓ Tendance négative — tu descends de {stats.trend.toFixed(1)} pts. Vérifie tes causes.
                        </p>
                    )}
                    {stats.lowDays > stats.highDays && stats.lowDays > 5 && (
                        <p className="text-rose-500">
                            ⚠️ {stats.lowDays} jours en résistance (15+). Identifie les causes récurrentes.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default EmotionalTimeline;
