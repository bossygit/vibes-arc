import React, { useMemo } from 'react';
import { BookOpen, ArrowUp, Lightbulb } from 'lucide-react';
import { EmotionalFrequency } from '@/types';

// ============================================================
// 22 Processus d'Abraham Hicks (Ask and It Is Given)
// ============================================================

interface Process {
    number: number;
    name: string;
    shortDescription: string;
    icon: string;
}

const ALL_PROCESSES: Process[] = [
    { number: 1,  name: 'The Rampage of Appreciation',     shortDescription: 'Liste tout ce que tu apprécies, jusqu\'à sentir le shift',             icon: '🙏' },
    { number: 2,  name: 'The Magical Creation Box',        shortDescription: 'Place tes désirs dans une boîte imaginaire et laisse l\'Univers gérer', icon: '📦' },
    { number: 3,  name: 'The Creative Workshop',           shortDescription: 'Visualise-toi dans un atelier, créant ta réalité idéale',            icon: '🎨' },
    { number: 4,  name: 'Virtual Reality',                 shortDescription: 'Imagine la réalité que tu veux comme si tu y étais déjà',          icon: '🥽' },
    { number: 5,  name: 'The Prosperity Game',             shortDescription: 'Joue à dépenser de l\'argent imaginaire pour activer l\'abondance',   icon: '💰' },
    { number: 6,  name: 'The Process of Meditation',       shortDescription: '15 min de silence pour calmer le mental et se reconnecter',      icon: '🧘' },
    { number: 7,  name: 'Evaluating Dreams',               shortDescription: 'Analyse tes rêves pour comprendre ton point d\'attraction',       icon: '🌙' },
    { number: 8,  name: 'The Book of Positive Aspects',    shortDescription: 'Écris les aspects positifs d\'un sujet qui te résiste',           icon: '📖' },
    { number: 9,  name: 'Scripting',                       shortDescription: 'Écris le scénario de ta vie idéale comme si c\'était déjà fait',  icon: '✍️' },
    { number: 10, name: 'The Place Mat Process',           shortDescription: 'Dessine un cercle et place tes intentions au centre',            icon: '🎯' },
    { number: 11, name: 'Segment Intending',               shortDescription: 'Définis l\'intention de chaque segment de ta journée',           icon: '🗂️' },
    { number: 12, name: 'Wouldn\'t It Be Nice If...?',     shortDescription: 'Joue avec des pensées légères : « Et si c\'était facile ? »',    icon: '💭' },
    { number: 13, name: 'Which Thought Feels Better?',     shortDescription: 'Compare deux pensées et choisis celle qui soulage',             icon: '⚖️' },
    { number: 14, name: 'Clearing Clutter for Clarity',    shortDescription: 'Range ton espace physique pour libérer ton espace mental',     icon: '🧹' },
    { number: 15, name: 'The Wallet Process',              shortDescription: 'Mets de l\'argent dans ton portefeuille et ressens l\'abondance', icon: '👛' },
    { number: 16, name: 'Pivoting',                        shortDescription: 'Dès qu\'une pensée négative surgit, pivote vers du mieux',       icon: '🔄' },
    { number: 17, name: 'The Focus Wheel Process',         shortDescription: 'Place une intention au centre et rayonne des pensées alignées', icon: '☸️' },
    { number: 18, name: 'Finding the Feeling-Place',       shortDescription: 'Retrouve la sensation physique d\'un souvenir positif',         icon: '💫' },
    { number: 19, name: 'Releasing Resistance (Debt)',     shortDescription: 'Libère la charge émotionnelle liée à l\'argent',                icon: '🔓' },
    { number: 20, name: 'Turning It Over to the Manager',  shortDescription: 'Confie tes soucis à ton « Manager Universel »',                icon: '🤲' },
    { number: 21, name: 'Reclaiming Natural Healing',      shortDescription: 'Recentrage sur ta capacité innée de bien-être',               icon: '💚' },
    { number: 22, name: 'Moving Up the Emotional Scale',   shortDescription: 'Cherche la prochaine pensée qui apporte un soulignement',      icon: '🪜' },
];

// ============================================================
// Mapping: score → processus recommandés
// Basé sur la table du Book of Processes (Esther Hicks)
// ============================================================

const SCORE_TO_PROCESSES: Record<number, number[]> = {
    1:  [1, 2, 3],
    2:  [1, 2, 3, 9, 10],
    3:  [1, 2, 3],
    4:  [1, 3, 11, 12, 13, 14],
    5:  [1, 3],
    6:  [9, 15],
    7:  [],
    8:  [16, 17],
    9:  [18],
    10: [19, 20, 21],
    11: [10, 11, 19, 20, 21],
    12: [19, 20, 21],
    13: [19, 20, 21],
    14: [19, 20, 21],
    15: [19, 20, 21],
    16: [12, 13, 14, 15, 19, 20, 21],
    17: [22, 19, 20, 21],
    18: [22],
    19: [22],
    20: [22],
    21: [22],
    22: [22],
};

// Processus universels (tous scores)
const UNIVERSAL_PROCESSES = [6]; // Méditation — toujours recommandé

// ============================================================
// Component
// ============================================================

interface Props {
    score: EmotionalFrequency;
    compact?: boolean;
}

const ProcessRecommender: React.FC<Props> = ({ score, compact = false }) => {
    const recommended = useMemo(() => {
        const specific = SCORE_TO_PROCESSES[score] || [];
        const all = [...new Set([...UNIVERSAL_PROCESSES, ...specific])];

        return all
            .map((num) => ALL_PROCESSES.find((p) => p.number === num)!)
            .filter(Boolean)
            .slice(0, compact ? 2 : 4);
    }, [score, compact]);

    if (recommended.length === 0) return null;

    return (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <h4 className="text-sm font-semibold text-gray-700">
                    Processus recommandés
                </h4>
                <span className="text-[10px] text-gray-400 font-normal">
                    (Ask and It Is Given)
                </span>
            </div>

            <div className="space-y-2">
                {recommended.map((proc) => (
                    <div
                        key={proc.number}
                        className="flex items-start gap-3 p-2.5 bg-white rounded-lg border border-indigo-100"
                    >
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-lg">
                            {proc.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-indigo-500">
                                    #{proc.number}
                                </span>
                                <span className="text-sm font-medium text-gray-700 truncate">
                                    {proc.name}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                                {proc.shortDescription}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Insight */}
            {score >= 15 && (
                <div className="mt-3 flex items-start gap-2 p-2.5 bg-amber-50 rounded-lg">
                    <ArrowUp className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">
                        <strong>Rappel :</strong> Ne cherche pas à sauter directement à la Joie.
                        Cherche la prochaine pensée qui apporte un <em>soulagement</em>, même minime.
                        Le Processus #22 (Moving Up the Emotional Scale) est conçu pour ça.
                    </p>
                </div>
            )}

            {score <= 7 && (
                <div className="mt-3 flex items-start gap-2 p-2.5 bg-emerald-50 rounded-lg">
                    <Lightbulb className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-emerald-700">
                        <strong>Tu es aligné.</strong> C'est le moment idéal pour les processus
                        créatifs : Scripting (#9), Creative Workshop (#3), Prosperity Game (#5).
                        Profite de cet état pour construire ton futur.
                    </p>
                </div>
            )}
        </div>
    );
};

export default ProcessRecommender;
