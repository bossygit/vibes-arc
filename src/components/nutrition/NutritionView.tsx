import React, { useCallback, useMemo, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import {
    CALORIE_STATUS_LABELS,
    FoodEntry,
    getCalorieStatus,
    MealType,
    MEAL_DEFS,
} from '@/types/nutrition';
import { buildDailyNutrition, caloriesOf, groupEntriesByMeal, macroCalorieSplit } from '@/services/nutrition/nutritionMath';
import { isProfileComplete } from '@/services/nutrition/nutritionGoals';
import { todayLocalISO } from '@/utils/dateUtils';
import NutrientLedger from './NutrientLedger';
import NutritionGoalsPanel from './NutritionGoalsPanel';
import FoodSearchPanel from './FoodSearchPanel';
import { AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, ChevronRight, Plus, Trash2,
    Cloud, CloudOff, Target, Utensils,
} from 'lucide-react';

// ============================================================
// Module Nutrition
//
// Deux onglets : le journal du jour (saisie et suivi) et les
// objectifs (profil, cibles calculées, ajustements manuels).
// ============================================================

type Tab = 'journal' | 'objectifs';

const DAY_LABELS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];

function shiftDate(iso: string, days: number): string {
    const date = new Date(`${iso}T12:00:00`);
    date.setDate(date.getDate() + days);
    return todayLocalISO(date);
}

function formatDayLabel(iso: string): string {
    const today = todayLocalISO();
    if (iso === today) return "Aujourd'hui";
    if (iso === shiftDate(today, -1)) return 'Hier';
    if (iso === shiftDate(today, 1)) return 'Demain';
    const date = new Date(`${iso}T12:00:00`);
    const label = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    const sameYear = date.getFullYear() === new Date().getFullYear();
    return sameYear ? label : `${label} ${date.getFullYear()}`;
}

// ------------------------------------------------------------
// Bandeau des 7 derniers jours
// ------------------------------------------------------------

const WeekStrip: React.FC<{
    selected: string;
    entries: FoodEntry[];
    calorieTarget: number;
    onSelect: (date: string) => void;
}> = ({ selected, entries, calorieTarget, onSelect }) => {
    const days = useMemo(() => {
        const today = todayLocalISO();
        return Array.from({ length: 7 }, (_, i) => shiftDate(today, i - 6));
    }, []);

    const totals = useMemo(() => {
        const map: Record<string, number> = {};
        entries.forEach((entry) => {
            map[entry.date] = (map[entry.date] ?? 0) + (entry.per100g.energy ?? 0) * (entry.grams / 100);
        });
        return map;
    }, [entries]);

    const max = Math.max(calorieTarget, ...Object.values(totals), 1);

    return (
        <div className="flex items-end gap-1.5">
            {days.map((day) => {
                const kcal = Math.round(totals[day] ?? 0);
                const isSelected = day === selected;
                const ratio = kcal / max;
                const reached = calorieTarget > 0 && kcal >= calorieTarget * 0.9;
                return (
                    <button
                        key={day}
                        type="button"
                        onClick={() => onSelect(day)}
                        title={`${formatDayLabel(day)} — ${kcal} kcal`}
                        aria-label={`${formatDayLabel(day)}, ${kcal} kilocalories`}
                        aria-current={isSelected ? 'date' : undefined}
                        className={`group flex flex-1 flex-col items-center gap-1 rounded-lg px-1 py-1.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                            isSelected ? 'bg-indigo-50' : 'hover:bg-slate-50'
                        }`}
                    >
                        <span className={`text-[10px] font-medium uppercase tracking-wide ${
                            isSelected ? 'text-indigo-700' : 'text-slate-400'
                        }`}>
                            {DAY_LABELS[new Date(`${day}T12:00:00`).getDay()]}
                        </span>
                        <span className="flex h-14 w-full items-end justify-center">
                            <span
                                className={`w-full max-w-6 rounded-sm transition-all duration-500 ${
                                    kcal === 0 ? 'bg-slate-100' : reached ? 'bg-emerald-400' : 'bg-indigo-400'
                                }`}
                                style={{ height: `${Math.max(ratio * 100, kcal === 0 ? 4 : 8)}%` }}
                            />
                        </span>
                        <span className={`text-[10px] tabular-nums ${isSelected ? 'font-semibold text-indigo-700' : 'text-slate-400'}`}>
                            {new Date(`${day}T12:00:00`).getDate()}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

// ------------------------------------------------------------
// Ligne du journal
// ------------------------------------------------------------

const FoodEntryRow: React.FC<{
    entry: FoodEntry;
    onChangeGrams: (id: number, grams: number) => void;
    onRemove: (id: number) => void;
}> = ({ entry, onChangeGrams, onRemove }) => {
    const kcal = Math.round(((entry.per100g.energy ?? 0) * entry.grams) / 100);
    const unit = entry.basis === 'ml' ? 'ml' : 'g';

    return (
        <li className="flex items-center gap-3 border-b border-slate-100 py-2.5 last:border-b-0">
            <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-slate-800">{entry.name}</div>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-400">
                    {entry.brand && <span className="truncate">{entry.brand}</span>}
                    {entry.servingLabel && <span className="truncate">· {entry.servingLabel}</span>}
                    {entry.per100g.protein !== undefined && (
                        <span className="tabular-nums">
                            · P {Math.round(((entry.per100g.protein ?? 0) * entry.grams) / 100)} g
                        </span>
                    )}
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
                <input
                    type="number"
                    min={1}
                    step={1}
                    value={Math.round(entry.grams)}
                    onChange={(e) => {
                        const next = Number(e.target.value);
                        if (Number.isFinite(next) && next > 0) onChangeGrams(entry.id, next);
                    }}
                    aria-label={`Quantité en ${unit} pour ${entry.name}`}
                    className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-right text-xs tabular-nums text-slate-700 focus:border-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
                />
                <span className="w-5 text-[11px] text-slate-400">{unit}</span>
            </div>

            <div className="w-16 shrink-0 text-right text-sm font-semibold tabular-nums text-slate-800">
                {kcal} <span className="text-[10px] font-normal text-slate-400">kcal</span>
            </div>

            <button
                type="button"
                onClick={() => onRemove(entry.id)}
                aria-label={`Supprimer ${entry.name}`}
                className="shrink-0 rounded-lg p-1.5 text-slate-300 transition hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
            >
                <Trash2 className="h-3.5 w-3.5" />
            </button>
        </li>
    );
};

// ------------------------------------------------------------
// Vue principale
// ------------------------------------------------------------

const NutritionView: React.FC = () => {
    const {
        nutritionProfile,
        nutritionGoals,
        nutritionOverrides,
        foodEntries,
        nutritionDate,
        nutritionSyncMode,
        setNutritionDate,
        saveNutritionProfile,
        setNutritionOverride,
        resetNutritionOverrides,
        addFoodEntry,
        changeFoodEntry,
        removeFoodEntry,
    } = useAppStore();

    const [tab, setTab] = useState<Tab>('journal');
    const [addingTo, setAddingTo] = useState<MealType | null>(null);

    const targets = nutritionGoals.targets;
    const hasGoals = isProfileComplete(nutritionProfile) && Object.keys(targets).length > 0;

    const dayEntries = useMemo(
        () => foodEntries.filter((entry) => entry.date === nutritionDate),
        [foodEntries, nutritionDate],
    );

    const daily = useMemo(
        () => buildDailyNutrition(nutritionDate, dayEntries, targets),
        [nutritionDate, dayEntries, targets],
    );

    const byMeal = useMemo(() => groupEntriesByMeal(dayEntries), [dayEntries]);

    const consumed = caloriesOf(daily.totals);
    const target = Math.round(targets.energy ?? 0);
    const remaining = target - consumed;
    const status = getCalorieStatus(consumed, target);
    const split = macroCalorieSplit(daily.totals);
    const percent = target > 0 ? Math.min(Math.round((consumed / target) * 100), 100) : 0;

    const handleAdd = useCallback(
        async (draft: Omit<FoodEntry, 'id' | 'createdAt' | 'date'>) => {
            await addFoodEntry({ ...draft, date: nutritionDate });
        },
        [addFoodEntry, nutritionDate],
    );

    const statusColor: Record<string, string> = {
        sous: 'text-slate-500',
        proche: 'text-amber-600',
        atteint: 'text-emerald-600',
        depasse: 'text-rose-600',
    };

    return (
        <div className="space-y-6">
            {/* ---------------- En-tête ---------------- */}
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Nutrition</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Suis tes calories et tes nutriments, et repère ce qu’il te reste à couvrir.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* État de synchronisation */}
                    <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                            nutritionSyncMode === 'cloud'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : nutritionSyncMode === 'local'
                                    ? 'border-amber-200 bg-amber-50 text-amber-700'
                                    : 'border-slate-200 bg-slate-50 text-slate-500'
                        }`}
                        title={
                            nutritionSyncMode === 'cloud'
                                ? 'Tes données sont enregistrées dans ton compte'
                                : 'Tes données sont conservées sur cet appareil et seront synchronisées plus tard'
                        }
                    >
                        {nutritionSyncMode === 'cloud' ? <Cloud className="h-3 w-3" /> : <CloudOff className="h-3 w-3" />}
                        {nutritionSyncMode === 'cloud' ? 'Synchronisé' : nutritionSyncMode === 'local' ? 'Hors-ligne' : 'Connexion…'}
                    </span>

                    {/* Onglets */}
                    <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-soft">
                        {([
                            ['journal', 'Journal', Utensils],
                            ['objectifs', 'Objectifs', Target],
                        ] as const).map(([key, label, Icon]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setTab(key)}
                                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                                    tab === key ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {tab === 'objectifs' ? (
                <NutritionGoalsPanel
                    profile={nutritionProfile}
                    overrides={nutritionOverrides}
                    onSave={saveNutritionProfile}
                    onOverride={setNutritionOverride}
                    onResetOverrides={resetNutritionOverrides}
                />
            ) : (
                <>
                    {/* ---------------- Bandeau du jour ---------------- */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setNutritionDate(shiftDate(nutritionDate, -1))}
                                    aria-label="Jour précédent"
                                    className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:border-slate-300 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <span className="min-w-44 text-center text-sm font-semibold capitalize text-slate-800">
                                    {formatDayLabel(nutritionDate)}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setNutritionDate(shiftDate(nutritionDate, 1))}
                                    aria-label="Jour suivant"
                                    className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:border-slate-300 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                                {nutritionDate !== todayLocalISO() && (
                                    <button
                                        type="button"
                                        onClick={() => setNutritionDate(todayLocalISO())}
                                        className="ml-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 transition hover:border-slate-400"
                                    >
                                        Aujourd’hui
                                    </button>
                                )}
                            </div>

                            <div className="w-full max-w-xs">
                                <WeekStrip
                                    selected={nutritionDate}
                                    entries={foodEntries}
                                    calorieTarget={target}
                                    onSelect={setNutritionDate}
                                />
                            </div>
                        </div>

                        {/* Compteur calorique */}
                        <div className="mt-5 grid gap-5 border-t border-slate-100 pt-5 sm:grid-cols-[minmax(0,1fr)_auto]">
                            <div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold tabular-nums tracking-tight text-slate-900">
                                        {consumed.toLocaleString('fr-FR')}
                                    </span>
                                    <span className="text-sm text-slate-400">
                                        / {target > 0 ? target.toLocaleString('fr-FR') : '—'} kcal
                                    </span>
                                </div>
                                <div className={`mt-1 text-xs font-medium ${statusColor[status]}`}>
                                    {target > 0
                                        ? remaining >= 0
                                            ? `${remaining.toLocaleString('fr-FR')} kcal restants — ${CALORIE_STATUS_LABELS[status].toLowerCase()}`
                                            : `${Math.abs(remaining).toLocaleString('fr-FR')} kcal au-dessus de la cible`
                                        : 'Renseigne ton profil dans l’onglet Objectifs pour obtenir une cible'}
                                </div>

                                {target > 0 && (
                                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                        <div
                                            className={`h-2 rounded-full transition-[width] duration-700 ${
                                                status === 'depasse' ? 'bg-rose-500'
                                                    : status === 'atteint' ? 'bg-emerald-500'
                                                        : 'bg-indigo-500'
                                            }`}
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Répartition macro */}
                            <div className="flex gap-5">
                                {([
                                    ['Protéines', 'protein', split.protein],
                                    ['Glucides', 'carbs', split.carbs],
                                    ['Lipides', 'fat', split.fat],
                                ] as const).map(([label, key, share]) => (
                                    <div key={key} className="text-center">
                                        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                            {label}
                                        </div>
                                        <div className="mt-1 text-lg font-bold tabular-nums text-slate-900">
                                            {Math.round(daily.totals[key] ?? 0)}
                                            <span className="text-xs font-normal text-slate-400"> g</span>
                                        </div>
                                        <div className="text-[10px] tabular-nums text-slate-400">
                                            {share} % des kcal
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* ---------------- Repas ---------------- */}
                    <section className="space-y-4">
                        {MEAL_DEFS.map((meal) => {
                            const entries = byMeal[meal.key];
                            const mealKcal = caloriesOf(daily.byMeal[meal.key]);
                            return (
                                <div key={meal.key} className="rounded-2xl border border-slate-200 bg-white shadow-soft">
                                    <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
                                        <div className="flex items-center gap-2">
                                            <span aria-hidden="true">{meal.emoji}</span>
                                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                                                {meal.label}
                                            </h3>
                                            {entries.length > 0 && (
                                                <span className="text-xs tabular-nums text-slate-400">
                                                    {entries.length} aliment{entries.length > 1 ? 's' : ''}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-semibold tabular-nums text-slate-700">
                                                {mealKcal} <span className="text-[10px] font-normal text-slate-400">kcal</span>
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setAddingTo(meal.key)}
                                                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 transition hover:border-indigo-400 hover:text-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                            >
                                                <Plus className="h-3 w-3" /> Ajouter
                                            </button>
                                        </div>
                                    </header>

                                    {entries.length > 0 ? (
                                        <ul className="px-5 py-1">
                                            {entries.map((entry) => (
                                                <FoodEntryRow
                                                    key={entry.id}
                                                    entry={entry}
                                                    onChangeGrams={(id, grams) => changeFoodEntry(id, grams)}
                                                    onRemove={removeFoodEntry}
                                                />
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="px-5 py-4 text-xs text-slate-400">
                                            Rien pour ce repas. <button
                                                type="button"
                                                onClick={() => setAddingTo(meal.key)}
                                                className="font-medium text-indigo-600 hover:text-indigo-800"
                                            >
                                                Ajouter un aliment
                                            </button>
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </section>

                    {/* ---------------- Rapport nutritionnel ---------------- */}
                    <NutrientLedger progress={daily.progress} hasGoals={hasGoals} />
                </>
            )}

            {/* ---------------- Modale d'ajout ---------------- */}
            <AnimatePresence>
                {addingTo && (
                    <FoodSearchPanel
                        meal={addingTo}
                        onClose={() => setAddingTo(null)}
                        onAdd={handleAdd}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default NutritionView;
