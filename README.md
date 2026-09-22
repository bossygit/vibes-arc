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
│   └── DataManager.tsx  # Gestion export/import des données
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
│   └── habitUtils.ts    # Calculs de statistiques
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
