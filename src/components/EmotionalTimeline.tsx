import React, { useMemo, useState } from 'react';
import { DailyMood } from '@/types';

// Réimporter FREQUENCY_SCALE localement si pas exporté, ou utiliser EMOTIONAL_LABELS
const EMOTIONAL_LABELS_MAP: Record<number, { label: string; color: string; emoji: string }> = {
    1: { label: 'Désespoir', color: '#7f1d1d', emoji: '🕳️' },
    2: { label: 'Peur/Insécurité', color: '#dc2626', emoji: '😰' },
    3: { label: 'Colère/Frustration', color: '#ea580c', emoji: '😤' },
    4: { label: 'Découragement', color: '#f59e0b', emoji: '😞' },
    5: { label: 'Inquiétude', color: '#eab308', emoji: '😟' },
    6: { label: 'Contentement', color: '#84cc16', emoji: '😐' },
    7: { label: 'Espoir', color: '#22c55e', emoji: '🌱' },
    8: { label: 'Optimisme', color: '#06b6d4', emoji: '✨' },
    9: { label: 'Joie/Passion', color: '#8b5cf6', emoji: '🔥' },
    10: { label: 'Gratitude/Amour', color: '#ec4899', emoji: '💖' },
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
    // score 1-10 mappé de bas en haut (1 = bas du graphe, 10 = haut)
    const ratio = (score - 1) / 9; // 0 à 1
    return PADDING_TOP + PLOT_HEIGHT - ratio * PLOT_HEIGHT;
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
        const highDays = scores.filter((s) => s >= 7).length;
        const lowDays = scores.filter((s) => s <= 3).length;
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
                    {/* Zones colorées de fond */}
                    {/* Zone résistance (1-3) */}
                    <rect
                        x={PADDING_LEFT}
                        y={PADDING_TOP}
                        width={PLOT_WIDTH}
                        height={PLOT_HEIGHT * (3 / 9)}
                        fill="#fef2f2"
                    />
                    {/* Zone neutre (4-6) */}
                    <rect
                        x={PADDING_LEFT}
                        y={PADDING_TOP + PLOT_HEIGHT * (3 / 9)}
                        width={PLOT_WIDTH}
                        height={PLOT_HEIGHT * (3 / 9)}
                        fill="#fffbeb"
                    />
                    {/* Zone alignement (7-10) */}
                    <rect
                        x={PADDING_LEFT}
                        y={PADDING_TOP + PLOT_HEIGHT * (6 / 9)}
                        width={PLOT_WIDTH}
                        height={PLOT_HEIGHT * (3 / 9)}
                        fill="#f0fdf4"
                    />

                    {/* Lignes horizontales de référence */}
                    {[3, 6, 8].map((score) => (
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

                    {/* Labels Y */}
                    {[1, 3, 5, 7, 9, 10].map((score) => (
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
                    {stats.trend > 0 && (
                        <p className="text-emerald-600">
                            ↑ Tendance positive — tu t'élèves de {stats.trend.toFixed(1)} pts sur {stats.total} jours
                        </p>
                    )}
                    {stats.trend < 0 && (
                        <p className="text-rose-600">
                            ↓ Tendance négative — baisse de {Math.abs(stats.trend).toFixed(1)} pts. Vérifie tes causes.
                        </p>
                    )}
                    {stats.lowDays > stats.highDays && stats.lowDays > 5 && (
                        <p className="text-rose-500">
                            ⚠️ {stats.lowDays} jours en résistance. Identifie les causes récurrentes.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default EmotionalTimeline;
