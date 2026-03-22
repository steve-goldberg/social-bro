# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure — READ THIS FIRST

```
social-bro/
├── nextjs/          # ORIGINAL app (Next.js + Prisma) — READ-ONLY REFERENCE
├── sveltekit/       # MIGRATION TARGET — ALL new code goes here
│   ├── frontend/    # SvelteKit app
│   └── backend/     # TrailBase config and schema
├── docs/            # Framework reference docs
└── CLAUDE.md
```

### CRITICAL RULES — DO NOT VIOLATE

1. **`nextjs/` is READ-ONLY.** Never create, edit, or delete files in `nextjs/`. It exists solely as a reference for the original implementation. Read from it when you need to understand existing behavior.
2. **`sveltekit/` is where ALL new code goes.** Frontend code in `sveltekit/frontend/`, backend config in `sveltekit/backend/`. No exceptions.
3. **Never mix the two.** Do not import from `nextjs/` into `sveltekit/`. Do not write SvelteKit files into `nextjs/`. Do not create files at the repo root (except `CLAUDE.md`, `.gitignore`, docs).

## Original App Architecture (nextjs/ — read-only reference)

### Multi-Platform Search System
Unified search across YouTube, Instagram, and TikTok. Each platform has its own client in `nextjs/src/lib/`:

- **YouTube** (`nextjs/src/lib/youtube/`): googleapis SDK. Search, video details, channel info.
- **TikTok/Instagram** (`nextjs/src/lib/rapidapi/`): RapidAPI endpoints. Search, user lookup, transform.

All platform clients follow the same pattern:
1. `client.ts` - API key retrieval (user DB → env fallback) with caching
2. `search.ts` - Search implementation
3. `transform.ts` - Normalize API responses to common types

### API Key Management
User API keys stored encrypted (AES-256-GCM) in the database:
1. Check in-memory LRU cache (`nextjs/src/lib/cache.ts`)
2. Fetch from DB and decrypt (`nextjs/src/lib/crypto.ts`)
3. Fall back to environment variable

### Content Repurposing Pipeline
`nextjs/src/lib/repurpose/` handles AI-powered transcript rewriting:
1. `chunker.ts` - Splits long transcripts into processable chunks
2. `prompts.ts` - LLM prompts for repurposing and hook generation
3. `service.ts` - Orchestrates chunk processing via OpenRouter API

### Authentication (being replaced by TrailBase auth)
NextAuth v5 (beta) with JWT sessions. TrailBase native auth replaces this.

### Database (being replaced by TrailBase SQLite)
Prisma with PostgreSQL. Key models: `User`, `Search`, `SearchResult`, `Script`, `RepurposeVideo`, `ApiKey`

### Original Code Organization
```
nextjs/src/app/api/{platform}/     # API routes by platform
nextjs/src/lib/{platform}/         # Platform clients (youtube/, rapidapi/)
nextjs/src/lib/repurpose/          # AI repurposing service
nextjs/src/components/{feature}/   # Components grouped by feature
nextjs/src/types/index.ts          # Shared TypeScript types
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

## Commands (run from `sveltekit/frontend/`)

```bash
npm run dev              # Start SvelteKit dev server
npm run lint             # ESLint + svelte-check
npm run typecheck        # TypeScript check
npm run lint && npm run typecheck  # REQUIRED after any code changes
npm run format           # Prettier format
```

## Code Quality

After editing ANY file in `sveltekit/`, run from `sveltekit/frontend/`:
```bash
npm run lint && npm run typecheck
```
Fix ALL errors/warnings before continuing.
