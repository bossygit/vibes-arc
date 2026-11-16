/**
 * Étape 2 · Identité — « Quelles croyances et quels comportements définissent cette personne ? »
 * Cœur : chaque identité avec ses croyances, ses comportements observables, les
 * signaux qui la prouvent, et les désirs (vision) qu'elle sert. Les manques sont nommés.
 */
import React from 'react';
import { AlertCircle, ArrowRight, Plus } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Desire, Habit, Identity } from '@/types';
import { calculateIdentityScore } from '@/utils/habitUtils';
import { getIdentityColorStyle } from '@/utils/identityColors';
import StageHub from './StageHub';

const Missing: React.FC<{ children: React.ReactNode; onFix: () => void; fixLabel: string }> = ({ children, onFix, fixLabel }) => (
    <div className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden />
        <span className="flex-1">{children}</span>
        <button onClick={onFix} className="font-medium underline whitespace-nowrap">{fixLabel}</button>
    </div>
);

const IdentityCoreCard: React.FC<{ identity: Identity; habits: Habit[]; desires: Desire[] }> = ({ identity, habits, desires }) => {
    const setView = useAppStore((s) => s.setView);
    const c = getIdentityColorStyle(identity.color);
    const signals = habits.filter((h) => h.linkedIdentities.includes(identity.id));
    const serves = desires.filter((d) => d.status !== 'closed' && d.linkedIdentityIds.includes(identity.id));
    const beliefs = identity.coreBeliefs ?? [];
    const behaviors = identity.behavioralSignals ?? [];
    const score = calculateIdentityScore(identity.id, habits);

    return (
        <article className={`bg-white rounded-2xl border ${c.border} shadow-soft p-5 flex flex-col`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-3 h-3 rounded-full ${c.dot} flex-shrink-0`} aria-hidden />
                    <h3 className="font-bold text-slate-800 truncate">{identity.name}</h3>
                </div>
                <span className="text-xs text-slate-500 flex-shrink-0">Intégration {score} %</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 mt-2 overflow-hidden">
                <div className={`h-full bg-gradient-to-r ${c.progress}`} style={{ width: `${score}%` }} />
            </div>
            {identity.description && <p className="text-sm text-slate-500 mt-3">{identity.description}</p>}

            <div className="mt-4 space-y-4 flex-1">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-sky-700">Ce qu’elle croit</p>
                    {beliefs.length === 0 ? (
                        <div className="mt-1"><Missing onFix={() => setView('identities')} fixLabel="Ajouter">Aucune croyance définie.</Missing></div>
                    ) : (
                        <ul className="mt-1 space-y-1">
                            {beliefs.slice(0, 3).map((b) => (
                                <li key={b} className="text-sm text-slate-700 italic">« {b} »</li>
                            ))}
                            {beliefs.length > 3 && <li className="text-xs text-slate-400">+ {beliefs.length - 3} autre{beliefs.length - 3 > 1 ? 's' : ''}</li>}
                        </ul>
                    )}
                </div>

                <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-sky-700">Ce qu’elle fait — signaux quotidiens</p>
                    {signals.length === 0 ? (
                        <div className="mt-1"><Missing onFix={() => setView('addHabit')} fixLabel="Créer">Aucun signal : cette identité ne peut encore rien prouver.</Missing></div>
                    ) : (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                            {signals.map((h) => (
                                <span key={h.id} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                    {h.type === 'stop' ? '⛔ ' : ''}{h.name}
                                </span>
                            ))}
                        </div>
                    )}
                    {behaviors.length > 0 && (
                        <p className="text-xs text-slate-500 mt-2">
                            Comportements observables : {behaviors.slice(0, 4).join(' · ')}{behaviors.length > 4 ? '…' : ''}
                        </p>
                    )}
                </div>

                <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-violet-700">La vision qu’elle sert</p>
                    {serves.length === 0 ? (
                        <p className="text-sm text-slate-500 mt-1">Reliée à aucun désir actif.</p>
                    ) : (
                        <p className="text-sm text-slate-700 mt-1">{serves.map((d) => d.title).join(' · ')}</p>
                    )}
                </div>
            </div>

            <button onClick={() => setView('identities')} className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-sm font-medium text-sky-700 hover:underline self-start">
                Modifier l’identité
                <ArrowRight className="w-4 h-4" />
            </button>
        </article>
    );
};

const IdentityHub: React.FC = () => {
    const { identities, habits, desires, setView } = useAppStore();
    const beliefs = identities.reduce((n, i) => n + (i.coreBeliefs?.length ?? 0), 0);
    const linkedSignals = habits.filter((h) => h.linkedIdentities.length > 0).length;
    const orphanSignals = habits.filter((h) => h.linkedIdentities.length === 0);

    return (
        <StageHub stageKey="identity">
            <section aria-labelledby="mes-identites" className="space-y-3">
                <div className="flex items-end justify-between gap-3">
                    <div>
                        <h2 id="mes-identites" className="text-lg font-bold text-slate-800">Qui est cette personne</h2>
                        <p className="text-sm text-slate-500">
                            {identities.length} identité{identities.length > 1 ? 's' : ''} · {beliefs} croyance{beliefs > 1 ? 's' : ''} · {linkedSignals} {linkedSignals > 1 ? 'signaux reliés' : 'signal relié'}
                        </p>
                    </div>
                    <button onClick={() => setView('identities')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-sky-700 text-white text-sm font-medium hover:bg-sky-800 transition flex-shrink-0">
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Nouvelle identité</span>
                    </button>
                </div>

                {identities.length === 0 ? (
                    <div className="card text-center">
                        <p className="text-slate-700 font-medium">Aucune identité pour l’instant.</p>
                        <p className="text-sm text-slate-500 mt-1">Pars de ta vision : qui dois-tu devenir pour la vivre ? Commence par une identité, ou adopte-en une de la bibliothèque.</p>
                        <div className="flex flex-wrap justify-center gap-2 mt-4">
                            <button onClick={() => setView('identities')} className="btn-primary">Créer une identité</button>
                            <button onClick={() => setView('templates')} className="btn-secondary">Ouvrir la bibliothèque</button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {identities.map((i) => <IdentityCoreCard key={i.id} identity={i} habits={habits} desires={desires} />)}
                    </div>
                )}

                {orphanSignals.length > 0 && (
                    <Missing onFix={() => setView('identities')} fixLabel="Relier">
                        {orphanSignals.length} {orphanSignals.length > 1 ? 'signaux ne sont reliés' : 'signal n’est relié'} à aucune identité ({orphanSignals.slice(0, 3).map((h) => h.name).join(', ')}{orphanSignals.length > 3 ? '…' : ''}) : {orphanSignals.length > 1 ? 'ils ne prouvent' : 'il ne prouve'} rien sur qui tu deviens.
                    </Missing>
                )}
            </section>
        </StageHub>
    );
};

export default IdentityHub;
