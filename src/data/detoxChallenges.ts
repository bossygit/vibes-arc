import { Challenge } from '@/types';

export interface DetoxChallenge extends Challenge {
  category: 'screens' | 'substances' | 'movement' | 'connection' | 'routine' | 'mixed';
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  rewards: {
    points: number;
    badge?: string;
    message: string;
  };
  tips: string[];
  icon: string;
}

export const detoxChallenges: DetoxChallenge[] = [
  // DÉFIS ÉCRANS
  {
    id: 1,
    title: 'Digital Detox 7 jours',
    category: 'screens',
    difficulty: 'hard',
    description: '7 jours sans réseaux sociaux ni YouTube',
    targetDays: 7,
    progressDays: 0,
    weekStartISO: new Date().toISOString().slice(0, 10),
    rewards: {
      points: 200,
      badge: '🏆',
      message: 'Félicitations ! Tu as survécu 7 jours sans écrans !'
    },
    tips: [
      'Désinstalle toutes les apps de réseaux sociaux',
      'Utilise un bloqueur de sites web',
      'Remplace par la lecture ou des activités créatives',
      'Prépare des alternatives pour les moments d\'ennui'
    ],
    icon: '📱'
  },
  {
    id: 2,
    title: 'Weekend Nature',
    category: 'screens',
    difficulty: 'medium',
    description: '2 jours complets sans écran (weekend)',
    targetDays: 2,
    progressDays: 0,
    weekStartISO: new Date().toISOString().slice(0, 10),
    rewards: {
      points: 150,
      badge: '🌿',
      message: 'Weekend nature réussi ! Tu as reconnecté avec le monde réel.'
    },
    tips: [
      'Planifie des activités en extérieur',
      'Laisse ton téléphone à la maison',
      'Emporte un livre ou un carnet',
      'Profite de la nature et des relations'
    ],
    icon: '🌳'
  },

  // DÉFIS SUBSTANCES
  {
    id: 3,
    title: 'Sugar Free 30 jours',
    category: 'substances',
    difficulty: 'hard',
    description: '30 jours sans sucre raffiné',
    targetDays: 30,
    progressDays: 0,
    weekStartISO: new Date().toISOString().slice(0, 10),
    rewards: {
      points: 500,
      badge: '🍯',
      message: '30 jours sans sucre ! Ton énergie est maintenant stable.'
    },
    tips: [
      'Lis les étiquettes nutritionnelles',
      'Remplace par des fruits frais',
      'Prépare tes desserts maison',
      'Hydrate-toi avec de l\'eau'
    ],
    icon: '🚫'
  },
  {
    id: 4,
    title: 'Café Cleanse',
    category: 'substances',
    difficulty: 'medium',
    description: '21 jours avec maximum 1 café par jour',
    targetDays: 21,
    progressDays: 0,
    weekStartISO: new Date().toISOString().slice(0, 10),
    rewards: {
      points: 300,
      badge: '☕',
      message: 'Café Cleanse terminé ! Tu as réduit ta dépendance à la caféine.'
    },
    tips: [
      'Remplace par du thé vert',
      'Évite après 14h',
      'Hydrate-toi davantage',
      'Dors mieux sans caféine tardive'
    ],
    icon: '☕'
  },

  // DÉFIS MOUVEMENT
  {
    id: 5,
    title: 'Marathon Méditation',
    category: 'movement',
    difficulty: 'easy',
    description: '21 jours de méditation quotidienne',
    targetDays: 21,
    progressDays: 0,
    weekStartISO: new Date().toISOString().slice(0, 10),
    rewards: {
      points: 250,
      badge: '🧘',
      message: '21 jours de méditation ! Tu as développé une pratique régulière.'
    },
    tips: [
      'Commence par 5 minutes',
      'Utilise une app guidée',
      'Fixe un moment précis',
      'Sois patient avec toi-même'
    ],
    icon: '🧘'
  },
  {
    id: 6,
    title: 'Nature Walker',
    category: 'movement',
    difficulty: 'easy',
    description: '30 minutes de marche nature pendant 14 jours',
    targetDays: 14,
    progressDays: 0,
    weekStartISO: new Date().toISOString().slice(0, 10),
    rewards: {
      points: 200,
      badge: '🚶',
      message: '14 jours de marche nature ! Tu as reconnecté avec la nature.'
    },
    tips: [
      'Sans écouteurs',
      'Observe la nature',
      'Respire profondément',
      'Varie tes parcours'
    ],
    icon: '🚶'
  },

  // DÉFIS CONNEXION
  {
    id: 7,
    title: 'Book Worm',
    category: 'connection',
    difficulty: 'easy',
    description: 'Lire 20 minutes par jour pendant 21 jours',
    targetDays: 21,
    progressDays: 0,
    weekStartISO: new Date().toISOString().slice(0, 10),
    rewards: {
      points: 200,
      badge: '📚',
      message: '21 jours de lecture ! Tu as développé une habitude enrichissante.'
    },
    tips: [
      'Choisis des livres inspirants',
      'Crée un rituel de lecture',
      'Évite les écrans avant',
      'Note tes réflexions'
    ],
    icon: '📚'
  },
  {
    id: 8,
    title: 'Gratitude Master',
    category: 'connection',
    difficulty: 'easy',
    description: 'Journaling de gratitude pendant 30 jours',
    targetDays: 30,
    progressDays: 0,
    weekStartISO: new Date().toISOString().slice(0, 10),
    rewards: {
      points: 300,
      badge: '📝',
      message: '30 jours de gratitude ! Tu as reprogrammé ton cerveau positivement.'
    },
    tips: [
      'Écris 3 choses par jour',
      'Utilise un vrai carnet',
      'Fais-le le matin',
      'Soyez spécifique'
    ],
    icon: '📝'
  },

  // DÉFIS ROUTINE
  {
    id: 9,
    title: 'Early Bird',
    category: 'routine',
    difficulty: 'hard',
    description: 'Réveil à 6h pendant 21 jours',
    targetDays: 21,
    progressDays: 0,
    weekStartISO: new Date().toISOString().slice(0, 10),
    rewards: {
      points: 400,
      badge: '🌅',
      message: '21 jours de réveil précoce ! Tu as maîtrisé ton rythme circadien.'
    },
    tips: [
      'Couche-toi plus tôt',
      'Place le réveil loin du lit',
      'Expose-toi au soleil matinal',
      'Crée une routine matinale'
    ],
    icon: '🌅'
  },
  {
    id: 10,
    title: 'Phone-Free Bedroom',
    category: 'routine',
    difficulty: 'medium',
    description: 'Aucun écran dans la chambre pendant 30 jours',
    targetDays: 30,
    progressDays: 0,
    weekStartISO: new Date().toISOString().slice(0, 10),
    rewards: {
      points: 350,
      badge: '🛏️',
      message: '30 jours sans écran dans la chambre ! Ton sommeil s\'est amélioré.'
    },
    tips: [
      'Charge le téléphone ailleurs',
      'Utilise un réveil classique',
      'Crée un rituel de coucher',
      'La chambre = sanctuaire'
    ],
    icon: '🛏️'
  },

  // DÉFIS MIXTES
  {
    id: 11,
    title: 'Complete Detox',
    category: 'mixed',
    difficulty: 'hard',
    description: '7 jours de detox complète (écrans + substances + routine)',
    targetDays: 7,
    progressDays: 0,
    weekStartISO: new Date().toISOString().slice(0, 10),
    rewards: {
      points: 1000,
      badge: '👑',
      message: 'DETOX COMPLÈTE RÉUSSIE ! Tu as transformé ta vie en 7 jours.'
    },
    tips: [
      'Prépare-toi mentalement',
      'Supprime toutes les tentations',
      'Planifie des activités alternatives',
      'Célèbre chaque jour de succès'
    ],
    icon: '👑'
  },
  {
    id: 12,
    title: 'Mindful Week',
    category: 'mixed',
    difficulty: 'medium',
    description: '7 jours de pleine conscience (méditation + marche + gratitude)',
    targetDays: 7,
    progressDays: 0,
    weekStartISO: new Date().toISOString().slice(0, 10),
    rewards: {
      points: 400,
      badge: '🧠',
      message: 'Semaine de pleine conscience terminée ! Tu es plus présent et calme.'
    },
    tips: [
      'Médite 10 min/jour',
      'Marche 30 min sans écran',
      'Écris 3 gratitudes/jour',
      'Pratique la respiration consciente'
    ],
    icon: '🧠'
  }
];

export const getChallengesByCategory = (category: string) => {
  return detoxChallenges.filter(challenge => challenge.category === category);
};

export const getChallengesByDifficulty = (difficulty: string) => {
  return detoxChallenges.filter(challenge => challenge.difficulty === difficulty);
};

export const getChallengeById = (id: number) => {
  return detoxChallenges.find(challenge => challenge.id === id);
};
