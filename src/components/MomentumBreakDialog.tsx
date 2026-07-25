/**
 * MomentumBreakDialog — boîte de dialogue "bloquant doux"
 *
 * S'ouvre dans le dashboard quand l'utilisateur a 3+ jours consécutifs
 * avec <50% de complétion quotidienne. Demande pourquoi il n'est pas engagé.
 *
 * Inspiré par le InnerChildGate : affiché en haut du dashboard,
 * avec possibilité de "passer" pour aujourd'hui.
 *
 * Loop 2 (Mémoire sur le bouton Passer) :
 * - Compte les skips consécutifs et hebdomadaires
 * - Adapte le ton du bouton "Passer" selon le pattern de l'utilisateur
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MomentumBreakResult } from '@/utils/momentumBreakUtils';
import { detectMomentumBreak } from '@/utils/momentumBreakUtils';
import type { Habit } from '@/types';

// ─── Storage keys ────────────────────────────────────────────────────

const DISMISSED_KEY = 'vibes-arc-momentum-break-dismissed';
const ENTRIES_KEY = 'vibes-arc-momentum-break-entries';
const SKIP_KEY = 'vibes-arc-momentum-break-skips';

// ─── Types ───────────────────────────────────────────────────────────

export interface MomentumBreakEntry {
  date: string; // YYYY-MM-DD
  reasons: string[];
  customReason: string;
  createdAt: string; // ISO
}

interface SkipRecord {
  consecutive: number;
  lastDate: string; // YYYY-MM-DD
  lastWeekSkips: number;
  weekStart: string; // YYYY-MM-DD of the Monday of the current week
}

// ─── Raisons suggérées ──────────────────────────────────────────────

export const SUGGESTED_REASONS: { id: string; label: string; emoji: string }[] = [
  { id: 'fatigue', label: 'Fatigue / Manque d\'énergie', emoji: '😴' },
  { id: 'stress', label: 'Stress / Surcharge mentale', emoji: '😰' },
  { id: 'deconnexion', label: 'Déconnexion de mes objectifs', emoji: '🔌' },
  { id: 'resistance', label: 'Résistance intérieure (peur, honte, blocage)', emoji: '🧱' },
  { id: 'distractions', label: 'Trop de distractions (écrans, réseaux)', emoji: '📱' },
  { id: 'imprevu', label: 'Événement de vie imprévu', emoji: '🌪️' },
  { id: 'perte_sens', label: 'Je ne sais pas / Perte de sens', emoji: '😶' },
  { id: 'sante', label: 'Problème de santé', emoji: '🤒' },
  { id: 'isolement', label: 'Isolement / Manque de soutien', emoji: '🫥' },
];

// ─── Helpers ─────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function weekStart(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay(); // 0=Sun, 1=Mon
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d.toISOString().slice(0, 10);
}

export function loadEntries(): MomentumBreakEntry[] {
  try {
    const raw = localStorage.getItem(ENTRIES_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function saveEntry(entry: MomentumBreakEntry) {
  const entries = loadEntries();
  const filtered = entries.filter((e) => e.date !== entry.date);
  filtered.push(entry);
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(filtered));
}

// ─── Skip tracking ──────────────────────────────────────────────────

function loadSkipRecord(): SkipRecord {
  try {
    const raw = localStorage.getItem(SKIP_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { consecutive: 0, lastDate: '', lastWeekSkips: 0, weekStart: weekStart(todayStr()) };
}

function saveSkipRecord(record: SkipRecord) {
  localStorage.setItem(SKIP_KEY, JSON.stringify(record));
}

function recordSkip(): SkipRecord {
  const record = loadSkipRecord();
  const today = todayStr();
  const currentWeekStart = weekStart(today);

  // Reset week counter if we're in a new week
  if (record.weekStart !== currentWeekStart) {
    record.weekStart = currentWeekStart;
    record.lastWeekSkips = 0;
  }

  // Check if it's a new day (consecutive reset)
  if (record.lastDate && record.lastDate !== today) {
    const lastDate = new Date(record.lastDate + 'T00:00:00');
    const todayDate = new Date(today + 'T00:00:00');
    const diffDays = Math.round((todayDate.getTime() - lastDate.getTime()) / 86400000);

    if (diffDays === 1) {
      record.consecutive++;
    } else if (diffDays > 1) {
      record.consecutive = 1;
      record.lastWeekSkips = 0;
    }
    // diffDays <= 0 should not happen, but reset to be safe
    if (diffDays <= 0) {
      record.consecutive = 1;
    }
  } else if (!record.lastDate) {
    record.consecutive = 1;
  }

  record.lastDate = today;
  record.lastWeekSkips++;
  saveSkipRecord(record);
  return record;
}

function getSkipTone(consecutiveSkips: number, weekSkips: number): { label: string; subtitle: string } {
  if (consecutiveSkips >= 3 || weekSkips >= 5) {
    return {
      label: '3ᵉ fois cette semaine — 20 secondes suffisent, ou je te laisse tranquille et on en reparle demain ?',
      subtitle: "Tu connais ce refrain. Le bouton Passer a été cliqué plusieurs fois déjà cette semaine. Pas de jugement — juste une invitation à poser le doigt dessus, même 20 secondes.",
    };
  } else if (consecutiveSkips >= 2 || weekSkips >= 3) {
    return {
      label: 'Ça arrive. Tu passes, et demain on réessaie — 5 minutes suffisent.',
      subtitle: 'Le pattern est clair : tu reviens toujours après un skip. C\'est la reprise qui compte, pas le skip.',
    };
  }
  return {
    label: 'Passer pour aujourd\'hui →',
    subtitle: '',
  };
}

// ─── Props ───────────────────────────────────────────────────────────

interface MomentumBreakDialogProps {
  result: MomentumBreakResult;
  onDismiss: () => void;
  onSubmitted: () => void;
}

// ─── Composant ──────────────────────────────────────────────────────

const MomentumBreakDialog: React.FC<MomentumBreakDialogProps> = ({
  result,
  onDismiss,
  onSubmitted,
}) => {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [customReason, setCustomReason] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const toggleReason = (id: string) => {
    setSelectedReasons((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    if (selectedReasons.length === 0 && customReason.trim() === '') {
      // On laisse soumettre vide — l'utilisateur a le droit de ne pas savoir
    }

    const entry: MomentumBreakEntry = {
      date: todayStr(),
      reasons: selectedReasons,
      customReason: customReason.trim(),
      createdAt: new Date().toISOString(),
    };

    saveEntry(entry);
    setHasSubmitted(true);

    // Petite animation avant de fermer
    setTimeout(() => {
      onSubmitted();
    }, 600);
  };

  const handleDismiss = () => {
    const skip = recordSkip();
    const tone = getSkipTone(skip.consecutive, skip.lastWeekSkips);

    // Stocker le ton utilisé pour éventuellement le relire côté IA plus tard
    try {
      localStorage.setItem('vibes-arc-last-skip-tone', JSON.stringify({ ...tone, date: todayStr() }));
    } catch { /* ignore */ }

    try {
      localStorage.setItem(DISMISSED_KEY, todayStr());
    } catch { /* ignore */ }
    onDismiss();
  };

  const lastGoodDate = result.lastGoodDate
    ? new Date(result.lastGoodDate + 'T00:00:00').toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    : null;

  const skip = loadSkipRecord();
  const tone = getSkipTone(skip.consecutive, skip.lastWeekSkips);

  return (
    <motion.section
      initial={{ opacity: 0, y: -20, scale: 0.98 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: hasSubmitted ? 0.97 : 1,
      }}
      transition={{ duration: 0.4 }}
    >
      <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 overflow-hidden shadow-lg">
        {/* En-tête */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-md">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-amber-600 font-medium uppercase tracking-wider">
                Rupture de momentum
              </p>
              <h2 className="text-lg font-bold text-slate-800">
                {result.consecutiveDaysBelow} jours sans signal fort
              </h2>
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-xl hover:bg-white/60 transition flex-shrink-0"
              aria-label={isExpanded ? 'Réduire' : 'Développer'}
            >
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-slate-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-500" />
              )}
            </button>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            Depuis le <strong>{lastGoodDate || 'début'}</strong>, tu es passé sous{' '}
            <strong>50%</strong> de tes signaux quotidiens pendant{' '}
            <strong>{result.consecutiveDaysBelow} jours consécutifs</strong>{' '}
            (moyenne : <strong>{result.averagePercent}%</strong>).
          </p>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Ce n'est pas un échec — c'est une information. Qu'est-ce qui se passe
            vraiment ? Prends 1 minute pour nommer ce qui t'éloigne.
          </p>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              {/* Raisons suggérées */}
              <div className="px-6 pb-3">
                <p className="text-xs text-slate-400 mb-3 uppercase tracking-wide font-medium">
                  Qu'est-ce qui explique cette période ? (coche ce qui est vrai)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SUGGESTED_REASONS.map((reason) => {
                    const isSelected = selectedReasons.includes(reason.id);
                    return (
                      <button
                        key={reason.id}
                        onClick={() => toggleReason(reason.id)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm text-left transition-all ${
                          isSelected
                            ? 'border-amber-400 bg-amber-100 text-amber-900 font-medium shadow-sm'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-amber-200 hover:bg-amber-50/50'
                        }`}
                      >
                        <span className="text-base flex-shrink-0">{reason.emoji}</span>
                        <span className="leading-tight">{reason.label}</span>
                        {isSelected && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="ml-auto w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0"
                          >
                            <span className="text-white text-[10px] font-bold">✓</span>
                          </motion.span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Champ libre */}
              <div className="px-6 pb-3">
                <label className="text-xs text-slate-400 mb-2 block uppercase tracking-wide font-medium">
                  Ou écris librement ce que tu ressens
                </label>
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Ex: Je suis débordé par le boulot, ou je me sens bloqué et je ne sais pas pourquoi..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-sm text-slate-700 placeholder-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 focus:outline-none resize-none transition"
                />
              </div>

              {/* Actions */}
              <div className="px-6 pb-5 flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={handleSubmit}
                  className="w-full sm:flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:from-amber-700 active:to-orange-700 text-white font-semibold text-sm transition flex items-center justify-center gap-2 shadow-md"
                >
                  <Send className="w-4 h-4" />
                  Enregistrer et continuer
                </button>
                <button
                  onClick={handleDismiss}
                  className="text-xs text-slate-400 hover:text-slate-500 transition py-2 px-3 rounded-lg hover:bg-white/60 whitespace-nowrap"
                >
                  {tone.label}
                </button>
              </div>

              {/* Ton adaptatif sous le bouton Passer */}
              {tone.subtitle && (
                <p className="text-xs text-slate-400 italic text-center px-4">
                  {tone.subtitle}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message d'ancrage */}
        <div className="border-t border-amber-200/60 px-6 py-3 bg-white/40">
          <p className="text-xs text-slate-400 italic text-center">
            "Nommer ce qui bloque est déjà un signal. Tu n'as rien à prouver — juste à observer."
          </p>
        </div>
      </div>
    </motion.section>
  );
};

// ─── Composant Gate (à utiliser dans le Dashboard) ──────────────────

interface MomentumBreakGateProps {
  habits: Habit[];
  todayIdx: number;
}

/**
 * Porte d'entrée pour le MomentumBreakDialog.
 * Gère la logique de détection, dismiss, et soumission.
 * À placer en haut du Dashboard, comme le InnerChildGate.
 */
export const MomentumBreakGate: React.FC<MomentumBreakGateProps> = ({
  habits,
  todayIdx,
}) => {
  const [dismissed, setDismissed] = React.useState<boolean>(() => {
    try {
      return localStorage.getItem(DISMISSED_KEY) === todayStr();
    } catch {
      return false;
    }
  });

  const handleSubmitted = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, todayStr());
    } catch { /* ignore */ }
    setDismissed(true);
  };

  // Si déjà dismissed aujourd'hui → on n'affiche rien
  if (dismissed) return null;

  const result = detectMomentumBreak(habits, todayIdx);

  if (!result.isBroken) return null;

  return (
    <MomentumBreakDialog
      result={result}
      onDismiss={() => {
        try {
          localStorage.setItem(DISMISSED_KEY, todayStr());
        } catch { /* ignore */ }
        setDismissed(true);
      }}
      onSubmitted={handleSubmitted}
    />
  );
};

// ─── Historique (à afficher sur le Dashboard, comme miroir) ─────────

/**
 * MomentumBreakHistory — liste en lecture seule des 5 dernières raisons
 * données au MomentumBreakDialog.
 *
 * Ferme la boucle : jusqu'ici, chaque réponse était enregistrée en
 * localStorage puis jamais relue nulle part (ni ici, ni côté coach IA).
 * Ce composant est la première étape : juste rendre visible ce qui existe déjà.
 */
export const MomentumBreakHistory: React.FC = () => {
  const [entries, setEntries] = useState<MomentumBreakEntry[]>([]);

  useEffect(() => {
    setEntries(loadEntries());
  }, []);

  if (entries.length === 0) return null;

  const last5 = [...entries]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const labelFor = (id: string) => SUGGESTED_REASONS.find((r) => r.id === id);

  return (
    <div className="card">
      <p className="text-xs text-slate-400 mb-4 uppercase tracking-wide font-medium">
        Derniers signaux de rupture
      </p>
      <ul className="space-y-3">
        {last5.map((entry) => (
          <li
            key={entry.date}
            className="text-sm border-b border-slate-100 last:border-0 pb-3 last:pb-0"
          >
            <span className="text-slate-500 font-medium">
              {new Date(entry.date + 'T00:00:00').toLocaleDateString('fr-FR', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
            </span>
            {entry.reasons.length > 0 && (
              <span className="ml-2 text-slate-700">
                {entry.reasons
                  .map((id) => {
                    const r = labelFor(id);
                    return r ? `${r.emoji} ${r.label}` : id;
                  })
                  .join(' · ')}
              </span>
            )}
            {entry.customReason && (
              <p className="text-slate-500 italic mt-1">"{entry.customReason}"</p>
            )}
            {entry.reasons.length === 0 && !entry.customReason && (
              <span className="ml-2 text-slate-400 italic">Pas de raison notée</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MomentumBreakDialog;
