# API Biso Livraison — Guide consommateur (App Mobile)

> **Version** : 1.0.0 · **Base URL dev** : `http://localhost:3001`

Ce document est le contrat d'intégration entre le backend et l'application mobile React Native (Expo).

---

## Surfaces API

| Surface | Endpoint | Authentification | Usage principal |
|---------|----------|------------------|-----------------|
| **GraphQL** | `POST /graphql` | JWT Bearer (sauf ops publiques) | Auth, restaurants, commandes, OTP, colis… |
| **REST Health** | `GET /health` | Aucune | Supervision / CI |
| **REST Upload** | `POST /uploads/image` | JWT Bearer | Images (avatars, couvertures resto) |
| **Static** | `GET /uploads/*` | Aucune | Fichiers uploadés |
| **Swagger UI** | `GET /api/docs` | Aucune | Documentation REST interactive |
| **OpenAPI JSON** | `GET /api/docs-json` | Aucune | Spec OpenAPI (REST) |

---

## Authentification

### Flux inscription (OTP Twilio)

```graphql
# 1. Demander le code SMS
mutation RequestOtp($input: RequestOtpInput!) {
  requestOtp(input: $input) {
    phone
    expiresIn
  }
}

# 2. Vérifier le code
mutation VerifyOtp($input: VerifyOtpInput!) {
  verifyOtp(input: $input)
}

# 3. Créer le compte
mutation Register($input: CreateUserInput!) {
  createUser(input: $input) {
    id
    phone
    firstName
    lastName
    role
  }
}

# 4. Se connecter
mutation Login($input: LoginInput!) {
  login(input: $input) {
    accessToken
    user { id phone firstName lastName role avatarUrl }
  }
}
```

### Headers requis (opérations protégées)

```http
Authorization: Bearer <accessToken>
Content-Type: application/json
```

### Rôles

| Rôle | Description |
|------|-------------|
| `CLIENT` | Utilisateur final (app mobile) |
| `DRIVER` | Livreur |
| `PARTNER` | Partenaire restaurant |
| `ADMIN` | Administration |

---

## Opérations GraphQL — App Mobile

### Publiques (sans token)

| Query | Description |
|-------|-------------|
| `searchRestaurants` | Recherche restaurants paginée |
| `restaurants` | Liste restaurants |
| `restaurant` | Détail restaurant |
| `searchMenuItems` | Recherche produits |
| `menuItemsByRestaurant` | Menu d'un restaurant |
| `menuItem` | Détail produit |
| `reviewsByRestaurant` | Avis d'un restaurant |
| `reviewsByDriver` | Avis d'un livreur |

### Client authentifié

| Opération | Type | Description |
|-----------|------|-------------|
| `me` | Query | Profil connecté |
| `updateProfile` | Mutation | Modifier profil |
| `myOrders` | Query | Mes commandes |
| `order` | Query | Détail commande |
| `createOrder` | Mutation | Passer commande |
| `cancelOrder` | Mutation | Annuler commande |
| `myParcels` | Query | Mes colis |
| `createParcel` | Mutation | Créer un envoi |
| `myNotifications` | Query | Notifications |
| `unreadNotificationsCount` | Query | Badge notifications |
| `markNotificationAsRead` | Mutation | Marquer comme lu |
| `markAllNotificationsAsRead` | Mutation | Tout marquer lu |
| `trackDelivery` | Query | Suivi livraison (carte) |
| `createReview` | Mutation | Laisser un avis |
| `paymentByOrder` | Query | Statut paiement |

### OTP (public)

| Mutation | Description |
|----------|-------------|
| `requestOtp` | Envoi code SMS (Twilio Verify) |
| `verifyOtp` | Validation du code |

---

## REST — Upload d'images

```http
POST /uploads/image
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data

file: <binary>
```

**Réponse 201**

```json
{
  "url": "/uploads/1724678400000-a1b2c3.jpg",
  "originalName": "photo.jpg",
  "size": 245760,
  "mimeType": "image/jpeg"
}
```

**Types acceptés** : JPEG, PNG, WebP, GIF, SVG · **Max** : 5 Mo

---

## REST — Health Check

```http
GET /health
```

```json
{
  "status": "ok",
  "service": "biso-livraison-api",
  "version": "0.0.1",
  "timestamp": "2026-08-26T15:00:00.000Z"
}
```

---

## Pagination GraphQL

Les listes utilisent `PaginationArgs` :

```graphql
query {
  searchRestaurants(page: 1, limit: 20) {
    items { id name }
    pageInfo {
      totalItems
      totalPages
      currentPage
      hasNextPage
      hasPreviousPage
    }
  }
}
```

| Paramètre | Défaut | Max |
|-----------|--------|-----|
| `page` | 1 | — |
| `limit` | 20 | 100 |

---

## Codes d'erreur

| Code HTTP | Contexte | Signification |
|-----------|----------|---------------|
| `200` | GraphQL | Requête traitée (vérifier `errors[]`) |
| `401` | REST / GraphQL | Token absent ou invalide |
| `403` | GraphQL | Rôle insuffisant |
| `400` | REST upload | Fichier invalide |

Messages GraphQL courants :
- `Invalid credentials` → mauvais téléphone/mot de passe
- `Code invalide. Veuillez réessayer.` → OTP incorrect
- `Unique constraint failed on the fields: (phone)` → numéro déjà inscrit

---

## Fichiers de référence

| Fichier | Contenu |
|---------|---------|
| `docs/schema.graphql` | Schéma GraphQL SDL (auto-généré au démarrage) |
| `docs/openapi.json` | Spec OpenAPI REST (auto-généré au démarrage) |
| `docs/graphql-operations.md` | Liste opérations (script `docs:export-graphql`) |
| `docs/introspection.json` | Introspection brute |

---

## Sécurité

- Mots de passe hashés (bcrypt, cost 10)
- JWT signé (`JWT_SECRET`, expiration configurable)
- OTP via Twilio Verify (pas de code en clair en production)
- Validation stricte des entrées (`class-validator`, whitelist)
- Upload : types MIME vérifiés, noms de fichiers aléatoires
- Stack traces masquées en production

---

## Environnements

| Env | URL API | Swagger |
|-----|---------|---------|
| Dev local | `http://localhost:3001` | `http://localhost:3001/api/docs` |
| Dev réseau | `http://<IP>:3001` | idem |
| Production | TBD | Désactivé recommandé |

Pour l'app Expo en dev, l'URL est résolue automatiquement depuis l'IP Metro (`src/lib/api.ts`).
