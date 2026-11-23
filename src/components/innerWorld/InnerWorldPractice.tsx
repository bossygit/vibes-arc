/**
 * Monde intérieur — ce que publie le bot Image Streaming en plus des séances :
 *   - les exercices / points d'attention proposés par les analyses (rappelés
 *     chaque jour sur Telegram et dans Rappels iOS jusqu'à confirmation) ;
 *   - les parallèles RARES rêve ↔ séance (un même mot peu fréquent, à ±7 jours).
 */
import React from 'react';
import { CheckCircle2, Target } from 'lucide-react';
import type { PracticeItem, RareParallel } from '@/types/innerWorld';
import { formatShortDate } from '@/components/arc/format';

// ── Exercices en cours ──────────────────────────────────────────────────────

export const PracticeSection: React.FC<{ items: PracticeItem[] }> = ({ items }) => {
    const active = items.filter((i) => i.status === 'active').sort((a, b) => b.sessionNumber - a.sessionNumber);
    const done = items.filter((i) => i.status === 'done');
    if (active.length === 0 && done.length === 0) return null;

    return (
        <section aria-labelledby="exercices-en-cours" className="space-y-2">
            <h2 id="exercices-en-cours" className="text-sm font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <Target className="w-4 h-4" aria-hidden />
                Tes exercices en cours
            </h2>
            {active.length === 0 ? (
                <p className="text-sm text-slate-600">
                    Aucun exercice en attente — {done.length} pratiqué{done.length > 1 ? 's' : ''} depuis le début.
                </p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {active.map((item) => (
                        <article key={item.id} className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                            <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-700">
                                {item.type === 'attention' ? 'Point d’attention' : 'Exercice'} · séance #{item.sessionNumber}
                            </p>
                            <p className="font-semibold text-slate-800 mt-1">{item.title}</p>
                            {item.criterion && <p className="text-sm text-slate-700 mt-1.5"><span className="font-medium">Critère :</span> {item.criterion}</p>}
                        </article>
                    ))}
                </div>
            )}
            <p className="text-xs text-slate-500 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" aria-hidden />
                Confirme-les avec « ✅ Fait » sur Telegram ou en les cochant dans Rappels sur ton iPhone
                {done.length > 0 && active.length > 0 ? ` — ${done.length} déjà pratiqué${done.length > 1 ? 's' : ''}.` : '.'}
            </p>
        </section>
    );
};

// ── Parallèles rares ────────────────────────────────────────────────────────

export const RareParallelsPanel: React.FC<{ parallels: RareParallel[] }> = ({ parallels }) => {
    if (parallels.length === 0) {
        return (
            <p className="text-sm text-slate-500">
                Aucun parallèle rare pour l’instant. Ils apparaissent quand un rêve et une séance, à 7 jours d’écart au plus,
                partagent un mot que tu n’emploies presque jamais en séance (comme une « étagère »).
            </p>
        );
    }
    const sorted = [...parallels].sort((a, b) => b.sessionDate.localeCompare(a.sessionDate));
    return (
        <div className="space-y-4">
            <p className="text-sm text-slate-500">
                Un même mot, présent dans 5 % de tes séances au plus, retrouvé dans un rêve noté à 7 jours d’écart au plus.
                Contrairement aux symboles (maison, porte, noir…, présents presque partout), ces mots rares sont des indices
                précis. Le repérage compare des mots, pas des synonymes.
            </p>
            {sorted.map((p) => (
                <article key={`${p.session}-${p.dream}`} className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                        {p.words.map((w) => (
                            <span key={w} className="inline-flex items-center text-sm font-semibold px-2.5 py-0.5 rounded-full border bg-violet-50 text-violet-800 border-violet-200">
                                {w}
                            </span>
                        ))}
                        <span className="text-xs text-slate-500">
                            {p.direction} · {p.gapDays === 0 ? 'le même jour' : `${p.gapDays} j d’écart`}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs font-medium text-slate-700">🎙️ Séance du {formatShortDate(p.sessionDate)}</p>
                            <p className="text-sm text-slate-600 mt-1">{p.sessionExcerpt}</p>
                        </div>
                        <div className="lg:border-l lg:border-slate-100 lg:pl-4">
                            <p className="text-xs font-medium text-slate-700">🌙 {p.dream} · {formatShortDate(p.dreamDate)}</p>
                            <p className="text-sm text-slate-600 mt-1">{p.dreamExcerpt}</p>
                        </div>
                    </div>
                </article>
            ))}
        </div>
    );
};
