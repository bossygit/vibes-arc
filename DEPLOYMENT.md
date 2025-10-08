# 🚀 Guide de Déploiement - Vibes Arc

## Déploiement sur Vercel

### **Option 1 : Déploiement via Vercel CLI (Recommandé)**

```bash
# 1. Installer Vercel CLI (si pas déjà fait)
npm install -g vercel

# 2. Se connecter à Vercel
vercel login

# 3. Déployer depuis le dossier du projet
vercel

# 4. Pour déployer en production
vercel --prod
```

### **Option 2 : Déploiement via GitHub (Automatique)**

1. **Pousser le code sur GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Vibes Arc app"
   git branch -M main
   git remote add origin https://github.com/votre-username/vibes-arc.git
   git push -u origin main
   ```

2. **Connecter à Vercel**
   - Aller sur [vercel.com](https://vercel.com)
   - Cliquer sur "New Project"
   - Importer le repository GitHub
   - Vercel détectera automatiquement la configuration

### **Option 3 : Déploiement via Interface Vercel**

1. **Préparer le projet**
   ```bash
   npm run build
   ```

2. **Uploader le dossier `dist`**
   - Aller sur [vercel.com](https://vercel.com)
   - Cliquer sur "New Project"
   - Choisir "Browse all templates"
   - Uploader le dossier `dist`

## ⚙️ Configuration Vercel

### **Variables d'Environnement**
Aucune variable d'environnement n'est requise pour cette application.

### **Configuration Automatique**
Le fichier `vercel.json` configure automatiquement :
- ✅ Build command : `npm run vercel-build`
- ✅ Output directory : `dist`
- ✅ SPA routing (toutes les routes → index.html)
- ✅ Headers de sécurité
- ✅ Cache optimisé pour les assets statiques

## 🔧 Optimisations de Production

### **Build Optimisé**
- **Code splitting** : Vendor, UI, et utils séparés
- **Minification** : Terser pour JavaScript
- **Compression** : Gzip automatique
- **Tree shaking** : Code mort supprimé

### **Performance**
- **Lazy loading** : Composants chargés à la demande
- **Cache headers** : Assets statiques mis en cache
- **CDN** : Distribution mondiale via Vercel Edge Network

## 📊 Monitoring

### **Analytics Vercel**
- **Visiteurs** : Nombre de visiteurs uniques
- **Performance** : Core Web Vitals
- **Erreurs** : Monitoring automatique

### **Logs**
```bash
# Voir les logs en temps réel
vercel logs

# Logs d'un déploiement spécifique
vercel logs [deployment-url]
```

## 🔄 Mises à Jour

### **Déploiement Automatique**
- Chaque push sur `main` → déploiement automatique
- Pull requests → preview deployments

### **Déploiement Manuel**
```bash
# Build et déploiement
npm run build
vercel --prod
```

## 🛠️ Dépannage

### **Erreurs Communes**

**Build Failed**
```bash
# Vérifier les erreurs TypeScript
npm run build

# Nettoyer le cache
rm -rf node_modules dist
npm install
npm run build
```

**404 sur les routes**
- Vérifier que `vercel.json` est présent
- S'assurer que le SPA routing est configuré

**Assets non trouvés**
- Vérifier que le build génère le dossier `dist`
- S'assurer que les chemins sont relatifs

### **Support**
- **Documentation Vercel** : [vercel.com/docs](https://vercel.com/docs)
- **Community** : [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)

## 🎯 URLs de Déploiement

Après le déploiement, votre application sera disponible sur :
- **Production** : `https://vibes-arc.vercel.app`
- **Preview** : `https://vibes-arc-git-[branch].vercel.app`

## ✅ Checklist de Déploiement

- [ ] Code poussé sur GitHub
- [ ] Build local réussi (`npm run build`)
- [ ] Tests passent
- [ ] Variables d'environnement configurées (si nécessaire)
- [ ] Domaine personnalisé configuré (optionnel)
- [ ] Analytics activés (optionnel)
