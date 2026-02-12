# Environment: run locally and on the live server without changing code

The app uses **environment variables** for database, URLs, and secrets. You never need to edit code or swap lines in `.env` when switching between local and production.

## How it works

| Where you run | Where config lives | What you do |
|---------------|--------------------|-------------|
| **Local**     | `.env` + `.env.local` | Put shared keys in `.env`. Put **local-only** values in `.env.local` (e.g. local database URL, `http://localhost:3000`). Next.js loads `.env` then `.env.local`; `.env.local` overrides. |
| **Production**| Host environment (e.g. Vercel) | Set all variables in the host (Vercel → Settings → Environment Variables). No `.env` file on the server. |

So:

- **Local**: Use either **SQLite** (`DATABASE_URL="file:./dev.db"` in `.env.local`) or a dev Postgres URL. Use `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` = `http://localhost:3000` in `.env.local`. With `file:./dev.db`, Prisma automatically uses the SQLite schema; with a Postgres URL it uses the PostgreSQL schema.
- **Production**: Set `DATABASE_URL`, `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`, and all other secrets in Vercel (or your host). The same code runs; only the env values change.

## One-time setup

1. **Base env** (optional; you can keep your current `.env` for shared keys):
   ```bash
   cp .env.example .env
   ```
   Fill in API keys, `NEXTAUTH_SECRET`, etc. Do **not** put production `DATABASE_URL` here if you use `.env.local` for local.

2. **Local overrides** (so you never touch `.env` when switching):
   ```bash
   cp .env.local.example .env.local
   ```
   Edit `.env.local` and set:
   - `DATABASE_URL` = either **SQLite** (`"file:./dev.db"`) or your local/dev Postgres URL.
   - `NEXTAUTH_URL=http://localhost:3000`
   - `NEXT_PUBLIC_APP_URL=http://localhost:3000`

3. **Production**: In Vercel (or your host), add Environment Variables with your **production** `DATABASE_URL`, live `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL`, and all other secrets. See `DEPLOY_VERCEL.md` for the list.

## Summary

- **Local**: `.env` (shared) + `.env.local` (local DB + local URLs).  
- **Production**: Variables set in the host only.  
- **No code changes** and no swapping lines in `.env` when you run locally vs on the live server.
