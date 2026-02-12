/**
 * Run Prisma (generate or db push) with the schema that matches DATABASE_URL.
 * - DATABASE_URL starting with "file:" -> prisma/schema.sqlite.prisma (local SQLite)
 * - Otherwise -> prisma/schema.prisma (PostgreSQL, e.g. production)
 * Loads .env and .env.local so local overrides are applied.
 */

const path = require('path');
const { execSync } = require('child_process');

// Load env (same order as Next.js: .env then .env.local; .env.local overrides)
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local'), override: true });

const dbUrl = process.env.DATABASE_URL || '';
const useSqlite = dbUrl.startsWith('file:');
const schemaPath = useSqlite
  ? path.join('prisma', 'schema.sqlite.prisma')
  : path.join('prisma', 'schema.prisma');

const command = process.argv[2] || 'generate'; // "generate" | "push"

// Always run generate so @prisma/client matches the chosen schema
execSync(`npx prisma generate --schema=${schemaPath}`, {
  stdio: 'inherit',
  cwd: process.cwd(),
});

if (command === 'push') {
  execSync(`npx prisma db push --schema=${schemaPath}`, {
    stdio: 'inherit',
    cwd: process.cwd(),
  });
}
