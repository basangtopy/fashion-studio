# Fashion Studio — Backend

Express 5 + Prisma 7 (PostgreSQL) API for the Fashion Studio app.

## Requirements

- **Node.js ≥ 22.18.0** (enforced via `engines`). The Prisma client is generated
  as TypeScript and imported directly, so the runtime must strip TS types — this
  is on by default from 22.18. Do not run on Node 20/older LTS.
- A PostgreSQL database.

## Environment variables

Copy `.env.example` to `.env` and fill it in. The server **fails fast on boot**
if any of these are missing: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`,
`JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN`.

Other groups: Cloudinary (image uploads), SMTP email (`EMAIL_*`), Twilio
WhatsApp (optional — skipped silently if unset), OAuth (Google/Facebook/Twitter,
optional), and `FRONTEND_URL` / `BACKEND_URL` (used for CORS, cookies, OAuth
redirects, and email links). `FRONTEND_URL` may be a comma-separated list of
allowed origins.

## Local development

```bash
npm install                # runs `prisma generate` via postinstall
npm run db:migrate         # apply migrations to your dev DB (prisma migrate dev)
npm run db:seed            # optional: seed sample data
npm run dev                # nodemon on src/index.js
```

## Production deploy

The generated Prisma client is **not committed** (it's gitignored), so it must be
generated on the deploy host, and migrations must be applied against the
production database. Release sequence:

```bash
npm ci                     # postinstall runs `prisma generate`
npm run db:deploy          # prisma migrate deploy  (apply pending migrations)
npm start                  # node src/index.js
```

- Set `NODE_ENV=production`. In production the refresh-token cookie is issued
  with `Secure` + `SameSite=None`, so the API **must** be served over HTTPS, and
  `FRONTEND_URL` must list the exact frontend origin(s) for CORS + cookies.
- `app.set("trust proxy", 1)` is enabled; run behind exactly one proxy/load
  balancer so per-IP rate limiting sees the real client IP.
- Health probe: `GET /health` returns `200` when the DB is reachable, `503`
  otherwise.

### ⚠️ Single instance only (for now)

Real-time features and rate limiting are **in-memory**:

- SSE connections live in a per-process `Map` (`src/utils/sseManager.js`), used
  for live notifications, chat push, and admin presence.
- `express-rate-limit` uses its default in-memory store.

Running more than one replica will fragment SSE delivery/presence and make rate
limits per-instance. **Deploy as a single instance** (or with sticky sessions)
until these are moved to a shared backend (e.g. Redis pub/sub + a shared
rate-limit store). Restarting the process drops active SSE connections; clients
reconnect automatically.

## Frontend configuration

The Next.js frontend proxies `/api/*` to this backend. Set on the frontend:

- `BACKEND_URL` — origin of this API for server-side rewrites (e.g.
  `https://api.yourdomain.com`).
- `NEXT_PUBLIC_BACKEND_URL` — same API base, used for full-page OAuth redirects
  (e.g. `https://api.yourdomain.com/api`).
