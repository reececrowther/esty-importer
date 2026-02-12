# Etsy Importer

A SaaS-style web app for creating mockups and generating Etsy-optimized listings. Built with Next.js, with optional local-first setup for testing. The tool is **only accessible when logged in**; the public homepage explains the product and features.

## Features

- **Account-gated dashboard** — Sign up / log in to use the mockup and listing tools
- **Public homepage** — One-page marketing site (product overview, features, FAQ)
- Upload design images and PSD mockup files
- Automatically place designs into mockups (custom engine)
- Export finished mockup images (72–300 DPI)
- Generate Etsy-optimized content (title, description, SEO tags) using AI
- Etsy shop connection and listing upload (OAuth)

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + React + TypeScript
- **Backend**: Next.js API routes / Server Actions
- **Image Processing**: Photopea (embedded via iframe)
- **AI**: OpenRouter (or direct OpenAI) for listing generation
- **Storage**: Filesystem (local), abstracted for future S3 migration

## Requirements

- **Node.js 18** (LTS). The `canvas` package (used for PSD mockup processing) has pre-built binaries for Node 18. Node 22 is not yet fully supported on Windows.
- If you use [nvm](https://github.com/nvm-sh/nvm) (or nvm-windows): run `nvm use` in the project root to switch to Node 18 (see `.nvmrc`).

## Getting Started (local SaaS)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment variables (required for auth and DB):
   ```bash
   cp .env.example .env
   cp .env.local.example .env.local
   ```
   `.env` holds shared keys (API keys, `NEXTAUTH_SECRET`, etc.). `.env.local` holds **local-only** values (database URL, local URLs) so you never have to change code or swap config when switching between local and the live server. See **ENV.md** for details.

3. Configure `.env` and `.env.local`:
   - **`.env`**: Set `NEXTAUTH_SECRET` (e.g. `openssl rand -base64 32`), AI keys (`OPENROUTER_API_KEY` or `OPENAI_API_KEY`), and any other shared keys. Do not put production `DATABASE_URL` here if you use `.env.local` for local.
   - **`.env.local`**: Set `DATABASE_URL` to **`"file:./dev.db"`** for local SQLite, or to a local/dev Postgres URL. Set `NEXTAUTH_URL=http://localhost:3000` and `NEXT_PUBLIC_APP_URL=http://localhost:3000`.
   - **AI listings**: Use **OpenRouter** (recommended) — set `OPENROUTER_API_KEY` and optionally `OPENROUTER_MODEL`. Or use **OpenAI**: `OPENAI_API_KEY=your_key_here`.
   - **Etsy** (optional): Add Etsy API keys if you use shop connection (see `ETSY_SETUP.md`).

4. Create the database and seed a demo user (optional):
   ```bash
   npx prisma db push
   npm run db:seed
   ```
   Default seed user: `demo@example.com` / `demo12345`. Override with `SEED_USER_EMAIL` and `SEED_USER_PASSWORD`.

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000). Use the homepage to learn about the product; **Log in** or **Sign up** to access the **Dashboard** (mockup generator and listing tools).

**Running locally and on the live server:** Use `.env.local` for local database and URLs; set the same variables in your host (e.g. Vercel) for production. You never need to change code or swap `.env` lines. See **ENV.md** for details.

## Project Structure

```
/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── (routes)/          # Page routes
│   └── layout.tsx         # Root layout
├── components/             # React components
│   ├── ui/                # UI components
│   └── photopea/          # Photopea integration components
├── lib/                    # Utilities and helpers
├── services/               # Business logic services
│   ├── mockupService.ts   # Mockup processing logic
│   ├── aiListingService.ts # AI content generation
│   └── etsyService.ts     # Etsy API integration
├── types/                  # TypeScript type definitions
└── uploads/                # Local file storage (gitignored)
```

## Architecture

The application follows a modular service architecture:

- **mockupService**: Handles PSD loading, Photopea operations, and image export
- **aiListingService**: Generates Etsy-optimized content using OpenRouter or OpenAI
- **etsyService**: Manages Etsy API interactions (stubbed for MVP)

All services are designed to be easily migrated to a multi-user SaaS architecture with:
- Database-backed job queues
- Cloud storage (S3-compatible)
- Authentication and authorization
- Rate limiting and usage tracking

## Mockup Engine

The application uses a **custom mockup engine** by default. The engine architecture is modular, allowing you to:

- Process mockups server-side via API (`/api/mockup/process`)
- Process mockups client-side in the browser
- Swap between different engines (custom, Photopea, etc.)

### Custom Engine Implementation

To implement your custom engine:

1. **Server-side processing** (recommended): Edit `app/api/mockup/process/route.ts`
   - Add your PSD parsing library (e.g., `ag-psd`, `psd.js-node`)
   - Implement Smart Object layer finding and replacement
   - Use image processing libraries (e.g., `sharp`, `jimp`, `canvas`)
   - Export the final composite image

2. **Client-side processing**: Edit `components/mockupEngine/CustomMockupEngine.tsx`
   - Implement processing logic in the `processClientSide` method
   - Use browser APIs (Canvas, WebAssembly) or libraries

### Smart Object Layer Names

The engine tries multiple layer names in order:
- `YOUR DESIGN HERE`
- `Design Here`
- `Design`

You can customize this list in the component options.

### Photopea Integration (Alternative)

Photopea integration is available but not active by default. To use it:
- Uncomment `PhotopeaContainer` import in `app/page.tsx`
- Replace `CustomMockupEngine` with `PhotopeaContainer`

**Note**: Photopea's automation API is not fully documented and may require adjustments.

## Future SaaS Scaling

The codebase includes comments marking where SaaS scaling would occur:
- Job queue system for async processing
- Database for user/job tracking
- Cloud storage abstraction
- Authentication middleware
- Rate limiting and quotas

## License

MIT
