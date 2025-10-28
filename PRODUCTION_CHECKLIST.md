# ✅ Production Deployment Checklist

## 📋 Pré-Déploiement

### Code Status
- [x] ✅ Système Free/Premium implémenté
- [x] ✅ Limite 3 vidéos pour FREE users
- [x] ✅ Uploads illimités pour PREMIUM users
- [x] ✅ Modal paywall fonctionnel
- [x] ✅ Plan premium €10 configuré (`plan_bu3VuTZaPKTrD`)
- [x] ✅ Toutes les simulations dev supprimées du code production
- [x] ✅ API Whop intégrée pour vérification premium
- [x] ✅ Compteur temps réel fonctionnel
- [x] ✅ Message d'erreur stylisé avec CTA cliquable

### Fichiers Clés Vérifiés
- [x] ✅ `lib/whop/server.ts` - Logique premium avec fallback dev mode
- [x] ✅ `app/experiences/[experienceId]/page.tsx` - Affichage statut FREE/PREMIUM
- [x] ✅ `app/api/videos/route.ts` - Limites d'upload côté serveur
- [x] ✅ `app/views/VideoExtractor.tsx` - Gestion erreurs et événements
- [x] ✅ `app/components/PremiumUpgradeButton.tsx` - Bouton upgrade propre
- [x] ✅ `app/components/PaywallModal.tsx` - Modal avec prix €10

---

## 🚀 Déploiement Vercel

### Étape 1 : Préparer le Code
```bash
# 1. Commit final
git add .
git commit -m "Production ready: Free/Premium system with €10 plan"
git push origin main

# 2. Vérifier le build local
npm run build
```

### Étape 2 : Créer le Projet Vercel
1. [ ] Aller sur [vercel.com](https://vercel.com)
2. [ ] Cliquer "Add New Project"
3. [ ] Importer le repository GitHub
4. [ ] Configurer :
   - Framework: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`

### Étape 3 : Variables d'Environnement Vercel

#### Variables Publiques (NEXT_PUBLIC_*)
```bash
NEXT_PUBLIC_WHOP_APP_ID=app_Fgd9oq5D1HjMWJ
NEXT_PUBLIC_WHOP_AGENT_USER_ID=user_6FrzZNye05fbc
NEXT_PUBLIC_WHOP_COMPANY_ID=biz_BIBbNAbDpLMkH
NEXT_PUBLIC_WHOP_ACCESS_PASS_ID=prod_YsWPlVnkSXQpb
NEXT_PUBLIC_WHOP_PREMIUM_PLAN_ID=plan_bu3VuTZaPKTrD
NEXT_PUBLIC_SUPABASE_URL=https://wunwrjniyvkthtynmihi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=https://TON-APP.vercel.app  # ⚠️ À CHANGER
```

#### Variables Privées (Serveur uniquement)
```bash
WHOP_API_KEY=ojneczyAk8cG8Yc9e6IgMmkOB2mYUfo4PTcNtOejsoI
WHOP_WEBHOOK_SECRET=ws_f40502cdca20f101659660e4495446d91daa126644d0bb6b40bb3ea03cc2d582
WHOP_CLIENT_ID=app_Fgd9oq5D1HjMWJ
WHOP_CLIENT_SECRET=ojneczyAk8cG8Yc9e6IgMmkOB2mYUfo4PTcNtOejsoI
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NODE_ENV=production  # ⚠️ CRITIQUE
```

**⚠️ IMPORTANT** : 
- [ ] Vérifier que `NODE_ENV=production` est bien défini
- [ ] Remplacer `NEXT_PUBLIC_APP_URL` par l'URL Vercel réelle

### Étape 4 : Déployer
1. [ ] Cliquer "Deploy"
2. [ ] Attendre la fin du build (2-5 min)
3. [ ] Noter l'URL de déploiement : `https://_____.vercel.app`

---

## 🔧 Configuration Whop Dashboard

### Mettre à Jour l'App URL
1. [ ] Aller sur [whop.com/apps](https://whop.com/apps)
2. [ ] Sélectionner l'app `app_Fgd9oq5D1HjMWJ`
3. [ ] Mettre à jour :
   - **App URL** : `https://TON-APP.vercel.app`
   - **Redirect URI** : `https://TON-APP.vercel.app/api/oauth/callback`
   - **Webhook URL** : `https://TON-APP.vercel.app/api/webhooks/whop`

### Vérifier le Plan Premium
1. [ ] Aller sur [whop.com/hub/products](https://whop.com/hub/products)
2. [ ] Sélectionner Access Pass `prod_YsWPlVnkSXQpb`
3. [ ] Vérifier le plan :
   - **Plan ID** : `plan_bu3VuTZaPKTrD`
   - **Prix** : €10 (one-time)
   - **Type** : Lifetime access
   - **Statut** : Active ✅

---

## 🧪 Tests Post-Déploiement

### Test 1 : FREE User
1. [ ] Créer un nouveau compte Whop (sans membership)
2. [ ] Visiter `https://TON-APP.vercel.app`
3. [ ] Vérifier :
   - [ ] Message "Free Plan • 0/3 videos uploaded"
   - [ ] Peut uploader 3 vidéos
   - [ ] Erreur "Upload limit reached" à la 4ème
   - [ ] Lien "Upgrade to premium" cliquable
   - [ ] Modal s'ouvre avec "One-time €10 payment"

### Test 2 : Achat Premium
1. [ ] Cliquer "Upgrade Now"
2. [ ] Compléter le paiement €10
3. [ ] Vérifier :
   - [ ] Statut change à "✓ Premium Access Active"
   - [ ] Compteur "X/3" disparaît
   - [ ] Bouton "Upgrade" disparaît
   - [ ] Peut uploader plus de 3 vidéos

### Test 3 : PREMIUM User Existant
1. [ ] Se connecter avec un compte premium
2. [ ] Vérifier :
   - [ ] "✓ Premium Access Active" affiché
   - [ ] Pas de bouton "Upgrade"
   - [ ] Uploads illimités

---

## 📊 Monitoring

### Logs à Surveiller
1. [ ] **Vercel Logs** : [vercel.com/dashboard](https://vercel.com/dashboard)
   - Erreurs API Whop
   - Erreurs Supabase
   - Erreurs de paiement

2. [ ] **Supabase Logs** : [supabase.com/dashboard](https://supabase.com/dashboard)
   - Requêtes SQL
   - Erreurs d'insertion

### Métriques Clés
- [ ] **Taux de conversion** : FREE → PREMIUM
- [ ] **Uploads par user** : FREE vs PREMIUM
- [ ] **Erreurs de paiement**
- [ ] **Refunds**

---

## 🐛 Troubleshooting Rapide

### Problème : "hasPremium: false" pour un user payant
**Solution** :
1. Vérifier `WHOP_API_KEY` dans Vercel
2. Vérifier `NEXT_PUBLIC_WHOP_PREMIUM_PLAN_ID`
3. Tester l'API manuellement :
```bash
curl -X GET "https://api.whop.com/api/v5/me/memberships" \
  -H "Authorization: Bearer ojneczyAk8cG8Yc9e6IgMmkOB2mYUfo4PTcNtOejsoI"
```

### Problème : Modal ne s'ouvre pas
**Solution** :
1. Vérifier `NEXT_PUBLIC_WHOP_APP_ID`
2. Vérifier `NEXT_PUBLIC_WHOP_PREMIUM_PLAN_ID`
3. Ouvrir la console navigateur pour voir les erreurs

### Problème : Erreur 403 lors de l'upload
**Solution** :
1. Vérifier les logs Vercel
2. Vérifier que Supabase est accessible
3. Vérifier les permissions de la table `videos`

---

## ✅ Validation Finale

### Avant de Lancer
- [ ] Tous les tests passent
- [ ] Variables d'environnement configurées
- [ ] URL Whop mise à jour
- [ ] Plan premium actif
- [ ] Logs Vercel propres (pas d'erreurs)

### Après le Lancement
- [ ] Tester avec un vrai compte FREE
- [ ] Tester un achat réel €10
- [ ] Vérifier que le statut change après achat
- [ ] Surveiller les logs pendant 24h

---

## 🎉 Prêt pour la Production !

Une fois tous les items cochés, ton app est **100% prête** pour la production ! 🚀

**Prochaines étapes** :
1. Partager le lien avec tes premiers utilisateurs
2. Collecter les feedbacks
3. Surveiller les métriques
4. Itérer et améliorer

---

## 📞 Support

- **Vercel** : [vercel.com/support](https://vercel.com/support)
- **Whop** : [whop.com/support](https://whop.com/support)
- **Supabase** : [supabase.com/support](https://supabase.com/support)
- **Docs Whop** : [docs.whop.com](https://docs.whop.com)

