# 🏗️ Architecture de l'Application

## 📊 Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Next.js App (Client)                                     │   │
│  │  - React Components                                       │   │
│  │  - Whop iFrame SDK                                        │   │
│  │  - Real-time UI Updates                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                      VERCEL (Hosting)                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Next.js App (Server)                                     │   │
│  │  - API Routes                                             │   │
│  │  - Server Actions                                         │   │
│  │  - Authentication                                         │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                    ↕                    ↕
        ┌───────────────────┐  ┌───────────────────┐
        │   WHOP API        │  │   SUPABASE        │
        │   - Auth          │  │   - Videos DB     │
        │   - Payments      │  │   - User Data     │
        │   - Memberships   │  │   - Storage       │
        └───────────────────┘  └───────────────────┘
```

---

## 🔐 Flux d'Authentification

```
1. User visite l'app
   ↓
2. Whop Token vérifié (via query param ou cookie)
   ↓
3. Token validé via Whop API
   ↓
4. User ID extrait du token
   ↓
5. Premium status vérifié via Whop API
   ↓
6. UI adaptée selon le statut (FREE/PREMIUM)
```

**Fichiers impliqués** :
- `lib/whop/server.ts` → `verifyWhopToken()`
- `lib/whop/server.ts` → `checkUserHasPremiumAccess()`
- `app/api/user/status/route.ts` → Endpoint de vérification

---

## 💳 Flux de Paiement

```
1. FREE User clique "Upgrade to premium"
   ↓
2. PaywallModal s'ouvre
   ↓
3. User clique "Upgrade Now"
   ↓
4. PremiumUpgradeButton appelle createSubscription()
   ↓
5. iframeSdk.inAppPurchase({ planId }) ouvre le modal Whop
   ↓
6. User complète le paiement (€10)
   ↓
7. Whop crée la membership
   ↓
8. checkUserHasPremiumAccess() retourne true
   ↓
9. UI se met à jour automatiquement
```

**Fichiers impliqués** :
- `app/components/PaywallModal.tsx` → Modal UI
- `app/components/PremiumUpgradeButton.tsx` → Bouton de paiement
- `app/actions/create-subscription.ts` → Server action
- `lib/whop/server.ts` → Vérification premium

---

## 📹 Flux d'Upload Vidéo

### FREE User (Limité à 3 vidéos)
```
1. User entre URL + titre
   ↓
2. Clique "Upload"
   ↓
3. POST /api/videos
   ↓
4. Vérification token Whop
   ↓
5. Vérification premium status → FALSE
   ↓
6. Comptage vidéos dans Supabase
   ↓
7. Si count >= 3 → Erreur 403
   ↓
8. Sinon → Traitement vidéo + insertion DB
   ↓
9. Événement "videoUploaded" dispatché
   ↓
10. Compteur UI se met à jour
```

### PREMIUM User (Illimité)
```
1. User entre URL + titre
   ↓
2. Clique "Upload"
   ↓
3. POST /api/videos
   ↓
4. Vérification token Whop
   ↓
5. Vérification premium status → TRUE
   ↓
6. Traitement vidéo + insertion DB (pas de limite)
   ↓
7. Événement "videoUploaded" dispatché
   ↓
8. UI se met à jour
```

**Fichiers impliqués** :
- `app/views/VideoExtractor.tsx` → Formulaire upload
- `app/api/videos/route.ts` → Endpoint upload
- `lib/download/service.ts` → Traitement vidéo
- `lib/supabase/client.ts` → Insertion DB

---

## 🎨 Composants UI Principaux

### 1. **Page d'Accueil** (`app/experiences/[experienceId]/page.tsx`)
```
┌─────────────────────────────────────────────────────┐
│  Header                                              │
│  ┌─────────────────────────────────────────────┐   │
│  │  Course Downloader                           │   │
│  │  Free Plan • 2/3 videos uploaded             │   │
│  │  [Upgrade] ← Visible uniquement pour FREE    │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  VideoExtractor                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │  [URL Input]                                 │   │
│  │  [Title Input]                               │   │
│  │  [Upload Button]                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  Video List                                          │
│  ┌─────────────────────────────────────────────┐   │
│  │  📹 Video 1                                  │   │
│  │  📹 Video 2                                  │   │
│  │  📹 Video 3                                  │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### 2. **Modal Paywall** (`app/components/PaywallModal.tsx`)
```
┌─────────────────────────────────────────────────────┐
│  Upgrade to Premium                                  │
│  ─────────────────────────────────────────────────  │
│                                                      │
│  Unlock unlimited cloud uploads and local downloads  │
│  with a one-time €10 payment.                       │
│                                                      │
│  Features:                                           │
│  ✓ Unlimited video uploads                          │
│  ✓ Cloud storage                                    │
│  ✓ Local downloads                                  │
│  ✓ One-time €10 payment                             │
│  ✓ Lifetime access                                  │
│                                                      │
│  [Upgrade Now]                                       │
└─────────────────────────────────────────────────────┘
```

### 3. **Message d'Erreur Limite** (`app/views/VideoExtractor.tsx`)
```
┌─────────────────────────────────────────────────────┐
│  ⚠️ Upload Limit Reached                            │
│  ─────────────────────────────────────────────────  │
│  Free users can upload up to 3 videos.              │
│  [Upgrade to premium] for unlimited uploads.        │
│                                                      │
│  ← Cliquable, ouvre le modal paywall                │
└─────────────────────────────────────────────────────┘
```

---

## 🗄️ Base de Données Supabase

### Table `videos`
```sql
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,           -- Whop User ID (ex: user_Ve2VZURN88fPy)
  title TEXT NOT NULL,
  mux_url TEXT NOT NULL,
  shareable_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour les requêtes par user
CREATE INDEX idx_videos_user_id ON videos(user_id);
```

**Requêtes principales** :
- **Compter les vidéos d'un user** : `SELECT COUNT(*) FROM videos WHERE user_id = ?`
- **Lister les vidéos d'un user** : `SELECT * FROM videos WHERE user_id = ? ORDER BY created_at DESC`
- **Insérer une vidéo** : `INSERT INTO videos (user_id, title, mux_url, shareable_id) VALUES (?, ?, ?, ?)`

---

## 🔑 Variables d'Environnement

### Publiques (Client + Server)
```bash
NEXT_PUBLIC_WHOP_APP_ID          # ID de l'app Whop
NEXT_PUBLIC_WHOP_PREMIUM_PLAN_ID # ID du plan premium €10
NEXT_PUBLIC_SUPABASE_URL         # URL Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY    # Clé publique Supabase
NEXT_PUBLIC_APP_URL              # URL de l'app
```

### Privées (Server uniquement)
```bash
WHOP_API_KEY                     # Clé API Whop (pour vérifier memberships)
WHOP_WEBHOOK_SECRET              # Secret webhook Whop
SUPABASE_SERVICE_ROLE_KEY        # Clé admin Supabase
NODE_ENV                         # development | production
```

---

## 🔄 Événements Custom

### `videoUploaded`
**Dispatché par** : `VideoExtractor.tsx` après upload réussi  
**Écouté par** : `page.tsx` pour rafraîchir le compteur  
**Payload** : Aucun

```typescript
// Dispatch
window.dispatchEvent(new CustomEvent('videoUploaded'));

// Listen
window.addEventListener('videoUploaded', handleVideoUploaded);
```

### `openPaywall`
**Dispatché par** : `VideoExtractor.tsx` quand user clique "Upgrade to premium"  
**Écouté par** : `page.tsx` pour ouvrir le modal paywall  
**Payload** : Aucun

```typescript
// Dispatch
window.dispatchEvent(new CustomEvent('openPaywall'));

// Listen
window.addEventListener('openPaywall', handleOpenPaywall);
```

---

## 🚦 Logique de Vérification Premium

### Fonction `checkUserHasPremiumAccess(userId: string)`

**Localisation** : `lib/whop/server.ts`

**Logique** :
```typescript
1. Si NODE_ENV === 'development'
   → Retourne false (simule FREE user)
   
2. Sinon (production)
   → Appelle Whop API: GET /api/v5/me/memberships
   → Vérifie si user a une membership active pour plan_bu3VuTZaPKTrD
   → Retourne true si membership trouvée, false sinon
```

**Utilisée par** :
- `/api/user/status` → Retourne le statut premium au client
- `/api/videos` → Vérifie les limites d'upload

---

## 📈 Métriques et Analytics

### Métriques Clés à Suivre
1. **Taux de conversion** : FREE → PREMIUM
2. **Uploads par user** : Moyenne FREE vs PREMIUM
3. **Taux d'abandon** : Users qui atteignent la limite mais n'achètent pas
4. **Refunds** : Taux de remboursement
5. **Erreurs** : Taux d'erreur upload, paiement, etc.

### Outils Recommandés
- **Vercel Analytics** : Performance et Core Web Vitals
- **Whop Dashboard** : Ventes, refunds, memberships
- **Supabase Dashboard** : Requêtes DB, erreurs
- **Sentry** (optionnel) : Error tracking

---

## 🔒 Sécurité

### Vérifications Côté Serveur
✅ **Authentification** : Token Whop vérifié à chaque requête  
✅ **Premium Status** : Vérifié via API Whop (pas de confiance client)  
✅ **Upload Limits** : Appliquées côté serveur (pas contournable)  
✅ **API Keys** : Jamais exposées côté client  

### Best Practices
- ✅ Toutes les actions sensibles passent par des API routes
- ✅ Validation des inputs côté serveur
- ✅ Rate limiting (via Vercel)
- ✅ CORS configuré correctement

---

## 🎯 Points d'Entrée Principaux

### Routes Client
- `/experiences/[experienceId]` → Page d'accueil
- `/watch/[videoId]` → Lecteur vidéo

### API Routes
- `POST /api/videos` → Upload vidéo
- `GET /api/videos` → Liste vidéos
- `GET /api/user/status` → Statut premium
- `POST /api/webhooks/whop` → Webhooks Whop

### Server Actions
- `createSubscription()` → Retourne le plan ID pour le paiement

---

## 🚀 Performance

### Optimisations
- ✅ **Next.js 16** avec Turbopack (dev)
- ✅ **Server Components** par défaut
- ✅ **API Routes** optimisées
- ✅ **Supabase** avec indexes sur `user_id`
- ✅ **Vercel Edge Network** pour CDN global

### Temps de Réponse Cibles
- Page load : < 2s
- API calls : < 500ms
- Upload vidéo : < 5s (selon taille)

---

## 📦 Dépendances Principales

```json
{
  "next": "16.0.0",
  "@supabase/supabase-js": "^2.x",
  "@whop-apps/sdk": "^3.x",
  "react": "^19.x",
  "typescript": "^5.x"
}
```

---

## 🎉 Conclusion

Cette architecture est :
- ✅ **Scalable** : Peut gérer des milliers d'utilisateurs
- ✅ **Sécurisée** : Vérifications côté serveur
- ✅ **Performante** : Optimisée pour la vitesse
- ✅ **Maintenable** : Code propre et bien structuré
- ✅ **Production-ready** : Prêt pour le déploiement

Prêt pour la production ! 🚀

