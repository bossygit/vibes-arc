import { PrimingTemplate } from '@/types';

export const primingTemplates: PrimingTemplate[] = [
  {
    id: 'priming-physio-sigh',
    title: 'Physiological sigh (sécurité rapide)',
    durationMin: 3,
    intent: 'sécurité',
    steps: [
      'Assieds-toi. Épaules basses. Regard doux.',
      'Inspire par le nez (70%). Petite seconde inspiration (30%).',
      'Expire lentement par la bouche (plus long que l’inspiration).',
      'Répète 5 fois. Puis 30 secondes de respiration naturelle.',
    ],
    safetyNote: 'Si vertige: ralentis, fais une pause, reprends plus doux.',
  },
  {
    id: 'priming-body-anchor',
    title: 'Ancrage corporel (retour au présent)',
    durationMin: 5,
    intent: 'sécurité',
    steps: [
      'Pieds au sol. Sens 3 points de contact (pieds, bassin, dos).',
      'Nommer mentalement 5 choses que tu vois (sans analyser).',
      'Puis 3 sensations corporelles (température, pression, respiration).',
      'Pose une main sur le sternum et observe 10 respirations.',
    ],
  },
  {
    id: 'priming-non-resistant-phrase',
    title: 'Phrase non résistante (diminuer la tension mentale)',
    durationMin: 3,
    intent: 'discipline',
    steps: [
      'Choisis une phrase “vraie” et non excitante.',
      'Exemples: “Je peux faire un pas.” / “Je peux faire simple.” / “Je n’ai pas besoin d’être prêt.”',
      'Répète-la 10 fois à voix basse, en cherchant la sensation de neutralité.',
      'Stop dès que ça devient naturel (pas euphorique).',
    ],
    safetyNote: 'On vise le calme et la naturalité, pas l’excitation.',
  },
  {
    id: 'priming-90s-focus',
    title: 'Focus 90 secondes (bascule attention)',
    durationMin: 4,
    intent: 'focus',
    steps: [
      'Écris une phrase: “Mon prochain pas concret = …” (une action de 2 minutes).',
      'Lance un timer 90s. Respiration calme. Regarde un point fixe.',
      'Quand le timer sonne: fais immédiatement l’action de 2 minutes.',
    ],
  },
  {
    id: 'priming-abundance-calm',
    title: 'Souvenir du futur (abondance calme)',
    durationMin: 6,
    intent: 'abondance',
    steps: [
      'Imagine une scène ordinaire où ton objectif est déjà vrai (sans “wow”).',
      'Détail: posture, lumière, ton de voix, rythme respiratoire.',
      'Question: “Quel est le signe le plus banal que c’est déjà réel ?”',
      'Stop quand la sensation devient “normalité”.',
    ],
    safetyNote: 'Si ça crée excitation/anxiété: reviens à un détail banal + respiration lente.',
  },
];

