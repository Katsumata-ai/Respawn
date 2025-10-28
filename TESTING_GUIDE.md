# Guide de Test Complet - Système de Limites & Paywall Whop

## 🎯 Objectif
Tester le système de limites utilisateurs et l'intégration Whop de bout en bout.

## 📋 Prérequis

- ✅ Migrations Supabase appliquées
- ✅ Variables d'environnement configurées
- ✅ Webhook Whop implémenté
- ✅ Build réussi

## 🧪 Phase 1: Test Local (Sans Paiement)

### 1.1 Démarrer l'App Localement

```bash
cd /Users/amenefzi/Projects/WhopApp1
npm run dev
```

Visitez: http://localhost:3000

### 1.2 Tester le Design Cohérent

**Vérifier:**
- [ ] HomePage affiche correctement
- [ ] Couleurs cohérentes: `#161616` (bg), `#FF8102` (orange)
- [ ] Bouton "Upgrade" visible en haut à droite
- [ ] Watch page a le même design que HomePage

### 1.3 Tester le Paywall Modal

**Cliquer sur "Upgrade":**
- [ ] Modal paywall s'affiche
- [ ] Titre: "Upgrade to Premium"
- [ ] Description: "Unlock unlimited cloud uploads..."
- [ ] Liste des features affichée
- [ ] Boutons "Cancel" et "Upgrade Now" visibles
- [ ] Design cohérent avec l'app

### 1.4 Tester les Limites (Sans Paiement)

**Vérifier dans la console:**
```bash
# Ouvrir DevTools (F12)
# Aller dans Console
# Vérifier qu'il n'y a pas d'erreurs
```

## 🧪 Phase 2: Test avec ngrok (Webhook Local)

### 2.1 Installer ngrok

```bash
# macOS
brew install ngrok

# Ou télécharger depuis https://ngrok.com/download
```

### 2.2 Démarrer ngrok

```bash
# Dans un nouveau terminal
ngrok http 3000

# Copier l'URL (ex: https://abc123.ngrok.io)
```

### 2.3 Configurer le Webhook Whop

1. Allez sur https://dashboard.whop.com
2. Settings → Webhooks
3. Mettez à jour l'URL:
   - `https://abc123.ngrok.io/api/webhooks/whop`
4. Sauvegardez

### 2.4 Tester le Webhook

**Envoyer un test webhook:**

```bash
# Dans un terminal
curl -X POST http://localhost:3000/api/webhooks/whop \
  -H "Content-Type: application/json" \
  -H "x-whop-signature: test" \
  -d '{
    "type": "payment.completed",
    "data": {
      "customer_id": "test-user-123",
      "product_id": "prod-123",
      "amount": 1000
    }
  }'
```

**Vérifier:**
- [ ] Réponse: `{"ok":true}`
- [ ] Logs: "Processing payment for customer: test-user-123"
- [ ] Utilisateur créé dans Supabase
- [ ] `has_paid` = true
- [ ] Limites illimitées

### 2.5 Vérifier dans Supabase

1. Allez sur https://supabase.com
2. Sélectionnez votre projet
3. Allez dans "SQL Editor"
4. Exécutez:

```sql
-- Vérifier les utilisateurs
SELECT * FROM users;

-- Vérifier les limites
SELECT * FROM user_limits;
```

**Vérifier:**
- [ ] Utilisateur avec `whop_user_id` = "test-user-123"
- [ ] `has_paid` = true
- [ ] `cloud_uploads_limit` = 999999
- [ ] `local_downloads_limit` = 999999

## 🧪 Phase 3: Test Sandbox Whop

### 3.1 Activer le Mode Sandbox

1. Allez sur https://dashboard.whop.com/settings/sandbox
2. Activez "Sandbox Mode"
3. Copiez les cartes de test

### 3.2 Tester le Paiement

1. Allez sur votre app: http://localhost:3000
2. Cliquez "Upgrade"
3. Cliquez "Upgrade Now"
4. Utilisez une carte de test Whop:
   - **Numéro:** 4242 4242 4242 4242
   - **Expiration:** 12/25
   - **CVC:** 123
5. Complétez le paiement

**Vérifier:**
- [ ] Paiement réussi
- [ ] Webhook reçu (vérifier les logs)
- [ ] Utilisateur marqué comme payant
- [ ] Paywall disparu
- [ ] Accès illimité accordé

### 3.3 Vérifier les Logs

**Terminal ngrok:**
```
POST /api/webhooks/whop 200 OK
```

**Terminal npm run dev:**
```
Whop webhook event: payment.completed
Processing payment for customer: [customer_id]
✅ Payment processed successfully for user: [user_id]
```

## 🧪 Phase 4: Test en Production (Vercel)

### 4.1 Déployer sur Vercel

```bash
git add .
git commit -m "Add Whop payment integration"
git push origin main
# Vercel auto-déploie
```

### 4.2 Ajouter les Variables d'Environnement

1. Allez sur https://vercel.com
2. Sélectionnez votre projet
3. Settings → Environment Variables
4. Ajoutez:
   - `WHOP_API_KEY`
   - `WHOP_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_WHOP_PRODUCT_LINK`

### 4.3 Mettre à Jour le Webhook Whop

1. Allez sur https://dashboard.whop.com
2. Settings → Webhooks
3. Mettez à jour l'URL:
   - `https://your-vercel-domain.com/api/webhooks/whop`

### 4.4 Tester en Production

1. Visitez votre app: https://your-vercel-domain.com
2. Cliquez "Upgrade"
3. Cliquez "Upgrade Now"
4. Testez le paiement avec une vraie carte

**Vérifier:**
- [ ] Paiement réussi
- [ ] Webhook reçu
- [ ] Utilisateur marqué comme payant
- [ ] Accès illimité

## 📊 Checklist de Test Complète

### Design & UI
- [ ] HomePage affiche correctement
- [ ] WatchPage cohérent avec HomePage
- [ ] Paywall modal s'affiche
- [ ] Couleurs cohérentes

### Limites (Local)
- [ ] Webhook test fonctionne
- [ ] Utilisateur créé dans Supabase
- [ ] Limites illimitées après paiement

### Sandbox Whop
- [ ] Paiement test réussi
- [ ] Webhook reçu
- [ ] Utilisateur marqué comme payant
- [ ] Paywall disparu

### Production
- [ ] Déploiement réussi
- [ ] Variables d'environnement configurées
- [ ] Webhook URL mise à jour
- [ ] Paiement réussi
- [ ] Utilisateur marqué comme payant

## 🐛 Dépannage

### Webhook ne reçoit pas les événements

**Solution:**
1. Vérifiez l'URL du webhook dans Whop
2. Vérifiez les logs Vercel
3. Vérifiez la signature du webhook

### Utilisateur non créé après paiement

**Solution:**
1. Vérifiez que `whop_user_id` est correct
2. Vérifiez les logs Supabase
3. Vérifiez les permissions RLS

### Paywall toujours affiché après paiement

**Solution:**
1. Vérifiez que `has_paid` est true
2. Vérifiez que les limites sont illimitées
3. Rafraîchissez la page

## 📝 Logs Importants

**Webhook reçu:**
```
Whop webhook event: payment.completed
Processing payment for customer: [customer_id]
```

**Utilisateur créé:**
```
Creating new user for customer: [customer_id]
```

**Paiement traité:**
```
✅ Payment processed successfully for user: [user_id]
```

## ✅ Succès!

Quand vous voyez:
- ✅ Paiement réussi
- ✅ Webhook reçu
- ✅ Utilisateur marqué comme payant
- ✅ Accès illimité accordé
- ✅ Paywall disparu

**Vous êtes prêt pour la production! 🚀**

