import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  PlusCircle,
  Trash2,
  Calendar,
  TrendingUp,
  Settings,
  CheckCircle2,
  Heart,
  BarChart3,
  Award,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Target,
} from 'lucide-react';
import {
  MoneyMindsetState,
  MoneyMindsetSettings,
  ImaginaryExpense,
  DailyCheck,
  initializeMoneyMindsetState,
  getCurrentDayInfo,
  addExpense,
  removeExpense,
  calculateCheckAmount,
  calculateProgressStats,
  getDayCheck,
  predefinedEmotions,
  defaultSettings,
  canAddExpense,
} from '@/data/moneyMindsetGame';

const STORAGE_KEY = 'moneyMindsetGame';

const MoneyMindsetGame: React.FC = () => {
  const [state, setState] = useState<MoneyMindsetState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : initializeMoneyMindsetState();
  });

  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // Formulaire de dépense
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState(predefinedEmotions[0].value);
  const [expenseNotes, setExpenseNotes] = useState('');

  // Sauvegarde automatique
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const currentCheck = getCurrentDayInfo(state);
  const remainingAmount = currentCheck.checkAmount - currentCheck.totalSpent;
  const progressPercentage = (currentCheck.totalSpent / currentCheck.checkAmount) * 100;

  // Démarrer le jeu
  const startGame = (customSettings?: Partial<MoneyMindsetSettings>) => {
    const newState = initializeMoneyMindsetState(customSettings);
    setState({ ...newState, isStarted: true });
  };

  // Ajouter une dépense
  const handleAddExpense = () => {
    if (!expenseDescription.trim() || !expenseAmount) {
      return;
    }

    const amount = parseFloat(expenseAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Veuillez entrer un montant valide');
      return;
    }

    const validation = canAddExpense(currentCheck, amount);
    if (!validation.valid) {
      alert(validation.message);
      return;
    }

    try {
      const newState = addExpense(state, {
        description: expenseDescription.trim(),
        amount,
        emotion: selectedEmotion,
        notes: expenseNotes.trim(),
      });

      setState(newState);

      // Réinitialiser le formulaire
      setExpenseDescription('');
      setExpenseAmount('');
      setExpenseNotes('');
      setSelectedEmotion(predefinedEmotions[0].value);
    } catch (error: any) {
      alert(error.message);
    }
  };

  // Supprimer une dépense
  const handleRemoveExpense = (expenseId: string) => {
    const newState = removeExpense(state, expenseId);
    setState(newState);
  };

  // Passer au jour suivant
  const goToNextDay = () => {
    if (!currentCheck.isCompleted) {
      const confirm = window.confirm(
        `Vous n'avez pas dépensé tout votre chèque du jour (${remainingAmount.toLocaleString()} ${
          state.settings.currency
        } restants). Voulez-vous vraiment passer au jour suivant ?`
      );
      if (!confirm) return;
    }

    setState((prev) => ({
      ...prev,
      currentDay: prev.currentDay + 1,
    }));
  };

  // Aller au jour précédent
  const goToPreviousDay = () => {
    if (state.currentDay > 1) {
      setState((prev) => ({
        ...prev,
        currentDay: prev.currentDay - 1,
      }));
    }
  };

  // Mettre à jour les paramètres
  const updateSettings = (newSettings: MoneyMindsetSettings) => {
    setState((prev) => ({
      ...prev,
      settings: newSettings,
    }));
    setShowSettings(false);
  };

  // Réinitialiser le jeu
  const resetGame = () => {
    const confirm = window.confirm(
      'Êtes-vous sûr de vouloir réinitialiser le jeu ? Toutes vos données seront perdues.'
    );
    if (confirm) {
      setState(initializeMoneyMindsetState());
    }
  };

  // Statistiques
  const stats = calculateProgressStats(state);

  // Obtenir l'emoji de l'émotion
  const getEmotionEmoji = (emotionValue: string) => {
    const emotion = predefinedEmotions.find((e) => e.value === emotionValue);
    return emotion ? emotion.emoji : '😊';
  };

  const getEmotionLabel = (emotionValue: string) => {
    const emotion = predefinedEmotions.find((e) => e.value === emotionValue);
    return emotion ? emotion.label : emotionValue;
  };

  // Écran de démarrage
  if (!state.isStarted) {
    return <StartScreen onStart={startGame} />;
  }

  // Écran de paramètres
  if (showSettings) {
    return (
      <SettingsScreen
        settings={state.settings}
        onSave={updateSettings}
        onCancel={() => setShowSettings(false)}
        onReset={resetGame}
      />
    );
  }

  // Écran d'historique
  if (showHistory) {
    return (
      <HistoryScreen
        state={state}
        onClose={() => setShowHistory(false)}
        onGoToDay={(day) => {
          setState((prev) => ({ ...prev, currentDay: day }));
          setShowHistory(false);
        }}
      />
    );
  }

  // Écran de statistiques
  if (showStats) {
    return (
      <StatsScreen
        stats={stats}
        state={state}
        onClose={() => setShowStats(false)}
      />
    );
  }

  // Écran principal
  return (
    <div className="space-y-6">
      {/* En-tête avec navigation */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <DollarSign className="w-8 h-8 text-green-600" />
          Chèques d'Abondance
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Historique
          </button>
          <button
            onClick={() => setShowStats(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Stats
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Paramètres
          </button>
        </div>
      </div>

      {/* Navigation entre jours */}
      <div className="card bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
        <div className="flex items-center justify-between">
          <button
            onClick={goToPreviousDay}
            disabled={state.currentDay === 1}
            className="btn-secondary flex items-center gap-2 disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Jour précédent
          </button>

          <div className="text-center">
            <div className="text-sm text-slate-600">Jour</div>
            <div className="text-4xl font-bold text-purple-600">{state.currentDay}</div>
            {currentCheck.isCompleted && (
              <div className="flex items-center justify-center gap-2 mt-2 text-green-600">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium">Complété</span>
              </div>
            )}
          </div>

          <button
            onClick={goToNextDay}
            className="btn-primary flex items-center gap-2"
          >
            Jour suivant
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chèque du jour */}
      <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-green-600" />
              Votre Chèque du Jour
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Imaginez comment vous aimeriez dépenser cet argent
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-600">Montant</div>
            <div className="text-4xl font-bold text-green-600">
              {currentCheck.checkAmount.toLocaleString()} <span className="text-2xl">{state.settings.currency}</span>
            </div>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">
              Dépensé : {currentCheck.totalSpent.toLocaleString()} {state.settings.currency}
            </span>
            <span className="text-sm font-medium text-slate-700">
              Restant : {remainingAmount.toLocaleString()} {state.settings.currency}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all duration-500 ${
                currentCheck.isCompleted
                  ? 'bg-green-500'
                  : 'bg-gradient-to-r from-green-400 to-emerald-500'
              }`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Formulaire d'ajout de dépense */}
      {!currentCheck.isCompleted && (
        <div className="card">
          <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-purple-600" />
            Ajouter une dépense imaginaire
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description de l'achat *
              </label>
              <input
                type="text"
                value={expenseDescription}
                onChange={(e) => setExpenseDescription(e.target.value)}
                placeholder="Ex: Un voyage aux Maldives..."
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Montant ({state.settings.currency}) *
              </label>
              <input
                type="number"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                placeholder="Ex: 50000"
                className="input-field"
                min="0"
                step="100"
              />
              <p className="text-xs text-slate-500 mt-1">
                Maximum : {remainingAmount.toLocaleString()} {state.settings.currency}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Émotion ressentie *
              </label>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                {predefinedEmotions.map((emotion) => (
                  <button
                    key={emotion.value}
                    onClick={() => setSelectedEmotion(emotion.value)}
                    className={`p-3 rounded-lg border-2 transition flex flex-col items-center gap-1 ${
                      selectedEmotion === emotion.value
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-2xl">{emotion.emoji}</span>
                    <span className="text-xs text-slate-600">{emotion.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Notes (optionnel)
              </label>
              <textarea
                value={expenseNotes}
                onChange={(e) => setExpenseNotes(e.target.value)}
                placeholder="Pourquoi cet achat vous rendrait-il heureux ?"
                className="input-field"
                rows={3}
              />
            </div>

            <button
              onClick={handleAddExpense}
              disabled={!expenseDescription.trim() || !expenseAmount}
              className="btn-primary w-full disabled:opacity-50"
            >
              <PlusCircle className="w-5 h-5 inline mr-2" />
              Ajouter cette dépense
            </button>
          </div>
        </div>
      )}

      {/* Liste des dépenses du jour */}
      {currentCheck.expenses.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-600" />
            Vos dépenses imaginaires du jour
          </h3>

          <div className="space-y-3">
            {currentCheck.expenses.map((expense) => (
              <div
                key={expense.id}
                className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">{getEmotionEmoji(expense.emotion)}</span>
                      <div>
                        <h4 className="font-semibold text-slate-800">{expense.description}</h4>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <span className="font-medium text-green-600">
                            {expense.amount.toLocaleString()} {state.settings.currency}
                          </span>
                          <span>•</span>
                          <span>{getEmotionLabel(expense.emotion)}</span>
                        </div>
                      </div>
                    </div>
                    {expense.notes && (
                      <p className="text-sm text-slate-600 mt-2 italic">{expense.notes}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveExpense(expense.id)}
                    className="text-red-500 hover:text-red-700 transition ml-4"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message de félicitations si jour complété */}
      {currentCheck.isCompleted && (
        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300">
          <div className="text-center">
            <Award className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-green-900 mb-2">Bravo ! 🎉</h3>
            <p className="text-green-700 mb-4">
              Vous avez dépensé tout votre chèque du jour ! Vous avez imaginé comment profiter de{' '}
              {currentCheck.checkAmount.toLocaleString()} {state.settings.currency}.
            </p>
            <p className="text-sm text-green-600">
              Ressentez la joie et l'abondance de ces achats imaginaires. Vous méritez tout cela !
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Écran de démarrage
const StartScreen: React.FC<{ onStart: (settings?: Partial<MoneyMindsetSettings>) => void }> = ({
  onStart,
}) => {
  const [initialAmount, setInitialAmount] = useState(defaultSettings.initialAmount);
  const [increaseInterval, setIncreaseInterval] = useState(defaultSettings.increaseInterval);
  const [increaseAmount, setIncreaseAmount] = useState(defaultSettings.increaseAmount);
  const [currency, setCurrency] = useState(defaultSettings.currency);

  const handleStart = () => {
    onStart({
      initialAmount,
      increaseInterval,
      increaseAmount,
      currency,
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center">
        <div className="text-6xl mb-4">💰</div>
        <h2 className="text-4xl font-bold text-slate-800 mb-3">Chèques d'Abondance</h2>
        <p className="text-lg text-slate-600 mb-6">
          Entraînez votre pensée positive autour de l'argent
        </p>
      </div>

      <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-green-600" />
          Comment ça marche ?
        </h3>
        <div className="space-y-3 text-slate-700">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
            <p>
              <strong>Recevez un chèque imaginaire chaque jour</strong> - Vous imaginez avoir reçu
              cette somme d'argent
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
            <p>
              <strong>Dépensez-le entièrement</strong> - Notez vos achats imaginaires avec les
              montants et les émotions ressenties
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
            <p>
              <strong>Ressentez l'abondance</strong> - Visualisez ces achats et ressentez la joie
              comme si c'était réel
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
            <p>
              <strong>Le montant augmente progressivement</strong> - Plus vous pratiquez, plus les
              montants grandissent
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Settings className="w-6 h-6 text-purple-600" />
          Configurez votre jeu
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Montant initial du chèque
            </label>
            <input
              type="number"
              value={initialAmount}
              onChange={(e) => setInitialAmount(parseInt(e.target.value) || 0)}
              className="input-field"
              min="100"
              step="100"
            />
            <p className="text-xs text-slate-500 mt-1">
              Le montant de votre premier chèque imaginaire
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Augmentation tous les (jours)
            </label>
            <select
              value={increaseInterval}
              onChange={(e) => setIncreaseInterval(parseInt(e.target.value))}
              className="input-field"
            >
              <option value={1}>Chaque jour</option>
              <option value={3}>Tous les 3 jours</option>
              <option value={7}>Tous les 7 jours</option>
              <option value={14}>Tous les 14 jours</option>
              <option value={30}>Tous les 30 jours</option>
            </select>
            <p className="text-xs text-slate-500 mt-1">
              À quelle fréquence le montant du chèque augmente
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Montant de l'augmentation
            </label>
            <input
              type="number"
              value={increaseAmount}
              onChange={(e) => setIncreaseAmount(parseInt(e.target.value) || 0)}
              className="input-field"
              min="100"
              step="100"
            />
            <p className="text-xs text-slate-500 mt-1">
              De combien le chèque augmente à chaque intervalle
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Devise</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="input-field"
            >
              <option value="FCFA">FCFA</option>
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CHF">CHF</option>
              <option value="CAD">CAD</option>
            </select>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-slate-800 mb-2">Aperçu de votre progression :</h4>
          <div className="space-y-1 text-sm text-slate-700">
            <p>
              • Jour 1 : {initialAmount.toLocaleString()} {currency}
            </p>
            <p>
              • Jour {increaseInterval + 1} :{' '}
              {(initialAmount + increaseAmount).toLocaleString()} {currency}
            </p>
            <p>
              • Jour {increaseInterval * 2 + 1} :{' '}
              {(initialAmount + increaseAmount * 2).toLocaleString()} {currency}
            </p>
            <p>
              • Jour {increaseInterval * 3 + 1} :{' '}
              {(initialAmount + increaseAmount * 3).toLocaleString()} {currency}
            </p>
          </div>
        </div>

        <button onClick={handleStart} className="btn-primary w-full mt-6">
          <Target className="w-5 h-5 inline mr-2" />
          Commencer le jeu
        </button>
      </div>
    </div>
  );
};

// Écran de paramètres
const SettingsScreen: React.FC<{
  settings: MoneyMindsetSettings;
  onSave: (settings: MoneyMindsetSettings) => void;
  onCancel: () => void;
  onReset: () => void;
}> = ({ settings, onSave, onCancel, onReset }) => {
  const [initialAmount, setInitialAmount] = useState(settings.initialAmount);
  const [increaseInterval, setIncreaseInterval] = useState(settings.increaseInterval);
  const [increaseAmount, setIncreaseAmount] = useState(settings.increaseAmount);
  const [currency, setCurrency] = useState(settings.currency);

  const handleSave = () => {
    onSave({
      initialAmount,
      increaseInterval,
      increaseAmount,
      currency,
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <Settings className="w-8 h-8 text-purple-600" />
          Paramètres
        </h2>
        <button onClick={onCancel} className="btn-secondary">
          Retour
        </button>
      </div>

      <div className="card">
        <h3 className="text-xl font-bold text-slate-800 mb-4">Configuration du jeu</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Montant initial du chèque
            </label>
            <input
              type="number"
              value={initialAmount}
              onChange={(e) => setInitialAmount(parseInt(e.target.value) || 0)}
              className="input-field"
              min="100"
              step="100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Augmentation tous les (jours)
            </label>
            <select
              value={increaseInterval}
              onChange={(e) => setIncreaseInterval(parseInt(e.target.value))}
              className="input-field"
            >
              <option value={1}>Chaque jour</option>
              <option value={3}>Tous les 3 jours</option>
              <option value={7}>Tous les 7 jours</option>
              <option value={14}>Tous les 14 jours</option>
              <option value={30}>Tous les 30 jours</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Montant de l'augmentation
            </label>
            <input
              type="number"
              value={increaseAmount}
              onChange={(e) => setIncreaseAmount(parseInt(e.target.value) || 0)}
              className="input-field"
              min="100"
              step="100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Devise</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="input-field"
            >
              <option value="FCFA">FCFA</option>
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CHF">CHF</option>
              <option value="CAD">CAD</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={handleSave} className="btn-primary flex-1">
            Sauvegarder
          </button>
          <button onClick={onCancel} className="btn-secondary flex-1">
            Annuler
          </button>
        </div>
      </div>

      <div className="card bg-red-50 border-2 border-red-200">
        <h3 className="text-xl font-bold text-red-800 mb-2">Zone de danger</h3>
        <p className="text-sm text-red-700 mb-4">
          Cette action est irréversible. Toutes vos données seront perdues.
        </p>
        <button onClick={onReset} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition">
          Réinitialiser le jeu
        </button>
      </div>
    </div>
  );
};

// Écran d'historique
const HistoryScreen: React.FC<{
  state: MoneyMindsetState;
  onClose: () => void;
  onGoToDay: (day: number) => void;
}> = ({ state, onClose, onGoToDay }) => {
  const days = Object.values(state.dailyChecks).sort((a, b) => b.day - a.day);

  const getEmotionEmoji = (emotionValue: string) => {
    const emotion = predefinedEmotions.find((e) => e.value === emotionValue);
    return emotion ? emotion.emoji : '😊';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <Calendar className="w-8 h-8 text-blue-600" />
          Historique
        </h2>
        <button onClick={onClose} className="btn-secondary">
          Retour
        </button>
      </div>

      {days.length === 0 ? (
        <div className="card text-center py-12">
          <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">Aucun historique pour le moment</p>
        </div>
      ) : (
        <div className="space-y-4">
          {days.map((day) => (
            <div
              key={day.day}
              className={`card cursor-pointer hover:shadow-lg transition ${
                day.isCompleted ? 'bg-green-50 border-2 border-green-200' : ''
              }`}
              onClick={() => onGoToDay(day.day)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Jour {day.day}</h3>
                  <p className="text-sm text-slate-600">
                    {new Date(day.date).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    {day.checkAmount.toLocaleString()} {state.settings.currency}
                  </div>
                  {day.isCompleted && (
                    <div className="flex items-center gap-2 text-green-600 text-sm mt-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Complété</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Dépensé:</span>
                  <span className="font-semibold text-slate-800">
                    {day.totalSpent.toLocaleString()} {state.settings.currency}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      day.isCompleted ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${(day.totalSpent / day.checkAmount) * 100}%` }}
                  ></div>
                </div>
              </div>

              {day.expenses.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="text-sm font-medium text-slate-700">
                    {day.expenses.length} dépense(s) :
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {day.expenses.slice(0, 3).map((expense) => (
                      <div
                        key={expense.id}
                        className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-slate-200"
                      >
                        <span>{getEmotionEmoji(expense.emotion)}</span>
                        <span className="text-sm text-slate-700 truncate max-w-[150px]">
                          {expense.description}
                        </span>
                      </div>
                    ))}
                    {day.expenses.length > 3 && (
                      <div className="px-3 py-1 bg-slate-100 rounded-full text-sm text-slate-600">
                        +{day.expenses.length - 3} autre(s)
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Écran de statistiques
const StatsScreen: React.FC<{
  stats: any;
  state: MoneyMindsetState;
  onClose: () => void;
}> = ({ stats, state, onClose }) => {
  const getEmotionEmoji = (emotionValue: string) => {
    const emotion = predefinedEmotions.find((e) => e.value === emotionValue);
    return emotion ? emotion.emoji : '😊';
  };

  const getEmotionLabel = (emotionValue: string) => {
    const emotion = predefinedEmotions.find((e) => e.value === emotionValue);
    return emotion ? emotion.label : emotionValue;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-purple-600" />
          Statistiques
        </h2>
        <button onClick={onClose} className="btn-secondary">
          Retour
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50">
          <h3 className="text-sm font-medium text-slate-600 mb-2">Jours pratiqués</h3>
          <div className="text-4xl font-bold text-blue-600">{stats.totalDays}</div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-emerald-50">
          <h3 className="text-sm font-medium text-slate-600 mb-2">Jours complétés</h3>
          <div className="text-4xl font-bold text-green-600">{stats.completedDays}</div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-pink-50">
          <h3 className="text-sm font-medium text-slate-600 mb-2">Taux de complétion</h3>
          <div className="text-4xl font-bold text-purple-600">
            {stats.completionRate.toFixed(0)}%
          </div>
        </div>

        <div className="card bg-gradient-to-br from-yellow-50 to-orange-50 md:col-span-2">
          <h3 className="text-sm font-medium text-slate-600 mb-2">
            Total imaginaire dépensé
          </h3>
          <div className="text-4xl font-bold text-orange-600">
            {stats.totalImaginarySpent.toLocaleString()} {state.settings.currency}
          </div>
        </div>

        <div className="card bg-gradient-to-br from-pink-50 to-rose-50">
          <h3 className="text-sm font-medium text-slate-600 mb-2">Émotions différentes</h3>
          <div className="text-4xl font-bold text-pink-600">{stats.emotionDiversity}</div>
        </div>
      </div>

      {stats.mostUsedEmotion && (
        <div className="card">
          <h3 className="text-xl font-bold text-slate-800 mb-4">Émotion la plus ressentie</h3>
          <div className="flex items-center gap-4">
            <span className="text-6xl">{getEmotionEmoji(stats.mostUsedEmotion.emotion)}</span>
            <div>
              <div className="text-2xl font-bold text-slate-800">
                {getEmotionLabel(stats.mostUsedEmotion.emotion)}
              </div>
              <div className="text-slate-600">
                Ressentie {stats.mostUsedEmotion.count} fois
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200">
        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-indigo-600" />
          Progression des montants
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Montant actuel :</span>
            <span className="text-2xl font-bold text-indigo-600">
              {calculateCheckAmount(state.currentDay, state.settings).toLocaleString()}{' '}
              {state.settings.currency}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Prochain palier (jour {state.currentDay + state.settings.increaseInterval}) :</span>
            <span className="font-semibold text-slate-800">
              {calculateCheckAmount(
                state.currentDay + state.settings.increaseInterval,
                state.settings
              ).toLocaleString()}{' '}
              {state.settings.currency}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoneyMindsetGame;

