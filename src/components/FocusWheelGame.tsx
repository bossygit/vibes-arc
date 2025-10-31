import React, { useState, useEffect } from 'react';
import {
  Circle,
  Sparkles,
  Heart,
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
} from '@/data/focusWheel';

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
          Transformez vos émotions négatives en vibrations alignées
        </p>
      </div>

      <div className="card bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-600" />
          Comment ça marche ?
        </h3>
        <div className="space-y-3 text-slate-700">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold flex-shrink-0">
              1
            </div>
            <div>
              <strong>Identifiez votre émotion</strong>
              <p className="text-sm text-slate-600">
                Exprimez ce que vous ressentez maintenant et ce que vous voulez ressentir
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold flex-shrink-0">
              2
            </div>
            <div>
              <strong>Créez votre roue</strong>
              <p className="text-sm text-slate-600">
                Sélectionnez 12 pensées qui vous font vous sentir progressivement mieux
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold flex-shrink-0">
              3
            </div>
            <div>
              <strong>Intégrez l'alignement</strong>
              <p className="text-sm text-slate-600">
                Ressentez votre nouvelle vibration et célébrez votre progrès
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
  const [unwantedFeeling, setUnwantedFeeling] = useState('');
  const [desiredFeeling, setDesiredFeeling] = useState('');
  const [initialScore, setInitialScore] = useState(5);

  const handleContinue = () => {
    if (!unwantedFeeling.trim() || !desiredFeeling.trim()) {
      alert('Veuillez remplir les deux champs');
      return;
    }

    const newWheel = initializeFocusWheel(
      unwantedFeeling.trim(),
      desiredFeeling.trim(),
      initialScore
    );

    setState((prev) => ({
      ...prev,
      currentWheel: newWheel,
      phase: 'wheel',
      currentThoughtIndex: 0,
    }));
  };

  const category = detectCategory(unwantedFeeling + ' ' + desiredFeeling);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Identification</h2>
        <p className="text-slate-600">Clarifiez votre intention vibratoire</p>
      </div>

      <div className="card">
        <div className="space-y-6">
          <div>
            <label className="block text-lg font-semibold text-slate-800 mb-3">
              Qu'est-ce que vous ressentez <span className="text-red-500">maintenant</span> ?
            </label>
            <textarea
              value={unwantedFeeling}
              onChange={(e) => setUnwantedFeeling(e.target.value)}
              placeholder="Ex: Je me sens bloqué dans mon projet, stressé financièrement..."
              className="input-field"
              rows={3}
            />
            <p className="text-xs text-slate-500 mt-2">
              Soyez honnête et authentique. Cette émotion est valide.
            </p>
          </div>

          <div>
            <label className="block text-lg font-semibold text-slate-800 mb-3">
              Quel <span className="text-green-500">état émotionnel</span> voulez-vous ressentir ?
            </label>
            <textarea
              value={desiredFeeling}
              onChange={(e) => setDesiredFeeling(e.target.value)}
              placeholder="Ex: Je veux me sentir confiant, inspiré, en paix..."
              className="input-field"
              rows={3}
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
              Sur une échelle de 0 à 10, comment vous sentez-vous maintenant ?
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
                <span>0 - Très mal</span>
                <span className="font-bold text-2xl text-purple-600">{initialScore}</span>
                <span>10 - Excellent</span>
              </div>
            </div>
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
            disabled={!unwantedFeeling.trim() || !desiredFeeling.trim()}
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

// Écran de la roue
const WheelScreen: React.FC<{
  state: FocusWheelState;
  setState: React.Dispatch<React.SetStateAction<FocusWheelState>>;
}> = ({ state, setState }) => {
  const [thoughtText, setThoughtText] = useState('');
  const [feelingScore, setFeelingScore] = useState(3);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const wheel = state.currentWheel!;
  const progress = (wheel.thoughts.length / MAX_THOUGHTS) * 100;
  const isComplete = wheel.thoughts.length === MAX_THOUGHTS;

  useEffect(() => {
    if (wheel) {
      const existingTexts = wheel.thoughts.map((t) => t.text);
      const newSuggestions = getPersonalizedSuggestions(
        wheel.unwantedFeeling,
        wheel.desiredFeeling,
        existingTexts
      );
      setSuggestions(newSuggestions);
    }
  }, [wheel]);

  const addThought = (text: string) => {
    if (!text.trim() || wheel.thoughts.length >= MAX_THOUGHTS) return;

    const updatedWheel = addThoughtToWheel(wheel, text.trim(), feelingScore);
    setState((prev) => ({
      ...prev,
      currentWheel: updatedWheel,
    }));

    setThoughtText('');
    setFeelingScore(3);
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
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Votre Focus Wheel</h2>
        <p className="text-slate-600">{wheel.desiredFeeling}</p>
      </div>

      {/* Barre de progression */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">
            {wheel.thoughts.length} / {MAX_THOUGHTS} pensées
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
        {/* Roue visuelle */}
        <div className="card">
          <h3 className="text-xl font-bold text-slate-800 mb-4">Vos pensées</h3>
          
          {/* Cercle central */}
          <div className="relative">
            <div className="w-48 h-48 mx-auto rounded-full bg-gradient-to-br from-purple-100 to-pink-100 border-4 border-purple-300 flex items-center justify-center p-6 shadow-lg">
              <p className="text-center font-semibold text-purple-800 text-sm">
                {wheel.desiredFeeling}
              </p>
            </div>

            {/* Pensées autour (affichage simplifié) */}
            {wheel.thoughts.length > 0 && (
              <div className="mt-6 space-y-2">
                {wheel.thoughts.map((thought, index) => (
                  <div
                    key={thought.id}
                    className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg border border-purple-200"
                  >
                    <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <p className="text-sm text-slate-700 flex-1">{thought.text}</p>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      {Array.from({ length: thought.feelingScore }).map((_, i) => (
                        <Heart key={i} className="w-3 h-3 fill-pink-500 text-pink-500" />
                      ))}
                    </div>
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
          </div>

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
                  Suggestions
                </h3>
                <button
                  onClick={() => setShowSuggestions(false)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {suggestions.slice(0, 10).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setThoughtText(suggestion)}
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
                    wheel.unwantedFeeling,
                    wheel.desiredFeeling,
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
                Créer ma propre pensée
              </h3>
              <div className="space-y-4">
                <div>
                  <textarea
                    value={thoughtText}
                    onChange={(e) => setThoughtText(e.target.value)}
                    placeholder="Écrivez une pensée qui vous fait vous sentir mieux..."
                    className="input-field"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Cette pensée me fait sentir :
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        onClick={() => setFeelingScore(score)}
                        className={`p-2 rounded-lg border-2 transition ${
                          feelingScore >= score
                            ? 'border-pink-500 bg-pink-50'
                            : 'border-slate-200'
                        }`}
                      >
                        <Heart
                          className={`w-6 h-6 ${
                            feelingScore >= score
                              ? 'fill-pink-500 text-pink-500'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    1 = un peu mieux, 5 = beaucoup mieux
                  </p>
                </div>

                <button
                  onClick={() => addThought(thoughtText)}
                  disabled={!thoughtText.trim() || wheel.thoughts.length >= MAX_THOUGHTS}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  <Plus className="w-5 h-5 inline mr-2" />
                  Ajouter cette pensée
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
  const [finalScore, setFinalScore] = useState(state.currentWheel?.initialScore || 5);
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
              Vous avez complété un Focus Wheel avec succès !
            </p>
          </div>
        </div>
      )}

      <div className="text-center">
        <div className="text-6xl mb-4">✨</div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Intégration</h2>
        <p className="text-slate-600">Ressentez votre nouvelle vibration</p>
      </div>

      <div className="card bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300">
        <div className="text-center mb-6">
          <div className="w-64 h-64 mx-auto rounded-full bg-gradient-to-br from-purple-200 to-pink-200 border-4 border-purple-400 flex items-center justify-center p-8 shadow-2xl animate-pulse">
            <p className="text-center font-bold text-purple-900 text-xl">
              {wheel.desiredFeeling}
            </p>
          </div>
        </div>

        <div className="space-y-4 text-center">
          <p className="text-lg text-purple-800 font-semibold">
            Prenez un moment pour respirer profondément
          </p>
          <p className="text-slate-700">
            Lisez à haute voix ou dans votre tête :
          </p>
          <div className="p-4 bg-white rounded-lg border-2 border-purple-200">
            <p className="text-xl font-semibold text-purple-800 italic">
              "{wheel.desiredFeeling}"
            </p>
          </div>
          <p className="text-sm text-slate-600">
            Ressentez cette vibration dans tout votre corps
          </p>
        </div>
      </div>

      <div className="card">
        <h3 className="text-xl font-bold text-slate-800 mb-4">Vos 12 pensées transitionnelles</h3>
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
          Comment vous sentez-vous maintenant ?
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-slate-600">Score initial</span>
              <span className="font-bold text-slate-800">{wheel.initialScore}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-slate-600">Score actuel</span>
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
            <span>0 - Très mal</span>
            <span>10 - Excellent</span>
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
                  <h3 className="text-xl font-bold text-slate-800">{wheel.desiredFeeling}</h3>
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
                    {wheel.initialScore} → {wheel.finalScore}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 mb-3">
                <p className="text-sm text-slate-700">
                  <span className="font-semibold">Ce que je ressentais :</span> {wheel.unwantedFeeling}
                </p>
              </div>

              <details className="text-sm">
                <summary className="cursor-pointer font-medium text-purple-600 hover:text-purple-700">
                  Voir les {wheel.thoughts.length} pensées
                </summary>
                <div className="mt-3 space-y-2">
                  {wheel.thoughts.map((thought, index) => (
                    <div key={thought.id} className="flex items-start gap-2 p-2 bg-purple-50 rounded">
                      <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      <p className="text-sm text-slate-700">{thought.text}</p>
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

