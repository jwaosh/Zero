import { eq } from "drizzle-orm";
import { db, pool } from "./db/client";
import { accounts, devices, events } from "./db/schema";
import { generateDeviceToken, hashPassword } from "./lib/crypto";

const EMAIL = (process.env.SEED_EMAIL ?? "you@example.com").toLowerCase();
const PASSWORD = process.env.SEED_PASSWORD ?? "changeme";
const TZ = process.env.SEED_TZ ?? "America/New_York";
const DEVICE_NAME = process.env.SEED_DEVICE_NAME ?? "desk buttons";
const SAMPLE = ["1", "true", "yes"].includes(
  (process.env.SEED_SAMPLE ?? "").toLowerCase(),
);

async function ensureAccount() {
  const [existing] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.email, EMAIL))
    .limit(1);
  if (existing) return { account: existing, created: false };

  const [account] = await db
    .insert(accounts)
    .values({ email: EMAIL, passwordHash: hashPassword(PASSWORD), tz: TZ })
    .returning();
  return { account, created: true };
}

async function ensureDevice(accountId: string) {
  const existing = await db
    .select()
    .from(devices)
    .where(eq(devices.accountId, accountId));
  if (existing.length > 0) return { device: existing[0], token: null };

  const { token, hash } = generateDeviceToken();
  const [device] = await db
    .insert(devices)
    .values({ accountId, name: DEVICE_NAME, tokenHash: hash })
    .returning();
  return { device, token };
}

/** Weighted random hour of day, biased toward waking/working hours. */
function randomHour(): number {
  const weights = [
    1, 1, 1, 1, 1, 1, 2, 3, 5, 7, 8, 7, 6, 7, 8, 8, 7, 6, 5, 4, 4, 3, 2, 1,
  ];
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let h = 0; h < 24; h++) {
    r -= weights[h];
    if (r <= 0) return h;
  }
  return 12;
}

async function generateSample(accountId: string, deviceId: string) {
  const existing = await db
    .select({ id: events.id })
    .from(events)
    .where(eq(events.accountId, accountId))
    .limit(1);
  if (existing.length > 0) {
    console.log("• sample skipped (events already exist)");
    return;
  }

  const rows: (typeof events.$inferInsert)[] = [];
  const DAYS = 21;
  const now = Date.now();

  for (let d = DAYS; d >= 0; d--) {
    const dayStart = new Date(now - d * 24 * 60 * 60 * 1000);
    const impulseCount = 5 + Math.floor(Math.random() * 20);
    for (let i = 0; i < impulseCount; i++) {
      const ts = new Date(dayStart);
      ts.setHours(randomHour(), Math.floor(Math.random() * 60), 0, 0);
      rows.push({
        accountId,
        deviceId,
        type: "impulse",
        createdAt: ts,
        source: "button",
      });
      // ~55% of impulses are followed through within a few minutes.
      if (Math.random() < 0.55) {
        const act = new Date(ts.getTime() + (1 + Math.random() * 4) * 60_000);
        rows.push({
          accountId,
          deviceId,
          type: "action",
          createdAt: act,
          source: "button",
        });
      }
    }
    // A couple of immediate actions (acted without a logged impulse first).
    const immediate = Math.floor(Math.random() * 3);
    for (let i = 0; i < immediate; i++) {
      const ts = new Date(dayStart);
      ts.setHours(randomHour(), Math.floor(Math.random() * 60), 0, 0);
      rows.push({
        accountId,
        deviceId,
        type: "action",
        createdAt: ts,
        source: "button",
      });
    }
  }

  // Insert in chunks to stay well under parameter limits.
  for (let i = 0; i < rows.length; i += 500) {
    await db.insert(events).values(rows.slice(i, i + 500));
  }
  console.log(`• inserted ${rows.length} sample events over ${DAYS} days`);
}

async function main() {
  const { account, created } = await ensureAccount();
  console.log(`${created ? "✓ created" : "• existing"} account: ${account.email}`);
  if (created) console.log(`  password: ${PASSWORD}  tz: ${account.tz}`);

  const { device, token } = await ensureDevice(account.id);
  console.log(`${token ? "✓ created" : "• existing"} device: ${device.name}`);
  if (token) {
    console.log("\n  ⚠ DEVICE TOKEN (shown once — flash this onto the hardware):");
    console.log(`  ${token}\n`);
  } else {
    console.log("  (device exists; mint a new token from the dashboard)");
  }

  if (SAMPLE) await generateSample(account.id, device.id);

  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
