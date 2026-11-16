/**
 * Boussole — la réponse à « Qui veux-je devenir ? » en une phrase.
 * Affichée en tête de l'arc (variante `hero`) et éditée dans l'étape Vision (`card`).
 */
import React, { useEffect, useState } from 'react';
import { Compass, Pencil, Save, X } from 'lucide-react';
import { useArcStore } from '@/store/useArcStore';
import { useAppStore } from '@/store/useAppStore';

const STARTERS = [
    'Je deviens quelqu’un qui ',
    'Dans un an, on me reconnaît à ',
    'Je suis la personne qui ',
];

interface VisionCompassProps {
    variant?: 'hero' | 'card';
}

const VisionCompass: React.FC<VisionCompassProps> = ({ variant = 'card' }) => {
    const vision = useArcStore((s) => s.vision);
    const visionLoaded = useArcStore((s) => s.visionLoaded);
    const loadVision = useArcStore((s) => s.loadVision);
    const saveVision = useArcStore((s) => s.saveVision);
    const desires = useAppStore((s) => s.desires);

    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!visionLoaded) loadVision();
    }, [visionLoaded, loadVision]);

    const startEdit = () => {
        setDraft(vision.statement);
        setEditing(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await saveVision(draft);
            setEditing(false);
        } finally {
            setSaving(false);
        }
    };

    const futureSelves = desires
        .filter((d) => d.status !== 'closed' && d.motivation?.futureSelf?.trim())
        .map((d) => ({ id: d.id, title: d.title, text: d.motivation!.futureSelf.trim() }));

    const isHero = variant === 'hero';
    const showEditor = editing || (!vision.statement && variant === 'card');

    const editor = (
        <div className="space-y-3">
            <label htmlFor={`vision-${variant}`} className={`block text-sm font-medium ${isHero ? 'text-white/90' : 'text-slate-700'}`}>
                Qui veux-je devenir ? Une ou deux phrases, au présent.
            </label>
            <textarea
                id={`vision-${variant}`}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Je deviens quelqu’un qui tient parole, crée chaque jour et vit dans l’abondance."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-y"
            />
            {!draft.trim() && (
                <div className="flex flex-wrap gap-2">
                    {STARTERS.map((s) => (
                        <button
                            key={s}
                            onClick={() => setDraft(s)}
                            className={`text-xs px-2.5 py-1 rounded-full border transition ${isHero ? 'border-white/30 text-white/90 hover:bg-white/10' : 'border-violet-200 text-violet-700 hover:bg-violet-50'}`}
                        >
                            {s.trim()}…
                        </button>
                    ))}
                </div>
            )}
            <div className="flex gap-2">
                <button
                    onClick={handleSave}
                    disabled={saving || draft.trim() === vision.statement}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition"
                >
                    <Save className="w-4 h-4" />
                    {saving ? 'Enregistrement…' : 'Enregistrer ma boussole'}
                </button>
                {editing && (
                    <button
                        onClick={() => setEditing(false)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition ${isHero ? 'text-white/80 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                        <X className="w-4 h-4" />
                        Annuler
                    </button>
                )}
            </div>
        </div>
    );

    if (isHero) {
        return (
            <div>
                {editing ? editor : vision.statement ? (
                    <div className="flex items-start gap-3">
                        <blockquote className="text-lg md:text-2xl font-semibold leading-snug italic flex-1">
                            « {vision.statement} »
                        </blockquote>
                        <button
                            onClick={startEdit}
                            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition flex-shrink-0"
                            aria-label="Modifier ma boussole"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={startEdit}
                        className="w-full text-left rounded-xl border border-dashed border-white/40 px-4 py-3 hover:bg-white/10 transition"
                    >
                        <span className="block font-semibold">Écris ta boussole</span>
                        <span className="block text-sm text-white/75">Une phrase qui dit qui tu deviens — le point de départ de tout l’arc.</span>
                    </button>
                )}
            </div>
        );
    }

    return (
        <section className="card">
            <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                    <Compass className="w-5 h-5 text-violet-600" aria-hidden />
                    <h2 className="text-lg font-bold text-slate-800">Ma boussole</h2>
                </div>
                {!showEditor && (
                    <button onClick={startEdit} className="flex items-center gap-1.5 text-sm text-violet-700 hover:underline">
                        <Pencil className="w-4 h-4" />
                        Modifier
                    </button>
                )}
            </div>

            {showEditor ? editor : (
                <blockquote className="text-xl font-semibold text-slate-800 leading-snug italic border-l-4 border-violet-400 pl-4">
                    « {vision.statement} »
                </blockquote>
            )}

            {vision.statement && vision.storage === 'local' && (
                <p className="text-xs text-slate-400 mt-3">
                    Enregistrée sur cet appareil — la synchronisation entre appareils s’active avec la migration Supabase « arc_vision ».
                </p>
            )}

            {futureSelves.length > 0 && (
                <div className="mt-5 pt-4 border-t border-slate-100">
                    <p className="text-xs font-bold uppercase tracking-wider text-violet-700 mb-2">
                        Ce que tes désirs disent déjà de la personne que tu deviens
                    </p>
                    <ul className="space-y-2">
                        {futureSelves.map((f) => (
                            <li key={f.id} className="text-sm text-slate-600">
                                <span className="font-medium text-slate-800">{f.title} — </span>
                                <span className="italic">{f.text}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </section>
    );
};

export default VisionCompass;
