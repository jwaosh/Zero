# Zero

A tool to measure self-distraction. A physical two-button device records, in the
moment, when you have a distracting **impulse** (button 1) and when you **act**
on it (button 2). A web dashboard shows how often each happens, when during the
day, and your **follow-through rate** (how often an impulse becomes an action).

## Layout

| Path | What |
|------|------|
| `packages/shared` | Types + the impulse/action correlation engine |
| `apps/api` | Hono + Drizzle + Postgres API (device ingest + stats) |
| `apps/web` | Next.js + React Aria + Recharts dashboard |
| `firmware/esp32` | Reference button-device sketch + wiring |

See [CLAUDE.md](./CLAUDE.md) for architecture, the event model, and commands.

## Database

For now we use **[Neon](https://neon.tech)** (cloud Postgres) for both development
and production — one less moving part, and dev matches prod exactly.

For **safe throwaway experiments** (testing a risky migration, wiping/reseeding
data, trying a change in isolation) we use **Neon's branching**: create a branch
of the database, point `DATABASE_URL` at it, do whatever you want, then delete the
branch. The branch is a cheap copy-on-write fork of the real data, so nothing on
the main branch is at risk. This covers what a local DB would normally be used
for, without needing one.

A local Postgres is **optional** — a [`docker-compose.yml`](./docker-compose.yml)
is included as an offline fallback (e.g. coding without internet), but you don't
need it for normal work.

## Quick start

```bash
pnpm install
cp apps/api/.env.example apps/api/.env       # set DATABASE_URL (Neon)
pnpm db:migrate
pnpm db:seed                                 # prints a device token
cp apps/web/.env.local.example apps/web/.env.local
pnpm dev                                     # api + web
```
