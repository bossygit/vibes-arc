import React, { useState } from 'react';
import { Sprout, Sun, Sunset } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useKarmicGardenState } from '@/hooks/useKarmicGardenState';
import { computeMorningKarma, getKarmicLevel } from '@/utils/karmicGardenUtils';
import { syncKarmicHabitOnMorningComplete } from '@/utils/karmicHabitSync';
import type { MorningDraft } from '@/types/karmicGarden';
import MorningCycleWizard from './karmic/MorningCycleWizard';
import FreeSeedPicker from './karmic/FreeSeedPicker';
import KarmicGardenPlot from './karmic/KarmicGardenPlot';
import InnerQualitiesPanel from './karmic/InnerQualitiesPanel';

type Tab = 'morning' | 'afternoon';

const KarmicGardenView: React.FC = () => {
    const [tab, setTab] = useState<Tab>('morning');
    const { state, todayMorning, completeMorning, plantSeed } = useKarmicGardenState();
    const addPoints = useAppStore((s) => s.addPoints);

    const level = getKarmicLevel(state.karmaTotal);

    const handleMorningComplete = async (draft: MorningDraft, meditationCompleted: boolean) => {
        const karma = computeMorningKarma(draft, meditationCompleted);
        completeMorning(draft, meditationCompleted);
        addPoints(karma);
        await syncKarmicHabitOnMorningComplete();
    };

    const handlePlantFree = (action: Parameters<typeof plantSeed>[0], partnerName?: string, note?: string, customLabel?: string) => {
        const earned = plantSeed(action, partnerName, note, customLabel);
        if (earned > 0) addPoints(earned);
        return earned;
    };

    return (
        <div className="space-y-6">
            <section className="rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 text-white p-6 md:p-8">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-white/15 rounded-xl">
                        <Sprout className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold mb-1">Jardin Karmique</h2>
                        <p className="text-emerald-100 text-sm md:text-base max-w-2xl">
                            Plante des graines en aidant les autres. Matin : cycle en 4 étapes. Après-midi : graines libres.
                        </p>
                        <p className="mt-3 text-lg font-semibold">
                            {level.emoji} {level.title} · {state.karmaTotal} Karma total
                        </p>
                    </div>
                </div>
            </section>

            <KarmicGardenPlot plotProgress={state.plotProgress} />
            <InnerQualitiesPanel qualities={state.qualities} />

            <div className="flex gap-2 border-b border-slate-200">
                <button
                    type="button"
                    onClick={() => setTab('morning')}
                    className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition ${
                        tab === 'morning' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500'
                    }`}
                >
                    <Sun className="w-4 h-4" />
                    Matin — Cycle 4 étapes
                </button>
                <button
                    type="button"
                    onClick={() => setTab('afternoon')}
                    className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition ${
                        tab === 'afternoon' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500'
                    }`}
                >
                    <Sunset className="w-4 h-4" />
                    Après-midi — Graines libres
                </button>
            </div>

            <div className="card">
                {tab === 'morning' ? (
                    <MorningCycleWizard todaySession={todayMorning} onComplete={handleMorningComplete} />
                ) : (
                    <FreeSeedPicker state={state} onPlant={handlePlantFree} />
                )}
            </div>
        </div>
    );
};

export default KarmicGardenView;
