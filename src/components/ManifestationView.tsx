import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Copy,
  Check,
  Sparkles,
  Calendar,
  Trophy,
  Star,
  BookOpen,
  Pen,
  Sun,
  Sunset,
  Moon,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react';
import { PROGRAM_WEEKS, AFFIRMATIONS, getDayData, getWeekForDay } from '@/data/manifestationProgram';

// ─── Persistence ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'vibes-arc-manifestation';

interface ManifestationState {
  startDate: string | null;
  currentDay: number;
  completedRituals: Record<number, { morning: boolean; afternoon: boolean; evening: boolean }>;
  journal: Record<number, string>;
}

function loadState(): ManifestationState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { startDate: null, currentDay: 1, completedRituals: {}, journal: {} };
}

function saveState(s: ManifestationState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ritualsDone(r?: { morning: boolean; afternoon: boolean; evening: boolean }): number {
  if (!r) return 0;
  return +r.morning + +r.afternoon + +r.evening;
}

function totalCompletedDays(rituals: ManifestationState['completedRituals']): number {
  return Object.values(rituals).filter((r) => r.morning && r.afternoon && r.evening).length;
}

// ─── Component ───────────────────────────────────────────────────────────────

const ManifestationView: React.FC = () => {
  const [state, setState] = useState<ManifestationState>(loadState);
  const [copiedAff, setCopiedAff] = useState(false);
  const [showAffirmations, setShowAffirmations] = useState(false);
  const [showVisionBoard, setShowVisionBoard] = useState(false);

  useEffect(() => { saveState(state); }, [state]);

  const { startDate, currentDay, completedRituals, journal } = state;
  const isStarted = !!startDate;

  const set = useCallback(
    (patch: Partial<ManifestationState>) => setState((prev) => ({ ...prev, ...patch })),
    [],
  );

  // ── Actions ────────────────────────────────────────────────────────────────

  const startProgram = () => set({ startDate: new Date().toISOString().slice(0, 10), currentDay: 1 });

  const resetProgram = () => {
    if (window.confirm('Reinitialiser tout le programme ? Toute la progression sera perdue.')) {
      setState({ startDate: null, currentDay: 1, completedRituals: {}, journal: {} });
    }
  };

  const goTo = (day: number) => { if (day >= 1 && day <= 60) set({ currentDay: day }); };

  const toggleRitual = (period: 'morning' | 'afternoon' | 'evening') => {
    const prev = completedRituals[currentDay] || { morning: false, afternoon: false, evening: false };
    set({ completedRituals: { ...completedRituals, [currentDay]: { ...prev, [period]: !prev[period] } } });
  };

  const updateJournal = (text: string) => {
    set({ journal: { ...journal, [currentDay]: text } });
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedAff(true);
      setTimeout(() => setCopiedAff(false), 2000);
    });
  };

  // ── Derived values ─────────────────────────────────────────────────────────

  const dayData = getDayData(currentDay);
  const weekData = getWeekForDay(currentDay);
  const completed = totalCompletedDays(completedRituals);
  const pct = Math.round((completed / 60) * 100);
  const weekNum = dayData?.week ?? 1;
  const currentRituals = completedRituals[currentDay] || { morning: false, afternoon: false, evening: false };
  const isMidway = currentDay === 28;
  const isFinal = currentDay === 60;

  // ── Welcome screen ─────────────────────────────────────────────────────────

  if (!isStarted) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden shadow-lg">
          <img src="/kia-sportage.png" alt="Kia Sportage" className="w-full h-56 sm:h-72 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end p-6">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white drop-shadow-lg">Mon KIA est deja a moi</h2>
              <p className="text-white/90 mt-1 text-sm sm:text-base">Programme de manifestation — 60 jours</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
          <div className="text-center">
            <Sparkles className="w-14 h-14 text-amber-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-amber-900 mb-3">Programme de Manifestation KIA Sportage</h3>
            <p className="text-slate-700 mb-6 max-w-xl mx-auto">
              60 jours de rituels quotidiens (methode 369, scripting, visualisation, affirmations) pour ancrer
              la vibration de proprietaire et manifester ton KIA Sportage a Brazzaville.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <Calendar className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                <h4 className="font-semibold text-amber-900">60 Jours</h4>
                <p className="text-sm text-slate-600">8 semaines structurees</p>
              </div>
              <div className="text-center">
                <Star className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                <h4 className="font-semibold text-amber-900">3 Rituels / jour</h4>
                <p className="text-sm text-slate-600">Matin, apres-midi, soir</p>
              </div>
              <div className="text-center">
                <Trophy className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                <h4 className="font-semibold text-amber-900">Transformation</h4>
                <p className="text-sm text-slate-600">Identite de proprietaire</p>
              </div>
            </div>

            <button onClick={startProgram} className="btn-primary text-lg px-8 py-3 flex items-center gap-2 mx-auto">
              <Sparkles className="w-5 h-5" />
              Commencer les 60 jours
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main program view ──────────────────────────────────────────────────────

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Hero compact */}
      <div className="relative rounded-2xl overflow-hidden shadow-lg">
        <img src="/kia-sportage.png" alt="Kia Sportage" className="w-full h-40 sm:h-52 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end p-5">
          <div className="w-full">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow-lg">Mon KIA est deja a moi</h2>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-white/90 text-sm">
              <span className="bg-white/20 backdrop-blur px-2 py-0.5 rounded">Jour {currentDay}/60</span>
              <span className="bg-white/20 backdrop-blur px-2 py-0.5 rounded">Semaine {weekNum}/8</span>
              <span className="bg-white/20 backdrop-blur px-2 py-0.5 rounded">{pct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Progression globale</span>
          <span className="text-sm font-bold text-amber-600">{completed}/60 jours completes</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-amber-400 to-orange-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Week selector */}
      <div className="card">
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Semaines</h3>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {PROGRAM_WEEKS.map((w) => {
            const firstDay = w.days[0].day;
            const isActive = weekNum === w.week;
            return (
              <button
                key={w.week}
                onClick={() => goTo(firstDay)}
                className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition border ${
                  isActive
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300'
                }`}
              >
                <div>S{w.week}</div>
                <div className="text-[10px] opacity-80">{w.title}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Day navigation (within current week) */}
      {weekData && (
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700">
              Semaine {weekData.week} — {weekData.title}
            </span>
            <span className="text-xs text-slate-500">{weekData.subtitle}</span>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {weekData.days.map((d) => {
              const done = ritualsDone(completedRituals[d.day]);
              const isCurrent = d.day === currentDay;
              return (
                <button
                  key={d.day}
                  onClick={() => goTo(d.day)}
                  className={`w-9 h-9 rounded-full text-xs font-semibold transition relative ${
                    isCurrent
                      ? 'bg-amber-600 text-white ring-2 ring-amber-300'
                      : done === 3
                      ? 'bg-green-100 text-green-700'
                      : done > 0
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {d.day}
                  {done === 3 && !isCurrent && (
                    <CheckCircle2 className="w-3 h-3 text-green-600 absolute -top-0.5 -right-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Day content */}
      {dayData && (
        <div className="card space-y-5">
          {/* Day header */}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-bold text-slate-800">Jour {dayData.day}</h3>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                {dayData.theme}
              </span>
              {dayData.isScriptingDay && (
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium flex items-center gap-1">
                  <Pen className="w-3 h-3" /> Scripting
                </span>
              )}
            </div>
            {isMidway && (
              <div className="mt-2 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <p className="text-sm font-semibold text-blue-800">BILAN MI-PARCOURS — Compare qui tu etais au jour 1 et qui tu es maintenant !</p>
              </div>
            )}
            {isFinal && (
              <div className="mt-2 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-300">
                <p className="text-sm font-semibold text-amber-800">CELEBRATION FINALE — 60 jours accomplis ! MON KIA EST DEJA A MOI. MERCI.</p>
              </div>
            )}
          </div>

          {/* Rituals checkboxes */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-600" /> Rituels du jour
            </h4>
            <div className="space-y-3">
              <RitualRow
                icon={<Sun className="w-4 h-4 text-yellow-500" />}
                label="Matin"
                description={dayData.morning}
                checked={currentRituals.morning}
                onToggle={() => toggleRitual('morning')}
              />
              <RitualRow
                icon={<Sunset className="w-4 h-4 text-orange-500" />}
                label="Apres-midi"
                description={dayData.afternoon}
                checked={currentRituals.afternoon}
                onToggle={() => toggleRitual('afternoon')}
              />
              <RitualRow
                icon={<Moon className="w-4 h-4 text-indigo-500" />}
                label="Soir"
                description={dayData.evening}
                checked={currentRituals.evening}
                onToggle={() => toggleRitual('evening')}
              />
            </div>
          </div>

          {/* Affirmation */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-lg">
            <h4 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" /> Affirmation du jour
            </h4>
            <p className="text-slate-700 italic mb-2">"{dayData.affirmation}"</p>
            <button
              onClick={() => copyText(dayData.affirmation)}
              className="text-xs flex items-center gap-1 text-amber-700 hover:text-amber-900 transition"
            >
              {copiedAff ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copiedAff ? 'Copie !' : 'Copier'}
            </button>
          </div>

          {/* Journal / Scripting */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <Pen className="w-4 h-4 text-purple-600" />
              {dayData.isScriptingDay ? 'Scripting / Journal' : 'Journal'}
            </h4>
            <textarea
              value={journal[currentDay] || ''}
              onChange={(e) => updateJournal(e.target.value)}
              placeholder={
                dayData.isScriptingDay
                  ? 'Ecris ton scripting ici — decris la scene comme si elle se passe maintenant...'
                  : 'Notes, reflexions, gratitudes du jour...'
              }
              className="w-full h-28 px-3 py-2 border border-slate-300 rounded-lg resize-y focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm"
            />
          </div>

          {/* Day navigation */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              onClick={() => goTo(currentDay - 1)}
              disabled={currentDay === 1}
              className="flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-300 text-sm disabled:opacity-40 hover:bg-slate-50 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Precedent
            </button>
            <span className="text-xs text-slate-500">Jour {currentDay} / 60</span>
            <button
              onClick={() => goTo(currentDay + 1)}
              disabled={currentDay === 60}
              className="flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-300 text-sm disabled:opacity-40 hover:bg-slate-50 transition"
            >
              Suivant <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Collapsible: All affirmations by category */}
      <div className="card">
        <button
          onClick={() => setShowAffirmations((v) => !v)}
          className="w-full flex items-center justify-between"
        >
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" /> Toutes les affirmations
          </h3>
          {showAffirmations ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        {showAffirmations && (
          <div className="mt-4 space-y-4">
            <AffirmationCategory title="Argent & Abondance" items={AFFIRMATIONS.argent} onCopy={copyText} />
            <AffirmationCategory title="Merite & Valeur personnelle" items={AFFIRMATIONS.merite} onCopy={copyText} />
            <AffirmationCategory title="Doute & Foi" items={AFFIRMATIONS.doute} onCopy={copyText} />
          </div>
        )}
      </div>

      {/* Collapsible: Vision Board */}
      <div className="card">
        <button
          onClick={() => setShowVisionBoard((v) => !v)}
          className="w-full flex items-center justify-between"
        >
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" /> Vision Board
          </h3>
          {showVisionBoard ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        {showVisionBoard && (
          <div className="mt-4">
            <div className="relative rounded-xl overflow-hidden">
              <img src="/kia-sportage.png" alt="Mon KIA Sportage" className="w-full h-52 sm:h-64 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-4">
                <div className="flex flex-wrap gap-2 justify-center">
                  {['LIBERTE', 'ABONDANCE', 'MON KIA', 'MERCI', 'BRAZZAVILLE', 'FIERTE'].map((w) => (
                    <span
                      key={w}
                      className="px-3 py-1 bg-white/20 backdrop-blur text-white font-bold text-sm rounded-full tracking-wider"
                    >
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Completion celebration */}
      {completed === 60 && (
        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300">
          <div className="text-center">
            <Trophy className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-green-900 mb-2">60 JOURS ACCOMPLIS !</h3>
            <p className="text-green-700 mb-4">
              Tu as termine le programme de manifestation. Tu es devenu le proprietaire vibratoire de ton KIA Sportage.
              Continue a vivre dans cette energie — ton vehicule arrive au moment parfait.
            </p>
          </div>
        </div>
      )}

      {/* Reset button */}
      <div className="flex justify-center pb-8">
        <button
          onClick={resetProgram}
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-red-500 transition"
        >
          <RotateCcw className="w-3 h-3" /> Reinitialiser le programme
        </button>
      </div>
    </div>
  );
};

// ─── Sub-components ──────────────────────────────────────────────────────────

interface RitualRowProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}

const RitualRow: React.FC<RitualRowProps> = ({ icon, label, description, checked, onToggle }) => (
  <button
    onClick={onToggle}
    className={`w-full flex items-start gap-3 p-3 rounded-lg border transition text-left ${
      checked
        ? 'bg-green-50 border-green-200'
        : 'bg-white border-slate-200 hover:border-amber-300'
    }`}
  >
    <div className="mt-0.5 flex-shrink-0">
      {checked ? (
        <CheckCircle2 className="w-5 h-5 text-green-600" />
      ) : (
        <Circle className="w-5 h-5 text-slate-300" />
      )}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-0.5">
        {icon}
        <span className={`text-sm font-semibold ${checked ? 'text-green-700' : 'text-slate-700'}`}>{label}</span>
      </div>
      <p className={`text-xs leading-relaxed ${checked ? 'text-green-600' : 'text-slate-500'}`}>{description}</p>
    </div>
  </button>
);

interface AffirmationCategoryProps {
  title: string;
  items: string[];
  onCopy: (text: string) => void;
}

const AffirmationCategory: React.FC<AffirmationCategoryProps> = ({ title, items, onCopy }) => (
  <div>
    <h4 className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">{title}</h4>
    <ul className="space-y-1.5">
      {items.map((a, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-slate-700 group">
          <Star className="w-3 h-3 text-amber-400 mt-1 flex-shrink-0" />
          <span className="flex-1">{a}</span>
          <button
            onClick={() => onCopy(a)}
            className="opacity-0 group-hover:opacity-100 transition text-slate-400 hover:text-amber-600 flex-shrink-0"
            title="Copier"
          >
            <Copy className="w-3 h-3" />
          </button>
        </li>
      ))}
    </ul>
  </div>
);

export default ManifestationView;
