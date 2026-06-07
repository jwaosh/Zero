# TODOS — getting Zero running locally

Status of the project: all code is built and passing (tests + typecheck + web
build + API boot smoke test). What remains is **standing up a database** and
verifying the end-to-end flow, plus a **web button-press simulator** to stand in
for the physical hardware. See [CLAUDE.md](./CLAUDE.md) for architecture and
[docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for the full setup walkthrough.

## 🔴 Blockers — accounts / URLs you must provide

Everything depends on one value, **`DATABASE_URL`**. Pick ONE path:

| Path | What to set up | Notes |
|------|----------------|-------|
| **A — Neon (cloud)** | Create an account at **https://neon.tech**, create a project, copy the connection string | Matches the deploy target; free tier; nothing to install. |
| **B — Local Postgres** | Install **Docker Desktop** (⚠️ not currently installed), then use `docker-compose.yml` (to be added, see #9) | Fully offline. |

Other values (no account needed):
- **`SESSION_SECRET`** — any long random string → `apps/api/.env`
- **`API_BASE_URL`** — `http://localhost:4000` (default is fine) → `apps/web/.env.local`

## Task list

Legend: **[YOU]** = needs you / an external account · **[ME]** = code to build ·
**[VERIFY]** = needs the DB live (these are the "couldn't verify locally" items).

- [x] **#8 [YOU]** Set up Postgres — Neon account **or** local Docker → produces `DATABASE_URL` _(Neon project "Zero", `autumn-frost-16768611`)_
- [x] **#9 [ME]** Add `docker-compose.yml` for local Postgres (offline fallback; default is Neon + branching for throwaway tests)
- [x] **#10 [YOU]** `cp apps/api/.env.example apps/api/.env`; set `DATABASE_URL` + `SESSION_SECRET`
- [x] **#11 [YOU]** `cp apps/web/.env.local.example apps/web/.env.local`
- [x] **#12 [VERIFY]** `pnpm db:migrate` applies cleanly (creates accounts/devices/events + enums + index)
- [x] **#13 [VERIFY]** `SEED_SAMPLE=1 pnpm db:seed` — creates account, prints one-time device token, generates ~3 weeks of sample data
- [x] **#14 [ME]** Build web **button-press simulator** — two big Impulse/Action buttons that POST to the real ingest endpoint (`POST /api/events`) with a device token (entered once, stored in localStorage) via a Next proxy `/api/simulate`. Exercises the exact ESP32 path: `source=button`, `device_id` set, `last_seen_at` updated. (The existing `+ Impulse / + Action` buttons work but write `source=manual` with no device — the simulator is the faithful hardware stand-in.)
- [ ] **#15 [VERIFY]** `pnpm dev` → log in with seeded creds → paste device token into simulator → press buttons → confirm ingest → DB → dashboard updates (cards + daily/rate/hourly charts, `last_seen_at`)
- [ ] **#16 [VERIFY]** _(optional)_ Tenant isolation — seed a second account+device, confirm reads never cross accounts

## Suggested order

`#9 + #14` (buildable now, no accounts) → `#8` (you: DB) → `#10`/`#11` (env) →
`#12` → `#13` → `#15`.

## Quick reference — simulate a press without the simulator/hardware

```bash
TOKEN=<token from `pnpm db:seed`>
curl -X POST http://localhost:4000/api/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"button":1}'   # 1 = impulse, 2 = action
```
