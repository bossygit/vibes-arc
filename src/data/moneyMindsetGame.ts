// Types pour le jeu de chèques imaginaires
export interface MoneyMindsetSettings {
  initialAmount: number;
  increaseInterval: number; // en jours (ex: 3, 7)
  increaseAmount: number;
  currency: string;
}

export interface ImaginaryExpense {
  id: string;
  description: string;
  amount: number;
  emotion: string;
  notes?: string;
  createdAt: string;
}

export interface DailyCheck {
  day: number;
  date: string;
  checkAmount: number;
  expenses: ImaginaryExpense[];
  totalSpent: number;
  isCompleted: boolean;
}

export interface MoneyMindsetState {
  isStarted: boolean;
  startDate: string;
  currentDay: number;
  settings: MoneyMindsetSettings;
  dailyChecks: Record<number, DailyCheck>;
}

// Émotions prédéfinies pour les dépenses
export const predefinedEmotions = [
  { emoji: '😊', label: 'Joie', value: 'joy' },
  { emoji: '🥰', label: 'Amour', value: 'love' },
  { emoji: '😌', label: 'Sérénité', value: 'serenity' },
  { emoji: '✨', label: 'Émerveillement', value: 'wonder' },
  { emoji: '🎉', label: 'Excitation', value: 'excitement' },
  { emoji: '💪', label: 'Puissance', value: 'power' },
  { emoji: '🙏', label: 'Gratitude', value: 'gratitude' },
  { emoji: '🌟', label: 'Fierté', value: 'pride' },
  { emoji: '😎', label: 'Confiance', value: 'confidence' },
  { emoji: '🤗', label: 'Générosité', value: 'generosity' },
  { emoji: '💎', label: 'Abondance', value: 'abundance' },
  { emoji: '🌈', label: 'Espoir', value: 'hope' },
];

// Paramètres par défaut
export const defaultSettings: MoneyMindsetSettings = {
  initialAmount: 1000,
  increaseInterval: 7, // tous les 7 jours
  increaseAmount: 500,
  currency: 'FCFA',
};

// Calculer le montant du chèque pour un jour donné
export const calculateCheckAmount = (
  day: number,
  settings: MoneyMindsetSettings
): number => {
  const intervals = Math.floor((day - 1) / settings.increaseInterval);
  return settings.initialAmount + intervals * settings.increaseAmount;
};

// Obtenir les informations du jour actuel
export const getCurrentDayInfo = (state: MoneyMindsetState): DailyCheck => {
  const { currentDay, settings, dailyChecks } = state;
  
  if (dailyChecks[currentDay]) {
    return dailyChecks[currentDay];
  }

  // Créer un nouveau jour
  const checkAmount = calculateCheckAmount(currentDay, settings);
  const today = new Date().toISOString().split('T')[0];
  
  return {
    day: currentDay,
    date: today,
    checkAmount,
    expenses: [],
    totalSpent: 0,
    isCompleted: false,
  };
};

// Valider qu'une dépense est possible
export const canAddExpense = (
  currentCheck: DailyCheck,
  amount: number
): { valid: boolean; message?: string } => {
  if (amount <= 0) {
    return { valid: false, message: 'Le montant doit être positif' };
  }

  const remaining = currentCheck.checkAmount - currentCheck.totalSpent;
  if (amount > remaining) {
    return {
      valid: false,
      message: `Montant trop élevé. Il reste ${remaining.toLocaleString()} ${defaultSettings.currency}`,
    };
  }

  return { valid: true };
};

// Ajouter une dépense
export const addExpense = (
  state: MoneyMindsetState,
  expense: Omit<ImaginaryExpense, 'id' | 'createdAt'>
): MoneyMindsetState => {
  const currentCheck = getCurrentDayInfo(state);
  const validation = canAddExpense(currentCheck, expense.amount);

  if (!validation.valid) {
    throw new Error(validation.message);
  }

  const newExpense: ImaginaryExpense = {
    ...expense,
    id: `${Date.now()}-${Math.random()}`,
    createdAt: new Date().toISOString(),
  };

  const updatedExpenses = [...currentCheck.expenses, newExpense];
  const totalSpent = updatedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const isCompleted = totalSpent === currentCheck.checkAmount;

  const updatedCheck: DailyCheck = {
    ...currentCheck,
    expenses: updatedExpenses,
    totalSpent,
    isCompleted,
  };

  return {
    ...state,
    dailyChecks: {
      ...state.dailyChecks,
      [state.currentDay]: updatedCheck,
    },
  };
};

// Supprimer une dépense
export const removeExpense = (
  state: MoneyMindsetState,
  expenseId: string
): MoneyMindsetState => {
  const currentCheck = getCurrentDayInfo(state);
  const updatedExpenses = currentCheck.expenses.filter((exp) => exp.id !== expenseId);
  const totalSpent = updatedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const isCompleted = totalSpent === currentCheck.checkAmount;

  const updatedCheck: DailyCheck = {
    ...currentCheck,
    expenses: updatedExpenses,
    totalSpent,
    isCompleted,
  };

  return {
    ...state,
    dailyChecks: {
      ...state.dailyChecks,
      [state.currentDay]: updatedCheck,
    },
  };
};

// Calculer les statistiques de progression
export interface ProgressStats {
  totalDays: number;
  completedDays: number;
  completionRate: number;
  totalImaginarySpent: number;
  mostUsedEmotion: { emotion: string; count: number } | null;
  emotionDiversity: number;
}

export const calculateProgressStats = (state: MoneyMindsetState): ProgressStats => {
  const checks = Object.values(state.dailyChecks);
  const completedChecks = checks.filter((check) => check.isCompleted);
  
  const totalImaginarySpent = checks.reduce((sum, check) => sum + check.totalSpent, 0);
  
  // Comptage des émotions
  const emotionCounts: Record<string, number> = {};
  checks.forEach((check) => {
    check.expenses.forEach((expense) => {
      emotionCounts[expense.emotion] = (emotionCounts[expense.emotion] || 0) + 1;
    });
  });

  const emotions = Object.entries(emotionCounts);
  const mostUsedEmotion =
    emotions.length > 0
      ? emotions.reduce((max, current) =>
          current[1] > max[1] ? current : max
        )
      : null;

  return {
    totalDays: checks.length,
    completedDays: completedChecks.length,
    completionRate: checks.length > 0 ? (completedChecks.length / checks.length) * 100 : 0,
    totalImaginarySpent,
    mostUsedEmotion: mostUsedEmotion
      ? { emotion: mostUsedEmotion[0], count: mostUsedEmotion[1] }
      : null,
    emotionDiversity: emotions.length,
  };
};

// Obtenir le chèque d'un jour spécifique
export const getDayCheck = (
  state: MoneyMindsetState,
  day: number
): DailyCheck | null => {
  return state.dailyChecks[day] || null;
};

// Initialiser un nouvel état
export const initializeMoneyMindsetState = (
  settings?: Partial<MoneyMindsetSettings>
): MoneyMindsetState => {
  return {
    isStarted: false,
    startDate: new Date().toISOString(),
    currentDay: 1,
    settings: {
      ...defaultSettings,
      ...settings,
    },
    dailyChecks: {},
  };
};

