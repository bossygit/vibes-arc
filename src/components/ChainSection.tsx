import React from 'react';
import { Flame, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Habit } from '@/types';
import { getCurrentDayIndex } from '@/utils/habitUtils';
import { computeChain, type ChainStatus } from '@/utils/chainUtils';

interface ChainSectionProps {
  habits: Habit[];
}

const STATUS_LABELS: Record<ChainStatus, string> = {
  broken: 'Cassée',
  fragile: 'Fragile',
  stable: 'Stable',
  strong: 'Solide',
};

const STATUS_STYLES: Record<ChainStatus, string> = {
  broken: 'bg-slate-100 text-slate-600 border-slate-200',
  fragile: 'bg-amber-100 text-amber-800 border-amber-300',
  stable: 'bg-green-100 text-green-800 border-green-300',
  strong: 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-900 border-amber-400',
};

const ChainSection: React.FC<ChainSectionProps> = ({ habits }) => {
  if (habits.length === 0) return null;

  const todayIdx = getCurrentDayIndex();
  const chain = computeChain(habits, todayIdx);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-slate-200"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Flame className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Never Break the Chain</h2>
            <p className="text-sm text-slate-600">
              {chain.length === 0
                ? 'Aucun jour consécutif'
                : chain.length === 1
                  ? '1 jour d’affilée'
                  : `${chain.length} jours d’affilée`}
            </p>
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_STYLES[chain.status]}`}
        >
          {STATUS_LABELS[chain.status]}
        </span>
      </div>

      {/* 14 jours : gauche = ancien, droite = aujourd'hui */}
      <div
        className="flex flex-wrap gap-1.5 mb-4"
        role="list"
        aria-label="Chaîne des 14 derniers jours"
      >
        {chain.calendar.map((day, i) => {
          const isToday = i === chain.calendar.length - 1;
          const dateLabel = format(new Date(day.date + 'T12:00:00'), 'd MMM', { locale: fr });
          const label = day.completed
            ? `${dateLabel} : complété`
            : `${dateLabel} : non complété`;
          return (
            <div
              key={day.date}
              role="listitem"
              aria-label={label}
              title={label}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition ${
                day.completed
                  ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow'
                  : 'bg-slate-200 text-slate-500'
              } ${isToday && chain.pressure ? 'ring-2 ring-amber-500 ring-offset-2' : ''}`}
            >
              {day.completed ? (
                <Flame className="w-4 h-4" aria-hidden />
              ) : (
                <span className="w-4 h-4 block rounded bg-slate-300" aria-hidden />
              )}
            </div>
          );
        })}
      </div>

      {chain.pressure && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 p-4 bg-amber-100 rounded-lg border border-amber-300"
        >
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm font-medium text-amber-900">
            Ta chaîne de {chain.length} jours a besoin d’aujourd’hui. Ne la casse pas.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ChainSection;
