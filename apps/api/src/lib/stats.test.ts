import { describe, expect, it } from "vitest";
import type { EventRow } from "../db/schema";
import { buildDaily, buildHourly, buildSummary } from "./stats";

const WINDOW = 5 * 60_000;

function row(type: "impulse" | "action", iso: string): EventRow {
  return {
    id: "x",
    accountId: "a",
    deviceId: null,
    type,
    createdAt: new Date(iso),
    clientTs: null,
    source: "button",
  };
}

describe("buildHourly", () => {
  it("buckets by the account timezone, not UTC", () => {
    // 05:30 UTC is 00:30 in New York (EST, UTC-5) in January.
    const rows = [row("impulse", "2024-01-01T05:30:00Z")];
    const ny = buildHourly(rows, "America/New_York");
    expect(ny[0].impulses).toBe(1);
    expect(ny[5].impulses).toBe(0);

    const utc = buildHourly(rows, "UTC");
    expect(utc[5].impulses).toBe(1);
    expect(utc[0].impulses).toBe(0);
  });

  it("always returns 24 hour buckets", () => {
    expect(buildHourly([], "UTC")).toHaveLength(24);
  });
});

describe("buildSummary", () => {
  it("matches the correlation rules", () => {
    const rows = [
      row("impulse", "2024-01-01T10:00:00Z"),
      row("action", "2024-01-01T10:02:00Z"), // follow-through
      row("action", "2024-01-01T15:00:00Z"), // immediate
    ];
    const s = buildSummary(rows, WINDOW);
    expect(s.followThroughs).toBe(1);
    expect(s.immediateActions).toBe(1);
    expect(s.totalActions).toBe(2);
    expect(s.totalImpulses).toBe(2);
    expect(s.followThroughRate).toBe(1);
  });
});

describe("buildDaily", () => {
  it("groups by local date and sorts ascending", () => {
    const rows = [
      row("impulse", "2024-01-02T12:00:00Z"),
      row("impulse", "2024-01-01T12:00:00Z"),
    ];
    const daily = buildDaily(rows, WINDOW, "UTC");
    expect(daily.map((d) => d.date)).toEqual(["2024-01-01", "2024-01-02"]);
    expect(daily[0].impulses).toBe(1);
  });

  it("computes a per-day follow-through rate", () => {
    const rows = [
      row("impulse", "2024-01-01T10:00:00Z"),
      row("action", "2024-01-01T10:01:00Z"), // follow-through
      row("impulse", "2024-01-01T20:00:00Z"), // resisted
    ];
    const [day] = buildDaily(rows, WINDOW, "UTC");
    expect(day.actions).toBe(1);
    expect(day.resisted).toBe(1);
    expect(day.followThroughRate).toBeCloseTo(0.5);
  });
});
