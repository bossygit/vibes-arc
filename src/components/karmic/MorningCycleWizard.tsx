import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Sprout } from 'lucide-react';
import { DOMAIN_META, SEED_DOMAINS } from '@/data/karmicSeedCatalog';
import type { KarmicMorningSession, MorningDraft, SeedDomain } from '@/types/karmicGarden';
import CoffeeMeditation from './CoffeeMeditation';

interface MorningCycleWizardProps {
    todaySession?: KarmicMorningSession;
    onComplete: (draft: MorningDraft, meditationCompleted: boolean) => void;
}

const defaultDraft = (): MorningDraft => ({
    goal: '',
    partnerName: '',
    partnerGoal: '',
    helpPlan: '',
    domain: 'abondance',
    actionLog: '',
    actionDoneToday: false,
});

const MorningCycleWizard: React.FC<MorningCycleWizardProps> = ({ todaySession, onComplete }) => {
    const [step, setStep] = useState(1);
    const [draft, setDraft] = useState<MorningDraft>(defaultDraft);

    if (todaySession) {
        return (
            <div className="card bg-green-50 border-green-200 text-center py-10">
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-green-800 mb-2">Graine du jour plantée ✓</h3>
                <p className="text-green-700 mb-4">
                    Intention : « {todaySession.goal} » — aide à {todaySession.partnerName}
                </p>
                <p className="text-sm text-green-600">+{todaySession.karmaEarned} Karma · Habitude cochée</p>
            </div>
        );
    }

    const update = (patch: Partial<MorningDraft>) => setDraft((d) => ({ ...d, ...patch }));

    const canStep1 = draft.goal.trim().length > 0;
    const canStep2 = draft.partnerName.trim().length > 0 && draft.helpPlan.trim().length > 0;
    const canStep3 = draft.actionLog.trim().length >= 20;

    if (step === 4) {
        return (
            <CoffeeMeditation
                goal={draft.goal}
                partnerName={draft.partnerName}
                actionLog={draft.actionLog}
                onBack={() => setStep(3)}
                onComplete={(meditationCompleted) => onComplete(draft, meditationCompleted)}
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm text-slate-500">
                {[1, 2, 3, 4].map((s) => (
                    <div
                        key={s}
                        className={`flex-1 h-1.5 rounded-full ${s <= step ? 'bg-indigo-500' : 'bg-slate-200'}`}
                    />
                ))}
            </div>

            {step === 1 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Sprout className="w-6 h-6 text-indigo-600" />
                        <h3 className="font-bold text-slate-800">Étape 1 — Ma graine d&apos;intention</h3>
                    </div>
                    <p className="text-sm text-slate-600">En une phrase, que veux-tu voir germer ?</p>
                    <input
                        className="input-field"
                        maxLength={120}
                        placeholder="Ex : Signer 3 nouveaux clients ce mois-ci"
                        value={draft.goal}
                        onChange={(e) => update({ goal: e.target.value })}
                    />
                </div>
            )}

            {step === 2 && (
                <div className="space-y-4">
                    <h3 className="font-bold text-slate-800">Étape 2 — Choisir le sol</h3>
                    <p className="text-sm text-slate-600">
                        Les graines se plantent dans les autres. Qui veux-tu aider cette semaine ?
                    </p>
                    <input
                        className="input-field"
                        placeholder="Nom du partenaire karmique"
                        value={draft.partnerName}
                        onChange={(e) => update({ partnerName: e.target.value })}
                    />
                    <input
                        className="input-field"
                        placeholder="Son objectif (optionnel)"
                        value={draft.partnerGoal}
                        onChange={(e) => update({ partnerGoal: e.target.value })}
                    />
                    <textarea
                        className="input-field"
                        rows={3}
                        placeholder="Plan concret : comment l'aider cette semaine ?"
                        value={draft.helpPlan}
                        onChange={(e) => update({ helpPlan: e.target.value })}
                    />
                </div>
            )}

            {step === 3 && (
                <div className="space-y-4">
                    <h3 className="font-bold text-slate-800">Étape 3 — Planter (action du jour)</h3>
                    <p className="text-sm text-slate-600 mb-2">Quel domaine cette action nourrit-elle ?</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {SEED_DOMAINS.map((d) => {
                            const meta = DOMAIN_META[d];
                            return (
                                <button
                                    key={d}
                                    type="button"
                                    onClick={() => update({ domain: d })}
                                    className={`p-3 rounded-lg border-2 text-sm font-medium transition ${
                                        draft.domain === d
                                            ? `${meta.borderClass} ${meta.bgClass} ring-2 ring-indigo-300`
                                            : 'border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    {meta.emoji} {meta.label}
                                </button>
                            );
                        })}
                    </div>
                    <textarea
                        className="input-field"
                        rows={3}
                        placeholder="Qu'as-tu fait (ou feras-tu) aujourd'hui pour cette personne ? (min. 20 caractères)"
                        value={draft.actionLog}
                        onChange={(e) => update({ actionLog: e.target.value })}
                    />
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={draft.actionDoneToday}
                            onChange={(e) => update({ actionDoneToday: e.target.checked })}
                            className="rounded border-slate-300"
                        />
                        J&apos;ai déjà agi aujourd&apos;hui (+5 Karma)
                    </label>
                </div>
            )}

            <div className="flex gap-3">
                {step > 1 && (
                    <button type="button" onClick={() => setStep((s) => s - 1)} className="px-4 py-2 rounded-lg border border-slate-300 flex items-center gap-1">
                        <ArrowLeft className="w-4 h-4" /> Retour
                    </button>
                )}
                {step < 3 && (
                    <button
                        type="button"
                        disabled={(step === 1 && !canStep1) || (step === 2 && !canStep2)}
                        onClick={() => setStep((s) => s + 1)}
                        className="btn-primary flex-1 flex items-center justify-center gap-1 disabled:opacity-40"
                    >
                        Suivant <ArrowRight className="w-4 h-4" />
                    </button>
                )}
                {step === 3 && (
                    <button
                        type="button"
                        disabled={!canStep3}
                        onClick={() => setStep(4)}
                        className="btn-primary flex-1 disabled:opacity-40"
                    >
                        Passer à l&apos;arrosage (Coffee Meditation)
                    </button>
                )}
            </div>
        </div>
    );
};

export default MorningCycleWizard;
