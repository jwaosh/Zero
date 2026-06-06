import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const eventTypeEnum = pgEnum("event_type", ["impulse", "action"]);
export const eventSourceEnum = pgEnum("event_source", ["button", "manual"]);

export const accounts = pgTable("accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  passwordHash: text("password_hash").notNull(),
  // IANA timezone used for "time of day" analytics; storage is always UTC.
  tz: text("tz").notNull().default("UTC"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const devices = pgTable("devices", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: uuid("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  // sha256 of the bearer token; the raw token is shown to the user only once.
  tokenHash: text("token_hash").notNull().unique(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    deviceId: uuid("device_id").references(() => devices.id, {
      onDelete: "set null",
    }),
    type: eventTypeEnum("type").notNull(),
    // Server receipt time, UTC, authoritative.
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    // Optional device-reported time.
    clientTs: timestamp("client_ts", { withTimezone: true }),
    source: eventSourceEnum("source").notNull().default("button"),
  },
  (t) => ({
    accountCreatedIdx: index("events_account_created_idx").on(
      t.accountId,
      t.createdAt,
    ),
  }),
);

export type Account = typeof accounts.$inferSelect;
export type Device = typeof devices.$inferSelect;
export type EventRow = typeof events.$inferSelect;
