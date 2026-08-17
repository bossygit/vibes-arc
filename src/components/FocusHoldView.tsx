import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Eye,
    Sparkles,
    Copy,
    Check,
    RotateCcw,
    Plus,
    Minus,
    Equal,
    Pencil,
} from 'lucide-react';
import SupabaseDatabaseClient from '@/database/supabase-client';
import { tierFor, MILESTONES } from '@/utils/focusStatsUtils';
import { syncFocusHabitOnSession } from '@/utils/focusHabitSync';
import FocusDashboard from '@/components/focus/FocusDashboard';
import PolyhedronVisual from '@/components/focus/PolyhedronVisual';
import {
    POLYHEDRA,
    getPolyhedron,
    firstUnfilledFace,
} from '@/data/focusPolyhedra';
import type { PolyhedronId } from '@/data/focusPolyhedra';
import {
    loadFocusShapeData,
    saveFocusShapeData,
    todayKey,
    feelingsLast7Days,
} from '@/utils/focusShapeStore';
import type { FocusShapeData, Feeling } from '@/utils/focusShapeStore';

// ===================================================================
// Focus 17/68 — Principe AttentionGrid.com
// Écris sans t'arrêter sur un sujet pendant 68 secondes.
//  - paliers visuels : 17s → 34s → 51s → 68s
//  - interruption > 2s : le texte s'efface, la progression repart à 0
//  - chaque séance de 68s complétée grave une face d'un solide de Platon
//  - après chaque séance : mieux / pareil / moins bien
//    (+ la face reste gravée, = elle s'efface, − elle s'efface et une
//     ancienne gravure disparaît aussi — fidèle à AttentionGrid)
// ===================================================================

const SESSION_SECONDS = 68;
const IDLE_RESET_MS = 2000; // arrêt de frappe > 2s → interruption
const IDLE_WARNING_MS = 1600; // l'avertissement démarre 400ms avant

type Phase = 'setup' | 'holding' | 'result';

interface PendingResult {
    text: string;
    pendingFace: number;
    shapeCompleted: boolean; // cette face était la dernière du solide
}

// ─── Barre de progression de la chambre ───────────────────────────

function ChamberProgress({
    progress,
    warning,
    milestone,
}: {
    progress: number;
    warning: boolean;
    milestone: number;
}) {
    return (
        <div className="w-full max-w-sm">
            <div className="relative h-2 rounded-full bg-white/10">
                <div className="absolute inset-0 rounded-full overflow-hidden">
                    <div
                        className="h-full transition-[width] duration-150 ease-linear"
                        style={{
                            width: `${Math.min(100, progress * 100)}%`,
                            background: warning
                                ? 'linear-gradient(90deg,#F59E0B,#FBBF24)'
                                : 'linear-gradient(90deg,#6366F1,#8B5CF6,#C4B5FD)',
                        }}
                    />
                </div>
                {[0.25, 0.5, 0.75, 1].map((t) => (
                    <div
                        key={t}
                        className="absolute top-1/2 -translate-y-1/2 w-[3px] h-[3px] rounded-full transition-colors duration-300"
                        style={{
                            left: `${t * 100}%`,
                            background:
                                progress >= t
                                    ? '#E0E7FF'
                                    : 'rgba(255,255,255,0.28)',
                        }}
                    />
                ))}
            </div>
            <div className="flex justify-between mt-1.5 font-mono text-[10px] tracking-widest">
                {MILESTONES.map((m, i) => (
                    <span
                        key={m}
                        className={
                            milestone > i
                                ? 'text-indigo-300'
                                : 'text-white/30'
                        }
                    >
                        {m}s
                    </span>
                ))}
            </div>
        </div>
    );
}

// ─── Vue principale ────────────────────────────────────────────────

const FocusHoldView: React.FC = () => {
    const [phase, setPhase] = useState<Phase>('setup');
    const [subject, setSubject] = useState('');
    const [shapeId, setShapeId] = useState<PolyhedronId>('tetrahedron');
    const [data, setData] = useState<FocusShapeData>(() =>
        loadFocusShapeData()
    );

    // Session en cours
    const [elapsed, setElapsed] = useState(0);
    const [progress, setProgress] = useState(0);
    const [text, setText] = useState('');
    const [warning, setWarning] = useState(false);
    const [resetFlash, setResetFlash] = useState(false);
    const [resetsThisSession, setResetsThisSession] = useState(0);
    const [milestone, setMilestone] = useState(0);

    // Résultat
    const [result, setResult] = useState<PendingResult | null>(null);
    const [feeling, setFeeling] = useState<Feeling | null>(null);
    const [copied, setCopied] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const phaseRef = useRef<Phase>('setup');
    const startTimeRef = useRef<number | null>(null);
    const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const warnRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const resetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const flashRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const textRef = useRef('');
    const milestoneRef = useRef(0);
    const taRef = useRef<HTMLTextAreaElement | null>(null);
    const chamberRef = useRef<HTMLDivElement | null>(null);

    const shape = getPolyhedron(shapeId);
    const filledFaces = data.shapes[shapeId] ?? [];
    const shapeComplete = filledFaces.length >= shape.faceCount;

    // Persistance locale à chaque changement
    useEffect(() => {
        saveFocusShapeData(data);
    }, [data]);

    // Focus de la zone d'écriture dès l'entrée en chambre
    useEffect(() => {
        if (phase === 'holding') {
            const t = setTimeout(() => taRef.current?.focus(), 80);
            return () => clearTimeout(t);
        }
    }, [phase]);

    const setPhaseSafe = (p: Phase) => {
        phaseRef.current = p;
        setPhase(p);
    };

    // ── Timers ──
    const clearTick = useCallback(() => {
        if (tickRef.current) {
            clearInterval(tickRef.current);
            tickRef.current = null;
        }
    }, []);

    const clearIdleTimers = useCallback(() => {
        if (warnRef.current) clearTimeout(warnRef.current);
        if (resetRef.current) clearTimeout(resetRef.current);
        warnRef.current = null;
        resetRef.current = null;
    }, []);

    const doReset = useCallback(() => {
        if (phaseRef.current !== 'holding') return;
        clearTick();
        clearIdleTimers();
        startTimeRef.current = null;
        textRef.current = '';
        setText('');
        setElapsed(0);
        setProgress(0);
        setMilestone(0);
        milestoneRef.current = 0;
        setWarning(false);
        setResetsThisSession((n) => n + 1);
        setResetFlash(true);
        if (flashRef.current) clearTimeout(flashRef.current);
        flashRef.current = setTimeout(() => setResetFlash(false), 1500);
        const today = todayKey();
        setData((d) => ({
            ...d,
            resets: { ...d.resets, [today]: (d.resets[today] ?? 0) + 1 },
        }));
    }, [clearTick, clearIdleTimers]);

    const complete = useCallback(() => {
        if (phaseRef.current !== 'holding') return;
        setPhaseSafe('result');
        clearTick();
        clearIdleTimers();
        startTimeRef.current = null;
        setElapsed(SESSION_SECONDS);
        setProgress(1);
        setMilestone(4);

        const face = firstUnfilledFace(shape, filledFaces);
        if (face === null) {
            // Solide déjà complet : on revient à la configuration
            setPhaseSafe('setup');
            return;
        }
        const wasLast = filledFaces.length === shape.faceCount - 1;
        setResult({
            text: textRef.current,
            pendingFace: face,
            shapeCompleted: wasLast,
        });

        // Persistance : session Supabase + habitude + sujets récents
        setIsSaving(true);
        SupabaseDatabaseClient.getInstance()
            .saveFocusHold(SESSION_SECONDS, subject || null, 4)
            .catch(() => undefined)
            .finally(() => setIsSaving(false));
        syncFocusHabitOnSession().catch(() => undefined);

        setData((d) => ({
            ...d,
            sessions: d.sessions + 1,
            subjects: [
                subject,
                ...d.subjects.filter((s) => s !== subject),
            ].slice(0, 6),
        }));
    }, [clearTick, clearIdleTimers, filledFaces, shape, subject]);

    const scheduleIdleWatch = useCallback(() => {
        clearIdleTimers();
        warnRef.current = setTimeout(() => setWarning(true), IDLE_WARNING_MS);
        resetRef.current = setTimeout(() => doReset(), IDLE_RESET_MS);
    }, [clearIdleTimers, doReset]);

    const startTick = useCallback(() => {
        startTimeRef.current = performance.now();
        tickRef.current = setInterval(() => {
            const s = (performance.now() - startTimeRef.current!) / 1000;
            setElapsed(s);
            setProgress(Math.min(1, s / SESSION_SECONDS));
            const t = tierFor(s);
            if (t !== milestoneRef.current) {
                milestoneRef.current = t;
                setMilestone(t);
            }
            if (s >= SESSION_SECONDS) complete();
        }, 100);
    }, [complete]);

    // ── Actions de phase ──
    const beginHolding = useCallback(() => {
        clearTick();
        clearIdleTimers();
        startTimeRef.current = null;
        textRef.current = '';
        setText('');
        setElapsed(0);
        setProgress(0);
        setMilestone(0);
        milestoneRef.current = 0;
        setWarning(false);
        setResetsThisSession(0);
        setResult(null);
        setFeeling(null);
        setCopied(false);
        setPhaseSafe('holding');
    }, [clearTick, clearIdleTimers]);

    const abandon = useCallback(() => {
        clearTick();
        clearIdleTimers();
        startTimeRef.current = null;
        setPhaseSafe('setup');
    }, [clearTick, clearIdleTimers]);

    const onInput = (value: string) => {
        setText(value);
        textRef.current = value;
        if (startTimeRef.current === null) startTick();
        scheduleIdleWatch();
    };

    // Interruption quand le focus quitte la zone d'écriture
    const onTextareaBlur = () => {
        setTimeout(() => {
            if (phaseRef.current !== 'holding') return;
            const el = document.activeElement;
            if (
                !chamberRef.current ||
                !chamberRef.current.contains(el)
            ) {
                doReset();
            }
        }, 120);
    };

    // Interruption quand on quitte l'onglet / l'app
    useEffect(() => {
        const onWindowBlur = () => doReset();
        const onVisibility = () => {
            if (document.visibilityState === 'hidden') doReset();
        };
        window.addEventListener('blur', onWindowBlur);
        document.addEventListener('visibilitychange', onVisibility);
        return () => {
            window.removeEventListener('blur', onWindowBlur);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [doReset]);

    // Échap = abandonner la chambre
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && phaseRef.current === 'holding') {
                abandon();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [abandon]);

    // ── Évaluation post-séance (mieux / pareil / moins) ──
    const applyFeeling = (f: Feeling) => {
        if (!result) return;
        const { pendingFace } = result;
        setData((d) => {
            const filled = [...(d.shapes[shapeId] ?? [])];
            if (f === 'better') {
                if (!filled.includes(pendingFace)) filled.push(pendingFace);
            } else if (f === 'worse') {
                filled.shift(); // efface la gravure la plus ancienne
            }
            const shapes = { ...d.shapes, [shapeId]: filled };
            const shapeCompletedAt = { ...d.shapeCompletedAt };
            if (filled.length >= shape.faceCount) {
                shapeCompletedAt[shapeId] = new Date().toISOString();
            }
            return {
                ...d,
                shapes,
                shapeCompletedAt,
                feelings: [
                    {
                        date: new Date().toISOString(),
                        feeling: f,
                        shapeId,
                    },
                    ...d.feelings,
                ].slice(0, 200),
            };
        });
        setFeeling(f);
    };

    const resetShape = () => {
        setData((d) => ({
            ...d,
            shapes: { ...d.shapes, [shapeId]: [] },
            shapeCompletedAt: { ...d.shapeCompletedAt, [shapeId]: null },
        }));
    };

    const copyText = async () => {
        if (!result) return;
        try {
            await navigator.clipboard.writeText(result.text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard indisponible
        }
    };

    const celebrationAfterFeeling =
        !!result &&
        !!feeling &&
        feeling === 'better' &&
        filledFaces.length >= shape.faceCount;

    const feel7 = feelingsLast7Days(data);

    // ─── Rendu ─────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* En-tête */}
            <section className="rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 text-white p-6 md:p-8">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-white/15 rounded-xl">
                        <Eye className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold mb-1">
                            Focus 17/68
                        </h2>
                        <p className="text-indigo-100 text-sm md:text-base max-w-2xl">
                            Choisis un sujet et écris dessus sans t'arrêter
                            pendant 68 secondes. Chaque séance complétée grave
                            une face de ton solide — 17, 34, 51, 68 : tu sens
                            ta concentration s'accumuler.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── Phase: Setup ── */}
            {phase === 'setup' && (
                <div className="card max-w-2xl mx-auto">
                    <div className="flex items-center justify-center gap-1.5 text-xs tracking-widest text-indigo-400 font-semibold mb-4 uppercase">
                        <Sparkles size={12} />
                        Préparation
                    </div>

                    {/* Sujet */}
                    <label
                        htmlFor="focus-subject"
                        className="block text-sm font-semibold text-slate-700 mb-1.5"
                    >
                        Ton sujet
                    </label>
                    <input
                        id="focus-subject"
                        type="text"
                        placeholder="Une pensée, un projet, une émotion, une personne…"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
                    />
                    {data.subjects.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {data.subjects.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setSubject(s)}
                                    className={`text-xs rounded-full px-3 py-1 border transition ${
                                        subject === s
                                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                                            : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-200 hover:text-indigo-600'
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Choix du solide */}
                    <div className="mt-6 mb-2 text-sm font-semibold text-slate-700">
                        Ton solide
                        <span className="ml-2 font-normal text-xs text-slate-400">
                            une face = une séance de 68 s
                        </span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {POLYHEDRA.map((p) => {
                            const active = p.id === shapeId;
                            const count = (data.shapes[p.id] ?? []).length;
                            return (
                                <button
                                    key={p.id}
                                    onClick={() => setShapeId(p.id)}
                                    className={`rounded-xl border-2 p-2 pt-1 flex flex-col items-center transition ${
                                        active
                                            ? 'border-indigo-500 bg-indigo-50/60'
                                            : 'border-slate-200 bg-white hover:border-indigo-200'
                                    }`}
                                >
                                    <PolyhedronVisual
                                        shape={p}
                                        filledFaces={data.shapes[p.id] ?? []}
                                        size={52}
                                        dark={false}
                                    />
                                    <span
                                        className={`text-[11px] font-semibold ${
                                            active
                                                ? 'text-indigo-700'
                                                : 'text-slate-600'
                                        }`}
                                    >
                                        {p.name}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                        {count}/{p.faceCount} · {p.timeLabel}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Aperçu du solide sélectionné */}
                    <div className="mt-5 rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-indigo-50/40 p-5 flex flex-col items-center">
                        <PolyhedronVisual
                            shape={shape}
                            filledFaces={filledFaces}
                            size={220}
                            interactive
                            autoRotate={!shapeComplete}
                            dark={false}
                            celebrating={shapeComplete}
                        />
                        <div className="font-mono text-sm text-slate-500">
                            {shapeComplete ? (
                                <span className="text-emerald-600 font-semibold">
                                    Forme complétée !
                                </span>
                            ) : (
                                <>
                                    {filledFaces.length}
                                    <span className="text-slate-400">
                                        /{shape.faceCount}
                                    </span>{' '}
                                    faces gravées
                                </>
                            )}
                        </div>
                        {shapeComplete && (
                            <button
                                onClick={resetShape}
                                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Réinitialiser la forme
                            </button>
                        )}
                        <div className="mt-2 flex items-center gap-3 font-mono text-[10px] text-slate-400">
                            <span>7 j : ↑{feel7.better}</span>
                            <span>={feel7.same}</span>
                            <span>↓{feel7.worse}</span>
                        </div>
                    </div>

                    {/* Règles */}
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-500">
                        <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                            <Pencil className="w-3.5 h-3.5 inline mr-1 text-indigo-500" />
                            Écris sans t'arrêter sur ton sujet.
                        </div>
                        <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                            <RotateCcw className="w-3.5 h-3.5 inline mr-1 text-amber-500" />
                            Plus de 2 s d'arrêt → retour à zéro.
                        </div>
                        <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                            <Eye className="w-3.5 h-3.5 inline mr-1 text-purple-500" />
                            Paliers 17 · 34 · 51 · 68 secondes.
                        </div>
                    </div>

                    {/* CTA */}
                    <button
                        onClick={beginHolding}
                        disabled={!subject.trim() || shapeComplete}
                        className="mt-5 w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl px-8 py-3.5 text-sm font-semibold transition"
                    >
                        {shapeComplete
                            ? 'Forme complétée — réinitialise pour continuer'
                            : 'Commencer — 68 secondes'}
                    </button>
                </div>
            )}

            {/* ── Phase: Holding (la chambre) ── */}
            {phase === 'holding' && (
                <div
                    ref={chamberRef}
                    className={`max-w-2xl mx-auto rounded-3xl overflow-hidden border transition-colors duration-300 ${
                        warning
                            ? 'border-amber-400/70'
                            : resetFlash
                              ? 'border-rose-400/70'
                              : 'border-indigo-500/20'
                    }`}
                    style={{
                        background:
                            'radial-gradient(ellipse at 50% 32%, rgba(99,102,241,0.22) 0%, rgba(76,29,149,0.12) 45%, rgba(7,10,26,1) 78%)',
                        backgroundColor: '#070A1A',
                    }}
                >
                    {resetFlash && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-rose-500/15 pointer-events-none z-10"
                        />
                    )}
                    <div className="relative p-6 md:p-8 flex flex-col items-center">
                        {/* Ligne de sujet */}
                        <div className="w-full flex items-center justify-between text-xs mb-2">
                            <span className="text-white/60 italic truncate pr-3">
                                « {subject} »
                            </span>
                            <button
                                onClick={abandon}
                                className="shrink-0 text-white/40 hover:text-white/80 transition"
                            >
                                Abandonner
                            </button>
                        </div>

                        {/* Solide + face en cours */}
                        <motion.div
                            initial={{ scale: 0.96 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                        >
                            <PolyhedronVisual
                                shape={shape}
                                filledFaces={filledFaces}
                                currentFace={firstUnfilledFace(shape, filledFaces)}
                                faceProgress={progress}
                                milestone={milestone}
                                size={218}
                                autoRotate
                                dark
                            />
                        </motion.div>

                        {/* Chrono */}
                        <div className="font-mono text-3xl text-white mt-1 tabular-nums">
                            {elapsed.toFixed(1)}
                            <span className="text-sm text-white/40 ml-1.5">
                                / {SESSION_SECONDS} s
                            </span>
                        </div>

                        {/* Barre de progression à paliers */}
                        <div className="mt-3">
                            <ChamberProgress
                                progress={progress}
                                warning={warning}
                                milestone={milestone}
                            />
                        </div>

                        {/* Zone d'écriture */}
                        <textarea
                            ref={taRef}
                            value={text}
                            onChange={(e) => onInput(e.target.value)}
                            onBlur={onTextareaBlur}
                            rows={3}
                            placeholder="Écris ici, sans t'arrêter…"
                            className={`mt-4 w-full max-w-sm rounded-xl border bg-white/5 px-4 py-3 text-sm text-white placeholder-white/35 outline-none transition-colors duration-300 resize-none ${
                                warning
                                    ? 'border-amber-400/80 focus:border-amber-300'
                                    : 'border-white/15 focus:border-indigo-400'
                            }`}
                        />

                        {/* Ligne de statut */}
                        <div
                            className={`mt-3 text-xs transition-colors duration-300 ${
                                warning
                                    ? 'text-amber-300 font-semibold'
                                    : 'text-white/45'
                            }`}
                        >
                            {warning
                                ? 'Ton attention dérive… continue d\'écrire'
                                : elapsed === 0
                                  ? 'Écris pour lancer les 68 secondes'
                                  : milestone > 0
                                    ? `Palier ${milestone}/4 · ${MILESTONES[milestone - 1]}s tenus — continue`
                                    : 'Continue d\'écrire, garde le fil'}
                            {resetsThisSession > 0 && (
                                <span className="text-white/35">
                                    {' '}
                                    · {resetsThisSession} reprise
                                    {resetsThisSession > 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Toast d'interruption */}
                    <AnimatePresence>
                        {resetFlash && (
                            <motion.div
                                initial={{ opacity: 0, y: -12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-rose-500/95 text-white text-xs font-semibold rounded-full px-4 py-1.5 shadow-lg whitespace-nowrap"
                            >
                                Interruption — reparti de zéro
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* ── Phase: Result ── */}
            {phase === 'result' && result && (
                <div className="card max-w-2xl mx-auto">
                    {!feeling && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center"
                        >
                            <div className="text-xs uppercase tracking-widest text-indigo-400 font-semibold">
                                Séance complétée
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mt-1">
                                68 secondes tenues.
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">
                                Face {result.pendingFace + 1}/{shape.faceCount}
                                {result.shapeCompleted
                                    ? ' — la dernière face du solide.'
                                    : ' — prête à être gravée.'}
                            </p>

                            <div className="flex justify-center mt-2">
                                <PolyhedronVisual
                                    shape={shape}
                                    filledFaces={filledFaces}
                                    currentFace={result.pendingFace}
                                    faceProgress={1}
                                    size={170}
                                    autoRotate
                                    dark={false}
                                />
                            </div>

                            {/* Texte tapé */}
                            <div className="max-w-md mx-auto mt-3 bg-slate-50 border border-slate-200 rounded-xl p-4 max-h-44 overflow-y-auto text-sm text-slate-700 whitespace-pre-wrap text-left">
                                {result.text || (
                                    <span className="text-slate-400 italic">
                                        (aucun texte)
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={copyText}
                                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-3.5 h-3.5" /> Copié
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-3.5 h-3.5" /> Copier
                                        le texte
                                    </>
                                )}
                            </button>

                            {/* Évaluation */}
                            <h4 className="text-sm font-semibold text-slate-700 mt-6">
                                Te sens-tu mieux, pareil ou moins bien
                                qu'avant cette séance ?
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3">
                                <button
                                    onClick={() => applyFeeling('better')}
                                    className="rounded-xl border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-4 py-3 transition"
                                >
                                    <span className="flex items-center justify-center gap-1 font-bold text-emerald-700">
                                        <Plus className="w-4 h-4" /> Mieux
                                    </span>
                                    <span className="text-[10px] text-emerald-600 block mt-0.5">
                                        la face reste gravée
                                    </span>
                                </button>
                                <button
                                    onClick={() => applyFeeling('same')}
                                    className="rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 px-4 py-3 transition"
                                >
                                    <span className="flex items-center justify-center gap-1 font-bold text-slate-600">
                                        <Equal className="w-4 h-4" /> Pareil
                                    </span>
                                    <span className="text-[10px] text-slate-400 block mt-0.5">
                                        la face s'efface
                                    </span>
                                </button>
                                <button
                                    onClick={() => applyFeeling('worse')}
                                    className="rounded-xl border-2 border-rose-200 bg-rose-50 hover:bg-rose-100 px-4 py-3 transition"
                                >
                                    <span className="flex items-center justify-center gap-1 font-bold text-rose-600">
                                        <Minus className="w-4 h-4" /> Moins
                                    </span>
                                    <span className="text-[10px] text-rose-500 block mt-0.5">
                                        une ancienne face s'efface aussi
                                    </span>
                                </button>
                            </div>
                            {isSaving && (
                                <p className="text-xs text-slate-400 mt-3">
                                    Sauvegarde en cours…
                                </p>
                            )}
                        </motion.div>
                    )}

                    {!!feeling && celebrationAfterFeeling && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.94 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center"
                        >
                            <div className="text-xs uppercase tracking-widest text-emerald-500 font-semibold">
                                Forme complétée !
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mt-1">
                                {shape.name} complet.
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">
                                {shape.faceCount} faces, {shape.faceCount}{' '}
                                séances de 68 secondes. Tu l'as construit
                                toi-même, une face à la fois.
                            </p>
                            <div className="flex justify-center mt-2">
                                <PolyhedronVisual
                                    shape={shape}
                                    filledFaces={filledFaces}
                                    size={230}
                                    autoRotate
                                    dark={false}
                                    celebrating
                                />
                            </div>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 mt-4">
                                <button
                                    onClick={() => {
                                        resetShape();
                                        setPhaseSafe('setup');
                                    }}
                                    className="inline-flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl px-6 py-3 text-sm font-semibold transition"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    Réinitialiser la forme
                                </button>
                                <button
                                    onClick={() => setPhaseSafe('setup')}
                                    className="inline-flex items-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl px-6 py-3 text-sm font-semibold transition"
                                >
                                    Choisir une autre forme
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {!!feeling && !celebrationAfterFeeling && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center"
                        >
                            <p className="text-sm text-slate-600 leading-relaxed">
                                {feeling === 'better' &&
                                    `La face est gravée. ${shape.name} : ${filledFaces.length}/${shape.faceCount} faces.`}
                                {feeling === 'same' &&
                                    `La face s'efface. ${shape.name} : ${filledFaces.length}/${shape.faceCount} faces.`}
                                {feeling === 'worse' &&
                                    `La face s'efface, et une ancienne gravure disparaît aussi. ${shape.name} : ${filledFaces.length}/${shape.faceCount} faces.`}
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 mt-4">
                                <button
                                    onClick={beginHolding}
                                    className="inline-flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl px-6 py-3 text-sm font-semibold transition"
                                >
                                    <Pencil className="w-4 h-4" />
                                    Face suivante — 68 s
                                </button>
                                <button
                                    onClick={() => setPhaseSafe('setup')}
                                    className="inline-flex items-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl px-6 py-3 text-sm font-semibold transition"
                                >
                                    Voir la forme
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>
            )}

            {/* Dashboard de tendance */}
            <FocusDashboard />
        </div>
    );
};

export default FocusHoldView;
