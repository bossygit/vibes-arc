/**
 * Cohérence cardiaque — Biofeedback VRC (style HeartMath) pour Vibes Arc.
 *
 * Trois sources de signal cardiaque :
 *   - Mode Démo    : onde VRC sinusoïdale simulée (sans capteur)
 *   - Caméra (PPG) : photopléthysmographie via la caméra (iPhone friendly)
 *   - Ceinture BLE : capteurs Heart Rate 0x180D (Chrome/Edge, Android/desktop)
 *
 * Le score de cohérence (0-10) est calculé sur les 60 derniers intervalles RR
 * (voir src/utils/hrv/coherence.ts). En fin de session, l'utilisateur peut
 * cocher un signal « Cohérence Cardiaque » (créé au besoin) — pattern
 * « coché = signal réellement émis » (cf. Segment Intending).
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import {
    coherenceFromRR,
    emaScore,
    levelFromScore,
    COHERENCE_MIN_RR,
    COHERENCE_WINDOW_RR,
    type CoherenceLevel,
} from '@/utils/hrv/coherence';
import { DemoRrSource, type RrSource } from '@/utils/hrv/sources';
import { BleHeartRateSource } from '@/utils/hrv/bleHeartRate';
import { CameraPpgSource } from '@/utils/hrv/ppgCamera';
import { getCurrentDayIndex } from '@/utils/habitUtils';
import { totalDays } from '@/utils/dateUtils';
import BreathingOrb from './BreathingOrb';
import CoherenceGauge from './CoherenceGauge';
import HeartRateChart, { type BpmPoint } from './HeartRateChart';
import { Activity, Camera, CheckCircle2, Loader2, Play, Sparkles, Square, Wind } from 'lucide-react';

type SourceKind = 'demo' | 'camera' | 'ble';

const HABIT_NAME = 'Cohérence Cardiaque';

function formatDuration(ms: number): string {
    const totalSec = Math.max(0, Math.round(ms / 1000));
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}

const CoherenceView: React.FC = () => {
    const [sourceKind, setSourceKind] = useState<SourceKind>('demo');
    const [running, setRunning] = useState(false);
    const [starting, setStarting] = useState(false);
    const [cpm, setCpm] = useState(6);
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const [bpm, setBpm] = useState<number | null>(null);
    const [lastRr, setLastRr] = useState<number | null>(null);
    const [rrCount, setRrCount] = useState(0);
    const [score, setScore] = useState<number | null>(null);
    const [level, setLevel] = useState<CoherenceLevel | null>(null);
    const [peakFreq, setPeakFreq] = useState<number | null>(null);
    const [history, setHistory] = useState<BpmPoint[]>([]);
    const [sessionMs, setSessionMs] = useState(0);
    const [avgScore, setAvgScore] = useState<number | null>(null);
    const [habitFeedback, setHabitFeedback] = useState('');

    const cpmRef = useRef(cpm);
    useEffect(() => {
        cpmRef.current = cpm;
    }, [cpm]);

    const sourceRef = useRef<RrSource | null>(null);
    const rrWindowRef = useRef<number[]>([]);
    const emaRef = useRef<number | null>(null);
    const sumScoresRef = useRef(0);
    const countScoresRef = useRef(0);
    const scoresRef = useRef<number[]>([]);
    const sessionStartRef = useRef<number | null>(null);
    const tickRef = useRef<number | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const processCanvasRef = useRef<HTMLCanvasElement | null>(null);

    const stopSession = useCallback(() => {
        sourceRef.current?.stop();
        sourceRef.current = null;
        setRunning(false);
        if (tickRef.current !== null) {
            window.clearInterval(tickRef.current);
            tickRef.current = null;
        }
    }, []);

    // Nettoyage au démontage
    useEffect(() => {
        return () => {
            sourceRef.current?.stop();
            if (tickRef.current !== null) window.clearInterval(tickRef.current);
        };
    }, []);

    const startSession = useCallback(async () => {
        setError('');
        setStatus('');
        setHabitFeedback('');
        setStarting(true);

        // Réinitialisation de session
        rrWindowRef.current = [];
        emaRef.current = null;
        sumScoresRef.current = 0;
        countScoresRef.current = 0;
        scoresRef.current = [];
        setBpm(null);
        setLastRr(null);
        setRrCount(0);
        setScore(null);
        setLevel(null);
        setPeakFreq(null);
        setHistory([]);
        setAvgScore(null);
        setSessionMs(0);
        sessionStartRef.current = performance.now();

        const onRr = (ibi: number, bpmNow: number) => {
            const window = rrWindowRef.current;
            window.push(ibi);
            if (window.length > 180) window.shift();

            const result = coherenceFromRR(window);
            if (result) {
                emaRef.current = emaScore(emaRef.current, result.score);
                const smoothed = emaRef.current;
                sumScoresRef.current += smoothed;
                countScoresRef.current += 1;
                scoresRef.current.push(smoothed);
                if (scoresRef.current.length > 1000) scoresRef.current.shift();
                setScore(smoothed);
                setLevel(levelFromScore(smoothed));
                setPeakFreq(result.peakFreq);
                setAvgScore(Math.round((sumScoresRef.current / countScoresRef.current) * 10) / 10);
            }

            setBpm(bpmNow);
            setLastRr(Math.round(ibi));
            setRrCount((c) => c + 1);
            const now = performance.now();
            setHistory((h) => [...h, { t: now, bpm: bpmNow }].slice(-400));
        };

        const onStatus = (message: string) => setStatus(message);

        try {
            let source: RrSource;
            if (sourceKind === 'demo') {
                source = new DemoRrSource({ onRr, onStatus }, () => cpmRef.current);
            } else if (sourceKind === 'ble') {
                source = new BleHeartRateSource({ onRr, onStatus });
            } else {
                if (!videoRef.current || !processCanvasRef.current) {
                    throw new Error('Éléments caméra indisponibles.');
                }
                source = new CameraPpgSource({ onRr, onStatus }, videoRef.current, processCanvasRef.current);
            }
            sourceRef.current = source;
            await source.start();

            setRunning(true);
            tickRef.current = window.setInterval(() => {
                if (sessionStartRef.current !== null) {
                    setSessionMs(performance.now() - sessionStartRef.current);
                }
            }, 1000);
        } catch (e) {
            sourceRef.current?.stop();
            sourceRef.current = null;
            setRunning(false);
            setError(e instanceof Error ? e.message : 'Impossible de démarrer la source.');
        } finally {
            setStarting(false);
        }
    }, [sourceKind]);

    /** Coche (ou crée) le signal « Cohérence Cardiaque » du jour. */
    const markHabit = useCallback(async () => {
        try {
            setHabitFeedback('');
            const { habits, addHabit, toggleHabitDay } = useAppStore.getState();
            const todayIdx = getCurrentDayIndex();
            let habit = habits.find((h) => h.name === HABIT_NAME);
            if (!habit) {
                habit = await addHabit({
                    name: HABIT_NAME,
                    type: 'start',
                    totalDays,
                    linkedIdentities: [],
                });
            }
            if (habit && !habit.progress[todayIdx]) {
                await toggleHabitDay(habit.id, todayIdx);
                setHabitFeedback('Signal « Cohérence Cardiaque » coché pour aujourd’hui ✓');
            } else if (habit) {
                setHabitFeedback('Déjà coché pour aujourd’hui ✓');
            }
        } catch {
            setHabitFeedback('Impossible de cocher le signal — vérifie ta connexion.');
        }
    }, []);

    // Moyenne glissante 30 s (calculée à l'affichage, rafraîchie à chaque battement)
    const now = performance.now();
    const recent = history.filter((p) => p.t >= now - 30_000);
    const avgBpm = recent.length
        ? Math.round(recent.reduce((sum, p) => sum + p.bpm, 0) / recent.length)
        : null;

    const collected = Math.min(rrCount, COHERENCE_WINDOW_RR);
    const showSummary = !running && rrCount >= COHERENCE_MIN_RR;
    const highCoherencePct = scoresRef.current.length
        ? Math.round((100 * scoresRef.current.filter((s) => s >= 7).length) / scoresRef.current.length)
        : 0;

    const sourceOptions: { key: SourceKind; label: string; icon: React.ReactNode }[] = [
        { key: 'demo', label: 'Mode Démo', icon: <Sparkles className="w-4 h-4" /> },
        { key: 'camera', label: 'Caméra (PPG)', icon: <Camera className="w-4 h-4" /> },
        { key: 'ble', label: 'Ceinture BLE', icon: <Activity className="w-4 h-4" /> },
    ];

    return (
        <div className="max-w-5xl mx-auto p-4 space-y-5">
            {/* Éléments techniques (caméra PPG) — masqués visuellement mais actifs */}
            <video ref={videoRef} playsInline muted className="absolute w-px h-px opacity-0 pointer-events-none" />
            <canvas ref={processCanvasRef} width={100} height={100} className="hidden" />

            {/* ── En-tête ── */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-700/60">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Wind className="w-6 h-6 text-cyan-300" />
                            Cohérence cardiaque
                        </h1>
                        <p className="text-sm text-slate-300 mt-1">
                            Biofeedback VRC (style HeartMath) — respire au rythme de l’orbe, la cohérence se mesure en direct.
                        </p>
                    </div>
                    <span className="bg-white/10 text-cyan-200 text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                        VRC · 0.1 Hz
                    </span>
                </div>
            </div>

            {/* ── Contrôles ── */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                    {sourceOptions.map((option) => (
                        <button
                            key={option.key}
                            disabled={running || starting}
                            onClick={() => setSourceKind(option.key)}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border transition disabled:opacity-50 ${
                                sourceKind === option.key
                                    ? 'bg-cyan-500/15 border-cyan-400/60 text-cyan-200'
                                    : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                            }`}
                        >
                            {option.icon}
                            {option.label}
                        </button>
                    ))}

                    <div className="flex-1" />

                    <button
                        onClick={() => (running ? stopSession() : void startSession())}
                        disabled={starting}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition disabled:opacity-60 ${
                            running
                                ? 'bg-rose-500/90 hover:bg-rose-500 text-white'
                                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                        }`}
                    >
                        {starting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Connexion…
                            </>
                        ) : running ? (
                            <>
                                <Square className="w-4 h-4" />
                                Arrêter
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4" />
                                Démarrer la session
                            </>
                        )}
                    </button>
                </div>

                {sourceKind === 'ble' && !BleHeartRateSource.supported && (
                    <p className="text-xs text-amber-400">
                        Web Bluetooth n’est pas supporté par ce navigateur — sur iPhone, utilise la Caméra (PPG) ou le Mode Démo.
                    </p>
                )}
                {sourceKind === 'camera' && (
                    <p className="text-xs text-slate-400">
                        Sur smartphone : pose l’index sur la caméra arrière (torche activée automatiquement si disponible), sans bouger.
                    </p>
                )}

                <label className="block">
                    <div className="flex items-center justify-between text-sm text-slate-300 mb-1">
                        <span>Rythme respiratoire</span>
                        <span className="text-cyan-300 font-semibold">
                            {cpm.toFixed(1)} cycles/min · inspire {(30 / cpm).toFixed(1)} s / expire{' '}
                            {(30 / cpm).toFixed(1)} s
                        </span>
                    </div>
                    <input
                        type="range"
                        min={4.5}
                        max={7}
                        step={0.5}
                        value={cpm}
                        disabled={running}
                        onChange={(e) => setCpm(parseFloat(e.target.value))}
                        className="w-full accent-cyan-400 disabled:opacity-50"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                        <span>4.5</span>
                        <span>5.5</span>
                        <span>6 (défaut)</span>
                        <span>7</span>
                    </div>
                </label>
            </div>

            {/* ── Orbe + jauge ── */}
            <div className="grid lg:grid-cols-2 gap-5">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 flex flex-col items-center justify-center">
                    <BreathingOrb cycleSeconds={60 / cpm} running={running} />
                    <p className="text-xs text-slate-400 mt-2">
                        Inspire quand l’orbe grandit · expire quand il rétrécit
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
                    <CoherenceGauge score={score} level={level} peakFreq={peakFreq} />

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3 text-center">
                            <div className="text-2xl font-bold text-cyan-300">{bpm ?? '—'}</div>
                            <div className="text-[11px] text-slate-400">BPM actuel</div>
                        </div>
                        <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3 text-center">
                            <div className="text-2xl font-bold text-slate-200">{avgBpm ?? '—'}</div>
                            <div className="text-[11px] text-slate-400">Moyenne 30 s</div>
                        </div>
                        <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3 text-center">
                            <div className="text-2xl font-bold text-slate-200">{lastRr ?? '—'}</div>
                            <div className="text-[11px] text-slate-400">Dernier RR (ms)</div>
                        </div>
                        <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3 text-center">
                            <div className="text-2xl font-bold text-slate-200">{formatDuration(sessionMs)}</div>
                            <div className="text-[11px] text-slate-400">Durée</div>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                            <span>Collecte d’intervalles RR</span>
                            <span>
                                {collected}/{COHERENCE_WINDOW_RR}
                                {score === null && rrCount > 0 ? ' — score dans quelques secondes…' : ''}
                            </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500"
                                style={{ width: `${(collected / COHERENCE_WINDOW_RR) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Graphique BPM ── */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-200">Fréquence cardiaque (BPM instantané)</span>
                    <span className="text-[11px] text-slate-500">fenêtre 90 s</span>
                </div>
                <HeartRateChart points={history} />
            </div>

            {status && <p className="text-xs text-slate-400">{status}</p>}
            {error && <p className="text-sm text-rose-400">{error}</p>}

            {/* ── Résumé de session ── */}
            {showSummary && (
                <div className="rounded-2xl border border-cyan-900/60 bg-slate-950/80 p-5 space-y-3">
                    <h2 className="text-sm font-semibold text-cyan-200 uppercase tracking-wide">Session terminée</h2>
                    <p className="text-sm text-slate-300">
                        Durée {formatDuration(sessionMs)} · {rrCount} battements · score moyen{' '}
                        <span className="text-cyan-300 font-semibold">{avgScore?.toFixed(1) ?? '—'}/10</span> · temps en
                        cohérence élevée <span className="text-emerald-300 font-semibold">~{highCoherencePct}%</span>
                    </p>
                    <button
                        onClick={() => void markHabit()}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-400/50 text-emerald-200 text-sm font-medium hover:bg-emerald-500/25 transition"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        Marquer comme signal du jour
                    </button>
                    {habitFeedback && <p className="text-xs text-emerald-300">{habitFeedback}</p>}
                </div>
            )}
        </div>
    );
};

export default CoherenceView;
