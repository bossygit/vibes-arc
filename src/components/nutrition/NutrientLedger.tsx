import React, { useMemo, useState } from 'react';
import { NutrientProgress, NUTRIENT_GROUPS, NutrientGroup } from '@/types/nutrition';
import { formatNutrient } from '@/services/nutrition/nutritionMath';
import { ChevronDown, ChevronRight } from 'lucide-react';

// ============================================================
// Rapport nutritionnel — « l'étiquette »
//
// Reprend la grammaire visuelle de l'étiquette nutritionnelle
// réglementaire : filets, libellés en petites capitales, valeurs
// alignées à droite en chiffres tabulaires, pourcentage de la cible
// dans une colonne dédiée. C'est l'instrument réel du sujet, et il
// rend 40 nutriments lisibles d'un seul balayage vertical.
//
// Le code couleur porte sur le % de la cible :
//   vert     ≥ 100 %           la cible est couverte
//   ambre    50–99 %           à compléter dans la journée
//   ardoise  < 50 %            reste à couvrir — neutre, ce n'est pas une erreur
//   rouge    plafond dépassé   sodium, sucres, AG saturés… là, il y a une action
//
// Nuance volontaire : à 8 h du matin, être à 25 % de sa cible de protéines
// est normal. Le rouge est réservé au dépassement d'un plafond, seul état
// réellement actionnable — sinon l'interface culpabilise pour rien.
// ============================================================

interface NutrientLedgerProps {
    progress: NutrientProgress[];
    /** Affiche tous les nutriments dès l'ouverture (sinon seulement les essentiels) */
    defaultExpanded?: boolean;
    /** Message affiché quand aucune cible n'est définie */
    hasGoals: boolean;
}

interface RowStyle {
    /** Couleur du pourcentage et de la jauge */
    bar: string;
    text: string;
    track: string;
}

const REACHED: RowStyle = { bar: 'bg-emerald-500', text: 'text-emerald-700', track: 'bg-emerald-100' };
const PARTIAL: RowStyle = { bar: 'bg-amber-400', text: 'text-amber-700', track: 'bg-amber-100' };
const LOW: RowStyle = { bar: 'bg-slate-400', text: 'text-slate-600', track: 'bg-slate-100' };
const OVER: RowStyle = { bar: 'bg-red-600', text: 'text-red-700', track: 'bg-red-100' };
const NO_DATA: RowStyle = { bar: 'bg-slate-300', text: 'text-slate-400', track: 'bg-slate-100' };

function styleFor(item: NutrientProgress): RowStyle {
    if (item.unknown) return NO_DATA;
    if (item.exceeded) return OVER;
    if (item.percent === undefined) return NO_DATA;
    if (item.percent >= 100) return REACHED;
    if (item.percent >= 50) return PARTIAL;
    return LOW;
}

/** Jauge très fine : elle donne la tendance sans concurrencer le chiffre. */
const Gauge: React.FC<{ percent: number; style: RowStyle }> = ({ percent, style }) => (
    <div className={`h-1 w-full rounded-full ${style.track}`} aria-hidden="true">
        <div
            className={`h-1 rounded-full transition-[width] duration-500 ${style.bar}`}
            style={{ width: `${Math.min(Math.max(percent, 0), 100)}%` }}
        />
    </div>
);

const NutrientRow: React.FC<{ item: NutrientProgress; hasGoals: boolean }> = ({ item, hasGoals }) => {
    const style = styleFor(item);
    const { def, value, target, percent, unknown, exceeded } = item;

    return (
        <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[minmax(0,1fr)_92px_92px_64px] items-center gap-x-3 gap-y-1 border-b border-slate-100 py-2 last:border-b-0">
            {/* Libellé */}
            <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm text-slate-700">{def.label}</span>
                    {def.isLimit && (
                        <span className="shrink-0 rounded-sm border border-slate-300 px-1 text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                            plafond
                        </span>
                    )}
                </div>
                {hasGoals && percent !== undefined && (
                    <div className="mt-1 sm:hidden">
                        <Gauge percent={percent} style={style} />
                    </div>
                )}
            </div>

            {/* Apport du jour */}
            <div className="text-right text-sm font-medium tabular-nums text-slate-800">
                {unknown ? <span className="text-slate-300">—</span> : formatNutrient(value, def.key)}
            </div>

            {/* Cible */}
            <div className="hidden text-right text-sm tabular-nums text-slate-400 sm:block">
                {target !== undefined ? formatNutrient(target, def.key) : '—'}
            </div>

            {/* % de la cible */}
            <div className={`hidden text-right text-sm font-semibold tabular-nums sm:block ${style.text}`}>
                {percent !== undefined ? `${percent} %` : '—'}
            </div>

            {/* Jauge pleine largeur, desktop uniquement */}
            {hasGoals && percent !== undefined && (
                <div className="col-span-2 sm:col-span-4">
                    <Gauge percent={percent} style={style} />
                </div>
            )}

            {exceeded && (
                <div className="col-span-2 text-[11px] font-medium text-red-700 sm:col-span-4">
                    Plafond dépassé — à surveiller
                </div>
            )}
        </div>
    );
};

const NutrientLedger: React.FC<NutrientLedgerProps> = ({ progress, defaultExpanded = false, hasGoals }) => {
    const [expanded, setExpanded] = useState(defaultExpanded);
    const [collapsedGroups, setCollapsedGroups] = useState<NutrientGroup[]>([]);

    const grouped = useMemo(() => {
        return NUTRIENT_GROUPS.map((group) => ({
            ...group,
            items: progress.filter((p) => p.def.group === group.key),
        })).filter((group) => group.items.length > 0);
    }, [progress]);

    const highlights = useMemo(
        () => progress.filter((p) => p.def.highlight && p.def.group !== 'energy'),
        [progress],
    );

    const missing = progress.filter((p) => p.unknown).length;

    const toggleGroup = (key: NutrientGroup) => {
        setCollapsedGroups((prev) =>
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
        );
    };

    return (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-soft">
            {/* En-tête de l'étiquette */}
            <header className="flex flex-wrap items-end justify-between gap-3 border-b-4 border-slate-800 px-5 pb-3 pt-5">
                <div>
                    <h3 className="text-lg font-bold tracking-tight text-slate-900">Rapport nutritionnel</h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                        {hasGoals
                            ? 'Apport du jour rapporté à ta cible'
                            : 'Renseigne ton profil pour obtenir des cibles'}
                    </p>
                </div>
                {hasGoals && (
                    <button
                        type="button"
                        onClick={() => setExpanded((v) => !v)}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                    >
                        {expanded ? 'Réduire aux essentiels' : `Voir les ${progress.length} nutriments`}
                    </button>
                )}
            </header>

            {/* Bandeau des essentiels — 8 nutriments, donc 4 colonnes pour
                deux rangées pleines : un nombre de colonnes qui ne divise pas
                le nombre d'items laisserait des cases vides grises. */}
            <div className="grid grid-cols-2 gap-px border-b border-slate-200 bg-slate-200 sm:grid-cols-4">
                {highlights.map((item) => {
                    const style = styleFor(item);
                    return (
                        <div key={item.key} className="bg-white px-4 py-3">
                            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                {item.def.label}
                            </div>
                            <div className="mt-1 text-lg font-bold tabular-nums text-slate-900">
                                {item.unknown ? '—' : formatNutrient(item.value, item.def.key)}
                            </div>
                            {hasGoals && item.percent !== undefined && (
                                <div className={`text-xs font-semibold tabular-nums ${style.text}`}>
                                    {item.percent} % de {formatNutrient(item.target ?? 0, item.def.key)}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Colonnes de référence (desktop) */}
            <div className="hidden grid-cols-[minmax(0,1fr)_92px_92px_64px] gap-x-3 border-b border-slate-200 px-5 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:grid">
                <span>Nutriment</span>
                <span className="text-right">Apport</span>
                <span className="text-right">Cible</span>
                <span className="text-right">%</span>
            </div>

            <div className="px-5 pb-4">
                {grouped.map((group) => {
                    // Replié par défaut : seuls les macronutriments restent
                    // détaillés, le reste est résumé en une ligne. C'est ce qui
                    // distingue « voir mes chiffres du jour » de « auditer
                    // 42 nutriments ».
                    const summaryOnly = !expanded && group.key !== 'macro';
                    const isManuallyCollapsed = collapsedGroups.includes(group.key);

                    if (summaryOnly) {
                        return (
                            <div key={group.key} className="border-b border-slate-100 py-3">
                                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    {group.label}
                                </div>
                                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                                    {group.items.slice(0, 6).map((item) => (
                                        <span key={item.key} className="text-xs text-slate-500">
                                            {item.def.label}{' '}
                                            <span className="font-medium tabular-nums text-slate-700">
                                                {item.unknown ? '—' : formatNutrient(item.value, item.def.key)}
                                            </span>
                                        </span>
                                    ))}
                                    {group.items.length > 6 && (
                                        <span className="text-xs text-slate-400">
                                            +{group.items.length - 6} autres
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div key={group.key}>
                            <button
                                type="button"
                                onClick={() => toggleGroup(group.key)}
                                className="flex w-full items-center gap-1.5 border-b-2 border-slate-800 pb-1 pt-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                aria-expanded={!isManuallyCollapsed}
                            >
                                {isManuallyCollapsed ? (
                                    <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                                ) : (
                                    <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                                )}
                                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-800">
                                    {group.label}
                                </span>
                            </button>

                            {!isManuallyCollapsed &&
                                group.items.map((item) => (
                                    <NutrientRow key={item.key} item={item} hasGoals={hasGoals} />
                                ))}
                        </div>
                    );
                })}

                {missing > 0 && (
                    <p className="mt-4 text-xs leading-relaxed text-slate-400">
                        {missing} nutriment{missing > 1 ? 's' : ''} sans donnée pour aujourd’hui : les aliments
                        saisis ne renseignent pas ces valeurs. Un « — » signale une donnée absente, pas un apport nul.
                    </p>
                )}
            </div>
        </section>
    );
};

export default NutrientLedger;
