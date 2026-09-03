import 'dotenv/config';
import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { SEED_IDS } from '../prisma/seed-data';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('render.com')
    ? { rejectUnauthorized: false }
    : undefined,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

async function main() {
  const password = process.env.ADMIN_PASSWORD ?? 'Admin123!';
  const phone = process.env.ADMIN_PHONE ?? '+242065644299';
  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { phone },
    create: {
      id: SEED_IDS.admin,
      firstName: 'Admin',
      lastName: 'Biso',
      phone,
      email: 'admin@biso.cg',
      password: passwordHash,
      role: UserRole.ADMIN,
      phoneVerified: true,
    },
    update: {
      firstName: 'Admin',
      lastName: 'Biso',
      password: passwordHash,
      role: UserRole.ADMIN,
      phoneVerified: true,
    },
  });

  console.log(`Admin prêt : ${admin.phone} (role ${admin.role})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
