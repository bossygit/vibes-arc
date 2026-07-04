# Jardin Karmique — Design Spec (Option C)

**Date:** 2026-07-04  
**Statut:** Implémenté (MVP)  
**Projet:** Vibes-Arc (Vibes Tracker)  
**Référence:** *Karmic Management* — Geshe Michael Roach, Lama Christie McNally, Michael Gordon

---

## 1. Objectif

Créer un jeu intégré à Vibes-Arc qui enseigne et pratique les principes de *Karmic Management*, avec :

1. **Session matinale guidée** — cycle officiel en 4 étapes (objectif → partenaire → action → coffee meditation).
2. **Graines libres l’après-midi** — actions spontanées du catalogue, sans refaire les 4 étapes.
3. **Sync habitude** — l’habitude « Jardin Karmique » est cochée automatiquement quand la session matinale est complète (étape 4 validée).

La double progression (extérieure + qualités intérieures) reste au cœur du MVP.

---

## 2. Principes du livre (contraintes de design)

| Principe | Implication jeu |
|----------|-----------------|
| Une graine se plante chez **une autre personne** (le « sol ») | Étape 2 obligatoire en session matinale ; graines libres demandent aussi « pour qui » |
| 4 étapes : phrase → plan → action → coffee meditation | Wizard matinal strict ; étape 4 = timer + réflexion guidée |
| Arroser la graine = **rejouir** l’aide (pas souffrir plus) | Coffee meditation = UX douce, pas pénitence |
| Aider clients, collègues, concurrents | Champ « partenaire karmique » ouvert (pas que proches) |
| Résultats = graines passées qui mûrissent | Délais visuels (pousse lente) + pas de gratification instantanée excessive |

---

## 3. Architecture produit

### 3.1 Deux modes dans une vue

```
┌─────────────────────────────────────────────────────────┐
│  🌱 Jardin Karmique                                     │
├─────────────────────────────────────────────────────────┤
│  [ Matin — Cycle 4 étapes ]  [ Après-midi — Graines ]   │  ← tabs
├─────────────────────────────────────────────────────────┤
│  Panneau actif + Jardin visuel (6 parcelles)            │
│  + Qualités intérieures (barres)                        │
│  + Karma / Niveau                                       │
└─────────────────────────────────────────────────────────┘
```

- **Matin** : une session par jour calendaire (fuseau utilisateur / `userPrefs.notifTimezone`).
- **Après-midi** : illimité en nombre de graines, mais **plafond Karma** (ex. +30 Karma max/jour en graines libres) pour éviter le farming.

### 3.2 Sync habitude

Extension de `useGameHabitSync` :

| Paramètre | Valeur |
|-----------|--------|
| `view` | `karmicGarden` |
| Habitude | `Jardin Karmique` |
| `milestoneKey` | `karmic_management` |
| Déclencheur | `morningSession.completed === true` pour la date du jour |
| Ne PAS cocher | Ouverture de la vue seule, graines libres seules |

Logique : au `completeMorningSession()`, appeler `toggleHabitDay` si pas déjà coché (pattern identique aux 4 jeux existants).

---

## 4. Domaines de graines (6 parcelles)

| ID | Label | Couleur | Qualités nourries |
|----|-------|---------|-------------------|
| `abondance` | Abondance | green | Générosité, Intégrité |
| `relations` | Relations | red | Compassion, Patience |
| `sante` | Santé | blue | Discipline, Courage |
| `sagesse` | Sagesse | purple | Clarté |
| `leadership` | Leadership | yellow | Courage, Intégrité |
| `spiritualite` | Spiritualité | white/indigo | Joie, Clarté |

Chaque parcelle a un **stade visuel** 0–4 : vide → 🌱 → 🌿 → 🌳 → 🌸 → 🍎 (seuil par sessions/graines cumulées dans ce domaine).

---

## 5. Session matinale (Cycle 4 étapes)

### Étape 1 — Intention (une phrase)

- Champ texte, max 120 caractères.
- Placeholder : « En une phrase, que veux-tu voir germer ? »
- Validation : non vide.

### Étape 2 — Le sol (partenaire karmique)

- `partnerName` (requis)
- `partnerGoal` (optionnel, même objectif que toi)
- `helpPlan` (requis) — plan concret de la semaine
- Copy : « Les graines se plantent dans les autres. Qui veux-tu aider ? »

### Étape 3 — Planter (action du jour)

- Choix du **domaine** (6 parcelles)
- `actionLog` (requis, min 20 caractères) — ce qui a été ou sera fait aujourd’hui pour cette personne
- Checkbox « J’ai agi aujourd’hui » (optionnel si action planifiée pour plus tard — mais Karma réduit de 50 % si non coché)

### Étape 4 — Arroser (Coffee Meditation)

- Timer 3 min (défaut) ou 5 min
- Texte guidé scrollable :
  1. Respirer
  2. Revoir l’aide prévue / faite
  3. Rejouir : « Si j’aide, je reçois »
  4. Visualiser l’objectif (phrase étape 1) déjà accompli
- Bouton « Terminer la session » actif seulement après timer ≥ 80 % ou skip explicite « J’ai médité » (honor system)
- **Complétion** → +Karma, +qualités, pousse parcelle, **sync habitude**

### Récompenses session matinale

| Élément | Valeur |
|---------|--------|
| Karma base | +15 |
| Action faite aujourd’hui | +5 bonus |
| Méditation complète (timer) | +5 bonus |
| Qualités | +5 à la qualité primaire du domaine |

---

## 6. Graines libres (après-midi)

Catalogue d’actions pré-définies + action custom.

### Structure carte

```typescript
interface FreeSeedAction {
  id: string;
  label: string;           // ex. "Compliment sincère"
  domain: SeedDomain;
  difficulty: 1 | 2 | 3;   // étoiles
  karmaReward: number;
  isLegendary?: boolean;
  requiresPartner?: boolean;
}
```

### Flow

1. Choisir une carte (ou « Action personnalisée »)
2. Si `requiresPartner` ou custom : champ « Pour qui ? »
3. Note courte (optionnel)
4. « Planter la graine » → Karma + qualités (montants réduits vs matin)

### Récompenses graines libres

| Difficulté | Karma | Qualités |
|------------|-------|----------|
| ⭐ | +5 | +2 |
| ⭐⭐ | +8 | +3 |
| ⭐⭐⭐ | +12 | +5 |
| Légendaire | +25 | +8 (max 1/jour) |

**Plafond journalier graines libres :** 30 Karma (les graines au-delà comptent pour le jardin mais pas le Karma).

### Catalogue MVP (18 actions)

**Relations :** compliment sincère, écoute 10 min, message d’encouragement  
**Abondance :** don (temps/argent), partager une ressource, faire réussir quelqu’un  
**Santé :** sport, repas sain, sommeil 8h (lien combo futur)  
**Sagesse :** lire 15 min, journal, enseigner gratuitement  
**Leadership :** déléguer avec confiance, feedback constructif  
**Spiritualité :** méditation 10 min, gratitude 3 items  
**Légendaires (1/jour max) :** pardonner, don anonyme, sauver une relation

---

## 7. Progression extérieure

### Karma & niveaux

| Niveau | Seuil Karma cumulé | Titre |
|--------|-------------------|-------|
| 1 | 0 | 🌱 Seed Planter |
| 2 | 100 | 🌿 Gardener |
| 3 | 350 | 🌳 Cultivator |
| 4 | 800 | 🌲 Master Gardener |
| 5 | 1500 | ✨ Karmic Architect |
| 6 | 3000 | 👑 Seed Master |

Karma s’ajoute au `gamification.points` existant (réutiliser `addPoints`).

### Jardin visuel

- Composant `KarmicGardenPlot` : grille 2×3 ou 3×2 des 6 domaines
- Chaque parcelle : icône stade + compteur graines du domaine
- Animation légère (CSS) à chaque plantation

---

## 8. Progression intérieure (qualités)

```typescript
type InnerQuality =
  | 'generosite' | 'discipline' | 'patience' | 'courage'
  | 'compassion' | 'clarte' | 'integrite' | 'joie';

interface InnerQualities {
  generosite: number;   // 0–100
  discipline: number;
  patience: number;
  courage: number;
  compassion: number;
  clarte: number;
  integrite: number;
  joie: number;
}
```

Affichage : 8 barres compactes sous le jardin. Pas de level-up séparé — la barre **est** la progression.

---

## 9. Modèle de données

### localStorage key

`vibes-arc-karmic-garden`

```typescript
interface KarmicGardenState {
  version: 1;
  karmaTotal: number;           // cumul historique (niveaux)
  qualities: InnerQualities;
  plotProgress: Record<SeedDomain, number>; // graines cumulées par domaine
  morningSessions: KarmicMorningSession[];  // historique
  freeSeeds: KarmicFreeSeed[];              // historique
  lastLegendaryDate?: string;               // YYYY-MM-DD
  freeSeedKarmaToday?: { date: string; amount: number };
}

interface KarmicMorningSession {
  date: string;
  goal: string;
  partnerName: string;
  partnerGoal?: string;
  helpPlan: string;
  domain: SeedDomain;
  actionLog: string;
  actionDoneToday: boolean;
  meditationCompleted: boolean;
  karmaEarned: number;
  completedAt: string;
}

interface KarmicFreeSeed {
  id: string;
  actionId: string;
  label: string;
  domain: SeedDomain;
  partnerName?: string;
  note?: string;
  karmaEarned: number;
  plantedAt: string;
}
```

Pas de Supabase en MVP — aligné sur Magic Gratitude / autres jeux.

---

## 10. Composants & fichiers (implémentation)

| Fichier | Rôle |
|---------|------|
| `src/data/karmicSeedCatalog.ts` | Catalogue graines libres + métadonnées domaines |
| `src/data/karmicGardenLevels.ts` | Seuils niveaux + stades parcelles |
| `src/types/karmicGarden.ts` | Types TS |
| `src/utils/karmicGardenUtils.ts` | Calcul Karma, stades, plafonds |
| `src/hooks/useKarmicGardenState.ts` | load/save localStorage |
| `src/hooks/useGameHabitSync.ts` | + entrée `karmicGarden` |
| `src/components/KarmicGardenView.tsx` | Vue principale (tabs matin/après-midi) |
| `src/components/karmic/MorningCycleWizard.tsx` | Wizard 4 étapes |
| `src/components/karmic/FreeSeedPicker.tsx` | Graines libres |
| `src/components/karmic/KarmicGardenPlot.tsx` | Visualisation jardin |
| `src/components/karmic/InnerQualitiesPanel.tsx` | Barres qualités |
| `src/components/karmic/CoffeeMeditation.tsx` | Timer étape 4 |
| `src/types/index.ts` | + `karmicGarden` dans `ViewType` |
| `src/App.tsx` | route vue |
| `src/components/Header.tsx` | nav « Jardin Karmique » |

---

## 11. Règles métier

1. **Une session matinale par jour** — si déjà complète, onglet Matin en lecture seule + message « Graine du jour plantée ✓ ».
2. **Graines libres** toujours disponibles (sauf si même action légendaire déjà faite ce jour).
3. **Habitude cochée** uniquement sur complétion matinale (pas graines libres seules).
4. **Graines libres** peuvent quand même faire pousser les parcelles et les qualités.
5. **Combo futur (Phase 2)** : si habitudes Santé cochées le même jour qu’une graine Santé → x2 (hors MVP).

---

## 12. UX copy (vocabulaire immersif)

| Classique | Jeu |
|-----------|-----|
| Compléter habitude | Planter une graine |
| Objectif | Intention / graine d’intention |
| Aider quelqu’un | Choisir le sol |
| Méditation du soir | Arroser (Coffee Meditation) |
| Points | Karma |
| Niveau | Titre de jardinier |

---

## 13. Hors scope MVP (Phase 2+)

- Boss (habitudes stop)
- Collection cartes avec rareté visuelle
- Events pleine lune / semaine gratitude
- Décor évolutif (forêt → montagne sacrée)
- Sync Supabase / coach-api
- Combos x2/x3 multi-habitudes
- Notifications Telegram « As-tu arrosé ta graine ce soir ? »

---

## 14. Tests manuels (checklist)

- [ ] Session matinale complète coche « Jardin Karmique »
- [ ] Graine libre seule ne coche pas l’habitude
- [ ] Deuxième session matinale le même jour bloquée
- [ ] Plafond 30 Karma graines libres respecté
- [ ] Légendaire max 1/jour
- [ ] Parcelle progresse visuellement après 5 / 15 / 40 / 100 graines domaine
- [ ] Qualités augmentent et plafonnent à 100
- [ ] État survit reload (localStorage)
- [ ] Utilisateur non connecté : jeu fonctionne, sync habitude noop silencieux

---

## 15. Décision validée

**Option C** — Session matinale 4 étapes + graines libres l’après-midi.
