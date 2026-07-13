# Deployment Guide

This is a monorepo with two independently deployed apps:

| Part | Path | Suggested host | Runtime |
| --- | --- | --- | --- |
| Frontend | `frontend/` | Vercel | Next.js 16 / React 19 |
| Backend | `backend/` | Render or Railway | Node ≥ 22.18, Express 5, Prisma 7 |
| Database | — | Render Postgres / Neon / Supabase / Railway | PostgreSQL |

The frontend and backend are deployed **separately**, each pointed at its own
subdirectory of this one repository. You do **not** need to split the repo.

> Backend-only deploy details (env-var boot check, release sequence, the
> single-instance / in-memory SSE constraint) also live in
> [`backend/README.md`](./backend/README.md). This guide focuses on the
> split cloud deployment.

---

## 0. Prerequisites

- A **PostgreSQL** database (Render Postgres, Neon, Supabase, or Railway).
- **Cloudinary** account (image uploads).
- An **SMTP** provider for email (Resend, Mailgun, Postmark, or Gmail App
  Password) — the backend sends mail over SMTP via nodemailer.
- *(Optional)* **Twilio** WhatsApp credentials and **OAuth** apps
  (Google/Facebook/Twitter). Both are skipped gracefully if unset.
- The repo can stay **private** — Vercel, Render, and Railway all deploy
  private repos on their free tiers via their GitHub App. Nothing needs to be
  made public; all secrets live in each platform's env-var settings.

---

## 1. Backend → Render (or Railway)

Create a **Web Service** from this repo with:

| Setting | Value |
| --- | --- |
| Root Directory | `backend` |
| Build Command | `npm ci` (runs `prisma generate` via `postinstall`) |
| Pre-Deploy / Release Command | `npm run db:deploy` (runs `prisma migrate deploy`) |
| Start Command | `npm start` |
| Health Check Path | `/health` |
| Node version | ≥ 22.18 (enforced by `engines`; set via the platform or an `.nvmrc`) |

**Why the release command matters:** the generated Prisma client is gitignored
and produced at install time by `postinstall`, and pending migrations must be
applied to the production DB on each release. `npm run db:deploy` does the
latter; skipping it means schema drift.

**Only redeploy on backend changes.** By default the service redeploys on any
push to the repo. Add a **Build Filter** so it only deploys when backend files
change:

- Included paths: `backend/**`
- Ignored paths: `frontend/**`

*(Railway equivalent: set the service **Root Directory** to `backend` and enable
"Wait for CI" / watch paths as available.)*

### Required backend environment variables

The server **fails fast on boot** if any of these are missing:

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | Postgres connection string |
| `JWT_SECRET` | long random string |
| `JWT_REFRESH_SECRET` | different long random string |
| `JWT_EXPIRES_IN` | e.g. `15m` |
| `JWT_REFRESH_EXPIRES_IN` | e.g. `7d` |

Also set (from `backend/.env.example`):

| Group | Variables |
| --- | --- |
| Server | `NODE_ENV=production`, `PORT` (host usually injects this) |
| DB pool | `DATABASE_POOL_SIZE` (optional; default 10) |
| Cloudinary | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| Email (SMTP) | `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`, `EMAIL_FROM_NAME` |
| Branding | `PRIMARY_COLOR`, `BRAND_LOGO_URL` |
| WhatsApp (optional) | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER` |
| OAuth (optional) | `GOOGLE_CLIENT_ID/SECRET`, `FACEBOOK_APP_ID/SECRET`, `TWITTER_CLIENT_ID/SECRET` |
| URLs | `FRONTEND_URL` (your Vercel origin — used for CORS + cookies), `BACKEND_URL` (this service's own public URL, for OAuth redirects/email links) |

`FRONTEND_URL` may be a comma-separated list of allowed origins.

### ⚠️ Run a single backend instance

Real-time features and rate limiting are **in-memory** (SSE connections in a
`Map`; `express-rate-limit`'s default store). Running multiple replicas would
fragment SSE delivery/presence and make rate limits per-instance. **Deploy one
instance** (scale vertically) until these are moved to Redis. See
`backend/README.md` for details.

---

## 2. Frontend → Vercel

Import this repo into Vercel with:

| Setting | Value |
| --- | --- |
| Root Directory | `frontend` |
| Framework Preset | Next.js (auto-detected) |
| Build / Output | defaults |

### Frontend environment variables

| Variable | Value |
| --- | --- |
| `BACKEND_URL` | backend origin for server-side rewrites, e.g. `https://your-api.onrender.com` |
| `NEXT_PUBLIC_BACKEND_URL` | backend API base for browser/OAuth navigations, e.g. `https://your-api.onrender.com/api` |

### Skip frontend builds on backend-only changes

By default Vercel rebuilds on every push, even backend-only ones (wasteful, not
harmful). To skip those, set **Project Settings → Git → Ignored Build Step** to:

```bash
git diff --quiet HEAD^ HEAD -- .
```

With Root Directory = `frontend`, `.` is the frontend folder. `git diff --quiet`
exits `0` when nothing changed there → Vercel **skips** the build; exits `1` when
frontend files changed → build proceeds.

---

## 3. Wiring the two together

The frontend reaches the backend two ways:

1. **Rewrite proxy (same-origin):** `next.config` rewrites `/api/:path*` to
   `BACKEND_URL`. The browser calls `/api/...` on the Vercel domain and Next
   proxies to the backend. Good for cookies (same-origin), but **long-lived SSE
   streaming through Vercel's proxy can hit serverless timeout/streaming
   limits** — verify live notifications after deploy.
2. **Direct cross-origin:** the browser calls the backend origin directly via
   `NEXT_PUBLIC_BACKEND_URL`. The backend already sends the refresh cookie with
   `SameSite=None; Secure` and CORS is configured with `credentials` +
   `FRONTEND_URL`, so cross-site auth works over HTTPS. This avoids the Vercel
   streaming caveat for SSE.

**Checklist for the connection to work in production:**

- Backend `FRONTEND_URL` = exact Vercel domain(s) (CORS + cookie).
- Frontend `BACKEND_URL` / `NEXT_PUBLIC_BACKEND_URL` = backend origin.
- Both served over **HTTPS** (required for `Secure` + `SameSite=None` cookies).
- OAuth redirect URIs (if used) registered against `BACKEND_URL` in each
  provider's console.
- After deploy, smoke-test: login (cookie set + refresh), a real order,
  a payment, and that **live SSE notifications** arrive.

---

## 4. Database & migrations

- Migrations live in `backend/prisma/migrations`. Apply them on every release
  with `npm run db:deploy` (`prisma migrate deploy`) — wired as the backend
  release command above.
- Never run `prisma migrate dev` against production (it can create/reset).
- *(Optional)* seed once with `npm run db:seed` for sample data — do **not**
  seed production if it wipes data (`seed.js` clears tables).
- Watch the connection pool: the client is capped at `DATABASE_POOL_SIZE`
  (default 10). Ensure your Postgres plan allows at least that many connections.

---

## 5. Monitoring in production

A pragmatic, mostly-free stack:

- **Uptime + health:** point **UptimeRobot** or **Better Stack** at
  `GET /health` (it returns `503` when the DB is unreachable). Also set the
  host's health-check path to `/health` so it restarts on failure.
- **Error tracking (highest value):** add **Sentry** to both apps
  (`@sentry/nextjs`, `@sentry/node`) for stack traces + release tracking. This
  captures errors that otherwise only hit `console.error` before the process
  exits.
- **Logs:** start with the platform log viewers (Vercel / Render / Railway).
  For retention/search, add a log drain (Better Stack, Axiom, Logtail).
- **Metrics:** frontend — **Vercel Analytics + Speed Insights**; backend —
  host CPU/memory dashboards + Sentry Performance; DB — your Postgres provider's
  dashboard (connections, slow queries).
- **App-specific:** SSE connection count / backend memory (in-memory `Map`),
  and pending-payment volume (payments are manually confirmed).

Minimum viable: Sentry (both) + UptimeRobot on `/health` + platform logs +
Vercel Analytics.

---

## 6. Release checklist

1. Merge to `main`.
2. Backend (Render): auto-deploys if `backend/**` changed → runs
   `npm ci` → `npm run db:deploy` → `npm start`.
3. Frontend (Vercel): auto-deploys if `frontend/**` changed (Ignored Build Step
   skips backend-only pushes).
4. Confirm `GET /health` is `200`, then smoke-test auth, an order, a payment,
   and SSE notifications.
