# 🤖 Configuration n8n avec Groq AI - Guide Complet

Ce guide te permet de configurer ton coach virtuel IA sur n8n avec Groq (gratuit et ultra-rapide).

---

## 📋 Prérequis

- ✅ Compte n8n (cloud ou self-hosted)
- ✅ Bot Telegram créé avec @BotFather
- ✅ API Key Groq : `gsk_xxx...` (ta clé API Groq personnelle)
- ✅ API Key Coach : `f0b95ce832383809116f190cbcb51c369e1dcd563ef89398f7a561dbec4809dc`
- ✅ Ton User ID Supabase (voir ci-dessous)

---

## 🆔 Étape 1 : Récupérer ton User ID Supabase

### Option A : Depuis l'app web

1. Ouvre ton app : https://app-lvdllqx0p-kitutupros-projects.vercel.app
2. Ouvre la console (F12)
3. Colle ce code :

```javascript
const client = await import('./src/database/supabase-client.ts');
const user = await client.default.getInstance().getCurrentUser();
console.log('Mon User ID:', user.id);
```

4. Copie l'UUID affiché

### Option B : Depuis le Dashboard Supabase

1. Va sur https://supabase.com/dashboard/project/knpvbwlfdriavrebvzdy
2. Clique sur **Authentication** > **Users**
3. Trouve ton email et copie l'UUID

---

## 🔧 Étape 2 : Configuration des Credentials dans n8n

### 1. Groq API (compatible OpenAI)

1. Dans n8n, va dans **Settings** > **Credentials**
2. Clique sur **Add Credential**
3. Cherche et sélectionne **OpenAI**
4. Configure :
   - **Name** : `Groq API`
   - **API Key** : Ta clé API Groq (commence par `gsk_`)
5. Sauvegarde

### 2. Coach API Key (HTTP Header Auth)

1. **Add Credential** > **HTTP Header Auth**
2. Configure :
   - **Name** : `Coach API Key`
   - **Header Name** : `X-API-Key`
   - **Header Value** : `f0b95ce832383809116f190cbcb51c369e1dcd563ef89398f7a561dbec4809dc`
3. Sauvegarde

### 3. Telegram Bot

1. **Add Credential** > **Telegram API**
2. Configure :
   - **Name** : `Telegram Bot`
   - **Access Token** : Le token de ton bot (@BotFather)
3. Sauvegarde

---

## 📥 Étape 3 : Importer le Workflow

1. Dans n8n, clique sur **Add workflow** > **Import from File**
2. Sélectionne le fichier : `n8n-coach-ai-workflow.json`
3. Le workflow est importé avec tous les nodes

---

## ✏️ Étape 4 : Personnaliser le Workflow

### Remplacer `TON_USER_ID` partout

Dans chaque node **HTTP Request** (il y en a 7), remplace :
- `TON_USER_ID` par ton vrai User ID UUID

**Nodes à modifier :**
1. `Récupérer stats`
2. `Récupérer habitudes du jour`
3. `Récupérer habitudes complètes`
4. `Vérifier état du soir`
5. `Récupérer habitudes pour analyse`
6. `Récupérer stats (cmd)`
7. `Récupérer today (cmd)`
8. `Récupérer motivation (cmd)`

### Vérifier les Credentials

Assure-toi que chaque node utilise le bon credential :
- **HTTP Request** → `Coach API Key`
- **Chat Model (OpenAI)** → `Groq API`
- **Telegram** → `Telegram Bot`

---

## 🧪 Étape 5 : Tester le Workflow

### Test manuel du node Groq

1. Clique sur le node **Groq - Message du matin**
2. Clique sur **Execute node**
3. Vérifie que tu reçois une réponse de l'IA

### Test des commandes Telegram

1. Active le workflow (bouton **Active** en haut à droite)
2. Envoie `/help` à ton bot Telegram
3. Tu devrais recevoir la liste des commandes

### Test des rappels automatiques

Les rappels se déclenchent automatiquement :
- **8h** : Message de motivation du matin (généré par l'IA)
- **20h** : Rappel du soir si habitudes incomplètes

Pour tester immédiatement, change temporairement l'heure dans le Cron :
- Change `0 8 * * *` en `* * * * *` (toutes les minutes)
- Teste
- Remets `0 8 * * *`

---

## 🎯 Fonctionnalités du Coach IA

### 📨 Rappels Automatiques

#### Message du matin (8h)
- Analyse tes stats, habitudes et progrès
- Génère un message motivant personnalisé par l'IA Groq
- Met en avant tes forces et te guide sur tes habitudes du jour
- Utilise tes identités pour renforcer ton engagement

#### Rappel du soir (20h)
- Vérifie si tu as complété toutes tes habitudes
- Si non : envoie un rappel bienveillant généré par l'IA
- Liste les habitudes restantes
- T'encourage à terminer la journée en beauté

### 💬 Commandes Interactives

**`/stats`** - Tes statistiques
- Nombre d'habitudes actives
- Progression totale
- Taux de réussite global
- Liste de tes identités

**`/today`** - État du jour
- Habitudes complétées vs totales
- Taux de complétion
- Liste avec checkboxes visuelles

**`/motivation`** - Message motivant
- Utilise l'API Coach
- Message pré-généré avec citation

**`/analyse`** - Analyse IA approfondie ⭐
- L'IA analyse TOUTES tes habitudes
- Identifie les patterns de comportement
- Donne des insights psychologiques
- Recommandations personnalisées concrètes
- Conseils pour améliorer ta constance

**`/help`** - Aide
- Liste toutes les commandes disponibles

---

## 🧠 Configuration de l'IA Groq

### Modèle utilisé
- **`llama-3.3-70b-versatile`** : Le meilleur modèle de Groq
  - Ultra rapide (réponse en 1-2 secondes)
  - Gratuit (pas de limite stricte)
  - Excellent en français
  - Très bon pour l'analyse et la génération de texte

### Paramètres d'IA

**Message du matin :**
- Temperature : `0.8` (créatif et varié)
- Max tokens : `500` (message moyen)
- Prompt : Coach bienveillant et motivant

**Rappel du soir :**
- Temperature : `0.7` (un peu moins créatif)
- Max tokens : `300` (message court)
- Prompt : Rappel doux et encourageant

**Analyse approfondie :**
- Temperature : `0.6` (plus factuel)
- Max tokens : `800` (analyse longue)
- Prompt : Expert en psychologie des habitudes

---

## 🎨 Personnalisation Avancée

### Modifier le ton de l'IA

Dans chaque node Groq, tu peux modifier le **system prompt** :

```
Tu es un coach personnel expert...
```

**Exemples de variations :**
- Coach strict : "Tu es direct et exigeant..."
- Coach zen : "Tu es calme et philosophique..."
- Coach fun : "Tu es enthousiaste et utilises beaucoup d'emojis..."

### Ajouter d'autres rappels

Tu peux dupliquer le flow du matin/soir et créer :
- Rappel à midi
- Rapport hebdomadaire le dimanche
- Célébration des milestones

### Créer une conversation naturelle

Tu peux ajouter un node qui :
1. Capte les messages NON-commandes
2. Les envoie à Groq avec tout le contexte de tes habitudes
3. Groq répond de façon conversationnelle

---

## 🔍 Debugging

### L'IA ne répond pas
- Vérifie que le credential **Groq API** est bien configuré
- Teste manuellement le node Groq
- Vérifie les logs d'exécution n8n

### Les données sont vides
- Vérifie que `TON_USER_ID` est correct dans TOUS les HTTP Request
- Teste l'API directement avec `test-coach-api.sh`
- Vérifie que tu as bien des habitudes dans ton app

### Pas de message sur Telegram
- Vérifie que le bot Telegram a les bonnes permissions
- Assure-toi d'avoir démarré une conversation avec ton bot
- Vérifie le Chat ID (7703388828)

---

## 💡 Idées d'Amélioration

### 1. Analyse prédictive
Groq peut prédire quels jours tu risques de décrocher et t'envoyer un boost préventif.

### 2. Insights hebdomadaires
Chaque dimanche, une analyse complète de ta semaine avec comparaison vs semaine précédente.

### 3. Détection de burn-out
Si trop d'habitudes échouent consécutivement, l'IA te propose de réduire temporairement.

### 4. Coach contextuel
L'IA adapte ses messages selon :
- Météo (API météo)
- Jour de la semaine
- Événements du calendrier

### 5. Gamification IA
L'IA invente des mini-challenges personnalisés basés sur tes patterns.

---

## 📊 Limites de Groq (gratuit)

- **Rate limit** : ~30 requêtes/minute (largement suffisant)
- **Context window** : 128k tokens (énorme, pas de souci)
- **Pas de fonctions** : Mais pas nécessaire ici
- **Uptime** : Très bon, mais service gratuit donc pas de SLA

Si Groq devient lent, tu peux :
1. Réduire `maxTokens`
2. Utiliser `llama-3.1-8b-instant` (plus petit mais plus rapide)

---

## ✅ Checklist de Configuration

- [ ] Récupéré mon User ID Supabase
- [ ] Créé le credential **Groq API** dans n8n
- [ ] Créé le credential **Coach API Key** dans n8n
- [ ] Créé le credential **Telegram Bot** dans n8n
- [ ] Importé le workflow `n8n-coach-ai-workflow.json`
- [ ] Remplacé `TON_USER_ID` dans les 8 nodes HTTP Request
- [ ] Vérifié que tous les nodes ont les bons credentials
- [ ] Testé manuellement un node Groq
- [ ] Activé le workflow
- [ ] Testé `/help` sur Telegram
- [ ] Testé `/analyse` pour voir l'IA en action

---

## 🎉 C'est parti !

Une fois tout configuré, ton coach IA va :
- ✅ T'envoyer un message motivant chaque matin à 8h
- ✅ Te rappeler le soir à 20h si tu as oublié des habitudes
- ✅ Répondre à tes commandes instantanément
- ✅ Analyser tes habitudes en profondeur sur demande
- ✅ S'adapter à tes progrès et te challenger

**Profite de ton coach IA gratuit, ultra-rapide et personnalisé ! 🚀**

