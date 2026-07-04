# 🤖 API Coach Virtuel - Documentation

API REST pour permettre à un agent n8n (coach virtuel) d'accéder aux données d'habitudes et de générer des messages de motivation personnalisés.

## 🔐 Authentification

L'API utilise une **clé API** pour sécuriser l'accès. Tu peux l'envoyer de deux façons :

### Option 1 : Header HTTP (recommandé)
```
X-API-Key: ta-clé-api-secrète
```

### Option 2 : Query parameter
```
?api_key=ta-clé-api-secrète
```

## 📍 Base URL

```
https://knpvbwlfdriavrebvzdy.supabase.co/functions/v1/coach-api
```

## 🎯 Endpoints disponibles

### 1. GET `/habits` - Liste complète des habitudes

Récupère toutes les habitudes avec leur progression détaillée.

**Paramètres requis :**
- `user_id` (query) : ID de l'utilisateur Supabase

**Exemple de requête :**
```bash
curl -X GET \
  "https://knpvbwlfdriavrebvzdy.supabase.co/functions/v1/coach-api/habits?user_id=USER_UUID" \
  -H "X-API-Key: ta-clé-api"
```

**Réponse :**
```json
{
  "habits": [
    {
      "id": 1,
      "name": "Méditation quotidienne",
      "type": "start",
      "totalDays": 92,
      "progress": [true, true, false, true, ...],
      "currentStreak": 5,
      "completionRate": 78.3,
      "linkedIdentities": ["Homme zen", "Créateur inspiré"],
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### 2. GET `/stats` - Statistiques globales

Récupère les statistiques d'ensemble de l'utilisateur.

**Paramètres requis :**
- `user_id` (query) : ID de l'utilisateur Supabase

**Exemple de requête :**
```bash
curl -X GET \
  "https://knpvbwlfdriavrebvzdy.supabase.co/functions/v1/coach-api/stats?user_id=USER_UUID" \
  -H "X-API-Key: ta-clé-api"
```

**Réponse :**
```json
{
  "stats": {
    "totalHabits": 8,
    "activeHabits": 8,
    "totalProgress": 156,
    "overallCompletionRate": 68.4,
    "identities": [
      {
        "id": 1,
        "name": "Homme discipliné",
        "description": "Maître de mon temps et de mes actions"
      }
    ]
  }
}
```

---

### 3. GET `/today` - Habitudes du jour

Récupère l'état des habitudes pour aujourd'hui (dernière case de chaque habitude).

**Paramètres requis :**
- `user_id` (query) : ID de l'utilisateur Supabase

**Exemple de requête :**
```bash
curl -X GET \
  "https://knpvbwlfdriavrebvzdy.supabase.co/functions/v1/coach-api/today?user_id=USER_UUID" \
  -H "X-API-Key: ta-clé-api"
```

**Réponse :**
```json
{
  "today": {
    "date": "2024-11-17",
    "habitsTotal": 8,
    "habitsCompleted": 5,
    "completionRate": 62.5,
    "todayHabits": [
      {
        "id": 1,
        "name": "Méditation quotidienne",
        "type": "start",
        "completed": true
      },
      {
        "id": 2,
        "name": "Éviter les réseaux sociaux",
        "type": "stop",
        "completed": false
      }
    ]
  }
}
```

---

### 4. GET `/motivation` - Message de motivation personnalisé

Génère un message de motivation intelligent basé sur les progrès de l'utilisateur.

**Paramètres requis :**
- `user_id` (query) : ID de l'utilisateur Supabase

**Exemple de requête :**
```bash
curl -X GET \
  "https://knpvbwlfdriavrebvzdy.supabase.co/functions/v1/coach-api/motivation?user_id=USER_UUID" \
  -H "X-API-Key: ta-clé-api"
```

**Réponse :**
```json
{
  "message": "🌟 Vibes Arc Coach\n\n☀️ Bonjour ! Excellent travail ! Tu es à 62.5% aujourd'hui. Continue comme ça ! 💪\n\n📋 Habitudes du jour :\n✅ Méditation quotidienne\n🛑 Éviter les réseaux sociaux\n\n🔥 Tes meilleures séries :\n• Lecture quotidienne: 12 jours 🔥\n• Sport matinal: 8 jours 🔥\n\n💭 'Le succès est la somme de petits efforts répétés jour après jour.' - Robert Collier",
  "stats": {
    "completionRate": 62.5,
    "habitsCompleted": 5,
    "habitsTotal": 8,
    "topStreaks": [
      { "name": "Lecture quotidienne", "streak": 12 },
      { "name": "Sport matinal", "streak": 8 }
    ]
  }
}
```

---

## 🔧 Configuration dans Supabase

### 1. Définir la clé API

```bash
supabase secrets set COACH_API_KEY="ton-secret-ultra-sécurisé-$(openssl rand -hex 32)"
```

### 2. Déployer la fonction

```bash
supabase functions deploy coach-api
```

---

## 🤖 Intégration n8n

### Workflow suggéré pour le coach Telegram

```
1. [Cron Trigger] → Tous les jours à 8h00
   ↓
2. [HTTP Request] → GET /motivation
   - URL: https://...supabase.co/functions/v1/coach-api/motivation?user_id=USER_UUID
   - Headers: X-API-Key: ta-clé-api
   ↓
3. [Telegram] → Envoyer le message
   - Chat ID: 7703388828
   - Message: {{ $json.message }}
```

### Exemple de workflow interactif

```
1. [Telegram Trigger] → Commandes du bot
   ↓
2. [Switch] → Selon la commande
   ├─ /stats → GET /stats → Envoyer les statistiques
   ├─ /today → GET /today → Envoyer l'état du jour
   ├─ /habits → GET /habits → Lister les habitudes
   └─ /motivation → GET /motivation → Message motivant
```

---

## 🎨 Exemples de commandes Telegram pour ton coach

### Commandes de base
- `/start` - Démarrer le coaching
- `/today` - État du jour
- `/stats` - Mes statistiques
- `/motivation` - Message motivant
- `/habits` - Liste de mes habitudes

### Rappels automatiques
- **Matin (8h)** : Message de motivation du jour
- **Soir (20h)** : Rappel des habitudes non complétées
- **Dimanche (18h)** : Bilan de la semaine

---

## 🔒 Sécurité

- ✅ Authentification par API key
- ✅ CORS configuré
- ✅ Accès isolé par utilisateur (user_id requis)
- ✅ Service role key Supabase côté serveur uniquement
- ⚠️ **Ne jamais exposer ta clé API** publiquement

---

## 📊 Données exposées

L'API donne accès aux données suivantes :
- ✅ Habitudes et leur progression
- ✅ Identités liées
- ✅ Statistiques de complétion
- ✅ Séries (streaks) actuelles
- ❌ Pas d'accès aux données sensibles (email, password)

---

## 🚀 Pour aller plus loin

### Idées d'améliorations pour ton agent n8n

1. **Analyse intelligente** : Détecter les habitudes en difficulté et suggérer des ajustements
2. **Prédiction** : Prédire les jours où tu risques de décrocher
3. **Récompenses automatiques** : Célébrer les milestones (7, 30, 90 jours)
4. **Rappels contextuels** : Selon l'heure de la journée
5. **Rapport hebdomadaire** : Bilan et objectifs pour la semaine suivante

### Webhook pour événements en temps réel

Tu pourrais aussi ajouter un webhook pour que l'app notifie n8n quand :
- Une habitude est complétée ✅
- Un nouveau record de streak est atteint 🔥
- Un challenge est terminé 🏆

---

## 🆕 Endpoints coaching (Telegram bot)

### GET `/review-context` — Contexte agrégé pour revues

**Paramètres :**
- `user_id` (query) : ID utilisateur Supabase
- `period` (query) : `daily` | `weekly` | `monthly` | `quarterly` | `midyear` | `yearly`

**Réponse :** snapshot période, analytics habitudes, stats, profile, insights, psychology.

### GET/POST `/psychology` — Sync modules psychologie

POST body : `{ "module_type": "inner_child|priming|...", "data": {...} }`

### GET/POST `/knowledge-graph` — Graphe de connaissances

POST body : `{ "patterns": [{ source_type, source_id, target_type, target_id, relationship, strength, evidence }] }`

---

## 📝 Notes

- Les données sont en temps réel depuis Supabase
- Le format JSON est compatible avec tous les outils no-code
- Tu peux ajouter d'autres endpoints selon tes besoins



HTTP Header Auth (pour l'API Coach)
Name: Coach API Key
Header: X-API-Key
Value: f0b95ce832383809116f190cbcb51c369e1dcd563ef89398f7a561dbec4809dc


TELEGRAM_BOT_TOKEN="8213551832:AAE-Ru93xbtJXnrgGVSvdUdAIhGAr3Uoij8"

