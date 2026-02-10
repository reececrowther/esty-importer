// Load .env from project root first so DATABASE_URL is set before Prisma is imported
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_USER_EMAIL || 'demo@example.com';
  const password = process.env.SEED_USER_PASSWORD || 'demo12345';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Seed user already exists:', email);
    return;
  }
  const passwordHash = await hash(password, 12);
  await prisma.user.create({
    data: { email, name: 'Demo User', passwordHash },
  });
  console.log('Seed user created:', email, '(password:', password, ')');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
