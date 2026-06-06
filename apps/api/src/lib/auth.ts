import { eq } from "drizzle-orm";
import type { Context, MiddlewareHandler } from "hono";
import { sign, verify } from "hono/jwt";
import { env } from "../env";
import { db } from "../db/client";
import { devices, type Device } from "../db/schema";
import { hashToken } from "./crypto";

// --- Session tokens (dashboard reads) --------------------------------------

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export interface SessionPayload {
  sub: string; // account id
  email: string;
  exp: number;
}

export async function issueSession(account: {
  id: string;
  email: string;
}): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  return sign(
    { sub: account.id, email: account.email, exp },
    env.SESSION_SECRET,
    "HS256",
  );
}

function bearer(c: Context): string | null {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim();
}

/** Require a valid session JWT; exposes accountId via c.get("accountId"). */
export const requireSession: MiddlewareHandler = async (c, next) => {
  const token = bearer(c);
  if (!token) return c.json({ error: "missing session token" }, 401);
  try {
    const payload = (await verify(
      token,
      env.SESSION_SECRET,
      "HS256",
    )) as unknown as SessionPayload;
    c.set("accountId", payload.sub);
    c.set("email", payload.email);
  } catch {
    return c.json({ error: "invalid session" }, 401);
  }
  await next();
};

// --- Device tokens (ingest) -------------------------------------------------

/** Require a valid device bearer token; exposes the device via c.get("device"). */
export const requireDevice: MiddlewareHandler = async (c, next) => {
  const token = bearer(c);
  if (!token) return c.json({ error: "missing device token" }, 401);

  const [device]: Device[] = await db
    .select()
    .from(devices)
    .where(eq(devices.tokenHash, hashToken(token)))
    .limit(1);

  if (!device) return c.json({ error: "unknown device token" }, 401);
  c.set("device", device);
  await next();
};
