/**
 * Comparaison des sessions — Observation libre vs Cohérence guidée.
 * Agrège l'historique local (localStorage) et affiche un tableau comparatif
 * + les 12 dernières sessions sous forme de barres (hauteur = score moyen).
 */

import React from 'react';
import { Eye, Trash2, Wind } from 'lucide-react';
import { summarizeByMode, type CoherenceSessionRecord } from '@/utils/hrv/sessionStats';

interface SessionHistoryProps {
    sessions: CoherenceSessionRecord[];
    onClear: () => void;
}

const SessionHistory: React.FC<SessionHistoryProps> = ({ sessions, onClear }) => {
    const summary = summarizeByMode(sessions);
    const last = sessions.slice(-12);

    const fmt = (value: number | null, suffix = '') => (value === null ? '—' : `${value}${suffix}`);
    const fmtDate = (iso: string) => {
        const d = new Date(iso);
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    const rows: { label: string; libre: string; guide: string }[] = [
        { label: 'Sessions', libre: String(summary.libre.count), guide: String(summary.guide.count) },
        { label: 'Temps total', libre: `${summary.libre.totalMinutes} min`, guide: `${summary.guide.totalMinutes} min` },
        { label: 'Score moyen', libre: fmt(summary.libre.avgScore, '/10'), guide: fmt(summary.guide.avgScore, '/10') },
        { label: 'Temps en coh. élevée', libre: fmt(summary.libre.avgHighPct, '%'), guide: fmt(summary.guide.avgHighPct, '%') },
        { label: 'BPM moyen', libre: fmt(summary.libre.avgBpm), guide: fmt(summary.guide.avgBpm) },
        { label: 'RMSSD moyen', libre: fmt(summary.libre.avgRmssd, ' ms'), guide: fmt(summary.guide.avgRmssd, ' ms') },
    ];

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-slate-200">
                    Comparaison · Observation libre vs Cohérence guidée
                </h2>
                {sessions.length > 0 && (
                    <button
                        onClick={() => {
                            if (window.confirm('Effacer l’historique local des sessions ?')) onClear();
                        }}
                        className="text-[11px] text-slate-500 hover:text-rose-300 flex items-center gap-1 shrink-0"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        Effacer
                    </button>
                )}
            </div>

            {sessions.length === 0 ? (
                <p className="text-xs text-slate-400">
                    Aucune session enregistrée pour le moment. Termine une session « Observation libre » et une session
                    « Cohérence guidée » (≥ 30 battements) : la comparaison s’affichera ici. Les sessions du Mode Démo ne
                    sont jamais enregistrées.
                </p>
            ) : (
                <>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-[11px] uppercase tracking-wide text-slate-500">
                                <th className="text-left font-medium pb-2">Métrique</th>
                                <th className="text-right font-medium pb-2">
                                    <span className="inline-flex items-center gap-1">
                                        <Eye className="w-3.5 h-3.5" />
                                        Libre
                                    </span>
                                </th>
                                <th className="text-right font-medium pb-2">
                                    <span className="inline-flex items-center gap-1">
                                        <Wind className="w-3.5 h-3.5" />
                                        Guidée
                                    </span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="text-slate-300">
                            {rows.map((row) => (
                                <tr key={row.label} className="border-t border-slate-800/70">
                                    <td className="py-1.5 text-slate-400 text-[13px]">{row.label}</td>
                                    <td className="py-1.5 text-right font-medium text-violet-300">{row.libre}</td>
                                    <td className="py-1.5 text-right font-medium text-cyan-300">{row.guide}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div>
                        <p className="text-[11px] text-slate-500 mb-2">12 dernières sessions — hauteur = score moyen</p>
                        <div className="flex items-end gap-1.5 h-20">
                            {last.map((session) => (
                                <div
                                    key={session.id}
                                    className="flex-1 flex flex-col items-center justify-end gap-1"
                                    title={`${session.mode === 'guide' ? 'Guidée' : 'Observation libre'} · ${fmtDate(session.endedAt)} · score ${session.avgScore ?? '—'}/10 · ${session.beats} battements`}
                                >
                                    <div
                                        className={`w-full rounded-t ${
                                            session.mode === 'guide' ? 'bg-cyan-400/80' : 'bg-violet-400/80'
                                        }`}
                                        style={{ height: `${Math.max(4, ((session.avgScore ?? 0) / 10) * 60)}px` }}
                                    />
                                    <span className="text-[9px] text-slate-500">{fmtDate(session.endedAt)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-500">
                            <span className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400/80 inline-block" />
                                Guidée
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-sm bg-violet-400/80 inline-block" />
                                Libre
                            </span>
                        </div>
                    </div>

                    <p className="text-[11px] text-slate-500">
                        Astuce : la comparaison devient parlante à partir de ~3 sessions de chaque type. Un écart
                        « Guidée &gt; Libre » sur le score et le RMSSD = ta respiration fait son travail.
                    </p>
                </>
            )}
        </div>
    );
};

export default SessionHistory;
