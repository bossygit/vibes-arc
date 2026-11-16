/**
 * Panneaux du module « Monde intérieur » : échos, symboles partagés, écarts, fil.
 */
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { DreamEntry, ImageStreamingSession } from '@/types/innerWorld';
import type { CountItem, DreamEcho, InnerWorldAnalysis, SymbolBridge } from '@/utils/innerWorld/analysis';
import { formatShortDate } from '@/components/arc/format';

const Chip: React.FC<{ children: React.ReactNode; tone?: 'violet' | 'slate' | 'orange' }> = ({ children, tone = 'violet' }) => {
    const tones = {
        violet: 'bg-violet-50 text-violet-800 border-violet-200',
        slate: 'bg-slate-50 text-slate-700 border-slate-200',
        orange: 'bg-orange-50 text-orange-800 border-orange-200',
    };
    return <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border ${tones[tone]}`}>{children}</span>;
};

const Expandable: React.FC<{ text: string; lines?: 2 | 3 | 4 }> = ({ text, lines = 3 }) => {
    const [open, setOpen] = useState(false);
    if (!text) return <p className="text-sm text-slate-400 italic">Récit non consigné.</p>;
    const clamp = { 2: 'line-clamp-2', 3: 'line-clamp-3', 4: 'line-clamp-4' }[lines];
    const long = text.length > 220;
    return (
        <div>
            <p className={`text-sm text-slate-600 whitespace-pre-line ${open ? '' : clamp}`}>{text}</p>
            {long && (
                <button onClick={() => setOpen((v) => !v)} className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-violet-700 hover:underline">
                    {open ? <>Réduire <ChevronUp className="w-3 h-3" /></> : <>Lire tout <ChevronDown className="w-3 h-3" /></>}
                </button>
            )}
        </div>
    );
};

const DreamHeader: React.FC<{ dream: DreamEntry }> = ({ dream }) => (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span aria-hidden>🌙</span>
        <h4 className="font-semibold text-slate-800">{dream.title}</h4>
        {dream.date && <span className="text-xs text-slate-500">{formatShortDate(dream.date)} {dream.date.slice(0, 4)}</span>}
        {dream.motif && <Chip tone="orange">{dream.motif}</Chip>}
        {dream.lucidity && <span className="text-[11px] text-slate-400">{dream.lucidity}</span>}
    </div>
);

const SessionHeader: React.FC<{ session: ImageStreamingSession; delta?: number }> = ({ session, delta }) => (
    <div className="flex flex-wrap items-baseline gap-x-2">
        <span aria-hidden>🎙️</span>
        <span className="font-semibold text-slate-800">Séance #{session.number}</span>
        <span className="text-xs text-slate-500">{formatShortDate(session.date)}{session.time ? ` · ${session.time}` : ''}</span>
        {delta !== undefined && (
            <span className="text-xs font-medium text-slate-600">
                {delta === 0 ? 'le même jour' : delta > 0 ? `${delta} j après le rêve` : `${-delta} j avant le rêve`}
            </span>
        )}
    </div>
);

// ── Échos ───────────────────────────────────────────────────────────────────

export const EchoesPanel: React.FC<{ echoes: DreamEcho[]; windowDays: number }> = ({ echoes, windowDays }) => {
    if (echoes.length === 0) {
        return (
            <p className="text-sm text-slate-500">
                Aucun écho pour l’instant : aucun rêve daté ne partage de symbole précis avec une séance à moins de {windowDays} jours.
                Les échos apparaîtront quand tes rêves et tes séances se croiseront dans le temps.
            </p>
        );
    }
    return (
        <div className="space-y-4">
            <p className="text-sm text-slate-500">
                Un rêve et une séance d’Image Streaming à {windowDays} jours d’écart au plus, qui partagent un même symbole.
                Les symboles présents dans plus de 75 % des séances sont ignorés : ils ne disent rien d’un parallèle précis.
            </p>
            {echoes.map(({ dream, links }) => (
                <article key={dream.id} className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <DreamHeader dream={dream} />
                        {(dream.people.length > 0 || dream.places.length > 0) && (
                            <p className="text-xs text-slate-500">
                                {[...dream.people, ...dream.places].join(' · ')}
                            </p>
                        )}
                        <Expandable text={dream.details} lines={4} />
                    </div>
                    <ul className="space-y-3 lg:border-l lg:border-slate-100 lg:pl-4">
                        {links.map((link) => (
                            <li key={link.session.number} className="space-y-1.5">
                                <SessionHeader session={link.session} delta={link.deltaDays} />
                                <div className="flex flex-wrap items-center gap-1.5">
                                    {link.symbols.map((s) => <Chip key={s}>{s}</Chip>)}
                                    <span className="text-[11px] text-slate-400 ml-1" title="Plus les symboles partagés sont rares en Image Streaming, plus l’écho est spécifique">
                                        spécificité {Math.round(link.resonance * 100)} %
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 line-clamp-2">{link.session.excerpt}</p>
                            </li>
                        ))}
                    </ul>
                </article>
            ))}
        </div>
    );
};

// ── Symboles partagés ───────────────────────────────────────────────────────

const BridgeCard: React.FC<{ bridge: SymbolBridge; sessionCount: number }> = ({ bridge, sessionCount }) => {
    const { symbol, dreams } = bridge;
    const first = symbol.sessions.length > 0 ? Math.min(...symbol.sessions) : null;
    const last = symbol.sessions.length > 0 ? Math.max(...symbol.sessions) : null;
    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
                <h4 className="font-bold text-slate-800">{symbol.name}</h4>
                {bridge.pervasive && <span className="text-[11px] text-slate-400 flex-shrink-0">omniprésent en IS</span>}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Image Streaming</p>
                    <p className="text-slate-800 font-semibold">{symbol.count}/{sessionCount} séances</p>
                    {first !== null && <p className="text-xs text-slate-500">de #{first} à #{last}</p>}
                </div>
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-orange-700">Rêves</p>
                    <p className="text-slate-800 font-semibold">{dreams.length} rêve{dreams.length > 1 ? 's' : ''}</p>
                    {bridge.lastDreamDate && <p className="text-xs text-slate-500">dernier le {formatShortDate(bridge.lastDreamDate)} {bridge.lastDreamDate.slice(0, 4)}</p>}
                </div>
            </div>
            {(symbol.emotionArc || symbol.evolution) && (
                <div className="rounded-lg bg-violet-50 px-3 py-2">
                    {symbol.emotionArc && <p className="text-xs font-semibold text-violet-800">{symbol.emotionArc}</p>}
                    {symbol.evolution && <p className="text-xs text-slate-700 mt-0.5">{symbol.evolution}</p>}
                </div>
            )}
            <div className="flex flex-wrap gap-1.5">
                {dreams.map((d) => (
                    <Chip key={d.id} tone="slate">{d.title}{d.date ? ` · ${d.date.slice(0, 4)}` : ''}</Chip>
                ))}
            </div>
        </article>
    );
};

export const SymbolsPanel: React.FC<{ analysis: InnerWorldAnalysis }> = ({ analysis }) => {
    const [showPervasive, setShowPervasive] = useState(false);
    const [showRare, setShowRare] = useState(false);
    const visible = analysis.bridges.filter((b) => (showPervasive || !b.pervasive) && (showRare || b.symbol.count >= 2));
    const hidden = analysis.bridges.length - visible.length;

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-500">
                    Les symboles de ta base Image Streaming retrouvés mot pour mot dans tes récits de rêve (alias compris, accents ignorés).
                </p>
                <div className="flex gap-3 text-xs">
                    <label className="inline-flex items-center gap-1.5 text-slate-600">
                        <input type="checkbox" checked={showPervasive} onChange={(e) => setShowPervasive(e.target.checked)} className="rounded" />
                        omniprésents
                    </label>
                    <label className="inline-flex items-center gap-1.5 text-slate-600">
                        <input type="checkbox" checked={showRare} onChange={(e) => setShowRare(e.target.checked)} className="rounded" />
                        vus 1 seule fois en IS
                    </label>
                </div>
            </div>
            {visible.length === 0 ? (
                <p className="text-sm text-slate-500">Aucun symbole partagé avec ces filtres.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {visible.map((b) => <BridgeCard key={b.symbol.name} bridge={b} sessionCount={analysis.stats.sessions} />)}
                </div>
            )}
            {hidden > 0 && <p className="text-xs text-slate-400">{hidden} symbole{hidden > 1 ? 's' : ''} masqué{hidden > 1 ? 's' : ''} par les filtres.</p>}
        </div>
    );
};

// ── Écarts ──────────────────────────────────────────────────────────────────

const CountList: React.FC<{ title: string; items: CountItem[]; empty: string }> = ({ title, items: all, empty }) => {
    const items = all.filter((i) => !i.alsoInIS);
    const shared = all.filter((i) => i.alsoInIS);
    return (
    <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-orange-700 mb-2">{title}</h4>
        {items.length === 0 ? (
            <p className="text-sm text-slate-400">{empty}</p>
        ) : (
            <ul className="space-y-1">
                {items.slice(0, 10).map((item) => (
                    <li key={item.name} className="flex items-baseline justify-between gap-3 text-sm" title={item.dreams.join(', ')}>
                        <span className="text-slate-700 truncate">{item.name}</span>
                        <span className="text-xs text-slate-500 flex-shrink-0">{item.count}×</span>
                    </li>
                ))}
            </ul>
        )}
        {shared.length > 0 && (
            <p className="text-[11px] text-slate-400 mt-2">
                Aussi en IS : {shared.map((i) => `${i.name} (${i.alsoInIS})`).join(', ')}
            </p>
        )}
    </div>
    );
};

export const GapsPanel: React.FC<{ analysis: InnerWorldAnalysis }> = ({ analysis }) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="space-y-3">
            <div>
                <h3 className="font-bold text-slate-800">Seulement en Image Streaming</h3>
                <p className="text-sm text-slate-500">Symboles récurrents de tes séances, jamais nommés dans un rêve.</p>
            </div>
            {analysis.isOnly.length === 0 ? (
                <p className="text-sm text-slate-400">Tous tes symboles récurrents apparaissent aussi en rêve.</p>
            ) : (
                <ul className="space-y-2">
                    {analysis.isOnly.map((s) => (
                        <li key={s.name} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                            <div className="flex items-baseline justify-between gap-3">
                                <span className="font-medium text-slate-800">{s.name}</span>
                                <span className="text-xs text-slate-500">{s.count} séances</span>
                            </div>
                            {s.evolution && <p className="text-xs text-slate-500 mt-0.5">{s.evolution}</p>}
                        </li>
                    ))}
                </ul>
            )}
        </section>
        <section className="space-y-3">
            <div>
                <h3 className="font-bold text-slate-800">Seulement en rêve</h3>
                <p className="text-sm text-slate-500">Ce que tes rêves peuplent et que ta base symbolique ne nomme pas encore.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-2xl border border-slate-200 bg-white p-4">
                <CountList title="Personnages" items={analysis.people} empty="Aucun personnage noté." />
                <CountList title="Lieux" items={analysis.places} empty="Aucun lieu noté." />
                <CountList title="Motifs" items={analysis.motifs} empty="Aucun motif noté." />
            </div>
        </section>
    </div>
);

// ── Fil chronologique ───────────────────────────────────────────────────────

type ThreadItem =
    | { kind: 'session'; date: string; session: ImageStreamingSession }
    | { kind: 'dream'; date: string; dream: DreamEntry };

export const ThreadPanel: React.FC<{ analysis: InnerWorldAnalysis; sessions: ImageStreamingSession[]; dreams: DreamEntry[] }> = ({
    analysis,
    sessions,
    dreams,
}) => {
    const [limit, setLimit] = useState(20);
    const items: ThreadItem[] = [
        ...sessions.map((s) => ({ kind: 'session' as const, date: `${s.date} ${s.time ?? ''}`, session: s })),
        ...dreams.filter((d) => d.date).map((d) => ({ kind: 'dream' as const, date: d.date!, dream: d })),
    ].sort((a, b) => b.date.localeCompare(a.date));

    return (
        <div className="space-y-3">
            <ol className="relative border-l-2 border-slate-200 ml-2 space-y-4">
                {items.slice(0, limit).map((item) => {
                    const symbols = item.kind === 'session'
                        ? analysis.sessionSymbols[item.session.number] ?? []
                        : analysis.dreamSymbols[item.dream.id] ?? [];
                    return (
                        <li key={item.kind === 'session' ? `s-${item.session.number}` : `d-${item.dream.id}`} className="pl-5 relative">
                            <span
                                className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full ring-2 ring-white"
                                style={{ background: item.kind === 'session' ? '#2a78d6' : '#eb6834' }}
                                aria-hidden
                            />
                            {item.kind === 'session' ? <SessionHeader session={item.session} /> : <DreamHeader dream={item.dream} />}
                            {symbols.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                    {symbols.slice(0, 6).map((s) => <Chip key={s} tone={item.kind === 'session' ? 'violet' : 'slate'}>{s}</Chip>)}
                                    {symbols.length > 6 && <span className="text-xs text-slate-400">+{symbols.length - 6}</span>}
                                </div>
                            )}
                            <div className="mt-1.5">
                                {item.kind === 'session'
                                    ? <p className="text-xs text-slate-500 line-clamp-2">{item.session.excerpt}</p>
                                    : <Expandable text={item.dream.details} lines={2} />}
                            </div>
                        </li>
                    );
                })}
            </ol>
            {items.length > limit && (
                <button onClick={() => setLimit((l) => l + 20)} className="text-sm font-medium text-violet-700 hover:underline">
                    Afficher plus ({items.length - limit} restants)
                </button>
            )}
        </div>
    );
};
