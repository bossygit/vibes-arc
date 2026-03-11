import React from 'react';
import { Rocket } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Habit } from '@/types';
import { getCurrentDayIndex, getWeeklyCompletionRate } from '@/utils/habitUtils';
import { computeChain, getGlobalLongestStreak } from '@/utils/chainUtils';
import { computeFutureSelf } from '@/utils/futureSelfUtils';

interface FutureSelfSectionProps {
  habits: Habit[];
}

const FutureSelfSection: React.FC<FutureSelfSectionProps> = ({ habits }) => {
  if (habits.length === 0) return null;

  const todayIdx = getCurrentDayIndex();
  const chain = computeChain(habits, todayIdx);
  const longestStreak = getGlobalLongestStreak(habits, todayIdx);
  const completionRate = getWeeklyCompletionRate(habits, todayIdx);
  const futureSelf = computeFutureSelf({
    currentStreak: chain.length,
    longestStreak,
    completionRate,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card bg-gradient-to-br from-indigo-50 to-violet-50/40 border border-indigo-200"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <Rocket className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Ton futur toi</h2>
          <p className="text-sm text-slate-600">Où tu vas si tu continues</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="p-4 rounded-xl bg-white/70 border border-indigo-100">
          <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-1">Prochain niveau</p>
          <p className="text-lg font-bold text-slate-800">{futureSelf.nextLevel.name}</p>
          <p className="text-sm text-slate-600">
            {futureSelf.nextLevel.daysRemaining === 0
              ? 'Niveau max'
              : `${futureSelf.nextLevel.daysRemaining} jours restants`}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white/70 border border-indigo-100">
          <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-1">Projection</p>
          <p className="text-sm text-slate-700">
            Dans 7 j. : <span className="font-bold text-indigo-600">{futureSelf.projectedStreak.in7days} jours</span>
          </p>
          <p className="text-sm text-slate-700">
            Dans 30 j. : <span className="font-bold text-indigo-600">{futureSelf.projectedStreak.in30days} jours</span>
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-50/80 border border-indigo-200">
        <span className="text-2xl flex-shrink-0" aria-hidden>
          {futureSelf.message.emoji}
        </span>
        <div>
          <p className="font-semibold text-slate-800">{futureSelf.message.title}</p>
          <p className="text-sm text-slate-700 mt-0.5">{futureSelf.message.message}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default FutureSelfSection;
