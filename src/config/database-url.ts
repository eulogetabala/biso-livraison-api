/**
 * Sélection de l'URL de base de données selon l'environnement.
 *
 * Objectif : que le projet fonctionne « par défaut » en local ET en ligne,
 * sans avoir à commenter/décommenter des variables à la main.
 *
 *  - production  → `DATABASE_URL` (injecté par Render / l'hébergeur)
 *  - développement → `DATABASE_URL_LOCAL` si défini, sinon `DATABASE_URL`
 *
 * Cette logique est partagée par l'application Nest (`configuration.ts`) et
 * par le CLI Prisma (`prisma.config.ts`) pour éviter toute divergence.
 */
export function resolveDatabaseUrl(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const isProduction = (env.NODE_ENV ?? 'development') === 'production';

  if (!isProduction && env.DATABASE_URL_LOCAL) {
    return env.DATABASE_URL_LOCAL;
  }

  return env.DATABASE_URL ?? '';
}
