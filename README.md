# Social-Bro

Search YouTube, TikTok & Instagram from one place. Find content, grab transcripts, repurpose scripts.

## What It Does

- **Unified Search** - Query all platforms at once, filter by creator with @username
- **Content Repurposing** - Extract YouTube transcripts and generate shorter versions for other platforms
- **Hook Generator** - AI-powered opening lines to grab attention
- **Search History** - Save and revisit your searches

## Prerequisites

- Node.js 18+
- Docker

## Local Development Setup

```bash
# Clone it
git clone https://github.com/KenKaiii/social-bro.git
cd social-bro

# Install deps
npm install

# Set up env
cp .env.example .env
# Edit .env with your secrets (generate with: openssl rand -base64 32)

# Start database
docker compose up -d

# Run migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Start the app
npm run dev
```

Open [localhost:3000](http://localhost:3000) and you're good.

### First User Setup

1. Go to `/admin`
2. Enter your `ADMIN_SECRET`
3. Invite yourself with your email
4. Copy the invite URL and open it to set your password
5. Login at `/login`

## Railway Deployment

### 1. Create PostgreSQL Database

1. In your Railway project, click **New** → **Database** → **PostgreSQL**
2. Wait for the database to deploy (green checkmark)
3. Click on the PostgreSQL service → **Variables** tab
4. Copy the **public** `DATABASE_URL` (not internal - internal networking can have issues)

### 2. Deploy the App

1. Click **New** → **GitHub Repo** → Select your forked repo
2. Go to **Settings** tab → **Build** section
3. Change **Builder** to **Dockerfile**
4. Railway will start building

### 3. Configure Environment Variables

In your app service, go to **Variables** tab and add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Paste the public URL from PostgreSQL |
| `AUTH_SECRET` | Generate with `openssl rand -base64 32` |
| `ENCRYPTION_SECRET` | Generate with `openssl rand -base64 32` |
| `ADMIN_SECRET` | Your secret phrase for admin access |
| `NEXTAUTH_URL` | Your Railway app URL (e.g., `https://social-bro-production-xxxx.up.railway.app`) |
| `AUTH_TRUST_HOST` | `true` |

### 4. Generate Public URL

1. Go to **Settings** tab → **Networking** section
2. Click **Generate Domain** to get your public URL
3. Update `NEXTAUTH_URL` to match this URL (no trailing slash)

### 5. Redeploy

After adding all variables, redeploy the app. The Dockerfile automatically runs `prisma db push` on startup to create tables.

### Troubleshooting

- **"Can't reach database server"** - Use the public DATABASE_URL, not internal
- **"UntrustedHost" error** - Make sure `AUTH_TRUST_HOST=true` is set
- **Login spinning forever** - Check Railway logs for errors, verify NEXTAUTH_URL matches exactly

## Tech Stack

Next.js 15 • React 19 • PostgreSQL • Prisma • TailwindCSS • NextAuth

## Author

Built by [Ken](https://github.com/KenKaiii) — subscribe to [YouTube](https://youtube.com/@kenkaidoesai) and join the [Skool community](https://www.skool.com/kenkai) for more AI/dev content.

## License

MIT
