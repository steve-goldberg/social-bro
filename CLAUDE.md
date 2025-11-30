# Social-Bro

A Next.js web application that enables users to search across multiple social media platforms (YouTube, Instagram, TikTok) with a unified search interface, platform selection, and search history.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API routes
│   │   └── youtube/search/ # YouTube search endpoint
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/             # React components
│   ├── preloader/          # Loading indicator
│   ├── search/             # Search UI components
│   │   ├── SearchInput.tsx
│   │   ├── PlatformSelector.tsx
│   │   ├── PreviousSearches.tsx
│   │   └── WelcomeHeader.tsx
│   └── ui/                 # Generic UI components
├── lib/                    # Utilities and API clients
│   ├── api.ts              # API utilities
│   ├── constants.ts        # App constants
│   ├── db.ts               # Database utilities
│   └── youtube/            # YouTube API client
│       ├── client.ts
│       ├── search.ts
│       ├── video.ts
│       └── channel.ts
└── types/                  # TypeScript definitions
    └── index.ts

prisma/
└── schema.prisma           # Database schema (PostgreSQL)

public/                     # Static assets
```

## Organization Rules

**Keep code organized and modularized:**
- API routes → `src/app/api/`, one folder per platform/resource
- Components → `src/components/`, grouped by feature
- Utilities → `src/lib/`, grouped by functionality
- Types → `src/types/` or co-located with usage
- Platform clients → `src/lib/{platform}/` (e.g., youtube/)

**Modularity principles:**
- Single responsibility per file
- Clear, descriptive file names
- Group related functionality together
- Use barrel exports (index.ts) for clean imports

## Code Quality - Zero Tolerance

After editing ANY file, run:

```bash
npm run lint && npm run typecheck
```

Fix ALL errors/warnings before continuing.

### Additional Commands

```bash
npm run format        # Format code with Prettier
npm run format:check  # Check formatting
npm run db:generate   # Generate Prisma client after schema changes
npm run db:migrate    # Run database migrations
```

### Server Restart

If changes require server restart (not hot-reloadable):
1. Restart server: `npm run dev`
2. Read server output/logs
3. Fix ALL warnings/errors before continuing
