import React, { useState, useEffect, useRef } from 'react';
import {
  Circle,
  Sparkles,
  ArrowRight,
  Plus,
  Trash2,
  RotateCw,
  Award,
  TrendingUp,
  BookOpen,
  CheckCircle2,
  X,
  Lightbulb,
  Save,
  Target,
  Clock,
} from 'lucide-react';
import {
  FocusWheelState,
  initializeFocusWheel,
  addThoughtToWheel,
  removeThoughtFromWheel,
  completeWheel,
  getPersonalizedSuggestions,
  calculateStats,
  getBadges,
  categoryNames,
  detectCategory,
  clockLabel,
} from '@/data/focusWheel';
import { EMOTIONAL_LABELS } from '@/types';

const STORAGE_KEY = 'focusWheelGame';
const MAX_THOUGHTS = 12;

const FocusWheelGame: React.FC = () => {
  const [state, setState] = useState<FocusWheelState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      currentWheel: null,
      completedWheels: [],
      totalWheels: 0,
      phase: 'start',
      currentThoughtIndex: 0,
    };
  });

  // Sauvegarder automatiquement
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const startNewWheel = () => {
    setState((prev) => ({
      ...prev,
      phase: 'identify',
      currentWheel: null,
    }));
  };

  const resetToStart = () => {
    setState((prev) => ({
      ...prev,
      phase: 'start',
      currentWheel: null,
      currentThoughtIndex: 0,
    }));
  };

  // Rendu en fonction de la phase
  switch (state.phase) {
    case 'start':
      return <StartScreen onStart={startNewWheel} state={state} setState={setState} />;
    case 'identify':
      return <IdentifyScreen setState={setState} />;
    case 'wheel':
      return <WheelScreen state={state} setState={setState} />;
    case 'integration':
      return <IntegrationScreen state={state} setState={setState} />;
    case 'journal':
      return <JournalScreen state={state} onBack={resetToStart} />;
    default:
      return <StartScreen onStart={startNewWheel} state={state} setState={setState} />;
  }
};

// Composant bouton journal
const JournalButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button onClick={onClick} className="btn-secondary flex items-center gap-2">
    <BookOpen className="w-5 h-5" />
    Journal
  </button>
);

// Écran de démarrage
const StartScreen: React.FC<{
  onStart: () => void;
  state: FocusWheelState;
  setState: React.Dispatch<React.SetStateAction<FocusWheelState>>;
}> = ({ onStart, state, setState }) => {
  const stats = calculateStats(state.completedWheels);
  const badges = getBadges(state.completedWheels);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <div className="text-6xl mb-4">🎯</div>
        <h2 className="text-4xl font-bold text-slate-800 mb-3">The Focus Wheel</h2>
        <p className="text-lg text-slate-600 mb-6">
          Le pont vibratoire vers vos désirs - Méthode Abraham Hicks
        </p>
      </div>

      <div className="card bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-600" />
          Le vrai concept du Focus Wheel
        </h3>
        <div className="space-y-3 text-slate-700">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold flex-shrink-0">
              1
            </div>
            <div>
              <strong>Choisissez une pensée NON alignée</strong>
              <p className="text-sm text-slate-600">
                Une pensée que vous VOULEZ croire mais qui ne vous semble pas vraie maintenant
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold flex-shrink-0">
              2
            </div>
            <div>
              <strong>Trouvez 12 pensées alignées</strong>
              <p className="text-sm text-slate-600">
                Des pensées qui vous semblent vraies et qui font le pont vers votre pensée cible
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold flex-shrink-0">
              3
            </div>
            <div>
              <strong>Le cercle s'illumine</strong>
              <p className="text-sm text-slate-600">
                Chaque pensée alignée allume un segment du cercle jusqu'à compléter les 12
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      {stats.totalWheels > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card bg-gradient-to-br from-blue-50 to-indigo-50">
            <div className="text-sm text-slate-600 mb-1">Wheels complétés</div>
            <div className="text-3xl font-bold text-blue-600">{stats.completedWheels}</div>
          </div>
          <div className="card bg-gradient-to-br from-green-50 to-emerald-50">
            <div className="text-sm text-slate-600 mb-1">Amélioration moy.</div>
            <div className="text-3xl font-bold text-green-600">
              +{stats.averageImprovement.toFixed(1)}
            </div>
          </div>
          <div className="card bg-gradient-to-br from-orange-50 to-amber-50">
            <div className="text-sm text-slate-600 mb-1">Pensées créées</div>
            <div className="text-3xl font-bold text-orange-600">{stats.totalThoughtsCreated}</div>
          </div>
          <div className="card bg-gradient-to-br from-pink-50 to-rose-50">
            <div className="text-sm text-slate-600 mb-1">Streak</div>
            <div className="text-3xl font-bold text-pink-600">{stats.streak} 🔥</div>
          </div>
        </div>
      )}

      {/* Badges */}
      {badges.some((b) => b.earned) && (
        <div className="card">
          <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Award className="w-6 h-6 text-yellow-600" />
            Vos badges
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {badges
              .filter((b) => b.earned)
              .map((badge) => (
                <div
                  key={badge.id}
                  className="p-3 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg border-2 border-yellow-200"
                >
                  <div className="text-3xl mb-2">{badge.icon}</div>
                  <div className="font-semibold text-slate-800 text-sm">{badge.name}</div>
                  <div className="text-xs text-slate-600">{badge.description}</div>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onStart} className="btn-primary flex-1 text-lg py-4">
          <Circle className="w-6 h-6 inline mr-2" />
          Créer un nouveau Focus Wheel
        </button>
        {state.completedWheels.length > 0 && (
          <JournalButton onClick={() => setState((prev) => ({ ...prev, phase: 'journal' }))} />
        )}
      </div>
    </div>
  );
};

// Écran d'identification
const IdentifyScreen: React.FC<{
  setState: React.Dispatch<React.SetStateAction<FocusWheelState>>;
}> = ({ setState }) => {
  const [centralThought, setCentralThought] = useState('');
  const [currentFeeling, setCurrentFeeling] = useState('');
  const [initialScore, setInitialScore] = useState(2);
  const [setpoint, setSetpoint] = useState<number | null>(null);

  const gateOk = setpoint === null || (setpoint >= 8 && setpoint <= 17);

  const handleContinue = () => {
    if (!centralThought.trim()) {
      alert('Veuillez entrer votre désir de ressenti');
      return;
    }

    const newWheel = initializeFocusWheel(
      centralThought.trim(),
      currentFeeling.trim() || 'En cours d\'exploration',
      initialScore,
      setpoint ?? undefined
    );

    setState((prev) => ({
      ...prev,
      currentWheel: newWheel,
      phase: 'wheel',
      currentThoughtIndex: 0,
    }));
  };

  const category = detectCategory(centralThought + ' ' + currentFeeling);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Votre désir de ressenti</h2>
        <p className="text-slate-600">
          « Je me sens pauvre, et je veux me sentir prospère. » — le centre de la roue est ce que vous VOULEZ ressentir.
        </p>
      </div>

      <div className="card">
        <div className="space-y-6">
          {/* ── Gate émotionnel (Process #17 : valeur maximale entre 8 et 17) ── */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <Target className="w-4 h-4 inline mr-2 text-purple-600" />
              Où es-tu sur l'échelle émotionnelle (1-22) ?
            </label>
            <select
              value={setpoint ?? ''}
              onChange={(e) => setSetpoint(e.target.value ? Number(e.target.value) : null)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">Non renseigné</option>
              {Array.from({ length: 22 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n} — {EMOTIONAL_LABELS[n]?.split(' / ')[0]}</option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-2">
              Le Focus Wheel est le plus puissant entre (8) Ennui et (17) Colère.
            </p>
            {setpoint !== null && !gateOk && (
              <div className="mt-2 text-xs rounded-lg p-2 border border-amber-200 bg-amber-50 text-amber-800">
                {setpoint < 8
                  ? 'Tu es déjà bien aligné : ce processus te servira moins. Profites-en pour autre chose ou fais-le pour ancrer.'
                  : 'Résistance très forte : le Focus Wheel risque de ne pas « coller ». Fais un Pivot d\'abord pour remonter, puis reviens.'}
              </div>
            )}
          </div>

          <div>
            <label className="block text-lg font-semibold text-slate-800 mb-3">
              <Target className="w-5 h-5 inline mr-2 text-purple-600" />
              Comment veux-tu te <span className="text-purple-600">SENTIR</span> ? (le centre de la roue)
            </label>
            <textarea
              value={centralThought}
              onChange={(e) => setCentralThought(e.target.value)}
              placeholder="Ex: Je veux me sentir prospère • Je veux me sentir léger • Je veux me sentir aimé..."
              className="input-field"
              rows={3}
            />
            <p className="text-xs text-slate-500 mt-2">
              💡 Formule-le en termes de ressenti, comme Abraham : « je me sens gros → je veux me sentir svelte », « je me sens pauvre → je veux me sentir prospère ».
            </p>
          </div>

          <div>
            <label className="block text-lg font-semibold text-slate-800 mb-3">
              Qu'est-ce qui s'est passé ? Qu'est-ce que tu ne veux pas ? <span className="text-slate-600">(contexte)</span>
            </label>
            <textarea
              value={currentFeeling}
              onChange={(e) => setCurrentFeeling(e.target.value)}
              placeholder="Ex: je me sens bloqué, stressé, inquiet... quelque chose a déclenché cette émotion"
              className="input-field"
              rows={2}
            />
            {category && (
              <p className="text-xs text-purple-600 mt-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Catégorie détectée : {categoryNames[category]}
              </p>
            )}
          </div>

          <div>
            <label className="block text-lg font-semibold text-slate-800 mb-3">
              À quel point es-tu aligné avec ce ressenti maintenant ?
            </label>
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="10"
                value={initialScore}
                onChange={(e) => setInitialScore(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-slate-600">
                <span>0 - Pas du tout</span>
                <span className="font-bold text-2xl text-purple-600">{initialScore}</span>
                <span>10 - Totalement</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Plus le score est bas, plus tu auras besoin de pensées-pont pour y arriver
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setState((prev) => ({ ...prev, phase: 'start' }))}
            className="btn-secondary"
          >
            Retour
          </button>
          <button
            onClick={handleContinue}
            disabled={!centralThought.trim()}
            className="btn-primary flex-1 disabled:opacity-50"
          >
            Créer ma roue
            <ArrowRight className="w-5 h-5 inline ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Composant Cercle avec segments
const WheelCircle: React.FC<{
  centralThought: string;
  thoughtsCount: number;
  maxThoughts: number;
}> = ({ centralThought, thoughtsCount, maxThoughts }) => {
  const segmentAngle = 360 / maxThoughts;
  
  return (
    <div className="relative w-80 h-80 mx-auto">
      {/* Cercle central */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-48 h-48 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 border-4 border-purple-300 flex items-center justify-center p-6 shadow-lg z-10">
          <p className="text-center font-semibold text-purple-800 text-sm">
            {centralThought}
          </p>
        </div>
      </div>

      {/* Segments du cercle */}
      <svg className="w-full h-full absolute inset-0 -rotate-90" viewBox="0 0 100 100">
        {Array.from({ length: maxThoughts }).map((_, index) => {
          const isActive = index < thoughtsCount;
          const startAngle = (index * segmentAngle * Math.PI) / 180;
          const endAngle = ((index + 1) * segmentAngle * Math.PI) / 180;
          
          const radius = 45;
          const innerRadius = 26;
          
          const x1 = 50 + radius * Math.cos(startAngle);
          const y1 = 50 + radius * Math.sin(startAngle);
          const x2 = 50 + radius * Math.cos(endAngle);
          const y2 = 50 + radius * Math.sin(endAngle);
          
          const x3 = 50 + innerRadius * Math.cos(endAngle);
          const y3 = 50 + innerRadius * Math.sin(endAngle);
          const x4 = 50 + innerRadius * Math.cos(startAngle);
          const y4 = 50 + innerRadius * Math.sin(startAngle);
          
          const largeArc = segmentAngle > 180 ? 1 : 0;
          
          const path = `
            M ${x1} ${y1}
            A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
            L ${x3} ${y3}
            A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}
            Z
          `;
          
          return (
            <path
              key={index}
              d={path}
              fill={isActive ? '#a855f7' : '#e9d5ff'}
              stroke="#9333ea"
              strokeWidth="0.5"
              className={isActive ? 'animate-pulse' : ''}
              style={{
                transition: 'fill 0.5s ease',
              }}
            />
          );
        })}
      </svg>

      {/* Numéros sur les segments */}
      {Array.from({ length: maxThoughts }).map((_, index) => {
        const angle = ((index + 0.5) * segmentAngle - 90) * (Math.PI / 180);
        const radius = 37;
        const x = 50 + radius * Math.cos(angle);
        const y = 50 + radius * Math.sin(angle);
        const isActive = index < thoughtsCount;
        
        return (
          <div
            key={index}
            className="absolute"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                isActive
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-200 text-purple-400'
              }`}
            >
              {index + 1}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Écran de la roue
const WheelScreen: React.FC<{
  state: FocusWheelState;
  setState: React.Dispatch<React.SetStateAction<FocusWheelState>>;
}> = ({ state, setState }) => {
  const [thoughtText, setThoughtText] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isValidatingThought, setIsValidatingThought] = useState(false);
  const [pendingThought, setPendingThought] = useState('');
  // Test du soulagement (Process #17) : colle / buissons / 17 secondes
  const [inBushes, setInBushes] = useState(false);
  const [isHolding17, setIsHolding17] = useState(false);
  const [holdSeconds, setHoldSeconds] = useState(17);

  const wheel = state.currentWheel!;
  const progress = (wheel.thoughts.length / MAX_THOUGHTS) * 100;
  const isComplete = wheel.thoughts.length === MAX_THOUGHTS;
  const nextClockPosition = clockLabel(wheel.thoughts.length + 1);

  useEffect(() => {
    if (wheel) {
      const existingTexts = wheel.thoughts.map((t) => t.text);
      const newSuggestions = getPersonalizedSuggestions(
        wheel.centralThought,
        wheel.currentFeeling,
        existingTexts
      );
      setSuggestions(newSuggestions);
    }
  }, [wheel]);

  // Compte à rebours 17 secondes (combustion : une autre pensée rejoint la première)
  useEffect(() => {
    if (!isHolding17) return;
    const interval = setInterval(() => {
      setHoldSeconds((s) => {
        if (s <= 1) {
          clearInterval(interval);
          setIsHolding17(false);
          validateAndAddThoughtRef.current(pendingThought, true);
          return 17;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isHolding17, pendingThought]);

  const validateAndAddThought = (text: string, isAligned: boolean) => {
    if (isAligned && wheel.thoughts.length < MAX_THOUGHTS) {
      const updatedWheel = addThoughtToWheel(wheel, text, true);
      setState((prev) => ({
        ...prev,
        currentWheel: updatedWheel,
      }));
    }

    setIsValidatingThought(false);
    setPendingThought('');
    setThoughtText('');
    setInBushes(false);
    setIsHolding17(false);
    setHoldSeconds(17);
  };

  const validateAndAddThoughtRef = useRef(validateAndAddThought);
  validateAndAddThoughtRef.current = validateAndAddThought;

  const promptForThought = (text: string) => {
    if (!text.trim()) return;
    setPendingThought(text.trim());
    setInBushes(false);
    setIsHolding17(false);
    setHoldSeconds(17);
    setIsValidatingThought(true);
  };

  const removeThought = (thoughtId: string) => {
    const updatedWheel = removeThoughtFromWheel(wheel, thoughtId);
    setState((prev) => ({
      ...prev,
      currentWheel: updatedWheel,
    }));
  };

  const goToIntegration = () => {
    setState((prev) => ({
      ...prev,
      phase: 'integration',
    }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Construisez votre pont vibratoire</h2>
        <p className="text-slate-600">Pensée cible : "{wheel.centralThought}"</p>
      </div>

      {/* Modale : le test du soulagement (Process #17 — « ça colle ou dans les buissons ? ») */}
      {isValidatingThought && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card max-w-md bg-white">
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              {inBushes ? '🌿 Dans les buissons…' : 'Le test du soulagement'}
            </h3>
            <p className="text-slate-700 mb-2 italic">"{pendingThought}"</p>

            {inBushes ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 leading-relaxed">
                  Cette déclaration ne colle pas : elle est trop spécifique ou trop loin de ce que tu crois vraiment.
                  C'est comme essayer de monter sur un manège qui tourne trop vite.
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  <strong>Cherche une déclaration plus générale que tu crois déjà</strong> — même un tout petit peu mieux suffit.
                  Tu n'es pas là pour résoudre, juste pour trouver une pensée qui te soulage.
                </p>
                <button
                  onClick={() => { setInBushes(false); setThoughtText(''); }}
                  className="btn-primary w-full"
                >
                  <Lightbulb className="w-5 h-5 inline mr-2" />
                  Réessayer avec une autre pensée
                </button>
              </div>
            ) : isHolding17 ? (
              <div className="text-center py-6">
                <div className="text-6xl font-bold text-purple-600 font-mono mb-3">{holdSeconds}</div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Tiens cette pensée… si tu peux rester 17 secondes, une autre pensée va la rejoindre.
                  C'est la combustion qui donne de la puissance à ta nouvelle croyance.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 leading-relaxed">
                  Abraham : une déclaration <strong>colle</strong> si elle te <strong>soulage</strong> — elle te fait sentir un
                  tout petit peu mieux. Si elle t'agace ou te rappelle ton manque, elle te jette <strong>dans les buissons</strong>.
                </p>
                <button
                  onClick={() => validateAndAddThought(pendingThought, true)}
                  className="btn-primary w-full"
                >
                  <CheckCircle2 className="w-5 h-5 inline mr-2" />
                  Ça colle — je me sens soulagé
                </button>
                <button
                  onClick={() => { setIsHolding17(true); setHoldSeconds(17); }}
                  className="btn-secondary w-full"
                >
                  <Clock className="w-5 h-5 inline mr-2" />
                  Ça colle — tenir 17 secondes d'abord
                </button>
                <button
                  onClick={() => setInBushes(true)}
                  className="w-full py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm font-medium hover:bg-red-100 transition"
                >
                  <X className="w-5 h-5 inline mr-2" />
                  Dans les buissons — ça m'agace
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Barre de progression */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">
            {wheel.thoughts.length} / {MAX_THOUGHTS} pensées qui collent
            {!isComplete && <span className="text-purple-600 font-semibold"> — prochaine : {nextClockPosition}</span>}
          </span>
          <span className="text-sm font-medium text-purple-600">{progress.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cercle visuel avec segments */}
        <div className="card">
          <h3 className="text-xl font-bold text-slate-800 mb-6 text-center">
            Votre Focus Wheel
          </h3>
          
          <WheelCircle
            centralThought={wheel.centralThought}
            thoughtsCount={wheel.thoughts.length}
            maxThoughts={MAX_THOUGHTS}
          />

          {/* Liste des pensées */}
          {wheel.thoughts.length > 0 && (
            <div className="mt-6 space-y-2">
              <h4 className="font-semibold text-slate-700 text-sm">Vos pensées-pont (positions d'horloge) :</h4>
              {wheel.thoughts.map((thought, index) => (
                <div
                  key={thought.id}
                  className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg border border-purple-200"
                >
                  <div className="w-8 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                    {clockLabel(index + 1)}
                  </div>
                  <p className="text-sm text-slate-700 flex-1">{thought.text}</p>
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <button
                    onClick={() => removeThought(thought.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {isComplete && (
            <button onClick={goToIntegration} className="btn-primary w-full mt-6">
              <CheckCircle2 className="w-5 h-5 inline mr-2" />
              Intégrer cet alignement
            </button>
          )}
        </div>

        {/* Zone d'ajout */}
        <div className="space-y-6">
          {/* Suggestions */}
          {showSuggestions && !isComplete && (
            <div className="card bg-gradient-to-br from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-600" />
                  Pensées-pont suggérées
                </h3>
                <button
                  onClick={() => setShowSuggestions(false)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-slate-600 mb-3">
                Choisissez des pensées qui vous semblent <strong>vraies</strong> maintenant
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {suggestions.slice(0, 10).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => promptForThought(suggestion)}
                    className="w-full text-left p-3 bg-white rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50 transition text-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  const existingTexts = wheel.thoughts.map((t) => t.text);
                  const newSuggestions = getPersonalizedSuggestions(
                    wheel.centralThought,
                    wheel.currentFeeling,
                    existingTexts
                  );
                  setSuggestions(newSuggestions);
                }}
                className="btn-secondary w-full mt-3"
              >
                <RotateCw className="w-4 h-4 inline mr-2" />
                Nouvelles suggestions
              </button>
            </div>
          )}

          {/* Formulaire personnalisé */}
          {!isComplete && (
            <div className="card">
              <h3 className="text-lg font-bold text-slate-800 mb-4">
                Ma propre pensée-pont
              </h3>
              <div className="space-y-4">
                <div>
                  <textarea
                    value={thoughtText}
                    onChange={(e) => setThoughtText(e.target.value)}
                    placeholder="Écrivez une pensée qui vous semble vraie et qui fait le pont..."
                    className="input-field"
                    rows={3}
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    💡 La pensée doit vous sembler vraie MAINTENANT et se rapprocher de votre pensée cible
                  </p>
                </div>

                <button
                  onClick={() => promptForThought(thoughtText)}
                  disabled={!thoughtText.trim() || wheel.thoughts.length >= MAX_THOUGHTS}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  <Plus className="w-5 h-5 inline mr-2" />
                  Valider cette pensée
                </button>
              </div>

              {!showSuggestions && (
                <button
                  onClick={() => setShowSuggestions(true)}
                  className="btn-secondary w-full mt-3"
                >
                  <Lightbulb className="w-4 h-4 inline mr-2" />
                  Voir les suggestions
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => setState((prev) => ({ ...prev, phase: 'identify' }))}
        className="btn-secondary"
      >
        Retour
      </button>
    </div>
  );
};

// Écran d'intégration
const IntegrationScreen: React.FC<{
  state: FocusWheelState;
  setState: React.Dispatch<React.SetStateAction<FocusWheelState>>;
}> = ({ state, setState }) => {
  const [finalScore, setFinalScore] = useState(state.currentWheel?.initialScore || 2);
  const [showCelebration, setShowCelebration] = useState(false);

  const wheel = state.currentWheel!;
  const improvement = finalScore - wheel.initialScore;

  const handleComplete = () => {
    const completedWheel = completeWheel(wheel, finalScore);
    
    setState((prev) => ({
      ...prev,
      currentWheel: null,
      completedWheels: [...prev.completedWheels, completedWheel],
      totalWheels: prev.totalWheels + 1,
      phase: 'start',
    }));

    setShowCelebration(true);
    setTimeout(() => {
      setShowCelebration(false);
    }, 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {showCelebration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card max-w-md bg-gradient-to-br from-purple-50 to-pink-50 border-4 border-purple-300 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-purple-800 mb-2">Bravo !</h2>
            <p className="text-purple-700">
              Vous avez construit votre pont vibratoire !
            </p>
          </div>
        </div>
      )}

      <div className="text-center">
        <div className="text-6xl mb-4">✨</div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Intégration & Alignement</h2>
        <p className="text-slate-600">Ressentez votre nouveau niveau vibratoire</p>
      </div>

      <div className="card bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300">
        <div className="text-center mb-6">
          <WheelCircle
            centralThought={wheel.centralThought}
            thoughtsCount={MAX_THOUGHTS}
            maxThoughts={MAX_THOUGHTS}
          />
        </div>

        <div className="space-y-4 text-center">
          <p className="text-lg text-purple-800 font-semibold">
            Prenez un moment pour respirer profondément
          </p>
          <p className="text-slate-700">
            Relisez votre pensée centrale et ressentez la connexion :
          </p>
          <div className="p-4 bg-white rounded-lg border-2 border-purple-200">
            <p className="text-xl font-semibold text-purple-800 italic">
              "{wheel.centralThought}"
            </p>
          </div>
          <p className="text-sm text-slate-600">
            Grâce à vos 12 pensées-pont, vous êtes maintenant plus proche de cette vibration
          </p>
          <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200 text-left">
            <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide mb-2">
              Abraham — « Plus ça fait du bien, plus ça devient bon »
            </p>
            <p className="text-sm text-indigo-900 leading-relaxed italic">
              « Nous n'avons rien résolu : tu as toujours tes impôts à faire. Mais tu te tiens dans un endroit différent.
              La clarté te viendra plus facilement qu'avant. La mémoire te viendra plus facilement qu'avant.
              Ton Point d'Attraction a changé. »
            </p>
            <p className="text-xs text-indigo-700 mt-2">
              Encercle maintenant ta pensée centrale dans ta tête : ressens à quel point tu en es plus proche qu'il y a quelques minutes.
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-xl font-bold text-slate-800 mb-4">Vos 12 pensées-pont alignées</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {wheel.thoughts.map((thought, index) => (
            <div
              key={thought.id}
              className="p-3 bg-purple-50 rounded-lg border border-purple-200"
            >
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {index + 1}
                </div>
                <p className="text-sm text-slate-700">{thought.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="text-xl font-bold text-slate-800 mb-4">
          À quel point êtes-vous aligné avec votre pensée cible maintenant ?
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-slate-600">Alignement initial</span>
              <span className="font-bold text-slate-800">{wheel.initialScore}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-slate-600">Alignement actuel</span>
              <span className="font-bold text-purple-600 text-2xl">{finalScore}</span>
            </div>
            {improvement > 0 && (
              <div className="flex items-center gap-2 text-green-600 font-semibold">
                <TrendingUp className="w-5 h-5" />
                <span>Amélioration de +{improvement} points !</span>
              </div>
            )}
          </div>

          <input
            type="range"
            min="0"
            max="10"
            value={finalScore}
            onChange={(e) => setFinalScore(parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-slate-600">
            <span>0 - Pas du tout aligné</span>
            <span>10 - Totalement aligné</span>
          </div>
        </div>

        <button onClick={handleComplete} className="btn-primary w-full mt-6 text-lg">
          <Save className="w-5 h-5 inline mr-2" />
          Enregistrer ce Focus Wheel
        </button>
      </div>
    </div>
  );
};

// Écran journal
const JournalScreen: React.FC<{
  state: FocusWheelState;
  onBack: () => void;
}> = ({ state, onBack }) => {
  const wheels = [...state.completedWheels].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-purple-600" />
          Votre Journal
        </h2>
        <button onClick={onBack} className="btn-secondary">
          Retour
        </button>
      </div>

      {wheels.length === 0 ? (
        <div className="card text-center py-12">
          <Circle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">Aucun Focus Wheel complété pour le moment</p>
        </div>
      ) : (
        <div className="space-y-4">
          {wheels.map((wheel) => (
            <div
              key={wheel.id}
              className="card hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-800">{wheel.centralThought}</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    {new Date(wheel.createdAt).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 text-green-600 font-semibold">
                    <TrendingUp className="w-5 h-5" />
                    <span>+{wheel.finalScore - wheel.initialScore}</span>
                  </div>
                  <div className="text-sm text-slate-600">
                    Alignement : {wheel.initialScore} → {wheel.finalScore}
                  </div>
                </div>
              </div>

              {wheel.currentFeeling && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 mb-3">
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold">Contexte :</span> {wheel.currentFeeling}
                  </p>
                </div>
              )}

              <details className="text-sm">
                <summary className="cursor-pointer font-medium text-purple-600 hover:text-purple-700">
                  Voir les {wheel.thoughts.length} pensées-pont
                </summary>
                <div className="mt-3 space-y-2">
                  {wheel.thoughts.map((thought, index) => (
                    <div key={thought.id} className="flex items-start gap-2 p-2 bg-purple-50 rounded">
                      <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      <p className="text-sm text-slate-700">{thought.text}</p>
                      {thought.isAligned && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />}
                    </div>
                  ))}
                </div>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FocusWheelGame;
