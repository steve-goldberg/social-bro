# Social-Bro Architecture Documentation

This document explains how the Social-Bro application works, covering both frontend and backend architecture, and includes an assessment of rewriting it in SvelteKit.

---

## Table of Contents

1. [Overview](#overview)
2. [Backend Architecture](#backend-architecture)
3. [Frontend Architecture](#frontend-architecture)
4. [Database Schema](#database-schema)
5. [External API Integrations](#external-api-integrations)
6. [SvelteKit Migration Assessment](#sveltekit-migration-assessment)

---

## Overview

Social-Bro is a Next.js 16 application that enables unified search across YouTube, TikTok, and Instagram. It features content repurposing with AI-powered transcript rewriting and hook generation.

**Tech Stack:**
- **Frontend:** React 19, Next.js 16 (App Router), TailwindCSS 4
- **Backend:** Node.js (via Next.js API routes), Prisma ORM
- **Database:** PostgreSQL
- **Auth:** NextAuth v5 (JWT strategy)
- **External APIs:** YouTube Data API, RapidAPI (TikTok/Instagram), OpenRouter (LLM)

---

## Backend Architecture

### Q: Is it Prisma or Node.js handling the backend?

**A: Both work together in different roles:**

### Node.js (via Next.js API Routes)

Handles the application logic layer:

- **HTTP Request/Response** - Receives requests, sends responses
- **Authentication** - Validates JWT tokens, checks user sessions
- **Business Logic** - Data transformation, validation, error handling
- **External API Calls** - YouTube, RapidAPI, OpenRouter integrations
- **Streaming** - Server-Sent Events for long-running operations

**Location:** `src/app/api/*/route.ts`

### Prisma ORM

Handles the data access layer:

- **Database Queries** - Type-safe CRUD operations
- **Schema Definition** - Models, relations, indexes
- **Migrations** - Database schema versioning
- **Connection Pooling** - Efficient database connections

**Location:** `prisma/schema.prisma`, `src/lib/db.ts`

### Request Flow Example

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Browser   │────▶│  Next.js API     │────▶│  External API   │
│             │     │  Route Handler   │     │  (YouTube, etc) │
└─────────────┘     └────────┬─────────┘     └─────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  Auth Check    │
                    │  (NextAuth)    │
                    └────────┬───────┘
                             │
                             ▼
                    ┌────────────────┐
                    │    Prisma      │
                    │  (Database)    │
                    └────────────────┘
```

### API Routes (23 total)

| Route | Purpose |
|-------|---------|
| `/api/auth/[...nextauth]` | NextAuth authentication handler |
| `/api/auth/set-password` | Password setup for invited users |
| `/api/youtube/search` | YouTube video search |
| `/api/youtube/channel` | Channel video listing |
| `/api/youtube/videos` | Video details |
| `/api/youtube/config` | User's YouTube preferences |
| `/api/tiktok/search` | TikTok video search |
| `/api/tiktok/user` | TikTok user info |
| `/api/tiktok/user/username` | TikTok user by username |
| `/api/instagram/search` | Instagram search |
| `/api/instagram/user/username` | Instagram user reels |
| `/api/saved` | Saved searches (GET/POST/DELETE) |
| `/api/settings` | API key management |
| `/api/user-settings` | User preferences (LLM model) |
| `/api/repurpose` | Repurpose video list |
| `/api/repurpose-url` | Transcript extraction + repurposing (SSE) |
| `/api/scripts` | Script management |
| `/api/scripts/[id]/repurpose` | Repurpose a specific script |
| `/api/scripts/[id]/regenerate-hooks` | Regenerate hooks for script |
| `/api/transcript` | Extract video transcript |
| `/api/llm-models` | Available LLM models from OpenRouter |
| `/api/admin/invite` | Admin user invitation |
| `/api/health` | Health check endpoint |

### Security Implementation

| Feature | Implementation |
|---------|----------------|
| Password Hashing | bcrypt (default 10 rounds) |
| API Key Storage | AES-256-GCM encryption |
| Session Management | JWT tokens via NextAuth |
| User Isolation | All queries filtered by userId |
| SQL Injection | Prevented by Prisma parameterized queries |

---

## Frontend Architecture

### Component Structure

```
src/components/
├── auth/
│   ├── AuthForm.tsx        # Login form
│   └── UserMenu.tsx        # User session menu
├── search/
│   ├── SearchInput.tsx     # Main search input
│   ├── PlatformSelector.tsx # YouTube/TikTok/Instagram tabs
│   ├── PreviousSearches.tsx # Search history
│   └── WelcomeHeader.tsx   # Title/branding
├── data-table/
│   ├── DataTable.tsx       # TanStack React Table wrapper
│   └── columns.tsx         # Column definitions
├── settings/
│   └── SettingsModal.tsx   # API key management
├── youtube/
│   └── YouTubeConfigModal.tsx # YouTube search config
├── preloader/
│   └── PreLoader.tsx       # Initial loading animation
├── processing-loader/
│   └── ProcessingLoader.tsx # Progress indicator
├── providers/
│   └── SessionProvider.tsx # NextAuth session wrapper
└── ui/
    ├── Table.tsx           # Base table components
    └── Skeleton.tsx        # Loading skeleton
```

### State Management

**Pattern:** React Hooks (no Redux/Zustand)

The main page (`src/app/page.tsx`) manages state with:
- 39 `useState` calls
- 8+ `useCallback` memoized handlers
- 3+ `useMemo` computed values
- 6+ `useEffect` side effects

**Key State Categories:**
```typescript
// Search state
const [searchQuery, setSearchQuery] = useState('');
const [selectedPlatform, setSelectedPlatform] = useState<Platform>('youtube');
const [tableData, setTableData] = useState<YouTubeTableData[]>([]);

// View state
const [viewMode, setViewMode] = useState<ViewMode>('search');

// Loading state
const [isSearching, setIsSearching] = useState(false);
const [isProcessing, setIsProcessing] = useState(false);
```

### Key Frontend Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| `react` | 19.2.0 | UI framework |
| `next` | 16.0.6 | React framework |
| `@tanstack/react-table` | 8.21.3 | Data table with sorting |
| `tailwindcss` | 4 | Utility-first CSS |
| `lucide-react` | 0.555.0 | Icons |
| `sonner` | 2.0.7 | Toast notifications |
| `next-auth` | 5.0.0-beta.30 | Authentication |

---

## Database Schema

### Core Models

```
User
├── id, email, password (hashed), name
├── inviteToken (for invite-only signup)
└── Relations: searches, savedSearches, apiKeys, scripts, etc.

Search (History)
├── id, userId, query, platform, createdAt
└── Relations: searchResults

SearchResult (Cached Results)
├── externalId, platform, title, description, thumbnail
├── creatorName, viewCount, likeCount, commentCount
└── Unique: (searchId, externalId)

SavedSearch (Bookmarked)
├── id, userId, query, platform
└── Unique: (userId, query, platform)

ApiKey (Encrypted)
├── userId, service ('youtube'|'rapidapi'|'openrouter')
├── key (AES-256-GCM encrypted)
└── Unique: (userId, service)

Script (Transcripts)
├── title, script (original), repurposedScript, hooks (JSON)
├── status: 'draft' | 'in_progress' | 'completed'
└── Relations: repurposeVideo

RepurposeVideo
├── Full video metadata (title, thumbnail, stats)
└── Relations: scripts
```

---

## External API Integrations

### YouTube Data API v3

**Client:** `src/lib/youtube/`

- Uses official `googleapis` library
- Search videos, channels, playlists
- Get video details and statistics
- Configurable: maxResults, region, date range, duration

### RapidAPI (TikTok & Instagram)

**Client:** `src/lib/rapidapi/`

- Generic fetch wrapper with API key injection
- TikTok: Search videos, get user info
- Instagram: Search users, get user reels
- Transform functions normalize API responses

### OpenRouter (LLM)

**Client:** `src/lib/openrouter/`

- Chat completions for content repurposing
- Hook generation from transcripts
- User selects their preferred model

### API Key Flow

```
1. Check LRU cache (15-minute TTL)
2. If miss: Query database, decrypt key
3. If no user key: Fall back to env variable
4. Cache result for future requests
```

---

## SvelteKit Migration Assessment

### Difficulty Rating: HIGH-EXTREME

**Estimated Effort:** 75-110 hours (3-4 weeks full-time)

### What Can Be Reused (~50%)

| Component | Reusability | Notes |
|-----------|-------------|-------|
| Prisma schema | 100% | Works identically |
| `src/lib/` utilities | 95% | Minor import changes |
| TailwindCSS | 100% | All classes transfer |
| TypeScript types | 90% | Mostly framework-agnostic |
| External API clients | 95% | Remove Next.js imports |

### What Needs Complete Rewrite

| Component | Files | Hours | Complexity |
|-----------|-------|-------|------------|
| React components | 15 | 16-20 | HIGH |
| Main page (918 lines) | 1 | 20-28 | EXTREME |
| API routes | 23 | 12-16 | MEDIUM |
| Authentication | 3 | 8-12 | HIGH |
| Data table | 2 | 10-14 | HIGH |

### Key Conversion Challenges

**1. React Hooks → Svelte Reactivity**

```jsx
// React
const [query, setQuery] = useState('');
useEffect(() => { fetchData(); }, [query]);
useCallback(() => { ... }, [deps]);

// Svelte equivalent
let query = '';
$: if (query) fetchData();  // Reactive statement
function handler() { ... }   // No memoization needed
```

**2. TanStack React Table → Alternative**

Options:
- `svelte-headless-table` (Svelte equivalent)
- Custom table component
- Manual sorting implementation

**3. NextAuth → Auth.js or lucia-auth**

- Session management changes
- All 23 API routes use `requireUserId()`
- SessionProvider → SvelteKit hooks

**4. Main Page Decomposition**

The 918-line `page.tsx` with 39 useState calls needs to be:
- Split into smaller Svelte components
- State moved to Svelte stores
- Event handlers simplified (no useCallback needed)

### Dependency Changes

**Remove:**
```
next, next-auth, react, react-dom, @tanstack/react-table
```

**Add:**
```
svelte, @sveltejs/kit, @sveltejs/adapter-node
@auth/sveltekit (or lucia-auth)
lucide-svelte, svelte-sonner
```

**Keep:**
```
@prisma/client, pg, bcrypt, googleapis, lru-cache, tailwindcss
```

### Migration Timeline

| Phase | Description | Hours |
|-------|-------------|-------|
| 1. Setup | SvelteKit, Prisma, Auth | 4-6 |
| 2. Foundations | Layout, routing, auth | 10-14 |
| 3. Core Features | Search, results, repurpose | 30-40 |
| 4. Polish | Settings, modals, edge cases | 15-20 |
| 5. Testing | Unit, integration, E2E | 16-24 |
| **Total** | | **75-110** |

### Recommendation

**Rewrite if:**
- You strongly prefer Svelte's syntax and reactivity model
- You need SvelteKit-specific features
- You're planning major feature additions anyway

**Keep Next.js if:**
- The app works well as-is
- You're comfortable with React
- You want to leverage Next.js ecosystem (Vercel, etc.)

---

## File Structure Reference

```
src/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes (23 endpoints)
│   ├── (auth)/               # Auth pages (login, set-password)
│   ├── admin/                # Admin page
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Main page (918 lines)
├── components/               # React components (15)
├── lib/                      # Utilities and API clients
│   ├── youtube/              # YouTube API client
│   ├── rapidapi/             # RapidAPI clients (TikTok, Instagram)
│   ├── openrouter/           # LLM API client
│   ├── repurpose/            # Content repurposing service
│   ├── auth.ts               # NextAuth configuration
│   ├── db.ts                 # Prisma client
│   ├── crypto.ts             # Encryption utilities
│   └── cache.ts              # LRU cache for API keys
├── types/                    # TypeScript definitions
└── generated/prisma/         # Generated Prisma client

prisma/
├── schema.prisma             # Database schema
└── migrations/               # Database migrations
```
