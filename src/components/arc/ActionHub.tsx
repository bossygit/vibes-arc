/**
 * Étape 3 · Action — « Quelles preuves concrètes puis-je produire aujourd'hui ? »
 * Cœur : l'alignement du jour (intention → preuve) et les signaux du jour,
 * rangés par identité — cocher un signal, c'est verser une preuve à son dossier.
 */
import React, { useState } from 'react';
import { ArrowRight, Check, Flame, Moon, Sun } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { getAlignmentPhase, Habit, Identity } from '@/types';
import { calculateHabitStats } from '@/utils/habitUtils';
import { getIdentityColorStyle } from '@/utils/identityColors';
import StageHub from './StageHub';
import { useArcStatus } from './useArcStatus';

const ProofRow: React.FC<{ habit: Habit; todayIdx: number; otherIdentities: Identity[] }> = ({ habit, todayIdx, otherIdentities }) => {
    const { toggleHabitDay, setSelectedHabit, setView } = useAppStore();
    const [pending, setPending] = useState(false);
    const done = !!habit.progress[todayIdx];
    const streak = calculateHabitStats(habit).currentStreak;

    const toggle = async () => {
        if (pending) return;
        setPending(true);
        try {
            await toggleHabitDay(habit.id, todayIdx);
        } finally {
            setPending(false);
        }
    };

    return (
        <li className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition ${done ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}>
            <button
                onClick={toggle}
                disabled={pending}
                aria-pressed={done}
                aria-label={done ? `Annuler la preuve : ${habit.name}` : `Marquer comme prouvé : ${habit.name}`}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition disabled:opacity-50 ${done ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 hover:border-emerald-500'}`}
            >
                {done && <Check className="w-4 h-4" />}
            </button>
            <button
                onClick={() => { setSelectedHabit(habit.id); setView('habitDetail'); }}
                className="min-w-0 flex-1 text-left"
            >
                <span className={`block text-sm font-medium truncate ${done ? 'text-emerald-900' : 'text-slate-800'}`}>{habit.name}</span>
                <span className="flex items-center gap-2 text-xs text-slate-500">
                    {habit.type === 'stop' && <span>signal d’arrêt</span>}
                    {streak > 0 && (
                        <span className="inline-flex items-center gap-0.5"><Flame className="w-3 h-3 text-orange-500" />{streak} j</span>
                    )}
                    {otherIdentities.map((i) => (
                        <span key={i.id} className="inline-flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${getIdentityColorStyle(i.color).dot}`} />{i.name}
                        </span>
                    ))}
                </span>
            </button>
        </li>
    );
};

const ActionHub: React.FC = () => {
    const status = useArcStatus();
    const { identities, setView } = useAppStore();
    const { activeToday, todayIdx, done, alignment, alignmentLoaded, morningDone, eveningDone } = status.action;
    const phase = getAlignmentPhase();
    const total = activeToday.length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    // Un signal apparaît une seule fois, sous sa première identité ; les autres sont rappelées en ligne.
    const groups: { identity: Identity | null; habits: Habit[] }[] = [];
    for (const habit of activeToday) {
        const primary = identities.find((i) => i.id === habit.linkedIdentities[0]) ?? null;
        let group = groups.find((g) => (g.identity?.id ?? null) === (primary?.id ?? null));
        if (!group) {
            group = { identity: primary, habits: [] };
            groups.push(group);
        }
        group.habits.push(habit);
    }
    groups.sort((a, b) => (a.identity ? 0 : 1) - (b.identity ? 0 : 1));

    return (
        <StageHub stageKey="action">
            <section aria-labelledby="fil-du-jour" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <h2 id="fil-du-jour" className="sr-only">Le fil du jour</h2>
                <div className={`rounded-2xl border p-5 ${morningDone ? 'bg-white border-slate-200' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                        <Sun className="w-4 h-4 text-amber-500" aria-hidden />
                        Le matin — mon intention
                    </div>
                    {!alignmentLoaded ? (
                        <p className="text-sm text-slate-400 mt-2">Chargement…</p>
                    ) : morningDone && alignment?.morning ? (
                        <>
                            <p className="text-sm text-slate-700 italic mt-2">« {alignment.morning.intention} »</p>
                            <p className="text-xs text-slate-500 mt-1">Au service de : {alignment.morning.desireTitle}</p>
                        </>
                    ) : (
                        <>
                            <p className="text-sm text-slate-600 mt-2">Choisis le désir que tu sers aujourd’hui et les signaux qui le prouveront.</p>
                            <button onClick={() => setView('dailyAlignment')} className="mt-3 flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:underline">
                                Poser mon intention <ArrowRight className="w-4 h-4" />
                            </button>
                        </>
                    )}
                </div>
                <div className={`rounded-2xl border p-5 ${eveningDone || phase === 'morning' ? 'bg-white border-slate-200' : 'bg-indigo-50 border-indigo-200'}`}>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                        <Moon className="w-4 h-4 text-indigo-500" aria-hidden />
                        Le soir — ma preuve
                    </div>
                    {eveningDone && alignment?.evening ? (
                        <>
                            <p className="text-sm text-slate-700 italic mt-2">« {alignment.evening.evidenceStatement} »</p>
                            <p className="text-xs text-slate-500 mt-1">{alignment.evening.signalsCompleted}/{alignment.evening.signalsTotal} signaux engagés tenus</p>
                        </>
                    ) : (
                        <>
                            <p className="text-sm text-slate-600 mt-2">
                                {phase === 'morning' ? 'Ce soir : une phrase pour dire ce que tu as prouvé.' : 'Une phrase : « Aujourd’hui, j’ai prouvé que… »'}
                            </p>
                            {phase === 'evening' && (
                                <button onClick={() => setView('dailyAlignment')} className="mt-3 flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:underline">
                                    Consigner ma preuve <ArrowRight className="w-4 h-4" />
                                </button>
                            )}
                        </>
                    )}
                </div>
            </section>

            <section aria-labelledby="preuves-du-jour" className="card">
                <div className="flex items-end justify-between gap-3">
                    <div>
                        <h2 id="preuves-du-jour" className="text-lg font-bold text-slate-800">Les preuves du jour</h2>
                        <p className="text-sm text-slate-500">Chaque signal émis prouve l’identité à laquelle il appartient.</p>
                    </div>
                    <span className="text-2xl font-bold text-emerald-700 flex-shrink-0">{done}/{total}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 mt-3 overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>

                {total === 0 ? (
                    <div className="text-center py-6">
                        <p className="text-slate-600">Aucun signal actif aujourd’hui.</p>
                        <button onClick={() => setView('addHabit')} className="btn-primary mt-3">Créer un signal</button>
                    </div>
                ) : (
                    <div className="mt-5 space-y-5">
                        {groups.map(({ identity, habits: groupHabits }) => {
                            const c = identity ? getIdentityColorStyle(identity.color) : null;
                            const groupDone = groupHabits.filter((h) => !!h.progress[todayIdx]).length;
                            return (
                                <div key={identity?.id ?? 'none'}>
                                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                        {c && <span className={`w-2 h-2 rounded-full ${c.dot}`} aria-hidden />}
                                        {identity ? <>Preuves que je suis <span className="text-slate-800 normal-case tracking-normal text-sm">{identity.name}</span></> : 'Signaux sans identité'}
                                        <span className="ml-auto normal-case tracking-normal font-medium">{groupDone}/{groupHabits.length}</span>
                                    </p>
                                    <ul className="space-y-2">
                                        {groupHabits.map((h) => (
                                            <ProofRow
                                                key={h.id}
                                                habit={h}
                                                todayIdx={todayIdx}
                                                otherIdentities={identities.filter((i) => h.linkedIdentities.slice(1).includes(i.id))}
                                            />
                                        ))}
                                    </ul>
                                    {!identity && (
                                        <p className="text-xs text-slate-500 mt-2">
                                            Relie-les à une identité (étape 2) pour qu’ils comptent comme preuves.
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                <button onClick={() => setView('dashboard')} className="mt-5 flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:underline">
                    Séries, jalons et calendrier dans le tableau des signaux
                    <ArrowRight className="w-4 h-4" />
                </button>
            </section>
        </StageHub>
    );
};

export default ActionHub;
