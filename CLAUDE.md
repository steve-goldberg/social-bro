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

## Framework Reference

### Svelte/SvelteKit Docs (local — `docs/svelte-docs.md`)

**IMPORTANT: This file is ~29,000 lines. NEVER read or grep the full file.**

1. **Read the index first**: `Read(file="docs/svelte-docs.md", limit=410)` — the first 410 lines are a structured table of contents with line numbers for every major section and inline topic lists.
2. **Jump to a section**: Find the `L<number>` in the index, then `Read(file="docs/svelte-docs.md", offset=<number>, limit=100)`.
3. **Find a specific topic**: `Grep(pattern="## <topic>", path="docs/svelte-docs.md")` to locate h2/h3 headings not individually listed in the index.

To rebuild the index after updating the docs: `node docs/build-doc-index.js docs/svelte-docs.md`

## TrailBase (Backend)

- Local docs index: `docs/trailbase/INDEX.md` (start here for navigation)
- GitHub releases (changelog): https://github.com/trailbaseio/trailbase/releases

### shadcn-svelte Docs (local — `docs/shadcn-svelte/`)

**IMPORTANT: Read the index first, then go directly to the specific file you need.**

1. **Start here**: `Read(file="docs/shadcn-svelte/INDEX.md")` — lists every doc file with descriptions.
2. **Read a component doc**: `Read(file="docs/shadcn-svelte/components/<name>.md")` — e.g. `dialog.md`, `data-table.md`.
3. **NEVER glob or grep across all docs/shadcn-svelte/ files** — the index tells you exactly which file to open.

Install components: `npx shadcn-svelte@next add <component>`
Installed components live in `src/lib/components/ui/`

## Code Quality

After editing ANY file, run: `npm run lint && npm run typecheck`

Fix ALL errors/warnings before continuing.
