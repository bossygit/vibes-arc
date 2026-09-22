import React, { useEffect, useMemo, useState } from 'react';
import {
    ACTIVITY_LEVELS,
    ActivityLevel,
    BmrFormula,
    GoalType,
    GOAL_TYPES,
    MacroSplit,
    NutrientKey,
    NUTRIENT_DEFS,
    NutritionProfile,
    Sex,
} from '@/types/nutrition';
import {
    computeBmr,
    computeCalorieTarget,
    computeMacroGrams,
    computeTdee,
    createDefaultProfile,
    defaultMacroSplit,
    formatBmrFormula,
} from '@/services/nutrition/nutritionGoals';
import { Loader2, Check, RotateCcw, AlertTriangle, Info } from 'lucide-react';

// ============================================================
// Profil et objectifs
//
// Le calcul est montré, pas seulement son résultat : métabolisme de
// base → dépense totale → ajustement d'objectif → cible. L'utilisateur
// voit d'où vient chaque chiffre et peut surcharger n'importe quelle
// cible sans casser le calcul des autres.
// ============================================================

const MACRO_PRESETS: { label: string; description: string; split: MacroSplit }[] = [
    { label: 'Équilibré', description: '25 / 45 / 30', split: { protein: 25, carbs: 45, fat: 30 } },
    { label: 'Riche en protéines', description: '35 / 35 / 30', split: { protein: 35, carbs: 35, fat: 30 } },
    { label: 'Low carb', description: '30 / 25 / 45', split: { protein: 30, carbs: 25, fat: 45 } },
    { label: 'Cétogène', description: '25 / 5 / 70', split: { protein: 25, carbs: 5, fat: 70 } },
];

/** Nutriments dont la cible est modifiable à la main (les autres sont plafonnés par la formule). */
const EDITABLE_KEYS: NutrientKey[] = [
    'energy', 'protein', 'carbs', 'fat', 'fiber',
    'sodium', 'potassium', 'calcium', 'iron', 'magnesium', 'zinc',
    'vitaminA', 'vitaminC', 'vitaminD', 'vitaminE', 'vitaminK', 'folate', 'vitaminB12',
];

interface NutritionGoalsPanelProps {
    profile: NutritionProfile | null;
    overrides: Partial<Record<NutrientKey, number>>;
    onSave: (profile: NutritionProfile) => Promise<void>;
    onOverride: (key: NutrientKey, value: number | null) => Promise<void>;
    onResetOverrides: () => Promise<void>;
}

const fieldClass =
    'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm tabular-nums text-slate-900 focus:border-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200';
const labelClass = 'text-[11px] font-semibold uppercase tracking-wider text-slate-500';

const NutritionGoalsPanel: React.FC<NutritionGoalsPanelProps> = ({
    profile,
    overrides,
    onSave,
    onOverride,
    onResetOverrides,
}) => {
    // Au premier lancement il n'existe aucun profil : on part de valeurs par
    // défaut que l'utilisateur ajuste. Un formulaire vide bloqué sur
    // « chargement » serait un cul-de-sac.
    const [draft, setDraft] = useState<NutritionProfile>(() => profile ?? createDefaultProfile());
    const [dirty, setDirty] = useState(false);
    const [saving, setSaving] = useState(false);
    const [savedAt, setSavedAt] = useState<number | null>(null);

    // Un profil enregistré peut arriver après le premier rendu : on l'adopte
    // tant que l'utilisateur n'a pas commencé à modifier le formulaire.
    useEffect(() => {
        if (profile && !dirty) setDraft(profile);
    }, [profile, dirty]);

    const update = <K extends keyof NutritionProfile>(key: K, value: NutritionProfile[K]) => {
        setDirty(true);
        setDraft((prev) => ({ ...prev, [key]: value }));
    };

    const chain = useMemo(() => {
        const bmr = computeBmr(draft);
        const tdee = computeTdee(bmr, draft.activity);
        const { calories, safetyWarning } = computeCalorieTarget(draft);
        const macros = computeMacroGrams(draft, calories);
        const splitTotal = draft.macroSplit.protein + draft.macroSplit.carbs + draft.macroSplit.fat;
        return { bmr, tdee, calories, macros, safetyWarning, splitTotal };
    }, [draft]);

    const handleSave = async () => {
        setSaving(true);
        await onSave(draft);
        setSaving(false);
        setDirty(false);
        setSavedAt(Date.now());
    };

    const activityFactor = ACTIVITY_LEVELS.find((a) => a.key === draft.activity)?.factor ?? 1;
    const dailyDelta = chain.calories - chain.tdee;

    return (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            {/* ---------------- Formulaire ---------------- */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
                <header className="border-b-4 border-slate-800 pb-3">
                    <h3 className="text-lg font-bold tracking-tight text-slate-900">Mon profil</h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                        Sert à calculer ton métabolisme et tes apports de référence
                    </p>
                </header>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    {/* Sexe */}
                    <div>
                        <span className={labelClass}>Sexe biologique</span>
                        <div className="mt-1 flex gap-2">
                            {(['homme', 'femme'] as Sex[]).map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => update('sex', option)}
                                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                                        draft.sex === option
                                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                            : 'border-slate-300 text-slate-600 hover:border-slate-400'
                                    }`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                        <p className="mt-1 text-[11px] text-slate-400">
                            Détermine les apports de référence (fer, calcium…).
                        </p>
                    </div>

                    {/* Âge */}
                    <div>
                        <label className={labelClass} htmlFor="np-age">Âge</label>
                        <input
                            id="np-age"
                            type="number"
                            min={14}
                            max={100}
                            value={draft.age}
                            onChange={(e) => update('age', Number(e.target.value) || 0)}
                            className={fieldClass}
                        />
                    </div>

                    {/* Taille */}
                    <div>
                        <label className={labelClass} htmlFor="np-height">Taille (cm)</label>
                        <input
                            id="np-height"
                            type="number"
                            min={100}
                            max={230}
                            value={draft.heightCm}
                            onChange={(e) => update('heightCm', Number(e.target.value) || 0)}
                            className={fieldClass}
                        />
                    </div>

                    {/* Poids */}
                    <div>
                        <label className={labelClass} htmlFor="np-weight">Poids (kg)</label>
                        <input
                            id="np-weight"
                            type="number"
                            min={30}
                            max={300}
                            step={0.1}
                            value={draft.weightKg}
                            onChange={(e) => update('weightKg', Number(e.target.value) || 0)}
                            className={fieldClass}
                        />
                    </div>

                    {/* Activité */}
                    <div className="sm:col-span-2">
                        <label className={labelClass} htmlFor="np-activity">Niveau d’activité</label>
                        <select
                            id="np-activity"
                            value={draft.activity}
                            onChange={(e) => update('activity', e.target.value as ActivityLevel)}
                            className={`${fieldClass} bg-white`}
                        >
                            {ACTIVITY_LEVELS.map((level) => (
                                <option key={level.key} value={level.key}>
                                    {level.label} — {level.description}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Objectif */}
                    <div className="sm:col-span-2">
                        <span className={labelClass}>Objectif</span>
                        <div className="mt-1 grid gap-2 sm:grid-cols-3">
                            {GOAL_TYPES.map((goal) => (
                                <button
                                    key={goal.key}
                                    type="button"
                                    onClick={() => {
                                        update('goalType', goal.key as GoalType);
                                        update('macroSplit', defaultMacroSplit(goal.key as GoalType));
                                    }}
                                    className={`rounded-lg border px-3 py-2 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                                        draft.goalType === goal.key
                                            ? 'border-indigo-500 bg-indigo-50'
                                            : 'border-slate-300 hover:border-slate-400'
                                    }`}
                                >
                                    <span className={`block text-sm font-medium ${draft.goalType === goal.key ? 'text-indigo-700' : 'text-slate-700'}`}>
                                        {goal.label}
                                    </span>
                                    <span className="mt-0.5 block text-[11px] leading-snug text-slate-500">
                                        {goal.description}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Rythme */}
                    {draft.goalType !== 'maintien' && (
                        <div className="sm:col-span-2">
                            <label className={labelClass} htmlFor="np-rate">
                                Rythme visé : {draft.rateKgPerWeek.toString().replace('.', ',')} kg / semaine
                            </label>
                            <input
                                id="np-rate"
                                type="range"
                                min={0.25}
                                max={1}
                                step={0.25}
                                value={draft.rateKgPerWeek}
                                onChange={(e) => update('rateKgPerWeek', Number(e.target.value))}
                                className="mt-2 w-full accent-indigo-600"
                            />
                            <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                                <span>0,25 kg</span><span>0,5 kg</span><span>0,75 kg</span><span>1 kg</span>
                            </div>
                        </div>
                    )}

                    {/* Formule */}
                    <div className="sm:col-span-2">
                        <label className={labelClass} htmlFor="np-formula">Formule du métabolisme de base</label>
                        <select
                            id="np-formula"
                            value={draft.bmrFormula}
                            onChange={(e) => update('bmrFormula', e.target.value as BmrFormula)}
                            className={`${fieldClass} bg-white`}
                        >
                            <option value="mifflin">Mifflin-St Jeor — référence par défaut</option>
                            <option value="katch">Katch-McArdle — nécessite le % de masse grasse</option>
                        </select>
                        {draft.bmrFormula === 'katch' && (
                            <input
                                type="number"
                                min={3}
                                max={60}
                                step={0.5}
                                value={draft.bodyFatPercent ?? ''}
                                placeholder="Masse grasse (%)"
                                onChange={(e) => update('bodyFatPercent', Number(e.target.value) || undefined)}
                                className={fieldClass}
                            />
                        )}
                    </div>

                    {/* Répartition macro */}
                    <div className="sm:col-span-2">
                        <div className="flex items-baseline justify-between">
                            <span className={labelClass}>Répartition des macros</span>
                            <span className={`text-[11px] font-medium tabular-nums ${chain.splitTotal === 100 ? 'text-slate-400' : 'text-amber-600'}`}>
                                Total {chain.splitTotal} %
                            </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {MACRO_PRESETS.map((preset) => {
                                const active =
                                    draft.macroSplit.protein === preset.split.protein &&
                                    draft.macroSplit.carbs === preset.split.carbs &&
                                    draft.macroSplit.fat === preset.split.fat;
                                return (
                                    <button
                                        key={preset.label}
                                        type="button"
                                        onClick={() => update('macroSplit', { ...preset.split })}
                                        className={`rounded-lg border px-2.5 py-1.5 text-xs transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                                            active
                                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                                : 'border-slate-300 text-slate-600 hover:border-slate-400'
                                        }`}
                                    >
                                        <span className="font-medium">{preset.label}</span>
                                        <span className="ml-1.5 tabular-nums text-slate-400">{preset.description}</span>
                                    </button>
                                );
                            })}
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-3">
                            {(['protein', 'carbs', 'fat'] as const).map((macro) => (
                                <div key={macro}>
                                    <label className="text-[11px] text-slate-500" htmlFor={`np-split-${macro}`}>
                                        {macro === 'protein' ? 'Protéines' : macro === 'carbs' ? 'Glucides' : 'Lipides'} %
                                    </label>
                                    <input
                                        id={`np-split-${macro}`}
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={draft.macroSplit[macro]}
                                        onChange={(e) =>
                                            update('macroSplit', { ...draft.macroSplit, [macro]: Number(e.target.value) || 0 })
                                        }
                                        className={fieldClass}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-4">
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        Enregistrer mon profil
                    </button>
                    {savedAt && !saving && (
                        <span className="text-xs font-medium text-emerald-600">Profil enregistré</span>
                    )}
                </div>
            </section>

            {/* ---------------- Cibles calculées ---------------- */}
            <aside className="space-y-6">
                <section className="rounded-2xl border border-slate-200 bg-white shadow-soft">
                    <header className="border-b-4 border-slate-800 px-5 pb-3 pt-5">
                        <h3 className="text-base font-bold tracking-tight text-slate-900">Comment ta cible est calculée</h3>
                    </header>

                    <ol className="divide-y divide-slate-100 px-5">
                        <li className="flex items-baseline justify-between gap-3 py-3">
                            <div>
                                <div className="text-sm text-slate-700">Métabolisme de base</div>
                                <div className="text-[11px] text-slate-400">{formatBmrFormula(draft.bmrFormula)}</div>
                            </div>
                            <span className="text-sm font-semibold tabular-nums text-slate-900">
                                {chain.bmr.toLocaleString('fr-FR')} kcal
                            </span>
                        </li>
                        <li className="flex items-baseline justify-between gap-3 py-3">
                            <div>
                                <div className="text-sm text-slate-700">Dépense totale</div>
                                <div className="text-[11px] text-slate-400">
                                    × {activityFactor.toString().replace('.', ',')} (activité)
                                </div>
                            </div>
                            <span className="text-sm font-semibold tabular-nums text-slate-900">
                                {chain.tdee.toLocaleString('fr-FR')} kcal
                            </span>
                        </li>
                        <li className="flex items-baseline justify-between gap-3 py-3">
                            <div>
                                <div className="text-sm text-slate-700">Ajustement objectif</div>
                                <div className="text-[11px] text-slate-400">
                                    {draft.goalType === 'maintien'
                                        ? 'maintien — aucun ajustement'
                                        : `${draft.rateKgPerWeek.toString().replace('.', ',')} kg/semaine`}
                                </div>
                            </div>
                            <span className={`text-sm font-semibold tabular-nums ${dailyDelta === 0 ? 'text-slate-400' : dailyDelta < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {dailyDelta > 0 ? '+' : ''}{dailyDelta.toLocaleString('fr-FR')} kcal
                            </span>
                        </li>
                        <li className="flex items-baseline justify-between gap-3 py-4">
                            <span className="text-sm font-bold uppercase tracking-wider text-slate-900">Cible du jour</span>
                            <span className="text-xl font-bold tabular-nums text-indigo-700">
                                {chain.calories.toLocaleString('fr-FR')} kcal
                            </span>
                        </li>
                    </ol>

                    {chain.safetyWarning && (
                        <div className="mx-5 mb-5 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                            <p className="text-[11px] leading-relaxed text-amber-800">{chain.safetyWarning}</p>
                        </div>
                    )}

                    {/* Macros en grammes */}
                    <div className="grid grid-cols-3 gap-px border-t border-slate-200 bg-slate-200">
                        {([
                            ['Protéines', chain.macros.protein],
                            ['Glucides', chain.macros.carbs],
                            ['Lipides', chain.macros.fat],
                        ] as const).map(([label, grams]) => (
                            <div key={label} className="bg-white px-4 py-3">
                                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</div>
                                <div className="mt-0.5 text-base font-bold tabular-nums text-slate-900">{grams} g</div>
                            </div>
                        ))}
                    </div>

                    {chain.macros.proteinFloorApplied && (
                        <p className="flex items-start gap-1.5 px-5 py-3 text-[11px] leading-relaxed text-slate-500">
                            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-500" />
                            Les protéines ont été relevées au minimum recommandé pour ton objectif
                            ({draft.goalType === 'perte' ? '1,6' : '1,2'} g/kg), au détriment des glucides.
                        </p>
                    )}
                </section>

                {/* Surcharges manuelles */}
                <section className="rounded-2xl border border-slate-200 bg-white shadow-soft">
                    <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                        <div>
                            <h3 className="text-base font-bold tracking-tight text-slate-900">Ajuster une cible</h3>
                            <p className="mt-0.5 text-[11px] text-slate-500">Laisse vide pour revenir au calcul</p>
                        </div>
                        {Object.keys(overrides).length > 0 && (
                            <button
                                type="button"
                                onClick={onResetOverrides}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 transition hover:border-slate-400"
                            >
                                <RotateCcw className="h-3 w-3" /> Tout réinitialiser
                            </button>
                        )}
                    </header>

                    <div className="max-h-96 overflow-y-auto px-5 py-2">
                        {EDITABLE_KEYS.map((key) => {
                            const def = NUTRIENT_DEFS.find((d) => d.key === key);
                            if (!def) return null;
                            const overrideValue = overrides[key];
                            return (
                                <div key={key} className="flex items-center justify-between gap-3 border-b border-slate-100 py-2 last:border-b-0">
                                    <div className="min-w-0">
                                        <div className="truncate text-sm text-slate-700">{def.label}</div>
                                        {def.isLimit && (
                                            <div className="text-[10px] uppercase tracking-wider text-slate-400">plafond</div>
                                        )}
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1.5">
                                        <input
                                            type="number"
                                            min={0}
                                            step="any"
                                            value={overrideValue ?? ''}
                                            placeholder="auto"
                                            onChange={(e) => {
                                                const raw = e.target.value;
                                                onOverride(key, raw === '' ? null : Number(raw));
                                            }}
                                            className={`w-24 rounded-lg border px-2 py-1.5 text-right text-sm tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 ${
                                                overrideValue !== undefined
                                                    ? 'border-indigo-300 bg-indigo-50/50 text-indigo-900'
                                                    : 'border-slate-200 text-slate-900 placeholder:text-slate-300'
                                            }`}
                                        />
                                        <span className="w-6 text-xs text-slate-400">{def.unit === 'ug' ? 'µg' : def.unit}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <p className="px-1 text-[11px] leading-relaxed text-slate-400">
                    Les apports de référence en vitamines et minéraux proviennent des DRI pour adultes.
                    Ces valeurs sont indicatives et ne remplacent pas un avis médical ou diététique —
                    en cas de grossesse, de maladie chronique ou de traitement, demande conseil à un professionnel.
                </p>
            </aside>
        </div>
    );
};

export default NutritionGoalsPanel;
