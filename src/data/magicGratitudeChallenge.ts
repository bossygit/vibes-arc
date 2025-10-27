export interface MagicGratitudeDay {
  day: number;
  title: string;
  exercise: string;
  instructions: string[];
  reflection: string;
  affirmation: string;
  completed: boolean;
  completedAt?: string;
  notes?: string;
  theme: 'present' | 'desires' | 'integration';
  themeTitle: string;
  isDailyPractice?: boolean; // Pour les exercices quotidiens (jour 1 et 2)
}

export const magicGratitudeChallenge: MagicGratitudeDay[] = [
  // ===== PARTIE 1: GRATITUDE POUR LE PRÉSENT ET LE PASSÉ (Jours 1-12) =====
  {
    day: 1,
    title: "Comptez vos bénédictions",
    exercise: "Listez 10 choses pour lesquelles vous êtes reconnaissant",
    instructions: [
      "Prenez un moment de calme chaque matin",
      "Listez 10 choses pour lesquelles vous êtes reconnaissant",
      "Pour chaque chose, écrivez pourquoi vous en êtes reconnaissant",
      "Dites 'Merci, merci, merci' en ressentant vraiment la gratitude"
    ],
    reflection: "Comment vous sentez-vous après avoir listé ces 10 bénédictions ?",
    affirmation: "Je suis reconnaissant pour toutes les bénédictions de ma vie",
    completed: false,
    theme: 'present',
    themeTitle: 'Gratitude pour le Présent et le Passé',
    isDailyPractice: true
  },
  {
    day: 2,
    title: "La pierre magique",
    exercise: "Trouvez votre pierre magique de gratitude",
    instructions: [
      "Trouvez une petite pierre qui vous plaît",
      "Appelez-la votre 'Pierre Magique'",
      "Chaque soir, tenez-la en main",
      "Repensez à votre journée et trouvez la meilleure chose qui vous soit arrivée",
      "Dites 'Merci' pour ce moment précis"
    ],
    reflection: "Quel a été le meilleur moment de votre journée ?",
    affirmation: "Je suis reconnaissant pour les moments de joie de ma journée",
    completed: false,
    theme: 'present',
    themeTitle: 'Gratitude pour le Présent et le Passé',
    isDailyPractice: true
  },
  {
    day: 3,
    title: "Relations magiques",
    exercise: "Exprimez votre gratitude à 3 personnes proches",
    instructions: [
      "Choisissez 3 de vos relations les plus proches",
      "Trouvez ce que vous appréciez le plus chez chaque personne",
      "Exprimez-leur votre gratitude (mentalement ou directement)",
      "Ressentez l'amour et l'appréciation pour ces personnes"
    ],
    reflection: "Comment vous sentez-vous en exprimant votre gratitude à ces personnes ?",
    affirmation: "Je suis reconnaissant pour les relations merveilleuses de ma vie",
    completed: false,
    theme: 'present',
    themeTitle: 'Gratitude pour le Présent et le Passé'
  },
  {
    day: 4,
    title: "Santé magique",
    exercise: "Remerciez pour le don de la santé",
    instructions: [
      "Concentrez-vous sur chaque partie de votre corps",
      "Remerciez chaque organe pour son fonctionnement",
      "Appréciez votre capacité à voir, entendre, marcher, etc.",
      "Ressentez de la gratitude pour votre vitalité"
    ],
    reflection: "Quelle partie de votre corps appréciez-vous le plus ?",
    affirmation: "Je suis reconnaissant pour ma santé et ma vitalité",
    completed: false,
    theme: 'present',
    themeTitle: 'Gratitude pour le Présent et le Passé'
  },
  {
    day: 5,
    title: "Argent magique",
    exercise: "Remerciez pour tout l'argent reçu dans votre vie",
    instructions: [
      "Remerciez pour tout l'argent que vous avez reçu (même enfant)",
      "Appréciez chaque source de revenus",
      "Remerciez pour les achats que vous avez pu faire",
      "Ressentez de la gratitude pour l'abondance financière"
    ],
    reflection: "Pour quoi êtes-vous le plus reconnaissant financièrement ?",
    affirmation: "Je suis reconnaissant pour l'abondance financière dans ma vie",
    completed: false,
    theme: 'present',
    themeTitle: 'Gratitude pour le Présent et le Passé'
  },
  {
    day: 6,
    title: "Travail magique",
    exercise: "Remerciez pour 10 aspects de votre travail",
    instructions: [
      "Listez 10 choses positives dans votre travail",
      "Remerciez pour vos collègues, clients, opportunités",
      "Appréciez les compétences que vous développez",
      "Ressentez de la gratitude pour votre contribution"
    ],
    reflection: "Qu'est-ce que vous aimez le plus dans votre travail ?",
    affirmation: "Je suis reconnaissant pour les opportunités de travail",
    completed: false,
    theme: 'present',
    themeTitle: 'Gratitude pour le Présent et le Passé'
  },
  {
    day: 7,
    title: "Sortir de la négativité",
    exercise: "Trouvez 10 raisons d'être reconnaissant dans une situation négative",
    instructions: [
      "Choisissez une situation négative de votre passé",
      "Trouvez 10 choses pour lesquelles être reconnaissant dans cette situation",
      "Identifiez les leçons apprises",
      "Remerciez pour la force développée"
    ],
    reflection: "Quelle leçon importante avez-vous apprise de cette difficulté ?",
    affirmation: "Je suis reconnaissant pour les leçons de mes défis passés",
    completed: false,
    theme: 'present',
    themeTitle: 'Gratitude pour le Présent et le Passé'
  },
  {
    day: 8,
    title: "Foyer magique",
    exercise: "Remerciez pour votre maison et ses commodités",
    instructions: [
      "Remerciez pour votre maison ou appartement",
      "Appréciez l'électricité, l'eau, le chauffage",
      "Remerciez pour chaque pièce et son confort",
      "Ressentez de la gratitude pour votre abri"
    ],
    reflection: "Quelle partie de votre foyer appréciez-vous le plus ?",
    affirmation: "Je suis reconnaissant pour mon foyer et son confort",
    completed: false,
    theme: 'present',
    themeTitle: 'Gratitude pour le Présent et le Passé'
  },
  {
    day: 9,
    title: "Mentors magiques",
    exercise: "Remerciez pour les personnes qui vous ont marqué",
    instructions: [
      "Identifiez les personnes qui vous ont inspiré",
      "Remerciez pour leurs enseignements",
      "Appréciez leur influence positive sur votre vie",
      "Ressentez de la gratitude pour leur présence"
    ],
    reflection: "Qui a eu le plus d'impact positif sur votre vie ?",
    affirmation: "Je suis reconnaissant pour mes mentors et guides",
    completed: false,
    theme: 'present',
    themeTitle: 'Gratitude pour le Présent et le Passé'
  },
  {
    day: 10,
    title: "Famille magique",
    exercise: "Remerciez pour 10 aspects de votre famille",
    instructions: [
      "Listez 10 choses positives de votre famille",
      "Remerciez pour l'amour et le soutien reçus",
      "Appréciez les traditions et moments partagés",
      "Ressentez de la gratitude pour ces liens précieux"
    ],
    reflection: "Quel est votre plus beau souvenir familial ?",
    affirmation: "Je suis reconnaissant pour l'amour de ma famille",
    completed: false,
    theme: 'present',
    themeTitle: 'Gratitude pour le Présent et le Passé'
  },
  {
    day: 11,
    title: "Collègues magiques",
    exercise: "Remerciez pour les personnes qui vous aident au travail",
    instructions: [
      "Identifiez les collègues qui vous soutiennent",
      "Remerciez pour leur collaboration",
      "Appréciez leur expertise et leur aide",
      "Ressentez de la gratitude pour l'équipe"
    ],
    reflection: "Quel collègue vous aide le plus ?",
    affirmation: "Je suis reconnaissant pour mes collègues de travail",
    completed: false,
    theme: 'present',
    themeTitle: 'Gratitude pour le Présent et le Passé'
  },
  {
    day: 12,
    title: "Nourriture magique",
    exercise: "Remerciez pour les aliments que vous consommez",
    instructions: [
      "Remerciez pour chaque repas de la journée",
      "Appréciez la variété et la qualité de la nourriture",
      "Remerciez pour ceux qui ont cultivé et préparé",
      "Ressentez de la gratitude pour l'abondance alimentaire"
    ],
    reflection: "Quel aliment appréciez-vous le plus ?",
    affirmation: "Je suis reconnaissant pour l'abondance de nourriture",
    completed: false,
    theme: 'present',
    themeTitle: 'Gratitude pour le Présent et le Passé'
  },

  // ===== PARTIE 2: GRATITUDE POUR VOS DÉSIRS ET RÊVES (Jours 13-22) =====
  {
    day: 13,
    title: "Réalisez tous vos désirs",
    exercise: "Listez vos 10 principaux désirs et remerciez comme s'ils étaient réalisés",
    instructions: [
      "Listez vos 10 principaux désirs",
      "Pour chacun, écrivez comme s'il était déjà réalisé",
      "Ressentez une gratitude intense pour chaque désir",
      "Remerciez l'univers pour ces bénédictions futures"
    ],
    reflection: "Quel rêve vous excite le plus ?",
    affirmation: "Je suis reconnaissant pour la réalisation de mes rêves",
    completed: false,
    theme: 'desires',
    themeTitle: 'Gratitude pour vos Désirs et Rêves'
  },
  {
    day: 14,
    title: "Une journée magique",
    exercise: "Planifiez votre journée et remerciez pour chaque événement à l'avance",
    instructions: [
      "Planifiez votre journée à l'avance",
      "Pour chaque événement, exprimez votre gratitude avant qu'il ne se produise",
      "Visualisez un déroulement parfait",
      "Ressentez la gratitude pour cette journée magique"
    ],
    reflection: "Comment vous sentez-vous en planifiant votre journée avec gratitude ?",
    affirmation: "Je suis reconnaissant pour cette journée magique",
    completed: false,
    theme: 'desires',
    themeTitle: 'Gratitude pour vos Désirs et Rêves'
  },
  {
    day: 15,
    title: "Objets magiques",
    exercise: "Remerciez pour les choses que vous utilisez chaque jour",
    instructions: [
      "Identifiez 10 objets que vous utilisez quotidiennement",
      "Remerciez pour leur utilité et leur confort",
      "Appréciez leur qualité et leur design",
      "Ressentez de la gratitude pour ces commodités"
    ],
    reflection: "Quel objet quotidien appréciez-vous le plus ?",
    affirmation: "Je suis reconnaissant pour les commodités de ma vie",
    completed: false,
    theme: 'desires',
    themeTitle: 'Gratitude pour vos Désirs et Rêves'
  },
  {
    day: 16,
    title: "Sens magiques",
    exercise: "Remerciez pour vos 5 sens",
    instructions: [
      "Remerciez pour votre vue et la beauté que vous voyez",
      "Remerciez pour votre ouïe et les sons agréables",
      "Remerciez pour votre toucher et les sensations",
      "Remerciez pour votre goût et votre odorat"
    ],
    reflection: "Quel sens appréciez-vous le plus ?",
    affirmation: "Je suis reconnaissant pour mes 5 sens",
    completed: false,
    theme: 'desires',
    themeTitle: 'Gratitude pour vos Désirs et Rêves'
  },
  {
    day: 17,
    title: "Le chèque magique",
    exercise: "Remplissez un chèque magique de l'Univers",
    instructions: [
      "Remplissez un 'chèque magique' avec votre nom",
      "Écrivez le montant désiré pour quelque chose de spécifique",
      "Remerciez comme si vous aviez reçu cet argent",
      "Ressentez la gratitude pour cette abondance"
    ],
    reflection: "Pour quoi aimeriez-vous utiliser cet argent ?",
    affirmation: "Je suis reconnaissant pour l'abondance financière",
    completed: false,
    theme: 'desires',
    themeTitle: 'Gratitude pour vos Désirs et Rêves'
  },
  {
    day: 18,
    title: "Inspiration magique",
    exercise: "Remerciez pour les personnes qui vous inspirent",
    instructions: [
      "Identifiez les personnes qui vous inspirent",
      "Remerciez pour leur exemple et leur motivation",
      "Appréciez les leçons qu'elles vous enseignent",
      "Ressentez de la gratitude pour leur influence"
    ],
    reflection: "Qui vous inspire le plus actuellement ?",
    affirmation: "Je suis reconnaissant pour mes sources d'inspiration",
    completed: false,
    theme: 'desires',
    themeTitle: 'Gratitude pour vos Désirs et Rêves'
  },
  {
    day: 19,
    title: "Défis magiques",
    exercise: "Remerciez pour les défis surmontés",
    instructions: [
      "Identifiez les défis que vous avez surmontés",
      "Remerciez pour la force que vous avez développée",
      "Appréciez les leçons apprises",
      "Ressentez de la gratitude pour votre résilience"
    ],
    reflection: "Quel défi vous a le plus fait grandir ?",
    affirmation: "Je suis reconnaissant pour ma force et ma résilience",
    completed: false,
    theme: 'desires',
    themeTitle: 'Gratitude pour vos Désirs et Rêves'
  },
  {
    day: 20,
    title: "Nature magique",
    exercise: "Remerciez pour 10 aspects de la nature",
    instructions: [
      "Listez 10 éléments de la nature que vous appréciez",
      "Remerciez pour la beauté des paysages",
      "Appréciez les saisons et leurs changements",
      "Ressentez de la gratitude pour l'environnement"
    ],
    reflection: "Quel aspect de la nature vous émerveille le plus ?",
    affirmation: "Je suis reconnaissant pour la beauté de la nature",
    completed: false,
    theme: 'desires',
    themeTitle: 'Gratitude pour vos Désirs et Rêves'
  },
  {
    day: 21,
    title: "Résultats magnifiques",
    exercise: "Choisissez 3 situations et remerciez pour des résultats magnifiques",
    instructions: [
      "Choisissez 3 situations où vous souhaitez un 'résultat magnifique'",
      "Exprimez votre gratitude pour ce résultat idéal",
      "Visualisez le déroulement parfait",
      "Ressentez la gratitude avant que cela n'arrive"
    ],
    reflection: "Quel résultat magnifique vous excite le plus ?",
    affirmation: "Je suis reconnaissant pour les résultats magnifiques",
    completed: false,
    theme: 'desires',
    themeTitle: 'Gratitude pour vos Désirs et Rêves'
  },
  {
    day: 22,
    title: "Amis magiques",
    exercise: "Remerciez pour 10 aspects de vos amitiés",
    instructions: [
      "Listez 10 choses positives de vos amitiés",
      "Remerciez pour le soutien et la complicité",
      "Appréciez les moments partagés",
      "Ressentez de la gratitude pour ces liens"
    ],
    reflection: "Quel ami vous apporte le plus de joie ?",
    affirmation: "Je suis reconnaissant pour mes amitiés précieuses",
    completed: false,
    theme: 'desires',
    themeTitle: 'Gratitude pour vos Désirs et Rêves'
  },

  // ===== PARTIE 3: INTÉGRER LA GRATITUDE À UN NIVEAU SUPÉRIEUR (Jours 23-28) =====
  {
    day: 23,
    title: "Éducation magique",
    exercise: "Remerciez pour votre éducation et apprentissage",
    instructions: [
      "Remerciez pour votre éducation formelle",
      "Appréciez les connaissances acquises",
      "Remerciez pour les livres et enseignements",
      "Ressentez de la gratitude pour l'apprentissage"
    ],
    reflection: "Quelle connaissance vous a le plus aidé ?",
    affirmation: "Je suis reconnaissant pour mon éducation",
    completed: false,
    theme: 'integration',
    themeTitle: 'Intégrer la Gratitude à un Niveau Supérieur'
  },
  {
    day: 24,
    title: "La baguette magique",
    exercise: "Dirigez l'énergie de gratitude vers 3 personnes qui ont besoin d'aide",
    instructions: [
      "Choisissez 3 personnes qui ont besoin d'aide (santé, argent, bonheur)",
      "Visualisez leur situation résolue",
      "Dirigez l'énergie de gratitude vers elles",
      "Ressentez la joie de les aider"
    ],
    reflection: "Comment vous sentez-vous en aidant les autres par la gratitude ?",
    affirmation: "Je suis reconnaissant de pouvoir aider les autres",
    completed: false,
    theme: 'integration',
    themeTitle: 'Intégrer la Gratitude à un Niveau Supérieur'
  },
  {
    day: 25,
    title: "Voyages magiques",
    exercise: "Remerciez pour vos expériences de voyage",
    instructions: [
      "Rappelez-vous vos voyages et découvertes",
      "Remerciez pour les cultures rencontrées",
      "Appréciez les paysages et monuments vus",
      "Ressentez de la gratitude pour l'exploration"
    ],
    reflection: "Quel voyage vous a le plus marqué ?",
    affirmation: "Je suis reconnaissant pour mes expériences de voyage",
    completed: false,
    theme: 'integration',
    themeTitle: 'Intégrer la Gratitude à un Niveau Supérieur'
  },
  {
    day: 26,
    title: "Transformez vos erreurs en bénédictions",
    exercise: "Repensez à une 'erreur' et trouvez les bienfaits cachés",
    instructions: [
      "Repensez à une 'erreur' passée",
      "Trouvez les leçons et bienfaits cachés",
      "Remerciez pour chacun de ces bienfaits",
      "Ressentez la gratitude pour cette transformation"
    ],
    reflection: "Quelle leçon précieuse avez-vous apprise de cette 'erreur' ?",
    affirmation: "Je suis reconnaissant pour la sagesse de mes expériences",
    completed: false,
    theme: 'integration',
    themeTitle: 'Intégrer la Gratitude à un Niveau Supérieur'
  },
  {
    day: 27,
    title: "Le miroir magique",
    exercise: "Regardez-vous dans le miroir et exprimez votre gratitude",
    instructions: [
      "Regardez-vous dans le miroir",
      "Exprimez une gratitude sincère pour la personne que vous voyez",
      "Remerciez pour vos qualités et talents",
      "Ressentez l'amour et l'appréciation pour vous-même"
    ],
    reflection: "Quelle qualité appréciez-vous le plus chez vous ?",
    affirmation: "Je suis reconnaissant pour la personne que je suis",
    completed: false,
    theme: 'integration',
    themeTitle: 'Intégrer la Gratitude à un Niveau Supérieur'
  },
  {
    day: 28,
    title: "Se souvenir de la magie",
    exercise: "Passez la journée à vous remémorer les bienfaits de la veille",
    instructions: [
      "Révisez les 27 jours précédents",
      "Notez les changements positifs observés",
      "Remerciez pour cette transformation",
      "Engagez-vous à continuer la gratitude"
    ],
    reflection: "Comment avez-vous changé pendant ce défi ?",
    affirmation: "Je suis reconnaissant pour ma transformation positive",
    completed: false,
    theme: 'integration',
    themeTitle: 'Intégrer la Gratitude à un Niveau Supérieur'
  }
];

export const getMagicGratitudeDay = (day: number): MagicGratitudeDay | undefined => {
  return magicGratitudeChallenge.find(d => d.day === day);
};

export const getCompletedDays = (): number => {
  return magicGratitudeChallenge.filter(d => d.completed).length;
};

export const getProgressPercentage = (): number => {
  return Math.round((getCompletedDays() / magicGratitudeChallenge.length) * 100);
};

export const isChallengeCompleted = (): boolean => {
  return getCompletedDays() === magicGratitudeChallenge.length;
};

export const getThemeInfo = (theme: 'present' | 'desires' | 'integration') => {
  const themes = {
    present: {
      title: 'Gratitude pour le Présent et le Passé',
      description: 'Appréciez ce que vous avez déjà et ce que vous avez reçu',
      color: 'blue',
      icon: '🌅'
    },
    desires: {
      title: 'Gratitude pour vos Désirs et Rêves',
      description: 'Utilisez la gratitude pour attirer vos désirs comme s\'ils étaient déjà réalisés',
      color: 'purple',
      icon: '✨'
    },
    integration: {
      title: 'Intégrer la Gratitude à un Niveau Supérieur',
      description: 'Ancrez la gratitude comme mode de vie et aidez les autres',
      color: 'green',
      icon: '🌟'
    }
  };
  return themes[theme];
};