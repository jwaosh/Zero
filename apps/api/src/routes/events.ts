import { BUTTON_TO_TYPE } from "@zero/shared";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/client";
import { devices, events } from "../db/schema";
import { requireDevice, requireSession } from "../lib/auth";
import type { AppEnv } from "../types";

export const eventRoutes = new Hono<AppEnv>();

const pressSchema = z.object({
  button: z.union([z.literal(1), z.literal(2)]),
  ts: z.string().datetime().optional(),
});

// Device ingest: tiny + fast for the microcontroller.
eventRoutes.post("/", requireDevice, zValidator("json", pressSchema), async (c) => {
  const { button, ts } = c.req.valid("json");
  const device = c.get("device");

  const [row] = await db
    .insert(events)
    .values({
      accountId: device.accountId,
      deviceId: device.id,
      type: BUTTON_TO_TYPE[button],
      clientTs: ts ? new Date(ts) : null,
      source: "button",
    })
    .returning({ id: events.id, type: events.type, createdAt: events.createdAt });

  await db
    .update(devices)
    .set({ lastSeenAt: new Date() })
    .where(eq(devices.id, device.id));

  return c.json(row, 201);
});

const manualSchema = z.object({
  type: z.enum(["impulse", "action"]),
  ts: z.string().datetime().optional(),
});

// Manual entry from the dashboard (corrections / testing without hardware).
eventRoutes.post(
  "/manual",
  requireSession,
  zValidator("json", manualSchema),
  async (c) => {
    const { type, ts } = c.req.valid("json");
    const [row] = await db
      .insert(events)
      .values({
        accountId: c.get("accountId"),
        type,
        createdAt: ts ? new Date(ts) : undefined,
        source: "manual",
      })
      .returning();
    return c.json(row, 201);
  },
);
