// Upgrade a user to Plus by email.
// Usage: npx ts-node -P prisma/tsconfig.json prisma/upgrade-plus.ts your@email.com
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: npx ts-node -P prisma/tsconfig.json prisma/upgrade-plus.ts <email>');
    process.exit(1);
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error('User not found:', email);
    process.exit(1);
  }
  if (user.tier === 'PLUS') {
    console.log('User already has Plus:', email);
    return;
  }
  await prisma.user.update({
    where: { email },
    data: { tier: 'PLUS' },
  });
  console.log('Upgraded to Plus:', email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
