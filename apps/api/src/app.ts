import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "./env";
import { authRoutes } from "./routes/auth";
import { deviceRoutes } from "./routes/devices";
import { eventRoutes } from "./routes/events";
import { statsRoutes } from "./routes/stats";
import type { AppEnv } from "./types";

export function createApp() {
  const app = new Hono<AppEnv>();

  app.use("*", cors({ origin: env.WEB_ORIGIN }));

  app.get("/health", (c) => c.json({ ok: true }));

  app.route("/api/auth", authRoutes);
  app.route("/api/events", eventRoutes);
  app.route("/api/devices", deviceRoutes);
  app.route("/api/stats", statsRoutes);

  return app;
}
