# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

**Social Bro** is a multi-platform social media search and content repurposing tool. Users search YouTube, Instagram, and TikTok from a single interface, save results, extract video transcripts, and use AI (via OpenRouter) to repurpose transcripts into new written content with generated hooks.

### Tech Stack

SvelteKit 2 · Svelte 5 · TrailBase (SQLite) · Tailwind CSS 4 · shadcn-svelte · Valibot · OpenRouter

## Repository Structure

```
social-bro/
├── frontend/            # SvelteKit app
│   ├── src/
│   │   ├── routes/      # Pages and API routes (+page.svelte, +server.ts)
│   │   └── lib/         # Shared code ($lib/), components, platform clients, utils
│   ├── static/          # Static assets
│   └── package.json
├── backend/             # TrailBase config (docker-compose.yml, schema, migrations)
│   ├── docker-compose.yml
│   └── traildepot/      # TrailBase data directory
├── docs/                # Framework reference docs
│   ├── nextjs/          # Original Next.js app (read-only reference)
│   ├── svelte-docs.md   # Svelte/SvelteKit reference (~29k lines)
│   ├── shadcn-svelte/   # shadcn-svelte component docs
│   ├── trailbase/       # TrailBase docs
│   ├── auth.md          # Auth setup guide
│   └── plans/           # Migration plans (historical)
└── CLAUDE.md
```

### Rules

1. **`docs/nextjs/` is READ-ONLY.** It exists solely as a reference for the original implementation.
2. **`frontend/` and `backend/` are where ALL code goes.** No exceptions.
3. **Do not import from `docs/nextjs/`** into `frontend/`.

## Architecture

### Multi-Platform Search
Each platform has its own client in `frontend/src/lib/`:

- **YouTube** (`frontend/src/lib/youtube/`): Search, video details, channel info
- **TikTok** (`frontend/src/lib/rapidapi/tiktok/`): RapidAPI. Search, user lookup, transform
- **Instagram** (`frontend/src/lib/rapidapi/instagram/`): RapidAPI. Search, user lookup, transform
- **Transcripts** (`frontend/src/lib/rapidapi/youtube-transcript-fast/`): RapidAPI fast transcript extraction

All platform clients follow the same pattern:
1. `client.ts` — API key retrieval (user DB → env fallback) with LRU caching
2. `search.ts` — Search implementation
3. `transform.ts` — Normalize API responses to common types

### API Key Management
User API keys stored encrypted (AES-256-GCM) in TrailBase (SQLite):
1. Check in-memory LRU cache (`frontend/src/lib/cache.ts`)
2. Fetch from DB and decrypt (`frontend/src/lib/crypto.ts`)
3. Fall back to environment variable

### Content Repurposing Pipeline
`frontend/src/lib/repurpose/` handles AI-powered transcript rewriting via OpenRouter:
1. `chunker.ts` — Splits long transcripts into processable chunks
2. `prompts.ts` — LLM prompts for repurposing and hook generation
3. `service.ts` — Orchestrates chunk processing

User selects their LLM model (stored in settings). Hooks generation runs in parallel with chunk processing.

### Authentication
TrailBase native auth with email verification:
- Register → email verification via TrailBase SMTP → login
- JWT sessions via TrailBase client SDK
- Auth utilities in `frontend/src/lib/server/auth.ts` and `frontend/src/lib/auth-utils.ts`
- Dev email testing via Mailpit (see `backend/docker-compose.yml`)

### Database
TrailBase with SQLite — auto-generated REST APIs from schema.
- Config: `backend/traildepot/config.textproto`
- Migrations: `backend/migrations/`

### Routes
```
frontend/src/routes/
├── +page.svelte              # Main search/repurpose page
├── (auth)/login/             # Login
├── (auth)/register/          # Registration
├── (auth)/verify-email/      # Email verification
└── admin/                    # Admin page
```

### API Routes
```
frontend/src/routes/api/
├── youtube/                  # YouTube search, video details, channel info
├── tiktok/                   # TikTok search, user lookup
├── instagram/                # Instagram search, user lookup
├── transcript/               # YouTube transcript extraction
├── repurpose/                # AI content repurposing
├── scripts/                  # Saved scripts CRUD
├── hooks/                    # Hook generation
├── searches/                 # Search history
└── settings/                 # User settings and API keys
```

## Framework Reference

### Svelte/SvelteKit Docs (`docs/svelte-docs.md`)

**IMPORTANT: ~29,000 lines. NEVER read or grep the full file.**

1. **Read the index first**: `Read(file="docs/svelte-docs.md", limit=410)` — structured TOC with line numbers.
2. **Jump to a section**: `Read(file="docs/svelte-docs.md", offset=<number>, limit=100)`.
3. **Find a topic**: `Grep(pattern="## <topic>", path="docs/svelte-docs.md")`.

Rebuild index: `node docs/build-doc-index.js docs/svelte-docs.md`

### TrailBase Docs

- Local index: `docs/trailbase/INDEX.md`
- GitHub releases: https://github.com/trailbaseio/trailbase/releases

### shadcn-svelte Docs (`docs/shadcn-svelte/`)

1. **Start here**: `Read(file="docs/shadcn-svelte/INDEX.md")`
2. **Component doc**: `Read(file="docs/shadcn-svelte/components/<name>.md")`
3. **NEVER glob/grep across all files** — use the index.

Install components: `npx shadcn-svelte@next add <component>`
Components live in `frontend/src/lib/components/ui/`

## Commands (run from `frontend/`)

```bash
npm run dev              # Start SvelteKit dev server
npm run build            # Production build
npm run lint             # ESLint + svelte-check
npm run typecheck        # TypeScript check
npm run lint && npm run typecheck  # REQUIRED after any code changes
npm run format           # Prettier format
```

## Code Quality

After editing ANY file, run from `frontend/`:
```bash
npm run lint && npm run typecheck
```
Fix ALL errors/warnings before continuing.
