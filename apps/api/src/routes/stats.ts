import { DEFAULT_WINDOW_MINUTES, type ApiEvent } from "@zero/shared";
import { and, asc, between, eq } from "drizzle-orm";
import { type Context, Hono } from "hono";
import { db } from "../db/client";
import { accounts, events, type EventRow } from "../db/schema";
import { requireSession } from "../lib/auth";
import { buildDaily, buildHourly, buildSummary } from "../lib/stats";
import type { AppEnv } from "../types";

export const statsRoutes = new Hono<AppEnv>();

statsRoutes.use("*", requireSession);

interface RangeQuery {
  from: Date;
  to: Date;
  windowMs: number;
  tz: string;
  rows: EventRow[];
}

/** Parse from/to/window query params and load the account's events in range. */
async function loadRange(c: Context<AppEnv>): Promise<RangeQuery> {
  const accountId = c.get("accountId");
  const now = new Date();
  const to = c.req.query("to") ? new Date(c.req.query("to")!) : now;
  const from = c.req.query("from")
    ? new Date(c.req.query("from")!)
    : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
  const windowMin = Number(c.req.query("window") ?? DEFAULT_WINDOW_MINUTES);
  const windowMs =
    (Number.isFinite(windowMin) ? windowMin : DEFAULT_WINDOW_MINUTES) * 60_000;

  const [account] = await db
    .select({ tz: accounts.tz })
    .from(accounts)
    .where(eq(accounts.id, accountId))
    .limit(1);

  const rows = await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.accountId, accountId),
        between(events.createdAt, from, to),
      ),
    )
    .orderBy(asc(events.createdAt));

  return { from, to, windowMs, tz: account?.tz ?? "UTC", rows };
}

statsRoutes.get("/summary", async (c) => {
  const { rows, windowMs } = await loadRange(c);
  return c.json(buildSummary(rows, windowMs));
});

statsRoutes.get("/daily", async (c) => {
  const { rows, windowMs, tz } = await loadRange(c);
  return c.json(buildDaily(rows, windowMs, tz));
});

statsRoutes.get("/hourly", async (c) => {
  const { rows, tz } = await loadRange(c);
  return c.json(buildHourly(rows, tz));
});

// Raw events in range (most recent first for table display).
statsRoutes.get("/events", async (c) => {
  const { rows } = await loadRange(c);
  const out: ApiEvent[] = rows
    .map((r) => ({
      id: r.id,
      type: r.type,
      createdAt: r.createdAt.toISOString(),
      clientTs: r.clientTs ? r.clientTs.toISOString() : null,
      deviceId: r.deviceId,
      source: r.source,
    }))
    .reverse();
  return c.json(out);
});
