# biso-livraison-api

API de livraison de repas — backend **NestJS** avec **GraphQL** (Apollo), **Prisma** et **PostgreSQL**.

## Stack

- **NestJS 11** — framework backend
- **GraphQL** (Apollo Server, code-first) — API
- **Prisma 7** + **PostgreSQL** — ORM et base de données
- **JWT** (Passport) — authentification
- **class-validator / class-transformer** — validation des entrées

## Modules

| Module | Description |
|---|---|
| `Users` | Création, listing et profil (`me`) |
| `Auth` | `login`, JWT, guards (`JwtAuthGuard`, `RolesGuard`) |
| `Restaurants` | CRUD restaurants |
| `Menus` | CRUD items de menu (catégories enum) |
| `Orders` | Création de commandes, calcul du total côté serveur, suivi de statut |
| `Deliveries` | Assignation livreur (rôle `DRIVER`), transitions de statut, synchro commande |

## Rôles

`CLIENT` · `DRIVER` · `PARTNER` · `ADMIN`

## Prérequis

- Node.js ≥ 20
- PostgreSQL en cours d'exécution (ou `docker compose up -d`)

## Installation

```bash
# 1. Variables d'environnement
cp .env.example .env

# 2. Dépendances
npm install

# 3. Base de données (si Docker)
docker compose up -d

# 4. Synchroniser le schéma Prisma
npx prisma db push
npx prisma generate

# 5. Lancer le serveur
npm run start:dev
```

L'API GraphQL est disponible sur **http://localhost:3001/graphql**.

## Scripts

| Commande | Description |
|---|---|
| `npm run start:dev` | Serveur de développement (watch) |
| `npm run build` | Compilation TypeScript |
| `npm run lint` | ESLint + Prettier |
| `npm test` | Tests unitaires |
| `npm run test:e2e` | Tests end-to-end |

## Workflow Git

- `main` — production
- `develop` — intégration
- `feature/<nom>` — une branche par fonctionnalité, issue de `develop`

## Variables d'environnement

| Variable | Description |
|---|---|
| `DATABASE_URL` | URL de connexion PostgreSQL |
| `JWT_SECRET` | Secret de signature des tokens |
| `JWT_REFRESH_SECRET` | Secret des refresh tokens |
| `PORT` | Port d'écoute (défaut 3001) |
