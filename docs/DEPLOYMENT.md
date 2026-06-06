# Deployment

Zero has three deployable pieces: a **Postgres database** (Neon), the **API**
(`apps/api`), and the **web dashboard** (`apps/web`). The button device talks
to the API over HTTPS.

## 1. Database — Neon

1. Create a free project at [neon.tech](https://neon.tech).
2. Copy the connection string (looks like
   `postgres://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`).
3. This is your `DATABASE_URL`.

You can also use any other Postgres (local, Supabase, RDS) — only the
connection string changes.

## 2. Run migrations + seed (once)

From the repo root, with `apps/api/.env` containing `DATABASE_URL`:

```bash
pnpm install
pnpm db:migrate     # create tables
pnpm db:seed        # create your account + first device, prints the token
```

Set `SEED_EMAIL` / `SEED_PASSWORD` / `SEED_TZ` first if you want non-defaults.
Add `SEED_SAMPLE=1` to also generate ~3 weeks of sample data for the dashboard.

> If you change `apps/api/src/db/schema.ts`, run `pnpm db:generate` to create a
> new migration, then `pnpm db:migrate` to apply it.

## 3. API — `apps/api`

The API is a standalone Hono service. Two common ways to host it:

- **Vercel (separate project):** import the repo, set the project root to
  `apps/api`, and add a Vercel handler that exports the Hono app. Set env vars
  `DATABASE_URL`, `SESSION_SECRET`, and `WEB_ORIGIN` (your web app's URL).
- **Railway / Render / Fly:** run `pnpm --filter @zero/api start` as the start
  command with the same env vars. Good if you later add the offline-buffer
  ingestion enhancement (a long-running process).

Required env (`apps/api/.env`, see `.env.example`):

| var | purpose |
|-----|---------|
| `DATABASE_URL` | Postgres connection string |
| `SESSION_SECRET` | long random string signing dashboard sessions |
| `WEB_ORIGIN` | the web app origin for CORS (e.g. `https://zero.vercel.app`) |
| `PORT` | listen port (local/Railway/Render) |

## 4. Web — `apps/web`

Deploy `apps/web` to Vercel (project root `apps/web`). Set:

| var | purpose |
|-----|---------|
| `API_BASE_URL` | the deployed API base URL (e.g. `https://zero-api.vercel.app`) |

The web app fetches the API server-side and stores the session as an httpOnly
cookie, so no API credentials are ever exposed to the browser.

## 5. Device

In the dashboard, **Devices → Create device**, copy the token, and flash it onto
the ESP32/Pico W along with `API_BASE` (your API URL). See
[`firmware/esp32/README.md`](../firmware/esp32/README.md).

## Local development

```bash
cp apps/api/.env.example apps/api/.env          # set DATABASE_URL
cp apps/web/.env.local.example apps/web/.env.local
pnpm install
pnpm db:migrate && pnpm db:seed
pnpm dev                                          # api on :4000, web on :3000
```

Simulate a device without hardware:

```bash
TOKEN=<token from db:seed>
curl -X POST http://localhost:4000/api/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"button":1}'
```

…or use the **+ Impulse / + Action** buttons on the dashboard.
