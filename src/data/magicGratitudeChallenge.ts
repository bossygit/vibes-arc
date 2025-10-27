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
}

export const magicGratitudeChallenge: MagicGratitudeDay[] = [
  {
    day: 1,
    title: "Comptez vos bénédictions",
    exercise: "Listez 10 choses pour lesquelles vous êtes reconnaissant",
    instructions: [
      "Prenez un moment de calme",
      "Listez 10 choses pour lesquelles vous êtes reconnaissant",
      "Pour chaque chose, écrivez pourquoi vous en êtes reconnaissant",
      "Ressentez vraiment la gratitude pour chaque élément"
    ],
    reflection: "Comment vous sentez-vous après avoir listé ces 10 bénédictions ?",
    affirmation: "Je suis reconnaissant pour toutes les bénédictions de ma vie",
    completed: false
  },
  {
    day: 2,
    title: "La pierre de gratitude",
    exercise: "Trouvez une pierre de gratitude",
    instructions: [
      "Trouvez une petite pierre qui vous plaît",
      "Appelez-la votre 'Pierre de Gratitude'",
      "Chaque soir, tenez-la en main",
      "Répétez 'Merci' pour le meilleur moment de votre journée"
    ],
    reflection: "Quel a été le meilleur moment de votre journée ?",
    affirmation: "Je suis reconnaissant pour les moments de joie de ma journée",
    completed: false
  },
  {
    day: 3,
    title: "Gratitude envers les autres",
    exercise: "Exprimez votre gratitude à 3 personnes",
    instructions: [
      "Choisissez 3 personnes importantes dans votre vie",
      "Écrivez-leur un message de gratitude",
      "Expliquez pourquoi vous êtes reconnaissant pour elles",
      "Envoyez ou donnez-leur le message"
    ],
    reflection: "Comment vous sentez-vous après avoir exprimé votre gratitude ?",
    affirmation: "Je suis reconnaissant pour les personnes merveilleuses de ma vie",
    completed: false
  },
  {
    day: 4,
    title: "Gratitude pour la santé",
    exercise: "Remerciez pour 10 aspects de votre santé",
    instructions: [
      "Listez 10 aspects positifs de votre santé",
      "Remerciez pour chaque partie de votre corps qui fonctionne",
      "Appréciez votre capacité à voir, entendre, marcher, etc.",
      "Ressentez de la gratitude pour votre vitalité"
    ],
    reflection: "Quelle partie de votre corps appréciez-vous le plus ?",
    affirmation: "Je suis reconnaissant pour ma santé et ma vitalité",
    completed: false
  },
  {
    day: 5,
    title: "Gratitude pour les défis passés",
    exercise: "Trouvez la gratitude dans 5 situations difficiles",
    instructions: [
      "Identifiez 5 situations difficiles de votre passé",
      "Pour chaque situation, trouvez ce qu'elle vous a appris",
      "Remerciez pour la force que vous avez développée",
      "Reconnaissez comment ces épreuves vous ont fait grandir"
    ],
    reflection: "Quelle leçon importante avez-vous apprise d'une difficulté ?",
    affirmation: "Je suis reconnaissant pour les leçons de mes défis passés",
    completed: false
  },
  {
    day: 6,
    title: "Gratitude pour vos rêves",
    exercise: "Visualisez 10 de vos désirs réalisés",
    instructions: [
      "Listez 10 désirs ou objectifs importants",
      "Imaginez chacun d'eux comme déjà réalisé",
      "Ressentez la gratitude comme si c'était déjà là",
      "Remerciez l'univers pour ces bénédictions futures"
    ],
    reflection: "Quel rêve vous excite le plus ?",
    affirmation: "Je suis reconnaissant pour la réalisation de mes rêves",
    completed: false
  },
  {
    day: 7,
    title: "Gratitude pour l'argent",
    exercise: "Remerciez pour tout l'argent reçu",
    instructions: [
      "Remerciez pour tout l'argent que vous avez reçu dans votre vie",
      "Appréciez chaque source de revenus",
      "Remerciez pour les achats que vous avez pu faire",
      "Ressentez de la gratitude pour l'abondance financière"
    ],
    reflection: "Pour quoi êtes-vous le plus reconnaissant financièrement ?",
    affirmation: "Je suis reconnaissant pour l'abondance financière dans ma vie",
    completed: false
  },
  {
    day: 8,
    title: "Gratitude pour le travail",
    exercise: "Remerciez pour 10 aspects de votre travail",
    instructions: [
      "Listez 10 choses positives dans votre travail",
      "Remerciez pour vos collègues, clients, opportunités",
      "Appréciez les compétences que vous développez",
      "Ressentez de la gratitude pour votre contribution"
    ],
    reflection: "Qu'est-ce que vous aimez le plus dans votre travail ?",
    affirmation: "Je suis reconnaissant pour les opportunités de travail",
    completed: false
  },
  {
    day: 9,
    title: "Gratitude pour votre foyer",
    exercise: "Remerciez pour votre maison et ses commodités",
    instructions: [
      "Remerciez pour votre maison ou appartement",
      "Appréciez l'électricité, l'eau, le chauffage",
      "Remerciez pour chaque pièce et son confort",
      "Ressentez de la gratitude pour votre abri"
    ],
    reflection: "Quelle partie de votre foyer appréciez-vous le plus ?",
    affirmation: "Je suis reconnaissant pour mon foyer et son confort",
    completed: false
  },
  {
    day: 10,
    title: "Gratitude pour les mentors",
    exercise: "Remerciez pour les personnes qui vous ont marqué",
    instructions: [
      "Identifiez les personnes qui vous ont inspiré",
      "Remerciez pour leurs enseignements",
      "Appréciez leur influence positive sur votre vie",
      "Ressentez de la gratitude pour leur présence"
    ],
    reflection: "Qui a eu le plus d'impact positif sur votre vie ?",
    affirmation: "Je suis reconnaissant pour mes mentors et guides",
    completed: false
  },
  {
    day: 11,
    title: "Gratitude pour la famille",
    exercise: "Remerciez pour 10 aspects de votre famille",
    instructions: [
      "Listez 10 choses positives de votre famille",
      "Remerciez pour l'amour et le soutien reçus",
      "Appréciez les traditions et moments partagés",
      "Ressentez de la gratitude pour ces liens précieux"
    ],
    reflection: "Quel est votre plus beau souvenir familial ?",
    affirmation: "Je suis reconnaissant pour l'amour de ma famille",
    completed: false
  },
  {
    day: 12,
    title: "Gratitude pour les collègues",
    exercise: "Remerciez pour les personnes qui vous aident au travail",
    instructions: [
      "Identifiez les collègues qui vous soutiennent",
      "Remerciez pour leur collaboration",
      "Appréciez leur expertise et leur aide",
      "Ressentez de la gratitude pour l'équipe"
    ],
    reflection: "Quel collègue vous aide le plus ?",
    affirmation: "Je suis reconnaissant pour mes collègues de travail",
    completed: false
  },
  {
    day: 13,
    title: "Gratitude pour le corps",
    exercise: "Remerciez pour 10 aspects de votre corps",
    instructions: [
      "Listez 10 parties de votre corps que vous appréciez",
      "Remerciez pour leur fonctionnement",
      "Appréciez leur beauté et leur force",
      "Ressentez de la gratitude pour votre corps"
    ],
    reflection: "Quelle partie de votre corps appréciez-vous le plus ?",
    affirmation: "Je suis reconnaissant pour mon corps et sa santé",
    completed: false
  },
  {
    day: 14,
    title: "Gratitude pour la nourriture",
    exercise: "Remerciez pour les aliments que vous consommez",
    instructions: [
      "Remerciez pour chaque repas de la journée",
      "Appréciez la variété et la qualité de la nourriture",
      "Remerciez pour ceux qui ont cultivé et préparé",
      "Ressentez de la gratitude pour l'abondance alimentaire"
    ],
    reflection: "Quel aliment appréciez-vous le plus ?",
    affirmation: "Je suis reconnaissant pour l'abondance de nourriture",
    completed: false
  },
  {
    day: 15,
    title: "Gratitude pour les objets quotidiens",
    exercise: "Remerciez pour les choses que vous utilisez chaque jour",
    instructions: [
      "Identifiez 10 objets que vous utilisez quotidiennement",
      "Remerciez pour leur utilité et leur confort",
      "Appréciez leur qualité et leur design",
      "Ressentez de la gratitude pour ces commodités"
    ],
    reflection: "Quel objet quotidien appréciez-vous le plus ?",
    affirmation: "Je suis reconnaissant pour les commodités de ma vie",
    completed: false
  },
  {
    day: 16,
    title: "Gratitude pour les sens",
    exercise: "Remerciez pour vos 5 sens",
    instructions: [
      "Remerciez pour votre vue et la beauté que vous voyez",
      "Remerciez pour votre ouïe et les sons agréables",
      "Remerciez pour votre toucher et les sensations",
      "Remerciez pour votre goût et votre odorat"
    ],
    reflection: "Quel sens appréciez-vous le plus ?",
    affirmation: "Je suis reconnaissant pour mes 5 sens",
    completed: false
  },
  {
    day: 17,
    title: "Gratitude pour l'inspiration",
    exercise: "Remerciez pour les personnes qui vous inspirent",
    instructions: [
      "Identifiez les personnes qui vous inspirent",
      "Remerciez pour leur exemple et leur motivation",
      "Appréciez les leçons qu'elles vous enseignent",
      "Ressentez de la gratitude pour leur influence"
    ],
    reflection: "Qui vous inspire le plus actuellement ?",
    affirmation: "Je suis reconnaissant pour mes sources d'inspiration",
    completed: false
  },
  {
    day: 18,
    title: "Gratitude pour les défis",
    exercise: "Remerciez pour les défis surmontés",
    instructions: [
      "Identifiez les défis que vous avez surmontés",
      "Remerciez pour la force que vous avez développée",
      "Appréciez les leçons apprises",
      "Ressentez de la gratitude pour votre résilience"
    ],
    reflection: "Quel défi vous a le plus fait grandir ?",
    affirmation: "Je suis reconnaissant pour ma force et ma résilience",
    completed: false
  },
  {
    day: 19,
    title: "Gratitude pour la nature",
    exercise: "Remerciez pour 10 aspects de la nature",
    instructions: [
      "Listez 10 éléments de la nature que vous appréciez",
      "Remerciez pour la beauté des paysages",
      "Appréciez les saisons et leurs changements",
      "Ressentez de la gratitude pour l'environnement"
    ],
    reflection: "Quel aspect de la nature vous émerveille le plus ?",
    affirmation: "Je suis reconnaissant pour la beauté de la nature",
    completed: false
  },
  {
    day: 20,
    title: "Gratitude pour les opportunités",
    exercise: "Remerciez pour les opportunités qui se présentent",
    instructions: [
      "Identifiez les opportunités récentes",
      "Remerciez pour les portes qui s'ouvrent",
      "Appréciez les possibilités de croissance",
      "Ressentez de la gratitude pour les chances"
    ],
    reflection: "Quelle opportunité vous excite le plus ?",
    affirmation: "Je suis reconnaissant pour les opportunités de ma vie",
    completed: false
  },
  {
    day: 21,
    title: "Gratitude pour la joie",
    exercise: "Remerciez pour les moments de joie",
    instructions: [
      "Rappelez-vous des moments de joie récents",
      "Remerciez pour ces instants de bonheur",
      "Appréciez la légèreté et l'enthousiasme",
      "Ressentez de la gratitude pour la joie"
    ],
    reflection: "Quel moment de joie récent vous marque ?",
    affirmation: "Je suis reconnaissant pour la joie dans ma vie",
    completed: false
  },
  {
    day: 22,
    title: "Gratitude pour l'éducation",
    exercise: "Remerciez pour votre éducation et apprentissage",
    instructions: [
      "Remerciez pour votre éducation formelle",
      "Appréciez les connaissances acquises",
      "Remerciez pour les livres et enseignements",
      "Ressentez de la gratitude pour l'apprentissage"
    ],
    reflection: "Quelle connaissance vous a le plus aidé ?",
    affirmation: "Je suis reconnaissant pour mon éducation",
    completed: false
  },
  {
    day: 23,
    title: "Gratitude pour les talents",
    exercise: "Remerciez pour vos talents et compétences",
    instructions: [
      "Listez vos talents et compétences",
      "Remerciez pour ces dons naturels",
      "Appréciez votre capacité à créer",
      "Ressentez de la gratitude pour vos capacités"
    ],
    reflection: "Quel talent appréciez-vous le plus ?",
    affirmation: "Je suis reconnaissant pour mes talents uniques",
    completed: false
  },
  {
    day: 24,
    title: "Gratitude pour les voyages",
    exercise: "Remerciez pour vos expériences de voyage",
    instructions: [
      "Rappelez-vous vos voyages et découvertes",
      "Remerciez pour les cultures rencontrées",
      "Appréciez les paysages et monuments vus",
      "Ressentez de la gratitude pour l'exploration"
    ],
    reflection: "Quel voyage vous a le plus marqué ?",
    affirmation: "Je suis reconnaissant pour mes expériences de voyage",
    completed: false
  },
  {
    day: 25,
    title: "Gratitude pour les amis",
    exercise: "Remerciez pour 10 aspects de vos amitiés",
    instructions: [
      "Listez 10 choses positives de vos amitiés",
      "Remerciez pour le soutien et la complicité",
      "Appréciez les moments partagés",
      "Ressentez de la gratitude pour ces liens"
    ],
    reflection: "Quel ami vous apporte le plus de joie ?",
    affirmation: "Je suis reconnaissant pour mes amitiés précieuses",
    completed: false
  },
  {
    day: 26,
    title: "Gratitude pour la solitude",
    exercise: "Remerciez pour les moments de solitude",
    instructions: [
      "Appréciez les moments de calme et de réflexion",
      "Remerciez pour la paix intérieure",
      "Valorisez le temps pour soi",
      "Ressentez de la gratitude pour la sérénité"
    ],
    reflection: "Que vous apporte la solitude ?",
    affirmation: "Je suis reconnaissant pour mes moments de paix",
    completed: false
  },
  {
    day: 27,
    title: "Gratitude pour la technologie",
    exercise: "Remerciez pour les avancées technologiques",
    instructions: [
      "Remerciez pour les technologies qui facilitent votre vie",
      "Appréciez la connectivité et la communication",
      "Remerciez pour l'accès à l'information",
      "Ressentez de la gratitude pour le progrès"
    ],
    reflection: "Quelle technologie vous aide le plus ?",
    affirmation: "Je suis reconnaissant pour les technologies utiles",
    completed: false
  },
  {
    day: 28,
    title: "Gratitude pour la transformation",
    exercise: "Réfléchissez à votre transformation",
    instructions: [
      "Révisez les 27 jours précédents",
      "Notez les changements positifs observés",
      "Remerciez pour cette transformation",
      "Engagez-vous à continuer la gratitude"
    ],
    reflection: "Comment avez-vous changé pendant ce défi ?",
    affirmation: "Je suis reconnaissant pour ma transformation positive",
    completed: false
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
