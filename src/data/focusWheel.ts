// Types pour The Focus Wheel Game
export interface FocusWheelThought {
  id: string;
  text: string;
  position: number; // 1-12
  isAligned: boolean; // true = je suis aligné avec cette pensée
  createdAt: string;
}

export interface FocusWheel {
  id: string;
  centralThought: string; // Pensée centrale (le DÉSIR de ressenti — "Je veux me sentir...")
  currentFeeling: string; // Ce qui s'est passé / ce que je ne veux pas (contexte)
  thoughts: FocusWheelThought[]; // 12 pensées alignées qui font le pont
  initialScore: number; // 0-10 - alignement initial avec la pensée centrale
  finalScore: number; // 0-10 - alignement final
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
  /** Gate émotionnel du Process #17 : set-point 1-22 au moment de la roue (idéal 8-17) */
  setpoint?: number;
}

export interface FocusWheelState {
  currentWheel: FocusWheel | null;
  completedWheels: FocusWheel[];
  totalWheels: number;
  phase: 'start' | 'identify' | 'wheel' | 'integration' | 'journal';
  currentThoughtIndex: number;
}

// Catégories thématiques pour les suggestions
export type FocusWheelCategory = 
  | 'abundance'
  | 'confidence'
  | 'relationships'
  | 'health'
  | 'career'
  | 'creativity'
  | 'peace'
  | 'self-love';

// Suggestions de pensées par catégorie
export interface ThoughtSuggestion {
  category: FocusWheelCategory;
  keywords: string[];
  suggestions: string[];
}

// Base de suggestions de pensées transitionnelles
export const thoughtSuggestions: ThoughtSuggestion[] = [
  {
    category: 'abundance',
    keywords: ['argent', 'abondance', 'richesse', 'financier', 'prospérité'],
    suggestions: [
      "J'ai déjà reçu de l'argent dans ma vie",
      "Je suis capable de créer de la valeur",
      "L'abondance existe partout autour de moi",
      "Je peux apprécier ce que j'ai maintenant",
      "Chaque jour apporte de nouvelles opportunités",
      "Je suis ouvert à recevoir",
      "L'argent circule naturellement",
      "J'ai toujours eu ce dont j'avais besoin",
      "Je mérite de vivre confortablement",
      "Des solutions existent que je ne vois pas encore",
      "Je peux me sentir bien même maintenant",
      "L'univers est généreux et abondant",
    ],
  },
  {
    category: 'confidence',
    keywords: ['confiance', 'confiant', 'capable', 'compétent', 'sûr'],
    suggestions: [
      "J'ai déjà surmonté des défis dans le passé",
      "Je n'ai pas besoin d'être parfait pour commencer",
      "Chaque expert a été un débutant",
      "Je peux apprendre ce dont j'ai besoin",
      "Mes erreurs m'aident à grandir",
      "Je suis plus capable que je ne le crois",
      "J'ai des qualités uniques à offrir",
      "Je peux faire un petit pas aujourd'hui",
      "Ma valeur ne dépend pas de mes performances",
      "Je m'améliore chaque jour",
      "Je peux me faire confiance",
      "J'ai le droit d'être fier de mes progrès",
    ],
  },
  {
    category: 'relationships',
    keywords: ['relation', 'amour', 'famille', 'ami', 'couple', 'connexion'],
    suggestions: [
      "Je mérite d'être aimé tel que je suis",
      "Des gens bienveillants existent",
      "Je peux commencer par m'aimer moi-même",
      "Chaque relation m'apprend quelque chose",
      "Je suis capable de créer des liens authentiques",
      "L'amour est disponible pour moi",
      "Je peux être vulnérable et en sécurité",
      "Les bonnes personnes viendront à moi",
      "Je suis digne de respect",
      "Je peux pardonner et avancer",
      "L'amour commence par moi",
      "Je peux attirer des relations saines",
    ],
  },
  {
    category: 'health',
    keywords: ['santé', 'corps', 'énergie', 'vitalité', 'bien-être', 'guérison'],
    suggestions: [
      "Mon corps fait de son mieux pour moi",
      "Je peux prendre soin de moi progressivement",
      "Chaque petit geste compte",
      "Mon corps a une capacité naturelle à guérir",
      "Je peux écouter les besoins de mon corps",
      "Je mérite de me sentir bien",
      "L'énergie revient naturellement",
      "Je peux me reposer quand j'en ai besoin",
      "Mon corps me parle avec sagesse",
      "Je suis plus que mon corps",
      "La santé est un voyage, pas une destination",
      "Je peux célébrer chaque amélioration",
    ],
  },
  {
    category: 'career',
    keywords: ['travail', 'carrière', 'projet', 'professionnel', 'business', 'réussite'],
    suggestions: [
      "J'ai des compétences précieuses",
      "Des opportunités existent que je ne vois pas encore",
      "Je peux créer mon propre chemin",
      "Chaque expérience enrichit mon parcours",
      "Je suis au bon endroit pour apprendre",
      "Ma contribution a de la valeur",
      "Je peux demander de l'aide quand j'en ai besoin",
      "Le succès se construit progressivement",
      "Je suis capable de m'adapter",
      "Mes idées ont de l'importance",
      "Je peux réussir à ma manière",
      "L'univers soutient mes ambitions alignées",
    ],
  },
  {
    category: 'creativity',
    keywords: ['créativité', 'créatif', 'art', 'inspiration', 'expression', 'imagination'],
    suggestions: [
      "La créativité coule naturellement en moi",
      "Je n'ai pas besoin d'être parfait pour créer",
      "Chaque création est une exploration",
      "Mon expression unique a de la valeur",
      "L'inspiration vient quand je me détends",
      "Je peux jouer et expérimenter",
      "Il n'y a pas de mauvaise création",
      "Je suis un canal pour l'inspiration",
      "Mon authenticité est ma force créative",
      "Je peux créer pour le plaisir",
      "L'univers me guide vers mes meilleures idées",
      "Ma créativité est illimitée",
    ],
  },
  {
    category: 'peace',
    keywords: ['paix', 'calme', 'sérénité', 'tranquillité', 'zen', 'repos'],
    suggestions: [
      "Ce moment présent est tout ce qui existe vraiment",
      "Je peux respirer et me détendre maintenant",
      "Tout se déroule au bon moment",
      "Je n'ai pas besoin de tout contrôler",
      "La paix est disponible en moi",
      "Je peux lâcher prise progressivement",
      "Chaque respiration m'apaise",
      "Je suis en sécurité maintenant",
      "Le silence nourrit mon âme",
      "Je peux choisir la paix",
      "L'univers prend soin de tout",
      "Je mérite de me reposer",
    ],
  },
  {
    category: 'self-love',
    keywords: ['amour de soi', 'estime', 'acceptation', 'bienveillance', 'compassion'],
    suggestions: [
      "Je suis digne d'amour et de respect",
      "Je peux être mon meilleur ami",
      "Mes imperfections font partie de mon humanité",
      "Je mérite de la douceur",
      "Je peux me pardonner",
      "Je fais de mon mieux avec ce que je sais",
      "Mon bien-être est une priorité",
      "Je peux m'accepter tel que je suis",
      "Je suis en évolution constante",
      "Ma valeur est innée",
      "Je peux célébrer mes victoires",
      "Je suis assez, tel que je suis maintenant",
    ],
  },
];

// Suggestions universelles (applicables à toutes situations)
export const universalSuggestions = [
  "Je peux me sentir un peu mieux maintenant",
  "Tout se déroule au moment parfait",
  "Je n'ai pas besoin de tout comprendre aujourd'hui",
  "Je peux faire un petit pas",
  "L'univers me soutient",
  "Je suis guidé vers ce qui est bon pour moi",
  "Chaque jour est une nouvelle opportunité",
  "Je peux choisir mes pensées",
  "Mon ressenti s'améliore progressivement",
  "Je suis plus fort que je ne le crois",
  "La solution viendra au bon moment",
  "Je peux avoir confiance en la vie",
];

// Déterminer la catégorie en fonction des mots-clés
export const detectCategory = (text: string): FocusWheelCategory | null => {
  const lowerText = text.toLowerCase();
  
  for (const suggestion of thoughtSuggestions) {
    for (const keyword of suggestion.keywords) {
      if (lowerText.includes(keyword)) {
        return suggestion.category;
      }
    }
  }
  
  return null;
};

// Obtenir des suggestions pour une catégorie
export const getSuggestionsForCategory = (
  category: FocusWheelCategory | null
): string[] => {
  if (!category) {
    return universalSuggestions;
  }
  
  const categoryData = thoughtSuggestions.find((s) => s.category === category);
  return categoryData ? categoryData.suggestions : universalSuggestions;
};

// Obtenir des suggestions personnalisées
export const getPersonalizedSuggestions = (
  centralThought: string,
  currentFeeling: string,
  existingThoughts: string[] = []
): string[] => {
  const category = detectCategory(centralThought + ' ' + currentFeeling);
  let suggestions = getSuggestionsForCategory(category);
  
  // Ajouter des suggestions universelles
  suggestions = [...suggestions, ...universalSuggestions];
  
  // Filtrer les suggestions déjà utilisées
  suggestions = suggestions.filter((s) => !existingThoughts.includes(s));
  
  // Mélanger et limiter
  return shuffleArray(suggestions).slice(0, 20);
};

// Mélanger un tableau
const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// Initialiser un nouveau wheel
export const initializeFocusWheel = (
  centralThought: string,
  currentFeeling: string,
  initialScore: number,
  setpoint?: number
): FocusWheel => {
  return {
    id: `wheel-${Date.now()}`,
    centralThought, // Le désir de ressenti au centre de la roue
    currentFeeling,
    thoughts: [],
    initialScore,
    finalScore: initialScore,
    isCompleted: false,
    createdAt: new Date().toISOString(),
    setpoint,
  };
};

/**
 * Positions d'horloge du Process #17 (Abraham) :
 * la première pensée s'écrit à 12h, puis 1h, 2h... jusqu'à 11h (12 déclarations).
 */
export const clockLabel = (position: number): string => {
  if (position === 1) return '12h';
  return `${position - 1}h`;
};

// Ajouter une pensée au wheel
export const addThoughtToWheel = (
  wheel: FocusWheel,
  text: string,
  isAligned: boolean = true
): FocusWheel => {
  const position = wheel.thoughts.length + 1;
  
  const newThought: FocusWheelThought = {
    id: `thought-${Date.now()}-${position}`,
    text,
    position,
    isAligned, // Par défaut true car on ne peut ajouter que des pensées alignées
    createdAt: new Date().toISOString(),
  };
  
  return {
    ...wheel,
    thoughts: [...wheel.thoughts, newThought],
  };
};

// Supprimer une pensée du wheel
export const removeThoughtFromWheel = (
  wheel: FocusWheel,
  thoughtId: string
): FocusWheel => {
  const filteredThoughts = wheel.thoughts
    .filter((t) => t.id !== thoughtId)
    .map((t, index) => ({ ...t, position: index + 1 }));
  
  return {
    ...wheel,
    thoughts: filteredThoughts,
  };
};

// Compléter un wheel
export const completeWheel = (
  wheel: FocusWheel,
  finalScore: number
): FocusWheel => {
  return {
    ...wheel,
    finalScore,
    isCompleted: true,
    completedAt: new Date().toISOString(),
  };
};

// Calculer les statistiques
export interface FocusWheelStats {
  totalWheels: number;
  completedWheels: number;
  averageImprovement: number;
  totalThoughtsCreated: number;
  mostUsedCategory: FocusWheelCategory | null;
  streak: number;
}

export const calculateStats = (wheels: FocusWheel[]): FocusWheelStats => {
  const completedWheels = wheels.filter((w) => w.isCompleted);
  
  const totalImprovement = completedWheels.reduce(
    (sum, wheel) => sum + (wheel.finalScore - wheel.initialScore),
    0
  );
  
  const averageImprovement =
    completedWheels.length > 0 ? totalImprovement / completedWheels.length : 0;
  
  const totalThoughtsCreated = wheels.reduce(
    (sum, wheel) => sum + wheel.thoughts.length,
    0
  );
  
  // Déterminer la catégorie la plus utilisée
  const categoryCounts: Record<string, number> = {};
  wheels.forEach((wheel) => {
    const category = detectCategory(wheel.centralThought + ' ' + wheel.currentFeeling);
    if (category) {
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    }
  });
  
  const mostUsedCategory = Object.keys(categoryCounts).length > 0
    ? (Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0][0] as FocusWheelCategory)
    : null;
  
  // Calculer le streak (jours consécutifs)
  const streak = calculateStreak(wheels);
  
  return {
    totalWheels: wheels.length,
    completedWheels: completedWheels.length,
    averageImprovement,
    totalThoughtsCreated,
    mostUsedCategory,
    streak,
  };
};

// Calculer le streak
const calculateStreak = (wheels: FocusWheel[]): number => {
  if (wheels.length === 0) return 0;
  
  const sortedWheels = [...wheels]
    .filter((w) => w.isCompleted)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  if (sortedWheels.length === 0) return 0;
  
  let streak = 1;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastWheelDate = new Date(sortedWheels[0].createdAt);
  lastWheelDate.setHours(0, 0, 0, 0);
  
  // Vérifier si le dernier wheel est d'aujourd'hui ou d'hier
  const diffDays = Math.floor((today.getTime() - lastWheelDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > 1) return 0;
  
  // Compter les jours consécutifs
  for (let i = 1; i < sortedWheels.length; i++) {
    const currentDate = new Date(sortedWheels[i].createdAt);
    currentDate.setHours(0, 0, 0, 0);
    
    const prevDate = new Date(sortedWheels[i - 1].createdAt);
    prevDate.setHours(0, 0, 0, 0);
    
    const diff = Math.floor((prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
};

// Obtenir les badges gagnés
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  requirement: number;
  current: number;
}

export const getBadges = (wheels: FocusWheel[]): Badge[] => {
  const stats = calculateStats(wheels);
  
  return [
    {
      id: 'first-wheel',
      name: 'Premier Alignement',
      description: 'Complétez votre premier Focus Wheel',
      icon: '🌟',
      earned: stats.completedWheels >= 1,
      requirement: 1,
      current: stats.completedWheels,
    },
    {
      id: 'five-wheels',
      name: 'Stabilité Vibratoire',
      description: 'Complétez 5 Focus Wheels',
      icon: '🎖️',
      earned: stats.completedWheels >= 5,
      requirement: 5,
      current: stats.completedWheels,
    },
    {
      id: 'twenty-one-wheels',
      name: 'Maître de l\'Alignement',
      description: 'Complétez 21 Focus Wheels (habitude formée)',
      icon: '👑',
      earned: stats.completedWheels >= 21,
      requirement: 21,
      current: stats.completedWheels,
    },
    {
      id: 'seven-day-streak',
      name: 'Momentum Vibratoire',
      description: 'Pratiquez 7 jours consécutifs',
      icon: '🔥',
      earned: stats.streak >= 7,
      requirement: 7,
      current: stats.streak,
    },
    {
      id: 'hundred-thoughts',
      name: 'Architecte de Pensées',
      description: 'Créez 100 pensées transitionnelles',
      icon: '💭',
      earned: stats.totalThoughtsCreated >= 100,
      requirement: 100,
      current: stats.totalThoughtsCreated,
    },
  ];
};

// Noms des catégories en français
export const categoryNames: Record<FocusWheelCategory, string> = {
  abundance: 'Abondance',
  confidence: 'Confiance',
  relationships: 'Relations',
  health: 'Santé',
  career: 'Carrière',
  creativity: 'Créativité',
  peace: 'Paix',
  'self-love': 'Amour de soi',
};

