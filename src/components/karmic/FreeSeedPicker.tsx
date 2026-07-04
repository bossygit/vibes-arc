import React, { useMemo, useState } from 'react';
import { Sparkles, Star } from 'lucide-react';
import { DOMAIN_META, FREE_SEED_CATALOG, SEED_DOMAINS } from '@/data/karmicSeedCatalog';
import { FREE_SEED_KARMA_DAILY_CAP } from '@/data/karmicGardenLevels';
import type { FreeSeedAction, KarmicGardenState, SeedDomain } from '@/types/karmicGarden';
import { createCustomFreeSeedAction, getTodayDateString } from '@/utils/karmicGardenUtils';

interface FreeSeedPickerProps {
    state: KarmicGardenState;
    onPlant: (action: FreeSeedAction, partnerName?: string, note?: string, customLabel?: string) => number;
}

const FreeSeedPicker: React.FC<FreeSeedPickerProps> = ({ state, onPlant }) => {
    const [filterDomain, setFilterDomain] = useState<SeedDomain | 'all'>('all');
    const [selected, setSelected] = useState<FreeSeedAction | null>(null);
    const [partnerName, setPartnerName] = useState('');
    const [note, setNote] = useState('');
    const [customLabel, setCustomLabel] = useState('');
    const [customDomain, setCustomDomain] = useState<SeedDomain>('relations');
    const [showCustom, setShowCustom] = useState(false);
    const [lastEarned, setLastEarned] = useState<number | null>(null);

    const today = getTodayDateString();
    const karmaUsedToday =
        state.freeSeedKarmaToday?.date === today ? state.freeSeedKarmaToday.amount : 0;
    const legendaryUsed = state.lastLegendaryDate === today;

    const catalog = useMemo(() => {
        return FREE_SEED_CATALOG.filter((a) => filterDomain === 'all' || a.domain === filterDomain);
    }, [filterDomain]);

    const handlePlant = () => {
        if (showCustom) {
            if (!customLabel.trim()) return;
            const action = createCustomFreeSeedAction(customLabel.trim(), customDomain);
            const earned = onPlant(action, partnerName, note, customLabel.trim());
            setLastEarned(earned);
            resetForm();
            return;
        }
        if (!selected) return;
        if (selected.requiresPartner && !partnerName.trim()) return;
        if (selected.isLegendary && legendaryUsed) return;

        const earned = onPlant(selected, partnerName, note);
        setLastEarned(earned);
        resetForm();
    };

    const resetForm = () => {
        setSelected(null);
        setPartnerName('');
        setNote('');
        setCustomLabel('');
        setShowCustom(false);
    };

    const stars = (n: number) => '⭐'.repeat(n);

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2 items-center justify-between">
                <p className="text-sm text-slate-600">
                    Karma graines libres aujourd&apos;hui : {karmaUsedToday}/{FREE_SEED_KARMA_DAILY_CAP}
                </p>
                <button
                    type="button"
                    onClick={() => { setShowCustom(!showCustom); setSelected(null); }}
                    className="text-sm text-indigo-600 font-medium"
                >
                    {showCustom ? 'Catalogue' : '+ Action personnalisée'}
                </button>
            </div>

            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => setFilterDomain('all')}
                    className={`px-3 py-1 rounded-full text-xs border ${filterDomain === 'all' ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-300'}`}
                >
                    Tous
                </button>
                {SEED_DOMAINS.map((d) => (
                    <button
                        key={d}
                        type="button"
                        onClick={() => setFilterDomain(d)}
                        className={`px-3 py-1 rounded-full text-xs border ${filterDomain === d ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-300'}`}
                    >
                        {DOMAIN_META[d].emoji} {DOMAIN_META[d].label}
                    </button>
                ))}
            </div>

            {showCustom ? (
                <div className="card space-y-3">
                    <input
                        className="input-field"
                        placeholder="Décris ton action (ex : Appeler un ancien ami)"
                        value={customLabel}
                        onChange={(e) => setCustomLabel(e.target.value)}
                    />
                    <select
                        className="input-field"
                        value={customDomain}
                        onChange={(e) => setCustomDomain(e.target.value as SeedDomain)}
                    >
                        {SEED_DOMAINS.map((d) => (
                            <option key={d} value={d}>{DOMAIN_META[d].label}</option>
                        ))}
                    </select>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                    {catalog.map((action) => {
                        const disabled = action.isLegendary && legendaryUsed;
                        const meta = DOMAIN_META[action.domain];
                        return (
                            <button
                                key={action.id}
                                type="button"
                                disabled={disabled}
                                onClick={() => setSelected(action)}
                                className={`text-left p-3 rounded-lg border-2 transition ${
                                    selected?.id === action.id
                                        ? 'border-indigo-500 ring-2 ring-indigo-200'
                                        : `${meta.borderClass} hover:shadow-sm`
                                } ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${meta.bgClass}`}
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <span className="font-medium text-sm text-slate-800">{action.label}</span>
                                    {action.isLegendary && <Star className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                    {meta.label} · {stars(action.difficulty)} · +{action.karmaReward} Karma
                                </p>
                            </button>
                        );
                    })}
                </div>
            )}

            {(selected?.requiresPartner || showCustom) && (
                <input
                    className="input-field"
                    placeholder="Pour qui ? (partenaire karmique)"
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                />
            )}

            <textarea
                className="input-field"
                rows={2}
                placeholder="Note (optionnel)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
            />

            <button
                type="button"
                onClick={handlePlant}
                disabled={showCustom ? !customLabel.trim() || !partnerName.trim() : !selected || (selected.requiresPartner && !partnerName.trim())}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40"
            >
                <Sparkles className="w-4 h-4" />
                Planter la graine
            </button>

            {lastEarned !== null && (
                <p className="text-center text-sm text-indigo-600 font-medium">
                    {lastEarned > 0 ? `+${lastEarned} Karma planté !` : 'Graine comptée (plafond Karma atteint ou légendaire déjà utilisée)'}
                </p>
            )}
        </div>
    );
};

export default FreeSeedPicker;
