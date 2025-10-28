# Whop Payment Integration Guide

## 🎯 Objectif
Intégrer le système de paiement Whop pour permettre aux utilisateurs de payer €10 one-time pour accès illimité.

## 📋 Prérequis

1. **Compte Whop** - https://whop.com
2. **Whop API Key** - Du dashboard Whop
3. **Webhook Secret** - Généré par Whop
4. **Vercel URL** - Pour les webhooks

## 🔧 Étape 1: Configuration Whop Dashboard

### 1.1 Créer un Produit
1. Allez sur https://dashboard.whop.com
2. Cliquez sur "Products" → "Create Product"
3. Remplissez:
   - **Name:** "WhopApp Premium"
   - **Description:** "Unlimited cloud uploads and local downloads"
   - **Price:** €10
   - **Type:** "One-time payment"
4. Cliquez "Create"

### 1.2 Obtenir le Product Link
1. Allez dans le produit créé
2. Copiez le lien de partage (ex: `https://whop.com/whopapp-premium/`)
3. Gardez-le pour plus tard

### 1.3 Configurer le Webhook
1. Allez dans "Settings" → "Webhooks"
2. Cliquez "Add Webhook"
3. Remplissez:
   - **URL:** `https://your-vercel-domain.com/api/webhooks/whop`
   - **Events:** Sélectionnez:
     - `payment.completed`
     - `payment.refunded`
4. Cliquez "Create"
5. Copiez le **Webhook Secret**

### 1.4 Obtenir l'API Key
1. Allez dans "Settings" → "API Keys"
2. Cliquez "Generate New Key"
3. Copiez la clé

## 🔐 Étape 2: Configuration Environnement

Ajoutez à `.env.local`:
```
WHOP_API_KEY=your_api_key_here
WHOP_WEBHOOK_SECRET=your_webhook_secret_here
NEXT_PUBLIC_WHOP_PRODUCT_LINK=https://whop.com/your-product-link/
```

## 🔗 Étape 3: Implémenter le Webhook

Créez/mettez à jour `app/api/webhooks/whop/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/client';
import { UserLimitsService } from '@/app/services/user-limits.service';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-whop-signature');
    
    // Vérifier la signature
    const secret = process.env.WHOP_WEBHOOK_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    const hash = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (hash !== signature) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const event = JSON.parse(body);
    const supabase = getSupabaseClient();

    if (event.type === 'payment.completed') {
      const { customer_id, product_id } = event.data;

      // Trouver l'utilisateur par whop_user_id
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('whop_user_id', customer_id)
        .single();

      if (userError || !user) {
        // Créer l'utilisateur s'il n'existe pas
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            whop_user_id: customer_id,
            has_paid: true,
            payment_date: new Date(),
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating user:', createError);
          return NextResponse.json(
            { error: 'Failed to create user' },
            { status: 500 }
          );
        }

        // Créer les limites illimitées
        await UserLimitsService.setUnlimitedAccess(newUser.id);
      } else {
        // Mettre à jour l'utilisateur existant
        await supabase
          .from('users')
          .update({
            has_paid: true,
            payment_date: new Date(),
          })
          .eq('id', user.id);

        // Définir accès illimité
        await UserLimitsService.setUnlimitedAccess(user.id);
      }

      console.log(`Payment completed for user: ${customer_id}`);
    }

    if (event.type === 'payment.refunded') {
      const { customer_id } = event.data;

      // Réinitialiser le statut de paiement
      await supabase
        .from('users')
        .update({
          has_paid: false,
          payment_date: null,
        })
        .eq('whop_user_id', customer_id);

      console.log(`Payment refunded for user: ${customer_id}`);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## 🧪 Étape 4: Tester Localement

### 4.1 Utiliser Whop Sandbox
1. Allez sur https://dashboard.whop.com/settings/sandbox
2. Activez le mode Sandbox
3. Utilisez les cartes de test Whop

### 4.2 Tester le Webhook Localement
Utilisez ngrok pour exposer votre serveur local:

```bash
# Installer ngrok
npm install -g ngrok

# Démarrer ngrok
ngrok http 3000

# Copier l'URL (ex: https://abc123.ngrok.io)
# Ajouter à Whop: https://abc123.ngrok.io/api/webhooks/whop
```

### 4.3 Tester le Paiement
1. Allez sur votre app locale
2. Cliquez "Upgrade"
3. Cliquez "Upgrade Now"
4. Utilisez une carte de test Whop
5. Vérifiez que:
   - L'utilisateur est marqué comme payant
   - Les limites sont illimitées
   - Le paywall disparaît

## 🚀 Étape 5: Déployer sur Vercel

### 5.1 Ajouter les Variables d'Environnement
1. Allez sur Vercel Dashboard
2. Sélectionnez votre projet
3. Allez dans "Settings" → "Environment Variables"
4. Ajoutez:
   - `WHOP_API_KEY`
   - `WHOP_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_WHOP_PRODUCT_LINK`

### 5.2 Mettre à Jour le Webhook Whop
1. Allez sur Whop Dashboard
2. Allez dans "Settings" → "Webhooks"
3. Mettez à jour l'URL:
   - `https://your-vercel-domain.com/api/webhooks/whop`

### 5.3 Déployer
```bash
git add .
git commit -m "Add Whop payment integration"
git push origin main
# Vercel auto-déploie
```

## 📊 Tester en Production

1. **Accédez à votre app:** https://your-vercel-domain.com
2. **Cliquez "Upgrade"**
3. **Cliquez "Upgrade Now"**
4. **Utilisez une vraie carte** (ou Whop test card)
5. **Vérifiez:**
   - Paiement réussi
   - Utilisateur marqué comme payant
   - Paywall disparu
   - Accès illimité

## 🐛 Dépannage

### Webhook ne reçoit pas les événements
- Vérifiez l'URL du webhook dans Whop
- Vérifiez les logs Vercel
- Vérifiez la signature du webhook

### Utilisateur non créé après paiement
- Vérifiez que `whop_user_id` est correct
- Vérifiez les logs Supabase
- Vérifiez les permissions RLS

### Paywall toujours affiché après paiement
- Vérifiez que `has_paid` est true
- Vérifiez que les limites sont illimitées
- Rafraîchissez la page

## 📝 Checklist Finale

- [ ] Produit créé sur Whop
- [ ] Webhook configuré
- [ ] API Key obtenue
- [ ] Variables d'environnement ajoutées
- [ ] Webhook implémenté
- [ ] Testé localement avec ngrok
- [ ] Déployé sur Vercel
- [ ] Webhook URL mise à jour
- [ ] Testé en production
- [ ] Paiement fonctionne
- [ ] Utilisateur marqué comme payant
- [ ] Accès illimité accordé

---

**Vous êtes prêt! 🚀**

