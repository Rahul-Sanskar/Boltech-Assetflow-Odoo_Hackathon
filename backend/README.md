# AssetFlow Backend

Express.js + Prisma + PostgreSQL API for AssetFlow.

## Prerequisites

- Node.js 18+
- PostgreSQL database (local or hosted, e.g. Prisma Postgres)
- npm

## Quick start (clean machine)

```bash
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL and JWT_SECRET (required)

npm install
npx prisma migrate deploy
npx prisma generate
npx prisma db seed
npm run dev
```

API listens on `PORT` (default **3001**). Health check: `GET /api/health`.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret used to sign/verify JWTs |
| `PORT` | No | HTTP port (default `3001`) |
| `NODE_ENV` | No | `development` \| `production` \| `test` (default `development`) |

See `.env.example` for a template. Never commit `.env`.

## Database

### Migrations

Schema lives in `prisma/schema.prisma`. SQL migrations live in `prisma/migrations/`.

```bash
# Apply pending migrations (CI / production / fresh clone)
npx prisma migrate deploy

# Reset DB, re-apply all migrations, then seed (development only — DESTROYS DATA)
npx prisma migrate reset

# Create a new migration after schema edits (development)
npx prisma migrate dev --name <description>
```

Do **not** use `prisma db push` for shared or production databases. Prefer migrations.

### Seed

```bash
npm run seed
# or
npx prisma db seed
```

Demo accounts:

| Email | Password | Role |
|-------|----------|------|
| `admin@example.com` | `adminpassword` | ADMIN |
| `manager@example.com` | `managerpassword` | MANAGER |
| `employee@example.com` | `employeepassword` | EMPLOYEE |
| `alex@example.com` | `employeepassword` | EMPLOYEE |

Seed includes departments, categories, assets (available / allocated / bookable / under maintenance / retired), allocations, transfer requests, bookings, maintenance requests, an open audit cycle, notifications, and activity logs.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start API with nodemon |
| `npm start` | Start API (production) |
| `npm run seed` | Load demo data |
| `npm run verify:phase2` | Workflow integrity regression |
| `npm run verify:phase3` | Infrastructure / migrate / seed / env checks |

## Development

```bash
npm run dev
```

Graceful shutdown on `SIGINT` / `SIGTERM` disconnects Prisma cleanly.

## Production checklist

1. Set strong unique `JWT_SECRET` (never the example value).
2. Set `NODE_ENV=production`.
3. Point `DATABASE_URL` at the production database.
4. Run `npx prisma migrate deploy` then `npx prisma generate`.
5. Start with `npm start` (do not seed production unless intentional).

## Testing / verification

```bash
# Infrastructure readiness (env, DB, migrations, schema drift, seed shape)
npm run verify:phase3

# Business workflow regression (allocation, transfer, maintenance, booking, lifecycle)
npm run verify:phase2
```

## Project structure

```
backend/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.js
├── scripts/
│   ├── phase2-verify.js
│   └── phase3-verify.js
└── src/
    ├── config/     # env, prisma client
    ├── constants/
    ├── controllers/
    ├── middleware/
    ├── routes/
    ├── services/
    ├── utils/
    ├── validators/
    ├── app.js
    └── index.js
```

## API overview

All routes are under `/api`. Authenticated routes expect:

```http
Authorization: Bearer <jwt>
```

Response envelope:

```json
{ "success": true, "message": "...", "data": {} }
```

## Troubleshooting

| Symptom | Likely fix |
|---------|------------|
| `Missing required environment variable` | Copy `.env.example` → `.env` and fill values |
| `Database connection failed` | Check `DATABASE_URL`, network, SSL params |
| Migration errors on existing DB | Prefer `migrate reset` in **dev** only, or align `_prisma_migrations` with the baseline |
| `prisma migrate diff` reports drift | Ensure migrations match `schema.prisma`; never mix `db push` with migrate history |
| Port conflict | Change `PORT` in `.env` |
