# Configuration Supabase pour Vibes Arc

Ce guide vous explique comment configurer Supabase pour synchroniser vos données entre différents navigateurs.

## 1. Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un compte ou connectez-vous
3. Cliquez sur "New Project"
4. Choisissez votre organisation
5. Donnez un nom à votre projet (ex: "vibes-arc")
6. Créez un mot de passe fort pour la base de données
7. Choisissez une région proche de vous
8. Cliquez sur "Create new project"

## 2. Configurer la base de données

1. Dans votre projet Supabase, allez dans l'onglet "SQL Editor"
2. Copiez le contenu du fichier `supabase-schema.sql`
3. Collez-le dans l'éditeur SQL
4. Cliquez sur "Run" pour exécuter le script

## 3. Récupérer les clés API

1. Dans votre projet Supabase, allez dans l'onglet "Settings" > "API"
2. Copiez l'URL du projet (Project URL)
3. Copiez la clé anonyme (anon public)

## 4. Configurer les variables d'environnement

1. Créez un fichier `.env.local` à la racine de votre projet
2. Ajoutez vos clés Supabase :

```env
VITE_SUPABASE_URL="https://votre-projet.supabase.co"
VITE_SUPABASE_ANON_KEY="votre-clé-anonyme-supabase"
```

## 5. Tester la configuration

1. Lancez votre application : `npm run dev`
2. Vous devriez voir l'écran de connexion
3. Créez un compte avec votre email
4. Vérifiez que vous pouvez créer des identités et des habitudes

## 6. Synchronisation entre navigateurs

Maintenant, vos données sont stockées dans Supabase et synchronisées automatiquement :

- **Chrome** : Connectez-vous avec le même email
- **Firefox** : Connectez-vous avec le même email  
- **Safari** : Connectez-vous avec le même email
- **Mobile** : Utilisez la même URL et le même compte

Toutes vos données seront synchronisées en temps réel !

## 7. Déploiement sur Vercel

1. Ajoutez vos variables d'environnement dans Vercel :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

2. Déployez votre application :
   ```bash
   npm run deploy
   ```

## 8. Migration des données existantes

Si vous avez des données dans localStorage, vous pouvez les exporter/importer :

1. Dans l'ancienne version, exportez vos données
2. Dans la nouvelle version avec Supabase, importez vos données

## 9. Activer les notifications Telegram / WhatsApp

1. **Installer le CLI Supabase** (si nécessaire)
   ```bash
   npm install -g supabase
   ```
2. **Déployer la fonction Edge**
   ```bash
   supabase functions deploy send-notifications
   ```
3. **Définir les secrets nécessaires**
   ```bash
   supabase secrets set TELEGRAM_BOT_TOKEN="xxxx"
   supabase secrets set NOTIFICATIONS_APP_URL="https://votre-domaine"
   # WhatsApp (optionnel)
   supabase secrets set TWILIO_ACCOUNT_SID="ACxxxx"
   supabase secrets set TWILIO_AUTH_TOKEN="xxxx"
   supabase secrets set TWILIO_WHATSAPP_FROM="+1415xxxx"
   ```
4. **Relancer l'app** puis configurer les canaux depuis `Paramètres > Notifications`.

## Sécurité

- Les données sont protégées par Row Level Security (RLS)
- Chaque utilisateur ne peut voir que ses propres données
- L'authentification est gérée par Supabase Auth
- Les mots de passe sont hashés automatiquement

## Support

Si vous rencontrez des problèmes :
1. Vérifiez que vos variables d'environnement sont correctes
2. Vérifiez que le schéma SQL a été exécuté
3. Consultez les logs de la console du navigateur
4. Vérifiez les logs de Supabase dans l'onglet "Logs"
