import React from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { buildDailyEvidence, computeCredibilityScore } from '@/utils/credibilityScore';
import { useToolEvidence } from '@/components/ComplementaryEvidence';
import { VizDesireNode } from '@/types';

/**
 * CONCEPT 2 — Tribunal de la Vie.
 * Témoins (preuves d'habitudes) vs Accusateurs → balance animée → Crédibilité.
 * Réutilise buildDailyEvidence + computeCredibilityScore (zéro recalcul).
 */
const TribunalMode: React.FC<{ desire: VizDesireNode }> = ({ desire }) => {
    const habits = useAppStore((s) => s.habits);
    const accusers = useAppStore((s) => s.accusers);
    const dailyMoods = useAppStore((s) => s.dailyMoods);
    const { activeToolCount } = useToolEvidence();

    const identityIds = desire.identityNodes.map((n) => n.id);
    const desireAccusers = accusers.filter((a) => a.linkedDesireId === desire.id);

    const moodsMap = new Map(dailyMoods.map((m) => [m.date, m.score]));
    const evidence = buildDailyEvidence(habits, identityIds, moodsMap, desireAccusers, 30);
    const complementaryBonus = Math.min(15, activeToolCount * 3);
    const score = computeCredibilityScore(desire.id, evidence, complementaryBonus);

    const witnesses = score.actionScore + score.alignmentScore;
    const total = witnesses + score.accuserPenalty || 1;
    const tilt = ((witnesses - score.accuserPenalty) / total) * 14; // degrés max

    return (
        <div className="flex flex-col items-center">
            <h3 className="text-lg font-semibold text-slate-800 mb-1">Tribunal de la Vie</h3>
            <p className="text-sm text-slate-500 mb-4 text-center max-w-md">
                Témoins = preuves accumulées · Accusateurs = comportements à charge. La balance réagit en temps réel.
            </p>

            <div className="flex w-full max-w-md justify-between text-xs font-medium">
                <span className="text-emerald-600">🟢 Témoins · {Math.round(witnesses)}</span>
                <span className="text-rose-600">🔴 Accusateurs · {score.accuserPenalty}</span>
            </div>

            <svg viewBox="0 0 300 180" className="w-full max-w-md my-2">
                <line x1={150} y1={30} x2={150} y2={150} stroke="#475569" strokeWidth={3} />
                <motion.g
                    style={{ originX: '150px', originY: '40px' }}
                    animate={{ rotate: tilt }}
                    transition={{ type: 'spring', stiffness: 60, damping: 10 }}
                >
                    <motion.line x1={150} y1={40} x2={70} y2={120} stroke="#10b981" strokeWidth={4} />
                    <motion.line x1={150} y1={40} x2={230} y2={120} stroke="#f43f5e" strokeWidth={4} />
                    <circle cx={70} cy={124} r={10} fill="#10b981" />
                    <circle cx={230} cy={124} r={10} fill="#f43f5e" />
                    <circle cx={150} cy={40} r={7} fill="#475569" />
                </motion.g>
                <text x={150} y={172} textAnchor="middle" className="fill-slate-700 text-[13px] font-bold">
                    Crédibilité : {score.total}%
                </text>
            </svg>

            <div className="text-sm font-medium px-3 py-1.5 rounded-full bg-slate-100 text-slate-700">
                {score.verdict === 'favorable' && '⚖️ Dossier solide — le Tribunal penche en ta faveur'}
                {score.verdict === 'mitigé' && '⚖️ Dossier incomplet — le Tribunal attend plus de preuves'}
                {score.verdict === 'défavorable' && '⚖️ Dossier faible — les accusateurs dominent'}
            </div>

            <div className="flex gap-3 mt-4 text-xs text-slate-500">
                <span>Action {score.actionScore}%</span>
                <span>Alignement {score.alignmentScore}%</span>
                <span>Pénalité {score.accuserPenalty}%</span>
            </div>
            {complementaryBonus > 0 && (
                <p className="text-[11px] text-indigo-500 mt-1">+{complementaryBonus} bonus outils complémentaires</p>
            )}
        </div>
    );
};

export default TribunalMode;
