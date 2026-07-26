import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { VizDesireNode } from '@/types';
import { getCurrentDayIndex, getHabitStartDayIndex } from '@/utils/habitUtils';

/**
 * MomentumMode — Visualisation de l'élan comportemental.
 * Affiche le momentum comme une rivière qui coule (ou stagne).
 * Streaks, taux de complétion glissant, et alertes de rupture.
 */
const MomentumMode: React.FC<{ desire: VizDesireNode }> = ({ desire }) => {
  const habits = useAppStore((s) => s.habits);

  const identityIds = desire.identityNodes.map((n) => n.id);

  const momentum = useMemo(() => {
    const linkedHabits = habits.filter((h) =>
      h.linkedIdentities.some((id) => identityIds.includes(id))
    );
    if (linkedHabits.length === 0) return null;

    const todayIdx = getCurrentDayIndex();
    const daysBack = 30;
    const startIdx = Math.max(0, todayIdx - daysBack + 1);

    // Calcul du taux de complétion par jour (moyenne glissante)
    const dailyRates: number[] = [];
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let breakDays = 0;
    let breakPattern: 'none' | 'recent' | 'chronic' = 'none';

    for (let d = startIdx; d <= todayIdx; d++) {
      const active = linkedHabits.filter((h) => {
        const hStart = h.startDayIndex ?? getHabitStartDayIndex(h);
        return d >= hStart && d < hStart + h.progress.length;
      });
      if (active.length === 0) continue;

      const completed = active.filter((h) => h.progress[d]).length;
      const rate = completed / active.length;
      dailyRates.push(rate);

      // Streak : jour complet (> 80%)
      if (rate >= 0.8) {
        tempStreak++;
        currentStreak = tempStreak;
      } else {
        if (tempStreak > longestStreak) longestStreak = tempStreak;
        tempStreak = 0;
        if (rate < 0.3) breakDays++;
      }
    }
    if (tempStreak > longestStreak) longestStreak = tempStreak;

    // Pattern de rupture
    const recentBreak = dailyRates.slice(-7).filter((r) => r < 0.3).length;
    if (recentBreak >= 5) breakPattern = 'chronic';
    else if (recentBreak >= 3) breakPattern = 'recent';

    // Moyenne glissante 7 jours
    const avg7 = dailyRates.length >= 7
      ? dailyRates.slice(-7).reduce((a, b) => a + b, 0) / 7
      : dailyRates.reduce((a, b) => a + b, 0) / dailyRates.length;

    // Tendance (comparaison 7 derniers vs 7 précédents)
    const recent7 = dailyRates.slice(-7);
    const prev7 = dailyRates.slice(-14, -7);
    const recentAvg = recent7.length > 0 ? recent7.reduce((a, b) => a + b, 0) / recent7.length : 0;
    const prevAvg = prev7.length > 0 ? prev7.reduce((a, b) => a + b, 0) / prev7.length : 0;
    const trend = recentAvg - prevAvg;

    const momentumLevel = currentStreak >= 14 ? 'fort' : currentStreak >= 7 ? 'modéré' : currentStreak >= 3 ? 'fragile' : 'faible';

    return {
      currentStreak,
      longestStreak,
      breakDays,
      breakPattern,
      avg7: Math.round(avg7 * 100),
      trend: Math.round(trend * 100),
      momentumLevel,
      dailyRates,
      linkedHabits: linkedHabits.length,
      totalDays: dailyRates.length,
    };
  }, [habits, identityIds]);

  // Niveaux de rivière
  const riverLevels = useMemo(() => {
    if (!momentum) return [];
    const levels = [
      { label: 'Déborder', threshold: 95, color: '#10b981', height: 100 },
      { label: 'Fort', threshold: 80, color: '#34d399', height: 75 },
      { label: 'Modéré', threshold: 60, color: '#f59e0b', height: 50 },
      { label: 'Faible', threshold: 40, color: '#f97316', height: 25 },
      { label: 'Asséché', threshold: 0, color: '#ef4444', height: 10 },
    ];
    return levels;
  }, []);

  if (!momentum) {
    return (
      <div className="text-center py-12 text-slate-500">
        <div className="text-4xl mb-3">🌊</div>
        <p>Aucune habitude liée à ce désir.</p>
        <p className="text-xs mt-1">Ajoute des signaux pour voir ton momentum.</p>
      </div>
    );
  }

  const breakAlerts: Record<string, { color: string; icon: string; message: string }> = {
    none: { color: 'text-slate-400', icon: '✅', message: 'Aucune rupture récente' },
    recent: { color: 'text-amber-600', icon: '⚠️', message: 'Ruptures fréquentes cette semaine' },
    chronic: { color: 'text-rose-600', icon: '🔴', message: 'Rupture chronique — besoin de restaurer le momentum' },
  };

  const alert = breakAlerts[momentum.breakPattern];

  const momentumEmoji = momentum.momentumLevel === 'fort' ? '🌊' : momentum.momentumLevel === 'modéré' ? '🏄' : momentum.momentumLevel === 'fragile' ? '💧' : '🏜️';
  const momentumColors: Record<string, string> = {
    fort: 'from-emerald-400 to-blue-500',
    modéré: 'from-amber-400 to-orange-500',
    fragile: 'from-orange-400 to-red-500',
    faible: 'from-red-400 to-rose-600',
  };

  return (
    <div className="flex flex-col items-center">
      <div className="w-full flex items-start justify-between gap-4 mb-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Rivière du Momentum</h3>
          <p className="text-xs text-slate-500 mt-1">L'élan se construit jour après jour — ou s'érode.</p>
        </div>
        <div className="text-right shrink-0 flex items-center gap-2">
          <span className="text-2xl">{momentumEmoji}</span>
          <div>
            <div className="text-sm font-semibold text-slate-800 capitalize">{momentum.momentumLevel}</div>
            <div className="text-[10px] text-slate-400">{momentum.currentStreak} jours</div>
          </div>
        </div>
      </div>

      {/* Jauge de momentum */}
      <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden mb-4 relative">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${momentumColors[momentum.momentumLevel]}`}
          initial={{ width: 0 }}
          animate={{ width: `${momentum.avg7}%` }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-sm">
          {momentum.avg7}%
        </div>
      </div>

      {/* Rivière SVG — chaque vague = un jour */}
      <svg viewBox="0 0 600 140" className="w-full max-w-xl select-none mb-2">
        <defs>
          <linearGradient id="riverGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.1} />
            <stop offset="100%" stopColor="#6366f1" stopOpacity={0.3} />
          </linearGradient>
        </defs>
        <rect x={0} y={0} width={600} height={140} fill="url(#riverGradient)" rx={8} />

        {/* Courbe de niveau de la rivière */}
        {momentum.dailyRates.length > 1 && (
          <>
            {/* Surface remplie */}
            <motion.path
              d={(() => {
                const w = 560 / Math.max(momentum.dailyRates.length - 1, 1);
                let d = `M 20,${120 - momentum.dailyRates[0] * 90} `;
                momentum.dailyRates.forEach((rate, i) => {
                  const x = 20 + i * w;
                  const y = 120 - rate * 90;
                  d += `L ${x},${y} `;
                });
                d += `L ${20 + (momentum.dailyRates.length - 1) * w},120 L 20,120 Z`;
                return d;
              })()}
              fill="#6366f1"
              fillOpacity={0.2}
              animate
              transition={{ duration: 0.8 }}
            />
            {/* Ligne de la courbe */}
            <motion.path
              d={(() => {
                const w = 560 / Math.max(momentum.dailyRates.length - 1, 1);
                let d = `M 20,${120 - momentum.dailyRates[0] * 90} `;
                momentum.dailyRates.forEach((rate, i) => {
                  const x = 20 + i * w;
                  const y = 120 - rate * 90;
                  d += `L ${x},${y} `;
                });
                return d;
              })()}
              fill="none"
              stroke="#6366f1"
              strokeWidth={2.5}
              animate
              transition={{ duration: 0.8 }}
            />
            {/* Marqueurs des jours */}
            {momentum.dailyRates.map((rate, i) => {
              const w = 560 / Math.max(momentum.dailyRates.length - 1, 1);
              const x = 20 + i * w;
              const y = 120 - rate * 90;
              const isRecent = i >= momentum.dailyRates.length - 7;
              return (
                <motion.circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={isRecent ? 4 : 2.5}
                  fill={rate >= 0.8 ? '#10b981' : rate >= 0.5 ? '#f59e0b' : '#ef4444'}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.015, duration: 0.3 }}
                >
                  <title>Jour {i + 1}: {Math.round(rate * 100)}%</title>
                </motion.circle>
              );
            })}
          </>
        )}

        {/* Légende sur le graphique */}
        <text x={300} y={18} textAnchor="middle" className="fill-slate-500 text-[8px]">30 jours de momentum</text>
        <text x={580} y={130} textAnchor="end" className="fill-slate-400 text-[7px]">0%</text>
        <text x={580} y={32} textAnchor="end" className="fill-slate-400 text-[7px]">100%</text>
      </svg>

      {/* Stats */}
      <div className="w-full grid grid-cols-4 gap-2 text-center text-xs mb-3">
        <div className="rounded-xl bg-indigo-50 p-2">
          <strong className="block text-indigo-700">{momentum.currentStreak}</strong>
          <span className="text-slate-500">streak actuel</span>
        </div>
        <div className="rounded-xl bg-purple-50 p-2">
          <strong className="block text-purple-700">{momentum.longestStreak}</strong>
          <span className="text-slate-500">meilleur streak</span>
        </div>
        <div className="rounded-xl bg-blue-50 p-2">
          <strong className="block text-blue-700">{momentum.avg7}%</strong>
          <span className="text-slate-500">moy. 7 jours</span>
        </div>
        <div className={`rounded-xl p-2 ${momentum.trend >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
          <strong className={`block ${momentum.trend >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{momentum.trend >= 0 ? '+' : ''}{momentum.trend}%</strong>
          <span className="text-slate-500">tendance</span>
        </div>
      </div>

      {/* Niveaux de la rivière */}
      <div className="w-full rounded-xl bg-white/60 border border-slate-200 p-3">
        <div className="text-xs font-semibold text-slate-600 mb-2">Niveaux de la rivière</div>
        <div className="flex gap-1">
          {riverLevels.map((level) => {
            const isActive = momentum.avg7 >= level.threshold;
            return (
              <div
                key={level.label}
                className="flex-1 text-center"
              >
                <div
                  className="rounded-lg border transition"
                  style={{
                    backgroundColor: isActive ? level.color : 'transparent',
                    borderColor: level.color,
                    opacity: isActive ? 1 : 0.3,
                    height: `${level.height * 0.5}px`,
                  }}
                />
                <div className={`text-[9px] mt-1 ${isActive ? 'font-semibold' : 'text-slate-400'}`}>{level.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alerte rupture */}
      <div className={`w-full mt-2 rounded-xl bg-white/60 border border-slate-200 p-2.5 text-center text-xs ${alert.color}`}>
        <span className="mr-1">{alert.icon}</span>
        {alert.message}
        {momentum.breakPattern !== 'none' && (
          <span className="block text-slate-400 mt-1">
            {momentum.breakDays} jour{momentum.breakDays > 1 ? 's' : ''} avec &lt;30% de complétion
          </span>
        )}
      </div>
    </div>
  );
};

export default MomentumMode;
