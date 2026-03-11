import React from 'react';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Habit } from '@/types';
import { getCurrentDayIndex, getWeeklyCompletionRate, isHabitActiveOnDay } from '@/utils/habitUtils';
import { computeChain } from '@/utils/chainUtils';
import { computeDopamineReward, type RewardLevel } from '@/utils/dopamineRewardUtils';

interface RewardSectionProps {
  habits: Habit[];
}

const REWARD_LEVEL_LABELS: Record<RewardLevel, string> = {
  low: 'Petit pas',
  medium: 'Momentum',
  high: 'Top',
  epic: 'Épique',
};

const REWARD_LEVEL_STYLES: Record<RewardLevel, string> = {
  low: 'bg-slate-100 text-slate-700 border-slate-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-300',
  high: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  epic: 'bg-amber-200 text-amber-900 border-amber-400',
};

const RewardSection: React.FC<RewardSectionProps> = ({ habits }) => {
  if (habits.length === 0) return null;

  const todayIdx = getCurrentDayIndex();
  const chain = computeChain(habits, todayIdx);
  const habitCompletedToday = chain.calendar.length > 0 && chain.calendar[chain.calendar.length - 1].completed;
  const activeToday = habits.filter((h) => isHabitActiveOnDay(h, todayIdx));
  const remainingToday = activeToday.filter((h) => !h.progress[todayIdx]);
  const allHabitsCompletedToday =
    habitCompletedToday && activeToday.length > 0 && remainingToday.length === 0;
  const chainProtected = habitCompletedToday && chain.length >= 3;
  const weeklyCompletionRate = getWeeklyCompletionRate(habits, todayIdx);

  const reward = computeDopamineReward({
    habitCompletedToday,
    allHabitsCompletedToday,
    currentStreak: chain.length,
    chainLength: chain.length,
    chainProtected,
    weeklyCompletionRate,
    dayOfWeek: new Date().getDay(),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card bg-gradient-to-br from-amber-50 to-orange-50/30 border border-amber-200"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Sparkles className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Ta récompense du jour</h2>
            <p className="text-sm text-slate-600">Micro-récompense</p>
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold border ${REWARD_LEVEL_STYLES[reward.rewardLevel]}`}
        >
          {REWARD_LEVEL_LABELS[reward.rewardLevel]}
        </span>
      </div>

      <div className="flex items-start gap-3 p-4 rounded-xl bg-white/80 border border-amber-200">
        <span className="text-3xl flex-shrink-0" aria-hidden>
          {reward.emoji}
        </span>
        <div>
          <p className="font-bold text-slate-800 text-lg">{reward.title}</p>
          <p className="text-sm text-slate-700 mt-1">{reward.message}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default RewardSection;
