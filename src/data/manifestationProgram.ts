export interface ManifestationDay {
  day: number;
  week: number;
  theme: string;
  morning: string;
  afternoon: string;
  evening: string;
  affirmation: string;
  isScriptingDay: boolean;
}

export interface ManifestationWeek {
  week: number;
  title: string;
  subtitle: string;
  days: ManifestationDay[];
}

export const AFFIRMATIONS = {
  argent: [
    "L'argent pour mon KIA arrive par des voies que je n'imagine meme pas encore.",
    "Je suis une personne qui attire les opportunites financieres facilement.",
    "Mon desir est legitime et l'Univers trouve toujours les moyens.",
    "Je n'ai pas besoin de savoir comment — je fais confiance au processus.",
    "L'argent est une energie positive qui coule vers moi naturellement.",
  ],
  merite: [
    "Je suis ne pour l'abondance. Elle n'est pas reservee aux autres.",
    "Je merite de belles choses autant que n'importe qui sur cette terre.",
    "Mon bien-etre est important. Prendre soin de moi est un acte d'amour.",
    "Avoir un KIA ne me rend pas vaniteux — cela me rend efficace et joyeux.",
    "Je choisis de croire que je merite tout ce que je desire sincerement.",
  ],
  doute: [
    "La loi de l'attraction fonctionne, que je la comprenne totalement ou non.",
    "Ce que je vois autour de moi est la preuve que la manifestation est reelle.",
    "Mon desir est une indication que sa realisation est possible pour moi.",
    "Chaque jour je me rapproche de mon KIA, meme si je ne vois pas encore comment.",
  ],
};

export const PROGRAM_WEEKS: ManifestationWeek[] = [
  {
    week: 1,
    title: 'Planter la graine',
    subtitle: 'Clarifier, ancrer le desir, commencer les rituels de base.',
    days: [
      { day: 1, week: 1, theme: 'Clarte', morning: 'Ecris la description exacte de ton KIA (couleur, modele, equipements)', afternoon: 'Cherche des images de ce KIA (reseaux, internet)', evening: 'Cree ton Vision Board physique ou numerique', affirmation: 'Je suis le proprietaire heureux et reconnaissant d\'un KIA SUV.', isScriptingDay: false },
      { day: 2, week: 1, theme: 'Desir pur', morning: 'Visualisation + 3x affirmation', afternoon: 'Marche dans Brazzaville, remarque tous les KIA', evening: '6x affirmation + journal : pourquoi je veux ce KIA', affirmation: 'Ce vehicule me sert parfaitement et circule facilement dans les rues de Brazzaville.', isScriptingDay: false },
      { day: 3, week: 1, theme: 'Emotion', morning: 'Visualisation intense avec musique qui t\'inspire', afternoon: '369 x6', evening: '369 x9 + Scripting scene 1', affirmation: 'Je ressens la joie et la fierte de conduire mon KIA chaque jour.', isScriptingDay: true },
      { day: 4, week: 1, theme: 'Identite', morning: '369 x3 + dis : « Je suis proprietaire d\'un KIA »', afternoon: 'Comportement nouveau : parle de ton KIA a un proche', evening: 'Journal : Qui suis-je avec ce vehicule ?', affirmation: 'Je suis proprietaire d\'un KIA SUV.', isScriptingDay: false },
      { day: 5, week: 1, theme: 'Merite', morning: 'Affirmation merite : « Je merite l\'abondance »', afternoon: '369 x6 merite', evening: 'Exercice miroir : dis a ta reflexion que tu merites', affirmation: 'Je merite l\'abondance. Elle n\'est pas reservee aux autres.', isScriptingDay: false },
      { day: 6, week: 1, theme: 'Confiance', morning: 'Visualisation longue 10 min', afternoon: 'Lis un temoignage de manifestation de vehicule', evening: '369 x9 + gratitude abondance', affirmation: 'L\'Univers organise tout pour que mon KIA arrive au moment parfait.', isScriptingDay: false },
      { day: 7, week: 1, theme: 'Bilan S1', morning: 'Revois tes notes de la semaine', afternoon: 'Ajuste ton Vision Board si besoin', evening: 'Celebration : offre-toi quelque chose de bien et remercie', affirmation: 'Merci Univers. Mon KIA est en route.', isScriptingDay: false },
    ],
  },
  {
    week: 2,
    title: 'Monter la vibration',
    subtitle: 'Travailler l\'emotion. Passer de l\'espoir au vrai enthousiasme.',
    days: [
      { day: 8, week: 2, theme: 'Joie', morning: '5 min de mouvement joyeux (danse, marche rapide)', afternoon: '369 x6 + note une coincidence positive', evening: 'Scripting scene 2', affirmation: 'La joie que je ressens attire mon KIA vers moi.', isScriptingDay: true },
      { day: 9, week: 2, theme: 'Argent', morning: 'Affirmation argent : « L\'argent me trouve facilement »', afternoon: 'Calcule 3 scenarios de financement possibles', evening: '369 x9 + gratitude pour l\'argent que tu as', affirmation: 'L\'argent me trouve facilement et naturellement.', isScriptingDay: false },
      { day: 10, week: 2, theme: 'Liberte', morning: 'Visualise la liberte que donne le KIA', afternoon: '369 x6 liberte', evening: 'Journal : liste 10 facons dont le KIA change ta vie', affirmation: 'Mon KIA me donne une liberte totale de mouvement.', isScriptingDay: false },
      { day: 11, week: 2, theme: 'Lacher prise', morning: '369 x3 puis DIS : Je lache le comment', afternoon: 'Fais quelque chose d\'autre et ne pense PAS au KIA', evening: '369 x9 + meditation 5 min', affirmation: 'Je lache le comment et je fais confiance au processus.', isScriptingDay: false },
      { day: 12, week: 2, theme: 'Preuve', morning: 'Cherche et lis 2 temoignages de manifestation auto', afternoon: '369 x6 + note les signes de la journee', evening: 'Scripting scene 3 — dans le KIA avec famille', affirmation: 'Les preuves de ma manifestation apparaissent chaque jour.', isScriptingDay: true },
      { day: 13, week: 2, theme: 'Abondance', morning: 'Rampage d\'appreciation 10 min sur l\'abondance dans ta vie', afternoon: '369 x6 abondance', evening: '369 x9 + gratitude longue', affirmation: 'L\'abondance coule dans tous les domaines de ma vie.', isScriptingDay: false },
      { day: 14, week: 2, theme: 'Bilan S2', morning: 'Meditation 10 min', afternoon: 'Revois ton Vision Board', evening: 'Celebration S2 — tu es a 23% du chemin', affirmation: 'Je celebre chaque etape de mon parcours vers mon KIA.', isScriptingDay: false },
    ],
  },
  {
    week: 3,
    title: 'Dissoudre le merite',
    subtitle: 'Travail profond sur la croyance « Je ne merite pas ». Semaine la plus transformatrice.',
    days: [
      { day: 15, week: 3, theme: 'Origines', morning: '369 x3 merite', afternoon: 'Journal : d\'ou vient ma croyance que je ne merite pas ?', evening: 'Lis : « Je suis ne pour l\'abondance »', affirmation: 'Je suis ne pour l\'abondance et la prosperite.', isScriptingDay: false },
      { day: 16, week: 3, theme: 'Rupture', morning: 'Ecris la vieille croyance, barre-la et reecris la nouvelle', afternoon: '369 x6 nouvelle croyance', evening: '369 x9 + Scripting merite', affirmation: 'Je choisis aujourd\'hui de croire que je merite le meilleur.', isScriptingDay: true },
      { day: 17, week: 3, theme: 'Exemples', morning: 'Visualise quelqu\'un qui te ressemble avec un beau vehicule', afternoon: '369 x6', evening: 'Journal : 5 preuves que tu merites l\'abondance', affirmation: 'Des gens comme moi possedent de beaux vehicules chaque jour.', isScriptingDay: false },
      { day: 18, week: 3, theme: 'Corps', morning: 'Habille-toi comme si tu avais deja le KIA', afternoon: '369 x6 + marche avec confiance de proprietaire', evening: 'Scripting scene 4 — toi tres elegant dans ton SUV', affirmation: 'Je suis quelqu\'un d\'elegant et de confiant au volant de mon KIA.', isScriptingDay: true },
      { day: 19, week: 3, theme: 'Pardon', morning: 'Pardonne a toute croyance limitante du passe', afternoon: '369 x6', evening: '369 x9 + gratitude pour ta transformation', affirmation: 'Je pardonne toutes les croyances qui m\'ont limite. Je suis libre.', isScriptingDay: false },
      { day: 20, week: 3, theme: 'Nouveau toi', morning: 'Affirmation identite : « Je suis quelqu\'un qui possede un SUV »', afternoon: '369 x6 nouvelle identite', evening: 'Scripting — decris qui tu es avec ce vehicule', affirmation: 'Je suis quelqu\'un qui possede un SUV et qui vit dans l\'abondance.', isScriptingDay: true },
      { day: 21, week: 3, theme: 'Bilan S3', morning: 'Meditation profonde 15 min', afternoon: 'Partage ton intention avec quelqu\'un de confiant', evening: 'Celebration — tu as fait 35% du programme', affirmation: 'Ma transformation interieure attire mon KIA vers moi.', isScriptingDay: false },
    ],
  },
  {
    week: 4,
    title: 'Travailler le doute',
    subtitle: 'Transformer le doute en curiosite, puis en espoir, puis en attente positive.',
    days: [
      { day: 22, week: 4, theme: 'Doute nomme', morning: '369 x3', afternoon: 'Ecris tes doutes. Reponds a chacun avec une refutation', evening: '369 x9 + temoignage avant de dormir', affirmation: 'Mes doutes ne sont que de vieilles histoires. La verite c\'est que mon KIA arrive.', isScriptingDay: false },
      { day: 23, week: 4, theme: 'Curiosite', morning: 'Remplace le doute par la curiosite : « Comment ca va marcher ? »', afternoon: '369 x6 curiosite', evening: 'Scripting scene 5 — surprise de la maniere dont ca s\'est passe', affirmation: 'Je suis curieux et enthousiaste de voir comment mon KIA va arriver.', isScriptingDay: true },
      { day: 24, week: 4, theme: 'Signes', morning: '369 x3 + intention : je vais voir 3 KIA aujourd\'hui', afternoon: 'Compte et note les KIA vus', evening: '369 x9 + gratitude pour les signes', affirmation: 'Je vois des signes partout que mon KIA se manifeste.', isScriptingDay: false },
      { day: 25, week: 4, theme: 'Petite victoire', morning: 'Rappelle-toi une chose que tu as manifestee (meme petite)', afternoon: '369 x6 + renforce la foi sur ce souvenir', evening: 'Scripting sur la confiance', affirmation: 'J\'ai deja manifeste des choses. Mon KIA est la prochaine.', isScriptingDay: true },
      { day: 26, week: 4, theme: 'Action inspiree', morning: 'As-tu une intuition sur une action concrete ?', afternoon: '369 x6 + suis l\'intuition si elle se presente', evening: '369 x9', affirmation: 'Je suis guide vers les bonnes actions au bon moment.', isScriptingDay: false },
      { day: 27, week: 4, theme: 'Lacher-prise', morning: 'Meditation lacher prise 10 min', afternoon: '369 x6', evening: 'Journal : ce que je ressens maintenant vs jour 1', affirmation: 'Je lache prise et je laisse l\'Univers faire son travail.', isScriptingDay: false },
      { day: 28, week: 4, theme: 'Bilan MI-PARCOURS', morning: 'Meditation + revision Vision Board', afternoon: 'BILAN MI-PARCOURS : compare jour 1 et maintenant', evening: 'Grande celebration — mi-chemin !', affirmation: 'Je suis a mi-chemin. Mon KIA est plus proche que jamais.', isScriptingDay: false },
    ],
  },
  {
    week: 5,
    title: 'Vibration de proprietaire',
    subtitle: 'Tu commences a te COMPORTER et a VIBRER comme si le KIA est deja la.',
    days: [
      { day: 29, week: 5, theme: 'Comportement', morning: 'Cherche les prix des KIA a Brazzaville', afternoon: '369 x6 + entre dans un concessionnaire si possible', evening: 'Scripting scene 6 — tu signes les papiers', affirmation: 'Je me comporte comme le proprietaire de mon KIA.', isScriptingDay: true },
      { day: 30, week: 5, theme: 'Abondance', morning: '369 x3 + 10 min sur l\'argent comme energie positive', afternoon: '369 x6', evening: '369 x9 + gratitude argent', affirmation: 'L\'argent est une energie positive qui coule vers moi.', isScriptingDay: false },
      { day: 31, week: 5, theme: 'Enthousiasme', morning: 'Visualisation avec la plus haute emotion positive', afternoon: 'Partage avec un proche : j\'aurai mon KIA bientot', evening: 'Scripting — la premiere sortie avec le KIA', affirmation: 'Mon enthousiasme est le signal que mon KIA approche.', isScriptingDay: true },
      { day: 32, week: 5, theme: 'Deja accompli', morning: 'Vis toute la matinee comme si tu as deja le KIA', afternoon: '369 x6', evening: '369 x9 + note tes emotions', affirmation: 'Mon KIA est deja a moi. Je le vis maintenant.', isScriptingDay: false },
      { day: 33, week: 5, theme: 'Gratitude maximale', morning: '10 min de pure gratitude pour le KIA comme si c\'est fait', afternoon: '369 x6 gratitude', evening: 'Scripting — remerciements a l\'Univers', affirmation: 'Merci Univers pour mon KIA. Il est deja dans ma vie.', isScriptingDay: true },
      { day: 34, week: 5, theme: 'Action', morning: '369 x3 + identifie une etape financiere concrete', afternoon: '369 x6 + explore une option concrete', evening: '369 x9', affirmation: 'Je prends des actions inspirees qui me rapprochent de mon KIA.', isScriptingDay: false },
      { day: 35, week: 5, theme: 'Bilan S5', morning: 'Meditation + Vision Board', afternoon: 'Journal des synchronicites de la semaine', evening: 'Celebration S5', affirmation: 'Les synchronicites confirment que mon KIA arrive.', isScriptingDay: false },
    ],
  },
  {
    week: 6,
    title: 'Acceleration',
    subtitle: 'Les premieres « portes » s\'ouvrent. Reste dans la haute vibration et suis les intuitions.',
    days: [
      { day: 36, week: 6, theme: 'Fluidite', morning: '369 x3 + visualisation 15 min', afternoon: '369 x6', evening: 'Scripting long — une journee entiere avec le KIA', affirmation: 'Tout coule avec fluidite vers la realisation de mon desir.', isScriptingDay: true },
      { day: 37, week: 6, theme: 'Confiance totale', morning: 'Affirme : « Mon KIA arrive au moment parfait »', afternoon: '369 x6 timing parfait', evening: '369 x9 + meditation paix', affirmation: 'Mon KIA arrive au moment parfait pour moi.', isScriptingDay: false },
      { day: 38, week: 6, theme: 'Expansion', morning: 'Ajoute un detail a ta visualisation (odeur, musique dans la voiture)', afternoon: '369 x6', evening: 'Scripting scene 7 — voyage hors de Brazzaville', affirmation: 'Ma visualisation est de plus en plus vivante et reelle.', isScriptingDay: true },
      { day: 39, week: 6, theme: 'Action inspiree', morning: '369 x3 + suis toute intuition financiere', afternoon: '369 x6', evening: '369 x9', affirmation: 'Je suis ouvert aux opportunites que l\'Univers me presente.', isScriptingDay: false },
      { day: 40, week: 6, theme: 'Foi pure', morning: 'Visualisation sans effort — laisse les images venir', afternoon: '369 x6', evening: 'Journal : je crois a 100% aujourd\'hui ?', affirmation: 'Ma foi est solide. Mon KIA est une certitude.', isScriptingDay: false },
      { day: 41, week: 6, theme: 'Partage', morning: '369 x3 + parle de ta manifestation', afternoon: 'Lis des temoignages de personnes en Afrique', evening: '369 x9 + gratitude', affirmation: 'En partageant ma vision, je la renforce.', isScriptingDay: false },
      { day: 42, week: 6, theme: 'Bilan S6', morning: 'Grand bilan des 42 jours', afternoon: 'Revision et enrichissement Vision Board', evening: 'Celebration — tu es a 70% !', affirmation: 'Je suis a 70% du chemin. Mon KIA est presque la.', isScriptingDay: false },
    ],
  },
  {
    week: 7,
    title: 'Dernier obstacle',
    subtitle: 'Juste avant la manifestation, il y a un dernier test. Ne lache pas.',
    days: [
      { day: 43, week: 7, theme: 'Resilience', morning: '369 x3 + affirme : « Je suis proche »', afternoon: '369 x6', evening: 'Scripting — celebration d\'avoir recu le KIA', affirmation: 'Je suis proche. Chaque jour me rapproche de mon KIA.', isScriptingDay: true },
      { day: 44, week: 7, theme: 'Perseverance', morning: 'Relis tout ton journal depuis le jour 1', afternoon: '369 x6', evening: '369 x9 + meditation force', affirmation: 'Ma perseverance est la cle de ma manifestation.', isScriptingDay: false },
      { day: 45, week: 7, theme: 'Detachement', morning: 'Pratique de ne PAS penser au KIA de 9h a 14h', afternoon: '369 x6', evening: 'Scripting — serenite totale', affirmation: 'Je suis detache du resultat car je sais qu\'il est certain.', isScriptingDay: true },
      { day: 46, week: 7, theme: 'Terrain', morning: 'Action concrete : concessionnaire, banque, discussion famille', afternoon: '369 x6', evening: '369 x9 + gratitude pour les portes qui s\'ouvrent', affirmation: 'Les portes s\'ouvrent devant moi facilement.', isScriptingDay: false },
      { day: 47, week: 7, theme: 'Elevation', morning: 'Visualisation avec musique forte pendant 20 min', afternoon: '369 x6', evening: 'Scripting final — toi recevant les cles', affirmation: 'Je me vois recevoir les cles de mon KIA avec une joie immense.', isScriptingDay: true },
      { day: 48, week: 7, theme: 'Paix', morning: 'Meditation 15 min — paix avec le timing', afternoon: '369 x6', evening: '369 x9', affirmation: 'Je suis en paix avec le timing de l\'Univers.', isScriptingDay: false },
      { day: 49, week: 7, theme: 'Bilan S7', morning: 'Journal : comment as-tu change depuis 49 jours ?', afternoon: 'Vision Board final', evening: 'Celebration — 7 semaines accomplies !', affirmation: 'Je suis une personne transformee. Mon KIA le sait.', isScriptingDay: false },
    ],
  },
  {
    week: 8,
    title: 'Recevoir',
    subtitle: 'Finaliser l\'alignement. Agir sur les intuitions concretes. Etre PRET a recevoir.',
    days: [
      { day: 50, week: 8, theme: 'Pret a recevoir', morning: '369 x3 + affirme : « Je suis pret »', afternoon: '369 x6 + action concrete de ton choix', evening: 'Scripting — cles en mains', affirmation: 'Je suis pret a recevoir mon KIA maintenant.', isScriptingDay: true },
      { day: 51, week: 8, theme: 'Clarte finale', morning: 'Visualisation ultra precise (couleur exacte ?)', afternoon: '369 x6', evening: '369 x9 + gratitude maximum', affirmation: 'Ma vision est claire comme du cristal. Mon KIA est la.', isScriptingDay: false },
      { day: 52, week: 8, theme: 'Pure joie', morning: '5 min de joie pure avant toute chose', afternoon: '369 x6', evening: 'Scripting — raconter l\'histoire a tes enfants un jour', affirmation: 'La joie que je ressens est la preuve que mon KIA arrive.', isScriptingDay: true },
      { day: 53, week: 8, theme: 'Alignement total', morning: 'Meditation + visualisation + 369 x3', afternoon: '369 x6', evening: '369 x9 + Ecris ta Lettre a l\'Univers', affirmation: 'Je suis totalement aligne avec mon KIA. Il est a moi.', isScriptingDay: false },
      { day: 54, week: 8, theme: 'Actions', morning: '369 x3 + liste d\'actions concretes restantes', afternoon: 'Execute au moins une action de la liste', evening: '369 x9', affirmation: 'Mes actions sont guidees et parfaites.', isScriptingDay: false },
      { day: 55, week: 8, theme: 'Temoignage anticipe', morning: 'Ecris ton temoignage futur comme si tu racontes avoir recu le KIA', afternoon: '369 x6', evening: 'Scripting ultime', affirmation: 'Mon temoignage de manifestation inspire les autres.', isScriptingDay: true },
      { day: 56, week: 8, theme: 'Gratitude profonde', morning: '10 min de pure gratitude : famille, vie, KIA a venir', afternoon: '369 x6', evening: '369 x9 + meditation', affirmation: 'Ma gratitude profonde accelere la manifestation.', isScriptingDay: false },
      { day: 57, week: 8, theme: 'Confiance absolue', morning: 'Vis toute la journee comme proprietaire', afternoon: '369 x6', evening: 'Journal bilan complet', affirmation: 'Ma confiance est absolue. Mon KIA est certain.', isScriptingDay: false },
      { day: 58, week: 8, theme: 'Lacher prise final', morning: '369 x3 + laisse partir l\'attachement au resultat', afternoon: '369 x6', evening: '369 x9 + paix profonde', affirmation: 'Je lache prise completement. L\'Univers livre toujours.', isScriptingDay: false },
      { day: 59, week: 8, theme: 'Avant-dernier jour', morning: 'Visualisation la plus puissante des 60 jours', afternoon: '369 x6', evening: 'Scripting : demain je celebre', affirmation: 'Demain je celebre 60 jours de transformation.', isScriptingDay: true },
      { day: 60, week: 8, theme: 'CELEBRATION', morning: 'Grand rituel de gratitude final', afternoon: 'Cree un repas, un moment special pour celebrer', evening: 'Relis tout ton journal. Vois qui tu es devenu.', affirmation: 'MON KIA EST DEJA A MOI. MERCI.', isScriptingDay: false },
    ],
  },
];

export function getDayData(day: number): ManifestationDay | undefined {
  for (const week of PROGRAM_WEEKS) {
    const found = week.days.find((d) => d.day === day);
    if (found) return found;
  }
  return undefined;
}

export function getWeekForDay(day: number): ManifestationWeek | undefined {
  return PROGRAM_WEEKS.find((w) => w.days.some((d) => d.day === day));
}
