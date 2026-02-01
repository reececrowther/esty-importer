# Architecture Notes

## Service Architecture

The application follows a clean separation of concerns with three main services:

### mockupService
- **Purpose**: Orchestrates mockup processing workflow
- **Current**: Client-side Photopea integration
- **SaaS Migration**: Would become a job queue processor (Bull/BullMQ) with workers

### aiListingService
- **Purpose**: Generates Etsy-optimized content using OpenAI
- **Current**: Direct API calls with rate limiting handled by OpenAI
- **SaaS Migration**: Add user-level rate limiting, caching, usage tracking

### etsyService
- **Purpose**: Manages Etsy API interactions
- **Current**: Stubbed for MVP
- **SaaS Migration**: OAuth token management per user, webhook handling

## Storage Abstraction

The `lib/storage.ts` module provides a storage adapter interface that can be swapped:
- **Current**: FilesystemStorage (local development)
- **Future**: S3Storage or other cloud storage adapters

All file operations go through this abstraction, making cloud migration straightforward.

## Photopea Integration Challenges

Photopea's automation API is not fully documented. The current implementation:

1. Embeds Photopea via iframe
2. Uses postMessage for communication
3. Injects scripts to automate PSD processing

**Known Limitations**:
- Smart Object layer names must match exactly (default: "Design")
- PSD structure assumptions may not work for all files
- Script execution timing may need adjustment

**Recommendations for Production**:
- Test with various PSD structures
- Add layer name configuration UI
- Implement fallback methods
- Consider headless browser automation as alternative

## Job Processing Flow (Future SaaS)

Current flow is synchronous and client-side. For SaaS:

1. User uploads files → API stores in cloud storage
2. API creates job record in database
3. Job enqueued to Redis/Bull queue
4. Worker picks up job:
   - Loads files from cloud storage
   - Processes via Photopea (headless browser or API)
   - Saves results to cloud storage
   - Updates job status
5. WebSocket/SSE notifies user of completion
6. User downloads results

## API Routes

- `/api/upload` - File upload handler
- `/api/files/[...path]` - File serving (local) / CDN redirect (SaaS)
- `/api/generate-listing` - AI content generation
- `/api/etsy/upload` - Etsy listing upload (stubbed)

## Environment Variables

See `.env.example` for required configuration:
- `OPENAI_API_KEY` - Required for AI generation
- `ETSY_API_KEY` - Optional, for Etsy integration
- `STORAGE_TYPE` - Storage adapter type
- `STORAGE_PATH` - Local storage path

## Scaling Considerations

### Database
- User accounts and authentication
- Job tracking and status
- Usage metrics and billing

### Queue System
- Redis for job queue
- Bull/BullMQ for job processing
- Retry logic and error handling

### Storage
- S3-compatible storage for files
- CDN for image delivery
- Lifecycle policies for cleanup

### Authentication
- NextAuth.js or similar
- OAuth for Etsy integration
- API key management

### Rate Limiting
- Per-user limits for AI generation
- Per-user limits for processing
- Etsy API rate limits
