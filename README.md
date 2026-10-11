# Vibes Arc - Identity Tracker

Une plateforme moderne de suivi d'identités et d'habitudes pour transformer votre vie.

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
├── components/          # Composants React réutilisables
│   ├── Dashboard.tsx    # Vue principale du tableau de bord
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

1. **Landing** → Créer des identités
2. **Identités** → Ajouter des habitudes (liées aux identités)
3. **Vue quotidienne** → Cocher les habitudes accomplies
4. **Tableau de bord** → Voir les progrès et scores
5. **Vue identité** → Analyser l'intégration des habitudes

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

1. Fenêtre glissante sur les **60 derniers intervalles RR** (score affiché à partir de 30 battements)
2. Rééchantillonnage à 4 Hz → fenêtre de Hann → FFT
3. Analyse de la bande **0.04–0.15 Hz** (la zone VRC, cœur à ~0.1 Hz) : détection du pic dominant
4. `ratio = puissance du pic / puissance du reste`, puis `score = 10 × tanh(ratio / 1.35)` — le tanh évite la saturation
5. Lissage exponentiel (`α = 0.25`) pour un affichage stable

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

- **Au niveau du capteur caméra** : un intervalle RR aberrant (±45 % de la médiane récente) est rejeté comme artefact.
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
├── coherence.ts       # Moteur de score (FFT, bande VRC, tanh) — pur, sans DOM
├── sources.ts         # Interface RrSource + source simulée (Mode Démo)
├── bleHeartRate.ts    # Capteur BLE Heart Rate 0x180D / 0x2A37
├── ppgCamera.ts       # PPG caméra (canal rouge, garde anti-artefacts)
└── sessionStats.ts    # RMSSD / SDNN / qualité du signal / historique local

src/components/coherence/
├── CoherenceView.tsx  # Orchestrateur (modes, capteurs, session)
├── BreathingOrb.tsx   # Orbe respiratoire (inspire / expire)
├── CoherenceGauge.tsx # Jauge 0–10 + niveau (+ badge SIMULÉ en Démo)
├── HeartRateChart.tsx # Courbe BPM temps réel (Canvas)
└── SessionHistory.tsx # Comparaison libre vs guidée

docs/coherence-demo.html           # Démo jouable autonome
scripts/verify-coherence-demo.cjs  # Test navigateur du moteur (Playwright)
```

**Prérequis** : HTTPS pour la caméra ; Web Bluetooth (Chrome/Edge) pour la ceinture.

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
