#!/usr/bin/env npx ts-node
/**
 * Exporte la documentation GraphQL depuis l'API en cours d'exécution.
 *
 * Usage :
 *   npm run docs:export-graphql
 *   API_URL=http://localhost:3001 npm run docs:export-graphql
 */
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';
const DOCS_DIR = join(process.cwd(), 'docs');

const INTROSPECTION = `
  query Introspection {
    __schema {
      queryType { name fields { name description args { name type { name kind ofType { name kind } } } } }
      mutationType { name fields { name description args { name type { name kind ofType { name kind } } } } }
    }
  }
`;

type Field = {
  name: string;
  description?: string;
  args: Array<{ name: string }>;
};

async function main() {
  const res = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: INTROSPECTION }),
  });

  if (!res.ok) {
    console.error(`Erreur HTTP ${res.status} — l'API est-elle démarrée sur ${API_URL} ?`);
    process.exit(1);
  }

  const json = (await res.json()) as {
    data?: {
      __schema: {
        queryType: { fields: Field[] };
        mutationType: { fields: Field[] };
      };
    };
    errors?: unknown[];
  };

  if (json.errors || !json.data) {
    console.error('Introspection GraphQL échouée :', json.errors);
    process.exit(1);
  }

  if (!existsSync(DOCS_DIR)) mkdirSync(DOCS_DIR, { recursive: true });

  const { queryType, mutationType } = json.data.__schema;

  const lines: string[] = [
    '# Référence GraphQL — généré automatiquement',
    '',
    `> Généré le ${new Date().toISOString()} depuis \`${API_URL}/graphql\``,
    '',
    '## Queries',
    '',
    '| Opération | Description |',
    '|-----------|-------------|',
  ];

  for (const field of queryType.fields.sort((a, b) => a.name.localeCompare(b.name))) {
    if (field.name.startsWith('__')) continue;
    lines.push(`| \`${field.name}\` | ${field.description ?? '—'} |`);
  }

  lines.push('', '## Mutations', '', '| Opération | Description |', '|-----------|-------------|');

  for (const field of mutationType.fields.sort((a, b) => a.name.localeCompare(b.name))) {
    lines.push(`| \`${field.name}\` | ${field.description ?? '—'} |`);
  }

  lines.push(
    '',
    '## Authentification',
    '',
    'Envoyer le header `Authorization: Bearer <accessToken>` pour les opérations protégées.',
    'Obtenir un token via la mutation `login`.',
    '',
  );

  writeFileSync(join(DOCS_DIR, 'graphql-operations.md'), lines.join('\n'));
  writeFileSync(
    join(DOCS_DIR, 'introspection.json'),
    JSON.stringify(json.data, null, 2),
  );

  console.log(`✓ docs/graphql-operations.md`);
  console.log(`✓ docs/introspection.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
