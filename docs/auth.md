# Auth Setup Guide: SvelteKit + TrailBase + Mailpit + Valibot Remote Functions

Drop-in guide for full auth with email verification. Tested end-to-end.

## Stack

| Layer | Tool | Role |
|-------|------|------|
| Frontend | SvelteKit + Remote Functions | Forms, routing, auth middleware |
| Validation | Valibot | Schema validation (Standard Schema) |
| Backend/Auth | TrailBase | User DB, JWT auth, email verification |
| Email (dev) | Mailpit | SMTP capture for verification emails |
| Cookies | jwt-decode | Server-side JWT parsing in hooks |

## Architecture

```
Browser                    SvelteKit Server              TrailBase          Mailpit
  |                            |                            |                 |
  |-- POST /register --------->|                            |                 |
  |   (remote function form)   |-- POST /api/auth/v1/reg -->|                 |
  |                            |<-- 200 registered ---------|                 |
  |                            |                            |-- SMTP email -->|
  |<-- redirect /verify-email -|                            |                 |
  |                            |                            |                 |
  |  (user clicks link in email)                            |                 |
  |-- GET /api/auth/v1/verify_email/confirm/TOKEN --------->|                 |
  |<-- 200 verified ----------------------------------------|                 |
  |                            |                            |                 |
  |-- POST /login ------------>|                            |                 |
  |   (remote function form)   |-- POST /api/auth/v1/login->|                 |
  |                            |<-- { auth_token, ... } ----|                 |
  |                            |   (set httpOnly cookies)   |                 |
  |<-- redirect / -------------|                            |                 |
```

---

## 1. Dependencies

```bash
cd your-sveltekit-app
npm install valibot jwt-decode
```

No superforms. No formsnap. No zod. Just valibot for validation.

## 2. Enable Remote Functions

```js
// svelte.config.js
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    experimental: {
      remoteFunctions: true
    }
  }
};

export default config;
```

Remote functions are experimental (SvelteKit 2.27+). They compile `.remote.ts` files into HTTP endpoints with auto-generated fetch wrappers.

## 3. Environment Variables

```bash
# .env
TRAILBASE_URL=http://localhost:4000
```

## 4. TrailBase Config

### config.textproto (in `traildepot/config.textproto`)

The `email {}` block configures SMTP. The `server {}` block sets the app name and site URL used in verification email links.

```textproto
email {
  smtp_host: "localhost"
  smtp_port: 1025
  smtp_encryption: SMTP_ENCRYPTION_NONE
  sender_name: "Your App Name"
  sender_address: "noreply@yourapp.local"
}

server {
  application_name: "Your App Name"
  site_url: "http://localhost:4000"
}
```

### Edge case: `email {}` vs `server {}`

SMTP config goes in `email {}`, NOT `server {}`. If you put `smtp_host` in `server {}`, TrailBase crashes with:

```
Error: Config(Parse(ParseError { kind: FieldNotFound { field_name: "smtp_host", message_name: "config.ServerConfig" } }))
```

### Edge case: `--dev` mode skips verification emails

TrailBase's `--dev` flag silently skips sending verification emails. Registration returns `200` but no email is sent. The user is created but unverified, and login returns `401`.

**For email verification testing, do NOT use `--dev`.**

```bash
# WRONG — emails won't be sent
trail run --dev

# CORRECT — emails sent via configured SMTP
trail run --cors-allowed-origins 'http://localhost:5173'
```

If you need `--dev` for permissive CORS during development, use `--cors-allowed-origins` instead.

### Available email config fields (from config.proto)

```protobuf
message EmailConfig {
  optional string smtp_host = 1;
  optional uint32 smtp_port = 2;
  optional string smtp_username = 3;
  optional string smtp_password = 4;       // marked as secret
  optional SmtpEncryption smtp_encryption = 5;
  // Values: SMTP_ENCRYPTION_NONE, SMTP_ENCRYPTION_STARTTLS, SMTP_ENCRYPTION_TLS
  optional string sender_name = 11;
  optional string sender_address = 12;
  optional EmailTemplate user_verification_template = 21;
  optional EmailTemplate password_reset_template = 22;
  optional EmailTemplate change_email_template = 23;
  optional EmailTemplate otp_template = 24;
}
```

### docker-compose.yml (Mailpit + TrailBase)

```yaml
services:
  trailbase:
    image: trailbase/trailbase
    container_name: your-app-trailbase
    restart: unless-stopped
    ports:
      - '4000:4000'
    environment:
      ADDRESS: '0.0.0.0:4000'
    volumes:
      - ./traildepot:/app/traildepot
    command: /app/trail run
    depends_on:
      - mailpit

  mailpit:
    image: axllent/mailpit
    container_name: your-app-mailpit
    restart: unless-stopped
    ports:
      - '8025:8025'   # Web UI
      - '1025:1025'   # SMTP
    environment:
      MP_SMTP_AUTH_ACCEPT_ANY: 1
      MP_SMTP_AUTH_ALLOW_INSECURE: 1
```

When using Docker, set `smtp_host: "mailpit"` (service name) instead of `"localhost"`.

### Running without Docker

```bash
# Install Mailpit binary
curl -sL "https://github.com/axllent/mailpit/releases/latest/download/mailpit-linux-amd64.tar.gz" | tar xz -C /usr/local/bin/

# Start Mailpit
mailpit --smtp 0.0.0.0:1025 --listen 0.0.0.0:8025 --smtp-auth-accept-any --smtp-auth-allow-insecure &

# Start TrailBase (set DATA_DIR if traildepot is not in cwd)
DATA_DIR=./traildepot trail run --cors-allowed-origins 'http://localhost:5173'
```

## 5. TypeScript Types

### `src/app.d.ts`

```ts
declare global {
  namespace App {
    interface Locals {
      user: { id: string; email: string } | null;
    }
  }
}

export {};
```

## 6. Server-Side Auth Proxy

### `src/lib/server/auth.ts`

This file proxies all auth calls to TrailBase and manages httpOnly cookies. SvelteKit never exposes tokens to the browser.

```ts
import { TRAILBASE_URL } from '$env/static/private';
import type { Cookies } from '@sveltejs/kit';

export type TrailBaseTokens = {
  auth_token: string;
  refresh_token: string;
  csrf_token: string;
};

export async function trailbaseLogin(
  email: string,
  password: string
): Promise<TrailBaseTokens> {
  const res = await fetch(`${TRAILBASE_URL}/api/auth/v1/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error('Invalid email or password');
    if (res.status === 403) throw new Error('Email not verified. Please check your inbox.');
    const text = await res.text().catch(() => '');
    throw new Error(text || `Login failed (${res.status})`);
  }

  return (await res.json()) as TrailBaseTokens;
}

export async function trailbaseRegister(
  email: string,
  password: string,
  passwordRepeat: string
): Promise<void> {
  const res = await fetch(`${TRAILBASE_URL}/api/auth/v1/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, password_repeat: passwordRepeat })
  });

  if (res.ok || res.status === 303) return;

  if (res.status === 424) {
    throw new Error('Failed to send verification email. Please try again.');
  }

  const text = await res.text().catch(() => '');
  throw new Error(text || `Registration failed (${res.status})`);
}

export async function trailbaseRefresh(
  refreshToken: string
): Promise<{ auth_token: string; csrf_token: string }> {
  const res = await fetch(`${TRAILBASE_URL}/api/auth/v1/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken })
  });

  if (!res.ok) throw new Error('Session expired');
  return await res.json();
}

export async function trailbaseLogout(refreshToken: string): Promise<void> {
  await fetch(`${TRAILBASE_URL}/api/auth/v1/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken })
  });
}

// Cookie names
export const AUTH_COOKIE = 'tb_auth_token';
export const REFRESH_COOKIE = 'tb_refresh_token';
export const CSRF_COOKIE = 'tb_csrf_token';

const COOKIE_BASE = {
  path: '/',
  httpOnly: true,
  sameSite: 'lax' as const
};

export function setAuthCookies(cookies: Cookies, tokens: TrailBaseTokens, secure: boolean) {
  cookies.set(AUTH_COOKIE, tokens.auth_token, {
    ...COOKIE_BASE, secure, maxAge: 60 * 60       // 1 hour
  });
  cookies.set(REFRESH_COOKIE, tokens.refresh_token, {
    ...COOKIE_BASE, secure, maxAge: 60 * 60 * 24 * 30  // 30 days
  });
  cookies.set(CSRF_COOKIE, tokens.csrf_token, {
    ...COOKIE_BASE, secure, httpOnly: false, maxAge: 60 * 60  // readable by JS
  });
}

export function clearAuthCookies(cookies: Cookies) {
  cookies.delete(AUTH_COOKIE, { path: '/' });
  cookies.delete(REFRESH_COOKIE, { path: '/' });
  cookies.delete(CSRF_COOKIE, { path: '/' });
}
```

### TrailBase API response codes

| Endpoint | Success | Common Errors |
|----------|---------|---------------|
| `/api/auth/v1/register` | `200` ("registered") | `424` (SMTP failed), `400` (validation) |
| `/api/auth/v1/login` | `200` (returns tokens) | `401` (bad creds or unverified), `403` (forbidden) |
| `/api/auth/v1/verify_email/confirm/{token}` | `200` | `400` (expired/invalid token) |
| `/api/auth/v1/refresh` | `200` (new tokens) | `401` (expired refresh token) |
| `/api/auth/v1/logout` | `200` | — |

## 7. Auth Middleware

### `src/hooks.server.ts`

Runs on every request. Validates JWT, auto-refreshes expired tokens, protects routes.

```ts
import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { jwtDecode } from 'jwt-decode';
import {
  AUTH_COOKIE, REFRESH_COOKIE,
  trailbaseRefresh, setAuthCookies
} from '$lib/server/auth.js';

type TokenClaims = {
  sub: string;
  email: string;
  exp: number;
  admin?: boolean;
};

const PUBLIC_PATHS = ['/login', '/register', '/verify-email', '/api/health'];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export const handle: Handle = async ({ event, resolve }) => {
  const { cookies, url } = event;
  const authToken = cookies.get(AUTH_COOKIE);
  const refreshToken = cookies.get(REFRESH_COOKIE);

  let user: { id: string; email: string } | null = null;

  if (authToken) {
    try {
      const claims = jwtDecode<TokenClaims>(authToken);
      const now = Date.now() / 1000;

      if (claims.exp > now) {
        user = { id: claims.sub, email: claims.email };
      } else if (refreshToken) {
        const refreshed = await trailbaseRefresh(refreshToken);
        const secure = url.protocol === 'https:';
        setAuthCookies(cookies, {
          auth_token: refreshed.auth_token,
          refresh_token: refreshToken,
          csrf_token: refreshed.csrf_token
        }, secure);
        const newClaims = jwtDecode<TokenClaims>(refreshed.auth_token);
        user = { id: newClaims.sub, email: newClaims.email };
      }
    } catch {
      // Invalid token — treat as unauthenticated
    }
  }

  event.locals.user = user;

  if (!user && !isPublicPath(url.pathname)) {
    redirect(303, '/login');
  }

  if (user && (url.pathname === '/login' || url.pathname === '/register')) {
    redirect(303, '/');
  }

  return resolve(event);
};
```

## 8. Remote Function Forms

### `src/routes/(auth)/auth.remote.ts`

This single file replaces all `+page.server.ts` form actions. Three remote functions: login, register, logout.

```ts
import * as v from 'valibot';
import { redirect, invalid } from '@sveltejs/kit';
import { form, getRequestEvent } from '$app/server';
import {
  trailbaseLogin, trailbaseRegister, trailbaseLogout,
  setAuthCookies, clearAuthCookies, REFRESH_COOKIE
} from '$lib/server/auth.js';

export const loginForm = form(
  v.object({
    email: v.pipe(v.string(), v.nonEmpty('Please enter your email.'), v.email('Invalid email.')),
    _password: v.pipe(v.string(), v.nonEmpty('Please enter your password.'))
  }),
  async ({ email, _password }) => {
    const { cookies, url } = getRequestEvent();

    try {
      const tokens = await trailbaseLogin(email, _password);
      const secure = url.protocol === 'https:';
      setAuthCookies(cookies, tokens, secure);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Login failed';
      invalid(message);
    }

    redirect(303, '/');
  }
);

export const registerForm = form(
  v.object({
    email: v.pipe(v.string(), v.nonEmpty('Please enter your email.'), v.email('Invalid email.')),
    _password: v.pipe(v.string(), v.minLength(8, 'Password must be at least 8 characters.')),
    _passwordConfirm: v.pipe(v.string(), v.nonEmpty('Please confirm your password.'))
  }),
  async ({ email, _password, _passwordConfirm }, issue) => {
    if (_password !== _passwordConfirm) {
      invalid(issue._passwordConfirm('Passwords do not match.'));
    }

    try {
      await trailbaseRegister(email, _password, _passwordConfirm);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Registration failed';
      invalid(message);
    }

    const emailParam = encodeURIComponent(email);
    redirect(303, `/verify-email?email=${emailParam}`);
  }
);

export const logoutForm = form(v.object({}), async () => {
  const { cookies } = getRequestEvent();
  const refreshToken = cookies.get(REFRESH_COOKIE);
  if (refreshToken) {
    await trailbaseLogout(refreshToken).catch(() => {});
  }
  clearAuthCookies(cookies);
  redirect(303, '/login');
});
```

### Key patterns

**Underscore prefix for sensitive fields:** `_password` and `_passwordConfirm` use leading underscores. This tells SvelteKit's remote function form to NOT send these values back to the client on validation failure (prevents password echo).

**`invalid()` for errors:** Throws like `redirect()` or `error()`. Pass a string for form-level errors, or `issue.fieldName('message')` for field-level errors.

**`getRequestEvent()` for cookies:** Inside `form()` handlers, use `getRequestEvent()` to access `cookies`, `url`, `locals`, etc.

## 9. Pages

### Login Page (`src/routes/(auth)/login/+page.svelte`)

```svelte
<script lang="ts">
  import { loginForm } from '../auth.remote.js';
</script>

<form {...loginForm}>
  <!-- Form-level errors -->
  {#each loginForm.fields.allIssues() as issue (issue.message)}
    <p class="error">{issue.message}</p>
  {/each}

  <!-- Email field -->
  <input {...loginForm.fields.email.as('email')} />
  {#each loginForm.fields.email.issues() as issue (issue.message)}
    <p class="field-error">{issue.message}</p>
  {/each}

  <!-- Password field (underscore prefix = sensitive) -->
  <input {...loginForm.fields._password.as('password')} />
  {#each loginForm.fields._password.issues() as issue (issue.message)}
    <p class="field-error">{issue.message}</p>
  {/each}

  <button type="submit" disabled={!!loginForm.pending}>
    {loginForm.pending ? 'Signing in...' : 'Sign in'}
  </button>
</form>
```

### Register Page (`src/routes/(auth)/register/+page.svelte`)

Same pattern. Three fields: `email`, `_password`, `_passwordConfirm`.

### Verify Email Page (`src/routes/(auth)/verify-email/+page.svelte`)

Static page. Shows "check your email" message. Uses `page.url.searchParams.get('email')` to display the email address.

### Logout (UserMenu component)

```svelte
<script lang="ts">
  import { logoutForm } from '../../../routes/(auth)/auth.remote.js';
</script>

<form {...logoutForm}>
  <button type="submit">Logout</button>
</form>
```

### How `{...formName}` works

Spreading a remote function form onto `<form>` gives it:
- `method="POST"`
- `action="?/remote=HASH/formName"` (auto-generated endpoint)
- An attachment for progressive enhancement (no `use:enhance` needed)

Works **without JavaScript** (full page reload fallback).

## 10. File Structure

```
src/
  app.d.ts                          # App.Locals type with user
  hooks.server.ts                   # Auth middleware (JWT validate, refresh, protect routes)
  lib/
    server/
      auth.ts                       # TrailBase API proxy + cookie management
    components/
      auth/
        UserMenu.svelte             # Logout dropdown
        index.ts                    # Barrel export
  routes/
    (auth)/
      auth.remote.ts                # loginForm, registerForm, logoutForm
      login/
        +page.svelte                # Login form page
      register/
        +page.svelte                # Register form page
      verify-email/
        +page.svelte                # "Check your email" page
```

## 11. Edge Cases & Gotchas

### TrailBase `--dev` mode silently skips verification emails

**Symptom:** Registration returns `200`, no email in Mailpit, login returns `401`.
**Fix:** Don't use `--dev`. Use `--cors-allowed-origins` for CORS instead.

### TrailBase `424` on register = SMTP failure

**Symptom:** `424 Failed Dependency` from `/api/auth/v1/register`.
**Cause:** SMTP host unreachable or misconfigured.
**Fix:** Check `email {}` block in `config.textproto`. Verify Mailpit is running on the configured port.

### Config field placement matters

- SMTP fields go in `email {}` block
- `application_name` and `site_url` go in `server {}` block
- Putting SMTP fields in `server {}` crashes TrailBase at startup

### `site_url` controls verification link URLs

If `site_url` is not set, verification links default to `http://localhost:4000`. In production, set this to your actual domain.

### Token refresh is transparent

The `hooks.server.ts` middleware automatically refreshes expired auth tokens using the refresh token. Users stay logged in for up to 30 days without re-entering credentials.

### CSRF token is NOT httpOnly

The CSRF token cookie has `httpOnly: false` so client-side JavaScript can read it for non-form API calls.

### Remote function password fields

Prefix sensitive field names with `_` (e.g., `_password`). This prevents SvelteKit from echoing the value back to the client after a failed form submission.

### Playwright-cli in root containers

If running playwright-cli as root (e.g., in CI/Docker), Chrome requires `--no-sandbox`. Create `.playwright/cli.config.json`:

```json
{
  "browser": {
    "launchOptions": {
      "chromiumSandbox": false
    }
  }
}
```

The config must use `browser.launchOptions.chromiumSandbox`, NOT `launchOptions.chromiumSandbox` at the top level.

## 12. E2E Test Flow

```bash
# 1. Start Mailpit
mailpit --smtp 0.0.0.0:1025 --listen 0.0.0.0:8025 \
  --smtp-auth-accept-any --smtp-auth-allow-insecure &

# 2. Start TrailBase (WITHOUT --dev)
DATA_DIR=./backend/traildepot trail run \
  --cors-allowed-origins 'http://localhost:5173' &

# 3. Start SvelteKit
npm run dev &

# 4. Register via form (browser or curl)
curl -X POST http://localhost:5173/register \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=test@example.com&_password=password1234&_passwordConfirm=password1234"

# 5. Check Mailpit for verification email
curl -s http://localhost:8025/api/v1/messages | python3 -c "
import sys, json
d = json.load(sys.stdin)
for msg in d['messages']:
    print(msg['Subject'], msg['ID'])
"

# 6. Get verification link from email
VERIFY_URL=$(curl -s http://localhost:8025/api/v1/message/MESSAGE_ID | \
  python3 -c "import sys,json,re; body=json.load(sys.stdin).get('HTML',''); \
  urls=re.findall(r'http[^\s\"<>]+verify_email/confirm/[^\s\"<>]+',body); \
  print(urls[0] if urls else '')")

# 7. Click verification link
curl -L "$VERIFY_URL"

# 8. Login
curl -X POST http://localhost:4000/api/auth/v1/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password1234"}'
# Returns: { auth_token, refresh_token, csrf_token }
```

## 13. Mailpit API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/messages` | GET | List all messages |
| `/api/v1/messages` | DELETE | Delete all messages |
| `/api/v1/message/{id}` | GET | Get single message (HTML, Text, headers) |
| `/api/v1/search?query=to:email@example.com` | GET | Search messages |
| `/api/v1/info` | GET | Server info and stats |

Web UI: `http://localhost:8025`

## 14. Production Checklist

- [ ] Replace Mailpit with real SMTP provider (SendGrid, Brevo, etc.)
- [ ] Set `smtp_encryption: SMTP_ENCRYPTION_TLS` or `SMTP_ENCRYPTION_STARTTLS`
- [ ] Set `smtp_username` and `smtp_password` in config
- [ ] Set `site_url` to your production domain
- [ ] Set `secure: true` for cookies (HTTPS only)
- [ ] Set real `ENCRYPTION_SECRET` env var
- [ ] Remove `--cors-allowed-origins '*'` — restrict to your domain
- [ ] Consider adding rate limiting to auth endpoints
