# Esty Importer

A local-first web application for creating mockups and generating Etsy-optimized listings. Built with Next.js, Photopea integration, and AI-powered content generation.

## Features

- Upload design images and PSD mockup files
- Automatically place designs into mockups using Photopea
- Export finished mockup images
- Generate Etsy-optimized content (title, description, SEO tags) using AI
- Optional Etsy API integration (stubbed for MVP)

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + React + TypeScript
- **Backend**: Next.js API routes / Server Actions
- **Image Processing**: Photopea (embedded via iframe)
- **AI**: OpenAI API
- **Storage**: Filesystem (local), abstracted for future S3 migration

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Add your OpenAI API key to `.env`:
```
OPENAI_API_KEY=your_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

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
- **aiListingService**: Generates Etsy-optimized content using OpenAI
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
