# Deploy Esty Importer to Vercel (live demo URL)

Follow these steps to get a live URL (e.g. `https://your-app.vercel.app`) for your app.

---

## 1. Push your code to GitHub

Vercel deploys from Git. If you haven’t already:

- Create a repo on GitHub and push your project.
- Do **not** commit `.env` (it’s in `.gitignore`). You’ll add secrets in Vercel.

---

## 2. Switch the database to PostgreSQL

Vercel is serverless and has no persistent disk, so SQLite won’t work in production. Use a hosted Postgres (e.g. Neon, free tier).

### 2a. Create a Postgres database

- Go to [neon.tech](https://neon.tech) and create a free account and project.
- Copy the **connection string** (e.g. `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`).

### 2b. Point Prisma at Postgres

In `prisma/schema.prisma`, change the datasource to use PostgreSQL:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Remove or comment out the old `provider = "sqlite"` line.

### 2c. Apply the schema and generate the client

Locally (with `DATABASE_URL` set to your Neon URL in `.env`):

```bash
npx prisma db push
npx prisma generate
```

Commit the `schema.prisma` change and push.

---

## 3. Add Vercel Blob storage (for uploads)

Uploads can’t use the filesystem on Vercel. The app supports **Vercel Blob** via `STORAGE_TYPE=vercel_blob`.

- In the [Vercel Dashboard](https://vercel.com/dashboard), open your project (you’ll create it in the next step).
- Go to **Storage** → **Create Database/Store** → **Blob**.
- Create a Blob store. Vercel will add `BLOB_READ_WRITE_TOKEN` to your project env.

No code changes needed; the app already supports `vercel_blob` when this env var is set.

---

## 4. Create the Vercel project and deploy

1. Go to [vercel.com](https://vercel.com) and sign in (e.g. with GitHub).
2. **Add New** → **Project** and import your GitHub repo.
3. Leave **Framework Preset** as Next.js and **Root Directory** as `.`
4. Click **Deploy**. The first deploy may fail until env vars are set; that’s OK.

---

## 5. Set environment variables in Vercel

In the project: **Settings** → **Environment Variables**. Add these for **Production** (and Preview if you want):

| Variable | Example / notes |
|----------|------------------|
| `DATABASE_URL` | Your Neon Postgres URL (e.g. `postgresql://...?sslmode=require`) |
| `NEXTAUTH_SECRET` | Generate: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your live URL, e.g. `https://your-app.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | Same as `NEXTAUTH_URL` |
| `STORAGE_TYPE` | `vercel_blob` |
| `BLOB_READ_WRITE_TOKEN` | Set automatically if you created the Blob store in the same project; otherwise paste from Storage → your Blob store |
| `OPENROUTER_API_KEY` or `OPENAI_API_KEY` | Your AI API key (for listing generation) |
| `ETSY_API_KEY` | Etsy app API key (optional for demo) |
| `ETSY_SHARED_SECRET` | Etsy app secret (optional) |

Optional for a minimal demo: you can leave Stripe and Etsy vars unset if you’re not testing payments or Etsy yet.

---

## 6. Redeploy and run migrations

After saving env vars:

1. **Deployments** → open the latest deployment → **Redeploy** (or push a new commit).
2. The build runs `prisma generate` (from your `build` script). For a fresh DB, run migrations once. Either:
   - In **Settings** → **General** → **Build & Development Settings**, set **Build Command** to:  
     `prisma generate && prisma db push && next build`  
     so each deploy runs `prisma db push`, or  
   - Run locally: `DATABASE_URL="your-neon-url" npx prisma db push`  
     then redeploy (schema is already applied).

---

## 7. Update Etsy OAuth redirect (if you use Etsy)

In your Etsy app settings, add your live callback URL:

- `https://your-app.vercel.app/api/etsy/callback`

Use your real Vercel URL instead of `your-app.vercel.app`.

---

## Checklist

- [ ] Code on GitHub
- [ ] `prisma/schema.prisma` uses `provider = "postgresql"` and `DATABASE_URL` is a Postgres URL
- [ ] Neon (or other) Postgres created and `DATABASE_URL` set in Vercel
- [ ] Blob store created in Vercel; `BLOB_READ_WRITE_TOKEN` set (or auto-added)
- [ ] `STORAGE_TYPE=vercel_blob` in Vercel
- [ ] `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL` set in Vercel
- [ ] AI API key set (`OPENROUTER_API_KEY` or `OPENAI_API_KEY`)
- [ ] Redeploy after env changes; DB schema applied (`prisma db push` or migration)

Your live demo URL is the Vercel deployment URL (e.g. `https://your-app.vercel.app`).
