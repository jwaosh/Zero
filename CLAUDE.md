# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What Zero is

Zero measures self-distraction. A physical two-button device captures, in the moment:

- **Button 1 → an `impulse`** — the urge/thought to do something distracting (check phone, play a game).
- **Button 2 → an `action`** — actually acting on the urge.

A web dashboard turns the raw presses into insight: counts per day, time-of-day patterns, and the **follow-through rate** (how often an impulse becomes an action).

## Event & correlation model (the core domain logic)

Every press is an **independent timestamped event**. Classification happens at **query time**, never at write time, so the correlation window stays tunable forever. The algorithm lives in `packages/shared/src/index.ts` (`correlate` / `summarize`) and is the single source of truth — the API imports it; do not reimplement it elsewhere.

Given a window `W` (default 5 min, `DEFAULT_WINDOW_MINUTES`):

- An `action` within `W` after an unmatched `impulse` → **follow-through** (that impulse is "acted").
- An `action` with no in-window impulse → **immediate action** = an *implicit* impulse (the user acted the instant the urge hit; counts as both an impulse and an action).
- An `impulse` never consumed by an action → **resisted**.

Derived metrics: `totalImpulses = followThroughs + resisted + immediateActions`; `totalActions = followThroughs + immediateActions`; `followThroughRate = totalActions / totalImpulses`.

When changing these rules, update `correlate`/`summarize` and their Vitest specs together — the dashboard and stats endpoints all depend on them.

## Architecture

pnpm monorepo:

- `packages/shared` — TypeScript types, constants, and the `correlate`/`summarize` engine shared by api and web. Source-only (no build); consumers import TS directly (API via `tsx`, web via Next `transpilePackages`).
- `apps/api` — Hono + Drizzle + Postgres (Neon). Device ingest + account-scoped read/stats endpoints.
- `apps/web` — Next.js App Router + `react-aria-components` (UI primitives) + Recharts (charts). Charts are not part of react-aria; that's why Recharts is here.
- `firmware/esp32` — reference Arduino sketch for the button device + wiring README.

## Data model (multi-tenant from day one)

Three tables in `apps/api/src/db/schema.ts`. **Every events query is scoped by `account_id`** so the app can scale to multiple users running their own hardware without a migration.

- `accounts` — `id`, `email` (unique), `name`, `tz` (per-account display timezone), `created_at`.
- `devices` — belongs to an account; stores a **hashed** bearer token (`token_hash`), `last_seen_at`. The raw token is shown to the user exactly once (on creation) to flash onto hardware.
- `events` — `account_id`, `device_id` (nullable for manual entries), `type` (`impulse`|`action`), `created_at` (UTC, authoritative), `client_ts` (optional device time), `source` (`button`|`manual`). Indexed on `(account_id, created_at)`.

Store timestamps in UTC; apply the account's `tz` only for day/hour ("time of day") analytics.

## Auth

- **Ingest** (`POST /api/events`): `Authorization: Bearer <device-token>`. The token is hashed and looked up in `devices` to resolve the account/device, then `last_seen_at` is updated.
- **Reads**: account session; every query filters by the authenticated `account_id`. v1 is bootstrapped with one account via the seed script; self-service signup is a later phase (schema already supports it).

## Common commands

```bash
pnpm install              # install all workspaces
pnpm db:generate          # generate Drizzle migration from schema changes
pnpm db:migrate           # apply migrations to DATABASE_URL
pnpm db:seed              # bootstrap an account + device, print the device token
pnpm test                 # run all tests (Vitest)
pnpm --filter @zero/shared test    # just the correlation unit tests
pnpm dev                  # run api + web together
pnpm dev:api              # run just the API
pnpm dev:web              # run just the web app
```

Run a single Vitest spec: `pnpm --filter @zero/shared exec vitest run src/correlate.test.ts`.

## Environment

`apps/api/.env` needs `DATABASE_URL` (Neon or local Postgres). `apps/web/.env.local` needs `API_BASE_URL` and `SESSION_SECRET`. Per-device bearer tokens live in the DB (hashed), not in env. See each app's `.env.example`.
