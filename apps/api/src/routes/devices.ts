import { zValidator } from "@hono/zod-validator";
import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/client";
import { devices } from "../db/schema";
import { requireSession } from "../lib/auth";
import { generateDeviceToken } from "../lib/crypto";
import type { AppEnv } from "../types";

export const deviceRoutes = new Hono<AppEnv>();

deviceRoutes.use("*", requireSession);

deviceRoutes.get("/", async (c) => {
  const rows = await db
    .select({
      id: devices.id,
      name: devices.name,
      lastSeenAt: devices.lastSeenAt,
      createdAt: devices.createdAt,
    })
    .from(devices)
    .where(eq(devices.accountId, c.get("accountId")))
    .orderBy(desc(devices.createdAt));
  return c.json(rows);
});

const createSchema = z.object({ name: z.string().min(1).max(120) });

deviceRoutes.post("/", zValidator("json", createSchema), async (c) => {
  const { name } = c.req.valid("json");
  const { token, hash } = generateDeviceToken();
  const [device] = await db
    .insert(devices)
    .values({ accountId: c.get("accountId"), name, tokenHash: hash })
    .returning({
      id: devices.id,
      name: devices.name,
      createdAt: devices.createdAt,
    });
  // The raw token is returned exactly once — to flash onto the hardware.
  return c.json({ device, token }, 201);
});

deviceRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const deleted = await db
    .delete(devices)
    .where(and(eq(devices.id, id), eq(devices.accountId, c.get("accountId"))))
    .returning({ id: devices.id });
  if (deleted.length === 0) return c.json({ error: "not found" }, 404);
  return c.json({ ok: true });
});
