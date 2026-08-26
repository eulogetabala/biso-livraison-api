# Contributing — Biso Livraison Backend

## Workflow Git

```
main          ← production (tags semver)
  ↑
develop       ← intégration continue
  ↑
feature/*     ← une branche par fonctionnalité
```

### Créer une feature

```bash
git checkout develop
git pull origin develop
git checkout -b feature/nom-court-descriptif
# ... développement ...
npm run lint
npm run test
npm run test:e2e
git push -u origin feature/nom-court-descriptif
# → Pull Request vers develop
```

### Conventions de nommage

| Type | Format | Exemple |
|------|--------|---------|
| Feature | `feature/<nom>` | `feature/api-documentation-and-e2e-tests` |
| Fix | `fix/<nom>` | `fix/otp-verification-expired` |
| Hotfix prod | `hotfix/<nom>` | `hotfix/jwt-expiration` |

### Messages de commit

Format impératif, en français ou anglais (cohérent par PR) :

```
feat(auth): ajouter vérification OTP Twilio Verify
fix(orders): corriger calcul frais de livraison
docs(api): documenter endpoints GraphQL mobile
test(e2e): couvrir flux inscription complet
chore(deps): mettre à jour @nestjs/swagger
```

---

## Checklist PR

- [ ] Branche issue de `develop`
- [ ] `npm run lint` sans erreur
- [ ] `npm run test` passe
- [ ] `npm run test:e2e` passe (PostgreSQL requis)
- [ ] Documentation mise à jour si API modifiée
- [ ] Pas de secrets dans le code (`.env` gitignoré)
- [ ] Migration Prisma si schéma modifié

---

## Tests

```bash
# Unitaires
npm test

# End-to-end (DB PostgreSQL requise)
docker compose up -d
npx prisma db push
npm run test:e2e

# Export documentation
npm run docs:export-graphql   # API doit tourner
```

---

## Documentation API

| Fichier | Génération |
|---------|------------|
| `docs/API.md` | Manuel (maintenu par l'équipe) |
| `docs/schema.graphql` | Auto au `npm run start:dev` |
| `docs/openapi.json` | Auto au démarrage serveur |
| `docs/graphql-operations.md` | `npm run docs:export-graphql` |

Swagger UI : http://localhost:3001/api/docs

---

## Architecture

- **GraphQL** = API principale (app mobile)
- **REST** = endpoints complémentaires (health, uploads)
- **Prisma** = accès PostgreSQL
- **Modules NestJS** = un module par domaine métier

Voir `README.md` pour l'installation et la stack complète.
