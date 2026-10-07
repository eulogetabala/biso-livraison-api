import 'dotenv/config';
import { defineConfig } from 'prisma/config';
import { resolveDatabaseUrl } from './src/config/database-url';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    // Même sélection que l'app : local = Docker, prod = DATABASE_URL.
    url: resolveDatabaseUrl(),
  },
});
