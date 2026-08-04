import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { PREDEFINED_SEGMENTS, SegmentIntendingEntry, EMOTIONAL_LABELS } from '@/types';
import { proposeSegmentIntentions } from '@/services/segmentIntendingService';
import { Sparkles, Loader2, ChevronDown, CheckCircle2, Target, History, AlertTriangle } from 'lucide-react';

/**
 * Jeu Segment Intending (Process #11 — Esther Hicks, Ask and It Is Given pp. 217-224).
 *
 * Boucle : définir le segment à venir → gate émotionnel → l'IA propose 3 intentions
 * pré-pavées (gemma4 via Ollama Cloud) → choisir → enregistrer → résultat après coup.
 * L'historique enregistré nourrit le modèle pour de meilleures propositions.
 */
const SegmentIntendingView: React.FC = () => {
    const { segmentIntendingEntries, addSegmentIntendingEntry, setSegmentOutcome, setView } = useAppStore();

    // ── Formulaire ──
    const [selectedKey, setSelectedKey] = useState<string>('morning_prep');
    const [customLabel, setCustomLabel] = useState('');
    const [context, setContext] = useState('');
    const [setpoint, setSetpoint] = useState<number | null>(null);

    // ── IA ──
    const [intentions, setIntentions] = useState<string[]>([]);
    const [selectedIntention, setSelectedIntention] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState('');

    // ── Outcome ──
    const [outcomeDrafts, setOutcomeDrafts] = useState<Record<number, string>>({});
    const [savedEntry, setSavedEntry] = useState<SegmentIntendingEntry | null>(null);

    useEffect(() => {
        // Charger l'historique au montage (si la table existe déjà)
        useAppStore.getState().loadSegmentIntendingEntries();
    }, []);

    const segmentLabel = selectedKey === 'custom' ? (customLabel.trim() || 'Segment personnalisé') :
        PREDEFINED_SEGMENTS.find((s) => s.key === selectedKey)?.label ?? selectedKey;

    const gateOk = setpoint === null || setpoint <= 11;

    const handleGenerate = async () => {
        setError('');
        setSelectedIntention(null);
        setIntentions([]);
        setGenerating(true);
        try {
            const result = await proposeSegmentIntentions({
                segmentKey: selectedKey,
                segmentLabel,
                context: context.trim() || undefined,
                emotionalSetpoint: setpoint ?? undefined,
            });
            setIntentions(result.intentions);
        } catch (e: any) {
            setError(e?.message ?? 'Impossible de générer les intentions');
        } finally {
            setGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!selectedIntention) return;
        const entry = await addSegmentIntendingEntry(
            {
                segmentKey: selectedKey,
                segmentLabel,
                context: context.trim() || undefined,
                emotionalSetpoint: setpoint ?? undefined,
            },
            intentions,
            selectedIntention
        );
        if (entry) {
            setSavedEntry(entry);
            // Réinitialiser le formulaire
            setIntentions([]);
            setSelectedIntention(null);
            setContext('');
            setSetpoint(null);
            setTimeout(() => setSavedEntry(null), 4000);
        }
    };

    const saveOutcome = (entryId: number) => {
        const text = (outcomeDrafts[entryId] ?? '').trim();
        if (!text) return;
        setSegmentOutcome(entryId, text);
        setOutcomeDrafts((d) => ({ ...d, [entryId]: '' }));
    };

    return (
        <div className="max-w-3xl mx-auto p-4 space-y-5">
            {/* ── En-tête ── */}
            <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Segment Intending</h1>
                    <span className="bg-white/20 text-xs font-semibold px-2 py-1 rounded-full">Process #11</span>
                </div>
                <p className="mt-2 text-sm text-violet-100">
                    Pré-pave la vibration du segment que tu t'apprêtes à vivre, <b>avant</b> d'y entrer.
                    Une intention au présent, avec attente : « Voilà ce que je veux pour ce moment. Je le veux et je l'attends. »
                </p>
            </div>

            {/* ── 1. Gate émotionnel ── */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Target className="w-4 h-4 text-violet-500" /> 1. Ton set-point émotionnel
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                    Le processus est le plus puissant entre (4) Attente positive et (11) Accablement. Optionnel — mais honnête.
                </p>
                <div className="mt-3 flex items-center gap-3 flex-wrap">
                    <select
                        value={setpoint ?? ''}
                        onChange={(e) => setSetpoint(e.target.value ? Number(e.target.value) : null)}
                        className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                    >
                        <option value="">Non renseigné</option>
                        {Array.from({ length: 22 }, (_, i) => i + 1).map((n) => (
                            <option key={n} value={n}>{n} — {EMOTIONAL_LABELS[n]?.split(' / ')[0]}</option>
                        ))}
                    </select>
                    {setpoint !== null && (
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${gateOk ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {gateOk ? (setpoint <= 7 ? 'Aligné ✅' : 'Zone utile du processus') : 'Résistance — pivote d\'abord'}
                        </span>
                    )}
                </div>
                {!gateOk && (
                    <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-amber-800">
                            En mauvaise humeur, tu projettes la même vibration dans le segment — intentionner depuis là
                            pré-pave la résistance. <button onClick={() => setView('pivotCoach')} className="underline font-semibold">Fais un Pivot d'abord</button>, puis reviens.
                        </p>
                    </div>
                )}
            </div>

            {/* ── 2. Segment ── */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-500" /> 2. Quel est ton prochain segment ?
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                    Un segment change dès que tes intentions changent : téléphone, véhicule, entrée dans une pièce, repas, coucher…
                </p>
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PREDEFINED_SEGMENTS.map((s) => (
                        <button
                            key={s.key}
                            onClick={() => { setSelectedKey(s.key); setIntentions([]); setSelectedIntention(null); }}
                            className={`text-left px-3 py-2 rounded-xl border text-sm transition-colors ${
                                selectedKey === s.key
                                    ? 'border-violet-500 bg-violet-50 text-violet-800 font-medium'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                            }`}
                        >
                            {s.emoji} {s.label}
                        </button>
                    ))}
                    <button
                        onClick={() => { setSelectedKey('custom'); setIntentions([]); setSelectedIntention(null); }}
                        className={`text-left px-3 py-2 rounded-xl border text-sm transition-colors ${
                            selectedKey === 'custom'
                                ? 'border-violet-500 bg-violet-50 text-violet-800 font-medium'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                    >
                        ✨ Segment personnalisé
                    </button>
                </div>
                {selectedKey === 'custom' && (
                    <input
                        value={customLabel}
                        onChange={(e) => setCustomLabel(e.target.value)}
                        placeholder="Nomme ton segment… (ex: Négociation avec le client X)"
                        className="mt-3 w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
                    />
                )}
                <textarea
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="Que se passe-t-il ? Qu'est-ce qui pourrait dérailler ? (ex: j'appelle le fournisseur, il risque de me presser sur le prix)"
                    rows={2}
                    className="mt-3 w-full border border-slate-300 rounded-xl px-3 py-2 text-sm resize-none"
                />
            </div>

            {/* ── 3. Génération IA ── */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                        <Target className="w-4 h-4 text-violet-500" /> 3. Intentions pré-pavées
                    </h2>
                    <span className="text-[10px] text-slate-400">gemma4 · Ollama Cloud</span>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={generating || (selectedKey === 'custom' && !customLabel.trim())}
                    className="mt-3 w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
                >
                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {generating ? 'Abraham réfléchit…' : 'Générer mes intentions'}
                </button>

                {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

                {intentions.length > 0 && (
                    <div className="mt-4 space-y-2">
                        <p className="text-xs text-slate-500">
                            Choisis celle qui te fait le plus de bien <i>en la lisant</i> — le ressenti est le point d'attraction.
                        </p>
                        {intentions.map((intention, i) => (
                            <button
                                key={i}
                                onClick={() => setSelectedIntention(intention)}
                                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors ${
                                    selectedIntention === intention
                                        ? 'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-900 font-medium'
                                        : 'border-slate-200 bg-white text-slate-700 hover:border-violet-300'
                                }`}
                            >
                                <span className="font-semibold text-violet-500 mr-2">#{i + 1}</span>
                                {intention}
                            </button>
                        ))}
                        {selectedIntention && (
                            <button
                                onClick={handleSave}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
                            >
                                <CheckCircle2 className="w-4 h-4" /> Prendre cette intention
                            </button>
                        )}
                    </div>
                )}

                {savedEntry && (
                    <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-800">
                        ✅ Intention enregistrée : « {savedEntry.chosenIntention} » — le chemin est pré-pavé.
                    </div>
                )}
            </div>

            {/* ── 4. Historique ── */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                    <History className="w-4 h-4 text-violet-500" /> Historique des segments pré-pavés
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                    Chaque entrée enregistrée affine les prochaines intentions du modèle. Reviens noter le résultat après coup.
                </p>

                {segmentIntendingEntries.length === 0 ? (
                    <p className="mt-4 text-sm text-slate-400 text-center py-6">Aucune entrée pour l'instant. Pré-pave ton premier segment !</p>
                ) : (
                    <div className="mt-3 space-y-3 max-h-96 overflow-y-auto pr-1">
                        {segmentIntendingEntries.map((entry) => (
                            <div key={entry.id} className="border border-slate-200 rounded-xl p-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-slate-800">
                                        {PREDEFINED_SEGMENTS.find((s) => s.key === entry.segmentKey)?.emoji ?? '✨'} {entry.segmentLabel}
                                    </span>
                                    <span className="text-[10px] text-slate-400">{entry.date}</span>
                                </div>
                                {entry.context && <p className="text-xs text-slate-500 mt-1">« {entry.context} »</p>}
                                {entry.chosenIntention && (
                                    <p className="text-sm text-fuchsia-700 mt-2"><b>Intention :</b> {entry.chosenIntention}</p>
                                )}
                                {entry.outcome ? (
                                    <p className="text-xs text-emerald-700 mt-2 bg-emerald-50 rounded-lg px-2 py-1"><b>Résultat :</b> {entry.outcome}</p>
                                ) : (
                                    <div className="mt-2 flex gap-2">
                                        <input
                                            value={outcomeDrafts[entry.id] ?? ''}
                                            onChange={(e) => setOutcomeDrafts((d) => ({ ...d, [entry.id]: e.target.value }))}
                                            placeholder="Comment s'est passé le segment ?"
                                            className="flex-1 border border-slate-300 rounded-lg px-2 py-1 text-xs"
                                        />
                                        <button
                                            onClick={() => saveOutcome(entry.id)}
                                            disabled={!(outcomeDrafts[entry.id] ?? '').trim()}
                                            className="text-xs bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white px-3 py-1 rounded-lg"
                                        >
                                            Noter
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <details className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-500">
                <summary className="cursor-pointer font-semibold text-slate-600 flex items-center gap-1">
                    <ChevronDown className="w-3 h-3" /> Pourquoi ça marche (Abraham, Process #11)
                </summary>
                <ul className="mt-2 list-disc pl-4 space-y-1">
                    <li>Il est plus facile de créer une expérience future améliorée que de changer une expérience déjà en cours.</li>
                    <li>Tu pré-paves constamment ton futur sans le savoir — ce processus te rend conscient de ce que tu projettes.</li>
                    <li>Un seul segment à la fois : la spécificité apporte clarté, pouvoir et vitesse.</li>
                    <li>Tu es un aimant : le ressenti EST le point d'attraction. Choisis l'intention qui change ton ressenti maintenant.</li>
                    <li>Si le segment concerne quelque chose que tu n'as jamais aimé faire, ce n'est pas l'outil le plus adapté — utilise un processus plus lourd (#13-#22) ou pivote.</li>
                    <li>Si aucune intention positive ne vient facilement : arrête-toi, change de sujet, reviens plus tard. Ne force jamais.</li>
                </ul>
            </details>
        </div>
    );
};

export default SegmentIntendingView;
