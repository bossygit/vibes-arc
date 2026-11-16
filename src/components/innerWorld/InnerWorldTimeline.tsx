/**
 * Chronologie du monde intérieur, face aux résultats extérieurs.
 *
 * Trois petits graphiques alignés sur les mêmes semaines (pas de double axe) :
 *   1. séances d'Image Streaming et rêves consignés (comptes)
 *   2. signaux émis (% moyen de la semaine)
 *   3. fréquence moyenne (échelle 1 = Joie → 22 = Peur, inversée : le haut = mieux)
 * Survol / toucher d'une semaine → détail ; vue tableau pour tout relire.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Table2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import SupabaseDatabaseClient from '@/database/supabase-client';
import { DailyMood, Habit } from '@/types';
import { dayIndexForDate, getCurrentDayIndex, getHabitStartDayIndex } from '@/utils/habitUtils';
import type { WeekBucket } from '@/utils/innerWorld/analysis';
import { formatShortDate, moodLabel } from '@/components/arc/format';

// Palette validée (dataviz) : bleu, orange, aqua, jaune — dans l'ordre fixe des slots.
const COLORS = {
    sessions: '#2a78d6',
    dreams: '#eb6834',
    signals: '#1baf7a',
    mood: '#eda100',
    grid: '#e7e5e4',
    textMuted: '#78716c',
    textSecondary: '#52514e',
    surface: '#ffffff',
};

/** Index global (convention de `habit.progress[]`) d'une date YYYY-MM-DD. */
function dayIndexOf(iso: string): number {
    const [y, m, d] = iso.split('-').map(Number);
    return dayIndexForDate(new Date(y, m - 1, d));
}

function weekCompletion(habits: Habit[], weekStart: string, todayIdx: number): number | null {
    const start = dayIndexOf(weekStart);
    const end = Math.min(start + 6, todayIdx);
    let sum = 0;
    let count = 0;
    for (let i = Math.max(0, start); i <= end; i++) {
        const active = habits.filter((h) => i >= getHabitStartDayIndex(h) && i < h.progress.length);
        if (active.length === 0) continue;
        sum += active.filter((h) => !!h.progress[i]).length / active.length;
        count += 1;
    }
    return count > 0 ? Math.round((sum / count) * 100) : null;
}

function weekMood(moods: DailyMood[], weekStart: string): number | null {
    const startIdx = dayIndexOf(weekStart);
    const inWeek = moods.filter((m) => {
        const idx = dayIndexOf(m.date);
        return idx >= startIdx && idx <= startIdx + 6;
    });
    if (inWeek.length === 0) return null;
    return inWeek.reduce((s, m) => s + m.score, 0) / inWeek.length;
}

interface WeekRow extends WeekBucket {
    signals: number | null;
    mood: number | null;
}

/** Barre à extrémité arrondie (4px), base carrée. */
function barPath(x: number, w: number, baseline: number, h: number): string {
    if (h <= 0) return '';
    const top = baseline - h;
    const r = Math.min(4, w / 2, h);
    return `M${x},${baseline} V${top + r} Q${x},${top} ${x + r},${top} H${x + w - r} Q${x + w},${top} ${x + w},${top + r} V${baseline} Z`;
}

/** Segments continus d'une série (les semaines sans donnée coupent la ligne). */
function segments(points: { x: number; y: number | null }[]): string[] {
    const out: string[] = [];
    let current: string[] = [];
    for (const p of points) {
        if (p.y === null) {
            if (current.length > 0) out.push(current.join(' '));
            current = [];
        } else {
            current.push(`${current.length === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`);
        }
    }
    if (current.length > 0) out.push(current.join(' '));
    return out;
}

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

const InnerWorldTimeline: React.FC<{ weeks: WeekBucket[] }> = ({ weeks }) => {
    const habits = useAppStore((s) => s.habits);
    const [moods, setMoods] = useState<DailyMood[]>([]);
    const [active, setActive] = useState<number | null>(null);
    const [showTable, setShowTable] = useState(false);

    // Fréquences sur toute la période de pratique (le store n'en garde que 90 jours)
    useEffect(() => {
        if (weeks.length === 0) return;
        const days = Math.max(90, getCurrentDayIndex() - dayIndexOf(weeks[0].weekStart) + 7);
        let cancelled = false;
        SupabaseDatabaseClient.getInstance()
            .getDailyMoods(days)
            .then((m) => { if (!cancelled) setMoods(m); })
            .catch(() => { /* fréquence indisponible : la rangée reste vide */ });
        return () => { cancelled = true; };
    }, [weeks]);

    const rows: WeekRow[] = useMemo(() => {
        const todayIdx = getCurrentDayIndex();
        return weeks.map((w) => ({ ...w, signals: weekCompletion(habits, w.weekStart, todayIdx), mood: weekMood(moods, w.weekStart) }));
    }, [weeks, habits, moods]);

    if (rows.length === 0) return null;

    // ── Géométrie (unités du viewBox) ──
    const left = 40;
    const right = 52;
    const W = Math.max(640, rows.length * 30 + left + right);
    const slot = (W - left - right) / rows.length;
    const cx = (i: number) => left + slot * i + slot / 2;
    const R1 = { top: 26, base: 106 };
    const R2 = { top: 142, base: 202 };
    const R3 = { top: 238, base: 298 };
    const H = 326;

    const maxCount = Math.max(1, ...rows.map((r) => Math.max(r.sessions, r.dreams)));
    const barW = Math.min(12, Math.max(3, (slot - 8) / 2));
    const yCount = (v: number) => ((R1.base - R1.top) * v) / maxCount;
    const ySignals = (v: number) => R2.base - ((R2.base - R2.top) * v) / 100;
    const yMood = (v: number) => R3.top + ((R3.base - R3.top) * (v - 1)) / 21;

    const signalPts = rows.map((r, i) => ({ x: cx(i), y: r.signals === null ? null : ySignals(r.signals) }));
    const moodPts = rows.map((r, i) => ({ x: cx(i), y: r.mood === null ? null : yMood(r.mood) }));
    const lastSignal = [...rows.keys()].reverse().find((i) => rows[i].signals !== null);
    const lastMood = [...rows.keys()].reverse().find((i) => rows[i].mood !== null);

    const monthTicks = rows
        .map((r, i) => ({ i, month: Number(r.weekStart.slice(5, 7)) - 1 }))
        .filter((t, k, arr) => k === 0 || t.month !== arr[k - 1].month);

    const hovered = active !== null ? rows[active] : null;

    const rowTitle = (y: number, text: string) => (
        <text x={left} y={y} fontSize={12} fontWeight={600} fill={COLORS.textSecondary}>{text}</text>
    );
    const tick = (y: number, label: string) => (
        <g key={`${y}-${label}`}>
            <line x1={left} x2={W - right} y1={y} y2={y} stroke={COLORS.grid} strokeWidth={1} />
            <text x={left - 6} y={y + 4} fontSize={10} textAnchor="end" fill={COLORS.textMuted}>{label}</text>
        </g>
    );

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600" aria-label="Légende">
                    <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: COLORS.sessions }} />Séances Image Streaming</span>
                    <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: COLORS.dreams }} />Rêves consignés</span>
                    <span className="inline-flex items-center gap-1.5"><span className="w-4 h-0.5 rounded" style={{ background: COLORS.signals }} />Signaux émis</span>
                    <span className="inline-flex items-center gap-1.5"><span className="w-4 h-0.5 rounded" style={{ background: COLORS.mood }} />Fréquence</span>
                </div>
                <button
                    onClick={() => setShowTable((v) => !v)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
                    aria-pressed={showTable}
                >
                    <Table2 className="w-3.5 h-3.5" />
                    {showTable ? 'Voir le graphique' : 'Voir le tableau'}
                </button>
            </div>

            {showTable ? (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-500">
                            <tr>
                                <th scope="col" className="text-left font-medium px-3 py-2">Semaine du</th>
                                <th scope="col" className="text-right font-medium px-3 py-2">Séances IS</th>
                                <th scope="col" className="text-right font-medium px-3 py-2">Rêves</th>
                                <th scope="col" className="text-right font-medium px-3 py-2">Signaux émis</th>
                                <th scope="col" className="text-left font-medium px-3 py-2">Fréquence</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...rows].reverse().map((r) => (
                                <tr key={r.weekStart} className="border-t border-slate-100">
                                    <td className="px-3 py-1.5 text-slate-700">{formatShortDate(r.weekStart)}</td>
                                    <td className="px-3 py-1.5 text-right tabular-nums">{r.sessions}</td>
                                    <td className="px-3 py-1.5 text-right tabular-nums">{r.dreams}</td>
                                    <td className="px-3 py-1.5 text-right tabular-nums">{r.signals === null ? '—' : `${r.signals} %`}</td>
                                    <td className="px-3 py-1.5 text-slate-700">{r.mood === null ? '—' : `${moodLabel(r.mood)} (${r.mood.toFixed(1)})`}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="relative">
                    <div className="overflow-x-auto">
                        <svg
                            viewBox={`0 0 ${W} ${H}`}
                            className="w-full min-w-[600px] h-auto select-none"
                            role="img"
                            aria-label="Par semaine : séances d’Image Streaming et rêves, pourcentage de signaux émis, fréquence moyenne"
                            onMouseLeave={() => setActive(null)}
                        >
                            {/* 1 · Monde intérieur */}
                            {rowTitle(14, 'Séances et rêves par semaine')}
                            {tick(R1.base, '0')}
                            {tick(R1.top, String(maxCount))}
                            {rows.map((r, i) => (
                                <g key={`b-${r.weekStart}`}>
                                    <path d={barPath(cx(i) - barW - 1, barW, R1.base, yCount(r.sessions))} fill={COLORS.sessions} />
                                    <path d={barPath(cx(i) + 1, barW, R1.base, yCount(r.dreams))} fill={COLORS.dreams} />
                                </g>
                            ))}

                            {/* 2 · Signaux émis */}
                            {rowTitle(R2.top - 14, 'Signaux émis (moyenne de la semaine)')}
                            {tick(R2.base, '0 %')}
                            {tick(ySignals(50), '50 %')}
                            {tick(R2.top, '100 %')}
                            {segments(signalPts).map((d, k) => (
                                <path key={`s-${k}`} d={d} fill="none" stroke={COLORS.signals} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                            ))}
                            {lastSignal !== undefined && (
                                <>
                                    <circle cx={cx(lastSignal)} cy={ySignals(rows[lastSignal].signals!)} r={4} fill={COLORS.signals} stroke={COLORS.surface} strokeWidth={2} />
                                    <text x={cx(lastSignal) + 8} y={ySignals(rows[lastSignal].signals!) + 4} fontSize={11} fontWeight={600} fill={COLORS.textSecondary}>
                                        {rows[lastSignal].signals} %
                                    </text>
                                </>
                            )}

                            {/* 3 · Fréquence (le haut = Joie) */}
                            {rowTitle(R3.top - 14, 'Fréquence moyenne (1 = Joie · 22 = Peur)')}
                            {tick(yMood(1), '1')}
                            {tick(yMood(7), '7')}
                            {tick(yMood(15), '15')}
                            {tick(yMood(22), '22')}
                            {segments(moodPts).map((d, k) => (
                                <path key={`m-${k}`} d={d} fill="none" stroke={COLORS.mood} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                            ))}
                            {lastMood !== undefined && (
                                <>
                                    <circle cx={cx(lastMood)} cy={yMood(rows[lastMood].mood!)} r={4} fill={COLORS.mood} stroke={COLORS.surface} strokeWidth={2} />
                                    <text x={cx(lastMood) + 8} y={yMood(rows[lastMood].mood!) + 4} fontSize={11} fontWeight={600} fill={COLORS.textSecondary}>
                                        {moodLabel(rows[lastMood].mood!)}
                                    </text>
                                </>
                            )}

                            {/* Axe des semaines */}
                            {monthTicks.map(({ i, month }) => (
                                <text key={`mt-${i}`} x={left + slot * i} y={H - 6} fontSize={11} fill={COLORS.textMuted}>{MONTHS[month]}</text>
                            ))}

                            {/* Repère de survol + zones de détection (une colonne par semaine) */}
                            {active !== null && (
                                <line x1={cx(active)} x2={cx(active)} y1={R1.top - 6} y2={R3.base + 4} stroke={COLORS.textMuted} strokeWidth={1} />
                            )}
                            {rows.map((r, i) => (
                                <rect
                                    key={`hit-${r.weekStart}`}
                                    x={left + slot * i}
                                    y={R1.top - 8}
                                    width={slot}
                                    height={R3.base - R1.top + 16}
                                    fill="transparent"
                                    onMouseEnter={() => setActive(i)}
                                    onClick={() => setActive((a) => (a === i ? null : i))}
                                />
                            ))}
                        </svg>
                    </div>
                    {hovered && (
                        <div
                            className="pointer-events-none absolute top-2 z-10 rounded-lg bg-slate-900 text-white text-xs px-3 py-2 shadow-medium"
                            style={{
                                left: `${Math.min(78, Math.max(2, ((cx(active!) / W) * 100) - 10))}%`,
                            }}
                            role="status"
                        >
                            <p className="font-semibold">Semaine du {formatShortDate(hovered.weekStart)}</p>
                            <p>{hovered.sessions} séance{hovered.sessions > 1 ? 's' : ''} IS · {hovered.dreams} rêve{hovered.dreams > 1 ? 's' : ''}</p>
                            <p>Signaux : {hovered.signals === null ? '—' : `${hovered.signals} %`}</p>
                            <p>Fréquence : {hovered.mood === null ? '—' : `${moodLabel(hovered.mood)} (${hovered.mood.toFixed(1)})`}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default InnerWorldTimeline;
