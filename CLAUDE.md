# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start dev server (Turbopack)
npm run lint             # ESLint check
npm run typecheck        # TypeScript check
npm run lint && npm run typecheck  # REQUIRED after any code changes
npm run format           # Prettier format
npm run db:generate      # Regenerate Prisma client after schema changes
npm run db:migrate       # Run database migrations
npm run db:studio        # Open Prisma Studio GUI
```

**Database**: `docker compose up -d` to start PostgreSQL

## Architecture

### Multi-Platform Search System
The app provides unified search across YouTube, Instagram, and TikTok. Each platform has its own client in `src/lib/`:

- **YouTube** (`src/lib/youtube/`): Uses official googleapis SDK. Search, video details, channel info.
- **TikTok/Instagram** (`src/lib/rapidapi/`): Uses RapidAPI endpoints. Each has search, user lookup, and transform modules.

All platform clients follow the same pattern:
1. `client.ts` - API key retrieval (user DB → env fallback) with caching
2. `search.ts` - Search implementation
3. `transform.ts` - Normalize API responses to common types

### API Key Management
User API keys are stored encrypted (AES-256-GCM) in the database. The flow:
1. Check in-memory LRU cache (`src/lib/cache.ts`)
2. Fetch from DB and decrypt (`src/lib/crypto.ts`)
3. Fall back to environment variable

Required env secrets: `ENCRYPTION_SECRET`, `AUTH_SECRET`

### Content Repurposing Pipeline
`src/lib/repurpose/` handles AI-powered transcript rewriting:
1. `chunker.ts` - Splits long transcripts into processable chunks
2. `prompts.ts` - LLM prompts for repurposing and hook generation
3. `service.ts` - Orchestrates chunk processing via OpenRouter API

User selects their LLM model (stored in UserSettings). Hooks generation runs in parallel with chunk processing.

### Authentication
Invite-only system using NextAuth v5 (beta) with JWT sessions:
- Admin invites user → creates User record with invite token
- User sets password via token → account activated
- `src/lib/auth.ts` exports `{ auth, signIn, signOut, handlers }`

### Database
- Prisma with PostgreSQL via pg adapter (`src/lib/db.ts`)
- Generated client outputs to `src/generated/prisma/`
- Connection pooling: max 20 connections

Key models: `User`, `Search`, `SearchResult`, `Script`, `RepurposeVideo`, `ApiKey`

## Code Organization

```
src/app/api/{platform}/     # API routes by platform
src/lib/{platform}/         # Platform clients (youtube/, rapidapi/)
src/lib/repurpose/          # AI repurposing service
src/components/{feature}/   # Components grouped by feature, barrel exports
src/types/index.ts          # Shared TypeScript types
```

## Code Quality

After editing ANY file, run: `npm run lint && npm run typecheck`

Fix ALL errors/warnings before continuing.
