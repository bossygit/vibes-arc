import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Sparkles, RotateCcw } from 'lucide-react';
import SupabaseDatabaseClient from '@/database/supabase-client';
import { tierFor, feedbackFor, MILESTONES } from '@/utils/focusStatsUtils';
import { syncFocusHabitOnSession } from '@/utils/focusHabitSync';
import FocusDashboard from '@/components/focus/FocusDashboard';

// ===================================================================
// Focus 17/68 — Pratique de concentration sur une pensée unique
// Palier 1: 17s  |  Palier 2: 34s  |  Palier 3: 51s  |  Palier 4: 68s
// Règle des 17 secondes (Abraham-Hicks) : 17s = activation, 68s = ancrage
// ===================================================================

type Phase = 'setup' | 'countdown' | 'holding' | 'result';

interface FocusSession {
  duration: number;
  intention: string;
  tier: number;
}

// ─── Milestone Ring (anneau 4 segments) ──────────────────────────

function MilestoneRing({ tier }: { tier: number }) {
  const segments = [0, 1, 2, 3];
  const center = 100;
  const radius = 82;
  const litColor = '#6366f1'; // indigo-500
  const dimColor = '#e2e8f0'; // slate-200

  return (
    <svg viewBox="0 0 200 200" width="140" height="140" className="mx-auto my-1">
      {segments.map((i) => {
        const startAngle = (i / 4) * 2 * Math.PI - Math.PI / 2 + 0.08;
        const endAngle = ((i + 1) / 4) * 2 * Math.PI - Math.PI / 2 - 0.08;
        const x1 = center + Math.cos(startAngle) * radius;
        const y1 = center + Math.sin(startAngle) * radius;
        const x2 = center + Math.cos(endAngle) * radius;
        const y2 = center + Math.sin(endAngle) * radius;
        const lit = i < tier;
        return (
          <path
            key={i}
            d={`M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`}
            fill="none"
            stroke={lit ? litColor : dimColor}
            strokeWidth="7"
            strokeLinecap="round"
          />
        );
      })}
      <text
        x={center}
        y={center + 6}
        textAnchor="middle"
        fontSize="16"
        fill="#94a3b8"
        fontFamily="monospace"
        fontWeight="600"
      >
        {tier}/4
      </text>
    </svg>
  );
}

// ─── History pills ────────────────────────────────────────────────

function HistoryPills({ history }: { history: FocusSession[] }) {
  if (history.length <= 1) return null;
  return (
    <div className="flex justify-center gap-1.5 mt-5 flex-wrap">
      {history.map((s, i) => (
        <span
          key={i}
          className={`font-mono text-xs rounded-md px-2 py-1 ${
            s.tier >= 1
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
              : 'bg-slate-50 text-slate-500'
          }`}
        >
          {s.duration.toFixed(0)}s
        </span>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────

const FocusHoldView: React.FC = () => {
  const [phase, setPhase] = useState<Phase>('setup');
  const [intention, setIntention] = useState('');
  const [countdown, setCountdown] = useState(3);
  const [lastDuration, setLastDuration] = useState(0);
  const [bestDuration, setBestDuration] = useState<number | null>(null);
  const [history, setHistory] = useState<FocusSession[]>([]);
  const [allTimeBest, setAllTimeBest] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const startRef = useRef<number | null>(null);
  const phaseRef = useRef<Phase>('setup');
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const setPhaseSafe = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  // Charger l'historique depuis Supabase au montage
  useEffect(() => {
    (async () => {
      try {
        const db = SupabaseDatabaseClient.getInstance();
        const sessions = await db.getFocusHolds(20);
        if (sessions.length > 0) {
          const mapped: FocusSession[] = sessions.map((s: any) => ({
            duration: s.duration_seconds,
            intention: s.intention_label ?? '',
            tier: s.milestone_reached,
          }));
          setHistory(mapped);
          const best = Math.max(...sessions.map((s: any) => s.duration_seconds));
          setAllTimeBest(best);
          setBestDuration(best);
        }
      } catch {
        // Silencieux — l'historique local suffit
      }
    })();
  }, []);

  // Nettoyage
  useEffect(() => () => clearInterval(countdownIntervalRef.current!), []);

  // Sauvegarder une session sur Supabase (best-effort)
  const saveFocusHold = useCallback(async (durationSec: number, intentionLabel: string, tier: number) => {
    setIsSaving(true);
    try {
      const db = SupabaseDatabaseClient.getInstance();
      await db.saveFocusHold(durationSec, intentionLabel || null, tier);
    } catch {
      // Best-effort, l'historique local est déjà à jour
    } finally {
      setIsSaving(false);
    }
  }, []);

  const start = () => {
    setPhaseSafe('countdown');
    setCountdown(3);
    let n = 3;
    countdownIntervalRef.current = setInterval(() => {
      n -= 1;
      if (n <= 0) {
        clearInterval(countdownIntervalRef.current!);
        startRef.current = performance.now();
        setPhaseSafe('holding');
      } else {
        setCountdown(n);
      }
    }, 1000);
  };

  const stop = () => {
    if (phaseRef.current !== 'holding') return;
    const duration = (performance.now() - startRef.current!) / 1000;
    setLastDuration(duration);

    const newBest =
      bestDuration === null || duration > bestDuration ? duration : bestDuration;
    setBestDuration(newBest);

    const newAllTime =
      allTimeBest === null || duration > allTimeBest ? duration : allTimeBest;
    if (newAllTime !== allTimeBest) setAllTimeBest(newAllTime);

    const currentTier = tierFor(duration);
    const session: FocusSession = { duration, intention, tier: currentTier };
    setHistory((prev) => [session, ...prev].slice(0, 20));
    setPhaseSafe('result');

    // Persister en arrière-plan
    saveFocusHold(duration, intention, currentTier);

    // Sync habitude si palier ≥ 1 (au moins 17s)
    if (currentTier >= 1) {
      syncFocusHabitOnSession();
    }
  };

  // Ref toujours à jour pour le listener clavier global
  const stopRef = useRef(stop);
  stopRef.current = stop;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        stopRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const tier = tierFor(lastDuration);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <section className="rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 text-white p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/15 rounded-xl">
            <Eye className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-1">Focus 17/68</h2>
            <p className="text-indigo-100 text-sm md:text-base max-w-2xl">
              Concentration sur une pensée unique. 17 secondes pour activer, 68 pour ancrer.
              Pas de chrono visible — l'écran reste calme jusqu'à ce que tu appuies.
            </p>
          </div>
        </div>
      </section>

      {/* Carte principale */}
      <div className="card max-w-md mx-auto">
        <div className="flex items-center justify-center gap-1.5 text-xs tracking-widest text-indigo-400 font-semibold mb-4 uppercase">
          <Sparkles size={12} />
          Focus 17/68
        </div>

        {/* ── Phase: Setup ── */}
        {phase === 'setup' && (
          <div className="text-center">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              Séance d'ancrage
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-5">
              Choisis une pensée ou un désir unique. Ferme les yeux.
              <br />
              Appuie (clic ou espace) dès que ton attention part ailleurs.
            </p>
            <input
              type="text"
              placeholder="Sur quoi tu te concentres ? (optionnel)"
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 mb-5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
            />
            <button
              onClick={start}
              className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl px-8 py-3 text-sm font-semibold transition"
            >
              Commencer
            </button>
            {allTimeBest !== null && (
              <div className="mt-4 text-xs text-slate-400 font-mono">
                Record absolu : {allTimeBest.toFixed(1)}s
              </div>
            )}
          </div>
        )}

        {/* ── Phase: Countdown ── */}
        {phase === 'countdown' && (
          <div className="h-56 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={countdown}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="text-6xl font-semibold text-indigo-400 font-mono"
              >
                {countdown}
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {/* ── Phase: Holding (séance en cours) ── */}
        {phase === 'holding' && (
          <div
            className="h-56 flex flex-col items-center justify-center gap-8 cursor-pointer"
            onClick={stop}
          >
            <motion.div
              className="w-14 h-14 rounded-full bg-indigo-400"
              animate={{
                scale: [1, 1.25, 1],
                opacity: [0.4, 0.75, 0.4],
              }}
              transition={{
                duration: 5,
                ease: 'easeInOut',
                repeat: Infinity,
              }}
            />
            <div className="text-xs text-slate-400 text-center leading-relaxed px-6">
              Appuie quand ton attention part ailleurs
            </div>
          </div>
        )}

        {/* ── Phase: Result ── */}
        {phase === 'result' && (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="font-mono text-4xl font-semibold text-slate-800 mt-1">
                {lastDuration.toFixed(1)}
                <span className="text-lg text-slate-400 ml-1">s</span>
              </div>
              <MilestoneRing tier={tier} />
              <p className="text-sm text-slate-500 leading-relaxed my-2">
                {feedbackFor(lastDuration, tier)}
              </p>
              {intention && (
                <p className="text-sm text-slate-600 italic mb-5">
                  « {intention} »
                </p>
              )}
              <button
                onClick={start}
                className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl px-8 py-3 text-sm font-semibold transition"
              >
                <RotateCcw className="w-4 h-4" />
                Refaire une séance
              </button>
              {isSaving && (
                <p className="text-xs text-slate-400 mt-2">Sauvegarde en cours…</p>
              )}
            </motion.div>
            <HistoryPills history={history} />
          </div>
        )}
      </div>

      {/* Section info */}
      {phase === 'setup' && (
        <div className="max-w-md mx-auto grid grid-cols-4 gap-2 text-center">
          {MILESTONES.map((ms, i) => (
            <div
              key={ms}
              className="rounded-xl bg-white border border-slate-200 p-3"
            >
              <div className="text-lg font-bold text-indigo-600 font-mono">
                {ms}s
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
                Palier {i + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dashboard de tendance (Phase 3) */}
      <FocusDashboard />
    </div>
  );
};

export default FocusHoldView;
