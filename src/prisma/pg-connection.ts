import type { PoolConfig } from 'pg';

/**
 * Construit la configuration du pool `pg` à partir de `DATABASE_URL`.
 *
 * Pourquoi ce helper ?
 * - `pg@8` s'appuie sur `pg-connection-string` v2, qui émet un avertissement
 *   de sécurité et aliase `sslmode=prefer|require|verify-ca` sur `verify-full`.
 * - On lit donc explicitement `sslmode`/`uselibpqcompat`, on le retire de la
 *   chaîne de connexion (ce qui supprime l'avertissement) et on traduit la
 *   sémantique libpq en options `ssl` natives de `pg`.
 *
 * Référence : https://www.postgresql.org/docs/current/libpq-ssl.html
 */
export type PgSslMode =
  | 'disable'
  | 'allow'
  | 'prefer'
  | 'require'
  | 'verify-ca'
  | 'verify-full';

export interface PoolOptions {
  connectionString: string;
  ssl: PoolConfig['ssl'];
}

const SSL_MODES: ReadonlySet<string> = new Set<PgSslMode>([
  'disable',
  'allow',
  'prefer',
  'require',
  'verify-ca',
  'verify-full',
]);

/**
 * Mappe un `sslmode` libpq vers l'option `ssl` de `pg`.
 *
 * libpq :
 *  - disable        : pas de TLS
 *  - allow / prefer : TLS opportuniste, sans vérification du certificat
 *  - require        : TLS obligatoire, sans vérification du certificat
 *  - verify-ca      : TLS + vérification de la CA (pas du hostname)
 *  - verify-full    : TLS + vérification CA + hostname
 */
function sslOptionsFor(mode: PgSslMode): PoolConfig['ssl'] {
  switch (mode) {
    case 'disable':
      return false;
    case 'verify-ca':
    case 'verify-full':
      // pg vérifie systématiquement le hostname quand rejectUnauthorized=true ;
      // c'est strictement sûr (>= libpq verify-ca).
      return { rejectUnauthorized: true };
    case 'allow':
    case 'prefer':
    case 'require':
    default:
      // Chiffrement sans validation du certificat (sémantique libpq).
      return { rejectUnauthorized: false };
  }
}

/**
 * Normalise une `DATABASE_URL` pour `pg` :
 * - retire `sslmode` et `uselibpqcompat` de la query string ;
 * - renvoie une option `ssl` explicite et déterministe.
 *
 * Si aucun `sslmode` n'est fourni, le comportement `pg` par défaut est conservé
 * (pas de TLS sur un socket local, TLS si le serveur l'exige via sslmode absent).
 */
export function buildPoolOptions(connectionString: string): PoolOptions {
  let parsed: URL;
  try {
    parsed = new URL(connectionString);
  } catch {
    // Chaîne non-URL (ex. config par variables séparées) : on la laisse telle quelle.
    return { connectionString, ssl: undefined };
  }

  const rawMode = parsed.searchParams.get('sslmode')?.toLowerCase() ?? null;
  const libpqCompat =
    parsed.searchParams.get('uselibpqcompat')?.toLowerCase() === 'true';

  if (rawMode !== null) {
    parsed.searchParams.delete('sslmode');
  }
  if (parsed.searchParams.has('uselibpqcompat')) {
    parsed.searchParams.delete('uselibpqcompat');
  }

  if (rawMode === null || !SSL_MODES.has(rawMode)) {
    // Pas de sslmode explicite : ne pas forcer TLS (comportement pg par défaut).
    return { connectionString: parsed.toString(), ssl: undefined };
  }

  let mode = rawMode as PgSslMode;

  // Rétrocompatibilité : sans `uselibpqcompat=true`, pg v2 aliase ces modes
  // sur `verify-full`. On reproduit ce comportement pour ne rien casser.
  if (!libpqCompat && (mode === 'prefer' || mode === 'require' || mode === 'verify-ca')) {
    mode = 'verify-full';
  }

  return { connectionString: parsed.toString(), ssl: sslOptionsFor(mode) };
}
