# Vibes Arc - Identity Tracker

Vibes Arc n'est pas une collection d'outils de développement personnel : c'est un **cycle en quatre étapes** que l'on parcourt chaque jour et chaque semaine.

## 🧭 L'Arc — Vision → Identité → Action → Évolution

| Étape | La question | Le cœur de l'étape (page d'étape) | Les outils rattachés |
| --- | --- | --- | --- |
| **1 · Vision** | Qui veux-je devenir ? | La **boussole** (« Je deviens… ») + les désirs actifs, leur futur soi et les identités qui doivent les recevoir | Tribunal de la Vie · Manifestation consciente · Vibes World |
| **2 · Identité** | Quelles croyances et quels comportements définissent cette personne ? | Chaque identité : ses croyances, ses signaux quotidiens, la vision qu'elle sert — et ce qui lui manque | Identités · Bibliothèque · Créer un signal · Focus Wheel · Pivot · Abondance · Environnement |
| **3 · Action** | Quelles preuves concrètes puis-je produire aujourd'hui ? | L'intention du matin, la preuve du soir, et les signaux du jour **rangés par identité** (cocher = verser une preuve) | Alignement du jour · Tableau des signaux · Segment Intending · Priming · Cohérence cardiaque · Focus 17/68 · Jardin karmique · Campagne d'appréciation · La Voie du Contrôle · Nutrition · Ancrages |
| **4 · Évolution** | Que m'apprennent mes résultats sur moi-même ? | La semaine en chiffres, le verdict de chaque dossier, les leçons de Vibes AI, le **monde intérieur** — puis le retour à la vision | Fréquence · Journal · Inner Child · Monde intérieur · Vibes AI · Labo d'expériences · Coach Vibes |

- **Mon Arc** (accueil) montre l'état réel des quatre étapes, la **prochaine étape** à faire (selon l'heure et ce qui manque) et le **fil d'or** : pour chaque désir, la chaîne complète désir → identités → preuves du jour → verdict.
- Chaque module affiche un **fil d'Ariane** qui rappelle l'étape à laquelle il répond, avec un lien vers l'étape suivante — après l'Évolution, on revient à la Vision.
- **Source unique** : [`src/config/arc.ts`](src/config/arc.ts) rattache chaque vue à une étape et à un groupe. Navigation, pages d'étape et fil d'Ariane en dérivent : pour déplacer un module, on change sa ligne.

## 🚀 Fonctionnalités

### Gestion d'Identités
- Créer, modifier et supprimer des identités (ex: "homme discipliné", "créateur inspiré")
- Chaque identité a un nom et une description optionnelle
- Calcul automatique du score d'intégration basé sur les habitudes liées

### Suivi d'Habitudes
- Créer des habitudes avec type (commencer/arrêter) et durée (92 jours par défaut)
- Lier chaque habitude à une ou plusieurs identités
- Grille visuelle de 92 jours (01/10/2025 - 31/12/2025)
- Suivi quotidien avec feedback visuel

### Tableau de Bord & Analytics
- Pourcentage de progression pour chaque habitude
- Scores d'identité (moyenne des habitudes liées)
- Historique des streaks (séries de jours consécutifs)
- Vue d'ensemble de toutes les habitudes actives

### Notifications intelligentes
- Rappels quotidiens programmables par fuseau horaire
- Messages envoyés via Telegram ou WhatsApp (Twilio)
- Test immédiat depuis l'interface pour vérifier la configuration

### 🥗 Module Nutrition
- **Journal par repas** : petit-déjeuner, déjeuner, dîner, collations
- **Recherche d'aliments multi-sources** : base locale + Open Food Facts (produits de marque, code-barres) + USDA FoodData Central (aliments bruts)
- **Objectifs calculés automatiquement** : métabolisme de base (Mifflin-St Jeor ou Katch-McArdle), dépense énergétique, ajustement selon l'objectif, répartition macro, et apports de référence en vitamines/minéraux (DRI)
- **Rapport nutritionnel** : 42 nutriments suivis, avec % de la cible et repérage des plafonds dépassés (sodium, sucres, AG saturés)
- **Base locale de 140 aliments** dont les staples d'Afrique de l'Ouest et du Centre (attiéké, igname, plantain, fonio, niébé, pondu, ndolé, mafé, yassa…) — fonctionne hors-ligne
- Cibles ajustables manuellement, nutriment par nutriment
- Persistance Supabase avec repli localStorage automatique (le journal reste utilisable sans réseau)

📖 **Documentation détaillée : [`docs/NUTRITION.md`](docs/NUTRITION.md)**

### ❤️ Module Cohérence cardiaque (biofeedback VRC)
- **Deux objectifs de session** : « Guidé · respiration » (un orbe pace la respiration à 4.5–7 cycles/min) et « Observation libre » (aucun guidage — on observe le cœur en direct)
- **Trois capteurs** : Caméra (PPG — l'option iPhone), Ceinture BLE (service Heart Rate `0x180D`, Chrome/Edge), Mode Démo (signal simulé, jamais enregistré)
- **Score de cohérence 0–10 en temps réel** calculé sur les 60 derniers intervalles RR (bande 0.04–0.15 Hz, cible ~0.1 Hz) + niveau Faible / Moyen / Élevé
- **Mesures de variabilité** : RMSSD (tonus parasympathique), SDNN, amplitude RR — affichées en direct en mode Observation libre
- **Comparaison automatique** : les sessions réelles sont enregistrées localement et comparées (Observation libre vs Cohérence guidée)
- **Garde-fou anti-mesure fantôme** : un signal physiologiquement impossible est signalé « Signal instable » et la session n'est pas enregistrée

📖 **Explication complète plus bas : section « Module Cohérence cardiaque — comment ça marche »**

### 🌙 Monde intérieur — Image Streaming × rêves (étape Évolution)
- Lit le **coffre Obsidian** : `Practice/Image Streaming` (séances, `sessions_index.json`, `symbols.json`) et `Notion/Au pays des merveilles` (un fichier par rêve, frontmatter `Date`, `Details`, `People in the Dream`…)
- **Échos** : un rêve et une séance à ±3 jours qui partagent un symbole précis
- **Symboles partagés** : les symboles de la base IS retrouvés dans les récits de rêve, avec leur arc émotionnel et leur évolution
- **Écarts** : ce qui n'existe que d'un côté (symboles IS jamais rêvés ; personnages, lieux et motifs des rêves)
- **Chronologie** : séances et rêves par semaine, face aux signaux émis et à la fréquence moyenne
- **Ce qui évolue en toi** : les symboles touchés par la dernière séance et leur évolution

📖 **Détails plus bas : section « Module Monde intérieur — comment ça marche »**

## 🛠️ Technologies

- **Frontend**: React 18 avec TypeScript
- **Styling**: Tailwind CSS avec design system personnalisé
- **State Management**: Zustand avec persistance hybride
- **Base de Données**: SQLite (better-sqlite3) + localStorage fallback
- **Build Tool**: Vite pour un développement rapide
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Charts**: Recharts (prêt pour futures fonctionnalités)

## 📦 Installation

```bash
# Installer les dépendances
npm install

# Initialiser la base de données SQLite (optionnel)
npm run init-db

# Lancer le serveur de développement
npm run dev

# Build pour la production
npm run build

# Prévisualiser le build
npm run preview
```

## 🎨 Design

- Interface clean et minimaliste
- Palette de couleurs apaisante (indigo/blue)
- Hiérarchie visuelle claire
- Animations fluides pour les interactions
- Layout responsive avec grilles adaptatives

## 📱 Structure du Projet

```
src/
├── config/
│   └── arc.ts           # L'arc : les 4 étapes + le rattachement de chaque module (source unique)
├── components/          # Composants React réutilisables
│   ├── arc/             # Mon Arc (accueil), les 4 pages d'étape, boussole, fil d'Ariane
│   ├── innerWorld/      # Monde intérieur (Image Streaming × rêves)
│   ├── Dashboard.tsx    # Tableau des signaux (étape Action)
│   ├── Header.tsx       # Navigation principale
│   ├── IdentityCard.tsx # Carte d'identité
│   ├── HabitCard.tsx    # Carte d'habitude
│   ├── HabitCalendar.tsx # Grille de suivi 92 jours
│   ├── IdentitiesView.tsx # Gestion des identités
│   ├── AddHabitView.tsx # Création d'habitudes
│   ├── DataManager.tsx  # Gestion export/import des données
│   └── coherence/       # Module Cohérence cardiaque (voir section dédiée)
├── database/            # Base de données et persistance
│   ├── schema.sql       # Schéma SQLite
│   ├── database.ts      # Service SQLite (serveur)
│   ├── client.ts        # Client hybride
│   └── browser-client.ts # Client navigateur (localStorage)
├── store/               # Gestion d'état Zustand
│   └── useAppStore.ts   # Store principal
├── types/               # Types TypeScript
│   └── index.ts         # Définitions de types
├── utils/               # Utilitaires
│   ├── dateUtils.ts     # Fonctions de manipulation de dates
│   ├── habitUtils.ts    # Calculs de statistiques
│   └── hrv/             # Moteurs HRV (cohérence, PPG, BLE, sessions)
├── App.tsx              # Composant racine
├── main.tsx             # Point d'entrée
└── index.css            # Styles globaux Tailwind
```

## 🔄 Flux Utilisateur

1. **Vision** → Écrire sa boussole, déclarer ses désirs (avoir / être) et le futur soi qu'ils supposent
2. **Identité** → Définir les identités qui reçoivent ces désirs : croyances + signaux (comportements quotidiens)
3. **Action** → Le matin, poser une intention ; dans la journée, cocher les signaux (preuves) ; le soir, consigner la preuve
4. **Évolution** → Relire la semaine, les verdicts, la fréquence et le monde intérieur — puis réajuster la vision

L'accueil **Mon Arc** propose à chaque ouverture la prochaine étape utile.

## 💾 Persistance des Données

### **Architecture Hybride**
- **Navigateur** : localStorage pour la persistance immédiate
- **Serveur** : SQLite pour une base de données robuste (optionnel)
- **Export/Import** : Sauvegarde JSON pour la portabilité

### **Fonctionnalités de Sauvegarde**
- ✅ **Export automatique** : Téléchargement des données en JSON
- ✅ **Import de données** : Restauration depuis un fichier de sauvegarde
- ✅ **Statistiques** : Vue d'ensemble des données stockées
- ✅ **Nettoyage** : Suppression sécurisée de toutes les données

## ❤️ Module Cohérence cardiaque — comment ça marche

Le module transforme un capteur cardiaque en **biofeedback** : il mesure la régularité de ton rythme cardiaque autour de 0.1 Hz (6 cycles/minute — la fréquence de résonance cardio-respiratoire) et la traduit en un score lisible, en temps réel.

### Les deux objectifs de session

| Objectif | Ce qui se passe | Question à laquelle il répond |
| --- | --- | --- |
| **Guidé · respiration** | Un orbe s'agrandit (inspiration) et rétrécit (expiration) au rythme choisi — 6 cycles/min par défaut, réglable de 4.5 à 7 | *Est-ce que ma respiration installe une onde régulière ?* |
| **Observation libre** | Aucun guidage : on respire naturellement et on regarde | *À quoi ressemble mon cœur quand je ne fais rien ?* |

Le choix du mode est **indépendant du capteur** (caméra, ceinture ou démo) et se verrouille pendant une session.

### Les trois capteurs

| Capteur | Principe | Disponibilité |
| --- | --- | --- |
| **Caméra (PPG)** | Photopléthysmographie : le sang absorbe davantage de lumière rouge à chaque battement. L'app échantillonne le canal rouge de la caméra, filtre le signal, détecte les pics et extrait les intervalles RR. | Partout (HTTPS requis) — **l'option iPhone** |
| **Ceinture BLE** | Ceinture pectorale (Polar H10, Garmin HRM, Wahoo TICKR…), service Bluetooth Heart Rate `0x180D`, mesure `0x2A37` (intervalles RR encodés en 1/1024 s) | Chrome / Edge (desktop, Android) — **pas Safari / iOS** |
| **Mode Démo** | Onde VRC sinusoïdale simulée (~0.1 Hz + bruit) pour tester l'interface sans capteur | Partout — **jamais enregistré** (badge « SIMULÉ · MODE DÉMO ») |

### Le score de cohérence (0–10)

Le score mesure la **régularité sinusoïdale** du rythme cardiaque :

1. Fenêtre glissante sur les **64 dernières secondes** de battements, avec leurs **instants réels** (score affiché à partir de 30 battements couvrant au moins 30 s)
2. Rééchantillonnage à 4 Hz sur l'axe du temps réel (les RR rejetés laissent des trous interpolés, pas recollés) → **detrend linéaire** → fenêtre de Hann
3. Périodogramme sur une grille fine (**zero-padding à 2048 points**, pas ≈ 0.002 Hz) : le score ne dépend plus de la position du pic sur la grille
4. Analyse de la bande **0.04–0.15 Hz** (la zone VRC, cœur à ~0.1 Hz) : détection du pic dominant
5. `ratio = puissance du pic (±0.015 Hz) / puissance du reste`, puis `score = 10 × tanh(ratio / 2.5)` — le tanh évite la saturation
6. Pas de score si la variabilité est quasi nulle (capteur figé, RR constants)
7. Lissage exponentiel (`α = 0.25`) pour un affichage stable

Le **pic (Hz)** affiché sous le score indique où bat la régularité : proche de **0.1 Hz** en cohérence respiratoire ; ailleurs quand c'est le bruit qui domine.

| Niveau | Score |
| --- | --- |
| 🔴 Faible | < 4 |
| 🟠 Moyen | 4 – 7 |
| 🟢 Élevé | ≥ 7 |

### RMSSD, SDNN, Variation — lire la variabilité

| Mesure | Ce qu'elle dit | Ordre de grandeur au repos |
| --- | --- | --- |
| **RMSSD** | Variabilité *battement à battement* — reflet du tonus parasympathique (nerf vague). La respiration lente l'augmente (arythmie sinusale respiratoire). | ~20–100 ms |
| **SDNN** | Variabilité *globale* de la période cardiaque | ~30–80 ms |
| **Variation** | Amplitude RR (max − min) sur les 60 derniers battements | ~150–400 ms |

Ces mesures sont affichées **en direct** en mode Observation libre (fenêtre des 60 derniers RR) et calculées **sur toute la session** pour l'enregistrement.

### Le garde-fou anti-mesure fantôme

Un capteur bruité (doigt qui bouge, fuite de lumière, pression) fait détecter des « battements » qui n'existent pas : on peut alors lire un RMSSD de 480 ms ou 140 BPM en étant assis tranquille. C'est **physiologiquement impossible** — le score obtenu ne mesure pas la personne.

Deux protections :

- **Au niveau du capteur caméra** (`ppgProcessor.ts`) : un intervalle RR à plus de ±25 % de la médiane récente est rejeté comme artefact. Un pic parasite (trop court) ne déplace pas le battement de référence ; un battement manqué (intervalle trop long) resynchronise la référence sans émettre d'RR.
- **Au niveau de l'application** (`assessSignalQuality`) : si la fenêtre récente présente un RMSSD > 200 ms, une amplitude > 700 ms, ou plus de 20 % d'intervalles hors plage 40–150 bpm → **« ⚠ Signal instable »** s'affiche en direct. Une session instable plus de la moitié du temps n'est **pas enregistrée** (elle aurait faussé la comparaison).

### Enregistrement et comparaison des sessions

- Une session est enregistrée si : capteur **réel** (caméra ou BLE), **≥ 30 battements**, signal **stable**
- Stockage **local** (`localStorage`, clé `vibes-arc-coherence-sessions`, 120 sessions max)
- Le panneau **Comparaison** agrège : sessions, temps total, score moyen, temps en cohérence élevée, BPM moyen, **RMSSD moyen** — colonne *Libre* vs *Guidée*, plus les 12 dernières sessions en barres (cyan = guidée, violet = libre)
- La comparaison devient parlante à partir de **~3 sessions de chaque type**, dans des conditions similaires

### Protocole de mesure (caméra)

1. **Position** : assis, dos droit, téléphone posé ou main bien calée — le bras ne doit pas bouger
2. **Doigt** : l'index **couvre tout l'objectif** (et la zone du flash) — pas de fuite de lumière, pas d'appui fort
3. **Première minute** : ne bouge plus, laisse le signal se verrouiller (si « Signal instable » s'affiche, repositionne)
4. **Test de plausibilité** : le BPM affiché doit correspondre à ce que tu ressens (assis ~60–90 bpm)
5. Session type : **3 à 5 minutes**

### En fin de session

Un bouton **« Marquer comme signal du jour »** coche (et crée au besoin) l'habitude *Cohérence Cardiaque* — jamais automatique : « coché = signal réellement émis ».

### Fichiers du module

```
src/utils/hrv/
├── coherence.ts       # Moteur de score (périodogramme zero-padé, bande VRC, tanh) — pur, sans DOM
├── sources.ts         # Interface RrSource + source simulée (Mode Démo)
├── bleHeartRate.ts    # Capteur BLE Heart Rate 0x180D / 0x2A37
├── ppgCamera.ts       # PPG caméra : capture du canal rouge, horodatage par image (requestVideoFrameCallback)
├── ppgProcessor.ts    # Détecteur de battements PPG — pur, sans DOM (passe-bande, pics interpolés, rejet des RR)
└── sessionStats.ts    # RMSSD / SDNN / qualité du signal / historique local

src/components/coherence/
├── CoherenceView.tsx  # Orchestrateur (modes, capteurs, session)
├── BreathingOrb.tsx   # Orbe respiratoire (inspire / expire)
├── CoherenceGauge.tsx # Jauge 0–10 + niveau (+ badge SIMULÉ en Démo)
├── HeartRateChart.tsx # Courbe BPM temps réel (Canvas)
└── SessionHistory.tsx # Comparaison libre vs guidée

docs/coherence-demo.html           # Démo jouable autonome
scripts/verify-coherence-demo.cjs  # Test navigateur du moteur (Playwright)
scripts/test-coherence.mjs         # Tests du calcul spectral + détecteur PPG sur signaux simulés (npm run test:coherence)
```

> `docs/coherence-demo.html` embarque sa **propre copie** du moteur de score : elle n'est pas synchronisée avec `coherence.ts`.

**Prérequis** : HTTPS pour la caméra ; Web Bluetooth (Chrome/Edge) pour la ceinture.

## 🌙 Module Monde intérieur — comment ça marche

### D'où viennent les données

| Source | Quand | Comment |
| --- | --- | --- |
| **Coffre Obsidian (direct)** | `npm run dev` sur la machine du coffre | Le serveur de développement expose `GET /api/inner-world` ([`server/innerWorldVault.ts`](server/innerWorldVault.ts)) qui lit le coffre à chaque ouverture du module |
| **Copie publiée (Supabase)** | Téléphone, version en ligne | Bouton « Publier sur mes appareils » (visible quand le coffre est lu en direct) → table `inner_world_snapshots` (une ligne par utilisateur, RLS) |
| **Cache local** | Hors-ligne | Le dernier instantané est gardé dans le navigateur |

Chemins par défaut : `~/Documents/Obsidian Vault`, sous-dossiers `Practice/Image Streaming` et `Notion/Au pays des merveilles`. Surcharge possible dans `.env.local` : `OBSIDIAN_VAULT_PATH`, `INNER_WORLD_IS_DIR`, `INNER_WORLD_DREAMS_DIR`.

Le point d'accès de développement refuse les requêtes d'un autre site et les hôtes inattendus (données intimes ; Vite 4 accepte toutes les origines en CORS). Il n'existe pas en production : le coffre reste sur ta machine.

### Règles d'analyse ([`src/utils/innerWorld/analysis.ts`](src/utils/innerWorld/analysis.ts))

- Un symbole est cherché dans un rêve par son **nom** (découpé sur « / ») et ses **alias** de `symbols.json`, **mot entier**, accents ignorés, pluriel simple accepté : « eau » ne matche plus « beaucoup », ni « mer » « merci ».
- Les **associations** de `symbols.json` ne servent pas de termes : ce sont des interprétations, pas des mots du récit.
- Garde-fous : mots-outils exclus (« Son / Auditif » ne cherche pas « son ») ; faux amis (« cour » ≠ « cours ») ; homographes verbe/nom (« il porte un manteau » n'est pas une porte).
- **Échos** : un rêve daté et une séance à **±3 jours** qui partagent un symbole. Les symboles **omniprésents** (> 75 % des séances, ex. « Noir / Ombre ») sont ignorés : ils ne disent rien d'un parallèle précis. La « spécificité » d'un écho monte quand les symboles partagés sont rares en IS.
- Les personnages, lieux et motifs des rêves qui correspondent déjà à un symbole IS (un lieu de rêve qui porte le nom d'un symbole IS, par exemple) sont signalés à part.

### Mise en place

1. Appliquer la migration [`supabase/migrations/20261116_arc_vision_inner_world.sql`](supabase/migrations/20261116_arc_vision_inner_world.sql) (tables `arc_vision` et `inner_world_snapshots`). Sans elle, la boussole reste dans le navigateur et le module ne se publie pas — tout le reste fonctionne.
2. `npm run dev` sur le Mac du coffre → **Évolution › Monde intérieur** → « Publier sur mes appareils » après chaque nouvelle séance ou nouveau rêve.

```
server/innerWorldVault.ts              # Lecture du coffre (Node, serveur de dev uniquement)
src/utils/innerWorld/frontmatter.ts    # Frontmatter Obsidian tolérant (valeurs avec « : », listes, blocs)
src/utils/innerWorld/analysis.ts       # Échos, symboles partagés, écarts, chronologie — pur, sans DOM
src/services/innerWorldService.ts      # Coffre → Supabase → cache local
src/components/innerWorld/             # Vue, panneaux, chronologie
scripts/test-inner-world.mjs           # npm run test:inner-world
```

### Moteur de preuves (Tribunal)

`buildDailyEvidence` et l'arbre des témoins lisent la progression à l'**index global du jour** (0 = 1er octobre 2025, minuit local), comme l'écrit `toggleHabitDay`, et datent les jours en heure locale. Le score d'action ne compte que les jours où au moins un signal existait déjà. Vérification : `npm run test:evidence` (rejoué dans deux fuseaux horaires).

## 🎯 Prochaines Fonctionnalités

- [x] Export/Import des données
- [ ] Graphiques de progression avec Recharts
- [x] Notifications et rappels
- [ ] Thèmes sombre/clair
- [ ] Mode hors-ligne avec PWA
- [ ] Synchronisation cloud
- [ ] Analytics avancées
- [ ] Communauté et partage

## 📄 Licence

MIT License - Voir le fichier LICENSE pour plus de détails.
