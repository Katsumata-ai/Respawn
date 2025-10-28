# 🚀 Guide de Déploiement Production - Whop App

## ✅ Checklist Pré-Déploiement

### 1. **Code Production Ready**
- ✅ Toutes les simulations dev supprimées
- ✅ Plan premium €10 configuré (`plan_bu3VuTZaPKTrD`)
- ✅ Plan debug gratuit supprimé
- ✅ Système Free/Premium fonctionnel
- ✅ Limites d'upload appliquées côté serveur
- ✅ API Whop intégrée pour vérification premium

### 2. **Variables d'Environnement**
Vérifie que toutes les variables sont correctement configurées dans `.env.local` :

```bash
# Whop Configuration
NEXT_PUBLIC_WHOP_APP_ID=app_Fgd9oq5D1HjMWJ
NEXT_PUBLIC_WHOP_AGENT_USER_ID=user_6FrzZNye05fbc
NEXT_PUBLIC_WHOP_COMPANY_ID=biz_BIBbNAbDpLMkH
NEXT_PUBLIC_WHOP_ACCESS_PASS_ID=prod_YsWPlVnkSXQpb

# Premium plan (€10 one-time payment)
NEXT_PUBLIC_WHOP_PREMIUM_PLAN_ID=plan_bu3VuTZaPKTrD

# Whop API Keys
WHOP_API_KEY=ojneczyAk8cG8Yc9e6IgMmkOB2mYUfo4PTcNtOejsoI
WHOP_WEBHOOK_SECRET=ws_f40502cdca20f101659660e4495446d91daa126644d0bb6b40bb3ea03cc2d582
WHOP_CLIENT_ID=app_Fgd9oq5D1HjMWJ
WHOP_CLIENT_SECRET=ojneczyAk8cG8Yc9e6IgMmkOB2mYUfo4PTcNtOejsoI

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://wunwrjniyvkthtynmihi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App Configuration
NEXT_PUBLIC_APP_URL=https://ton-app.vercel.app  # ⚠️ À CHANGER
NODE_ENV=production  # ⚠️ IMPORTANT
```

---

## 📦 Déploiement sur Vercel

### **Étape 1 : Préparer le Repository**

1. **Commit tous les changements** :
```bash
git add .
git commit -m "Production ready: Free/Premium system with €10 plan"
git push origin main
```

2. **Vérifier que le build fonctionne localement** :
```bash
npm run build
```

### **Étape 2 : Créer un Projet Vercel**

1. Va sur [vercel.com](https://vercel.com)
2. Clique sur "Add New Project"
3. Importe ton repository GitHub
4. Configure le projet :
   - **Framework Preset** : Next.js
   - **Root Directory** : `./` (racine)
   - **Build Command** : `npm run build`
   - **Output Directory** : `.next`

### **Étape 3 : Configurer les Variables d'Environnement**

Dans les settings Vercel, ajoute **TOUTES** les variables d'environnement :

#### **Variables Publiques** (accessibles côté client) :
```
NEXT_PUBLIC_WHOP_APP_ID=app_Fgd9oq5D1HjMWJ
NEXT_PUBLIC_WHOP_AGENT_USER_ID=user_6FrzZNye05fbc
NEXT_PUBLIC_WHOP_COMPANY_ID=biz_BIBbNAbDpLMkH
NEXT_PUBLIC_WHOP_ACCESS_PASS_ID=prod_YsWPlVnkSXQpb
NEXT_PUBLIC_WHOP_PREMIUM_PLAN_ID=plan_bu3VuTZaPKTrD
NEXT_PUBLIC_SUPABASE_URL=https://wunwrjniyvkthtynmihi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=https://ton-app.vercel.app
```

#### **Variables Privées** (côté serveur uniquement) :
```
WHOP_API_KEY=ojneczyAk8cG8Yc9e6IgMmkOB2mYUfo4PTcNtOejsoI
WHOP_WEBHOOK_SECRET=ws_f40502cdca20f101659660e4495446d91daa126644d0bb6b40bb3ea03cc2d582
WHOP_CLIENT_ID=app_Fgd9oq5D1HjMWJ
WHOP_CLIENT_SECRET=ojneczyAk8cG8Yc9e6IgMmkOB2mYUfo4PTcNtOejsoI
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NODE_ENV=production
```

⚠️ **IMPORTANT** : Assure-toi que `NODE_ENV=production` est bien défini !

### **Étape 4 : Déployer**

1. Clique sur "Deploy"
2. Attends que le build se termine (2-5 minutes)
3. Une fois déployé, tu recevras une URL : `https://ton-app.vercel.app`

### **Étape 5 : Mettre à Jour l'URL dans Whop**

1. Va dans ton dashboard Whop : [https://whop.com/apps](https://whop.com/apps)
2. Sélectionne ton app (`app_Fgd9oq5D1HjMWJ`)
3. Dans les settings, mets à jour :
   - **App URL** : `https://ton-app.vercel.app`
   - **Redirect URI** : `https://ton-app.vercel.app/api/oauth/callback`
   - **Webhook URL** : `https://ton-app.vercel.app/api/webhooks/whop`

---

## 🧪 Tests Post-Déploiement

### **Test 1 : Utilisateur FREE**

1. **Créer un nouveau compte Whop** (ou utiliser un compte sans membership)
2. **Visiter l'app** : `https://ton-app.vercel.app`
3. **Vérifier** :
   - ✅ Message "Free Plan • 0/3 videos uploaded"
   - ✅ Peut uploader 3 vidéos
   - ✅ Erreur "Upload limit reached" à la 4ème vidéo
   - ✅ Lien "Upgrade to premium" cliquable
   - ✅ Modal paywall s'ouvre avec "One-time €10 payment"

### **Test 2 : Achat Premium**

1. **Cliquer sur "Upgrade Now"** dans le modal
2. **Compléter le paiement** (€10)
3. **Vérifier** :
   - ✅ Statut change à "✓ Premium Access Active"
   - ✅ Compteur "X/3" disparaît
   - ✅ Bouton "Upgrade" disparaît du header
   - ✅ Peut uploader plus de 3 vidéos

### **Test 3 : Utilisateur PREMIUM existant**

1. **Se connecter avec un compte qui a déjà acheté**
2. **Vérifier** :
   - ✅ "✓ Premium Access Active" affiché
   - ✅ Pas de bouton "Upgrade"
   - ✅ Uploads illimités

---

## 🔧 Configuration Whop Dashboard

### **1. Configurer le Plan Premium**

1. Va dans [Whop Dashboard > Products](https://whop.com/hub/products)
2. Sélectionne ton Access Pass (`prod_YsWPlVnkSXQpb`)
3. Vérifie le plan premium :
   - **Plan ID** : `plan_bu3VuTZaPKTrD`
   - **Prix** : €10 (one-time payment)
   - **Type** : Lifetime access
4. **Active le plan** si ce n'est pas déjà fait

### **2. Configurer les Webhooks** (Optionnel mais recommandé)

Les webhooks permettent de recevoir des notifications en temps réel quand :
- Un utilisateur achète le plan premium
- Un utilisateur demande un refund
- Une membership expire

**Configuration** :
1. Va dans [Whop Dashboard > Developers > Webhooks](https://whop.com/hub/developers/webhooks)
2. Ajoute un nouveau webhook :
   - **URL** : `https://ton-app.vercel.app/api/webhooks/whop`
   - **Events** : 
     - `membership.created`
     - `membership.updated`
     - `membership.deleted`
     - `payment.succeeded`
     - `payment.refunded`
3. **Copie le Webhook Secret** et ajoute-le dans Vercel :
   ```
   WHOP_WEBHOOK_SECRET=ws_...
   ```

---

## 🔒 Sécurité

### **Vérifications de Sécurité**

✅ **API Keys** :
- ❌ Jamais exposées côté client
- ✅ Stockées dans les variables d'environnement Vercel
- ✅ Utilisées uniquement côté serveur

✅ **Vérification Premium** :
- ✅ Faite côté serveur (`checkUserHasPremiumAccess()`)
- ✅ Impossible de contourner côté client
- ✅ Vérifie l'API Whop en temps réel

✅ **Limites d'Upload** :
- ✅ Appliquées côté serveur dans `/api/videos`
- ✅ Compte les vidéos dans Supabase
- ✅ Bloque l'upload si limite atteinte

---

## 📊 Monitoring

### **Logs Vercel**

1. Va dans [Vercel Dashboard > Logs](https://vercel.com/dashboard)
2. Sélectionne ton projet
3. Surveille les logs pour :
   - Erreurs d'API Whop
   - Erreurs de base de données Supabase
   - Erreurs de paiement

### **Métriques à Surveiller**

- **Taux de conversion** : FREE → PREMIUM
- **Nombre d'uploads** : Par utilisateur FREE vs PREMIUM
- **Erreurs de paiement** : Paiements échoués
- **Refunds** : Demandes de remboursement

---

## 🐛 Troubleshooting

### **Problème 1 : "hasPremium: false" pour un utilisateur payant**

**Cause** : L'API Whop ne retourne pas la membership

**Solution** :
1. Vérifie que `WHOP_API_KEY` est correct dans Vercel
2. Vérifie que `NEXT_PUBLIC_WHOP_PREMIUM_PLAN_ID` correspond au bon plan
3. Vérifie les logs Vercel pour voir la réponse de l'API Whop
4. Teste l'endpoint manuellement :
```bash
curl -X GET "https://api.whop.com/api/v5/me/memberships" \
  -H "Authorization: Bearer YOUR_WHOP_API_KEY"
```

### **Problème 2 : Modal de paiement ne s'ouvre pas**

**Cause** : iFrame SDK non initialisé ou plan ID incorrect

**Solution** :
1. Vérifie que `NEXT_PUBLIC_WHOP_APP_ID` est correct
2. Vérifie que `NEXT_PUBLIC_WHOP_PREMIUM_PLAN_ID` est correct
3. Ouvre la console du navigateur pour voir les erreurs
4. Vérifie que `WhopIframeSdkProvider` est bien monté dans le layout

### **Problème 3 : Erreur 403 lors de l'upload**

**Cause** : Limite d'upload atteinte ou vérification premium échouée

**Solution** :
1. Vérifie les logs Vercel pour voir l'erreur exacte
2. Vérifie que Supabase est accessible
3. Vérifie que la table `videos` existe et a les bonnes permissions

---

## 🎉 C'est Prêt !

Ton app est maintenant en production ! 🚀

**Prochaines étapes** :
1. ✅ Partage le lien de ton app avec tes premiers utilisateurs
2. ✅ Surveille les logs et métriques
3. ✅ Collecte les feedbacks
4. ✅ Itère et améliore !

---

## 📞 Support

Si tu rencontres des problèmes :
1. **Vérifie les logs Vercel** : [vercel.com/dashboard](https://vercel.com/dashboard)
2. **Vérifie les logs Supabase** : [supabase.com/dashboard](https://supabase.com/dashboard)
3. **Contacte le support Whop** : [whop.com/support](https://whop.com/support)
4. **Documentation Whop** : [docs.whop.com](https://docs.whop.com)

