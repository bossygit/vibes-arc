import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    FoodEntry,
    FoodItem,
    FOOD_SOURCE_LABELS,
    MealType,
    MEAL_DEFS,
    NutrientKey,
} from '@/types/nutrition';
import { searchFoods, lookupBarcode, getLocalFoodsByCategory, FoodSearchResult } from '@/services/nutrition/foodSearchService';
import { formatNutrient, scaleNutrients } from '@/services/nutrition/nutritionMath';
import { AVAILABLE_LOCAL_CATEGORIES, LOCAL_CATEGORY_LABELS } from '@/data/commonFoods';
import { motion } from 'framer-motion';
import { Search, X, Loader2, Check, ScanLine, AlertCircle, Star } from 'lucide-react';

// ============================================================
// Recherche et ajout d'un aliment
//
// Trois sources fusionnées : base locale (instantanée), Open Food
// Facts (produits de marque) et USDA FoodData Central (aliments bruts).
// Un bandeau signale les sources indisponibles sans bloquer la saisie.
// ============================================================

const SOURCE_BADGES: Record<string, string> = {
    local: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    off: 'bg-blue-50 text-blue-700 border-blue-200',
    usda: 'bg-violet-50 text-violet-700 border-violet-200',
    custom: 'bg-amber-50 text-amber-700 border-amber-200',
};

/** Nutriments montrés dans l'aperçu d'une portion. */
const PREVIEW_KEYS: NutrientKey[] = ['energy', 'protein', 'carbs', 'fat', 'fiber', 'sodium'];

interface FoodSearchPanelProps {
    meal: MealType;
    onClose: () => void;
    /** La date est ajoutée par la vue parente, qui seule la connaît. */
    onAdd: (draft: Omit<FoodEntry, 'id' | 'createdAt' | 'date'>) => Promise<void>;
}

const FoodSearchPanel: React.FC<FoodSearchPanelProps> = ({ meal, onClose, onAdd }) => {
    const [query, setQuery] = useState('');
    const [result, setResult] = useState<FoodSearchResult>({ items: [], warnings: [], sourcesUsed: [], fromCache: false });
    const [searching, setSearching] = useState(false);
    const [selected, setSelected] = useState<FoodItem | null>(null);
    const [grams, setGrams] = useState(100);
    const [selectedMeal, setSelectedMeal] = useState<MealType>(meal);
    const [servingLabel, setServingLabel] = useState<string | undefined>(undefined);
    const [barcode, setBarcode] = useState('');
    const [barcodeBusy, setBarcodeBusy] = useState(false);
    const [barcodeError, setBarcodeError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // La recherche est temporisée pour ne pas marteler les API externes.
    useEffect(() => {
        const trimmed = query.trim();
        if (trimmed.length < 2) {
            setResult({ items: [], warnings: [], sourcesUsed: [], fromCache: false });
            setSearching(false);
            return;
        }

        setSearching(true);
        let cancelled = false;
        const timer = setTimeout(async () => {
            const outcome = await searchFoods(trimmed);
            if (!cancelled) {
                setResult(outcome);
                setSearching(false);
            }
        }, 400);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [query]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Fermeture au clavier : Échap.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const preview = useMemo(() => {
        if (!selected) return null;
        return scaleNutrients(selected.per100g, grams);
    }, [selected, grams]);

    const pickFood = useCallback((food: FoodItem) => {
        setSelected(food);
        const firstServing = food.servingSizes[0];
        if (firstServing) {
            setGrams(firstServing.grams);
            setServingLabel(firstServing.label);
        } else {
            setGrams(100);
            setServingLabel(undefined);
        }
    }, []);

    const handleBarcode = async () => {
        const code = barcode.replace(/\D/g, '');
        if (code.length < 6) {
            setBarcodeError('Un code-barres comporte au moins 6 chiffres.');
            return;
        }
        setBarcodeBusy(true);
        setBarcodeError(null);
        const food = await lookupBarcode(code);
        setBarcodeBusy(false);
        if (!food) {
            setBarcodeError('Produit introuvable dans Open Food Facts.');
            return;
        }
        pickFood(food);
    };

    const handleConfirm = async () => {
        if (!selected) return;
        setSaving(true);
        await onAdd({
            meal: selectedMeal,
            source: selected.source,
            sourceId: selected.sourceId,
            name: selected.name,
            brand: selected.brand,
            grams,
            basis: selected.basis,
            per100g: selected.per100g,
            servingLabel,
        });
        setSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-6">
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 24 }}
                transition={{ duration: 0.2 }}
                role="dialog"
                aria-modal="true"
                aria-label="Ajouter un aliment"
                className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-medium sm:rounded-2xl"
            >
                {/* En-tête */}
                <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                    <div>
                        <h2 className="text-base font-semibold text-slate-900">Ajouter un aliment</h2>
                        <p className="text-xs text-slate-500">
                            Base locale, Open Food Facts et USDA FoodData Central
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Fermer"
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </header>

                {selected ? (
                    /* ---------- Choix de la portion ---------- */
                    <div className="flex-1 overflow-y-auto px-5 py-5">
                        <button
                            type="button"
                            onClick={() => setSelected(null)}
                            className="mb-4 text-xs font-medium text-indigo-600 hover:text-indigo-800"
                        >
                            ← Retour aux résultats
                        </button>

                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                                <h3 className="text-lg font-semibold text-slate-900">{selected.name}</h3>
                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                    {selected.brand && (
                                        <span className="text-sm text-slate-500">{selected.brand}</span>
                                    )}
                                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${SOURCE_BADGES[selected.source]}`}>
                                        {FOOD_SOURCE_LABELS[selected.source]}
                                    </span>
                                    {selected.nutriscore && (
                                        <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-medium uppercase text-slate-600">
                                            Nutri-Score {selected.nutriscore}
                                        </span>
                                    )}
                                    {selected.novaGroup && (
                                        <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                                            NOVA {selected.novaGroup}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Portions proposées */}
                        <div className="mt-5">
                            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                Portion
                            </label>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {selected.servingSizes.map((serving) => {
                                    const active = servingLabel === serving.label && grams === serving.grams;
                                    return (
                                        <button
                                            key={`${serving.label}-${serving.grams}`}
                                            type="button"
                                            onClick={() => {
                                                setGrams(serving.grams);
                                                setServingLabel(serving.label);
                                            }}
                                            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                                                active
                                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                                    : 'border-slate-300 text-slate-600 hover:border-slate-400'
                                            }`}
                                        >
                                            {serving.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Quantité libre */}
                        <div className="mt-4 flex flex-wrap items-end gap-3">
                            <div>
                                <label
                                    htmlFor="food-grams"
                                    className="text-[11px] font-semibold uppercase tracking-wider text-slate-500"
                                >
                                    Quantité ({selected.basis === 'ml' ? 'ml' : 'g'})
                                </label>
                                <input
                                    id="food-grams"
                                    type="number"
                                    min={1}
                                    step={1}
                                    value={grams}
                                    onChange={(e) => {
                                        const next = Number(e.target.value);
                                        setGrams(Number.isFinite(next) && next > 0 ? next : 0);
                                        setServingLabel(undefined);
                                    }}
                                    className="mt-1 w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm tabular-nums text-slate-900 focus:border-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="food-meal"
                                    className="text-[11px] font-semibold uppercase tracking-wider text-slate-500"
                                >
                                    Repas
                                </label>
                                <select
                                    id="food-meal"
                                    value={selectedMeal}
                                    onChange={(e) => setSelectedMeal(e.target.value as MealType)}
                                    className="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
                                >
                                    {MEAL_DEFS.map((m) => (
                                        <option key={m.key} value={m.key}>
                                            {m.emoji} {m.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Aperçu nutritionnel de la portion */}
                        {preview && (
                            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                    Apport pour {grams} {selected.basis === 'ml' ? 'ml' : 'g'}
                                </div>
                                <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-6">
                                    {PREVIEW_KEYS.map((key) => {
                                        const value = preview[key];
                                        return (
                                            <div key={key}>
                                                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                                    {NUTRIENT_SHORT_LABELS[key]}
                                                </div>
                                                <div className="mt-0.5 text-sm font-semibold tabular-nums text-slate-900">
                                                    {value === undefined ? '—' : formatNutrient(value, key)}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <p className="mt-3 text-[11px] text-slate-400">
                                    Valeurs pour 100 {selected.basis === 'ml' ? 'ml' : 'g'} :{' '}
                                    {selected.per100g.energy !== undefined
                                        ? `${Math.round(selected.per100g.energy)} kcal`
                                        : 'énergie non renseignée'}
                                </p>
                            </div>
                        )}

                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setSelected(null)}
                                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-400"
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirm}
                                disabled={saving || grams <= 0}
                                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                Ajouter au {MEAL_DEFS.find((m) => m.key === selectedMeal)?.label.toLowerCase()}
                            </button>
                        </div>
                    </div>
                ) : (
                    /* ---------- Recherche ---------- */
                    <>
                        <div className="border-b border-slate-200 px-5 py-4">
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    ref={inputRef}
                                    type="search"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Riz, igname, yaourt, Nutella…"
                                    className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
                                />
                                {searching && (
                                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-indigo-500" />
                                )}
                            </div>

                            {/* Code-barres (Open Food Facts) */}
                            <div className="mt-3 flex items-center gap-2">
                                <div className="relative flex-1">
                                    <ScanLine className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={barcode}
                                        onChange={(e) => setBarcode(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleBarcode(); }}
                                        placeholder="Code-barres d'un produit emballé"
                                        className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleBarcode}
                                    disabled={barcodeBusy || barcode.replace(/\D/g, '').length < 6}
                                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-400 disabled:opacity-40"
                                >
                                    {barcodeBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Chercher'}
                                </button>
                            </div>
                            {barcodeError && (
                                <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-700">
                                    <AlertCircle className="h-3.5 w-3.5" /> {barcodeError}
                                </p>
                            )}
                        </div>

                        {/* Avertissements de sources */}
                        {result.warnings.length > 0 && (
                            <div className="border-b border-amber-100 bg-amber-50/70 px-5 py-2.5">
                                {result.warnings.map((warning) => (
                                    <p key={warning} className="flex items-start gap-1.5 text-[11px] text-amber-800">
                                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                        <span>{warning}</span>
                                    </p>
                                ))}
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto px-5 py-4">
                            {/* Aucune recherche : navigation par catégories */}
                            {query.trim().length < 2 && (
                                <div>
                                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                        <Star className="h-3.5 w-3.5" /> Base locale — aliments courants
                                    </div>
                                    <div className="mt-3 space-y-4">
                                        {AVAILABLE_LOCAL_CATEGORIES.slice(0, 6).map((category) => (
                                            <div key={category.key}>
                                                <div className="text-xs font-medium text-slate-600">
                                                    {LOCAL_CATEGORY_LABELS[category.key]}
                                                    <span className="ml-1.5 text-slate-400">{category.count}</span>
                                                </div>
                                                <div className="mt-1.5 flex flex-wrap gap-1.5">
                                                    {getLocalFoodsByCategory(LOCAL_CATEGORY_LABELS[category.key])
                                                        .slice(0, 8)
                                                        .map((food) => (
                                                            <button
                                                                key={food.id}
                                                                type="button"
                                                                onClick={() => pickFood(food)}
                                                                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                                            >
                                                                {food.name}
                                                                {food.per100g.energy !== undefined && (
                                                                    <span className="ml-1.5 tabular-nums text-slate-400">
                                                                        {Math.round(food.per100g.energy)} kcal
                                                                    </span>
                                                                )}
                                                            </button>
                                                        ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Résultats */}
                            {query.trim().length >= 2 && (
                                <>
                                    {!searching && result.items.length === 0 && (
                                        <div className="py-10 text-center">
                                            <p className="text-sm font-medium text-slate-700">Aucun aliment trouvé</p>
                                            <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
                                                Essaie un terme plus simple (« riz » plutôt que « riz basmati bio »),
                                                ou saisis le code-barres du produit.
                                            </p>
                                        </div>
                                    )}

                                    <ul className="divide-y divide-slate-100">
                                        {result.items.map((food) => (
                                            <li key={food.id}>
                                                <button
                                                    type="button"
                                                    onClick={() => pickFood(food)}
                                                    className="flex w-full items-center gap-3 py-2.5 text-left transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
                                                >
                                                    {food.imageUrl ? (
                                                        <img
                                                            src={food.imageUrl}
                                                            alt=""
                                                            loading="lazy"
                                                            className="h-10 w-10 shrink-0 rounded-lg border border-slate-200 object-cover"
                                                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                                        />
                                                    ) : (
                                                        <div className="h-10 w-10 shrink-0 rounded-lg border border-slate-200 bg-slate-50" />
                                                    )}
                                                    <div className="min-w-0 flex-1">
                                                        <div className="truncate text-sm font-medium text-slate-800">
                                                            {food.name}
                                                        </div>
                                                        <div className="mt-0.5 flex items-center gap-2">
                                                            {food.brand && (
                                                                <span className="truncate text-xs text-slate-500">
                                                                    {food.brand}
                                                                </span>
                                                            )}
                                                            <span className={`shrink-0 rounded-full border px-1.5 py-px text-[9px] font-medium ${SOURCE_BADGES[food.source]}`}>
                                                                {FOOD_SOURCE_LABELS[food.source]}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="shrink-0 text-right">
                                                        <div className="text-sm font-semibold tabular-nums text-slate-800">
                                                            {food.per100g.energy !== undefined
                                                                ? `${Math.round(food.per100g.energy)} kcal`
                                                                : '—'}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400">pour 100 g</div>
                                                    </div>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>

                                    {result.sourcesUsed.length > 0 && (
                                        <p className="mt-4 text-[11px] text-slate-400">
                                            Sources : {result.sourcesUsed.map((s) => FOOD_SOURCE_LABELS[s]).join(' · ')}
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    </>
                )}
            </motion.div>
        </div>
    );
};

/** Libellés courts pour l'aperçu d'une portion. */
const NUTRIENT_SHORT_LABELS: Partial<Record<NutrientKey, string>> = {
    energy: 'Calories',
    protein: 'Prot.',
    carbs: 'Gluc.',
    fat: 'Lip.',
    fiber: 'Fibres',
    sodium: 'Sodium',
};

export default FoodSearchPanel;
