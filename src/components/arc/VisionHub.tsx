/**
 * Étape 1 · Vision — « Qui veux-je devenir ? »
 * Cœur : la boussole + les désirs actifs, chacun relié à la personne qu'il suppose
 * (futur soi) et aux identités qui doivent le recevoir.
 */
import React from 'react';
import { ArrowRight, Plus, Trophy } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Desire, Identity } from '@/types';
import { getIdentityColorStyle } from '@/utils/identityColors';
import StageHub from './StageHub';
import VisionCompass from './VisionCompass';

const DesireVisionCard: React.FC<{ desire: Desire; identities: Identity[] }> = ({ desire, identities }) => {
    const setView = useAppStore((s) => s.setView);
    const linked = identities.filter((i) => desire.linkedIdentityIds.includes(i.id));
    const futureSelf = desire.motivation?.futureSelf?.trim();
    const atStake = desire.motivation?.whatAtStake?.trim();

    return (
        <article className="bg-white rounded-2xl border border-slate-200 shadow-soft p-5 flex flex-col">
            <div className="flex items-start justify-between gap-3">
                <h3 className="font-bold text-slate-800 leading-snug">{desire.title}</h3>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${desire.type === 'être' ? 'bg-violet-50 text-violet-700' : 'bg-indigo-50 text-indigo-700'}`}>
                    {desire.type === 'être' ? 'Être' : 'Avoir'}
                </span>
            </div>
            {desire.target && <p className="text-sm text-slate-500 mt-0.5">Cible : {desire.target}</p>}

            <div className="mt-4 flex-1 space-y-3">
                {futureSelf ? (
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-violet-700">La personne que je deviens</p>
                        <p className="text-sm text-slate-700 italic mt-0.5">« {futureSelf} »</p>
                    </div>
                ) : (
                    <p className="text-sm text-slate-500">
                        Futur soi non décrit : qui es-tu, le jour où ce désir est réalisé ?
                    </p>
                )}
                {atStake && (
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Ce qui est en jeu</p>
                        <p className="text-sm text-slate-600 mt-0.5">{atStake}</p>
                    </div>
                )}
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-sky-700">Identités qui le reçoivent</p>
                    {linked.length === 0 ? (
                        <p className="text-sm text-rose-600 mt-1">Aucune identité reliée — qui dois-tu devenir pour le recevoir ?</p>
                    ) : (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                            {linked.map((i) => {
                                const c = getIdentityColorStyle(i.color);
                                return (
                                    <span key={i.id} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${c.bg} ${c.border}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                                        {i.name}
                                    </span>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
                <button onClick={() => setView('tribunal')} className="flex items-center gap-1.5 text-sm font-medium text-violet-700 hover:underline">
                    Ouvrir le dossier
                    <ArrowRight className="w-4 h-4" />
                </button>
                {linked.length > 0 && (
                    <button onClick={() => setView('hubIdentity')} className="flex items-center gap-1.5 text-sm text-sky-700 hover:underline ml-auto">
                        Voir ces identités
                        <ArrowRight className="w-4 h-4" />
                    </button>
                )}
            </div>
        </article>
    );
};

const VisionHub: React.FC = () => {
    const { desires, identities, setView } = useAppStore();
    const active = desires.filter((d) => d.status !== 'closed');
    const closed = desires.filter((d) => d.status === 'closed');

    return (
        <StageHub stageKey="vision">
            <VisionCompass variant="card" />

            <section aria-labelledby="mes-desirs" className="space-y-3">
                <div className="flex items-end justify-between gap-3">
                    <div>
                        <h2 id="mes-desirs" className="text-lg font-bold text-slate-800">Ce que je veux vivre</h2>
                        <p className="text-sm text-slate-500">Chaque désir précise la vision : ce que tu veux avoir, et surtout qui tu veux être.</p>
                    </div>
                    <button onClick={() => setView('tribunal')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition flex-shrink-0">
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Nouveau désir</span>
                    </button>
                </div>

                {active.length === 0 ? (
                    <div className="card text-center">
                        <p className="text-slate-700 font-medium">Aucun désir actif.</p>
                        <p className="text-sm text-slate-500 mt-1">Déclare ce que tu veux vivre au Tribunal de la Vie : il en instruira le dossier, preuve après preuve.</p>
                        <button onClick={() => setView('tribunal')} className="btn-primary mt-4">Déclarer un désir</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {active.map((d) => <DesireVisionCard key={d.id} desire={d} identities={identities} />)}
                    </div>
                )}

                {closed.length > 0 && (
                    <p className="flex items-center gap-2 text-sm text-slate-600">
                        <Trophy className="w-4 h-4 text-amber-500" />
                        {closed.length} dossier{closed.length > 1 ? 's' : ''} gagné{closed.length > 1 ? 's' : ''} : {closed.map((d) => d.title).join(' · ')}
                    </p>
                )}
            </section>
        </StageHub>
    );
};

export default VisionHub;
