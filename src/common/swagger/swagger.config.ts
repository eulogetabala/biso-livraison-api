import { DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';

/**
 * Configuration OpenAPI (Swagger) pour les endpoints REST.
 *
 * L’API métier principale est GraphQL (`POST /graphql`).
 * Swagger documente les endpoints REST complémentaires (health, uploads)
 * et sert de point d’entrée documentaire pour l’équipe mobile.
 *
 * Schéma GraphQL : `docs/schema.graphql`
 * Référence opérations : `docs/API.md`
 */
export function buildSwaggerDocument(): Omit<OpenAPIObject, 'paths'> {
  return new DocumentBuilder()
    .setTitle('Biso Livraison API')
    .setDescription(
      'API backend Biso Livraison — livraison de repas et colis au Congo.\n\n' +
        '## Surfaces API\n\n' +
        '| Surface | Endpoint | Usage |\n' +
        '|---------|----------|-------|\n' +
        '| **GraphQL** | `POST /graphql` | API principale (auth, commandes, restaurants, OTP…) |\n' +
        '| **REST** | `GET /health` | Supervision / health check |\n' +
        '| **REST** | `POST /uploads/image` | Upload d’images (JWT requis) |\n' +
        '| **Static** | `GET /uploads/*` | Fichiers uploadés |\n\n' +
        '### Authentification\n\n' +
        'Obtenir un token via la mutation GraphQL `login`, puis envoyer :\n' +
        '`Authorization: Bearer <accessToken>`\n\n' +
        '### Documentation GraphQL\n\n' +
        '- Schéma SDL : `docs/schema.graphql`\n' +
        '- Référence complète : `docs/API.md`\n' +
        '- Playground : `/graphql` (mode développement)\n',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT obtenu via la mutation GraphQL `login`',
      },
      'JWT',
    )
    .addTag('Health', 'Supervision et disponibilité du service')
    .addTag('Uploads', 'Upload de fichiers (images)')
    .addServer('http://localhost:3001', 'Développement local')
    .build();
}
