# Social-Bro

Search YouTube, TikTok & Instagram from one place. Find content, grab transcripts, repurpose scripts with AI.

## What It Does

- **Unified Search** — Query all three platforms at once, filter by creator with @username
- **Content Repurposing** — Extract YouTube transcripts and generate shorter versions for other platforms
- **Hook Generator** — AI-powered opening lines to grab attention
- **Search History** — Save and revisit your searches
- **Per-User Settings** — Encrypted API key storage, configurable LLM model selection

## Tech Stack

SvelteKit 2 · Svelte 5 · TrailBase (SQLite) · Tailwind CSS 4 · shadcn-svelte · Valibot · OpenRouter

## Prerequisites

- Node.js 18+
- Docker

## Local Development

```bash
# Start the backend (TrailBase + Mailpit for dev email)
cd backend
docker compose up -d

# Install frontend dependencies
cd ../frontend
npm install

# Set up env
cp .env.example .env
# Edit .env — generate secrets with: openssl rand -base64 32

# Start the dev server
npm run dev
```

Frontend: [localhost:5173](http://localhost:5173)
TrailBase admin: [localhost:4000](http://localhost:4000)
Mailpit (dev email): [localhost:8025](http://localhost:8025)

### First User Setup

1. Register at `/register`
2. Check Mailpit at `localhost:8025` for the verification email
3. Click the verification link
4. Log in at `/login`

## Project Structure

```
social-bro/
├── frontend/          # SvelteKit app
│   └── src/
│       ├── routes/    # Pages and API routes
│       └── lib/       # Platform clients, components, utilities
├── backend/           # TrailBase config, schema, migrations
│   ├── docker-compose.yml
│   └── traildepot/    # TrailBase data directory
└── docs/              # Reference docs and original Next.js app
```

## Scripts

Run from `frontend/`:

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint + svelte-check
npm run typecheck    # TypeScript check
npm run format       # Prettier format
```

## License

MIT
