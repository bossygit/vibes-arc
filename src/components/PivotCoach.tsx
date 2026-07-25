import React, { useState, useCallback } from 'react';
import { RefreshCw, ChevronRight, Lightbulb, ArrowUpRight, Heart, X } from 'lucide-react';
import { EmotionalFrequency, EMOTIONAL_LABELS, getAlignmentZone } from '@/types';

interface PivotEntry {
    id: string;
    timestamp: string;
    originalThought: string;
    originalEmotionScore: EmotionalFrequency;
    pivotThought: string;
    newEmotionScore: EmotionalFrequency;
    notes?: string;
}

interface PivotResponse {
    detectedEmotion: string;
    emotionScore: EmotionalFrequency;
    zone: 'alignement' | 'neutre' | 'résistance';
    pivotQuestion: string;
    suggestedThought: string;
    suggestedScore: EmotionalFrequency;
    microExercise: string;
    coachLine: string;
}

const SCALE: { score: EmotionalFrequency; label: string; color: string }[] = [
    { score: 1,  label: 'Joie / Liberté / Amour',              color: 'emerald' },
    { score: 2,  label: 'Passion',                              color: 'emerald' },
    { score: 3,  label: 'Enthousiasme / Bonheur',               color: 'emerald' },
    { score: 4,  label: 'Attente positive / Croyance',         color: 'emerald' },
    { score: 5,  label: 'Optimisme',                            color: 'emerald' },
    { score: 6,  label: 'Espoir',                               color: 'emerald' },
    { score: 7,  label: 'Contentement',                         color: 'blue' },
    { score: 8,  label: 'Ennui',                                color: 'slate' },
    { score: 9,  label: 'Pessimisme',                           color: 'amber' },
    { score: 10, label: 'Frustration / Irritation',            color: 'amber' },
    { score: 11, label: 'Accablement',                          color: 'orange' },
    { score: 12, label: 'Déception',                            color: 'orange' },
    { score: 13, label: 'Doute',                                color: 'orange' },
    { score: 14, label: 'Inquiétude',                           color: 'orange' },
    { score: 15, label: 'Blâme',                               color: 'red' },
    { score: 16, label: 'Découragement',                        color: 'red' },
    { score: 17, label: 'Colère',                               color: 'red' },
    { score: 18, label: 'Vengeance',                            color: 'red' },
    { score: 19, label: 'Haine / Rage',                         color: 'red' },
    { score: 20, label: 'Jalousie',                             color: 'red' },
    { score: 21, label: 'Insécurité / Culpabilité',            color: 'red' },
    { score: 22, label: 'Peur / Dépression / Impuissance',     color: 'red' },
];

function getColorClass(zone: string): string {
    switch (zone) {
        case 'alignement': return 'bg-emerald-50 border-emerald-200 text-emerald-900';
        case 'neutre': return 'bg-amber-50 border-amber-200 text-amber-900';
        case 'résistance': return 'bg-red-50 border-red-200 text-red-900';
        default: return 'bg-slate-50 border-slate-200 text-slate-900';
    }
}

function getZoneLabel(zone: string): string {
    switch (zone) {
        case 'alignement': return 'Alignement ✓';
        case 'neutre': return 'Neutre ⏸️';
        case 'résistance': return 'Résistance 🔴';
        default: return '';
    }
}

const PIVOT_RESPONSES: Record<number, PivotResponse> = {
    1:  { detectedEmotion: 'Joie / Connaissance / Liberté / Amour', emotionScore: 1, zone: 'alignement', pivotQuestion: 'Qu\'est-ce qui te maintient dans cette fluidité ?', suggestedThought: 'Continue à nourrir ce que tu ressens — c\'est ta Source qui te parle directement.', suggestedScore: 1, microExercise: 'Écris 3 choses que cette énergie te permet de voir que tu n\'avais pas remarqué avant.', coachLine: 'Tu es dans le vortex. Ne force pas — laisse couler.' },
    2:  { detectedEmotion: 'Passion', emotionScore: 2, zone: 'alignement', pivotQuestion: 'Qu\'est-ce que cette passion t\'incite à créer ?', suggestedThought: 'Laisse cette énergie créatrice te guider vers une action inspirée.', suggestedScore: 2, microExercise: 'Identifie une petite action que tu peux poser aujourd\'hui dans l\'élan de cette passion.', coachLine: 'La passion est le moteur — canalise-la dans une action concrète, même minuscule.' },
    3:  { detectedEmotion: 'Enthousiasme / Ardeur / Bonheur', emotionScore: 3, zone: 'alignement', pivotQuestion: 'Qu\'est-ce qui te rend si vivant en ce moment ?', suggestedThought: 'Cette joie est une preuve que ton point d\'attraction fonctionne.', suggestedScore: 3, microExercise: 'Partage cette énergie avec quelqu\'un ou écris-la dans ton Book of Positive Aspects.', coachLine: 'Tu es littéralement dans le flow — profites-en pour inscrire cette vibration.' },
    4:  { detectedEmotion: 'Attente positive / Croyance', emotionScore: 4, zone: 'alignement', pivotQuestion: 'Qu\'est-ce en lequel tu as confiance en ce moment ?', suggestedThought: 'Ta croyance est un aimant — continue de la nourrir avec des pensées de certitude.', suggestedScore: 4, microExercise: 'Formule une phrase : « Je sais que ___ parce que ___ » et ressens la certitude.', coachLine: 'La croyance est la fondation — les résultats suivent toujours.' },
    5:  { detectedEmotion: 'Optimisme', emotionScore: 5, zone: 'alignement', pivotQuestion: 'De quoi est-ce que tu te réjouis ?', suggestedThought: 'Ton optimisme est un signal que l\'Univers se range du côté de ce que tu veux.', suggestedScore: 5, microExercise: 'Nomme 2 choses qui te semblaient difficiles il y a une semaine mais qui se sont adoucies.', coachLine: 'L\'optimisme est le signe que ta vibration a commencé à se décaler vers le wanted.' },
    6:  { detectedEmotion: 'Espoir', emotionScore: 6, zone: 'alignement', pivotQuestion: 'Qu\'est-ce qui te donne l\'impression qu\'un mieux est possible ?', suggestedThought: 'Même infime, ce signal d\'espoir est une preuve que tu te diriges vers la joie.', suggestedScore: 6, microExercise: 'Décris la sensation physique de cet espoir dans ton corps — où se situe-t-elle ?', coachLine: 'L\'espoir est l\'élan. Ne le réprime pas — laisse-le amplifier.' },
    7:  { detectedEmotion: 'Contentement', emotionScore: 7, zone: 'alignement', pivotQuestion: 'Qu\'est-ce qui a permis ce calme ?', suggestedThought: 'Le contentement est ta vibration naturelle quand tu cesses d\'agiter le mental.', suggestedScore: 7, microExercise: 'Sors-toi du mental pendant 60 secondes : ressens le poids de ton corps sur ta chaise.', coachLine: 'Le contentement n\'est pas le résultat — c\'est la preuve que tu es revenu à qui tu es vraiment.' },
    8:  { detectedEmotion: 'Ennui', emotionScore: 8, zone: 'neutre', pivotQuestion: 'Qu\'est-ce qui te manque vraiment en ce moment ?', suggestedThought: 'L\'ennui est un signal que tu as besoin de stimulation alignée — pas de plus de distraction.', suggestedScore: 8, microExercise: 'Demande-toi : « Qu\'est-ce que j\'aimerais apprendre ou explorer aujourd\'hui ? » même une petite chose.', coachLine: 'L\'ennui n\'est pas vide — il est en attente d\'être rempli par quelque chose d\'aligné.' },
    9:  { detectedEmotion: 'Pessimisme', emotionScore: 9, zone: 'neutre', pivotQuestion: 'Qu\'est-ce qui te fait douter du résultat ?', suggestedThought: 'Le pessimisme est une protection. Cherche un seul élément qui ne correspond pas à la pensée pessimiste.', suggestedScore: 8, microExercise: 'Trouve un petit fait du passé récent qui prouve le contraire de ton pessimisme.', coachLine: 'Le pessimisme se nourrit de l\'attention. Donne-lui un élément qui le contredit — même petit.' },
    10: { detectedEmotion: 'Frustration / Irritation', emotionScore: 10, zone: 'neutre', pivotQuestion: 'Qu\'est-ce que tu n\'as pas obtenu que tu voulais ?', suggestedThought: 'La frustration signale un décalage entre ce que tu veux et ce qui est présent. Reviens à ce que tu veux.', suggestedScore: 8, microExercise: 'Complète cette phrase : « Je veux ___ » puis immédiatement : « Pourquoi ___ est-ce important pour moi ? »', coachLine: 'La frustration est un signal d\'alignement — elle te dit que tu sais exactement ce que tu veux.' },
    11: { detectedEmotion: 'Accablement', emotionScore: 11, zone: 'neutre', pivotQuestion: 'Quelle est la partie la plus lourde de ce que tu ressens ?', suggestedThought: 'L\'accablement vient de la surcharge. Réduis le sujet à un seul pas faisable.', suggestedScore: 9, microExercise: 'Identifie la plus petite action possible sur le sujet — même 2 minutes.', coachLine: 'Quand tout semble trop lourd, un seul pas minuscule suffit à sortir de l\'immobilité.' },
    12: { detectedEmotion: 'Déception', emotionScore: 12, zone: 'neutre', pivotQuestion: 'Quelle attente n\'a pas été satisfaite ?', suggestedThought: 'La déception est la preuve que tu sais mieux que ce que tu as. Redirige ta vers une version améliorée.', suggestedScore: 8, microExercise: 'Imagine le même scénario dans 90 jours — qu\'est-ce qui aurait pu se passer de mieux ?', coachLine: 'La déception est une boussole — elle montre où est ta limite, pas ta destination finale.' },
    13: { detectedEmotion: 'Doute', emotionScore: 13, zone: 'neutre', pivotQuestion: 'En quoi est-ce que tu doutes exactement ?', suggestedThought: 'Le doute n\'est pas l\'échec — c\'est l\'incertitude avant la clarté. Choisis une direction, n\'importe laquelle, qui te soulage.', suggestedScore: 9, microExercise: 'Écris ta pensée la plus douteuse, puis immédiatement à côté : « Ou bien... » et finis la phrase.', coachLine: 'Le doute se dissout dans l\'action — même une micro-action choisit une direction.' },
    14: { detectedEmotion: 'Inquiétude', emotionScore: 14, zone: 'neutre', pivotQuestion: 'Quelle est la pire éventualité qui te hante ?', suggestedThought: 'L\'inquiétude est un mécanisme de protection. Rappelle-toi : tu es plus capable que ce que tu crois.', suggestedScore: 10, microExercise: 'Complète : « Et si je faisais ___ pour être tranquille ? » Même une action symbolique.', coachLine: 'L\'inquiétude cherche toujours un plan — donne-lui un micro-plan et tu reprends le contrôle.' },
    15: { detectedEmotion: 'Blâme', emotionScore: 15, zone: 'résistance', pivotQuestion: 'À qui ou à quoi tu attribues ce qui ne va pas ?', suggestedThought: 'Le blâme est un bouclier contre la responsabilité. Et si c\'était du pouvoir ?', suggestedScore: 14, microExercise: 'Trouve un élément de contrôle — même minuscule — dans la situation que tu blâmes.', coachLine: 'Le blâme te met en position de victime. Cherche le levier que tu possèdes — même un tout petit.' },
    16: { detectedEmotion: 'Découragement', emotionScore: 16, zone: 'résistance', pivotQuestion: 'Qu\'est-ce qui t\'a découragé ?', suggestedThought: 'Le découragement est la somme de trop petites déceptions. Choisis une seule chose à alléger.', suggestedScore: 14, microExercise: 'Fais une liste de 3 choses qui n\'ont pas marché — puis à côté de chacune, écris ce que tu en tires.', coachLine: 'Le découragement est du découragement accumulé. Une seule prise de recul le commence à dissiper.' },
    17: { detectedEmotion: 'Colère', emotionScore: 17, zone: 'résistance', pivotQuestion: 'Qu\'est-ce qui t\'a mis en colère exactement ?', suggestedThought: 'La colère est de la frustration concentrée — elle vient du désir d\'un résultat que tu n\'as pas pu avoir.', suggestedScore: 15, microExercise: 'Écris la phrase « Je suis en colère parce que je veux ___ » sans filtrer. Puis : « Et ce que je veux vraiment, c\'est ___ »', coachLine: 'La colère est du carburant. Redirige-la vers ce que tu veux — elle devient de la passion.' },
    18: { detectedEmotion: 'Vengeance', emotionScore: 18, zone: 'résistance', pivotQuestion: 'Quelle blessure sous-tend cette envie de représailles ?', suggestedThought: 'La vengeance est un appel à être traité avec justice — c\'est une émotion protectrice, destructible si tu restes dessus.', suggestedScore: 15, microExercise: 'Écris : « Je veux me sentir ___ » — déplace le focus de l\'autre vers toi.', coachLine: 'La vengeance te maintient lié à ce qui t\'a blessé. La meilleure revanche est de ne plus être affecté.' },
    19: { detectedEmotion: 'Haine / Rage', emotionScore: 19, zone: 'résistance', pivotQuestion: 'Quelle est la partie qui te fait le plus souffrir dans cette haine ?', suggestedThought: 'La haine est un cry pour être entendu. Derrière la haine, il y a toujours une émotion plus douce qui appelle.', suggestedScore: 16, microExercise: 'Dis à voix haute : « Je suis en colère parce que j\'ai besoin de ___ » — laisse sortir la vulnérabilité.', coachLine: 'La haine est le dernier rempart avant la douleur. Traverse-la et tu trouveras la blessure que tu veux guérir.' },
    20: { detectedEmotion: 'Jalousie', emotionScore: 20, zone: 'résistance', pivotQuestion: 'Qu\'est-ce que l\'autre a que tu veux ?', suggestedThought: 'La jalousie te montre exactement ce que tu désires — elle est une boussole vers ce que tu veux créer pour toi.', suggestedScore: 17, microExercise: 'Écris : « Je veux ___ comme ___ » puis transforme en : « Je vais créer ___ de ma propre façon ».', coachLine: 'La jalousie n\'est pas une compétition — c\'est un miroir qui te montre ton prochain désir.' },
    21: { detectedEmotion: 'Insécurité / Culpabilité / Indignité', emotionScore: 21, zone: 'résistance', pivotQuestion: 'Qu\'est-ce que tu te reproches ?', suggestedThought: 'L\'insécurité est une défense. Au fond, tu sais que tu mérites — ta peur te le rappelle.', suggestedScore: 17, microExercise: 'Complète : « Je mérite ___ parce que je suis ___ » — deux complétions, pas de filtres.', coachLine: 'L\'insécurité est l\'illusion que tu n\'es pas assez. Tu es exactement la personne qui peut faire le prochain pas.' },
    22: { detectedEmotion: 'Peur / Chagrin / Dépression / Impuissance', emotionScore: 22, zone: 'résistance', pivotQuestion: 'Si tu pouvais nommer UNE chose qui t\'effraie en ce moment, ce serait quoi ?', suggestedThought: 'La peur est le signal que tu t\'éloignes de ce que tu veux. Reviens à ta sensation : je veux me sentir ___.', suggestedScore: 18, microExercise: 'Nomme une seule petite chose dans ton environnement qui est douce ou belle — un son, une texture, une couleur. Ressens-la pendant 30 secondes.', coachLine: 'Quand tout semble écrasant, retourne au corps. Rends-toi à un seul détail — c\'est le premier pas de retour.' },
};

function getPivotSuggestion(score: EmotionalFrequency): PivotResponse {
    return PIVOT_RESPONSES[score] ?? PIVOT_RESPONSES[15];
}

interface Props {
    currentMoodScore?: EmotionalFrequency;
    onPivotComplete?: (entry: PivotEntry) => void;
}

const PivotCoach: React.FC<Props> = ({ currentMoodScore, onPivotComplete }) => {
    const [step, setStep] = useState<'input' | 'response' | 'history'>('input');
    const [thought, setThought] = useState('');
    const [emotionScore, setEmotionScore] = useState<EmotionalFrequency>(10);
    const [pivotResult, setPivotResult] = useState<PivotResponse | null>(null);
    const [notes, setNotes] = useState('');
    const [history, setHistory] = useState<PivotEntry[]>(() => {
        try {
            const raw = localStorage.getItem('vibes-arc-pivot-history');
            if (!raw) return [];
            return JSON.parse(raw);
        } catch { return []; }
    });

    const zone = getAlignmentZone(emotionScore);

    const saveToHistory = useCallback((entry: PivotEntry) => {
        const updated = [...history, entry];
        setHistory(updated);
        localStorage.setItem('vibes-arc-pivot-history', JSON.stringify(updated));
    }, [history]);

    const handleSubmit = useCallback(() => {
        if (!thought.trim()) return;
        const result = getPivotSuggestion(emotionScore);
        setPivotResult(result);
        setStep('response');
    }, [thought, emotionScore]);

    const handleAcceptPivot = useCallback(() => {
        if (!pivotResult) return;
        const entry: PivotEntry = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            originalThought: thought,
            originalEmotionScore: emotionScore,
            pivotThought: pivotResult.suggestedThought,
            newEmotionScore: pivotResult.suggestedScore,
            notes: notes || undefined,
        };
        saveToHistory(entry);
        onPivotComplete?.(entry);
        setThought('');
        setNotes('');
        setStep('input');
        setPivotResult(null);
    }, [pivotResult, thought, emotionScore, notes, saveToHistory, onPivotComplete]);

    const reset = useCallback(() => {
        setThought('');
        setNotes('');
        setPivotResult(null);
        setStep('input');
    }, []);

    const colorMap: Record<string, string> = {
        emerald: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        blue: 'bg-blue-100 text-blue-800 border-blue-300',
        slate: 'bg-slate-100 text-slate-700 border-slate-300',
        amber: 'bg-amber-100 text-amber-800 border-amber-300',
        orange: 'bg-orange-100 text-orange-800 border-orange-300',
        red: 'bg-red-100 text-red-800 border-red-300',
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <RefreshCw className="w-6 h-6 text-purple-500" />
                        Pratique du Pivot
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Quand une pensée te tire hors d\'alignement, saisis-la et pivote.
                    </p>
                </div>
                <button
                    onClick={() => setStep('history')}
                    className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1"
                >
                    <Lightbulb className="w-4 h-4" />
                    {history.length} pivots
                </button>
            </div>

            {step === 'input' && (
                <div className="space-y-6">
                    <div className="card bg-white border border-slate-200 p-6">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Quelle pensée te sort de ton alignement en ce moment ?
                        </label>
                        <textarea
                            value={thought}
                            onChange={e => setThought(e.target.value)}
                            rows={4}
                            placeholder="Ex: « je n\'y arriverai jamais », « il fait trop chaud pour commencer », « je ne vois pas l\'intérêt »..."
                            className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none resize-y"
                        />
                    </div>

                    <div className="card bg-white border border-slate-200 p-6">
                        <label className="block text-sm font-semibold text-slate-700 mb-3">
                            Où es-tu sur l\'échelle vibratoire ?
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {SCALE.map(item => {
                                const isSelected = emotionScore === item.score;
                                return (
                                    <button
                                        key={item.score}
                                        onClick={() => setEmotionScore(item.score)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                            isSelected ? 'ring-2 ring-purple-400 scale-105' : ''
                                        } ${colorMap[item.color] || 'bg-slate-100'}`}
                                    >
                                        {item.score} : {item.label.split(' / ')[0]}
                                    </button>
                                );
                            })}
                        </div>
                        <div className={`mt-4 p-3 rounded-lg border text-sm ${getColorClass(zone)}`}>
                            {getZoneLabel(zone)} — {EMOTIONAL_LABELS[emotionScore]}
                        </div>
                    </div>

                    {currentMoodScore != null && (
                        <div className="text-xs text-slate-400 text-center">
                            Ton humeur actuelle : ~<span className="font-medium text-slate-600">{EMOTIONAL_LABELS[currentMoodScore].split(' / ')[0]}</span> (échelle {currentMoodScore})
                        </div>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={!thought.trim()}
                        className="w-full btn-primary py-3 text-base"
                    >
                        Pivoter <ArrowUpRight className="w-4 h-4 inline" />
                    </button>
                </div>
            )}

            {step === 'response' && pivotResult && (
                <div className="space-y-6">
                    <div className={`card border p-6 ${getColorClass(pivotResult.zone)}`}>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">⚠️</span>
                            <span className="text-xs font-semibold uppercase tracking-wide">{getZoneLabel(pivotResult.zone)}</span>
                        </div>
                        <h3 className="text-lg font-bold mb-2">{pivotResult.detectedEmotion}</h3>
                        <p className="text-sm opacity-80">Niveau {pivotResult.emotionScore} sur l\'échelle</p>
                    </div>

                    <div className="card bg-purple-50 border border-purple-200 p-5">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">🧘</span>
                            <span className="text-xs font-semibold text-purple-700 uppercase">Ton Coach Vibes</span>
                        </div>
                        <p className="text-sm text-purple-900 font-medium">{pivotResult.coachLine}</p>
                    </div>

                    <div className="card bg-white border border-slate-200 p-6 space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Question du Coach</label>
                            <p className="text-slate-800 mt-1 font-medium">{pivotResult.pivotQuestion}</p>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">La pensée pivot suggérée</label>
                            <p className="text-slate-800 mt-1">{pivotResult.suggestedThought}</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-slate-500">Nouveau niveau :</span>
                            <span className={`font-bold ${
                                pivotResult.suggestedScore <= 7 ? 'text-emerald-600' :
                                pivotResult.suggestedScore <= 14 ? 'text-amber-600' : 'text-red-600'
                            }`}>
                                {EMOTIONAL_LABELS[pivotResult.suggestedScore].split(' / ')[0]} ({pivotResult.suggestedScore})
                            </span>
                            <span className="text-slate-400 text-xs">(+{pivotResult.suggestedScore - pivotResult.emotionScore})</span>
                        </div>
                    </div>

                    <div className="card bg-emerald-50 border border-emerald-200 p-5">
                        <div className="flex items-center gap-2 mb-2">
                            <Heart className="w-4 h-4 text-emerald-500" />
                            <span className="text-xs font-semibold text-emerald-700 uppercase">Micro-exercice</span>
                        </div>
                        <p className="text-sm text-emerald-900">{pivotResult.microExercise}</p>
                    </div>

                    <div className="card bg-white border border-slate-200 p-4">
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            rows={2}
                            placeholder="Comment tu te sens après ce pivot ? (optionnel)"
                            className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none resize-y"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button onClick={handleAcceptPivot} className="flex-1 btn-primary py-3">
                            J\'accepte ce pivot ✓
                        </button>
                        <button onClick={reset} className="btn-secondary px-4 py-3">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {step === 'history' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-800">Historique des pivots</h3>
                        <button onClick={() => setStep('input')} className="text-sm text-purple-600 hover:text-purple-800">
                            ← Retour
                        </button>
                    </div>
                    {history.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-8">Aucun pivot enregistré pour le moment.</p>
                    ) : (
                        <div className="space-y-3">
                            {history.slice().reverse().map(entry => (
                                <div key={entry.id} className="card bg-white border border-slate-200 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                            <p className="text-sm text-slate-700 font-medium">"{entry.originalThought}"</p>
                                            <div className="flex items-center gap-2 mt-2 text-xs">
                                                <span className={`px-2 py-0.5 rounded-full border ${
                                                    entry.originalEmotionScore <= 7 ? 'bg-emerald-100 text-emerald-700 border-emerald-300' :
                                                    entry.originalEmotionScore <= 14 ? 'bg-amber-100 text-amber-700 border-amber-300' :
                                                    'bg-red-100 text-red-700 border-red-300'
                                                }`}>
                                                    {EMOTIONAL_LABELS[entry.originalEmotionScore].split(' / ')[0]} ({entry.originalEmotionScore})
                                                </span>
                                                <ChevronRight className="w-3 h-3 text-slate-400" />
                                                <span className={`px-2 py-0.5 rounded-full border ${
                                                    entry.newEmotionScore <= 7 ? 'bg-emerald-100 text-emerald-700 border-emerald-300' :
                                                    entry.newEmotionScore <= 14 ? 'bg-amber-100 text-amber-700 border-amber-300' :
                                                    'bg-red-100 text-red-700 border-red-300'
                                                }`}>
                                                    {EMOTIONAL_LABELS[entry.newEmotionScore].split(' / ')[0]} ({entry.newEmotionScore})
                                                </span>
                                            </div>
                                            {entry.notes && (
                                                <p className="text-xs text-slate-400 mt-2 italic">"{entry.notes}"</p>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-slate-300 whitespace-nowrap">
                                            {new Date(entry.timestamp).toLocaleDateString('fr-FR')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PivotCoach;