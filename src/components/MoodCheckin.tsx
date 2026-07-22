import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import {
    Radio,
    Zap,
    TrendingUp,
    CheckCircle2,
    Save,
    Edit3,
    Search,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { EmotionalFrequency } from '@/types';
import EmotionalTimeline from './EmotionalTimeline';

// ============================================================
// Échelle de guidance émotionnelle (Esther Hicks — 22 niveaux)
// 1 = Joie/Liberté/Amour (haut), 22 = Peur/Dépression (bas)
// ============================================================

interface FrequencyLevel {
    score: EmotionalFrequency;
    label: string;
    description: string;
    color: string;
    bgColor: string;
    borderColor: string;
    emoji: string;
}

const FREQUENCY_SCALE: FrequencyLevel[] = [
    { score: 1,  label: 'Joie / Liberté / Amour',  description: 'Connaissance, empowerment, connexion pure',        color: '#fbbf24', bgColor: 'bg-amber-50',   borderColor: 'border-amber-200',   emoji: '☀️' },
    { score: 2,  label: 'Passion',                  description: 'Énergie créatrice intense, flow',                 color: '#f59e0b', bgColor: 'bg-amber-50',   borderColor: 'border-amber-200',   emoji: '🔥' },
    { score: 3,  label: 'Enthousiasme / Bonheur',   description: 'Ardeur, eagerness, légèreté',                    color: '#f97316', bgColor: 'bg-orange-50',  borderColor: 'border-orange-200',  emoji: '🎉' },
    { score: 4,  label: 'Attente positive / Croyance', description: 'Certitude que les choses vont bien se passer', color: '#84cc16', bgColor: 'bg-lime-50',    borderColor: 'border-lime-200',    emoji: '✨' },
    { score: 5,  label: 'Optimisme',                description: 'Vision positive, confiance en l\'avenir',         color: '#22c55e', bgColor: 'bg-green-50',   borderColor: 'border-green-200',   emoji: '🌤️' },
    { score: 6,  label: 'Espoir',                   description: 'Possibilité, attente d\'un mieux',               color: '#10b981', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', emoji: '🌱' },
    { score: 7,  label: 'Contentement',             description: 'Satisfaction calme, paix intérieure',            color: '#06b6d4', bgColor: 'bg-cyan-50',    borderColor: 'border-cyan-200',    emoji: '😌' },
    { score: 8,  label: 'Ennui',                    description: 'Désintérêt, manque de stimulation',              color: '#64748b', bgColor: 'bg-slate-50',   borderColor: 'border-slate-200',   emoji: '😐' },
    { score: 9,  label: 'Pessimisme',               description: 'Attente du pire, vision sombre',                color: '#a1a1aa', bgColor: 'bg-zinc-50',    borderColor: 'border-zinc-200',    emoji: '😕' },
    { score: 10, label: 'Frustration / Impatience', description: 'Irritation, impatience, tension',               color: '#eab308', bgColor: 'bg-yellow-50',  borderColor: 'border-yellow-200',  emoji: '😤' },
    { score: 11, label: 'Accablement',              description: 'Trop de choses à gérer, submersion',            color: '#f97316', bgColor: 'bg-orange-50',  borderColor: 'border-orange-200',  emoji: '😫' },
    { score: 12, label: 'Déception',                description: 'Attentes non comblées, tristesse légère',       color: '#ef4444', bgColor: 'bg-red-50',     borderColor: 'border-red-200',     emoji: '😞' },
    { score: 13, label: 'Doute',                    description: 'Incertitude, remise en question',               color: '#dc2626', bgColor: 'bg-red-50',     borderColor: 'border-red-200',     emoji: '🤔' },
    { score: 14, label: 'Inquiétude',               description: 'Préoccupation, anxiété légère',                 color: '#b91c1c', bgColor: 'bg-red-50',     borderColor: 'border-red-200',     emoji: '😟' },
    { score: 15, label: 'Blâme',                    description: 'Accusation, reproche envers soi ou les autres', color: '#991b1b', bgColor: 'bg-red-100',    borderColor: 'border-red-300',     emoji: '👿' },
    { score: 16, label: 'Découragement',            description: 'Perte d\'élan, pessimisme profond',             color: '#7f1d1d', bgColor: 'bg-red-100',    borderColor: 'border-red-300',     emoji: '😔' },
    { score: 17, label: 'Colère',                   description: 'Rage contrôlée, indignation',                   color: '#dc2626', bgColor: 'bg-red-100',    borderColor: 'border-red-300',     emoji: '😡' },
    { score: 18, label: 'Vengeance',                description: 'Désir de représailles, rumination',             color: '#b91c1c', bgColor: 'bg-red-100',    borderColor: 'border-red-300',     emoji: '💢' },
    { score: 19, label: 'Haine / Rage',             description: 'Colère explosive, hostilité',                   color: '#991b1b', bgColor: 'bg-red-200',    borderColor: 'border-red-400',     emoji: '🤬' },
    { score: 20, label: 'Jalousie',                 description: 'Envie, comparaison douloureuse',                color: '#7f1d1d', bgColor: 'bg-red-200',    borderColor: 'border-red-400',     emoji: '🥀' },
    { score: 21, label: 'Insécurité / Culpabilité', description: 'Indignité, honte, peur du jugement',            color: '#581c87', bgColor: 'bg-purple-950', borderColor: 'border-purple-700',  emoji: '😰' },
    { score: 22, label: 'Peur / Dépression',        description: 'Impuissance, désespoir, chagrin profond',       color: '#4a044e', bgColor: 'bg-purple-950', borderColor: 'border-purple-700',  emoji: '🕳️' },
];

// ============================================================
// MoodCheckin
// ============================================================

const MoodCheckin: React.FC = () => {
    const { todayMood, dailyMoods, saveMood, loadTodayMood } = useAppStore();
    const [selectedScore, setSelectedScore] = useState<EmotionalFrequency | null>(null);
    const [dominantEmotion, setDominantEmotion] = useState('');
    const [notes, setNotes] = useState('');
    const [causes, setCauses] = useState('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [editing, setEditing] = useState(false);

    useEffect(() => {
        loadTodayMood();
    }, []);

    // Si déjà check-in aujourd'hui, pré-remplir
    useEffect(() => {
        if (todayMood && !editing) {
            setSelectedScore(todayMood.score);
            setDominantEmotion(todayMood.dominantEmotion || '');
            setNotes(todayMood.notes || '');
            setCauses(todayMood.causes || '');
        }
    }, [todayMood, editing]);

    const selectedLevel = selectedScore
        ? FREQUENCY_SCALE.find((l) => l.score === selectedScore)
        : null;

    const handleSave = async () => {
        if (!selectedScore) return;
        setSaving(true);
        try {
            await saveMood(
                selectedScore,
                dominantEmotion.trim() || undefined,
                notes.trim() || undefined,
                causes.trim() || undefined
            );
            setSaved(true);
            setEditing(false);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error('Erreur sauvegarde mood:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = () => {
        setEditing(true);
    };

    const isTodayChecked = todayMood !== null && !editing;

    // Zone vibratoire du jour (échelle inversée : 1=meilleur, 22=pire)
    const zone =
        selectedScore && selectedScore <= 7
            ? 'alignement'
            : selectedScore && selectedScore >= 15
            ? 'résistance'
            : 'neutre';

    const zoneConfig = {
        alignement: {
            label: "Zone d'alignement",
            bg: 'from-emerald-500/10 to-green-500/10',
            text: 'text-emerald-700',
            icon: '📡',
            message: 'Tu es aligné avec ta Source. Le Tribunal enregistre des preuves fortes.',
        },
        neutre: {
            label: 'Zone neutre',
            bg: 'from-amber-500/10 to-yellow-500/10',
            text: 'text-amber-700',
            icon: '⏸️',
            message: 'Ni pleinement aligné ni en forte résistance. Les preuves sont tièdes.',
        },
        résistance: {
            label: 'Zone de résistance',
            bg: 'from-red-500/10 to-orange-500/10',
            text: 'text-red-700',
            icon: '🚫',
            message: 'Tu résistes à ta connexion. Les accusateurs pèsent plus lourd aujourd\'hui.',
        },
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <section className="rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-700 text-white p-6 md:p-8">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-white/15 rounded-xl flex-shrink-0">
                        <Radio className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Check-in Vibratoire</h1>
                        <p className="text-white/70 text-sm mt-1 max-w-md">
                            « Tes émotions sont ton guidance system. »
                            <br />
                            <span className="text-white/50 text-xs">— Esther Hicks</span>
                        </p>
                    </div>
                </div>
            </section>

            {/* Today's state (already checked in) */}
            {isTodayChecked && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                                style={{ backgroundColor: selectedLevel?.color + '20' }}
                            >
                                {selectedLevel?.emoji}
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Aujourd'hui</p>
                                <p className="text-lg font-bold" style={{ color: selectedLevel?.color }}>
                                    {selectedLevel?.label} — {selectedScore}/10
                                </p>
                                {todayMood?.dominantEmotion && (
                                    <p className="text-sm text-gray-500">
                                        Émotion : {todayMood.dominantEmotion}
                                    </p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={handleEdit}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-50"
                        >
                            <Edit3 className="w-4 h-4" />
                        </button>
                    </div>
                    {todayMood?.notes && (
                        <p className="mt-2 text-sm text-gray-400 italic pl-15">
                            « {todayMood.notes} »
                        </p>
                    )}
                </motion.div>
            )}

            {/* Frequency selector */}
            {(!isTodayChecked || editing) && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
                >
                    <h2 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-purple-500" />
                        {editing ? "Modifier ma fréquence d'aujourd'hui" : "Quelle est ta fréquence aujourd'hui ?"}
                    </h2>

                    {/* Scale */}
                    <div className="space-y-1.5 mb-4">
                        {FREQUENCY_SCALE.map((level) => {
                            const isSelected = selectedScore === level.score;
                            return (
                                <motion.button
                                    key={level.score}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setSelectedScore(level.score)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                                        isSelected
                                            ? `${level.bgColor} ${level.borderColor} shadow-sm`
                                            : 'border-transparent hover:bg-gray-50'
                                    }`}
                                >
                                    <span className="text-lg flex-shrink-0">{level.emoji}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="text-sm font-semibold"
                                                style={{ color: level.color }}
                                            >
                                                {level.score}
                                            </span>
                                            <span className="text-sm text-gray-700 truncate">
                                                {level.label}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-400 truncate">
                                            {level.description}
                                        </p>
                                    </div>
                                    <div
                                        className={`w-3 h-3 rounded-full border-2 flex-shrink-0 transition-colors ${
                                            isSelected ? 'border-current' : 'border-gray-300'
                                        }`}
                                        style={
                                            isSelected
                                                ? { borderColor: level.color, backgroundColor: level.color }
                                                : {}
                                        }
                                    />
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* Selected zone indicator */}
                    {selectedScore && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className={`rounded-xl bg-gradient-to-r ${zoneConfig[zone].bg} p-3 mb-4`}
                        >
                            <p className={`text-sm font-medium ${zoneConfig[zone].text} flex items-center gap-2`}>
                                <span>{zoneConfig[zone].icon}</span>
                                {zoneConfig[zone].label} — {selectedLevel?.score}/10
                            </p>
                            <p className={`text-xs mt-1 ${zoneConfig[zone].text} opacity-80`}>
                                {zoneConfig[zone].message}
                            </p>
                        </motion.div>
                    )}

                    {/* Dominant emotion */}
                    {selectedScore && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-3"
                        >
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                    Émotion dominante (optionnel)
                                </label>
                                <input
                                    type="text"
                                    value={dominantEmotion}
                                    onChange={(e) => setDominantEmotion(e.target.value)}
                                    placeholder="anxiété, gratitude, frustration..."
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                    Note (optionnel)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Ce qui se passe en moi..."
                                    rows={2}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                                    <Search className="w-3 h-3" />
                                    Causes (optionnel) — qu'est-ce qui a influencé cet état ?
                                </label>
                                <textarea
                                    value={causes}
                                    onChange={(e) => setCauses(e.target.value)}
                                    placeholder="Client stressant, deadline non tenue, bonne nuit de sommeil, méditation du matin..."
                                    rows={2}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                                />
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={saving || !selectedScore}
                                className="w-full py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl font-semibold hover:from-violet-700 hover:to-fuchsia-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    'Enregistrement...'
                                ) : saved ? (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        Enregistré !
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        S'accorder sur cette fréquence
                                    </>
                                )}
                            </button>
                        </motion.div>
                    )}
                </motion.div>
            )}

            {/* Timeline 30 jours */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-500" />
                    Territoire émotionnel — 30 derniers jours
                </h3>
                <EmotionalTimeline moods={dailyMoods} daysBack={30} />
            </div>

            {/* Esther Hicks quote */}
            <blockquote className="text-center text-xs text-gray-400 italic px-6">
                « The better you feel, the more you are allowing your connection to Source Energy. »
                <br />
                <span className="text-gray-300">— Esther Hicks, Ask and It Is Given</span>
            </blockquote>
        </div>
    );
};

export default MoodCheckin;
