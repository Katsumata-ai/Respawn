# 🚀 Déploiement Vercel - Guide Rapide

## Option 1 : Déploiement via Dashboard Vercel (Recommandé)

### Étapes Rapides
1. **Aller sur** : [vercel.com/new](https://vercel.com/new)
2. **Importer** ton repository GitHub
3. **Configurer** les variables d'environnement (voir ci-dessous)
4. **Déployer** !

---

## Option 2 : Déploiement via CLI Vercel

### Installation
```bash
npm install -g vercel
```

### Login
```bash
vercel login
```

### Déploiement
```bash
# 1. Depuis la racine du projet
cd /path/to/your/project

# 2. Premier déploiement (mode interactif)
vercel

# 3. Déploiement en production
vercel --prod
```

### Configuration Automatique
Le CLI va te poser ces questions :
```
? Set up and deploy "~/your-project"? [Y/n] Y
? Which scope do you want to deploy to? Your Account
? Link to existing project? [y/N] N
? What's your project's name? whop-course-downloader
? In which directory is your code located? ./
? Want to override the settings? [y/N] N
```

---

## 📝 Variables d'Environnement à Configurer

### Via Dashboard Vercel
1. Va dans **Project Settings > Environment Variables**
2. Ajoute **TOUTES** ces variables :

#### Variables Publiques
```bash
NEXT_PUBLIC_WHOP_APP_ID=app_Fgd9oq5D1HjMWJ
NEXT_PUBLIC_WHOP_AGENT_USER_ID=user_6FrzZNye05fbc
NEXT_PUBLIC_WHOP_COMPANY_ID=biz_BIBbNAbDpLMkH
NEXT_PUBLIC_WHOP_ACCESS_PASS_ID=prod_YsWPlVnkSXQpb
NEXT_PUBLIC_WHOP_PREMIUM_PLAN_ID=plan_bu3VuTZaPKTrD
NEXT_PUBLIC_SUPABASE_URL=https://wunwrjniyvkthtynmihi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1bndyam5peXZrdGh0eW5taWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NTkxMDAsImV4cCI6MjA3NzAzNTEwMH0.GXPKwLKnEdxW5Luyb1w9V9NHkiM2EB9A3wYsz7PEwlk
NEXT_PUBLIC_APP_URL=https://YOUR-APP.vercel.app
```

#### Variables Privées
```bash
WHOP_API_KEY=ojneczyAk8cG8Yc9e6IgMmkOB2mYUfo4PTcNtOejsoI
WHOP_WEBHOOK_SECRET=ws_f40502cdca20f101659660e4495446d91daa126644d0bb6b40bb3ea03cc2d582
WHOP_CLIENT_ID=app_Fgd9oq5D1HjMWJ
WHOP_CLIENT_SECRET=ojneczyAk8cG8Yc9e6IgMmkOB2mYUfo4PTcNtOejsoI
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1bndyam5peXZrdGh0eW5taWhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTQ1OTEwMCwiZXhwIjoyMDc3MDM1MTAwfQ.E-sJrw-h3wqCT0zRRLc8mGrNzBcwFa5oL61R4cVndQI
NODE_ENV=production
```

### Via CLI Vercel
```bash
# Ajouter une variable
vercel env add NEXT_PUBLIC_WHOP_APP_ID production

# Lister les variables
vercel env ls

# Supprimer une variable
vercel env rm VARIABLE_NAME production
```

---

## 🔄 Redéploiement

### Après un Changement de Code
```bash
# 1. Commit et push
git add .
git commit -m "Update: description"
git push origin main

# 2. Vercel redéploie automatiquement !
```

### Forcer un Redéploiement
```bash
# Via CLI
vercel --prod --force

# Via Dashboard
# Project > Deployments > ... > Redeploy
```

---

## 🌐 Domaine Personnalisé (Optionnel)

### Ajouter un Domaine
```bash
# Via CLI
vercel domains add your-domain.com

# Via Dashboard
# Project Settings > Domains > Add Domain
```

### Configuration DNS
Si tu as un domaine existant :
1. Ajoute un **CNAME** pointant vers `cname.vercel-dns.com`
2. Ou ajoute un **A record** pointant vers l'IP Vercel

---

## 📊 Commandes Utiles

### Voir les Logs
```bash
# Logs en temps réel
vercel logs --follow

# Logs d'un déploiement spécifique
vercel logs [deployment-url]
```

### Lister les Déploiements
```bash
vercel ls
```

### Supprimer un Déploiement
```bash
vercel rm [deployment-url]
```

### Voir les Infos du Projet
```bash
vercel inspect
```

---

## 🔍 Vérification Post-Déploiement

### 1. Vérifier le Build
```bash
# Logs du build
vercel logs --follow
```

### 2. Tester l'URL
```bash
# Ouvrir dans le navigateur
open https://YOUR-APP.vercel.app

# Ou tester avec curl
curl https://YOUR-APP.vercel.app
```

### 3. Vérifier les Variables d'Environnement
```bash
# Lister toutes les variables
vercel env ls
```

### 4. Vérifier les Fonctions Serverless
```bash
# Voir les fonctions déployées
vercel inspect
```

---

## 🐛 Debugging

### Problème : Build Failed
**Solution** :
```bash
# 1. Vérifier les logs
vercel logs

# 2. Tester le build localement
npm run build

# 3. Vérifier les dépendances
npm install
```

### Problème : Variables d'Environnement Manquantes
**Solution** :
```bash
# 1. Lister les variables
vercel env ls

# 2. Ajouter les variables manquantes
vercel env add VARIABLE_NAME production

# 3. Redéployer
vercel --prod --force
```

### Problème : 404 sur les Routes
**Solution** :
1. Vérifier que `next.config.js` est correct
2. Vérifier que les routes existent dans `app/`
3. Redéployer

---

## 📦 Structure du Projet Vercel

```
.vercel/
├── project.json          # Configuration du projet
└── README.txt           # Infos Vercel

vercel.json              # Configuration Vercel (optionnel)
```

### Exemple `vercel.json` (Optionnel)
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NODE_ENV": "production"
  }
}
```

---

## 🚀 Workflow Recommandé

### Développement
```bash
# 1. Développer localement
npm run dev

# 2. Tester le build
npm run build

# 3. Commit et push
git add .
git commit -m "Feature: description"
git push origin main

# 4. Vercel déploie automatiquement !
```

### Preview Deployments
Chaque **Pull Request** crée automatiquement un **Preview Deployment** :
- URL unique : `https://your-app-git-branch.vercel.app`
- Parfait pour tester avant de merger

---

## 🎯 Checklist Finale

Avant de déployer en production :
- [ ] `npm run build` fonctionne localement
- [ ] Toutes les variables d'environnement sont configurées
- [ ] `NODE_ENV=production` est défini
- [ ] `NEXT_PUBLIC_APP_URL` pointe vers l'URL Vercel
- [ ] Tests passent localement
- [ ] Code commité et pushé

---

## 📞 Support Vercel

- **Documentation** : [vercel.com/docs](https://vercel.com/docs)
- **Support** : [vercel.com/support](https://vercel.com/support)
- **Status** : [vercel-status.com](https://vercel-status.com)
- **Community** : [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)

---

## 🎉 C'est Tout !

Ton app est maintenant déployée sur Vercel ! 🚀

**URL de ton app** : `https://YOUR-APP.vercel.app`

Partage-la avec tes utilisateurs et commence à collecter des feedbacks ! 💪

