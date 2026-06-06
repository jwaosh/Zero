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

## Quick start

```bash
pnpm install
cp apps/api/.env.example apps/api/.env       # set DATABASE_URL (Neon or local PG)
pnpm db:migrate
pnpm db:seed                                 # prints a device token
cp apps/web/.env.local.example apps/web/.env.local
pnpm dev                                     # api + web
```
