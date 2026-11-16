/**
 * Monde intérieur — Image Streaming (Win Wenger) × carnet de rêves.
 * Module de l'étape 4 · Évolution : ce que tes images intérieures disent de ton changement.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Cloud, CloudOff, HardDrive, MoonStar, RefreshCw, UploadCloud } from 'lucide-react';
import { useArcStore } from '@/store/useArcStore';
import { analyzeInnerWorld } from '@/utils/innerWorld/analysis';
import { snapshotFingerprint } from '@/services/innerWorldService';
import { todayLocalISO } from '@/utils/dateUtils';
import { formatShortDate } from '@/components/arc/format';
import InnerWorldTimeline from './InnerWorldTimeline';
import { EchoesPanel, GapsPanel, SymbolsPanel, ThreadPanel } from './InnerWorldPanels';

const ECHO_WINDOW_DAYS = 3;

const TABS = [
    { key: 'echoes', label: 'Échos' },
    { key: 'symbols', label: 'Symboles partagés' },
    { key: 'gaps', label: 'Écarts' },
    { key: 'timeline', label: 'Chronologie' },
    { key: 'thread', label: 'Fil' },
] as const;
type TabKey = (typeof TABS)[number]['key'];

function formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const Tile: React.FC<{ label: string; value: React.ReactNode; hint?: string }> = ({ label, value, hint }) => (
    <div className="rounded-xl bg-white/10 px-3 py-2.5">
        <p className="text-[11px] text-white/70">{label}</p>
        <p className="text-xl font-bold">{value}</p>
        {hint && <p className="text-[11px] text-white/60">{hint}</p>}
    </div>
);

const InnerWorldView: React.FC = () => {
    const innerWorld = useArcStore((s) => s.innerWorld);
    const status = useArcStore((s) => s.innerWorldStatus);
    const loadInnerWorld = useArcStore((s) => s.loadInnerWorld);
    const publishInnerWorld = useArcStore((s) => s.publishInnerWorld);
    const [tab, setTab] = useState<TabKey>('echoes');
    const [publishing, setPublishing] = useState(false);
    const [publishError, setPublishError] = useState<string | null>(null);

    useEffect(() => {
        loadInnerWorld();
    }, [loadInnerWorld]);

    const snapshot = innerWorld?.snapshot ?? null;
    const analysis = useMemo(
        () => (snapshot ? analyzeInnerWorld(snapshot, { today: todayLocalISO(), echoWindowDays: ECHO_WINDOW_DAYS }) : null),
        [snapshot],
    );
    const upToDate = !!snapshot && innerWorld?.cloudFingerprint === snapshotFingerprint(snapshot);

    const handlePublish = async () => {
        setPublishing(true);
        setPublishError(null);
        try {
            await publishInnerWorld();
        } catch (error) {
            setPublishError((error as Error)?.message ?? 'Publication impossible');
        } finally {
            setPublishing(false);
        }
    };

    const evolving = (analysis?.latestEvolutions ?? [])
        .filter((s) => s.evolution && s.count / Math.max(1, analysis!.stats.sessions) <= 0.75)
        .slice(0, 3);

    return (
        <div className="space-y-6">
            <section className="rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 text-white p-6 md:p-8 shadow-medium">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="p-3 bg-white/10 rounded-xl flex-shrink-0">
                            <MoonStar className="w-7 h-7 text-violet-200" aria-hidden />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Monde intérieur</h1>
                            <p className="text-sm text-white/70 mt-1 max-w-xl">
                                Tes séances d’Image Streaming et tes rêves, mis en parallèle : les symboles qui reviennent,
                                ceux qui se répondent à quelques jours d’écart, et la façon dont ils changent avec toi.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => loadInnerWorld(true)}
                        disabled={status === 'loading'}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${status === 'loading' ? 'animate-spin' : ''}`} />
                        Actualiser
                    </button>
                </div>

                {analysis && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-6">
                        <Tile label="Séances IS" value={analysis.stats.sessions} hint={analysis.latestSession ? `dernière : ${formatShortDate(analysis.latestSession.date)}` : undefined} />
                        <Tile label="Rêves" value={analysis.stats.dreams} hint={`${analysis.stats.datedDreams} datés`} />
                        <Tile label="Symboles IS" value={analysis.stats.symbols} />
                        <Tile label="Symboles partagés" value={analysis.stats.sharedSymbols} />
                        <Tile label="Rêves en écho" value={analysis.echoes.length} hint={`à ±${ECHO_WINDOW_DAYS} j d’une séance`} />
                    </div>
                )}

                {innerWorld && snapshot && (
                    <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3 text-xs text-white/75">
                        <span className="inline-flex items-center gap-1.5">
                            {innerWorld.source === 'vault' ? <HardDrive className="w-3.5 h-3.5" /> : innerWorld.source === 'cloud' ? <Cloud className="w-3.5 h-3.5" /> : <CloudOff className="w-3.5 h-3.5" />}
                            {innerWorld.source === 'vault' && 'Lu en direct dans ton coffre Obsidian'}
                            {innerWorld.source === 'cloud' && `Copie publiée le ${innerWorld.cloudSyncedAt ? formatDateTime(innerWorld.cloudSyncedAt) : '—'}`}
                            {innerWorld.source === 'cache' && 'Dernière copie enregistrée dans ce navigateur'}
                        </span>
                        {innerWorld.vaultAvailable && (
                            <span className="sm:ml-auto inline-flex items-center gap-2">
                                {innerWorld.cloudUnavailable ? (
                                    <span>Pour retrouver ce module sur ton téléphone, applique la migration Supabase <code className="text-white">20261116_arc_vision_inner_world</code>.</span>
                                ) : upToDate ? (
                                    <span className="inline-flex items-center gap-1"><Cloud className="w-3.5 h-3.5" /> Copie de tes appareils à jour</span>
                                ) : (
                                    <>
                                        <span>{innerWorld.cloudSyncedAt ? `Copie de tes appareils : ${formatDateTime(innerWorld.cloudSyncedAt)}` : 'Pas encore publié sur tes appareils'}</span>
                                        <button
                                            onClick={handlePublish}
                                            disabled={publishing}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-slate-900 font-medium hover:bg-violet-100 transition disabled:opacity-50"
                                        >
                                            <UploadCloud className="w-3.5 h-3.5" />
                                            {publishing ? 'Publication…' : 'Publier sur mes appareils'}
                                        </button>
                                    </>
                                )}
                            </span>
                        )}
                    </div>
                )}
                {publishError && <p className="mt-2 text-xs text-rose-200">Publication impossible : {publishError}</p>}
            </section>

            {!snapshot ? (
                <section className="card space-y-3">
                    <h2 className="text-lg font-bold text-slate-800">
                        {status === 'loading' || status === 'idle' ? 'Lecture de ton monde intérieur…' : 'Ton monde intérieur n’est pas encore relié'}
                    </h2>
                    {status === 'ready' && (
                        <>
                            <p className="text-sm text-slate-600">
                                Le module lit deux dossiers de ton coffre Obsidian : <strong>Practice/Image Streaming</strong> (séances,
                                <code className="mx-1">sessions_index.json</code>, <code className="mx-1">symbols.json</code>) et
                                <strong> Notion/Au pays des merveilles</strong> (un fichier par rêve).
                            </p>
                            {import.meta.env.DEV ? (
                                <p className="text-sm text-slate-600">
                                    Le serveur de développement n’a pas trouvé ces dossiers. Par défaut il cherche
                                    <code className="mx-1">~/Documents/Obsidian Vault</code> — sinon, renseigne
                                    <code className="mx-1">OBSIDIAN_VAULT_PATH</code> (et au besoin <code className="mx-1">INNER_WORLD_IS_DIR</code>,
                                    <code className="mx-1">INNER_WORLD_DREAMS_DIR</code>) dans <code className="mx-1">.env.local</code>, puis relance <code className="mx-1">npm run dev</code>.
                                </p>
                            ) : (
                                <p className="text-sm text-slate-600">
                                    Ton coffre est sur ton Mac : lance Vibes Arc avec <code className="mx-1">npm run dev</code> sur cette machine, ouvre ce module,
                                    puis clique sur « Publier sur mes appareils ». Tes séances et tes rêves apparaîtront ensuite ici, sur tous tes appareils.
                                </p>
                            )}
                            {innerWorld?.error && <p className="text-xs text-rose-600">Supabase : {innerWorld.error}</p>}
                        </>
                    )}
                </section>
            ) : analysis && (
                <>
                    {evolving.length > 0 && (
                        <section aria-labelledby="ce-qui-evolue" className="space-y-2">
                            <h2 id="ce-qui-evolue" className="text-sm font-bold uppercase tracking-wider text-amber-800">
                                Ce qui évolue en toi — séance #{analysis.latestSession?.number}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {evolving.map((s) => (
                                    <article key={s.name} className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                        <p className="font-semibold text-slate-800">{s.name}</p>
                                        {s.emotionArc && <p className="text-xs font-medium text-amber-800 mt-0.5">{s.emotionArc}</p>}
                                        <p className="text-sm text-slate-700 mt-1.5">{s.evolution}</p>
                                    </article>
                                ))}
                            </div>
                        </section>
                    )}

                    <section className="card">
                        <div role="tablist" aria-label="Vues du monde intérieur" className="flex gap-1 overflow-x-auto border-b border-slate-200 -mx-2 px-2 mb-5">
                            {TABS.map((t) => (
                                <button
                                    key={t.key}
                                    role="tab"
                                    id={`tab-${t.key}`}
                                    aria-selected={tab === t.key}
                                    aria-controls={`panel-${t.key}`}
                                    onClick={() => setTab(t.key)}
                                    className={`px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition ${tab === t.key ? 'border-violet-600 text-violet-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
                            {tab === 'echoes' && <EchoesPanel echoes={analysis.echoes} windowDays={ECHO_WINDOW_DAYS} />}
                            {tab === 'symbols' && <SymbolsPanel analysis={analysis} />}
                            {tab === 'gaps' && <GapsPanel analysis={analysis} />}
                            {tab === 'timeline' && <InnerWorldTimeline weeks={analysis.weeks} />}
                            {tab === 'thread' && <ThreadPanel analysis={analysis} sessions={snapshot.sessions} dreams={snapshot.dreams} />}
                        </div>
                    </section>
                </>
            )}
        </div>
    );
};

export default InnerWorldView;
