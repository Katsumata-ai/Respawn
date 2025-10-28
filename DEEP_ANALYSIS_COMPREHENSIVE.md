# 🚀 Analyse Profonde - Whop App (Course Downloader)

## 📋 Vue d'ensemble

**Nom du projet:** Course Downloader - Whop App  
**Type:** SaaS avec intégration Whop (paiements)  
**Tech Stack:** Next.js 16 + React 19 + TypeScript + Supabase + Tailwind CSS  
**Status:** Production-Ready avec système Free/Premium complet

---

## 🏗️ Architecture Globale

```
┌─────────────────────────────────────────────────────────┐
│                   WHOP APP                               │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  FRONTEND (React 19 + Next.js 16)                        │
│  ├─ /app/views       → Pages principales                 │
│  ├─ /app/components  → Composants UI                     │
│  └─ /app/hooks       → Hooks React custom                │
│                                                           │
│  ↓ MIDDLEWARE                                             │
│  middleware.ts → Extraction token Whop dev               │
│                                                           │
│  ↓ API LAYER (Next.js Route Handlers)                    │
│  /api/videos         → CRUD vidéos + vérification limits │
│  /api/user/status    → Statut premium utilisateur        │
│  /api/webhooks/whop  → Webhook paiements Whop            │
│  /api/download/*     → Téléchargements vidéos            │
│  /api/oauth/*        → Auth Whop OAuth                   │
│  /api/whop/*         → Utilitaires Whop                  │
│                                                           │
│  ↓ SERVICES & BUSINESS LOGIC                             │
│  /lib/whop/server.ts      → Vérification JWT + premium   │
│  /lib/whop/client.ts      → SDK Whop côté client         │
│  /lib/download/service.ts → Logique download/streaming   │
│  /lib/supabase/client.ts  → Client Supabase              │
│                                                           │
│  ↓ DATABASE (Supabase PostgreSQL)                        │
│  ├─ users              → Données utilisateurs            │
│  ├─ user_limits        → Limites de téléchargement       │
│  ├─ videos             → Métadonnées vidéos              │
│  └─ migration_logs     → Logs des migrations             │
│                                                           │
│  ↓ EXTERNAL SERVICES                                      │
│  ├─ Whop API           → Vérification memberships        │
│  ├─ Whop iFrame SDK    → Paiements in-app                │
│  ├─ Mux                → Streaming vidéo                 │
│  └─ S3 (optionnel)     → Stockage vidéos                 │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Fonctionnalités Principales

### 1️⃣ Upload & Gestion de Vidéos

**Route:** `POST /api/videos`

**Flux:**
```typescript
Utilisateur paste Mux URL
  ↓
Validation du format (stream.mux.com, .m3u8)
  ↓
Vérification JWT Whop
  ↓
Vérification limite FREE (3 vidéos max)
  ↓
Enregistrement en base Supabase
  ↓
Génération URL de visionnage
  ↓
Retour videoId + watchUrl
```

**Limites:**
- **FREE users:** Max 3 vidéos
- **PREMIUM users:** Uploads illimités
- Limites appliquées **côté serveur** (sécurisé)

### 2️⃣ Système d'Authentification Whop

**Fichier clé:** `lib/whop/server.ts`

**Mécanisme:**
```typescript
// Dev Mode
Token en URL: ?whop-dev-user-token=eyJ...
Middleware extrait → headers (x-whop-user-token)

// Production Mode
Token dans iFrame Whop (automatique)
Middleware passe aux API routes

// Vérification
verifyWhopToken() → Décode JWT → Retourne userId
```

**Où utilisé:**
- ✅ Vérification authentification
- ✅ Récupération userId
- ✅ Vérification limite uploads
- ✅ Association vidéos à l'utilisateur

### 3️⃣ Vérification Statut Premium

**Fonction:** `checkUserHasPremiumAccess(userId)`

**Logique en DEV (développement):**
```typescript
if (NODE_ENV === 'development') {
  return true;  // Simule utilisateur PAID
}
```

**Logique en PROD (production):**
```typescript
const response = await fetch('https://api.whop.com/api/v5/me/memberships', {
  headers: { Authorization: `Bearer ${WHOP_API_KEY}` }
});

// Vérifier si l'utilisateur a une membership active
const hasPremium = memberships.some(m => 
  m.user_id === userId &&
  m.plan_id === PREMIUM_PLAN_ID &&
  m.status === 'active'
);
```

**Plans Whop:**
| Plan | ID | Prix | Environnement |
|------|-------|------|---|
| Debug/Free | plan_tQLEjBY8Vz6Jm | Gratuit | DEV |
| Premium | plan_bu3VuTZaPKTrD | €10 | PROD |

### 4️⃣ Webhook de Paiement

**Route:** `POST /api/webhooks/whop`

**Événements gérés:**
- `payment.completed` → Utilisateur a payé €10
- `payment.refunded` → Remboursement reçu

**Flux:**
```
Utilisateur paie via Whop
  ↓
Whop envoie webhook signé (HMAC-SHA256)
  ↓
Vérification signature (WHOP_WEBHOOK_SECRET)
  ↓
Si nouveaux utilisateur → Création en base
  ↓
Marquage: has_paid = true, payment_date = now
  ↓
Limites définies à illimité
```

**Sécurité:**
```typescript
const hash = crypto
  .createHmac('sha256', WHOP_WEBHOOK_SECRET)
  .update(rawBody)
  .digest('hex');

if (hash !== signatureHeader) {
  return 401; // Signature invalide → rejeter
}
```

### 5️⃣ UI/UX - Paywall & Upgrade

**Composant:** `app/components/PaywallModal.tsx`

**Affichage:**
- **FREE:** Badge "Free Plan • X/3 videos uploaded"
- **PREMIUM:** Badge "✓ Premium Access Active"
- **Limite atteinte:** Modal paywall avec CTA

**Design:**
```
┌──────────────────────────────────────┐
│   Upgrade to Premium Access          │
├──────────────────────────────────────┤
│ ✓ Unlimited video uploads            │
│ ✓ Priority support                   │
│ ✓ Advanced features                  │
│ ✓ Early access to new tools          │
├──────────────────────────────────────┤
│  [Upgrade Now for €10] [Close]       │
└──────────────────────────────────────┘
```

---

## 📁 Structure des Fichiers

### Frontend

```
app/
├── views/
│   ├── HomePage.tsx          # Page d'accueil + formulaire upload
│   ├── MyVideos.tsx          # Liste vidéos avec actions
│   ├── VideoExtractor.tsx    # Formulaire extraction Mux URL
│   └── MainTabs.tsx          # Navigation tabs
│
├── components/
│   ├── PaywallModal.tsx           # Modal paiement
│   ├── PremiumUpgradeButton.tsx   # Bouton upgrade
│   └── DownloadProgressModal.tsx  # Modal progression téléchargement
│
├── hooks/
│   └── usePremiumStatus.ts    # Hook pour récupérer statut premium
│
└── actions/
    └── create-subscription.ts # Action pour créer subscription Whop
```

### API Routes

```
api/
├── videos/
│   ├── route.ts              # GET (list) + POST (upload)
│   └── [shareableId]/route.ts # DELETE video
│
├── user/
│   ├── status/route.ts       # GET statut premium utilisateur
│   └── [id]/route.ts         # GET données utilisateur
│
├── download/
│   ├── route.ts              # POST initier téléchargement
│   ├── [videoId]/route.ts    # GET télécharger vidéo
│   └── check/route.ts        # GET vérifier status download
│
├── whop/
│   ├── user/route.ts         # GET info utilisateur Whop
│   └── validate-access/route.ts # POST vérifier accès
│
├── webhooks/
│   └── whop/route.ts         # POST webhook paiements
│
├── oauth/
│   ├── init/route.ts         # GET initialiser OAuth
│   └── callback/route.ts     # POST callback OAuth
│
└── dev/
    └── simulate-payment/route.ts # POST simuler paiement (dev)
```

### Services & Libraries

```
lib/
├── whop/
│   ├── server.ts    # JWT verification, premium check, API calls
│   └── client.ts    # SDK Whop côté client
│
├── download/
│   ├── service.ts      # Logique principal download
│   ├── downloader.ts   # Téléchargement fichiers
│   ├── storage.ts      # Métadonnées base de données
│   └── types.ts        # Types TypeScript
│
├── supabase/
│   └── client.ts    # Client Supabase
│
└── supabase/ (migrations)
    ├── migrations/
    │   ├── 001_create_tables.sql  # Tables initiales
    │   ├── 002_add_premium.sql    # Colonne premium
    │   └── ...
    └── migrations_log.json        # Historique migrations
```

### Configuration

```
root/
├── package.json               # Dépendances
├── tsconfig.json              # Config TypeScript
├── tailwind.config.js         # Tailwind CSS
├── next.config.js             # Config Next.js
├── middleware.ts              # Middleware extraction token
├── postcss.config.js          # PostCSS config
├── vercel.json                # Config Vercel deployment
└── .env.local                 # Variables d'environnement (Git ignored)
```

---

## 🔐 Système d'Authentification & Sécurité

### 1. Authentification Whop

**Mode Développement (DEV):**
```typescript
// Token passé en URL: ?whop-dev-user-token=xxx
// Middleware l'extrait du referer et ajoute aux headers

// Simule un utilisateur PAID en DEV
checkUserHasPremiumAccess() → true (dans dev)
```

**Mode Production (PROD):**
```typescript
// Whop embed génère automatiquement le token
// iFrame SDK gère tout automatiquement
// Token envoyé dans x-whop-user-token header

// Vérification réelle via API Whop
checkUserHasPremiumAccess() → appel API Whop
```

### 2. Sécurité des Endpoints

**Vérification JWT (côté serveur):**
```typescript
export async function POST(request: NextRequest) {
  // Vérifier le token
  const payload = await verifyWhopToken();
  
  if (!payload?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Continuer avec la logique
}
```

**Signature HMAC Webhook:**
```typescript
// Vérifier que le webhook vient de Whop
const signature = crypto
  .createHmac('sha256', WHOP_WEBHOOK_SECRET)
  .update(rawBody)
  .digest('hex');

if (signature !== headerSignature) {
  return 401; // Rejeter
}
```

### 3. Vérifications de Limites

**Côté serveur (sécurisé):**
```typescript
// Impossible à contourner côté client
const hasPremium = await checkUserHasPremiumAccess(userId);

if (!hasPremium) {
  const videoCount = await getVideoCount(userId);
  if (videoCount >= 3) {
    return 403; // Limite atteinte
  }
}
```

---

## 💾 Base de Données (Supabase PostgreSQL)

### Tables

**1. `users`**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whop_user_id TEXT UNIQUE,           -- ID utilisateur Whop
  has_paid BOOLEAN DEFAULT FALSE,     -- Accès premium
  payment_date TIMESTAMP,             -- Date du paiement
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

**2. `videos`**
```sql
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,                       -- ID Whop utilisateur
  title TEXT,                         -- Titre vidéo
  mux_url TEXT,                       -- URL streaming Mux
  s3_url TEXT,                        -- URL stockage S3 (optionnel)
  shareable_id UUID UNIQUE,           -- Pour partage public
  thumbnail TEXT,                     -- URL vignette
  duration INT DEFAULT 0,             -- Durée en secondes
  created_at TIMESTAMP DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES users(whop_user_id)
);
```

**3. `user_limits`**
```sql
CREATE TABLE user_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,                       -- Référence users.id
  cloud_uploads INT DEFAULT 1,        -- Limite uploads cloud
  local_downloads INT DEFAULT 1,      -- Limite downloads locaux
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Indexes

```sql
CREATE INDEX idx_videos_user_id ON videos(user_id);
CREATE INDEX idx_videos_shareable_id ON videos(shareable_id);
CREATE INDEX idx_user_limits_user_id ON user_limits(user_id);
```

---

## 🌐 Intégrations Externes

### 1. Whop API

**Endpoints utilisés:**

| Endpoint | Méthode | Usage |
|----------|--------|-------|
| `/api/v5/me/memberships` | GET | Vérifier membership premium |
| `/api/webhooks/whop` | POST | Recevoir paiements |
| iFrame SDK | - | Paiement in-app |

**Configuration:**
```env
WHOP_API_KEY=ojneczyAk8cG8Yc9e6IgMmkOB2mYUfo4PTcNtOejsoI
WHOP_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_WHOP_PREMIUM_PLAN_ID=plan_bu3VuTZaPKTrD
NEXT_PUBLIC_WHOP_DEBUG_PLAN_ID=plan_tQLEjBY8Vz6Jm
```

### 2. Mux (Streaming Vidéo)

**Utilisé pour:**
- Streaming vidéos en qualité adaptative
- Format: HLS (.m3u8)
- URL: `https://image.mux.com/...`

### 3. Supabase

**Utilisé pour:**
- PostgreSQL (stockage données)
- Auth (optionnel)
- Réaltime (optionnel)

**Configuration:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xyzabc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXA...
```

---

## 📊 Flux de Données Principaux

### Flux 1: Upload Vidéo

```
[Frontend]
  ↓ POST /api/videos { muxUrl, title }
[API Route]
  ↓ verifyWhopToken() → userId
  ↓ checkUserHasPremiumAccess(userId)
  ├─ Si FREE + count ≥ 3 → ❌ 403
  └─ Sinon → ✅ Continuer
  ↓ Valider Mux URL
  ↓ Générer uuid, thumbnail
  ↓ INSERT videos table
  ↓ Retour { videoId, watchUrl }
[Frontend]
  ↓ Redirection vers /watch/{videoId}
```

### Flux 2: Vérification Premium

```
[Frontend] useEffect()
  ↓ fetch('/api/user/status')
[API Route]
  ↓ verifyWhopToken() → userId
  ↓ checkUserHasPremiumAccess(userId)
    ├─ Si DEV → return true
    └─ Si PROD → fetch API Whop
[API Whop]
  ↓ Rechercher membership avec plan_id=PREMIUM_PLAN
  ↓ Vérifier status === 'active'
  ↓ Retour boolean
[Frontend]
  ↓ Mise à jour state: { userId, hasPremium }
  ↓ UI s'adapte (badge, bouton upgrade)
```

### Flux 3: Paiement & Webhook

```
[Frontend]
  ↓ Clic "Upgrade Now"
  ↓ iFrameSdk.inAppPurchase({ planId })
[Whop iFrame]
  ↓ Formulaire paiement
  ↓ Utilisateur paie €10
  ↓ Whop crée membership
  ↓ Whop envoie webhook POST
[API Webhook]
  ↓ Vérifier signature HMAC
  ↓ Extraire customer_id, product_id
  ├─ Si NEW user → INSERT users
  └─ Si EXISTING → UPDATE has_paid = true
  ↓ UPDATE user_limits → illimité
[Frontend] (page reload)
  ↓ fetch('/api/user/status')
  ↓ hasPremium === true
  ↓ UI affiche "Premium Access Active"
  ↓ Uploads illimités
```

---

## 🚀 Déploiement & Configuration

### Variables d'Environnement Required

```bash
# Whop
WHOP_API_KEY=...
WHOP_WEBHOOK_SECRET=...
NEXT_PUBLIC_WHOP_PREMIUM_PLAN_ID=plan_bu3VuTZaPKTrD
NEXT_PUBLIC_WHOP_DEBUG_PLAN_ID=plan_tQLEjBY8Vz6Jm

# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# App
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Déploiement Vercel

```bash
# 1. Push vers GitHub
git push origin main

# 2. Vercel auto-déploie via GitHub integration
# 3. Variables d'env automatiquement utilisées
# 4. Logs disponibles dans Vercel dashboard
```

### Checklist Production

- ✅ NODE_ENV=production
- ✅ NEXT_PUBLIC_WHOP_PREMIUM_PLAN_ID=plan_bu3VuTZaPKTrD (€10)
- ✅ Webhook configuré: POST https://your-domain.com/api/webhooks/whop
- ✅ WHOP_WEBHOOK_SECRET configuré dans Vercel
- ✅ WHOP_API_KEY configuré
- ✅ Supabase URL & key configurés
- ✅ Tests paiement avec vrai compte (sandbox mode)
- ✅ Vérification: utilisateur FREE reçoit limite 403
- ✅ Vérification: paiement crée membership active
- ✅ Vérification: premium users voient uploads illimités

---

## 🧪 Tests & Validation

### Test 1: Utilisateur FREE

```bash
1. Créer compte Whop SANS membership
2. Ouvrir app
3. Vérifier: "Free Plan • 0/3 videos uploaded"
4. Uploader 3 vidéos ✅
5. Tenter 4ème upload → Erreur 403 ✅
6. Modal paywall affichée ✅
```

### Test 2: Achat Premium

```bash
1. Cliquer "Upgrade Now"
2. Paiement €10 (mode sandbox)
3. Webhook reçu ✅
4. User marqué: has_paid = true ✅
5. Membership.status = 'active' ✅
6. Badge change: "✓ Premium Access Active" ✅
7. Uploads illimités ✅
```

### Test 3: Mode Développement

```bash
1. npm run dev
2. Ouvrir: http://localhost:3000?whop-dev-user-token=eyJ...
3. Middleware extrait token ✅
4. API reçoit token dans headers ✅
5. checkUserHasPremiumAccess() → true (simule PAID) ✅
```

---

## 🐛 Debugging & Logs

### Fichiers de Log

```bash
# Middleware
console.log('[Middleware] Referer:', referer)
console.log('[Middleware] Dev token found:', !!devToken)

# Vérification Premium
console.log('[Premium Check] DEV mode - returning true')
console.log('[Premium Check] PROD - checking API')
console.log('[Premium Check] Memberships:', data.data)

# Upload Video
console.log('Checking video count:', videoCount)
console.log('User is PAID - no limit check needed')
console.log('Video saved with ID:', videoId)

# Webhook
console.log('Whop webhook event:', event.type)
console.log('Processing payment for customer:', customer_id)
console.log('User created/updated successfully')
```

### Commandes Debugging

```bash
# Vérifier token du browser
open http://localhost:3000?whop-dev-user-token=xxx
# Puis ouvrir DevTools → Application → Cookies

# Simuler webhook localement
curl -X POST http://localhost:3000/api/webhooks/whop \
  -H "x-whop-signature: xxx" \
  -H "Content-Type: application/json" \
  -d '{"type":"payment.completed","data":{"customer_id":"xxx"}}'

# Checker Supabase
supabase inspect db tables --local
```

---

## 📈 Performance & Optimisations

### Frontend
- ✅ React 19 (streaming SSR)
- ✅ Next.js 16 (turbopack)
- ✅ Code splitting automatique
- ✅ Lazy loading composants

### Backend
- ✅ Route handlers optimisés
- ✅ Caching Supabase
- ✅ Index base données sur (user_id, shareable_id)
- ✅ Connection pooling Supabase

### Network
- ✅ Mux HLS (adaptive bitrate)
- ✅ Compression CSS/JS (Turbopack)
- ✅ CDN Vercel intégré

---

## 🎓 Concepts Clés Implémentés

### 1. JWT Verification
- Décodage JWT sans crypto (pour dev)
- Production: vérification signature
- Extraction userId de 'sub' ou 'userId'

### 2. HMAC Webhook Verification
```typescript
crypto.createHmac('sha256', secret).update(body).digest('hex')
```

### 3. Role-Based Access Control
- FREE: limites appliquées
- PREMIUM: accès complet

### 4. Event-Driven Architecture
```typescript
window.dispatchEvent(new CustomEvent('videoUploaded'))
```

### 5. Middleware Pattern
```typescript
// Middleware extrait token → headers
// API reçoit token prêt à utiliser
```

---

## 🔮 Améliorations Futures Possibles

1. **Authentification Multiple**
   - Google OAuth
   - GitHub OAuth
   - Email/Password

2. **Fonctionnalités Premium**
   - Conversion vidéo
   - Compression automatique
   - Partage collaboratif
   - Analytics vues

3. **Scaling**
   - Queue jobs (Bull/BullMQ)
   - Caching Redis
   - Rate limiting
   - CDN custom

4. **Analytics**
   - Tracking utilisateurs
   - Revenue per user
   - Churn rate
   - User journey

5. **Admin Panel**
   - Dashboard statistiques
   - Gestion utilisateurs
   - Webhooks debug
   - Logs visualisation

---

## 🎯 Résumé des Points Clés

| Aspect | Détails |
|--------|---------|
| **Framework** | Next.js 16 + React 19 |
| **Type** | SaaS avec freemium model |
| **Authentification** | JWT Whop (dev + prod) |
| **Paiements** | Whop Billing (€10 premium) |
| **Base de données** | Supabase PostgreSQL |
| **Limites** | 3 videos FREE, illimité PREMIUM |
| **Security** | HMAC signatures, JWT, côté serveur checks |
| **Status** | ✅ Production Ready |

---

**Document généré:** 28 Octobre 2025  
**Version:** 1.0  
**Auteur:** Deep Analysis Bot

