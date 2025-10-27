import { HabitTemplate } from '@/types';

export interface PersonalDevelopmentTemplate extends HabitTemplate {
  author: string;
  book?: string;
  concept: string;
  philosophy: string;
  benefits: string[];
}

export const personalDevelopmentTemplates: PersonalDevelopmentTemplate[] = [
  // ABRAHAM HICKS - LOI D'ATTRACTION
  {
    id: 'abraham-gratitude-practice',
    name: 'Pratique de Gratitude',
    author: 'Abraham Hicks',
    book: 'Ask and It Is Given',
    concept: 'Loi d\'Attraction',
    philosophy: 'La gratitude élève votre vibration et attire plus de bien-être',
    type: 'start',
    category: 'connection',
    description: '15 minutes de gratitude quotidienne pour élever votre vibration',
    suggestedDuration: [21, 30, 66, 90],
    advice: [
      'Écrivez 10 choses dont vous êtes reconnaissant',
      'Ressentez vraiment la gratitude, pas juste les mots',
      'Remerciez pour les petites choses aussi',
      'Visualisez vos désirs comme déjà réalisés'
    ],
    difficulty: 'easy',
    icon: '🙏',
    benefits: [
      'Élève votre vibration énergétique',
      'Attire plus d\'abondance',
      'Améliore l\'humeur',
      'Renforce la loi d\'attraction'
    ]
  },
  {
    id: 'abraham-visualization',
    name: 'Visualisation Créative',
    author: 'Abraham Hicks',
    book: 'Ask and It Is Given',
    concept: 'Loi d\'Attraction',
    philosophy: 'Visualiser vos désirs comme déjà réalisés active la manifestation',
    type: 'start',
    category: 'connection',
    description: '10 minutes de visualisation créative quotidienne',
    suggestedDuration: [21, 30, 66, 90],
    advice: [
      'Créez une image mentale claire de votre désir',
      'Ressentez les émotions comme si c\'était déjà là',
      'Faites-le le matin pour programmer la journée',
      'Laissez aller l\'attachement au résultat'
    ],
    difficulty: 'medium',
    icon: '🎭',
    benefits: [
      'Active la manifestation',
      'Programme l\'inconscient',
      'Augmente la confiance',
      'Renforce la croyance en soi'
    ]
  },

  // JAMES CLEAR - HABIT STACKING
  {
    id: 'james-habit-stacking',
    name: 'Empilage d\'Habitudes',
    author: 'James Clear',
    book: 'Atomic Habits',
    concept: 'Habit Stacking',
    philosophy: 'Attacher une nouvelle habitude à une habitude existante',
    type: 'start',
    category: 'routine',
    description: 'Attacher une nouvelle habitude à une habitude existante',
    suggestedDuration: [21, 30, 66, 90],
    advice: [
      'Identifiez une habitude que vous faites déjà',
      'Ajoutez la nouvelle habitude juste après',
      'Commencez par 2 minutes maximum',
      'Utilisez la formule "Après [habitude existante], je ferai [nouvelle habitude]"'
    ],
    difficulty: 'easy',
    icon: '🔗',
    benefits: [
      'Facilite l\'adoption de nouvelles habitudes',
      'Utilise les déclencheurs existants',
      'Augmente la cohérence',
      'Réduit la friction'
    ]
  },
  {
    id: 'james-environment-design',
    name: 'Design d\'Environnement',
    author: 'James Clear',
    book: 'Atomic Habits',
    concept: 'Environment Design',
    philosophy: 'L\'environnement façonne le comportement plus que la motivation',
    type: 'start',
    category: 'routine',
    description: 'Optimiser son environnement pour faciliter les bonnes habitudes',
    suggestedDuration: [21, 30, 66, 90],
    advice: [
      'Rendez les bonnes habitudes évidentes',
      'Rendez les mauvaises habitudes invisibles',
      'Préparez votre environnement la veille',
      'Supprimez les frictions pour les bonnes habitudes'
    ],
    difficulty: 'medium',
    icon: '🏠',
    benefits: [
      'Facilite les bonnes habitudes',
      'Rend les mauvaises habitudes difficiles',
      'Réduit la dépendance à la motivation',
      'Crée un système durable'
    ]
  },

  // ZIG ZIGLAR - ATTITUDE POSITIVE
  {
    id: 'zig-positive-attitude',
    name: 'Attitude Mentale Positive',
    author: 'Zig Ziglar',
    book: 'See You at the Top',
    concept: 'Attitude Mentale Positive',
    philosophy: 'L\'attitude détermine l\'altitude dans la vie',
    type: 'start',
    category: 'connection',
    description: 'Cultiver une attitude mentale positive quotidienne',
    suggestedDuration: [21, 30, 66, 90],
    advice: [
      'Commencez chaque jour par des affirmations positives',
      'Entourez-vous de personnes positives',
      'Lisez du contenu motivant quotidiennement',
      'Pratiquez la gratitude même dans les difficultés'
    ],
    difficulty: 'easy',
    icon: '😊',
    benefits: [
      'Améliore la résilience',
      'Attire les opportunités',
      'Influence positivement les autres',
      'Augmente la confiance en soi'
    ]
  },

  // BRIAN TRACY - GESTION DU TEMPS
  {
    id: 'brian-time-blocking',
    name: 'Blocage du Temps',
    author: 'Brian Tracy',
    book: 'Eat That Frog!',
    concept: 'Time Blocking',
    philosophy: 'Planifier chaque minute de votre journée pour maximiser la productivité',
    type: 'start',
    category: 'routine',
    description: 'Planifier chaque heure de votre journée',
    suggestedDuration: [21, 30, 66, 90],
    advice: [
      'Planifiez la veille pour le lendemain',
      'Bloquez du temps pour les tâches importantes',
      'Éliminez les distractions pendant les blocs',
      'Réservez du temps pour les imprévus'
    ],
    difficulty: 'medium',
    icon: '⏰',
    benefits: [
      'Maximise la productivité',
      'Réduit le stress',
      'Améliore la concentration',
      'Augmente l\'efficacité'
    ]
  },

  // TONY ROBBINS - ÉTAT ÉMOTIONNEL
  {
    id: 'tony-emotional-state',
    name: 'Maîtrise de l\'État Émotionnel',
    author: 'Tony Robbins',
    book: 'Awaken the Giant Within',
    concept: 'État Émotionnel',
    philosophy: 'Votre état émotionnel détermine la qualité de votre vie',
    type: 'start',
    category: 'movement',
    description: 'Pratiquer des techniques de changement d\'état émotionnel',
    suggestedDuration: [21, 30, 66, 90],
    advice: [
      'Utilisez le mouvement pour changer d\'état',
      'Pratiquez la respiration de pouvoir',
      'Changez votre posture et votre langage corporel',
      'Utilisez des questions de pouvoir'
    ],
    difficulty: 'medium',
    icon: '⚡',
    benefits: [
      'Maîtrise des émotions',
      'Augmente l\'énergie',
      'Améliore la performance',
      'Renforce la confiance'
    ]
  },

  // ROBIN SHARMA - ROUTINE MATINALE
  {
    id: 'robin-morning-routine',
    name: 'Routine Matinale du Moine',
    author: 'Robin Sharma',
    book: 'The Monk Who Sold His Ferrari',
    concept: 'Routine Matinale',
    philosophy: 'Comment vous commencez votre journée détermine comment vous la vivez',
    type: 'start',
    category: 'routine',
    description: 'Routine matinale inspirée de la sagesse ancienne',
    suggestedDuration: [21, 30, 66, 90],
    advice: [
      'Levez-vous 1 heure plus tôt',
      'Méditez pendant 20 minutes',
      'Lisez de la sagesse ancienne',
      'Faites de l\'exercice doux'
    ],
    difficulty: 'hard',
    icon: '🌅',
    benefits: [
      'Commence la journée avec intention',
      'Augmente la clarté mentale',
      'Renforce la discipline',
      'Améliore l\'équilibre vie-travail'
    ]
  },

  // CAL NEWPORT - TRAVAIL PROFOND
  {
    id: 'cal-deep-work',
    name: 'Sessions de Travail Profond',
    author: 'Cal Newport',
    book: 'Deep Work',
    concept: 'Travail Profond',
    philosophy: 'La capacité de concentration profonde est devenue rare et précieuse',
    type: 'start',
    category: 'routine',
    description: 'Blocs de 90 minutes de travail sans distraction',
    suggestedDuration: [21, 30, 66, 90],
    advice: [
      'Éliminez toutes les notifications',
      'Travaillez par blocs de 90 minutes',
      'Créez un rituel de concentration',
      'Mesurez la profondeur de votre travail'
    ],
    difficulty: 'hard',
    icon: '🎯',
    benefits: [
      'Améliore la qualité du travail',
      'Augmente la productivité',
      'Développe la maîtrise',
      'Crée de la valeur unique'
    ]
  },

  // DALE CARNEGIE - COMPÉTENCES SOCIALES
  {
    id: 'dale-active-listening',
    name: 'Écoute Active',
    author: 'Dale Carnegie',
    book: 'How to Win Friends and Influence People',
    concept: 'Écoute Active',
    philosophy: 'L\'écoute active est la base de toutes les relations humaines',
    type: 'start',
    category: 'connection',
    description: 'Pratiquer l\'écoute active dans toutes les conversations',
    suggestedDuration: [21, 30, 66, 90],
    advice: [
      'Écoutez pour comprendre, pas pour répondre',
      'Posez des questions ouvertes',
      'Répétez ce que vous avez entendu',
      'Montrez un intérêt sincère'
    ],
    difficulty: 'medium',
    icon: '👂',
    benefits: [
      'Améliore les relations',
      'Augmente l\'influence',
      'Renforce la confiance',
      'Développe l\'empathie'
    ]
  },

  // ECKHART TOLLE - PRÉSENCE
  {
    id: 'eckhart-present-moment',
    name: 'Pratique de Présence',
    author: 'Eckhart Tolle',
    book: 'The Power of Now',
    concept: 'Présence',
    philosophy: 'Le moment présent est tout ce qui existe vraiment',
    type: 'start',
    category: 'movement',
    description: 'Cultiver la présence dans le moment présent',
    suggestedDuration: [21, 30, 66, 90],
    advice: [
      'Observez vos pensées sans les juger',
      'Portez attention à votre respiration',
      'Sentez votre corps dans l\'instant',
      'Acceptez ce qui est sans résistance'
    ],
    difficulty: 'hard',
    icon: '🕊️',
    benefits: [
      'Réduit l\'anxiété',
      'Augmente la paix intérieure',
      'Améliore la concentration',
      'Développe la sagesse'
    ]
  },

  // CATHERINE PONDER - PROSPÉRITÉ
  {
    id: 'catherine-prosperity-mindset',
    name: 'Mentalité d\'Abondance',
    author: 'Catherine Ponder',
    book: 'The Dynamic Laws of Prosperity',
    concept: 'Mentalité d\'Abondance',
    philosophy: 'L\'abondance est votre droit divin et votre responsabilité',
    type: 'start',
    category: 'connection',
    description: 'Cultiver une mentalité d\'abondance et de prospérité',
    suggestedDuration: [21, 30, 66, 90],
    advice: [
      'Affirmez votre droit à l\'abondance',
      'Remerciez pour l\'argent que vous avez',
      'Visualisez la prospérité dans tous les domaines',
      'Donnez généreusement pour recevoir'
    ],
    difficulty: 'medium',
    icon: '💰',
    benefits: [
      'Attire l\'abondance',
      'Élimine la mentalité de pénurie',
      'Augmente la confiance financière',
      'Crée des opportunités'
    ]
  }
];

export const getTemplatesByAuthor = (author: string) => {
  return personalDevelopmentTemplates.filter(template => template.author === author);
};

export const getTemplatesByConcept = (concept: string) => {
  return personalDevelopmentTemplates.filter(template => template.concept === concept);
};

export const getTemplatesByCategory = (category: string) => {
  return personalDevelopmentTemplates.filter(template => template.category === category);
};

export const getTemplateById = (id: string) => {
  return personalDevelopmentTemplates.find(template => template.id === id);
};
