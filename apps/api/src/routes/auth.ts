import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/client";
import { accounts } from "../db/schema";
import { issueSession, requireSession } from "../lib/auth";
import { verifyPassword } from "../lib/crypto";
import type { AppEnv } from "../types";

export const authRoutes = new Hono<AppEnv>();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRoutes.post("/login", zValidator("json", loginSchema), async (c) => {
  const { email, password } = c.req.valid("json");
  const [account] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.email, email.toLowerCase()))
    .limit(1);

  if (!account || !verifyPassword(password, account.passwordHash)) {
    return c.json({ error: "invalid credentials" }, 401);
  }

  const token = await issueSession(account);
  return c.json({
    token,
    account: {
      id: account.id,
      email: account.email,
      name: account.name,
      tz: account.tz,
    },
  });
});

authRoutes.get("/me", requireSession, async (c) => {
  const [account] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, c.get("accountId")))
    .limit(1);
  if (!account) return c.json({ error: "not found" }, 404);
  return c.json({
    id: account.id,
    email: account.email,
    name: account.name,
    tz: account.tz,
  });
});
