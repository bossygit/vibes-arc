import { EnvironmentMap } from '@/types';

const nowISO = () => new Date().toISOString();

export const environmentTemplates: Array<Omit<EnvironmentMap, 'id'>> = [
  {
    name: 'Lit',
    room: 'Chambre',
    riskLevel: 4,
    createdAt: nowISO(),
    updatedAt: nowISO(),
    desiredBehaviors: ['Repos', 'Lecture calme', 'Visualisation calme (SATS léger)'],
    avoidBehaviors: ['Téléphone au lit', 'Scroll dopaminergique', 'Travail au lit'],
    transitionRituals: ['Téléphone hors chambre (mode avion)', '3 physiological sigh', 'Lumière douce + 10 respirations'],
    notes: 'Le lit est un contexte. Si tu y mets le business/scroll, tu crées un conflit nerveux.',
  },
  {
    name: 'Téléphone',
    room: 'Général',
    riskLevel: 4,
    createdAt: nowISO(),
    updatedAt: nowISO(),
    desiredBehaviors: ['Appels prospection (timés)', 'Messages clients (timebox)', 'Notes business (capture)'],
    avoidBehaviors: ['Scroll sans intention', 'Porn/trigger', 'Notifications en continu'],
    transitionRituals: ['Désactiver notifs non essentielles', 'Ouvrir une seule app cible', 'Timer 10 minutes'],
    notes: 'Le téléphone est un “interrupteur” de dopamine. Sans règles, il te pilote.',
  },
  {
    name: 'Bureau',
    room: 'Salon / Bureau',
    riskLevel: 1,
    createdAt: nowISO(),
    updatedAt: nowISO(),
    desiredBehaviors: ['Création offre', 'Prospection', 'Production (contenu)', 'Admin (facturation)'],
    avoidBehaviors: ['Multi-tasking', 'Onglets infinis', 'Consommer avant produire'],
    transitionRituals: ['Ranger la surface (30s)', 'Écrire “next action 2 min”', 'Timer 25 min'],
    notes: 'Objectif: friction basse pour l’exécution, pas perfection.',
  },
  {
    name: 'Salon',
    room: 'Salon',
    riskLevel: 2,
    createdAt: nowISO(),
    updatedAt: nowISO(),
    desiredBehaviors: ['Connexion', 'Repos actif', 'Marche légère'],
    avoidBehaviors: ['Rester assis 3h', 'Scroll automatique'],
    transitionRituals: ['Mettre chaussures / sortir 5 min', 'Eau + respiration lente'],
  },
];

