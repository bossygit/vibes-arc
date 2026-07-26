import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { VizDesireNode, isAligned, isResisting, getAlignmentZone, EmotionalFrequency } from '@/types';
import { buildDailyEvidence } from '@/utils/credibilityScore';

const MOOD_COLORS: Record<string, string> = {
  alignement: '#10b981',
  neutre: '#f59e0b',
  résistance: '#ef4444',
};

const MOOD_GRADIENTS: Record<string, string> = {
  alignement: 'from-emerald-400 via-green-500 to-emerald-600',
  neutre: 'from-amber-300 via-orange-400 to-amber-500',
  résistance: 'from-rose-400 via-red-500 to-rose-600',
};

/**
 * WeatherMode — Visualisation émotionnelle des 30 derniers jours.
 * Affiche une carte météo vibratoire avec zones d'alignement,
 * tendance, et distribution.
 */
const WeatherMode: React.FC<{ desire: VizDesireNode }> = ({ desire }) => {
  const habits = useAppStore((s) => s.habits);
  const accusers = useAppStore((s) => s.accusers);
  const dailyMoods = useAppStore((s) => s.dailyMoods);

  const identityIds = desire.identityNodes.map((n) => n.id);
  const desireAccusers = accusers.filter((a) => a.linkedDesireId === desire.id);
  const moodsMap = new Map(dailyMoods.map((m) => [m.date, m.score]));
  const evidence = buildDailyEvidence(habits, identityIds, moodsMap, desireAccusers, 30);

  // Statistiques de distribution émotionnelle
  const moodStats = useMemo(() => {
    const moods = evidence.map((e) => e.moodScore);
    if (moods.length === 0) return null;

    const aligned = moods.filter((m) => isAligned(m as EmotionalFrequency)).length;
    const neutral = moods.filter((m) => getAlignmentZone(m as EmotionalFrequency) === 'neutre').length;
    const resisting = moods.filter((m) => isResisting(m as EmotionalFrequency)).length;
    const total = moods.length;

    // Tendance (moyenne 7 derniers jours vs 7 précédents)
    const recent7 = moods.slice(-7);
    const prev7 = moods.slice(-14, -7);
    const recentAvg = recent7.length > 0 ? recent7.reduce((a, b) => a + b, 0) / recent7.length : 0;
    const prevAvg = prev7.length > 0 ? prev7.reduce((a, b) => a + b, 0) / prev7.length : 0;
    const trend = recentAvg - prevAvg; // négatif = amélioration (score plus bas = mieux)

    const dominantZone = aligned >= neutral && aligned >= resisting
      ? 'alignement'
      : resisting >= aligned && resisting >= neutral
        ? 'résistance'
        : 'neutre';

    return { aligned, neutral, resisting, total, trend, dominantZone, recentAvg: Math.round(recentAvg * 10) / 10, prevAvg: Math.round(prevAvg * 10) / 10 };
  }, [evidence]);

  // Données de la carte météo
  const weatherEmoji = useMemo(() => {
    if (!moodStats) return '☁️';
    const lastMood = evidence[evidence.length - 1]?.moodScore ?? 11;
    if (lastMood <= 4) return '☀️';
    if (lastMood <= 7) return '🌤️';
    if (lastMood <= 11) return '⛅';
    if (lastMood <= 15) return '🌧️';
    return '⛈️';
  }, [evidence, moodStats]);

  const weatherLabel = useMemo(() => {
    if (!moodStats) return 'Données insuffisantes';
    const lastMood = evidence[evidence.length - 1]?.moodScore ?? 11;
    const zone = getAlignmentZone(lastMood as EmotionalFrequency);
    const labels: Record<string, string> = {
      alignement: 'Aligné — bonne fréquence',
      neutre: 'Neutre — zone de bascule',
      résistance: 'Résistance — blocage vibratoire',
    };
    return labels[zone] ?? '—';
  }, [evidence, moodStats]);

  const trendEmoji = useMemo(() => {
    if (!moodStats) return '→';
    if (moodStats.trend < -1) return '↑ Amélioration';
    if (moodStats.trend > 1) return '↓ Dégradation';
    return '→ Stable';
  }, [moodStats]);

  if (!moodStats || evidence.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <div className="text-4xl mb-3">🌦️</div>
        <p>Pas assez de données émotionnelles.</p>
        <p className="text-xs mt-1">Enregistre ton mood quotidien pour voir ta météo vibratoire.</p>
      </div>
    );
  }

  const W = 600, H = 220, PAD = 30;
  const chartW = W - PAD * 2;
  const barW = chartW / evidence.length;
  const maxMood = 22;

  return (
    <div className="flex flex-col items-center">
      <div className="w-full flex items-start justify-between gap-4 mb-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Météo Vibratoire</h3>
          <p className="text-xs text-slate-500 mt-1">Lecture émotionnelle des 30 derniers jours.</p>
        </div>
        <div className="text-right shrink-0 flex items-center gap-2">
          <span className="text-2xl">{weatherEmoji}</span>
          <div>
            <div className="text-sm font-semibold text-slate-800">{weatherLabel}</div>
            <div className="text-[10px] text-slate-400">{trendEmoji}</div>
          </div>
        </div>
      </div>

      {/* Barres de distribution */}
      <div className="w-full flex gap-2 mb-4">
        {([
          ['alignement', moodStats.aligned, 'Jours alignés'],
          ['neutre', moodStats.neutral, 'Jours neutres'],
          ['résistance', moodStats.resisting, 'Jours en résistance'],
        ] as const).map(([zone, count, label]) => {
          const pct = moodStats.total ? Math.round((count / moodStats.total) * 100) : 0;
          const gradient = MOOD_GRADIENTS[zone];
          return (
            <div key={zone} className="flex-1 rounded-xl bg-white/60 border border-slate-200 p-3 text-center">
              <div className={`h-1.5 rounded-full bg-gradient-to-r ${gradient} mb-2`} style={{ opacity: 0.3 + pct / 100 }} />
              <div className="text-lg font-bold text-slate-800">{count}</div>
              <div className="text-[10px] text-slate-500">{label}</div>
              <div className="text-[10px] text-slate-400">{pct}%</div>
            </div>
          );
        })}
      </div>

      {/* Graphique SVG des 30 jours */}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-xl select-none">
        <defs>
          <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
            <stop offset="40%" stopColor="#f59e0b" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#ef4444" stopOpacity={0.15} />
          </linearGradient>
        </defs>

        {/* Zones d'alignement */}
        <rect x={PAD} y={0} width={chartW} height={H * (7 / maxMood)} fill="#10b981" fillOpacity={0.06} rx={4} />
        <rect x={PAD} y={H * (7 / maxMood)} width={chartW} height={H * (8 / maxMood)} fill="#f59e0b" fillOpacity={0.04} rx={4} />
        <rect x={PAD} y={H * (15 / maxMood)} width={chartW} height={H * (7 / maxMood)} fill="#ef4444" fillOpacity={0.06} rx={4} />

        {/* Lignes de séparation des zones */}
        <line x1={PAD} y1={H * (7 / maxMood)} x2={W - PAD} y2={H * (7 / maxMood)} stroke="#10b981" strokeOpacity={0.3} strokeWidth={1} strokeDasharray="4 4" />
        <line x1={PAD} y1={H * (15 / maxMood)} x2={W - PAD} y2={H * (15 / maxMood)} stroke="#ef4444" strokeOpacity={0.3} strokeWidth={1} strokeDasharray="4 4" />

        {/* Barres des moods */}
        {evidence.map((day, i) => {
          const x = PAD + i * barW;
          const barH = (day.moodScore / maxMood) * H;
          const y = H - barH;
          const color = MOOD_COLORS[getAlignmentZone(day.moodScore as EmotionalFrequency)];
          return (
            <motion.rect
              key={day.date}
              x={x + 1}
              y={H}
              width={Math.max(3, barW - 2)}
              height={0}
              fill={color}
              rx={2}
              initial={false}
              animate={{ y, height: barH }}
              transition={{ duration: 0.6, delay: i * 0.02, ease: 'easeOut' }}
            >
              <title>{day.date} — Score: {day.moodScore}/22 — {getAlignmentZone(day.moodScore as EmotionalFrequency)}</title>
            </motion.rect>
          );
        })}

        {/* Labels des axes */}
        <text x={PAD} y={H - 4} className="fill-slate-400 text-[8px]">22 résistance</text>
        <text x={W - PAD} y={H - 4} className="fill-slate-400 text-[8px]" textAnchor="end">1 alignement</text>
      </svg>

      {/* Légende */}
      <div className="flex gap-4 text-[11px] text-slate-500 mt-2">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Alignement (1-7)</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Neutre (8-14)</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Résistance (15-22)</span>
      </div>

      {/* Stats */}
      <div className="w-full grid grid-cols-3 gap-2 text-center text-xs mt-3">
        <div className="rounded-xl bg-emerald-50 p-2">
          <strong className="block text-emerald-700">{moodStats.aligned}</strong>
          <span className="text-slate-500">alignés</span>
        </div>
        <div className="rounded-xl bg-amber-50 p-2">
          <strong className="block text-amber-700">{moodStats.neutral}</strong>
          <span className="text-slate-500">neutres</span>
        </div>
        <div className="rounded-xl bg-rose-50 p-2">
          <strong className="block text-rose-700">{moodStats.resisting}</strong>
          <span className="text-slate-500">résistance</span>
        </div>
      </div>

      {/* Tendance */}
      {moodStats.trend !== 0 && (
        <div className="w-full mt-2 rounded-xl bg-white/60 border border-slate-200 p-3 text-center text-xs">
          <span className="text-slate-500">Tendance 7 jours : </span>
          <span className={`font-semibold ${moodStats.trend < 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {moodStats.trend < 0 ? '↑ +' : '↓ '}{Math.abs(Math.round(moodStats.trend))} points
          </span>
          <span className="text-slate-400 ml-1">(moy. récente {moodStats.recentAvg} vs précédente {moodStats.prevAvg})</span>
        </div>
      )}
    </div>
  );
};

export default WeatherMode;
