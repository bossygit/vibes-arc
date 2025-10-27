import { HabitTemplate } from '@/types';

export const detoxTemplates: HabitTemplate[] = [
    // ÉCRANS & TECHNOLOGIE (type: stop)
    {
        id: 'no-social-media',
        name: 'Réseaux sociaux',
        type: 'stop',
        category: 'screens',
        description: 'Arrêter complètement Instagram, TikTok, Facebook, Twitter',
        suggestedDuration: [21, 30, 66, 90],
        advice: [
            'Désinstalle les apps de ton téléphone',
            'Utilise un bloqueur de sites web',
            'Remplace par une activité créative',
            'La FOMO disparaît après 2 semaines'
        ],
        difficulty: 'hard',
        icon: '📱'
    },
    {
        id: 'no-youtube-streaming',
        name: 'YouTube/Streaming',
        type: 'stop',
        category: 'screens',
        description: 'Limiter à 30 min max par jour (séries, vidéos)',
        suggestedDuration: [21, 30, 66, 90],
        advice: [
            'Regarde seulement du contenu éducatif',
            'Évite les recommandations algorithmiques',
            'Utilise un minuteur strict',
            'Remplace par la lecture'
        ],
        difficulty: 'medium',
        icon: '📺'
    },
    {
        id: 'no-gaming',
        name: 'Jeux vidéo',
        type: 'stop',
        category: 'screens',
        description: 'Arrêter complètement les jeux vidéo',
        suggestedDuration: [21, 30, 66, 90],
        advice: [
            'Désinstalle tous les jeux',
            'Trouve un sport ou hobby physique',
            'Les jeux créent une dépendance rapide',
            'Remplace par des jeux de société'
        ],
        difficulty: 'hard',
        icon: '🎮'
    },
    {
        id: 'no-porn',
        name: 'Pornographie',
        type: 'stop',
        category: 'screens',
        description: 'Arrêter complètement la pornographie',
        suggestedDuration: [21, 30, 66, 90],
        advice: [
            'Utilise un bloqueur parental',
            'Focalise-toi sur les relations réelles',
            'La pornographie déforme la sexualité',
            'Remplace par l\'exercice physique'
        ],
        difficulty: 'hard',
        icon: '🚫'
    },
    {
        id: 'no-online-shopping',
        name: 'Shopping en ligne',
        type: 'stop',
        category: 'screens',
        description: 'Arrêter les achats impulsifs en ligne',
        suggestedDuration: [21, 30, 66, 90],
        advice: [
            'Supprime les apps de shopping',
            'Attends 48h avant tout achat',
            'Fais une liste de besoins réels',
            'Remplace par l\'épargne'
        ],
        difficulty: 'medium',
        icon: '🛒'
    },

    // SUBSTANCES & STIMULANTS (type: stop)
    {
        id: 'limit-caffeine',
        name: 'Caféine',
        type: 'stop',
        category: 'substances',
        description: 'Limiter à 1 café maximum par jour (avant 14h)',
        suggestedDuration: [21, 30, 66, 90],
        advice: [
            'Remplace par du thé vert',
            'Évite après 14h pour mieux dormir',
            'Réduis progressivement',
            'Hydrate-toi avec de l\'eau'
        ],
        difficulty: 'medium',
        icon: '☕'
    },
    {
        id: 'no-refined-sugar',
        name: 'Sucre raffiné',
        type: 'stop',
        category: 'substances',
        description: 'Éliminer bonbons, sodas, desserts industriels',
        suggestedDuration: [21, 30, 66, 90],
        advice: [
            'Remplace par des fruits frais',
            'Lis les étiquettes nutritionnelles',
            'Le sucre crée une dépendance forte',
            'Prépare tes desserts maison'
        ],
        difficulty: 'hard',
        icon: '🍭'
    },
    {
        id: 'no-alcohol',
        name: 'Alcool',
        type: 'stop',
        category: 'substances',
        description: 'Arrêter complètement l\'alcool',
        suggestedDuration: [21, 30, 66, 90],
        advice: [
            'L\'alcool perturbe le sommeil et la motivation',
            'Remplace par des boissons sans alcool',
            'Trouve d\'autres façons de te détendre',
            'Focalise-toi sur ta santé'
        ],
        difficulty: 'medium',
        icon: '🍷'
    },

    // MOUVEMENT & NATURE (type: start)
    {
        id: 'nature-walk',
        name: 'Marche nature',
        type: 'start',
        category: 'movement',
        description: '30 minutes de marche dans la nature (sans musique)',
        suggestedDuration: [21, 30, 66, 90],
        advice: [
            'Sans écouteurs pour être présent',
            'Observe la nature autour de toi',
            'Respire profondément',
            'C\'est un antidote naturel au stress'
        ],
        difficulty: 'easy',
        icon: '🚶'
    },
    {
        id: 'meditation',
        name: 'Méditation',
        type: 'start',
        category: 'movement',
        description: '10 minutes de méditation pleine conscience',
        suggestedDuration: [21, 30, 66, 90],
        advice: [
            'Commence par 5 minutes si c\'est difficile',
            'Utilise une app guidée au début',
            'La méditation recalibre le système nerveux',
            'Fixe un moment précis dans la journée'
        ],
        difficulty: 'medium',
        icon: '🧘'
    },
    {
        id: 'exercise',
        name: 'Exercice physique',
        type: 'start',
        category: 'movement',
        description: '20 minutes d\'exercice sans écran',
        suggestedDuration: [21, 30, 66, 90],
        advice: [
            'Sans musique ni vidéo',
            'Focalise-toi sur tes sensations',
            'L\'exercice libère des endorphines naturelles',
            'Commence doucement et augmente progressivement'
        ],
        difficulty: 'medium',
        icon: '💪'
    },
    {
        id: 'sun-exposure',
        name: 'Exposition soleil',
        type: 'start',
        category: 'movement',
        description: '15 minutes d\'exposition au soleil matinal',
        suggestedDuration: [21, 30, 66, 90],
        advice: [
            'De préférence le matin',
            'Sans lunettes de soleil (yeux fermés)',
            'Régule l\'horloge biologique',
            'Améliore l\'humeur naturellement'
        ],
        difficulty: 'easy',
        icon: '☀️'
    },

    // CONNEXION & CRÉATIVITÉ (type: start)
    {
        id: 'paper-reading',
        name: 'Lecture livre papier',
        type: 'start',
        category: 'connection',
        description: '20 minutes de lecture d\'un livre papier',
        suggestedDuration: [21, 30, 66, 90],
        advice: [
            'Évite les écrans 1h avant',
            'Choisis des livres inspirants',
            'La lecture papier améliore la concentration',
            'Crée un rituel de lecture'
        ],
        difficulty: 'easy',
        icon: '📚'
    },
    {
        id: 'journaling',
        name: 'Journaling',
        type: 'start',
        category: 'connection',
        description: '5 minutes d\'écriture de gratitude',
        suggestedDuration: [21, 30, 66, 90],
        advice: [
            'Écris 3 choses pour lesquelles tu es reconnaissant',
            'Utilise un vrai carnet et un stylo',
            'La gratitude reprogramme le cerveau',
            'Fais-le le matin pour commencer positif'
        ],
        difficulty: 'easy',
        icon: '📝'
    },
    {
        id: 'real-conversation',
        name: 'Conversation réelle',
        type: 'start',
        category: 'connection',
        description: '1 conversation face à face par jour',
        suggestedDuration: [21, 30, 66, 90],
        advice: [
            'Sans téléphone à portée de main',
            'Écoute vraiment l\'autre personne',
            'Les relations réelles nourrissent l\'âme',
            'Commence par 10 minutes'
        ],
        difficulty: 'medium',
        icon: '💬'
    },
    {
        id: 'manual-creation',
        name: 'Création manuelle',
        type: 'start',
        category: 'connection',
        description: '15 minutes de création sans écran',
        suggestedDuration: [21, 30, 66, 90],
        advice: [
            'Dessin, musique, écriture, bricolage',
            'Le processus compte plus que le résultat',
            'La création manuelle active d\'autres zones du cerveau',
            'Commence simple et progresse'
        ],
        difficulty: 'medium',
        icon: '🎨'
    },

    // ROUTINE & STRUCTURE (type: start)
    {
        id: 'fixed-wake-up',
        name: 'Réveil fixe',
        type: 'start',
        category: 'routine',
        description: 'Se réveiller à la même heure tous les jours',
        suggestedDuration: [21, 30, 66, 90],
        advice: [
            'Même le week-end pour stabiliser le rythme',
            'Place le réveil loin du lit',
            'Une routine stable réduit le stress',
            'Commence par 15 min plus tôt'
        ],
        difficulty: 'hard',
        icon: '⏰'
    },
    {
        id: 'fixed-bedtime',
        name: 'Coucher fixe',
        type: 'start',
        category: 'routine',
        description: 'Se coucher à la même heure tous les jours',
        suggestedDuration: [21, 30, 66, 90],
        advice: [
            'Évite les écrans 1h avant',
            'Crée un rituel de coucher',
            'Un sommeil régulier améliore tout',
            'Commence par 15 min plus tôt'
        ],
        difficulty: 'hard',
        icon: '😴'
    },
    {
        id: 'phone-airplane-mode',
        name: 'Téléphone mode avion',
        type: 'start',
        category: 'routine',
        description: '1 heure en mode avion avant le coucher',
        suggestedDuration: [21, 30, 66, 90],
        advice: [
            'Place le téléphone dans une autre pièce',
            'Utilise un réveil classique',
            'Cette heure est pour toi et tes proches',
            'Améliore la qualité du sommeil'
        ],
        difficulty: 'medium',
        icon: '✈️'
    },
    {
        id: 'no-screens-bedroom',
        name: 'Chambre sans écran',
        type: 'start',
        category: 'routine',
        description: 'Aucun écran dans la chambre',
        suggestedDuration: [21, 30, 66, 90],
        advice: [
            'Charge le téléphone ailleurs',
            'La chambre doit être un sanctuaire',
            'Améliore la qualité du sommeil',
            'Renforce l\'intimité du couple'
        ],
        difficulty: 'hard',
        icon: '🛏️'
    }
];

export const getTemplatesByCategory = (category: string) => {
    return detoxTemplates.filter(template => template.category === category);
};

export const getTemplatesByDifficulty = (difficulty: string) => {
    return detoxTemplates.filter(template => template.difficulty === difficulty);
};

export const getTemplateById = (id: string) => {
    return detoxTemplates.find(template => template.id === id);
};
